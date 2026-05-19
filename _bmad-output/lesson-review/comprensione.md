# Review esperto — Domande di Comprensione

> Sorgente: `src/data/comprensione-data.ts`


## Lezione 0: Il Bridge: un gioco di prese

### Q1

`src/data/comprensione-data.ts:29`

**Domanda:** Quanti giocatori servono per giocare a bridge e come sono divisi?

**Opzioni:**
- 2 giocatori, uno contro l'altro
- 4 giocatori, 2 coppie: Nord-Sud contro Est-Ovest ✅
- 6 giocatori, 3 per squadra
- 4 giocatori, ognuno per sé

**Spiegazione:** Il bridge si gioca in 4 giocatori divisi in 2 coppie: N/S contro E/O. Ogni giocatore riceve 13 carte.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:41`

**Domanda:** Qual è la gerarchia corretta dei semi dal più alto al più basso?

**Opzioni:**
- Cuori > Picche > Quadri > Fiori
- Picche > Cuori > Fiori > Quadri
- Senza Atout > Picche > Cuori > Quadri > Fiori ✅
- Fiori > Quadri > Cuori > Picche

**Spiegazione:** La gerarchia è: Senza Atout > Picche > Cuori > Quadri > Fiori. I semi nobili (Picche e Cuori) valgono 30 punti per presa dichiarata.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:53`

**Domanda:** Quante prese deve realizzare chi dichiara '3 Senza Atout'?

**Opzioni:**
- 3 prese
- 6 prese
- 9 prese ✅
- 13 prese

**Spiegazione:** Il numero dichiarato si aggiunge alle prime 6 prese (il 'libro'). Quindi 3NT = 6 + 3 = 9 prese.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 1: Vincenti e affrancabili

### Q1

`src/data/comprensione-data.ts:68`

**Domanda:** Avete Picche AKQJ in una mano. Quante vincenti sono?

**Opzioni:**
- 1
- 2
- 3
- 4 ✅

**Spiegazione:** AKQJ sono 4 carte equivalenti e tutte vincenti. Il Fante vince tanto quanto l'Asso perché sono una sequenza completa.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:76`

**Domanda:** Con Fiori KQJ10 (zero vincenti immediate), quante prese potete affrancare dopo aver ceduto l'Asso?

**Opzioni:**
- 0
- 1
- 2
- 3 ✅

**Spiegazione:** Dopo una giocata l'avversario usa l'Asso; le altre 3 carte (QJ10) si affrancano e diventano vincenti.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:84`

**Domanda:** Avete J103 in mano e KQ92 al morto. Il numero massimo di prese fa riferimento a:

**Opzioni:**
- Il numero di onori
- Il lato con meno carte
- Il numero di carte del lato lungo ✅
- Il numero di Assi

**Spiegazione:** Il numero massimo di prese affrancabili ha come riferimento il numero di carte del lato lungo (4 carte = massimo 4 prese, meno quelle da cedere).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 2: Il punto di vista dei difensori

### Q1

`src/data/comprensione-data.ts:105`

**Domanda:** Da difensore a Senza Atout, quale colore scegliete per l'attacco?

**Opzioni:**
- Il colore con più onori alti
- Il colore più lungo, se pari lunghezza il più onorato ✅
- Sempre Picche perché è il seme più alto
- Il colore del morto

**Spiegazione:** A SA i difensori scelgono il colore più lungo; se due colori di pari lunghezza, il più onorato.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:118`

**Domanda:** Il terzo di mano ha KQJ nel colore d'attacco. Quale carta gioca?

**Opzioni:**
- Il Re
- La Donna
- Il Fante ✅
- È indifferente

**Spiegazione:** Quando ha carte equivalenti, il terzo di mano gioca la più bassa della sequenza (il contrario di chi muove per primo). Con KQJ come terzo, gioca il J.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:126`

**Domanda:** Con KQ1043 il difensore attacca a SA. Quale carta sceglie?

**Opzioni:**
- Il 3 (cartina dal basso)
- Il Re (testa della sequenza) ✅
- La Donna
- Il 10

**Spiegazione:** Con una sequenza solida in testa (KQ + 10 di rinforzo), si attacca dall'alto: il Re. Nega l'Asso e promette la Donna.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 3: Affrancamenti di lunga e di posizione

### Q1

`src/data/comprensione-data.ts:147`

**Domanda:** Avete AQ5 al morto e 863 in mano. Come tentate l'impasse alla Donna?

**Opzioni:**
- Giocate la Donna dal morto
- Giocate l'Asso dal morto e sperate che cada il Re
- Giocate piccola da Sud verso la Donna del morto ✅
- Giocate piccola dal morto verso Sud

**Spiegazione:** L'impasse si realizza giocando 'verso' l'onore protetto: piccola da Sud verso la Donna al morto. Se Ovest non ha il Re, la Donna vince.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:159`

**Domanda:** Qual è la probabilità di successo di un'impasse semplice?

**Opzioni:**
- 25%
- 33%
- 50% ✅
- 75%

**Spiegazione:** Un'impasse semplice ha il 50% di probabilità: l'onore mancante può essere a destra o a sinistra con uguale probabilità.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:167`

**Domanda:** Cos'è un 'rientro' (o ingresso) e perché è fondamentale per l'affrancamento di lunga?

**Opzioni:**
- Una carta che permette di fare presa alla mano giusta nel momento giusto ✅
- Un tipo di dichiarazione
- Un onore alto del morto
- La prima carta giocata nella presa

**Spiegazione:** Il rientro è una carta che consente di trasferire la mano alla posizione giusta per incassare le carte affrancate. Senza rientri, le affrancabili di lunga restano inutilizzabili.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 4: Il piano di gioco a senz'atout

### Q1

`src/data/comprensione-data.ts:188`

**Domanda:** Qual è il primo passo del piano di gioco a Senza Atout?

**Opzioni:**
- Fare subito l'impasse
- Contare le vincenti e calcolare quante prese mancano ✅
- Incassare tutte le vincenti
- Giocare il colore più lungo

**Spiegazione:** Il metodo del piano di gioco: 1) Quante prese ho? 2) Quante ne devo trovare? 3) Da quale colore reperirle? Prima di muovere, contate sempre le vincenti.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:200`

**Domanda:** Cos'è il 'colpo in bianco' (duck)?

**Opzioni:**
- Giocare l'Asso il prima possibile
- Fare un'impasse senza successo
- Cedere subito una presa per mantenere le comunicazioni nel colore ✅
- Tagliare una vincente avversaria

**Spiegazione:** Il duck è la cessione immediata di una presa (che sarebbe comunque ceduta dopo) allo scopo di mantenere le comunicazioni con la mano che ha il colore lungo.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:213`

**Domanda:** Con K2 in mano e AQJ43 al morto, come evitate il blocco nel colore?

**Opzioni:**
- Giocate prima l'Asso dal morto
- Giocate prima il Re (onore del lato corto) ✅
- Giocate prima la Donna
- Non importa l'ordine

**Spiegazione:** Giocate per primi gli onori del lato corto per evitare il blocco. Con K2 / AQJ43, iniziate con il Re, poi cartina per le vincenti al morto.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 5: Il gioco con l'atout

### Q1

`src/data/comprensione-data.ts:233`

**Domanda:** Cos'è un 'fit' nel bridge?

**Opzioni:**
- Avere tutte le carte alte in un seme
- L'incontro di 8 o più carte in un colore tra le due mani della coppia ✅
- Avere 5 carte in un seme
- Possedere Asso e Re nello stesso seme

**Spiegazione:** Il fit è l'incontro di 8 o più carte in un colore tra giocante e morto. Con fit in un nobile (Cuori/Picche) si preferisce giocare ad atout anziché a SA.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:246`

