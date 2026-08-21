# Bridge LAB — manuale per gli istruttori

Per gli insegnanti FIGB che usano Bridge LAB con una classe: come si apre un
corso, come si assegnano le mani, e che cosa si può fare in aula mentre la
lezione è in corso.

Il portale sta su **bridgelab.it/istruttori**. Se stai cercando come si usa la
piattaforma da giocatore — corsi, giochi, punti — quello è il
[manuale per tutti](manuale-utenti.md); ai tuoi allievi puoi dare il
[manuale per chi segue un corso](manuale-allievi.md).

---

## 1. Ottenere l'accesso

Il portale non si attiva da solo. Da **Diventa istruttore**
(`/diventa-istruttore`) mandi la richiesta, dicendo chi sei e in quale ASD
insegni; l'approvazione la dà la segreteria. Finché è in attesa la pagina te lo
dice; quando è approvata, al posto del modulo compare il collegamento al
portale.

Se la richiesta non viene approvata puoi mandarne un'altra.

## 2. La classe

### Crearla

Dal portale, **Crea classe**: le dai un nome e ricevi un **codice invito di sei
caratteri**. È l'unica cosa che serve agli allievi: lo inseriscono in «Le mie
classi» e sono dentro.

Il codice si condivide in quattro modi, tutti dalla pagina della classe:

- **a voce o per iscritto** — sei caratteri si dettano al telefono;
- **su WhatsApp**, con il pulsante *Invita su WhatsApp*, che prepara già il
  messaggio;
- **con la locandina** (`Locandina da appendere`): un foglio A4 con il codice e
  il QR, da stampare e mettere in bacheca al circolo;
- **con i tagliandi**, uno per allievo, se hai già l'elenco (§3).

### Chi può entrare

Tre manopole, nella pagina della classe:

- **Iscrizioni aperte o chiuse.** A iscrizioni chiuse il codice non funziona
  più, e chi inquadra la locandina non entra. Si riapre quando vuoi.
- **Approvazione delle iscrizioni.** Se la attivi, il codice da solo non basta:
  chi lo usa resta in attesa finché non lo approvi tu. Serve quando il codice
  gira più di quanto vorresti.
- **Scadenza del codice.** Oltre quella data il codice smette di valere. La
  locandina te lo segnala prima che tu la stampi, così non appendi un foglio
  già scaduto.

Il codice si può anche **rigenerare**: quello vecchio muore, chi è già iscritto
resta.

## 3. Gli allievi

**Allievi e tavoli** (`/istruttori/<classe>/allievi`) è l'elenco della classe
reale — quella che si siede ai tavoli — e serve a due cose: assegnare i posti e
stampare i tagliandi.

L'elenco si può **caricare da un file CSV** con le colonne
`id, nome, presente, tavolo, posto`. In Excel: *File → Salva con nome → CSV*;
il separatore lo riconosce da solo, punto e virgola o virgola che sia.

Da lì, **Stampa i tagliandi**: uno per allievo, da posare sul tavolo. Ogni
tagliando ha il QR della classe e il nome già scritto, così chi arriva inquadra
e si trova dentro senza digitare niente.

> **Sui dati personali.** Nell'elenco si salva **solo il nome**. Se il tuo CSV
> contiene anche email e telefono, quelle colonne vengono lette per aiutarti a
> riconoscere le righe ma **non vengono scritte da nessuna parte**. È una scelta
> deliberata: sono dati di persone che un account su Bridge LAB non ce l'hanno,
> e raccoglierli richiederebbe una base giuridica che oggi non c'è.

## 4. I compiti

**Nuovo compito** (`/istruttori/<classe>/nuovo-compito`). Un compito è un
titolo, un elenco di mani, e qualche scelta:

| campo | a che serve |
|---|---|
| **Titolo** | quello che l'allievo vede nella sua classe |
| **Scadenza** | facoltativa; governa anche una delle opzioni sulle soluzioni |
| **Minibridge** | senza dichiarazione: gioca chi ha più punti e il livello viene dalla tabella. È il modo giusto per le prime lezioni |
| **Soluzioni** | *dopo che l'allievo ha giocato la mano* · *solo dopo la scadenza* · *subito, come aiuto durante l'esercizio* |
| **Nota per gli allievi** | due righe di consegna: «guardate i segnali», «contate le prese prima di partire» |

### Da dove vengono le mani

Tre sorgenti, e si mescolano nello stesso compito:

1. **Il catalogo delle lezioni** — 272 smazzate, filtrabili per lezione, per
   difficoltà (facile / medio / difficile) e per testo, cercando nel titolo o
   nel contratto.
2. **Le posizioni che hai salvato** dal tavolo di studio (§6). Finiscono in
   fondo all'elenco dell'allievo.
3. **Un file PBN tuo** — le smazzate del tuo programma di smazzatura (Dealer4,
   BridgeComposer, BBO). Si caricano e si scelgono come le altre.

### Che cosa vedi dopo

La pagina del compito (`/istruttori/<classe>/compito/<compito>`) è il pezzo che
in aula si usa di più. Per ogni allievo e per ogni mano:

