# Gruppi di smazzate con nome libero — schema per la riunione

Progettazione, non implementazione. Serve a fare a Giuseppe Trevissoi le domande
giuste: la sua risposta cambia il modello, e costruire prima vorrebbe dire
rifare dopo.

---

## Il dato da cui partire

Prima di aggiungere un contenitore, conviene sapere che **i quattro che
esistono già sono a zero**.

| | righe in produzione |
|---|---|
| modelli di generazione **fatti da insegnanti** | **0** (13 sono i nostri, `ufficiale`) |
| voci nella libreria condivisa | **0** |
| posizioni salvate dal tavolo di studio | **0** |
| esercizi di posizione | **0** |
| gruppi già usabili (`esercizi_posizione.gruppo`) | **0** |

Nello stesso periodo la piattaforma **è usata**: 20 insegnanti, 18 classi, 52
iscrizioni, 14 compiti, 1529 mani giocate. Quindi non è che nessuno entri: è che
nessuno personalizza.

Le spiegazioni possibili sono tre, e sono molto diverse fra loro:

1. **non serve** — l'insegnante assegna il set federale e gli basta;
2. **non si trova** — gli strumenti stanno in un elenco a parte, fuori dalla
   classe (è la riorganizzazione che Trevissoi propone per la home);
3. **non è ancora il momento** — i corsi partono a ottobre, e d'estate non si
   prepara niente.

**È la prima domanda da fargli**, prima di ogni domanda sul modello. Se la
risposta è la 2, il lavoro più utile non è un contenitore nuovo ma spostare
quelli che ci sono dentro la classe. Se è la 1, il gruppo va disegnato per un
uso più raro di quanto sembri.

---

## 1 · Che cosa c'è già, e quanto se ne riusa

### `modelli_mani` — il generatore con vincoli

`id, nome, descrizione, vincoli, autore_id, ufficiale, condiviso, lesson_id, usi`

**È il precedente più vicino al gruppo che serve.** Ha già tutto lo schema di
proprietà e condivisione che servirebbe:

- `autore_id` — di chi è;
- `ufficiale` — i nostri, che nessuno può modificare o cancellare;
- `condiviso` — visibile agli altri insegnanti, deciso dall'autore;
- `lesson_id` — legame facoltativo a una lezione;
- `usi` — contatore, per sapere cosa serve davvero.

Le sue RLS sono già quelle giuste: si legge se `ufficiale OR condiviso OR
autore_id = auth.uid()`, si scrive solo il proprio e solo se non ufficiale.
**Questo modello si copia quasi alla lettera.**

### `libreria` — il materiale condiviso, con moderazione

`autore_id, tipo, titolo, descrizione, livello, argomento, lesson_id, contenuto (jsonb), stato, nota_curatore, usi`

Più ambiziosa: c'è un flusso di approvazione (`stato`, `nota_curatore`) e un
ruolo `curatore`.

> **Difetto trovato durante la ricognizione.** Il ruolo `curatore` **non può
> esistere**: `is_curatore()` cerca `role in ('curatore','admin')`, ma il
> vincolo su `profiles.role` ammette solo `user | instructor | admin`. Quindi
> oggi l'unico che può approvare è l'unico amministratore. Se la condivisione
> fra insegnanti deve funzionare davvero, questa è da sistemare: o si aggiunge
> il ruolo, o si toglie il riferimento e si dice che approva l'amministrazione.

### `esercizi_posizione` — e la colonna `gruppo`

`autore_id, titolo, consegna, domanda, hands, dealer, vulnerability, bids, played, posizione, contract, declarer, risposte, soluzione, **gruppo**, class_id`

**C'è già una colonna `gruppo`**, di testo libero. È un mezzo precedente e va
guardato con attenzione: raggruppare per stringa è la scorciatoia che sembra
gratis e poi non lo è — rinominare un gruppo vuol dire aggiornare N righe, due
gruppi scritti con maiuscole diverse diventano due gruppi, e non si può
condividere un gruppo perché il gruppo non è una cosa, è un'etichetta ripetuta.

### `saved_hands` — l'archivio del tavolo di studio

`owner_id, titolo, nota, hands, contract, declarer, played`

Semplice e privato: `owner_id = auth.uid()` per tutto. Nessuna condivisione.

### Come il compito tiene insieme cose diverse — e perché conta

`assignments` mette insieme **tre famiglie con tre meccanismi diversi**:

