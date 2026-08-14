# Due mesi di Bridge LAB: cosa è cambiato

Da metà giugno a oggi abbiamo messo mano alla piattaforma 81 volte. Non è un
elenco di novità inventate a tavolino: buona parte di quello che segue nasce da
cose che ci avete scritto voi.

---

## Gli avversari adesso giocano sul serio

Un iscritto ci ha scritto una cosa scomoda e giusta: «i robot commettono errori
banali e sconcertanti; in questo modo si vince anche sbagliando e non ci si
rende conto. Direi diseducativo».

Invece di rispondere a parole, abbiamo misurato. Si fa giocare una serie di
mani al computer e si conta, presa per presa, quanto butta via rispetto al
gioco perfetto a carte scoperte. Il verdetto era impietoso: **l'avversario
predefinito regalava più di quattro prese a mano**.

Da oggi al vostro tavolo c'è una rete neurale addestrata sul bridge, che gira
su un nostro server. Stesse mani, stesso metro:

| avversario | prese buttate per mano | mani giocate senza sbavature |
|---|---|---|
| quello di prima | 4,2 | 0 su 10 |
| il nuovo | **1,3** | **4 su 10** |

In pratica **un terzo degli errori di prima**, e quattro mani su dieci giocate
senza regalare nulla. Chi aveva già scelto un livello di difficoltà se lo tiene
com'era: cambia solo per chi non aveva mai toccato l'impostazione.

Se un giorno il nostro server non rispondesse, il gioco continua senza
interruzioni con il motore precedente: non ve ne accorgerete.

---

## Cose nuove da fare

**«Quante prese?»** — Un gioco veloce: vedete tutte e quattro le mani e dovete
dire quante prese fa Nord-Sud in un certo colore. È il primo esercizio della
piattaforma che non è scritto a mano: le mani vengono generate al momento e la
risposta la calcola il solver, quindi non finiscono mai.

**«Dove è cambiata la mano»** — A fine partita potete rivedere la smazzata
presa per presa e vedere il momento esatto in cui il risultato è cambiato. Una
precisazione onesta: non vi dice «hai sbagliato». Il computer vede tutte e 52
le carte, e una presa persa lì poteva essere imperdibile al tavolo, dove le
mani avversarie sono coperte. Vi indica il momento su cui vale la pena
ragionare, non emette un giudizio.

**Lo storico del torneo settimanale** — Chi aveva giocato la settimana prima,
il lunedì dopo trovava un torneo nuovo e nessuna traccia di come era andata.
Ce l'ha fatto notare un partecipante alla sua prima settimana: «non si vede la
performance, valore essenziale». Aveva ragione. Ora sotto la classifica trovate
tutte le vostre settimane, con punteggio, stelle e la posizione che avevate
ottenuto.

**«Trova un compagno»** — La barriera più citata da chi si avvicina al bridge
non è la difficoltà: è non avere nessuno con cui giocare. Potete iscrivervi a
un elenco per livello, provincia e disponibilità. Nessuno vi compare senza
avercelo chiesto: l'elenco nasce vuoto e si popola solo su azione esplicita.

**Per gli insegnanti** — C'è un generatore di mani con vincoli: si dice cosa
deve avere la mano e si ottengono tutte le distribuzioni coerenti, senza
aspettare che esca quella giusta per caso. Ogni mano arriva col proprio
contratto par calcolato dal solver, e la serie si può assegnare direttamente a
una classe come compito.

---

## I contenuti

Abbiamo fatto un giro di revisione didattica: **19 correzioni su 16 moduli**,
dalle mani d'esempio ai conteggi nelle spiegazioni.

Poi abbiamo passato al solver tutte le 272 smazzate del catalogo. Sono saltate
fuori **56 mani che, a carte scoperte, il dichiarante non poteva mantenere**:
un esercizio in cui il contratto cade comunque insegna la cosa sbagliata. Sono
state corrette nel modo in cui vengono proposte.

---

## Quello che ci avete segnalato

- il torneo che, riaprendo l'app, ripartiva dalla prima mano;
- le richieste di amicizia che non arrivavano, e quelle che non si potevano
  annullare;
- in «Rivedi la mano», la mano di Sud tagliata via e irraggiungibile sui
  telefoni;
- un quiz lampo in cui le carte non corrispondevano al punteggio dichiarato;
- il quiz delle prese che in certi browser non partiva affatto;
- i refusi nell'indirizzo email in fase di iscrizione, che ora vengono segnalati
  prima di confermare (`gmial.com` e simili);
- i nomi BBO duplicati, che mandavano i risultati sulla persona sbagliata.

---

## Come si legge e come si vede

Abbiamo rifatto l'aspetto della piattaforma tenendo presente chi la usa
davvero. Testi più grandi, contrasti più netti, niente più testo grigio chiaro
su fondo chiaro, e una regola semplice: **nessuna scritta sotto i 12 pixel, da
nessuna parte**. Abbiamo anche reso funzionante l'impostazione della dimensione
del testo, che prima esisteva ma non faceva nulla.

Le pagine si aprono più in fretta: il glossario, che è la porta d'ingresso di
chi arriva da una ricerca, ha quasi dimezzato il tempo di caricamento.

---

## Sotto il cofano

Non si vede, ma è la parte che tiene in piedi il resto: protezione dei dati
personali rafforzata, cancellazione dell'account completa e verificabile,
preferenze sui cookie revocabili in qualunque momento dal fondo pagina,
accessibilità portata allo standard WCAG AA, e un sistema che ci avvisa quando
qualcosa si rompe — invece di aspettare che ce lo scriviate voi.

---

## Continuate a scriverci

Metà di questo elenco esiste perché qualcuno si è preso il disturbo di
segnalare un problema, a volte in termini piuttosto diretti. La segnalazione
sui robot ci ha portato a scoprire che il motore migliore, quello che pensavamo
di avere già attivo, in realtà non era mai entrato in funzione.

Sono le critiche precise a far migliorare le cose. Continuate.