**Domanda:** Perché nel gioco ad atout la prima operazione è spesso 'battere le atout'?

**Opzioni:**
- Per fare più prese possibili
- Per impedire agli avversari di tagliare le nostre vincenti laterali ✅
- Perché è obbligatorio per regolamento
- Per mostrare le proprie carte al morto

**Spiegazione:** Le vincenti nei colori laterali sono vincenti RELATIVE: il giocante le potrà incassare solo quando avrà eliminato le atout avversarie. Battere atout prima protegge le vincenti.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:259`

**Domanda:** Cosa si intende per 'potere di allungamento' delle atout?

**Opzioni:**
- Le atout diventano più lunghe durante il gioco
- Tagliando dalla mano corta si ottengono più prese rispetto al semplice incasso ✅
- Le atout valgono più punti
- Si aggiungono carte al colore di atout

**Spiegazione:** L'allungamento: tagliando dalla mano corta si possono ottenere dal colore di atout PIÙ prese che giocando normalmente. Serve quando il taglio aumenta di almeno una presa.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 6: Il piano di gioco con l'atout

### Q1

`src/data/comprensione-data.ts:280`

**Domanda:** Quando NON dovete battere subito le atout nel gioco a colore?

**Opzioni:**
- Mai: le atout vanno sempre battute subito
- Quando avete bisogno di fare tagli dalla parte corta ✅
- Quando avete più di 8 atout in linea
- Quando il morto ha molte vincenti

**Spiegazione:** Aspettate a battere atout se avete bisogno di tagliare dalla parte corta. Altrimenti perdereste le atout necessarie per i tagli prima di realizzarli.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:293`

**Domanda:** Nel gioco ad atout, l'attacco da due carte: quale carta si sceglie?

**Opzioni:**
- Sempre la più bassa
- Sempre la più alta ✅
- Quella con l'onore più alto
- È indifferente

**Spiegazione:** Quando si attacca da due carte ad atout, si sceglie sempre la più alta. Con 74: il 7. Con 102: il 10. Con A9: l'Asso.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:306`

**Domanda:** Perché ad atout non si deve MAI attaccare 'sotto Asso'?

**Opzioni:**
- È vietato dal regolamento
- Perché l'Asso va sempre giocato per primo
- Si rischia di regalare una presa al giocante ✅
- Il compagno non capirebbe il segnale

**Spiegazione:** Mai attaccare sotto Asso ad atout: si rischia di regalare una presa. Ad atout, le prese si cercano da onori alti o da tagli, non da sviluppi lunghi.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 7: La valutazione della mano

### Q1

`src/data/comprensione-data.ts:326`

**Domanda:** Quanto valgono i punti onori Milton Work: A, K, Q, J?

**Opzioni:**
- A=5, K=4, Q=3, J=2
- A=4, K=3, Q=2, J=1 ✅
- A=3, K=2, Q=1, J=0
- A=10, K=5, Q=3, J=1

**Spiegazione:** Il conteggio Milton Work: Asso=4, Re=3, Donna=2, Fante=1. Totale per seme: 10 punti. Totale nel mazzo: 40 punti.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:339`

**Domanda:** Con due semi di 5 carte e 12 punti, quale colore aprite?

**Opzioni:**
- Il colore più basso di rango
- Il colore con più onori
- Il colore più alto di rango ✅
- Sempre Fiori

**Spiegazione:** Con due semi di 5 carte si apre nel più alto di rango. La scelta del colore dipende dalle lunghezze, NON dalla posizione degli onori.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:352`

**Domanda:** Con 16 punti e distribuzione bilanciata 4-3-3-3, cosa aprite?

**Opzioni:**
- 1 nel colore quarto
- 1NT ✅
- Passo
- 2NT

**Spiegazione:** Con 15-17 punti e distribuzione bilanciata (4333, 4432, 5332) si apre 1NT. Questa apertura prevale sull'apertura a colore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 8: L'apertura e la risposta

### Q1

`src/data/comprensione-data.ts:368`

**Domanda:** Il partner apre 1NT. Avete 10 punti senza fit in un nobile. Cosa rispondete?

**Opzioni:**
- Passo
- 2NT (invitante)
- 3NT (la manche è certa) ✅
- 2 Fiori (Stayman)

**Spiegazione:** Con 10+ punti e mano senza fit nobile si risponde 3NT. La manche è certa: 15-17 + 10 = almeno 25 punti in linea.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:381`

**Domanda:** Dopo 1NT - 2 Fiori (Stayman), l'apertore risponde 2 Quadri. Cosa significa?

**Opzioni:**
- Ha 4 carte a Quadri
- Non ha né 4 Cuori né 4 Picche ✅
- Ha 4 Cuori e 4 Picche
- Ha solo 15 punti (il minimo)

**Spiegazione:** Nella Stayman: 2Q = 'non ho né 4 Cuori né 4 Picche'; 2C = 'ho 4 Cuori'; 2P = 'ho 4 Picche'; 2NT = 'ho 4C e 4P'.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:394`

**Domanda:** Il partner apre 1NT. Avete 5 Cuori e 3 punti. Cosa rispondete?

**Opzioni:**
- Passo (troppo deboli)
- 2 Cuori (proposta di parziale, conclusiva) ✅
- 3 Cuori (invitante)
- 2 Fiori (Stayman)

**Spiegazione:** Con 5+ carte in un nobile e mano debole (0-7 punti) si risponde a livello 2 nel colore. È una proposta di parziale CONCLUSIVA: il partner deve passare.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 9: Aperture di 1 a colore. Le risposte

### Q1

`src/data/comprensione-data.ts:415`

**Domanda:** Il partner apre 1 Picche e avete 4 punti. Cosa rispondete?

**Opzioni:**
- 1NT
- 2 Picche
- Passo ✅
- 2 Fiori

**Spiegazione:** Con meno di 5 punti si dice Passo. L'apertore può avere 12-20: con solo 4 punti la manche (24-25) non è raggiungibile.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:423`

**Domanda:** Il partner apre 1 Quadri. Avete 7 punti e 4 carte di Quadri. Cosa rispondete?

**Opzioni:**
- 1NT
- 2 Quadri (appoggio limitativo) ✅
- 3 Quadri (invitante)
- Passo

**Spiegazione:** Appoggio a livello 2: limitativo, mostra fit (4 carte su 1Q) e 5-9 punti. Il messaggio: 'se hai una mano normale, la manche è irraggiungibile'.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:436`

**Domanda:** Il partner apre 1 Cuori. Quale risposta è FORZANTE (l'apertore non può passare)?

**Opzioni:**
- 2 Cuori (appoggio)
- 1NT (5-10 punti)
- 1 Picche (colore nuovo a livello 1) ✅
- Passo

**Spiegazione:** Un colore nuovo in risposta è sempre FORZANTE: l'apertore non può passare. Promette 5+ punti e almeno 4 carte nel colore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 10: L'apertore descrive

### Q1

`src/data/comprensione-data.ts:457`

**Domanda:** L'apertore con 12-15 punti è definito 'mano di Diritto'. Qual è il suo Livello di Guardia con mano bilanciata?

**Opzioni:**
- 1 nel suo colore
- 1NT ✅
- 2NT
- 2 nel suo colore

**Spiegazione:** Con mano bilanciata di Diritto (12-15), il Livello di Guardia è 1NT. La ridichiarazione non supererà quel livello.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:465`