| campo | cosa contiene | come |
|---|---|---|
| `smazzata_ids text[]` | mani del catalogo | riferimenti per id |
| `esercizio_ids uuid[]` | posizioni salvate | riferimenti per id |
| `custom_hands jsonb` | mani da PBN | **copia dei dati dentro il compito** |

Le prime due puntano; la terza incorpora. È la scelta giusta per il PBN — quel
file non esiste da nessun'altra parte — ma vuol dire che **il gruppo dovrà fare
la stessa cosa**, e conviene riusare esattamente questi tre campi invece di
inventare un quarto modo. Un gruppo che contiene «un elenco di riferimenti più
un blocco di mani incorporate» si assegna copiando i tre campi nel compito, e
non serve altro.

---

## 2 · Le domande, e come ciascuna risposta cambia il modello

### A. Di chi è il gruppo?

**Se è dell'insegnante** (riusabile su tutte le sue classi) → una tabella con
`autore_id`, come `modelli_mani`. È quello che suggerisce la sua richiesta di
duplicare da un corso all'altro.
**Se nasce dentro la classe** → `class_id` obbligatorio, e la duplicazione
diventa la funzione principale invece che un accessorio.

*Conseguenza pratica*: nel primo caso «i miei gruppi» è una schermata sola; nel
secondo sono sparsi fra le classi e vanno cercati.

### B. Si condivide con un collega?

**No** → basta `autore_id`, RLS in tre righe.
**Sì, a scelta dell'autore** → si aggiunge `condiviso`, esattamente come
`modelli_mani`.
**Sì, ma con approvazione** → si passa dalla `libreria`, e allora prima va
sistemato il ruolo `curatore` che oggi non esiste.

### C. Duplicare: copia o riferimento?

Lui scrive *«anche solo virtualmente e non negli archivi»*, e quella frase si
può leggere in due modi opposti.

**Copia** — dal gruppo A nasce il gruppo B, indipendente. Poi divergono: se
correggo una mano in A, in B resta com'era.
**Riferimento** — lo stesso gruppo usato in due corsi. Se lo correggo, cambia in
tutti e due.

*È la domanda che decide di più.* Un insegnante che nel corso di quest'anno
migliora il gruppo dell'anno scorso vuole la copia. Uno che tiene «il mio
gruppo di lezione 4» e lo usa ovunque vuole il riferimento. La domanda da
fargli non parla di database: **«se correggi una mano nel gruppo che stai
usando in due corsi, ti aspetti che cambi in tutti e due o solo in quello dove
l'hai corretta?»**

### D. Un gruppo può mescolare le famiglie?

**Sì** → il gruppo riusa i tre campi del compito (riferimenti + incorporati) e
si assegna copiandoli.
**No, omogeneo** → più semplice, ma un insegnante che ha preparato «lezione 4:
tre mani del catalogo, due mie e una posizione» dovrebbe fare tre gruppi. Non
è come lavora una persona.

*Raccomandazione*: misto. Costa poco perché la struttura esiste già.

### E. I gruppi liberi e i set federali

