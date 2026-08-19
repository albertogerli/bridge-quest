# Feedback degli insegnanti — ricognizione e piano

Stato: **ricognizione**, nessuna riga di codice scritta. 19/08/2026.

Il documento serve a decidere cosa fare e in che ordine. Dove il codice attuale
rende un intervento più caro del previsto, sta scritto; dove esiste già metà del
lavoro, pure — ed è il caso di tre interventi su nove.

---

## 1. Com'è fatto il portale

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript strict, quasi tutto
reso dal client. Dati su Supabase (Postgres), con RLS su ogni tabella. Nessun
ORM: si parla al database con il client Supabase, e la logica che non può stare
sul client sta in funzioni SQL `SECURITY DEFINER`.

**Dove sta cosa**

| | |
|---|---|
| rotte e pagine | `src/app/**` (una cartella per rotta) |
| componenti | `src/components/**`; quelli di gioco in `components/bridge` |
| motori puri e accesso dati | `src/lib/**` (scoring, engine, catalog, …) |
| stato globale | `src/store/**` (Zustand) |
| schema del database | `scripts/sql/**`, eseguiti a mano; baseline in `000-schema-baseline.sql` |

**Autenticazione e ruoli.** Supabase Auth; la sessione è rinfrescata dal proxy
(`src/proxy.ts`), che protegge `/admin`. Il ruolo sta in `profiles.role` e vale
`user | instructor | admin`. **Non esiste un routing per ruolo**: dopo il login
tutti finiscono sulla stessa home (`src/app/home-client.tsx`), che decide solo
fra landing e dashboard.

---

## 2. Il modello dati, oggi

```
profiles (1.109)      id, role, display_name, asd_code, profile_type, lingua…
classes (18)          id, instructor_id, asd_code, name, description,
                      invite_code, invite_active, created_at
class_members (52)    class_id, student_id, status, joined_at
assignments (14)      id, class_id, title, instructor_note, smazzata_ids[],
                      due_date, mode, unlock_mode, live_active_index, custom_hands
class_messages (7)    id, class_id, user_id, body, created_at
live_tables (2)       id, class_id, instructor_id, hands, titolo, contract,
                      declarer, revealed[], seat_of, show_contract, played, closed_at
instructor_requests   id, user_id, status, message, asd_code, reviewed_*
```

Le **smazzate** (272) stanno in una tabella a parte, legate a `lesson_id`: sono
il catalogo didattico, condiviso da tutti. Un compito le referenzia per id
(`smazzata_ids`), e può contenere mani importate da PBN in `custom_hands`.

**Cosa manca, ed è la radice di metà degli interventi**

- `class_members.status` esiste ma ha **un solo valore in produzione: `active`**.
  Non c'è «in attesa», non c'è approvazione.
- `classes` non ha **stato** (bozza/aperta/chiusa/archiviata): c'è solo il
  booleano `invite_active`, e nessuna scadenza sul codice.
- `assignments.unlock_mode` esiste ma vale sempre `free`; `mode` vale sempre
  `homework`. Sono due campi già predisposti e mai usati: **ci si può appoggiare**
  senza migrazione.
- Non esiste il concetto di **gruppo di esercizi** né di **set predefinito per
  lezione**: il legame esercizio→lezione c'è (`smazzate.lesson_id`), ma non è mai
  stato usato per assegnare in blocco.
- Non esiste **tipo** di classe: la Lezione Zero non è modellabile oggi.

---

## 3. Come funzionano oggi i quattro flussi che toccheremo

**Creare una classe** — l'insegnante compila nome e descrizione; il codice
d'invito viene generato alla creazione e resta valido per sempre
(`invite_active = true` su tutte e 18 le classi).

**Iscriversi** — `join_class_by_code(p_code)`, funzione `SECURITY DEFINER`:
cerca la classe con quel codice attivo e inserisce `class_members` con
`status = 'active'`. **Non c'è approvazione, non c'è scadenza, e chiunque abbia
il codice entra.** È esattamente la lamentela degli insegnanti, ed è una funzione
sola da cambiare — il che è una buona notizia.

**Assegnare esercizi** — `/istruttori/[classId]/nuovo-compito`: si scelgono le
smazzate da un elenco con **filtro per lezione già presente**, filtro per
difficoltà, ricerca testuale e import PBN. Poi titolo, nota, scadenza. È un form
completo e ben fatto: il problema non è che manchi qualcosa, è che per il gesto
più frequente — «assegna gli esercizi della lezione di stasera» — si passa
comunque da un modulo con cinque campi.