**Domanda:** Il partner risponde 1 su 1 e l'apertore ha 18-20 punti e mano bilanciata. Come ridichiara?

**Opzioni:**
- 1NT
- Passo
- Salto a 2NT ✅
- Ripete il suo colore

**Spiegazione:** La bilanciata 18-20 si descrive con il salto a 2NT dopo risposta 1 su 1. È troppo forte per 1NT (15-17) e troppo debole per apertura 2NT (21-23).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:478`

**Domanda:** Dopo una risposta '2 su 1' (es. 1P-2Q), la situazione è forzante a manche. L'apertore cosa deve fare?

**Opzioni:**
- Passare se ha il minimo
- Descrivere la DISTRIBUZIONE senza distinguere Diritto/Rovescio ✅
- Saltare subito a manche
- Dire 2NT per frenare

**Spiegazione:** Su risposte 2 su 1 la coppia ha almeno 24 punti: la manche è assicurata. L'apertore descrive solo la DISTRIBUZIONE senza fare distinzioni tra Diritto e Rovescio.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 11: L'intervento

### Q1

`src/data/comprensione-data.ts:499`

**Domanda:** L'avversario apre 1 Cuori. Con 14 punti e 4 Picche + tolleranza minori, cosa fate?

**Opzioni:**
- Passo
- Contro (informativo) ✅
- 1 Picche
- 1NT

**Spiegazione:** Il Contro informativo su 1C garantisce 4 Picche e tolleranza per Fiori e Quadri, con 12-16 punti. È il modo per chiedere al compagno di scegliere.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:512`

**Domanda:** L'intervento di 1NT dopo apertura avversaria mostra:

**Opzioni:**
- 8-12 punti e mano lunga
- 15-17 punti bilanciata CON fermo nel colore avversario ✅
- 15-17 punti bilanciata senza requisiti sul fermo
- 21-23 punti bilanciata

**Spiegazione:** L'intervento di 1NT è equivalente all'apertura 1NT (15-17 bilanciata) MA garantisce in più il fermo nel colore dell'apertore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:525`

**Domanda:** L'intervento a colore a livello 1 (es. 1F-1P) richiede almeno:

**Opzioni:**
- 5 punti e 4 carte
- 12 punti e 4 carte
- 8 punti e 5 carte con almeno 1 Onore ✅
- 10 punti e 6 carte

**Spiegazione:** L'intervento 1 su 1 richiede 8-16 punti e 5+ carte con almeno 1 Onore (A, K o Q). Se il punteggio è minimo, dev'essere concentrato nel colore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 12: Sviluppi dopo l'intervento avversario

### Q1

`src/data/comprensione-data.ts:546`

**Domanda:** L'avversario interviene con il Contro sull'apertura del partner. Con 11+ punti, cosa fate?

**Opzioni:**
- Passo
- Surcontro ✅
- 2NT
- Appoggio a salto

**Spiegazione:** Con 11+ punti sul Contro avversario si fa Surcontro: è l'unica dichiarazione forte. La descrizione della mano si rimanda al giro successivo.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:559`

**Domanda:** Dopo un intervento avversario a colore, la risposta 1NT mostra:

**Opzioni:**
- 5-10 punti senza nessun requisito particolare
- 7-10 punti con il fermo nel colore avversario ✅
- 15-17 punti bilanciata
- Mano debole qualsiasi

**Spiegazione:** Con l'intervento, i Senza non sono più obbligati ma proposte di contratto: promettono il fermo nel colore avversario. 1NT = 7-10 punti con fermo.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:572`

**Domanda:** L'apertore è passato dopo che il 4o di mano ha detto 1P su 1Q-1C. Con mano normale bilanciata, cosa fa l'apertore?

