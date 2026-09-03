# Storico classi, report e statistiche — schema per la riunione

Progettazione, non implementazione. La domanda a cui deve rispondere questo
documento non è «che grafici facciamo», ma **quali numeri hanno senso per un
insegnante di bridge che sta decidendo se questo strumento gli serve**.

Trevissoi la motiva così: *«credo sia importantissima, in quanto crea la
curiosità e l'interesse per favorire un avvicinamento allo strumento da parte
degli insegnanti»*. Cioè: **è una funzione di adozione, non di misurazione.**
Cambia il disegno — un cruscotto che fa sentire sorvegliati ottiene l'opposto.

---

## 1 · Inventario: che cosa il portale registra davvero

Con, per ciascuno, se il dato regge. Un grafico costruito su un dato bucato è
peggio del grafico che manca, perché nessuno se ne accorge.

| dato | dove | affidabile? |
|---|---|---|
| **Mani giocate ed esito** | `risultati_mano` — 1529 righe | **Sì.** Contratto, dichiarante, punteggio, stelle, data. È il dato migliore che abbiamo. |
| **Compiti assegnati** | `assignments` — 14 | Sì, ma pochi: il campione è piccolo. |
| **Iscrizioni** | `class_members` — 52, con `joined_at` e `status` | **Parziale.** C'è quando uno entra, non quando esce: `status` cambia senza data. Un abbandono è invisibile nel tempo. |
| **Classi** | `classes` — 18, con `stato` | **Parziale.** Nessuna data di inizio e fine corso, e `stato` non ha storia. Zero classi archiviate: lo «storico» oggi è vuoto per costruzione. |
| **Presenze in aula** | `elenco_allievi.presente` | **NO.** È un booleano «presente adesso», sovrascritto ogni lezione. **Non esiste storico delle presenze.** |
| **Sessioni d'aula** | `sessioni_aula` — apertura e chiusura | Sì, ma dice che l'aula è stata aperta, non chi c'era. |
| **Tempo sulle mani** | misurato nel compito | Sì, ed è più informativo di quanto sembri: cinque secondi e quattro minuti non sono la stessa cosa. |
| **Errori ricorrenti** | riconosciuti sulle mani del compito | Sì, ed è già la base del «tema della classe». |
| **Uso del portale** | `profiles.last_login`, `total_minutes`, `hands_played` | Sì — **ed è il dato da NON mettere in vetrina**, vedi sotto. |
| **Circolo di appartenenza** | `profiles.asd_code` | Presente ma non verificato: lo dichiara l'utente. |
| **Tesseramenti, tornei giocati in ASD** | — | **Non esistono nel portale.** Solo estrazione federale. |

### Il buco che conta più di tutti

Il metodo prevede **una telefonata dopo due assenze consecutive**. Oggi quella
vista **non è costruibile**: la presenza è un interruttore che si sovrascrive,
non un registro con le date. Nessun grafico lo può recuperare a posteriori.

**È la cosa da decidere subito**, perché ogni lezione che passa senza registrarla
è un dato perso per sempre. Basta poco: una riga per (allievo, data, presente).

---

## 2 · Tre viste, tre destinatari

### 2.1 L'insegnante sulla sua classe — deve dire chi chiamare

Non una curva da ammirare: **un elenco di nomi con un motivo accanto.**

- **Da richiamare** — chi è mancato alle ultime due lezioni *(oggi non
  calcolabile: vedi il buco sopra)*, e chi non apre un compito da due settimane.
- **In difficoltà** — chi consegna ma sbaglia sistematicamente lo stesso tipo di
  mano. Il dato c'è già.
- **Sta sparendo** — chi ha smesso di aprire il portale dopo aver cominciato. Il
  segnale precede l'abbandono di settimane.
- **Il tema della classe** — l'errore più frequente di tutti insieme: è quello
  che decide la prossima lezione, ed è già calcolato.

Nessuna classifica nominativa fra allievi in questa vista: c'è già
`classes.risultati_nominativi` a dire che la questione è stata posta, e in una
classe di principianti over 60 una graduatoria pubblica fa smettere gli ultimi.

### 2.2 L'insegnante sul suo storico — questa è quella che crea la curiosità

Trevissoi dice che serve a far avvicinare gli insegnanti. Allora deve
rispondere alla domanda che un insegnante si fa davvero: **«dei miei allievi,
quanti sono rimasti al bridge?»**

- corsi tenuti, con periodo e numero di partenti;
- **quanti sono arrivati in fondo** al corso;
- **quanti giocano ancora dopo sei e dodici mesi** *(richiede l'estrazione
  federale)*;
- il confronto fra i propri corsi nel tempo — non con quelli degli altri.

Il confronto con sé stessi è la cosa che fa tornare ad aprire la pagina. Il
confronto con gli altri è la cosa che la fa chiudere.

