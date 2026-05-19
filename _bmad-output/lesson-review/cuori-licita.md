# Review esperto — Corso Cuori - Licita Avanzata

> Documento generato automaticamente.
> Sorgente: `src/data/cuori-licita-lessons.ts`
> Per ogni voce, segna ✅ OK o annota la correzione.


## Lezione 200: La Legge delle Prese Totali

_Dichiarare in base al numero di atout in linea_


### Modulo 200-1: La Legge fondamentale

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:48`

**Testo:** NS ha 8 picche e realizza 7 prese. EO ha 8 cuori e realizza 9 prese. Totale: 16 prese = 16 atout (8+8). Spostando un onore da una linea all'altra, l'attribuzione cambia ma il totale resta 16.

**Mano(i):** `♠QJ104 ♥654 ♦A43 ♣Q86`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/cuori-licita-lessons.ts:65`

**Domanda:** Secondo la Legge delle Prese Totali, se NS ha 9 picche e EO ha 8 cuori, quante sono le Prese Totali?

**Opzioni:**
- 15
- 16
- 17 ✅
- 18

**Spiegazione:** Le Prese Totali sono 9 + 8 = 17. NS, giocando a Picche, può aspettarsi circa 9 prese; EO circa 8.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (true-false) — `src/data/cuori-licita-lessons.ts:74`

**Domanda:** Secondo la Legge, spostando un Re da una linea all'altra il numero totale di prese cambia.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! La Legge è indifferente alla posizione degli onori: il totale delle prese resta invariato, cambia solo l'attribuzione tra le due coppie.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 200-2: Dichiarare sotto la protezione della Legge

#### Esempio 2 — `src/data/cuori-licita-lessons.ts:100`

**Testo:** Tutti in prima, siete in Est. Sud 1♣, Ovest 1♠, Nord Dbl. Con 8 atout in linea, dichiarate 2♠:

**Mano(i):** `♠Qxx ♥xx ♦Kxxxx ♣xxx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (bid-select) — `src/data/cuori-licita-lessons.ts:116`

**Domanda:** Il compagno apre 1♠ e l'avversario interviene 2♥. Avete: ♠K9854 ♥7 ♦Q762 ♣743. Cosa dichiarate?

**Opzioni:**
- 2♠
- 3♠
- 4♠ ✅
- Passo

**Spiegazione:** 4♠! Dieci carte in linea, dieci prese. Anche se andate sotto di 1 o 2, è un affare rispetto alla manche avversaria a Cuori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 200-3: Distribuzioni piatte e competitivo vs invitante

#### Esempio 2 — `src/data/cuori-licita-lessons.ts:143`

**Testo:** Tutti in zona. 1♣-1♠-Dbl-? Con distribuzione 4333, dichiarate solo 2♠, non 3♠!

**Mano(i):** `♠K963 ♥Q82 ♦874 ♣K92`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-licita-lessons.ts:159`

**Domanda:** Il compagno apre 1♥, l'avversario interviene 1♠. Avete: ♠65 ♥AQ65 ♦97643 ♣54. Cosa dichiarate?

**Opzioni:**
- 2♥
- 3♥ (Prese Totali) ✅
- 2♠ (surlicita)
- 4♥

**Spiegazione:** 3♥: avete nove atout in linea (5+4), nove prese. Non è un invito a manche ma una dichiarazione competitiva secondo la Legge.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-licita-lessons.ts:168`

**Domanda:** Con distribuzione 4333 e fit quarto, il principio 'nove carte nove prese' funziona sempre bene.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Le distribuzioni piatte 4333 e 5332 riducono la resa di taglio. Bisogna agire con prudenza, perché nella spartizione delle Prese Totali saremo svantaggiati.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 201: Valutazioni: le lunghe e le corte

_Singoli, lunghe e rivalutazione della mano_


### Modulo 201-1: Il valore dei singoli e delle corte

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:212`

**Testo:** Ovest apre 1♦, poi dice 1♠, poi 3♣. Est deduce il singolo a cuori e sa che tutti i suoi punti sono utili:

**Mano(i):** `♠Axxx ♥xxxx ♦Qxx ♣Qx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/cuori-licita-lessons.ts:229`

