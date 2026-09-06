# Lezione Zero — il disegno, prima di toccare lo schema

Da approvare. Nessuna migrazione scritta finché non è chiaro il modello.

---

## Prima cosa: metà è già in piedi, e meglio di come l'avrei fatta

La ricognizione ha trovato tre pezzi che coprono già i casi più difficili.

**`/api/aula/entra` crea un utente VERO**, non una sessione finta. Il commento
spiega perché, e il ragionamento è quello giusto: un gettone più una manciata di
funzioni `SECURITY DEFINER` si paga dopo, perché ogni cosa che l'ospite deve
poter fare diventa una funzione a sé con i controlli riscritti a mano — «e i
controlli riscritti a mano sono esattamente dove si aprono i buchi». Così invece
tutte le RLS che già esistono valgono per lui.

**La conseguenza vale per tutto questo lotto**: la conversione in account vero è
«stesso utente, gli si aggiunge un'email», quindi *«eredita tutta la sua
attività» non è una migrazione da scrivere, è una conseguenza.* La persona che
esiste ma di cui sappiamo poco **c'è già**: è un utente con un nome e basta.

**I tagliandi** sono già l'iscrizione in aula sul momento: un cartoncino per
posto, con nome, tavolo e un QR che porta dentro, e il nome già scritto nel
collegamento.

**`/evento/<codice>`** è la porta di chi arriva dal cartello, fatta ieri.

Quindi non serve inventare un'anagrafica parallela. Serve **una cosa sola nuova**
— l'adesione di chi dice «vengo» prima della serata — più i campi dei gradi
successivi.

---

## Il modello: tre gradi, nessuna sequenza

Trevissoi è stato esplicito su tutti e tre i punti, e tutti e tre dicono la
stessa cosa: **il modello dev'essere permissivo, non sequenziale.**

> «Non è detto che il percorso di inserimento dati parta sempre prima della
> Lezione Zero.» · «Il codice fiscale non serve per la Lezione Zero, ma per il
> tesseramento sì.» · «Può avvenire anche dopo la seconda o la terza lezione.»

| grado | quando | cosa si chiede | dove vive |
|---|---|---|---|
| **1 · Adesione** | prima della serata, o in aula, o mai | nome, un contatto, e ciò che serve a comporre i tavoli e scegliere l'orario | `adesioni` (nuova) |
| **2 · Iscrizione al corso** | dalla serata alle prime lezioni | i dati mancanti | `class_members` + `profiles` |
| **3 · Tesseramento** | quando l'ASD lo fa | codice fiscale, residenza, data di nascita | `dati_tesseramento` (nuova) |

**Nessun grado è obbligatorio per il successivo, e nessuno li ordina.** Chi
arriva in aula senza aver aderito salta il primo. Chi aderisce e non viene resta
al primo per sempre. Chi si iscrive al corso senza tesserarsi si ferma al
secondo. Il modello registra **cosa sappiamo**, non a che punto di un percorso
si trova qualcuno — e questa è la differenza che rende il modello permissivo
invece che a stadi.

### `adesioni`, la sola tabella davvero nuova

```
adesioni(id, class_id, nome, contatto, note_organizzative,
         user_id?, creata_il, fonte)
```

- **`user_id` nullo** finché quella persona non ha un account: è il caso normale
  di chi inquadra un cartello alle otto di sera.
- **`fonte`** — locandina, aula, passaparola — perché a novembre la domanda
  «da dove arrivano» avrà una risposta invece di un'impressione.
- **`note_organizzative`** è il campo che serve a Trevissoi per comporre i
  tavoli: orario preferito, se viene con qualcuno, se ha già giocato. Testo
  libero, perché quello che gli serve sapere cambia da corso a corso.
- **Nessun dato sensibile qui.** Il codice fiscale non c'è, e non perché ce lo
  siamo dimenticati: al grado 1 non serve, e un campo che esiste si riempie.

### `dati_tesseramento`, separata e non su `profiles`

Codice fiscale, residenza e data di nascita **non vanno su `profiles`**, e la
ragione l'abbiamo già pagata una volta: `profiles` la legge mezza applicazione,
e i privilegi di colonna su quella tabella ci sono già costati un salvataggio
rotto in produzione (vedi `reference_privilegi_colonna_profiles`). Una tabella a
parte ha una regola sola e la si legge in dieci secondi.

---

## Il titolare e chi è autorizzato, espliciti nei dati

La risposta legale non c'è ancora — se ne occupano gli organi federali con
l'avvocato — e il disegno deve poterla accogliere senza essere rifatto.

Quello che propongo è **non decidere la regola, ma renderla scrivibile**:

```
dati_tesseramento(persona_id, titolare, campi..., raccolti_il, consenso_il, revocati_il?)
autorizzazioni(persona_id, soggetto, ambito, concessa_il, revocata_il?)
```

- **`titolare`** dice di chi è il dato — Federazione, ASD, o entrambi. Oggi ci
  scriveremo un valore solo; il giorno in cui l'avvocato dice altro si cambia un
  valore, non uno schema.
- **`autorizzazioni`** dice chi può vederlo: `federazione`, `asd:<codice>`,
  `insegnante:<id>`. Le RLS leggono questa tabella invece di avere la regola
  scritta dentro — che è il punto: **oggi la regola è implicita nel codice, e
  cambiarla vuol dire trovare tutti i punti dove è scritta.**
- **`revocata_il`** perché la revoca è un diritto, e va registrata come evento e
  non cancellando la riga: cancellandola non si può più dimostrare che il
  consenso c'era.

**Questa parte non la implementerei adesso.** La disegno perché la struttura
delle prime due tabelle non la impedisca, e perché il giorno che arriva la
risposta legale sia una tabella da riempire e non un modello da rifare.

---

## Cosa costruirei per primo, se dai il via

1. **«Vengo» da `/evento/<codice>` senza account.** Nome, contatto, invio. È il
   pezzo che oggi manca: quel pulsante porta a `/classi?codice=`, che chiede di
   registrarsi. *Mezza giornata.*
2. **L'elenco delle adesioni per l'insegnante**, con le note organizzative: è
   quello che gli serve la sera prima per comporre i tavoli. *Mezza giornata.*
3. **Il collegamento adesione → account**, quando la persona arriva in aula col
   tagliando o si registra dopo. Il grosso c'è già; qui si tratta di riconoscere
   che sono la stessa persona, e la risposta onesta è che **lo decide
   l'insegnante con un tocco**, non un algoritmo sui nomi. *Mezza giornata.*
4. Il tesseramento **dopo la risposta legale**.

---

## Le tre cose su cui voglio una decisione

**Il contatto è obbligatorio?** Senza, un'adesione è un nome su una lista e
l'ASD non può avvisare se la serata si sposta. Con, qualcuno non aderisce.
Proporrei obbligatorio, con telefono O email indifferentemente — al Sud il
telefono è più probabile dell'email.

**L'adesione è pubblica?** Chi ha il codice può aderire, e questo vuol dire che
qualcuno può riempire la lista di nomi finti. Non è un problema di sicurezza —
non si accede a niente — ma è un problema per l'insegnante che compone i tavoli.
Un limite per indirizzo IP è aggirabile e fastidioso; la contromisura vera è che
l'insegnante possa cancellare una riga in un tocco. Proporrei quella.

**Chi cancella un'adesione, e quando sparisce?** Se una persona aderisce e non
viene mai, quella riga resta lì per sempre. Proporrei che si possa archiviare
alla chiusura della classe, senza cancellarla: serve al conteggio «quanti hanno
aderito e quanti sono venuti», che è uno dei numeri che la Federazione vuole.