### 2.3 La Federazione — e qui c'è una questione da porre, non da decidere

Gli indicatori che contano sono due, e sono entrambi **fuori dal portale**:

- **tempo dal primo contatto al primo torneo in ASD**;
- **quanti allievi giocano ancora dopo dodici mesi**.

**Il rischio da tenere presente nel disegno**: se il portale misura e premia
l'uso del portale — accessi, esercizi svolti, punteggi — diventa un concorrente
del circolo. Deve misurare **il percorso che porta l'allievo dentro il circolo**,
e i numeri di utilizzo vanno tenuti come diagnostica interna, non come vetrina.

E c'è la questione politica, che va posta a lui e non risolta da noi: **la stessa
cifra che a noi sembra misurazione, a un insegnante può sembrare una pagella sul
proprio tasso di abbandono.** Se il corpo insegnante percepisce così il cruscotto
federale, lo aggira — e allora non misuriamo più niente. La domanda è in fondo.

---

## 3 · Quello che i dati del portale non possono dire

Da sapere adesso, non a novembre davanti a una sala:

- **se l'allievo ha giocato in circolo** — mai, senza l'estrazione federale;
- **se si è tesserato** — idem;
- **se è venuto a lezione** — no, e non è recuperabile a posteriori;
- **quando ha abbandonato** — no: si sa che è uscito, non quando;
- **quanto è durato un corso** — no: manca la data di inizio e fine;
- **se un allievo di un insegnante è lo stesso di un altro corso** — solo se ha
  usato lo stesso account;
- **quanti hanno seguito senza registrarsi** — l'ospite d'aula è un account vero
  ma temporaneo, e chi non converte sparisce.

Sul lato federale, il disegno deve assumere che i dati arrivino come **estrazione
periodica**, non come interrogazione in tempo reale: quindi una tabella di
riconciliazione con una data di aggiornamento visibile, e grafici che dicono a
quando sono aggiornati. Un numero senza data di validità è un numero di cui non
ci si fida.

---

## 4 · Percorso proposto

**Subito, perché è un dato che non si recupera** — registrare le presenze per
data. Una riga per allievo, lezione e data. Senza, fra dodici mesi la domanda
«quanti hanno abbandonato dopo la terza lezione» resta senza risposta per
sempre. Vale anche per la data di uscita da una classe e per l'inizio e fine del
corso: sono tre campi, e vanno messi prima che parta la stagione.

**Per novembre, con quello che c'è** — la vista dell'insegnante sulla classe,
limitata a ciò che è affidabile: chi non consegna, chi sbaglia sempre lo stesso
tipo di mano, il tema della classe. Onesta e utile subito, senza promettere
percentuali che non abbiamo.

**Dopo la prima estrazione federale** — la vista storica con la ritenzione a sei
e dodici mesi, che è quella che interessa davvero, e il confronto fra corsi.

**Da non fare** — la classifica fra insegnanti. Anche se i dati ci fossero.

---

## La mezza pagina da portare in riunione

*Da leggere ad alta voce. Nessun termine tecnico.*

**Una cosa che oggi non possiamo fare, e volevo dirglielo subito.** Il portale
sa se un allievo ha aperto e svolto i compiti, ma **non sa se è venuto a
lezione**: la presenza si segna per la lezione in corso e poi si sovrascrive. Se
vogliamo la vista «chi non si vede da due lezioni», dobbiamo cominciare a
registrarla adesso — è un dato che non si recupera dopo. Le va bene se lo
mettiamo prima che partano i corsi di ottobre?

**Che cosa vorrebbe vedere aprendo la sua classe?** Io proporrei una cosa sola:
l'elenco di chi richiamare, con accanto il perché. Non un grafico: dei nomi.

**E guardando indietro sui suoi corsi passati?** La domanda a cui secondo me
vorrebbe rispondere è «di quelli che ho formato, quanti giocano ancora». Le
torna, o ce n'è un'altra che le sta più a cuore?

**Una domanda delicata, e gliela faccio per non sbagliare da soli.** Alcuni di
questi numeri interessano anche alla Federazione — per esempio quanti allievi,
dopo un corso, arrivano a giocare in circolo. Il rischio è che un insegnante li
senta come una pagella sul proprio lavoro. **Secondo lei quali numeri del suo
corso è giusto che la Federazione veda, e quali invece devono restare suoi?** E
c'è un modo di presentarli che li renderebbe accettabili a un collega più
diffidente di lei?

**Ultima.** Se il portale mostrasse quanto i suoi allievi lo usano — accessi,
esercizi svolti — sarebbe una cosa utile o darebbe fastidio? Lo chiedo perché
noi possiamo misurare bene l'uso del portale, ma non è quello il risultato che
conta: il risultato è che l'allievo arrivi al tavolo del circolo.