**Opzioni:**
- Ridice 2 Quadri per mostrare forza
- Contro per mostrare i suoi punti
- Passa (con mani normali dopo intervento del quarto, l'apertore passa) ✅
- 1NT per mostrare il fermo

**Spiegazione:** Con mani normali bilanciate o sbilanciate dopo intervento del 4o di mano: l'apertore Passa. Il partner avrà comunque modo di parlare grazie all'intervento avversario.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 100: La Prima Presa

### Q1

`src/data/comprensione-data.ts:619`

**Domanda:** Nel gioco a colore, quale attacco è considerato 'anormale' e sospetto?

**Opzioni:**
- Attacco dal colore del compagno
- Attacco da una sequenza (es. KQJ)
- Attacco sotto Asso ✅
- Attacco da AK nel proprio colore

**Spiegazione:** Nessun giocatore attacca sotto Asso nei contratti a colore. Se lo fa, sospettate un motivo nascosto come la ricerca di un taglio dal compagno.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:632`

**Domanda:** Al morto c'è K3 e in mano J54. L'avversario attacca con il 2 (vi mancano A e Q). Cosa giocate dal morto?

**Opzioni:**
- Il Re, sperando che cada l'Asso
- Piccola, stando bassi ✅
- Il 3, perché è indifferente
- Dipende dalla dichiarazione avversaria

**Spiegazione:** State bassi! Chi attacca può avere la Dama ma probabilmente non l'Asso. Mettendo il Re si perde sicuramente; stando bassi il Re potrebbe vincere in seguito.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:645`

**Domanda:** Prima di giocare la prima carta dal morto, cosa dovete fare?

**Opzioni:**
- Giocare il più velocemente possibile
- Contare solo i punti del morto
- Fare una pausa di riflessione, dedurre dalla carta d'attacco e dalla licita ✅
- Chiedere consiglio al compagno

**Spiegazione:** La pausa alla prima presa è fondamentale. Dedurre dalla carta d'attacco, ricordare la licita, formulare ipotesi sulla distribuzione e fare il piano di gioco PRIMA di muovere.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 101: Fit 5-3 e Fit 4-4

### Q1

`src/data/comprensione-data.ts:666`

**Domanda:** Nel gioco ad atout, la 'Mano Base' e la 'Mano Satellite' si riferiscono a:

**Opzioni:**
- La mano forte e la mano debole
- La mano con più atout (Base) e l'altra (Satellite che fa i tagli) ✅
- La mano del giocante e quella del morto
- Il seme di atout e il seme laterale

**Spiegazione:** La Mano Base è quella con più atout, destinata a battere le atout avversarie. La Mano Satellite usa le sue atout per tagliare. I tagli della Satellite producono prese extra.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:678`

**Domanda:** Perché il fit 4-4 è considerato il più potente?

**Opzioni:**
- Perché ha più punti
- Perché non c'è una mano Base a priori e si può tagliare da entrambe le parti ✅
- Perché garantisce 10 prese
- Perché gli avversari hanno meno atout

**Spiegazione:** Il fit 4-4 è il più potente perché non avendo una mano Base predefinita, si può scegliere da quale parte tagliare a seconda delle esigenze, massimizzando le prese.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:691`

**Domanda:** Quando il piano di gioco prevede tagli al morto e lunghe laterali, cosa bisogna verificare?

**Opzioni:**
- Che il morto abbia molti punti
- Che i rientri e i collegamenti siano preservati ✅
- Che le atout siano tutte in mano
- Che l'avversario non abbia l'Asso di atout

**Spiegazione:** Le prese del Satellite devono essere raggiungibili! Se l'unico modo per raggiungere una lunga del morto è il colore di atout, non bisogna accorciarlo con i tagli.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 102: Conto e Preferenziali

### Q1

`src/data/comprensione-data.ts:712`

**Domanda:** Nel 'conto della carta', come segnalate di avere un numero PARI di carte nel colore giocato dal compagno?

**Opzioni:**
- Giocate la carta più piccola
- Giocate una carta alta seguita da una bassa ✅
- Giocate sempre il 2
- Giocate un onore

**Spiegazione:** Nel conto: con 2, 4 o 6 carte (pari) si sceglie una carta ALTA cui seguirà una più bassa. Con 1, 3 o 5 carte (dispari) si gioca la più piccola.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:725`

**Domanda:** Il compagno attacca e voi non siete impegnati nella presa. Come segnalate 'gradimento' nel sistema Pari-Dispari?

**Opzioni:**
- Carta alta = gradimento
- Carta bassa = gradimento
- Carta dispari = gradimento ✅
- Carta pari = gradimento

**Spiegazione:** Nel sistema Pari-Dispari usato in Italia: carta DISPARI = gradimento (continua nel colore), carta PARI = sgradimento (cambia colore).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:738`

**Domanda:** Quando un difensore effettua il PRIMO scarto, cosa significa una carta DISPARI?

**Opzioni:**
- Non ha valori nel colore scartato
- Chiama: mostra valori nel colore scartato ✅
- Ha un numero dispari di carte in quel colore
- Chiede il ritorno nel colore di attacco

**Spiegazione:** Al primo scarto: DISPARI chiama (mostra valori nel colore) e PARI rifiuta (nega valori). È il 'primo scarto all'italiana'.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 103: I Colori da Muovere in Difesa

### Q1

`src/data/comprensione-data.ts:759`

**Domanda:** In difesa, quando il giocante inizia un colore con una piccola, cosa fate in seconda posizione?

**Opzioni:**
- Coprite sempre con il vostro onore più alto
- Giocate piccola (seconda di mano bassa) ✅
- Giocate il vostro onore medio
- Tagliate se possibile

**Spiegazione:** In seconda posizione: giocate piccola se l'avversario ha iniziato con una piccola. Se ha iniziato con un onore, coprite il suo onore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:772`

**Domanda:** Il compagno attacca in un colore che avete. Quando dovreste giocare il vostro onore alto?

**Opzioni:**
- Mai, lasciate che il compagno faccia da solo
- Sempre, per cercare di vincere la presa ✅
- Solo se l'onore è l'Asso
- Quando il gradimento richiede di continuare il colore e avete carte equivalenti

**Spiegazione:** Il terzo di mano deve cercare di vincere la presa, eventualmente sacrificando i suoi onori per affrancare quelli del compagno. È un principio fondamentale della difesa.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:785`

**Domanda:** Quando è corretto dare il segnale di gradimento?

**Opzioni:**
- Sempre quando il compagno muove un colore
- Solo quando il colore è mosso dai difensori, MAI se mosso dal Giocante ✅
- Quando il Giocante attacca un colore dal morto
- Solo nella prima presa

**Spiegazione:** Il gradimento si dà SOLO quando un colore viene mosso dai difensori. Non si segnala MAI quando il colore è mosso dal Giocante: in quel caso si difende normalmente.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 104: I Giochi di Sicurezza

### Q1

`src/data/comprensione-data.ts:806`

**Domanda:** Cos'è un 'gioco di sicurezza' nel bridge?

**Opzioni:**
- Giocare sempre gli Assi per primi
- Rinunciare a una presa potenziale per garantirsi di non perderne due ✅
- Battere sempre tutte le atout prima di giocare
- Giocare sempre l'impasse

**Spiegazione:** Il gioco di sicurezza consiste nel rinunciare volontariamente a una presa (o alla possibilità di farla) per proteggersi da cattive divisioni e garantire il contratto.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:819`

**Domanda:** Quando è più importante la sicurezza rispetto alla massimizzazione delle prese?

**Opzioni:**
- Sempre nel gioco a Senza Atout
- Quando si gioca a squadre (IMP) e il contratto è importante ✅
- Solo quando si ha slam
- Solo quando si ha meno di 20 punti

**Spiegazione:** A squadre (IMP) il concetto di sicurezza è fondamentale: perdere un contratto per cercare una presa in più è un disastro. A coppie (Mitchell) la presa in più conta di più.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:832`

**Domanda:** Con AK1032 in mano e 654 al morto, quale manovra protegge da Q quarta?

**Opzioni:**
- Tirare Asso e Re sperando che la Donna cada
- Fare l'impasse giocando piccola verso il 10
- Giocare l'Asso, poi piccola verso il 10 (gioco di sicurezza) ✅
- Giocare il 6 dal morto per il 10

**Spiegazione:** Il gioco di sicurezza: tirare l'Asso per catturare l'eventuale Q secca, poi piccola verso il 10 per gestire Q quarta dall'altro lato. Si perde al massimo 1 presa.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 105: Probabilità e Percentuali

### Q1

`src/data/comprensione-data.ts:853`

**Domanda:** Con 8 carte in linea in un colore, quale divisione avversaria è la più probabile?

**Opzioni:**
- 2-3 (più della metà delle volte)
- 3-2 nel 68% dei casi ✅
- 4-1 nel 50% dei casi
- 2-3 nel 50% e 4-1 nel 50%

**Spiegazione:** Con 8 carte in linea, la divisione 3-2 si trova nel 68% dei casi, la 4-1 nel 28% e la 5-0 nel 4%.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:866`

**Domanda:** Con 7 carte in linea, qual è la probabilità di trovare la divisione 3-3 avversaria?

**Opzioni:**
- 50%
- 48%
- 36% ✅
- 68%

**Spiegazione:** Con 7 carte in linea, la 3-3 avversaria si trova solo nel 36% dei casi. La 4-2 è molto più frequente (48%).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:874`

**Domanda:** Quando manca solo la Dama e avete 9+ carte nel colore, cosa fate?

**Opzioni:**
- Sempre l'impasse
- Battete Asso e Re (la Dama cade) ✅
- Dipende dalla posizione
- Giocate un gioco di sicurezza

**Spiegazione:** Con 9+ carte in linea e la sola Dama mancante, la percentuale del drop (battere A e K) supera quella dell'impasse. La Dama è più probabilmente secca o seconda.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 106: Coprire o Non Coprire

### Q1

`src/data/comprensione-data.ts:895`

**Domanda:** In seconda posizione, il giocante muove un onore dal morto. Quando dovete coprirlo?

**Opzioni:**
- Sempre, è la regola universale
- Mai, si gioca sempre piccola in seconda
- Quando coprendo potete promuovere un onore al compagno o a voi stessi ✅
- Solo se avete l'Asso

**Spiegazione:** Si copre l'onore del morto quando coprendo si può promuovere un onore per la propria linea. Se coprire non produce nulla (es. il morto ha una sequenza), meglio giocare piccola.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:908`

**Domanda:** Il morto ha QJ109. Il giocante gioca la Donna. Coprite con il Re?

**Opzioni:**
- Sì, sempre coprire un onore
- No, perché il morto ha una sequenza: coprire non promuove nulla ✅
- Sì, per bloccare il colore
- Dipende dai punti del giocante

**Spiegazione:** Non coprite! Quando il morto ha una sequenza (QJ109), coprire con il Re regala la presa senza promuovere nulla. Il giocante vincerebbe con A e le altre sarebbero comunque franche.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:921`

**Domanda:** La regola di seconda mano bassa ('piccola su piccola') si applica sempre?

**Opzioni:**
- Sì, senza eccezioni
- No, a volte bisogna salire per impedire al giocante di fare prese con carte basse ✅
- Solo nel gioco a Senza Atout
- Solo se si ha un onore alto

**Spiegazione:** La regola 'piccola su piccola' ha eccezioni: quando si può prendere la presa con certezza, o quando lasciando passare si permetterebbe al giocante una presa immeritata.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 107: I Giochi di Eliminazione

### Q1

`src/data/comprensione-data.ts:942`

**Domanda:** Cos'è una 'messa in mano' (endplay)?

**Opzioni:**
- Giocare la prima carta nella presa
- Mettere un avversario in presa obbligandolo a giocare a nostro vantaggio ✅
- Passare la mano al morto
- Giocare l'ultima carta rimasta

**Spiegazione:** La messa in mano (endplay) forza un avversario a vincere la presa e poi a giocare un colore favorevole per noi: o regalandoci un rientro, o offrendo un taglio e scarto.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:955`

**Domanda:** Prima di effettuare una messa in mano, cosa bisogna fare?

**Opzioni:**
- Battere tutte le atout
- Eliminare i colori 'di uscita' dell'avversario ✅
- Contare i punti del morto
- Giocare tutti gli Assi

**Spiegazione:** Prima della messa in mano bisogna 'eliminare' i colori neutri (quelli che l'avversario potrebbe rigiocare senza danno), così quando sarà in presa sarà costretto a giocare nel colore favorevole a noi.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:967`

**Domanda:** Cos'è il 'taglio e scarto'?

**Opzioni:**
- Tagliare un colore e scartarne un altro
- L'avversario in presa gioca un colore in cui noi siamo vuoti al morto e in mano, dandoci la possibilità di tagliare da una parte e scartare una perdente dall'altra ✅
- Una convenzione di licita
- Scartare le atout per fare tagli

**Spiegazione:** Il 'taglio e scarto' (ruff and discard) si verifica quando l'avversario è costretto a giocare un colore in cui una mano è vuota: si taglia da una parte e si scarta una perdente dall'altra.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 108: Giocare Come Se

### Q1

`src/data/comprensione-data.ts:988`

**Domanda:** Cosa significa 'giocare come se' nel bridge?

**Opzioni:**
- Giocare facendo finta di avere più punti
- Ipotizzare una distribuzione avversaria necessaria per mantenere il contratto e giocare di conseguenza ✅
- Copiare il gioco degli avversari
- Giocare senza guardare le carte

**Spiegazione:** Giocare 'come se' significa formulare un'ipotesi sulla distribuzione avversaria che renda il contratto possibile, e agire come se fosse certa. Se l'ipotesi alternativa porta comunque al fallimento, non c'è nulla da perdere.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1001`

**Domanda:** Quando il contratto dipende da una condizione necessaria, cosa dovete fare?

**Opzioni:**
- Sperare nella fortuna
- Affrontare subito la condizione necessaria, non rimandarla ✅
- Evitare il problema il più a lungo possibile
- Chiedere il Contro per guadagnare tempo

**Spiegazione:** Rimandare il problema spesso significa perdere la possibilità di risolverlo. Se il contratto dipende da una condizione (es. un'impasse), affrontatela subito.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1014`

**Domanda:** Se il contratto può essere mantenuto solo con una specifica divisione degli onori avversari, come procedete?

**Opzioni:**
- Giocate la linea che funziona nel maggior numero di casi
- Ipotizzate la divisione favorevole e giocate di conseguenza ✅
- Provate prima la linea più sicura e poi cambiate
- Non importa: il risultato è casuale

**Spiegazione:** Se l'unica via per mantenere il contratto è una specifica distribuzione, la assumete come vera e giocate di conseguenza. Se fosse diversa, il contratto sarebbe comunque perso.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 109: Le Deduzioni del Giocante

### Q1

`src/data/comprensione-data.ts:1035`

**Domanda:** L'avversario ha aperto 1NT (15-17) e poi ha giocato Asso e Re di un colore. Quanti punti ha al massimo negli altri colori?

**Opzioni:**
- 17 (non si sa nulla)
- Al massimo 10 (15-17 meno A+K=7) ✅
- Al massimo 14
- Al massimo 7

**Spiegazione:** Se l'avversario ha aperto 1NT (15-17) e ha mostrato A e K in un colore (7 punti), negli altri colori avrà al massimo 10 punti. Queste deduzioni dalla licita sono fondamentali per localizzare gli onori mancanti.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1048`

**Domanda:** L'avversario ha passato in apertura e poi ha giocato AK di fiori. Dove cercate la Donna di un altro seme?

**Opzioni:**
- Indifferentemente da una parte o dall'altra
- Sicuramente dall'altra parte (chi ha passato con AK ha al massimo 10 punti, non abbastanza per una Donna in più) ✅
- Dalla stessa parte di chi ha AK
- Non si possono fare deduzioni

**Spiegazione:** Se un giocatore ha passato in apertura con AK di fiori (7 punti), non può avere troppo di più. Le Donne e i Re mancanti saranno probabilmente dall'altro lato.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1061`

**Domanda:** Quando la carta d'attacco è un'onore alto (es. Re), cosa potete dedurre?

**Opzioni:**
- Niente di preciso
- L'attaccante ha una sequenza: il Re promette anche la Donna e nega l'Asso ✅
- L'attaccante ha solo il Re
- L'attaccante sta cercando un taglio

**Spiegazione:** Un attacco di Re promette la Donna (carta immediatamente inferiore) e nega l'Asso (carta immediatamente superiore). Queste regole di attacco permettono di ricostruire la distribuzione.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 200: La Legge delle Prese Totali

### Q1

`src/data/comprensione-data.ts:1086`

**Domanda:** Secondo la Legge delle Prese Totali, se NS ha 9 atout e EO ha 8 atout, quante sono le Prese Totali?

**Opzioni:**
- 15
- 16
- 17 ✅
- 18

**Spiegazione:** Prese Totali = Somma delle atout. 9 + 8 = 17 Prese Totali. Ogni coppia farà circa tante prese quante atout possiede.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1094`

**Domanda:** Avete fit quarto con distribuzione 4-3-3-3 e il compagno ha aperto. Quante prese contate secondo la Legge?

**Opzioni:**
- 8 (come se aveste fit quarto normale)
- 7 (svalutate di una presa per la distribuzione piatta) ✅
- 9 (il fit quarto garantisce 9 prese)
- 6 (le distribuzioni piatte non danno prese)

**Spiegazione:** Le distribuzioni piatte 4333 riducono la resa: svalutate di una presa. Con 8 atout in linea ma 4333, dichiarate solo 2 nel colore anziché 3.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1107`

**Domanda:** Dopo 1C-1P-2C-2P, il vostro partner rialza a 3C. È un invito a manche?

**Opzioni:**
- Sì, sta invitando con punti buoni
- No, è competitivo secondo la Legge (9 atout, 9 prese) ✅
- Sì, mostra 16-18 punti
- Dipende dalla vulnerabilità

**Spiegazione:** 3C dopo 1C-1P-2C-2P è competitivo (9 carte, 9 prese secondo la Legge). Per invitare a manche si usano dichiarazioni convenzionali come 2NT, Contro, o un nuovo colore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 201: Valutazioni: le lunghe e le corte

### Q1

`src/data/comprensione-data.ts:1128`

**Domanda:** Il compagno ha un singolo nel vostro colore. Quale onore conserva valore?

**Opzioni:**
- Tutti gli onori (AKQJ)
- Solo l'Asso ✅
- Il Re e la Donna
- Nessuno

**Spiegazione:** A fronte di un singolo del partner, solo l'Asso è un onore interessante. Re, Donna e Fante davanti a un singolo sono valori potenzialmente sprecati.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1141`

**Domanda:** Con una settima nobile (7+ carte di Cuori o Picche), come vi comportate in dichiarazione?

**Opzioni:**
- Fate il Contro Sputnik per cercare il fit
- Dichiarate il colore direttamente: la settima DEVE essere atout ✅
- Aprite a Senza Atout se avete i punti
- Passate se avete pochi punti

**Spiegazione:** Con monocolori di 7+ carte, il colore deve essere atout quasi sempre. Non nascondete le lunghe dietro il Contro Sputnik: dichiarate il colore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1154`

**Domanda:** Il partner apre 2NT (21-23) e avete 1 punto con una settima nobile. Cosa fate?

**Opzioni:**
- Passo (troppo deboli)
- Dichiarate manche nel vostro nobile (4C o 4P) ✅
- 2NT + 1 non basta per la manche
- Dite 3 nel vostro colore come invito

**Spiegazione:** Con una settima nobile e apertura 2NT forte, dichiarate manche direttamente (4C o 4P) anche con pochissimi punti. La lunga compensa la mancanza di onori.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 202: Le Texas su apertura 1NT e 2NT

### Q1

`src/data/comprensione-data.ts:1175`

**Domanda:** Dopo 1NT, la risposta 2 Quadri (Jacoby Transfer) mostra:

**Opzioni:**
- 5+ carte di Quadri e mano debole
- 5+ carte di Cuori (transfer: si dichiara il colore immediatamente inferiore) ✅
- La Stayman avanzata
- Un invito a 3NT

**Spiegazione:** Jacoby Transfer: per mostrare un colore si dichiara quello immediatamente inferiore. 2Q = 5+ Cuori, 2C = 5+ Picche. L'apertore 'rispetta' il transfer.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1188`

**Domanda:** Dopo 1NT-2Q-2C, il rispondente dice 4NT. Cosa significa?

**Opzioni:**
- Blackwood, richiesta d'Assi
- 4NT quantitativo: invito a slam (NON richiesta d'Assi) ✅
- Vuole giocare 4NT
- Chiede il numero delle Dame

**Spiegazione:** 4NT dopo transfer su 1NT è QUANTITATIVO, cioè un invito a slam. Non è Blackwood! Per chiedere gli Assi si usa la Stayman e poi si cerca l'atout.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1201`

**Domanda:** Su 1NT, la risposta 2 Picche mostra:

**Opzioni:**
- 5+ Picche e mano debole
- Almeno 6 carte di Fiori (transfer per i minori) ✅
- Un invito a 3P
- Stayman per le Picche

**Spiegazione:** I transfer per i minori: 2P = mostra le Fiori (almeno 6 carte), 2NT = mostra le Quadri (almeno 6 carte). L'apertore rispetta il transfer o fa la 'super accettazione' con onore maggiore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 203: Sviluppi dopo le risposte 2 su 1

### Q1

`src/data/comprensione-data.ts:1222`

**Domanda:** Dopo 1P-2F, l'apertore ridichiara 2NT. Cosa mostra?

**Opzioni:**
- Bilanciata forte (18-20 punti)
- Bilanciata di Diritto (12-14) con fermi nei colori non detti ✅
- Vuole giocare 2NT
- Non ha un secondo colore

**Spiegazione:** In forcing manche, 2NT dell'apertore è l'unica replica che limita la mano: bilanciata 12-14 con attitudine a giocare a Senza. Mostra fermi nei colori non detti.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1235`

**Domanda:** Dopo 1C-2F, l'apertore dice un nuovo colore a livello 3 (es. 3Q). Cosa mostra?

**Opzioni:**
- Mano minima con le Quadri
- Mano buona (15+ punti) oppure distribuzione 5-5 ✅
- Vuole giocare a Quadri
- Un colore di 3 carte

**Spiegazione:** Un colore nuovo a livello 3 dell'apertore in FM mostra mano buona (15+) o distribuzione 5-5. Sfonda il livello 3, quindi certamente mano forte.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1248`

**Domanda:** In FM, il rispondente riporta a 2 nel seme di apertura (es. 1P-2F-2Q-2P). Questo fissa l'atout?

**Opzioni:**
- Sì, fissa le Picche come atout definitivo
- No, mostra almeno tolleranza (2+ carte) e chiede ulteriore descrizione ✅
- Sì, e invita allo slam
- È una dichiarazione conclusiva

**Spiegazione:** Il riporto a 2 nel seme di apertura mostra tolleranza (2+ carte) e chiede all'apertore di descriversi ancora. NON fissa l'atout. Il rialzo a 3, invece, fissa l'atout con velleità di Slam.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 204: Accostamento a Slam: fissare l'atout

### Q1

`src/data/comprensione-data.ts:1269`

**Domanda:** Cos'è il 'terreno solido' nella dichiarazione verso lo Slam?

**Opzioni:**
- Quando si hanno 30+ punti in linea
- Quando le dichiarazioni iniziali hanno individuato almeno 21-22 punti in linea ✅
- Quando l'atout è concordato
- Quando si hanno tutti gli Assi

**Spiegazione:** Il terreno è solido quando le dichiarazioni hanno mostrato almeno 21-22 punti combinati. Su terreno solido, fissare l'atout appena sotto manche è FORZANTE (obiettivo Slam).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1282`

**Domanda:** Dopo 1C-1P-2C-3C, il 3C è forzante o passabile?

**Opzioni:**
- Forzante (terreno solido, obiettivo Slam)
- Passabile (terreno non solido, invitante) ✅
- Dipende dai punti dell'apertore
- È sempre conclusivo

**Spiegazione:** Dopo 1C-1P-2C non c'è certezza di 21+ punti in linea. Il terreno non è solido, quindi 3C è passabile (invitante, non forzante).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1295`

**Domanda:** Come si distingue un fissaggio forzante (slam) da uno invitante?

**Opzioni:**
- Dal livello di dichiarazione
- Se il terreno è solido (21+ in linea) è forzante; se non solido è invitante ✅
- È sempre forzante sotto manche
- Dipende dal numero di Assi

**Spiegazione:** Le due domande chiave: A) Il compagno potrebbe accontentarsi del contratto? B) Aveva strade più forti? Se terreno solido = forzante (Slam). Se non solido = invitante (passabile).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 205: Accostamento a Slam: le Cue Bid

### Q1

`src/data/comprensione-data.ts:1316`

**Domanda:** Cos'è una Cue Bid nel contesto dell'accostamento a Slam?

**Opzioni:**
- La dichiarazione del colore avversario
- Una dichiarazione illogica che mostra un CONTROLLO (Asso, vuoto, Re, singolo) in un colore laterale ✅
- La richiesta d'Assi (Blackwood)
- L'appoggio a salto nel colore del compagno

**Spiegazione:** Le Cue Bid per lo Slam sono dichiarazioni che mostrano un controllo (1o giro: Asso/vuoto; 2o giro: Re/singolo) in un colore laterale, dopo che l'obiettivo è lo Slam.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1329`

**Domanda:** Quale delle 4 regole delle Cue Bid dice 'Cue Bid saltata = non c'è'?

**Opzioni:**
- La prima regola
- La seconda regola
- La terza regola: se un giocatore salta una Cue e il compagno prosegue, il compagno PROMETTE il controllo saltato ✅
- La quarta regola

**Spiegazione:** Regola 3: Cue Bid saltata = non c'è. Se un giocatore salta una Cue e il compagno prosegue le Cue Bid, il compagno promette di avere il controllo nel colore saltato.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1342`

**Domanda:** Sotto il livello di manche, le Cue Bid sono obbligatorie o facoltative?

**Opzioni:**
- Facoltative: con mano minima si può rifiutare
- OBBLIGATORIE: non si nega la Cue Bid con la scusa 'mano minima' ✅
- Dipende dal numero di punti
- Solo il Capitano può fare Cue Bid

**Spiegazione:** Sotto il livello di manche, le Cue Bid sono OBBLIGATORIE. Non si nega una Cue Bid con la scusa della 'mano minima'. La ridefinizione della forza avviene dopo, al Livello di Guardia.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 206: Le Sottoaperture

### Q1

`src/data/comprensione-data.ts:1363`

**Domanda:** Le sottoaperture 2Q, 2C e 2P mostrano:

**Opzioni:**
- 21+ punti e mano forte
- 6 carte e 6-10 punti ✅
- 5 carte e 12-14 punti
- 7+ carte di barrage

**Spiegazione:** Le sottoaperture 2Q, 2C e 2P mostrano 6 carte e punteggio 6-10. Sono aperture interdittive: il Rispondente sarà il Capitano.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1376`

**Domanda:** Dopo la sottoapertura 2P del partner, rispondete 2NT. Quale convenzione state usando?

**Opzioni:**
- Stayman
- Transfer
- Ogust (interrogativa: chiede qualità del colore e del punteggio) ✅
- Blackwood

**Spiegazione:** 2NT dopo sottoapertura è la convenzione Ogust: chiede al compagno la qualità del colore e del punteggio. Risposte: 3F=min+brutto, 3Q=min+bello, 3C=max+brutto, 3P=max+bello, 3NT=AKQxxx.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1389`

**Domanda:** Nella convenzione Ogust, 3 Picche in risposta significa:

**Opzioni:**
- Punteggio minimo e colore brutto
- Punteggio minimo e colore bello
- Punteggio massimo e colore brutto
- Punteggio massimo e colore bello ✅

**Spiegazione:** Nella Ogust: 3F=min+brutto, 3Q=min+bello, 3C=max+brutto, 3P=max+bello, 3NT=AKQxxx. Bello = 2 onori maggiori (AK, AQ, KQ) o A/K con J10.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 207: L'apertura di 2 Fiori forte indeterminata

### Q1

`src/data/comprensione-data.ts:1410`

**Domanda:** L'apertura di 2 Fiori è:

**Opzioni:**
- Un barrage a Fiori
- L'unica apertura forte del sistema, senza limite superiore di punti ✅
- 15-17 punti bilanciata
- Una sottoapertura con 6 carte di Fiori

**Spiegazione:** 2F è l'unica apertura forte del sistema. Non ha limite superiore. Il Capitanato spetta all'Apertore. La risposta convenzionale d'attesa è 2Q.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1423`

**Domanda:** Per rispondere 2C o 2P sull'apertura 2F, servono TUTTI questi 3 requisiti:

**Opzioni:**
- 5+ carte, almeno un onore, almeno 5 punti ✅
- 4+ carte e 8+ punti
- 6+ carte e qualsiasi punteggio
- Solo 4 carte in un nobile

**Spiegazione:** Per dire 2C o 2P su 2F servono TUTTI E 3: almeno 5 carte + almeno un onore + forza di manche (5+ punti). Se manca anche uno solo dei 3 requisiti, si dice 2Q.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1436`

**Domanda:** Dopo 2F-2Q-2C, la situazione è forzante manche?

**Opzioni:**
- Sì, sempre dopo 2F
- No, è forzante solo fino al ritorno a 3C (3 nel colore) ✅
- Sì, ma solo con 8+ punti
- No, si può passare subito

**Spiegazione:** Dopo 2F-2Q-2C o 2P, la situazione NON è FM: è forzante solo fino al ritorno nel colore (3C o 3P). FM si raggiunge solo se l'apertore mostra bilanciata (2NT) o minore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 208: Competitivo, costruttivo, interdittivo

### Q1

`src/data/comprensione-data.ts:1457`

**Domanda:** Una dichiarazione COMPETITIVA è caratterizzata da:

**Opzioni:**
- Un salto nel colore di atout
- L'appoggio o rialzo senza salto, senza ambizioni di manche ✅
- L'uso del Contro o della Surlicita
- Un cambio di colore forzante

**Spiegazione:** Le dichiarazioni competitive: carte senza ambizioni di manche, effettuate in appoggio/rialzo NON a salto. Corrispondono sempre a colori che si intende giocare.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1470`

**Domanda:** Una dichiarazione INTERDITTIVA è SEMPRE caratterizzata da:

**Opzioni:**
- Un appoggio al minimo livello
- Un annuncio a SALTO ✅
- L'uso del Contro
- Una dichiarazione convenzionale

**Spiegazione:** Le dichiarazioni interdittive sono SEMPRE caratterizzate da un annuncio a SALTO (barrage). Chi le fa demanda al compagno tutte le successive decisioni e deve farle al massimo livello alla prima occasione.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1483`

**Domanda:** Dopo 1C-P-2C-P-3C dall'apertore. Il 3C è:

**Opzioni:**
- Un invito a manche
- Interdittivo: mostra lunghezza extra e previene la riapertura avversaria ✅
- Costruttivo: cerca lo Slam
- Un errore dichiarativo

**Spiegazione:** 3C non è un invito! È interdittivo, mostra lunghezza extra nel colore (Legge delle Prese Totali) e cerca di impedire la riapertura avversaria.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 209: Mani di fit nel nobile: standard

### Q1

`src/data/comprensione-data.ts:1504`

**Domanda:** L'appoggio a 3 nel nobile (es. 1P-3P) dopo apertura del partner mostra:

**Opzioni:**
- Invito a manche con 10-11 punti
- Barrage: fit QUARTO, 0-7 punti, distribuzione sbilanciata ✅
- Fit terzo e 12+ punti
- Manche conclusiva

**Spiegazione:** Nel sistema standard avanzato, 3 nel nobile è BARRAGE: fit quarto, 0-7 punti e distribuzione sbilanciata (non invito!). Racconta l'esatta lunghezza del fit.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1517`

**Domanda:** Cosa mostra 2NT Truscott in risposta a 1P del partner?

**Opzioni:**
- Mano bilanciata invitante a 3NT
- Fit nel nobile (terzo o quarto), invito a manche (10 belli - 12 brutti) ✅
- 15-17 punti bilanciata
- Transfer per un minore

**Spiegazione:** 2NT Truscott: fit nel nobile, terzo o quarto, invito a manche (10 belli - 12 brutti). NON richiede fermi nei colori né mano bilanciata.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1530`

**Domanda:** La risposta 1NT su 1 nobile del partner (nel sistema avanzato) è:

**Opzioni:**
- Sempre 5-10 punti, nega il fit
- Semiforzante: 5-11 punti, può nascondere fit nel nobile ✅
- 15-17 punti bilanciata
- Forzante a manche

**Spiegazione:** 1NT semiforzante si allarga a 5-11 punti. Può nascondere fit nel nobile di apertura. L'apertore su 1NT non dice mai Passo (tranne 5332 di 11).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 210: Mani di fit nel nobile: Bergen

### Q1

`src/data/comprensione-data.ts:1551`

**Domanda:** Nel sistema Bergen, la risposta 3 Fiori su apertura 1 nobile mostra:

**Opzioni:**
- Fiori lunghe e mano debole
- Fit QUARTO nel nobile con 7-9 punti ✅
- Fit QUARTO nel nobile con 10-11 punti
- Invito a Slam

**Spiegazione:** Bergen: 1 nobile - 3F = fit QUARTO con 7-9 punti. 1 nobile - 3Q = fit QUARTO con 10-11 punti. L'apertore riporta a 3 in atout se minimo.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1564`

**Domanda:** Nel Bergen, 2NT Truscott mostra:

**Opzioni:**
- Invito naturale a 3NT
- Tutte le mani di 12+ punti con fit quarto o più ✅
- 8-9 punti bilanciata
- Fit terzo debole

**Spiegazione:** Nel Bergen, 2NT Truscott è illimitato (12+ punti) con fit quarto o più. L'apertore risponde: colore nuovo = singolo/vuoto; 3 in atout = mano interessante; 4 in atout = peggiore.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1577`

**Domanda:** Il Surcontro dopo il Contro avversario sull'apertura 1 nobile del partner mostra:

**Opzioni:**
- Fit nel nobile di apertura
- 11+ punti, tendenzialmente ESCLUDE il fit ✅
- Mano debole che vuole giocare
- Barrage nel nobile

**Spiegazione:** Nel sistema Bergen, il Surcontro su Contro avversario mostra 11+ punti e tendenzialmente ESCLUDE il fit. Per il fit si usano gli appoggi diretti o 2NT Truscott.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 211: Mani di fit nel nobile: appoggi costruttivi

### Q1

`src/data/comprensione-data.ts:1598`

**Domanda:** Nel sistema con NT forzante, l'appoggio a 2 nel nobile mostra:

**Opzioni:**
- 5-9 punti con fit terzo
- 8-10 punti, COSTRUTTIVO, normalmente fit terzo ✅
- 0-7 punti barrage
- 12+ punti con fit

**Spiegazione:** Nel sistema NT forzante, l'appoggio a 2 è COSTRUTTIVO: 8-10 punti, normalmente fit terzo. Le mani più deboli con fit passano da 1NT forzante e poi riportano a 2.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1611`

**Domanda:** Dopo intervento avversario, 2NT Truscott diventa:

**Opzioni:**
- Invitante come senza intervento
- ILLIMITATA (11+), con fit quarto o più ✅
- Naturale, proposta di giocare a Senza
- Non più utilizzabile

**Spiegazione:** Dopo intervento a colore, 2NT Truscott diventa illimitata (11+) con almeno fit quarto. La surlicita invece mostra fit TERZO illimitato (11+).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1624`

**Domanda:** Con fit quinto nel nobile del partner e 2NT Truscott accettato, cosa fate?

**Opzioni:**
- Passate a 3 nel nobile
- Rialzate comunque a manche (10 carte = 10 prese) ✅
- Dite 3NT per giocare a Senza
- Fate la Stayman

**Spiegazione:** Con fit quinto: usate 2NT e poi rialzate a manche comunque (10 carte in linea = 10 prese secondo la Legge delle Prese Totali).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 212: Interventi speciali e difese

### Q1

`src/data/comprensione-data.ts:1645`

**Domanda:** L'intervento 2NT dopo apertura avversaria di 1C o 1P mostra:

**Opzioni:**
- Bilanciata forte (15-17 punti)
- Bicolore minore almeno 5-5 con buoni colori (Michael's/Ghestem) ✅
- Invito naturale a 3NT
- Due maggiori 5-5

**Spiegazione:** Dopo 1C o 1P avversario, 2NT mostra bicolore minore almeno 5-5 con buoni colori. NON una bilanciata forte (per quella si usa Contro poi rimozione).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1658`

**Domanda:** L'intervento convenzionale 2F (Landy) su apertura avversaria di 1NT mostra:

**Opzioni:**
- 6+ carte di Fiori
- Almeno 5/4 nelle nobili (Cuori + Picche) con 9/10+ punti ✅
- Bicolore minore
- Bilanciata di 12-14 punti

**Spiegazione:** Landy: 2F su 1NT avversario mostra almeno 5/4 nelle nobili con 9/10+ punti. Il compagno sceglie il maggiore preferito (2Q chiede il nobile più lungo).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1671`

**Domanda:** Sulla difesa contro la 2Q Multicolor avversaria, il Contro immediato mostra:

**Opzioni:**
- Mano generica forte
- Le Picche (passo poi contra = Picche)
- Le Cuori: informativo con 12+ punti e Cuori ✅
- Bicolore minore

**Spiegazione:** Sulla 2Q Multicolor: Contro immediato = cuori (12+ punti). Per le picche: Passo seguito da Contro. Il principio: ci si comporta come se l'avversario avesse sottoaperto a 2P.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---


## Lezione 213: Casi particolari dopo le risposte 1 su 1

### Q1

`src/data/comprensione-data.ts:1692`

**Domanda:** L'apertore con 5332 e 17-18 punti, dopo risposta 1 su 1, ridichiara:

**Opzioni:**
- 1NT (12-14)
- 2NT (Rever a Senza: 17-18 con 5332) ✅
- 3NT (19-20)
- Ripete il suo colore

**Spiegazione:** Il Rever a Senza: 2NT dopo 1 maggiore - 1x mostra 5332 di 17-18. Conseguenza: chi apre 1NT con nobile quinto ha il punteggio minimo (15-16).

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q2

`src/data/comprensione-data.ts:1705`

**Domanda:** L'avversario interviene (effetto sponda) e l'apertore appoggia direttamente a 2 nel nobile di risposta. Questo mostra:

**Opzioni:**
- Mano minima qualsiasi
- Fit quarto con mano normale ✅
- Mano forte di 16+ punti
- Passo forzato dal regolamento

**Spiegazione:** L'appoggio immediato dopo intervento = fit quarto. L'apertore non è obbligato a parlare (effetto sponda), quindi ogni dichiarazione è 'speciale'. L'appoggio a 2 = fit quarto, mano normale.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

### Q3

`src/data/comprensione-data.ts:1718`

**Domanda:** Dopo 1Q-P-1C-1P, l'apertore passa. Il rispondente con 8+ punti usa il Contro. Cosa chiede?

**Opzioni:**
- Di punire 1P
- All'apertore di descriversi (Contro competitivo del rispondente) ✅
- Di giocare a SA
- Di cambiare colore

**Spiegazione:** Dopo che l'apertore è passato sull'intervento del 4o di mano, il Contro del rispondente (7/8+ punti) chiede all'apertore di descriversi: non è punitivo, è competitivo.

**Review esperto:** ☐ OK ☐ Da correggere → _note_

---