**Vedere le soluzioni** — in
`/classi/[classId]/compito/[assignmentId]` il commento della smazzata è dietro un
pulsante «Mostra suggerimento», **ma arriva al client insieme alla mano**. Chi
apre gli strumenti per sviluppatori lo legge senza aver giocato. La visibilità
oggi è una tendina, non un controllo.

---

## 4. I nove interventi

Complessità: **S** = meno di mezza giornata, **M** = una giornata, **L** = più
giorni o decisioni di prodotto aperte.

### 1 · Assegnazione in un click — **M**, nessuna migrazione

*File*: `src/app/istruttori/[classId]/page.tsx` (vista classe),
`nuovo-compito/page.tsx` (resta), `src/lib/smazzata-meta.ts`, store smazzate.

Metà del lavoro c'è: le smazzate sono già raggruppate per lezione e il filtro
esiste. Serve la vista «lezioni del Corso Fiori» dentro la classe, con lo stato
per lezione, e una funzione SQL che crei le assegnazioni **saltando chi ce l'ha
già** — l'idempotenza va nel database, non nel client, o due click ravvicinati
creano doppioni.

*Rischi*: lo stato «7/12 completati» richiede di contare i risultati per allievo:
`get_class_results` esiste già, va verificato che regga il raggruppamento.

### 2 · Controllo delle iscrizioni — **M**, migrazione piccola

*File*: `join_class_by_code` (SQL), `src/app/classi/page.tsx` (iscrizione),
nuova pagina «Gestione Classe → Iscrizioni», RLS di `class_members` e
`assignments`.