**Si aggiungono** → il set della lezione resta il pulsante principale, i gruppi
sono un'altra voce.
**Possono sostituire** → serve dire, per una classe, «per la lezione 4 uso il
mio gruppo invece del set». Più potente e più delicato: il portale non sa più
se l'allievo ha fatto «la lezione 4» nel senso federale, e il confronto fra
corsi (vedi l'altro documento) perde il denominatore comune.

*Da fargli notare*, perché tocca la sua stessa richiesta di statistiche.

### F. Nel compito: si assegna il gruppo o le mani?

**Le mani** (istantanea) — il compito prende quello che il gruppo contiene
adesso. Se poi il gruppo cambia, i compiti già assegnati restano fermi.
**Il gruppo** (collegamento) — il compito segue il gruppo. Correggere il gruppo
cambia i compiti già dati, anche quelli che qualcuno ha già fatto a metà.

*La seconda è quasi certamente sbagliata*: cambierebbe l'esercizio sotto i piedi
di chi lo sta svolgendo, e i risultati registrati si riferirebbero a mani che
non ci sono più. Ma va detta, perché «assegno il gruppo» suona più naturale.
Domanda non tecnica: **«se dopo aver assegnato il compito togli una mano dal
gruppo, l'allievo che l'ha già giocata deve perderla?»**

### G. La domanda che viene prima di tutte

**Perché i contenitori che ci sono non li usa nessuno?** Vedi l'apertura.

---

## 3 · Tre modelli, con quello che costano

### Modello 1 — Minimo: il gruppo è una lista di mani dell'insegnante

Una tabella sola, ricalcata su `modelli_mani`:

```
gruppi_smazzate(id, autore_id, nome, descrizione, lesson_id?, condiviso,
                smazzata_ids text[], esercizio_ids uuid[], custom_hands jsonb,
                usi, created_at, updated_at)
```

- **Riusa**: i tre campi del compito, le RLS di `modelli_mani`, l'interfaccia di
  scelta mani già scritta per il punto 2 del lotto precedente.
- **Nuovo**: una tabella, una schermata «I miei gruppi», un pulsante «Assegna
  questo gruppo», un «Duplica».
- **Duplicazione**: copia (una `insert ... select`).
- **Non fa**: sostituire i set federali, contenere sottogruppi, condivisione con
  approvazione.
- **Costo**: piccolo. Uno script SQL, due schermate.

### Modello 2 — Il gruppo entra nella libreria condivisa

Come il modello 1, ma il gruppo può essere pubblicato: diventa una voce di
`libreria` con `tipo = 'gruppo'`.

- **Riusa** anche il flusso di pubblicazione e il contatore `usi`.
- **Richiede prima** di sistemare il ruolo `curatore`, che oggi non può esistere.
- **Costo**: medio, e dipende da una decisione su chi approva.

### Modello 3 — Il contenitore come struttura della classe

Il gruppo diventa l'unità con cui si costruisce il corso: una classe ha una
sequenza di gruppi, che sostituiscono o affiancano le lezioni federali.

- È la lettura più ambiziosa delle «Smazzate Didattiche», e si avvicina alla sua
  proposta di home insegnante.
- **Rompe il denominatore comune** fra corsi: due classi non sono più
  confrontabili per lezione.
- **Costo**: alto, e va disegnato insieme alla home, non prima.

**Raccomandazione**: partire dal **modello 1**, che soddisfa la richiesta come
l'ha scritta lui, e da cui gli altri due si raggiungono senza buttare via
niente. Ma dirglielo, invece di presentarlo come «la» soluzione.

---

## 4 · I permessi reggono?

Il modello di `modelli_mani` è già corretto e si copia:

- lettura: `ufficiale OR condiviso OR autore_id = auth.uid()`
- scrittura e cancellazione: solo il proprio, e mai gli ufficiali
- creazione: solo `instructor` o `admin`

**Due cose da sistemare** se si va oltre il modello 1:

1. il ruolo **`curatore` non esiste** e le policy della libreria lo cercano;
2. se un gruppo può essere assegnato a una classe, l'allievo deve poter leggere
   **le mani** ma non il gruppo: oggi `esercizi_posizione` risolve la stessa
   cosa guardando dentro `assignments.esercizio_ids`, ed è il modo da imitare.

---

## La mezza pagina da portare in riunione

*Domande in italiano, senza gergo. Da leggere ad alta voce.*

**Prima di tutto.** Nel portale ci sono già quattro modi di mettere da parte
materiale suo — il generatore di mani, l'archivio delle posizioni, la libreria
fra insegnanti, l'importazione dei file. In tre mesi non li ha usati nessuno,
mentre le classi e i compiti sì. Secondo lei è perché non servono, perché non si
trovano, o perché i corsi non sono ancora partiti?

**Il gruppo di chi è.** Quando crea un gruppo di smazzate, è suo e se lo porta
in tutti i corsi, oppure nasce dentro un corso e da lì lo copia?

**Se lo modifica.** Se usa lo stesso gruppo in due corsi e corregge una mano,
si aspetta che cambi in tutti e due, o solo in quello dove l'ha corretta?

**Se lo cambia dopo averlo assegnato.** Ha già dato il compito agli allievi e
poi toglie una mano dal gruppo: chi l'ha già giocata deve perderla, o il compito
resta com'era quando l'ha assegnato?

**Che cosa ci mette dentro.** Un gruppo può tenere insieme mani del catalogo,
mani che ha generato lei, posizioni salvate dal tavolo di studio e mani prese da
un suo file — tutte insieme? O preferisce gruppi separati per tipo?

**Con i colleghi.** Un suo gruppo resta suo, o vuole poterlo dare a un altro
insegnante? E se glielo dà, lui può modificarlo o solo usarlo?

**Con le lezioni del Corso Fiori.** Il suo gruppo per la lezione 4 si aggiunge
al set della Federazione, o lo sostituisce? Se lo sostituisce, non sapremo più
dire se una classe ha fatto «la lezione 4» come le altre — e questo tocca anche
le statistiche che le interessano.