**Domanda:** Il compagno apre 1♠ e voi avete: ♠Axxx ♥KQxx ♦xxx ♣xx. Ha poi mostrato singolo a cuori con la sequenza 1♠-2♣-3♦. Come valutate i vostri KQxx di cuori?

**Opzioni:**
- Eccellenti, danno prese in attacco
- Inutili, fronteggiano il singolo del compagno ✅
- Buoni solo in difesa
- Indifferenti

**Spiegazione:** KQ di fronte al singolo del compagno sono inutili in attacco: non potranno mai fare prese, perché il compagno taglia al primo giro. Sono un valore solo difensivo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 201-2: Le monocolori di 7+ carte

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:266`

**Testo:** Il vostro apre 2NT e voi avete un punto e una settima nobile: dichiarate 4♥!

**Mano(i):** `♠763 ♥J1076542 ♦- ♣864`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (bid-select) — `src/data/cuori-licita-lessons.ts:277`

**Domanda:** Ovest apre 1♣, Est risponde 1♠, Ovest 2♣. Est ha: ♠K9765432 ♥A52 ♦4 ♣2. Cosa dice?

**Opzioni:**
- 3♠
- 4♠ ✅
- 2♠
- 2NT

**Spiegazione:** 4♠! Avete un'ottava e verosimilmente 8 prese di gioco. Non umiliate queste carte: ci sono contratti che vanno dichiarati a spanne.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-licita-lessons.ts:286`

**Domanda:** Con una settima maggiore e una quarta a fianco, conviene sempre mostrare entrambi i colori al compagno.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Le 7/4 sono mani MONOCOLORI. La convenienza ad offrire una scelta è solo apparente. Il colore settimo dovrebbe prevalere quasi sempre.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 202: Le Texas su apertura 1NT e 2NT

_Jacoby Transfer e Transfer per i minori_


### Modulo 202-1: Le Jacoby Transfer

#### Esempio 4 — `src/data/cuori-licita-lessons.ts:335`

**Testo:** Dopo 1NT-2♦-2♥, le opzioni del rispondente sono:

**Mano(i):** `♠43 ♥Q10754 ♦5432 ♣93`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (bid-select) — `src/data/cuori-licita-lessons.ts:346`

**Domanda:** Il compagno apre 1NT. Avete: ♠42 ♥AKJ743 ♦732 ♣42. Cosa dichiarate?

**Opzioni:**
- 2♥
- 2♦ ✅
- 4♥
- 3♥

**Spiegazione:** 2♦! È il transfer per le Cuori. Il compagno dichiarerà 2♥ e sarà lui a giocarle, proteggendo i suoi valori dall'attacco. Poi direte 4♥.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (quiz) — `src/data/cuori-licita-lessons.ts:355`

**Domanda:** Perché il Transfer è preferibile alla dichiarazione diretta del colore?

**Opzioni:**
- Mostra più punti
- Orienta il gioco dalla mano forte e moltiplica le licite ✅
- Impedisce l'intervento avversario
- Mostra sempre lo slam

**Spiegazione:** I Transfer orientano il gioco dalla mano forte (proteggendo i valori) e funzionano da moltiplicatori di licite, consentendo sempre una seconda dichiarazione.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 202-2: Transfer per i minori e Stayman avanzata

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:392`

**Testo:** 1NT-2♠(Fiori): Ovest con ♠A972 ♥K4 ♦KQ73 ♣K75 dirà 2NT (ha K♣). Con ♠AK2 ♥KJ94 ♦AQ7 ♣875 dirà 3♣ (no onori a Fiori).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-licita-lessons.ts:402`

**Domanda:** Dopo 1NT, avete: ♠AK863 ♥4 ♦AKJ4 ♣752. Se usate il Transfer 2♥, dopo 2♠ non avrete più licita adatta. Quale via è corretta?

**Opzioni:**
- Transfer 2♥ poi 3♦
- Stayman 2♣ poi dichiarare le picche ✅
- 3NT diretto
- 4♠ diretto

