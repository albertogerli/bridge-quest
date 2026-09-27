# Proposta: una priorità chiara, non una strada obbligata

*27 settembre 2026 — seconda stesura, dopo una revisione esterna.*

**La prima stesura aveva la diagnosi sbagliata.** Non un'esagerazione: proprio
sbagliata, e il documento la metteva in prima riga. Questa versione dice cosa
non tornava, perché, e cosa resta in piedi. La correzione sta in fondo, in
appendice, per esteso — perché il modo in cui ci siamo sbagliati è più utile
del numero sbagliato.

---

## 1. Il quadro vero

| misura (30 giorni) | valore |
|---|---|
| Persone attive | 173 |
| Di queste, **hanno completato almeno un modulo, prima o poi** | **133 (77%)** |
| Di queste, hanno completato un modulo **negli ultimi 30 giorni** | 58 (34%) |
| Hanno giocato un torneo | 51 (29%) |
| Iscritti a una classe | 56 |

La prima stesura diceva «il 62% non apre mai una lezione». **È falso.** Tre
persone attive su quattro dentro le lezioni ci sono già state. Quello che cala
è il ritorno: nell'ultimo mese ha studiato una su tre.

**Il problema non è trovare le lezioni. È tornarci.** Sono due problemi diversi
e vogliono due soluzioni diverse: il primo si risolve spostando un pulsante, il
secondo no.

---

## 2. Cosa resta in piedi, e cosa no

### Resta — la navigazione è affollata

93 rotte. Cinque schede in basso, di cui una è un cassetto con dentro otto
voci. Tre schede — Home, Impara, Gioca — rispondono alla stessa domanda, e
«Impara» non porta al percorso: porta a un altro menu che contiene il percorso.

Questa è un'osservazione sulla struttura, verificabile guardando il codice.
**Non è una misura di danno**, e la prima stesura la trattava come se lo fosse.

### Resta, ed è la cosa migliore — il legame lezione→gioco non esiste

Il «Prossimo passo» alterna fra studio e gioco confrontando due marcatempo in
`localStorage`, e quando suggerisce di giocare manda a
`/gioca/smazzata?random=1`: **una mano a caso**, non una mano sull'argomento
appena studiato (`suggested-next-step.tsx:38`).

Qui c'è il lavoro che vale. Finita la lezione sul taglio, una mano dove il
taglio serve davvero, con una spiegazione che parla di quella lezione. È anche
la risposta plausibile al problema vero — tornare a studiare — perché dà allo
studio un esito immediato invece di un XP.

### Cade — «il percorso dista due tocchi»

Falso per chi ha già cominciato. L'eroe della home mobile mostra **«Riprendi»**
e porta dritto al modulo: `/lezioni/[lessonId]/[moduleId]`, un tocco
(`hero-section.tsx:117`). L'avevo descritto come «gioca subito» senza averlo
letto.

### Cade — «una home da dodici blocchi, uguale per tutti»

Le home sono **tre**, scelte dal ruolo: `HomeAllievo` per chi segue un corso,
`HomeInsegnante` per chi insegna, la bacheca per gli altri
(`home-client.tsx:276`). E i banner sono condizionati: un allievo iscritto e
già avviato non vede il richiamo dell'ospite né quello della prima mano. Il
massimo realistico in contemporanea sono tre, non dodici.

### Cade, e questo è l'errore più grosso — «15 giochi con zero risultati»

**Tredici pagine di gioco su ventisette non scrivono affatto in
`game_results`.** Registrano altrove, o non registrano. Avevo contato le righe
di una tabella sola e chiamato «inutilizzato» tutto ciò che non ci finiva.

Il caso che smonta l'argomento da solo:

| pagina | nella prima stesura | in realtà (30 giorni) |
|---|---|---|
| `/gioca/torneo` | «zero risultati» | **2771 partite, 51 persone** — in `risultati_torneo` |
| `/gioca/licita-amico` | «zero risultati» | 62 sessioni, 19 persone — in `bidding_sessions` |
| `/gioca/sfida-imp`, `sfida-amico`, `sfida-link` | «zero risultati» | 71 sfide, 16 persone — in `challenges` |

Il torneo settimanale è la **terza cosa più giocata del sito**, e il documento
lo dava per morto. Con i conti rifatti su tutte le tabelle: *smazzata* 42%,
*sfida* 22%, *torneo* 22%, *mano del giorno* 7%.

Restano davvero silenziose poche cose — `sfide-coppie` ha una riga in trenta
giorni — e **sette pagine non sono misurabili affatto** (`analisi`, `pratica`,
`cosa-apri`, `quiz-prese`, `quale-contratto`, `licita`, `sfida-link`): non
scrivono da nessuna parte. Di quelle non sappiamo niente, e «non sappiamo» non
è «nessuno le usa».

---

## 3. La proposta, corretta

> Una priorità chiara per ciascuno, non la stessa strada per tutti.

La prima stesura proponeva di mettere il percorso all'ingresso **per tutti**.
Era la soluzione sbagliata anche prima di scoprire che la diagnosi era
sbagliata: il codice ha già tre home per ruolo, e rifarle una sola sarebbe
tornare indietro.

### Chi vede cosa per primo