`status` esiste già: basta ammettere `pending` e cambiare la funzione. Servono
`classes.approvazione_automatica` (default **vero**, per non cambiare
comportamento a chi non l'ha chiesto), `invite_expires_at` e la revoca.

*Il punto delicato non è l'interfaccia, sono le RLS*: oggi le policy che danno
accesso ai contenuti della classe controllano l'appartenenza, non lo stato. Se si
introduce `pending` senza toccarle, **un allievo non approvato vede tutto lo
stesso**. Va cambiato lì, e va provato con un test che chieda i dati come utente
in attesa.

### 3 · Ciclo di vita della classe — **S/M**, migrazione piccola

*File*: `classes` (colonna `stato`), vista classi, archivio.

Oggi c'è solo `invite_active`. Cinque stati espliciti sono più chiari, e la
transizione aperta↔chiusa è reversibile per costruzione. `/istruttori/archivio`
esiste già come pagina.

*Rischio basso*, purché l'archiviazione resti una transizione di stato e non
cancelli nulla. Il test da scrivere è: dopo ogni transizione, iscrizioni e
assegnazioni sono ancora tutte lì.

### 4 · Soluzioni solo dopo il completamento — **M**, e va fatto lato server

*File*: la pagina del compito, `unlock_mode` (già in tabella), una funzione SQL
che restituisca la smazzata **senza commento** finché non risulta completata.

È l'intervento con il divario più grande fra «sembra fatto» e «è fatto»: oggi
nascondere il commento è una scelta di interfaccia. Perché sia vero, il commento
non deve proprio arrivare — il che significa passare da una lettura diretta della
tabella a una funzione che decide cosa mandare.

`unlock_mode` è già lì e non è mai stato usato: i tre valori richiesti (senza
commento / con commento / dopo la scadenza) ci stanno senza migrazione.

*Rischio*: la stessa pagina serve anche l'insegnante, che deve continuare a
vedere tutto. Il controllo va fatto sul ruolo **dentro** la funzione.

### 5 · Lezione Zero — **L**, migrazione da concordare

*File*: `classes` (colonna `tipo`), iscrizione pubblica senza account, generazione
QR e locandina PDF, collegamento corso↔lezione zero.

Modellarla come tipo di classe è la scelta giusta e l'hai già indicata: riusa
codici, staff e anagrafica. Le parti che pesano sono altre tre:

- **iscrizione senza account**: oggi `join_class_by_code` richiede
  `auth.uid()`. Serve un percorso che accetti nome, cognome, telefono, email e
  crei un contatto *senza* utente — e quindi una tabella di partecipanti separata
  da `profiles`, con il travaso al momento dell'iscrizione al corso;
- **QR e locandina PDF**: nessuna libreria QR è installata (verificato). Il PDF
  può essere una pagina con `@media print`, come già fa `/istruttori/dispensa`;
- **staff con ruoli**: oggi la classe ha un solo `instructor_id`. Serve una
  tabella di collaboratori, ed è la parte che tocca più RLS.

*Da decidere prima di scrivere*: i dati di chi si iscrive alla Lezione Zero sono
dati personali di persone che **non hanno un account e non hanno accettato
nulla**. Vanno definiti base giuridica, informativa al momento della raccolta e
cancellazione. Non è un dettaglio rimandabile: è il primo punto da chiudere.

### 6 · Home per ruolo — **M**, nessuna migrazione

*File*: `src/app/home-client.tsx`, `src/components/layout-shell.tsx`, nuove home.

Oggi il routing per ruolo **non esiste**: `role` è in `profiles` ma nessuno lo
guarda per decidere cosa mostrare. Va aggiunto il bivio dopo il login e vanno
scritte due home nuove.

*Rischio*: la home attuale è un file da ~1.900 righe con dentro anche la landing.
Toccarla è la cosa più facile da rompere di tutto l'elenco. Conviene aggiungere
le due home come componenti separati e lasciare quella attuale come terzo ramo,
invece di rifattorizzarla.

### 7 · Notifiche e WhatsApp — **S/M**, riusa quasi tutto

*File*: `src/lib/email/templates.ts` (due modelli nuovi), `send.ts`,
`api/cron/engagement`, chat di classe.

L'impianto c'è tutto: sette modelli, preferenze, disiscrizione a un clic,
`email_events` con indice che impedisce i doppioni, e un cron che gira. Aggiungere
«hai un compito» e «la scadenza si avvicina» è lavoro noto.

I **link `wa.me`** sono la parte a valore più alto per il minor costo di tutto
l'elenco: nessun servizio esterno, nessun permesso, un link precompilato.

*Nota*: il deep link deve portare all'esercizio **dopo** il login. Il proxy già
conserva la destinazione (`?redirect=`), quindi funziona — va solo verificato che
regga anche con il prefisso di lingua, cosa che è stata sistemata oggi.

### 8 · Gruppi e difficoltà — **S**, in gran parte già fatto

Il filtro per lezione c'è già nella vista di assegnazione; la difficoltà è
**calcolata** da `smazzataDifficulty()` e non è una colonna. Resta da: nasconderla
nella vista dell'allievo, e permettere un nome di gruppo libero per i set creati
dall'insegnante (una colonna su `assignments`, o meglio sul futuro «set»).

### 9 · Interfaccia e tavoli — **M**, tre cose scorrelate

- **Diagrammi troppo larghi**: la spaziatura giusta è quella della lavagna. È un
  lavoro di CSS con verifica a 1366×768 e su telefono. Rischio basso.
- **Tasto indietro**: non esiste alcun componente breadcrumb riutilizzabile
  (verificato: solo tre pagine hanno una loro navigazione). Va creato una volta e
  messo in tutte le sotto-pagine di classe.
- **Tavoli di studio**: qui c'è del lavoro vero. `live_tables` ha `contract`,
  `declarer`, `seat_of` e `played`, ma nella pagina dell'insegnante **non ho
  trovato l'interfaccia che imposta il contratto** — il campo esiste nel modello e
  sembra non avere un modo per essere valorizzato. Va verificato in esecuzione
  prima di stimare. L'assegnazione dei posti e l'elenco dei tavoli aperti sono
  invece funzionalità nuove, ma piccole.

---

## 5. Ordine consigliato, e perché

L'ordine che hai proposto regge. Due osservazioni:

1. **Il 4 (soluzioni) dovrebbe venire prima del 5 e del 6.** È l'unico intervento
   dove oggi c'è un problema *reale* e non solo un attrito: il commento è già nel
   browser dell'allievo. Costa poco e chiude un buco.
2. **Il 2 va fatto guardando le RLS, non le schermate.** Se si aggiunge lo stato
   «in attesa» e si lasciano le policy come sono, si ottiene un'interfaccia che
   promette un controllo che non c'è — peggio del non averlo.

## 6. Cosa serve da te prima di partire

- **Lezione Zero**: la questione dei dati personali di chi non ha un account
  (§4.5). È l'unica cosa che blocca davvero.
- **Approvazione iscrizioni**: confermo il default *automatico*? Cambiarlo
  significa che le 18 classi esistenti smettono di far entrare gente domattina.
- **Tavoli di studio**: fammi vedere il flusso che usi tu, o dimmi se il contratto
  si imposta da qualche parte che non ho trovato. Sul resto posso decidere da
  solo, su questo no.