**Spiegazione:** La via giusta è la Stayman! Potrete dire 2♠ su qualsiasi risposta, e se l'apertore nega fit con 2NT direte 3♦ forzante. Il Transfer vi avrebbe bloccato.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-licita-lessons.ts:416`

**Domanda:** Dopo un Transfer, il 4NT è Blackwood (richiesta d'Assi).

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Dopo un Transfer, il 4NT descrive una 5332 ed è un quantitativo (tentativo di 6NT), NON richiesta d'Assi.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 203: Sviluppi dopo le risposte 2 su 1

_Forzante manche e ridichiarazioni dell'apertore_


### Modulo 203-1: Principi del 2 su 1 e ridichiarazioni

#### Esempio 4 — `src/data/cuori-licita-lessons.ts:465`

**Testo:** Dopo 1♥-2♣, Ovest ripete 2♥ anche con ♠Qx ♥AJxxxx ♦AK ♣Kxx. Perché non c'è fretta: il colore di atout per lo Slam potrebbe essere Fiori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-licita-lessons.ts:470`

**Domanda:** Dopo 1♥-2♦, l'apertore ha: ♠KJx ♥Kxxxx ♦xx ♣AQx. Cosa ridichiara?

**Opzioni:**
- 2♥
- 2NT ✅
- 2♠
- 3♣

**Spiegazione:** 2NT! Mostra bilanciata di diritto (12-14) con fermi negli altri colori, giocati dalla propria parte. È l'unica replica che limita la mano.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 203-2: Le indagini del Rispondente

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:502`

**Testo:** 1♠-2♣: Est ha ♠KQ74 ♥A9 ♦A6 ♣KQ983. Dopo 2♥-2♠-3♣, Est fissa le picche con 3♠, mostrando obiettivo Slam.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (bid-select) — `src/data/cuori-licita-lessons.ts:507`

**Domanda:** Dopo 1♠-2♣-2♥, avete: ♠5 ♥K52 ♦A1097 ♣KQJ52. Cosa dichiarate?

**Opzioni:**
- 2NT ✅
- 3♥
- 2♠
- 3NT

**Spiegazione:** 2NT per sentire ancora la descrizione dell'apertore! Ovest potrebbe ripetere le Cuori (quinta), dire 3NT (5422), mostrare la sesta di Picche (3♠), o dire 3♣ mostrando corta a Quadri.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/cuori-licita-lessons.ts:516`

**Domanda:** In situazione forzante di manche, se il rispondente conclude a 3NT e l'apertore ha mano forte (17+), l'apertore deve passare.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! L'apertore può riaprire: 4NT è quantitativo (non Blackwood) se ha 17+ con 5422 senza fit. Può anche dire 4 nel colore del rispondente se ha fit e mano forte.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 204: Accostamento a Slam: fissare l'atout

_Terreno solido e non solido per lo Slam_


### Modulo 204-1: Terreno solido e non solido

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:560`

**Testo:** Terreno solido: (1) 1♥-2♣ già FM. (2) 2♠-3♠: Ovest ha 21+ da solo. (3) 1♦-1♠-2♥-3♥: Rever 16+ e risposta 5+. (4) 1NT-2♣-2♠-3♠: Ovest 15+ e Est 8+.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-licita-lessons.ts:570`

**Domanda:** Dopo la sequenza 1♥-1♠-2♦-3♥, il 3♥ è forzante?

**Opzioni:**
- Sì, perché ha fissato l'atout
- No, perché non c'era certezza di 21+ punti in linea ✅
- Sì, perché è una risposta 2 su 1
- Dipende dalla zona

**Spiegazione:** Dopo 1♥-1♠-2♦, la coppia non ha certezza di possedere 21+ punti: il terreno non è solido, quindi 3♥ è un invito passabile.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 204-2: Il quarto colore e la competizione

#### Esempio 2 — `src/data/cuori-licita-lessons.ts:602`

**Testo:** 1♣-1♥-1♠: Est ha ♠AK97 ♥AQ753 ♦A7 ♣86. Non deve dire 3♠ immediato (invitante!). Dice 2♦ (quarto colore), poi 3♠, chiarendo atout e obiettivo Slam.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (bid-select) — `src/data/cuori-licita-lessons.ts:612`

**Domanda:** 1♦-1♥-2♥: Est ha ♠AK7 ♥KQ753 ♦K7 ♣J86. Ovest mostra 3♣. Cosa fate?

**Opzioni:**
- 3♥ (tentativo fallito)
- 3♦ (forzante, cerco slam) ✅
- 4♥
- 3NT

**Spiegazione:** 3♦ è forzante in quanto illogico (il fit è cuori). Potete poi mostrare la cue bid a 3♠. Se diceste 3♥ significherebbe 'tentativo fallito, giochiamo 3♥'.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 205: Accostamento a Slam: le Cue Bid

_Controlli, livelli di guardia e fasi dello Slam_


### Modulo 205-1: Le quattro regole delle Cue Bid

#### Esempio 4 — `src/data/cuori-licita-lessons.ts:667`

**Testo:** 1♥-2♣-2♥-3♥: Ovest ha ♠6 ♥AJ10872 ♦942 ♣AK2. Deve dire 3♠ (singolo, cue più economica) e NON 4♣ (salterebbe le picche).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-licita-lessons.ts:672`

**Domanda:** Dopo 2♠*-3♠-4♦-4♠, cosa mostra il 4♦ di Est?

**Opzioni:**
- Controllo a quadri e anche a fiori (saltato) ✅
- Solo controllo a quadri
- Fermo a quadri
- Vuoto a fiori

**Spiegazione:** Attenzione: il 4♦ ESCLUDE controllo a fiori (regola 3: cue saltata non c'è). Se Est non ha neppure il controllo fiori, deve riportare a 4♠ senza mostrare il cuori!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 205-2: Le fasi dell'accostamento a Slam

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:709`

**Testo:** 1♥-2♣-2♠-3♠-4♣-4♦-4♥-4♠-4NT-5♦-6♠: il primo giro di cue bid (4♣, 4♦) è sotto il livello di guardia. 4♥ frenata = tentativo minimo. Ma Ovest, che non ha mostrato la forza, prende l'iniziativa.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/cuori-licita-lessons.ts:720`

**Domanda:** Se un giocatore ha mano minima, può rifiutarsi di fare cue bid sotto il livello di manche per scoraggiare il compagno.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Sotto il livello di manche le cue bid sono OBBLIGATORIE. Negarle porterebbe il compagno a conclusioni errate sulla posizione dei controlli.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 206: Le Sottoaperture

_Aperture deboli di 2♦, 2♥ e 2♠ (6-10 punti)_


### Modulo 206-1: Requisiti delle sottoaperture

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:763`

**Testo:** Esempi di sottoaperture corrette:

**Mano(i):** `♠KQ10763 ♥65 ♦K93 ♣J2`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (bid-select) — `src/data/cuori-licita-lessons.ts:774`

**Domanda:** Avete: ♠AQxxxx ♥x ♦Axx ♣xxx. Aprite di:

**Opzioni:**
- 2♠
- 1♠ ✅
- Passo
- 3♠

**Spiegazione:** 1♠! La mano ha abbondantemente due prese certe di controgioco; non assomiglia a una sottoapertura. Con ♠KQxxxx ♥QJ ♦Jxx ♣Jx (10 punti ma senza prese di controgioco) potreste invece sottoaprire.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 206-2: Le risposte e la convenzione Ogust

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:806`

**Testo:** Su apertura 2♠, compagno interroga con 2NT. Avete: ♠KQ9753 ♥87 ♦A84 ♣97. Massimo e bello: rispondete 3♠.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-licita-lessons.ts:811`

**Domanda:** Su apertura 2♠-2NT (Ogust), con ♠Q109753 ♥87 ♦K84 ♣Q7, cosa rispondete?

**Opzioni:**
- 3♣ ✅
- 3♦
- 3♥
- 3♠

**Spiegazione:** 3♣: punteggio minimo (8 punti) e colore brutto (solo la Q come onore maggiore, senza il 10). Il colore 'bello' richiederebbe 2 onori maggiori o A/K accompagnato da J10.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/cuori-licita-lessons.ts:820`

**Domanda:** Dopo una sottoapertura, con 12-13 punti e nessun fit, il Rispondente deve comunque dichiarare.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Se il fit è inesistente bisogna avere il coraggio di passare, anche con 12-14 punti. Valori di apertura con fit secondo bastano appena per mantenere il contratto già dichiarato.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 207: L'apertura di 2♣ forte indeterminata

_Gestire tutte le mani forti con 2♣_


### Modulo 207-1: Struttura del 2♣ e risposte

#### Esempio 4 — `src/data/cuori-licita-lessons.ts:869`

**Testo:** 2♣-2♦-3♠: l'atout è imposto. Est mostra l'unica cue bid (4♥), Ovest conclude a 4♠ sapendo che ci sono 2 quadri da perdere.

**Mano(i):** `♠AKQJ763 ♥A ♦87 ♣AKQ`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-licita-lessons.ts:875`

**Domanda:** Il partner apre 2♣. Avete: ♠108653 ♥KQJ ♦73 ♣Q82. Cosa rispondete?

**Opzioni:**
- 2♠
- 2♦ ✅
- 2NT
- 3♠

**Spiegazione:** 2♦ (attesa)! Le picche hanno 5 carte ma manca l'onore (solo il 10). Per rispondere 2♠ servono almeno 5 carte capeggiate da un onore (A o K, o almeno Q).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 207-2: Intervento avversario su 2♣

#### Blocco 3 (bid-select) — `src/data/cuori-licita-lessons.ts:907`

**Domanda:** Il partner apre 2♣ e l'avversario interviene 4♠. Avete: ♠32 ♥K1063 ♦Q53 ♣QJ52. Cosa fate?

**Opzioni:**
- Contro
- Passo ✅
- 5♥
- 4NT

**Spiegazione:** Passo! A livello alto il Passo mostra carte utili per il gioco dell'Apertore. Il Contro mostrerebbe mano nulla. Qui avete valori che possono aiutare il compagno.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 208: Competitivo, costruttivo, interdittivo

_I tre messaggi fondamentali della dichiarazione_


### Modulo 208-1: Distinguere i tre messaggi

#### Esempio 2 — `src/data/cuori-licita-lessons.ts:947`

**Testo:** 1♠-2♥-2♠-3♥. Sud ha tre opzioni: con ♠KQJ76 ♥75 ♦KQJ9 ♣32 dice 3♠ (competitivo). Con ♠AKQ876 ♥2 ♦KQ92 ♣32 dice 4♠ (interdittivo). Con ♠A8762 ♥A5 ♦AQ2 ♣KJ2 dice Contro (costruttivo).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-licita-lessons.ts:957`

**Domanda:** Dopo 1♣-P-1♥-1♠-2♥-2♠, Nord ha: ♠63 ♥AQ87 ♦KJ5 ♣9865. Cosa dichiara?

**Opzioni:**
- 3♥
- Contro ✅
- Passo
- 4♥

**Spiegazione:** Contro! Rappresenta 'un gran bel 3♥' costruttivo, tendenzialmente bilanciato. Se dicesse 3♥ sarebbe competitivo (e l'apertore passerebbe anche con 14). Il Contro invita a manche.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 208-2: Riconoscere e applicare i tre messaggi

#### Blocco 3 (bid-select) — `src/data/cuori-licita-lessons.ts:989`

**Domanda:** 1♥-P-2♥-P-3♥. Questo rialzo di Sud è un invito a manche?

**Opzioni:**
- Sì, invita a manche
- No, è interdittivo: mostra maggior lunghezza secondo la Legge ✅
- No, è competitivo
- Sì, è costruttivo

**Spiegazione:** No! Per un invito Sud aveva a disposizione 2NT, 2♠, 3♣, 3♦. Il solo motivo per salire a 3 è mostrare maggior lunghezza (Legge) e rendere impossibile un rientro tardivo avversario.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (true-false) — `src/data/cuori-licita-lessons.ts:1003`

**Domanda:** Una dichiarazione a salto in situazione di appoggio è sempre interdittiva, mai costruttiva.

**Risposta corretta:** Vero ✅

**Spiegazione:** Vero! Le dichiarazioni interdittive sono SEMPRE caratterizzate da un annuncio a salto. I messaggi costruttivi usano altri mezzi: contro, surlicita, cambio di colore forcing.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 209: Mani di fit nel nobile: standard

_Appoggi barrage, 2NT Truscott e 1NT semiforzante_


### Modulo 209-1: Appoggi barrage e 2NT Truscott

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:1046`

**Testo:** Su 1♥, risposte con il nuovo sistema:

**Mano(i):** `♠854 ♥10862 ♦2 ♣KJ743`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (bid-select) — `src/data/cuori-licita-lessons.ts:1057`

**Domanda:** Il compagno apre 1♠. Avete: ♠A974 ♥2 ♦AJ976 ♣943. Cosa rispondete?

**Opzioni:**
- 2♠
- 2NT (Truscott) ✅
- 3♠
- 4♠

**Spiegazione:** 2NT Truscott! Fit quarto con una corta e carte di testa (A+A = 8 punti che si rivalutano). È un serio invito a manche nel nobile.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 209-2: La risposta 1NT semiforzante

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:1089`

**Testo:** 1♥-1NT: Ovest con ♠K2 ♥AJ1087 ♦KQ8 ♣J104 (14 punti, 3-3 minore) inventa 2♣ per trovare il miglior parziale. Est passa con ♠873 ♥92 ♦J54 ♣KQ972.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (true-false) — `src/data/cuori-licita-lessons.ts:1094`

**Domanda:** Su intervento avversario a colore dopo apertura nobile, il 2NT Truscott promette almeno QUATTRO carte di appoggio e diventa illimitato (11+).

**Risposta corretta:** Vero ✅

**Spiegazione:** Vero! In competizione il 2NT Truscott richiede fit quarto (non terzo) e diventa illimitato. La surlicita, in alternativa, mostra fit TERZO ed è anch'essa illimitata (11+).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 210: Mani di fit nel nobile: Bergen

_Appoggi Bergen 3♣/3♦, 1NT forzante e 2NT Truscott_


### Modulo 210-1: Appoggi Bergen e 1NT forzante

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:1137`

**Testo:** Su 1♥:

**Mano(i):** `♠J2 ♥Q872 ♦KQ63 ♣985`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (bid-select) — `src/data/cuori-licita-lessons.ts:1148`

**Domanda:** Il compagno apre 1♠, voi avete: ♠QJ2 ♥AJ86 ♦32 ♣J852. Cosa rispondete?

**Opzioni:**
- 2♠
- 3♣ (Bergen) ✅
- 3♦ (Bergen)
- 2NT (Truscott)

**Spiegazione:** 3♣ Bergen: fit quarto nel maggiore e punteggio 7-9 (qui avete 8 punti). È una mano un po' più solida dell'appoggio barrage a 3♠.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 210-2: Il Senza forzante e il 2NT Truscott

#### Blocco 3 (quiz) — `src/data/cuori-licita-lessons.ts:1180`

**Domanda:** Dopo 1♠-3♣ (Bergen 7-9), l'apertore ha ♠AKQ82 ♥3 ♦A654 ♣K72. Cosa fa?

**Opzioni:**
- 3♦ (Trial, invito a manche)
- 3♠ (rifiuta l'invito)
- 3♥ (cue bid, obiettivo slam) ✅
- 4♠

**Spiegazione:** 3♥! Un colore al di sopra del 3♠ in atout rende obbligatoria la manche, quindi è cue bid per lo Slam. L'apertore ha una mano così forte da pensare allo slam anche a fronte di 7-9.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 211: Mani di fit nel nobile: appoggi costruttivi

_Appoggio costruttivo a 2, 1NT forzante e 2NT Truscott_


### Modulo 211-1: Appoggio costruttivo e 2NT Truscott

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:1230`

**Testo:** Su 1♥: ♠Q984 ♥A83 ♦876 ♣Q83 -> 2♥ (costruttivo, fit 3, 8-10). ♠54 ♥Q1062 ♦KJ6 ♣A1043 -> 2NT Truscott (fit 4, invito). ♠854 ♥10862 ♦2 ♣KJ743 -> 3♥ barrage.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-licita-lessons.ts:1235`

**Domanda:** Il compagno apre 1♠. Avete: ♠K94 ♥83 ♦A10965 ♣983 (7 punti onori con A+K da rivalutare, fit terzo). Cosa rispondete?

**Opzioni:**
- 1NT (poi 2♠)
- 2♠ ✅
- 2NT
- Passo

**Spiegazione:** 2♠ costruttivo! A+K sono punti di testa che si rivalutano. Anche se l'onore-conteggio è 7, la qualità dei punti (due Assi/Re) giustifica l'appoggio costruttivo 8-10.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 212: Interventi speciali e difese

_Michael's, Ghestem e interventi su 1NT_


### Modulo 212-1: Michael's e Ghestem

#### Blocco 4 (bid-select) — `src/data/cuori-licita-lessons.ts:1285`

**Domanda:** L'avversario apre 1♠. Avete: ♠8 ♥AK985 ♦76 ♣KQ1075. Con le Michael's, cosa dichiarate?

**Opzioni:**
- 2♠ (surlicita) ✅
- 2NT
- 3♣
- Contro

**Spiegazione:** 2♠ surlicita! Mostra l'altro nobile (♥) + un minore sconosciuto (♣ in questo caso). Se il compagno vuole conoscere il minore, chiederà 2NT.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 212-2: Interventi su 1NT e aperture speciali

#### Blocco 4 (quiz) — `src/data/cuori-licita-lessons.ts:1322`

**Domanda:** L'avversario apre 2♥ (sottoapertura). Avete: ♠AJ97 ♥J8 ♦AQ84 ♣K65. Cosa dichiarate?

**Opzioni:**
- 2♠
- Contro ✅
- 2NT
- Passo

**Spiegazione:** Contro informativo! Mostra 4/5 carte nell'altro nobile (Picche) e tolleranza degli altri colori. Con 2NT mostrerete bilanciata 16/17; qui avete solo 14 ma ottima distribuzione per il Contro.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 213: Casi particolari dopo le risposte 1 su 1

_Rever a Senza, dichiarazioni libere e dopo il Contro_


### Modulo 213-1: Il Rever a Senza

#### Esempio 3 — `src/data/cuori-licita-lessons.ts:1367`

**Testo:** 1♦-1♥-3NT: mostra fit quarto a cuori e bilanciata 18-20. Quindi 4♣ e 4♦ dopo sono cue-bid per lo Slam a Cuori!

**Mano(i):** `♠A98 ♥Q1073 ♦AKJ2 ♣KJ`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-licita-lessons.ts:1378`

**Domanda:** Dopo 1♣-1♥-2NT, il 2NT esclude fit quarto a cuori. Se Nord ha ♠xx ♥K109xxx ♦xx ♣Jxx, cosa dichiara?

**Opzioni:**
- 3♥ (a passare) ✅
- 3NT
- Passo
- 4♥

**Spiegazione:** 3♥ a passare! Con carte con cui la manche pare del tutto improbabile, la ripetizione del colore è non forzante. L'apertore può passare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 213-2: Dichiarazioni libere dopo intervento

#### Blocco 4 (bid-select) — `src/data/cuori-licita-lessons.ts:1415`

**Domanda:** Dopo 1♦-P-1♥-1♠-P-P, avete (Nord): ♠xxx ♥KJxxx ♦Axx ♣Jx. Cosa dichiarate?

**Opzioni:**
- 2♥
- Contro ✅
- 1NT
- Passo

**Spiegazione:** Contro di riapertura! Garantisce almeno 7/8 punti e chiede all'apertore di continuare a descriversi. L'apertore potrà dire NT con bilanciata 12-14 e fermo, o ripetere il colore, o appoggiare le cuori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/cuori-licita-lessons.ts:1424`

**Domanda:** Il Contro dell'apertore dopo intervento avversario garantisce sempre tolleranza del colore di risposta.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Il Contro dell'apertore NON garantisce tolleranza del colore di risposta. Però: tanto minore è la tolleranza, tanto maggiore è la forza della mano.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