- **contratto mantenuto o caduto**, e quante cadute ha preso la classe su quella
  mano — la colonna *Cadute / classe* dice subito se il problema è di uno o di
  tutti;
- **non giocata**, per chi non l'ha aperta;
- **quanto ci hanno pensato**, cioè il tempo speso: una mano risolta in cinque
  secondi e una in quattro minuti non raccontano la stessa cosa;
- **su cosa lavorare** — gli errori di gioco rilevati automaticamente sulle mani
  del compito, e gli **errori ricorrenti** che diventano il *tema della classe*;
- il **replay** della mano, presa per presa, per rigiocarla insieme;
- **le tue note**, che restano tue.

## 5. La lezione in aula

### Aprire i tavoli

**Aula** (`/istruttori/<classe>/aula`): dici quanti tavoli e li apri. Gli
allievi li trovano dalla loro classe, senza che tu mandi niente. *Manda a tutti
i tavoli* distribuisce la stessa mano ovunque in un colpo solo — è una sola
operazione, non una per tavolo, e la differenza è fra «la classe vede la mano
insieme» e «a scaglioni».

Chi arriva dal QR di un tagliando o della locandina **entra senza registrarsi**:
scrive il suo nome, e tu gli dai il posto. A fine lezione, se vuole, si tiene
quello che ha fatto creando un account — non c'è niente da migrare, è già suo.

### Il tavolo condiviso

**Tavolo condiviso** (`/istruttori/tavolo`): tu vedi tutte e quattro le mani,
gli allievi solo la propria, e le altre quando le scopri tu. C'è *annulla
l'ultima* per tornare indietro di una carta quando qualcuno sbaglia mentre
spiegavi.

### La proiezione

**Proiezione** (`/istruttori/proiezione`) è la finestra da mandare sul
videoproiettore: segue il tuo tavolo e mostra solo quello che hai scoperto.

> **Come funziona davvero, perché conta.** Le due finestre parlano fra loro
> **dentro lo stesso browser**, senza passare dalla rete: funziona anche se il
> wi-fi del circolo non funziona, ed è il motivo per cui è fatta così. Il
> rovescio è che la finestra di proiezione deve stare **sullo stesso computer**
> del tavolo — un secondo dispositivo non la vede.

### La lavagna

**Lavagna** (`/istruttori/lavagna`): da proiettare, si scopre una mano per
volta, avanti e indietro, con il contratto che si può nascondere finché non
vuoi dirlo.

## 6. Gli otto strumenti

| strumento | che cosa fa |
|---|---|
| **Tavolo condiviso** | tu vedi tutte le mani, gli allievi solo la propria |
| **Genera mani** | mani su misura per l'argomento: si mettono i vincoli e si salva il modello per riusarlo (e si può condividere, o no) |
| **Tavolo di studio** | cambia una carta e vedi quanto costa, presa per presa; i numeri si nascondono per far pensare la classe |
| **Lavagna** | da proiettare in aula, una mano per volta |
| **Le tue mani** (archivio) | ogni posizione salvata si riapre **esattamente dov'era**, carte già giocate comprese |
| **Combinazioni** | poche carte per posto: l'impasse senza il resto della smazzata |
| **Libreria** | materiale già pronto, preparato dagli altri insegnanti |
| **Dispensa** | il foglio da consegnare, con le soluzioni in fondo |

Due dettagli che si scoprono tardi:

- Dal **tavolo di studio**, quando arrivi al momento che vuoi discutere, dai un
  nome alla posizione e salvala: la ritrovi nell'archivio e la puoi mettere in
  un compito.
- La **dispensa** ha *formato compatto* e *nascondi i punti*, e si stampa o si
  salva in PDF. È pensata per essere consegnata su carta.

## 7. Chat e videoconferenza

Ogni classe ha una **chat**, e un campo per la **stanza di videoconferenza**:
incolli lì l'indirizzo della tua stanza (quella che usi sempre) e gli allievi
trovano il pulsante *Entra in videoconferenza* nella loro pagina, senza doversi
ricordare il link.

## 8. Cose da sapere prima di trovarsele addosso

- **La proiezione vuole lo stesso computer.** Vedi §5.
- **La finestra di proiezione non mostra mai le mani coperte.** Le carte nascoste
  vengono tolte dal messaggio prima di spedirlo, non nascoste all'arrivo: anche
  se qualcuno guardasse il traffico, lì dentro non ci sono.
- **Il codice scaduto o le iscrizioni chiuse** non danno un errore comprensibile
  all'allievo: se qualcuno «non riesce a entrare», controlla prima quelle due.
- **Le mani importate da PBN non sono verificate** come quelle del catalogo:
  contratto e dichiarante sono quelli che c'erano nel file.
- **Il catalogo, invece, è verificato a doppio morto**: nessuna delle 272 mani
  chiede al dichiarante più prese di quante le carte ne diano. Se una mano cade
  comunque, o è colpa del gioco — oppure è una mano in cui l'allievo difende, e
  il contratto **deve** cadere: sono 129 su 272, e sono l'esercizio.

---

*Segnalazioni e richieste: il pulsante di segnalazione dentro l'applicazione
arriva direttamente a chi la mantiene.*