| persona | prima cosa |
|---|---|
| Principiante senza classe | «Prova la tua prima mano», poi il percorso |
| Allievo di un corso | Cosa ha assegnato l'insegnante, e da dove riprendere |
| Autodidatta avviato | Il passo successivo del corso scelto, con il cambio corso a portata |
| Giocatore esperto | Il gioco, e l'approfondimento pertinente **come proposta, non come pedaggio** |

Non sono quattro interfacce: è la stessa struttura con un ordine diverso in
cima. Niente prova d'ingresso obbligatoria prima di poter toccare qualcosa.

### La barra

```
   🛤            🎮           🏫            👤
Percorso      Gioca        Classe       Profilo
```

**«Gioca», non «Allenamento»**: comprende tornei, sfide e compagnia, e non fa
sembrare tutto un compito. Sparisce il cassetto «Altro».

**Il Profilo non è il cassetto con un altro nome.** È la distinzione che mi era
sfuggita, e va scritta:

- **Profilo**: progressi, premi, collezione, negozio, impostazioni.
- **Gioca**: classifiche e tornei — si capiscono lì, non nel profilo.
- **Gioca**: amici e trova-compagno — servono quando si vuole giocare insieme.
- **Percorso**: dispense e glossario — servono mentre si studia.

### Una tensione che non ho risolto

Il revisore propone di mostrare «Classe» anche a chi non ne ha una, con uno
stato vuoto «Entra con il codice»: chi ha appena ricevuto il codice deve sapere
dove metterlo. È giusto.

Ma `CLAUDE.md` registra l'errore opposto, commesso quattro volte: il QR della
locandina portava a `/classi`, che **chiede il codice dell'istruttore a chi non
sa cosa sia una classe**. Una scheda sempre visibile che chiede un codice è
quella cosa lì, resa permanente, per la maggioranza che una classe non ce l'ha.

Le due esigenze sono entrambe vere. **Non ho una risposta e non la invento**:
va decisa guardando due persone vere, una con il codice in mano e una senza.

---

## 4. Come si misura — e come no

**Non con le aperture delle lezioni.** Se il percorso lo metti all'ingresso,
quelle salgono per costruzione: misurerebbero lo spostamento del pulsante, non
l'apprendimento. Era la verifica proposta nella prima stesura ed era una
verifica che non poteva fallire.

Quello che ha senso guardare, **separato per tipo di persona**:

- moduli **iniziati e finiti**, non aperti;
- ritorno a distanza di una e quattro settimane;
- quanto ci mette qualcuno a ritrovare il gioco che cercava;
- continuità degli allievi di una classe dall'inizio alla fine del corso.

E prima ancora: **guardare cinque persone usare il sito.** I numeri dicono cosa
succede, non perché. Tutto questo documento è costruito su numeri, e la prima
stesura mostra cosa succede quando ci si ferma lì.

---

## 5. Da dove partirei adesso

**Primo — rendere evidente quello che già funziona.** «Riprendi» esiste ma è
dentro l'eroe: va reso l'azione primaria, riconoscibile senza animazioni. La
scheda didattica porta al percorso, non a un menu intermedio. I banner non si
impilano mai in più di uno.

**Secondo — il legame lezione→esercizio→spiegazione, su UN argomento solo.**
Curato bene, dall'inizio alla fine: la mano allena davvero quel concetto, la
difficoltà è coerente, l'errore riceve una spiegazione pertinente, e alla fine
si torna al percorso senza perdersi. Se funziona lì, si estende. Non serve che
sia sempre una mano intera: una decisione sull'attacco può bastare.

**Terzo — la barra a quattro voci**, con le destinazioni divise come sopra.

**Quarto — strumentare le sette pagine che non registrano niente**, perché
finché non lo fanno qualunque decisione su di loro è a occhio. Questa
probabilmente viene prima di tutto il resto.

Non metto durate. La prima stesura diceva «una settimana» e «il 90% del
beneficio»: erano numeri inventati, e uno dei due sembrava perfino una misura.

---

## Appendice — come mi sono sbagliato

Il documento si reggeva su tre numeri. Due erano sbagliati e uno era
ambiguo.

**«Il 62% non apre mai una lezione»** veniva da `completed_modules`. Ma non
aver completato un modulo non è non aver aperto una lezione, e nessuna tabella
registra le aperture: il dato non esisteva. Guardando la domanda giusta — chi
ha completato almeno un modulo *prima o poi* — il numero si ribalta: 77%.

**«15 giochi con zero risultati»** veniva dal contare una tabella sola. Tredici
pagine su ventisette non ci scrivono. Il torneo settimanale, dato per morto,
ha 51 giocatori in trenta giorni.

**«Due tocchi per il percorso»** l'ho scritto leggendo la barra di navigazione
e non la home, che ha un «Riprendi» a un tocco.

C'è anche un'incongruenza interna che il revisore ha colto: al §2 i primi tre
giochi erano *smazzata, sfida, mano del giorno*; al §5 diventavano *sfida, mano
del giorno, torneo*, con la stessa percentuale accanto. Avevo scambiato una
voce e tenuto il numero.

Il filo comune non è la fretta: è **aver preso la mancanza di un dato per un
dato.** Una tabella vuota sembra un fatto, e non lo è — è il posto dove
nessuno ha scritto. Vale la pena ricordarlo, perché è lo stesso sguardo che in
questo progetto ha già prodotto altri difetti: guardare da dentro, dove le cose
che non vediamo sembrano non esserci.
