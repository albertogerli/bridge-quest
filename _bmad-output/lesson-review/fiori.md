# Review esperto — Corso Fiori (lezioni base)

> Documento generato automaticamente.
> Sorgente: `src/data/lessons.ts`
> Per ogni voce, segna ✅ OK o annota la correzione.


## Lezione 0: Il Bridge: un gioco di prese

_Le basi fondamentali del gioco_


### Modulo 0-1: Il mazzo francese

#### Esempio 4 — `src/data/lessons.ts:97`

**Testo:** Una mano di esempio:

**Mano(i):** `♠J8 ♥AQJ43 ♦KQ3 ♣A98`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/lessons.ts:107`

**Domanda:** Quante carte ha ogni giocatore in una mano di bridge?

**Opzioni:**
- 10
- 12
- 13 ✅
- 15

**Spiegazione:** Ogni giocatore riceve esattamente 13 carte. 52 carte divise tra 4 giocatori = 13 ciascuno.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (true-false) — `src/data/lessons.ts:115`

**Domanda:** Il Dieci è considerato un onore nel bridge.

**Risposta corretta:** Vero ✅

**Spiegazione:** Sì! Gli onori sono: Asso, Re, Dama, Fante e Dieci. Le carte dal 9 al 2 sono cartine.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 0-2: La presa

#### Blocco 6 (quiz) — `src/data/lessons.ts:161`

**Domanda:** Se Ovest gioca il Re di Picche e tu non hai Picche, cosa puoi fare?

**Opzioni:**
- Devi passare il turno
- Puoi scartare una carta di un altro seme ✅
- Devi giocare un Asso
- Puoi giocare qualsiasi carta e vincere

**Spiegazione:** Quando non hai carte del seme giocato, puoi scartare qualsiasi carta di un altro seme, ma non puoi vincere la presa (a meno che non ci sia un atout).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (card-select) — `src/data/lessons.ts:174`

**Domanda:** Ovest attacca con ♠K. Nord gioca ♠3. Est gioca ♠7. Quale carta giochi da Sud per vincere la presa?

**Mano:** `♠A♠Q♠5♠2`

**Risposta corretta:** `♠A` ✅

**Spiegazione:** L'Asso è l'unica carta che batte il Re con certezza. Non sprecare la Dama quando il Re è già in tavola!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 0-3: Il Morto e il Vivo

#### Blocco 4 (quiz) — `src/data/lessons.ts:211`

**Domanda:** Quante carte può vedere il Giocante (Dichiarante)?

**Opzioni:**
- 13
- 26 ✅
- 39
- 52

**Spiegazione:** Il Giocante vede le proprie 13 carte più le 13 carte del morto = 26 carte totali.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/lessons.ts:219`

**Domanda:** Il morto può scegliere autonomamente quale carta giocare.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Il morto non sceglie: è il Giocante (Dichiarante) che decide quale carta giocare dalla mano del morto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 0-4: L'atout e il Senza Atout

#### Blocco 4 (quiz) — `src/data/lessons.ts:254`

**Domanda:** Se il contratto è a Cuori (atout) e non hai Picche, cosa puoi fare quando viene giocata una Picca?

**Opzioni:**
- Solo scartare
- Tagliare con una carta di Cuori ✅
- Giocare una Picca dal morto
- Passare il turno

**Spiegazione:** Se non hai carte del seme giocato e c'è un atout, puoi tagliare con una carta di atout per vincere la presa!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 0-5: L'asta e il contratto

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Chi espone il cartellino di "2♥" sta dicendo: "la mia coppia si impegna a realizzare almeno 8 prese, purché il colore di cuori sia atout".

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/lessons.ts:305`

**Domanda:** Se un giocatore dichiara 1♥, quale delle seguenti dichiarazioni è valida per il giocatore successivo?

**Opzioni:**
- 1♦
- 1♣
- 1♠ ✅
- 1♥

**Spiegazione:** 1♠ è valida perché le Picche hanno rango superiore ai Cuori. 1♦ e 1♣ sono di rango inferiore e richiederebbero il livello 2.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (bid-select) — `src/data/lessons.ts:313`

**Domanda:** L'avversario apre 1♦. Tu hai una bella mano. Quale di queste dichiarazioni è VALIDA?

**Opzioni:**
- 1C
- 1D
- 1H ✅
- P

**Spiegazione:** 1♥ è valida perché i Cuori hanno rango superiore ai Quadri. 1♣ e 1♦ sarebbero allo stesso livello o inferiore!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 0-6: Il punteggio

#### Blocco 5 (quiz) — `src/data/lessons.ts:353`

**Domanda:** Quante prese deve fare la coppia per mantenere un contratto di 3NT?

**Opzioni:**
- 3
- 6
- 9 ✅
- 13

**Spiegazione:** 3NT = 3 + 6 = 9 prese. Il numero del contratto + 6 (le prese "gratuite") = prese necessarie.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 1: Vincenti e affrancabili

_Imparare a contare le prese_


### Modulo 1-1: Carte vincenti

#### Esempio 2 — `src/data/lessons.ts:390`

**Testo:** Tra Picche e Cuori:

**Mano(i):** `♠AK32 ♥KQJ10`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:405`

**Domanda:** Quante vincenti immediate ci sono in questa mano? ♠KQ65 ♥AKJ3 ♦K4 ♣AKQ

**Opzioni:**
- 5 ✅
- 7
- 8
- 9

**Spiegazione:** Picche: 0 (manca l'Asso), Cuori: 2 (A e K, il J non è garantito), Quadri: 0 (manca l'Asso), Fiori: 3 (AKQ) = totale 5... ma attenzione: dipende anche dalle carte del morto!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (card-select) — `src/data/lessons.ts:413`

**Domanda:** Hai ♣KQJ10 e vuoi affrancare le Fiori. Quale carta giochi per prima?

**Mano:** `♣K♣Q♣J♣10`

**Risposta corretta:** `♣K` ✅

**Spiegazione:** Giochi il Re (il più alto della sequenza). Così forzi l'Asso avversario e le altre carte si affranqueranno.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (true-false) — `src/data/lessons.ts:420`

**Domanda:** Una sequenza ♠KQJ è equivalente a una sequenza ♠AKQ per l'affrancamento.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! ♠AKQ sono già vincenti. ♠KQJ devono prima "costringere" l'avversario a usare l'Asso prima di affrancarsi.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 1-3: Affrancare per forza

#### Esempio 4 — `src/data/lessons.ts:487`

**Testo:** Primi colori da muovere - quelli che ci danno più carte affrancate:

**Mano(i):** `♠AQ8 ♥76 ♦K65 ♣K10932`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-1-1: 📝 Domande su vincenti e scarti

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Quand'è che un giocatore scarta?

**Opzioni:**
- Quando non ha più carte per rispondere nel seme dominante della presa in corso ✅
- Quando vuole liberarsi di una carta inutile
- Quando ha solo carte basse
- Mai, non è permesso scartare

**Spiegazione:** Si scarta quando non si hanno più carte nel seme dominante della presa in corso.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Quand'è che il primo di mano scarta?

**Opzioni:**
- Quando vuole
- Mai! Il primo di mano gioca nel seme che preferisce ✅
- Solo quando ha carte basse
- Solo in difesa

**Spiegazione:** Mai! Il primo di mano non scarta: è lui a decidere il seme della presa.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord ha: ♠AKQJ. Quante di queste carte sono affrancabili?

**Opzioni:**
- Tutte e quattro
- Tre
- Una
- Nessuna: sono già tutte vincenti! ✅

**Spiegazione:** Nessuna è affrancabile perché sono già tutte vincenti! AKQJ sono le 4 carte più alte del seme.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** In una presa vengono giocati l'8, il J, la Q e l'Asso. Qual è l'ordine delle tre carte più alte tra quelle rimaste?

**Opzioni:**
- K, 10, 9 ✅
- K, Q, J
- A, K, Q
- 10, 9, 8

**Spiegazione:** L'Asso, la Q e il J sono già usciti. Le tre carte più alte rimaste sono K, 10, 9.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** L'attacco tocca al vostro compagno, e voi avete: ♠- ♥- ♦- ♣AKQJ1098765432. Quante prese farete?

**Opzioni:**
- 13
- 10
- 7
- Nessuna ✅

**Spiegazione:** Nessuna! Il compagno attacca e non avete carte negli altri semi. Le fiori usciranno solo come scarti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/lessons.ts`

**Domanda:** Nel corso di una presa, chi ha più vantaggi tra i quattro giocatori?

**Opzioni:**
- Il primo
- Il secondo
- Il terzo
- Il quarto ✅

**Spiegazione:** Il quarto giocatore ha il massimo vantaggio: vede tutte le carte giocate dagli altri tre.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-1-2: 📝 Vincenti ed equivalenti sulla linea

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: A9753 / Sud: KQ642 (1 nel mezzo). a) Vincenti? b) Prese certe?

**Opzioni:**
- a) 3 (AKQ), b) 5 prese ✅
- a) 5, b) 3 prese
- a) 3, b) 3 prese
- a) 5, b) 5 prese

**Spiegazione:** a) 3: AKQ. b) 5: abbiamo 10 carte; anche se J109 fossero nella stessa mano, cadrebbero.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: KQJ / Sud: A109. a) Vincenti? b) Prese certe?

**Opzioni:**
- a) 6 vincenti (AKQJ10,9), b) solo 3 prese ✅
- a) 3, b) 3
- a) 4, b) 3
- a) 6, b) 6

**Spiegazione:** a) 6 vincenti/equivalenti (AKQJ109). b) Solo 3 prese perché abbiamo 3 carte per lato.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AQ5 / Sud: KJ1072. a) Vincenti? b) Prese certe?

**Opzioni:**
- a) 5 (AKQJ10), b) 5 prese ✅
- a) 3, b) 3
- a) 5, b) 3
- a) 4, b) 4

**Spiegazione:** a) 5: AKQJ10. b) 5, perché Sud ha 5 carte.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: KJ65 / Sud: AQ432. a) Vincenti? b) Prese certe?

**Opzioni:**
- a) 4 (AKQJ), b) 5 prese ✅
- a) 4, b) 4
- a) 5, b) 5
- a) 3, b) 5

**Spiegazione:** a) 4: AKQJ. b) 5: anche se 10,9,8,7 fossero nella stessa mano, con 9 carte cadrebbero.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AKQ6543 / Sud: J2. a) Vincenti? b) Prese certe?

**Opzioni:**
- a) 4 (AKQJ), b) 7 prese ✅
- a) 4, b) 4
- a) 7, b) 7
- a) 3, b) 2

**Spiegazione:** a) 4: AKQJ. b) 7: Nord ha 7 carte; anche se 10,9,8,7 fossero tutti insieme, cadrebbero.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-1-3: 📝 Prese immediate colore per colore

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: ♠KQ8 ♥J6 ♦AQ4 ♣K9754
Sud: ♠AJ7 ♥KQ109 ♦K43 ♣QJ102
Prese per colore?

**Opzioni:**
- ♠3, ♥0, ♦3, ♣0 — mancano gli assi a cuori e fiori ✅
- ♠3, ♥3, ♦3, ♣3
- ♠4, ♥0, ♦3, ♣2
- ♠3, ♥0, ♦3, ♣5

**Spiegazione:** 3 a picche + 3 a quadri = 6 prese immediate. A cuori manca l'A, a fiori manca l'A.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: ♠QJ97 ♥K32 ♦KJ76 ♣AQ
Sud: ♠AK4 ♥AQJ654 ♦Q2 ♣KJ
Prese per colore?

**Opzioni:**
- ♠4, ♥6, ♦2, ♣2 — abbondanza di prese ✅
- ♠3, ♥4, ♦2, ♣2
- ♠4, ♥3, ♦3, ♣2
- ♠2, ♥6, ♦4, ♣2

**Spiegazione:** 4 a picche, 6 a cuori, 2 a quadri, 2 a fiori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: ♠AQ86 ♥K2 ♦J983 ♣863
Sud: ♠K3 ♥AQ ♦AKQ43 ♣AJ72
Prese per colore?

**Opzioni:**
- ♠3, ♥2, ♦5, ♣1 ✅
- ♠4, ♥2, ♦3, ♣2
- ♠3, ♥3, ♦5, ♣1
- ♠2, ♥2, ♦5, ♣2

**Spiegazione:** 3 a picche, 2 a cuori, 5 a quadri, 1 a fiori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: ♠762 ♥KJ4 ♦KQJ108 ♣Q6
Sud: ♠KQJ ♥AQ9 ♦9732 ♣KJ5
Prese per colore?

**Opzioni:**
- ♠0, ♥3, ♦0, ♣0 — mancano troppi assi ✅
- ♠3, ♥3, ♦5, ♣2
- ♠0, ♥3, ♦5, ♣0
- ♠0, ♥2, ♦0, ♣1

**Spiegazione:** 0 a picche (manca l'A), 3 a cuori, 0 a quadri (manca l'A), 0 a fiori (manca l'A).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-1-4: 📝 Valore dei contratti a Senza Atout

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Quanto vale 1NT + 2?

**Opzioni:**
- 90
- 120
- 150 ✅
- 180

**Spiegazione:** 150: 40 la presa dichiarata + 60 le due prese in più + 50 di bonus parziale.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Quanto vale 3NT in prima?

**Opzioni:**
- 300
- 400 ✅
- 500
- 600

**Spiegazione:** 400 in prima: 100 le prese (40+30+30) + 300 il bonus di manche.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Quanto vale 3NT in seconda?

**Opzioni:**
- 400
- 500
- 600 ✅
- 700

**Spiegazione:** 600 in seconda: 100 le prese + 500 il bonus di manche in zona.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (true-false) — `src/data/lessons.ts`

**Domanda:** 2NT + 1 vale esattamente come 1NT + 2.

**Risposta corretta:** Vero ✅

**Spiegazione:** Vero! Entrambi fanno 9 prese senza raggiungere la manche: 150 punti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Quanto vale 6NT in prima?

**Opzioni:**
- 990 ✅
- 1020
- 1440
- 1520

**Spiegazione:** 990 in prima: 190 le prese + 300 bonus manche + 500 bonus Slam.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/lessons.ts`

**Domanda:** Quanto vale 6NT in seconda?

**Opzioni:**
- 990
- 1370
- 1440 ✅
- 1520

**Spiegazione:** 1440 in seconda: 190 le prese + 500 bonus manche + 750 bonus Slam.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-1-5: 📝 Attacco peggiore per il dichiarante

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: ♠543 ♥543 ♦A ♣KQJ1095
Sud: ♠A762 ♥A762 ♦KQJ7 ♣A
Qual è l'attacco peggiore?

**Opzioni:**
- Quadri: vi obbliga a usare subito l'Asso del morto e non riuscirete a incassare tutte le fiori di Nord ✅
- Picche: toglie un rientro
- Cuori: toglie un rientro
- Fiori: spreca il vostro Asso

**Spiegazione:** Quadri! Obbligandovi a usare subito l'Asso del morto, non riuscirete più a incassare tutte le fiori di Nord.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 2: Il punto di vista dei difensori

_L'attacco e il gioco di terza mano_


### Modulo 2-2: L'attacco a Senz'Atout

#### Esempio 4 — `src/data/lessons.ts:583`

**Testo:** Esempi di attacco dall'alto:

**Mano(i):** `KQJ103 → K | QJ93 → Q | Q10976 → 10 | J1094 → J`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (card-select) — `src/data/lessons.ts:588`

**Domanda:** Devi attaccare contro 3NT. Il tuo colore più lungo è ♠QJ1073. Quale carta attacchi?

**Mano:** `♠Q♠J♠10♠7♠3`

**Risposta corretta:** `♠Q` ✅

**Spiegazione:** Con una sequenza QJ10, attacchi dalla più alta: la Dama. Questo segnala al compagno che hai anche il Fante e il 10.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/lessons.ts:595`

**Domanda:** Contro un contratto a Senz'Atout, conviene sempre attaccare nel colore più lungo.

**Risposta corretta:** Vero ✅

**Spiegazione:** Vero! Nei contratti a SA, il colore lungo è la miglior sorgente di prese per i difensori. Se ne avete due di pari lunghezza, scegliete il più onorato.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-2-1: 📝 Attacchi e sequenze in difesa

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Un giocatore possiede ♣KQJ53. Che carta deve giocare se è primo di mano? E se è terzo?

**Opzioni:**
- Primo: il K. Terzo: il J ✅
- Primo: il J. Terzo: il K
- Sempre il K
- Sempre il J

**Spiegazione:** Il Re quando è in prima posizione (alto dalla sequenza), il Fante quando è in terza posizione (basso dalla sequenza).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Che carta promette l'attacco di J?

**Opzioni:**
- Il 10 (sequenza J-10) ✅
- La Q sopra
- Il K e la Q
- Nulla di specifico

**Spiegazione:** L'attacco del J promette il 10.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Quale carta esclude chi attacca con la Q?

**Opzioni:**
- Il K (Re) ✅
- L'Asso
- Il Fante
- Il 10

**Spiegazione:** Chi attacca con la Dama esclude il Re. Se avesse KQ, attaccherebbe dal Re.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (true-false) — `src/data/lessons.ts`

**Domanda:** L'attacco con il J mostra che quel giocatore NON possiede carte più alte del Fante.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Potrebbe avere AJ10x o KJ10x. Quel che è certo è che non ha la Dama.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-2-2: 📝 Scelta del colore d'attacco

#### Blocco 1 (bid-select) — `src/data/lessons.ts`

**Domanda:** ♠AJ3 ♥KQ5 ♦72 ♣QJ983. Quale colore attaccate?

**Opzioni:**
- ♣ Fiori (Q♣) ✅
- ♥ Cuori (K♥)
- ♠ Picche (J♠)
- ♦ Quadri (7♦)

**Spiegazione:** Q♣: colore più lungo con sequenza QJ.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (bid-select) — `src/data/lessons.ts`

**Domanda:** ♠KJ5 ♥AQ ♦9764 ♣K854. Quale colore attaccate?

**Opzioni:**
- ♦ Quadri (4♦) ✅
- ♣ Fiori (4♣)
- ♠ Picche (J♠)
- ♥ Cuori (A♥)

**Spiegazione:** 4♦: colore lungo senza onori toccati, la scelta più sicura.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (bid-select) — `src/data/lessons.ts`

**Domanda:** ♠863 ♥KQJ2 ♦AK ♣J1054. Quale colore attaccate?

**Opzioni:**
- ♥ Cuori (K♥) ✅
- ♦ Quadri (A♦)
- ♣ Fiori (J♣)
- ♠ Picche (8♠)

**Spiegazione:** K♥: bella sequenza KQJ nel colore quarto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (bid-select) — `src/data/lessons.ts`

**Domanda:** ♠87 ♥AQ ♦Q10654 ♣K853. Quale colore attaccate?

**Opzioni:**
- ♦ Quadri (4♦) ✅
- ♣ Fiori (3♣)
- ♥ Cuori (A♥)
- ♠ Picche (8♠)

**Spiegazione:** 4♦: colore quinto con possibilità di affrancamento.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-2-3: 📝 Gioco del terzo di mano

#### Blocco 1 (card-select) — `src/data/lessons.ts`

**Domanda:** Nord: 865. Ovest attacca il 2. Est ha KJ4. Il morto gioca piccola.

**Mano:** `♠K♠J♠4`

**Risposta corretta:** `♠K` ✅

**Spiegazione:** Il K. Terzo di mano gioca alto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (card-select) — `src/data/lessons.ts`

**Domanda:** Nord: Q97. Ovest attacca il 2. Est ha KJ10. Il morto gioca piccola.

**Mano:** `♠K♠J♠10`

**Risposta corretta:** `♠10` ✅

**Spiegazione:** Il 10. La Q del morto copre il J, basta il 10.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (card-select) — `src/data/lessons.ts`

**Domanda:** Nord: 863. Ovest attacca il 2. Est ha QJ94. Il morto gioca piccola.

**Mano:** `♠Q♠J♠9♠4`

**Risposta corretta:** `♠J` ✅

**Spiegazione:** Il J. Con Q-J basta il J per testare la posizione.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (card-select) — `src/data/lessons.ts`

**Domanda:** Nord: J65. Ovest attacca il 2. Est ha KQ10. Il morto gioca piccola.

**Mano:** `♠K♠Q♠10`

**Risposta corretta:** `♠10` ✅

**Spiegazione:** Il 10. Il J del morto copre Q e K; il 10 forza l'Asso.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (card-select) — `src/data/lessons.ts`

**Domanda:** Nord: 974. Ovest attacca il 2. Est ha AK5. Il morto gioca piccola.

**Mano:** `♠A♠K♠5`

**Risposta corretta:** `♠K` ✅

**Spiegazione:** Il K. Con AK si gioca il Re per segnalare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (card-select) — `src/data/lessons.ts`

**Domanda:** Nord: Q103. Ovest attacca il 2. Est ha KJ9. Il morto gioca piccola.

**Mano:** `♠K♠J♠9`

**Risposta corretta:** `♠9` ✅

**Spiegazione:** Il 9. La Q del morto copre il J e il K; il 9 è sufficiente.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-2-4: 📝 Chi ha sbagliato tra Est e Ovest?

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: J43, Ovest: K10965, Est: Q72, Sud: A8.
La giocata: 5...3...Q...A.
Sud ha fatto una seconda presa con il J. Ha sbagliato Est o Ovest?

**Opzioni:**
- Ha sbagliato Ovest: doveva attaccare con il 10 (sequenza), non con il 5 ✅
- Ha sbagliato Est: doveva giocare il K
- Nessuno ha sbagliato
- Hanno sbagliato entrambi

**Spiegazione:** Ovest ha sbagliato attaccando con il 5 anziché il 10 (sequenza). Se avesse giocato il 10, Est avrebbe salvato la Dama.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: 854, Ovest: AJ1062, Est: K93, Sud: Q7.
La presa: J...4...3...Q.
Sud ha fatto una presa impossibile! Ha sbagliato Est o Ovest?

**Opzioni:**
- Ha sbagliato Est: la Dama è in mano a Sud, quindi DEVE mettere il Re! ✅
- Ha sbagliato Ovest
- Nessuno ha sbagliato
- Hanno sbagliato entrambi

**Spiegazione:** Est! Sa perfettamente che la Dama è in mano a Sud (l'attacco di J la nega), quindi DEVE mettere il Re!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: 754, Ovest: A10862, Est: KJ3, Sud: Q9.
La presa: 2...4...J...Q.
Sud ha fatto una presa impossibile. Errore di...?

**Opzioni:**
- Est: non sono affatto equivalenti Re e Fante; deve giocare il Re (la carta più alta) ✅
- Ovest
- Nessuno
- Entrambi

**Spiegazione:** Est! Re e Fante non sono equivalenti. Poiché è suo dovere cercare di vincere la presa, la carta da giocare è quella più alta: il Re.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-2-5: 📝 Quiz sulla posizione delle carte

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Siete Ovest con K764. Nord: J83, Est: ...10, Sud: ...A.
Avete attaccato il 4. Nord mette il 3, Est il 10, Sud prende con l'A. Chi ha la Q?

**Opzioni:**
- La Q è in Est (Sud con AQ avrebbe preso con la Q) ✅
- La Q è in Sud
- Impossibile dirlo
- La Q è in Nord

**Spiegazione:** Sud con AQ avrebbe preso con la Dama. Quindi la Q è in Est. Il 9 è in Sud, perché Est con 10 e 9 avrebbe giocato il 9.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Siete Ovest con Q8632. Nord: 754, Est: ...J, Sud: ...A.
Avete attaccato il 2. Nord mette il 4, Est il J, Sud prende con l'A. Chi ha il K?

**Opzioni:**
- Il K è in Sud (se Est avesse K e J avrebbe giocato il Re) ✅
- Il K è in Est
- Impossibile dirlo
- Il K è in Nord

**Spiegazione:** Se Est avesse avuto K e J, avrebbe giocato il Re. Quindi il Re è in Sud. Anche il 10 è in Sud.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-2-6: 📝 Prese minime per il difensore

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: 643, Ovest: AQ10. Quante prese minime vi spettano?

**Opzioni:**
- 1
- 2
- 3 ✅
- 4

**Spiegazione:** 3: sempre che non ci muoviamo per primi. Il giocante non può evitare di darci 3 prese.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: A65, Ovest: Q102. Quante prese minime vi spettano?

**Opzioni:**
- 0
- 1 ✅
- 2
- 3

**Spiegazione:** 1: se Sud gioca il Fante, basterà coprirlo con la Dama.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: J10, Ovest: AQ94. Quante prese minime vi spettano?

**Opzioni:**
- 1
- 2
- 3 ✅
- 4

**Spiegazione:** 3: Asso e Dama sono evidenti, ma faremo anche il 9.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: QJ, Ovest: A1062. Quante prese minime vi spettano?

**Opzioni:**
- 1
- 2 ✅
- 3
- 4

**Spiegazione:** 2: anche il 10 vincerà la sua presa, comunque giochi Sud.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AK7, Ovest: QJ9. Quante prese minime vi spettano?

**Opzioni:**
- 0
- 1 ✅
- 2
- 3

**Spiegazione:** 1: basterà giocare il 9 se Sud muove piccola, e coprire con un pezzo se Sud muove il 10.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: 543, Ovest: AJ108. Quante prese minime vi spettano?

**Opzioni:**
- 1
- 2
- 3 ✅
- 4

**Spiegazione:** 3: l'Asso mangia un pezzo grosso, poi J e 10 sono vincenti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 3: Affrancamenti di lunga e di posizione

_Impasse, expasse e colori lunghi_


### Modulo 3-2: L'affrancamento di posizione

#### Blocco 4 (quiz) — `src/data/lessons.ts:720`

**Domanda:** Hai AQ5 a Nord e 863 a Sud. Per fare l'impasse verso la Dama, da dove devi giocare?

**Opzioni:**
- Da Nord
- Da Sud ✅
- Non importa
- Non si può fare l'impasse

**Spiegazione:** Devi giocare da Sud verso la Dama di Nord. Se il Re è in Ovest (prima della Dama), la tua Dama vincerà!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (card-select) — `src/data/lessons.ts:728`

**Domanda:** Stai facendo l'impasse: hai ♠AQ5 a Nord e sei in Sud. Hai giocato ♠3 da Sud, Ovest gioca ♠4. Quale carta giochi da Nord?

**Mano:** `♠A♠Q♠5`

**Risposta corretta:** `♠Q` ✅

**Spiegazione:** Giochi la Dama! L'impasse consiste nel giocare l'onore coperto (la Q) sperando che il Re sia in Ovest. Se fosse in Est, avresti comunque l'Asso come sicurezza.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/lessons.ts:735`

**Domanda:** L'impasse ha una probabilità di successo del 50%.

**Risposta corretta:** Vero ✅

**Spiegazione:** Vero! La carta avversaria che cerchi (es. il Re) può essere in una di due posizioni: favorevole o sfavorevole. La probabilità è quindi 50-50.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-3-1: 📝 Divisione dei resti

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** 7 carte in linea (ne mancano 6). Divisioni più probabili?

**Opzioni:**
- 3-3 e 4-2 ✅
- 5-1 e 6-0
- 4-2 e 5-1
- 2-4 e 1-5

**Spiegazione:** Con 6 carte mancanti: divisioni più probabili 3-3 e 4-2.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** 6 carte in linea (ne mancano 7). Divisioni più probabili?

**Opzioni:**
- 4-3 e 5-2 ✅
- 3-4 e 6-1
- 5-2 e 6-1
- 3-3 e 4-2

**Spiegazione:** Con 7 carte mancanti: 4-3 e 5-2.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** 9 carte in linea (ne mancano 4). Divisioni più probabili?

**Opzioni:**
- 2-2 e 3-1 ✅
- 3-1 e 4-0
- 1-3 e 0-4
- 2-2 e 4-0

**Spiegazione:** Con 4 carte mancanti: 2-2 e 3-1.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** 8 carte in linea (ne mancano 5). Divisioni più probabili?

**Opzioni:**
- 3-2 e 4-1 ✅
- 2-3 e 5-0
- 4-1 e 5-0
- 3-2 e 5-0

**Spiegazione:** Con 5 carte mancanti: 3-2 e 4-1.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** 10 carte in linea (ne mancano 3). Divisioni possibili?

**Opzioni:**
- 2-1 e 3-0 ✅
- 1-1 e 2-0
- Solo 2-1
- Solo 3-0

**Spiegazione:** Con 3 carte mancanti: uniche divisioni possibili 2-1 e 3-0.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-3-2: 📝 Affrancamento di lunga

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: A9753 / Sud: K8642. Affrancamento di lunga?

**Opzioni:**
- Sì, TRE se diviso 2-1 ✅
- Sì, UNA se diviso 2-1
- No
- Sì, QUATTRO

**Spiegazione:** Sì, TRE prese di lunga se diviso 2-1 (10 carte, ne mancano solo 3).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: KQ42 / Sud: A853. Affrancamento di lunga?

**Opzioni:**
- Sì, UNA se diviso 3-2 ✅
- No
- Sì, DUE
- Sì, TRE

**Spiegazione:** UNA presa di lunga, se diviso 3-2.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AQ54 / Sud: K2. Affrancamento di lunga?

**Opzioni:**
- Nessuna (anche con divisione 4-3 non affranchiamo la quarta carta) ✅
- UNA
- DUE
- TRE

**Spiegazione:** Nessuna! Con solo 2 carte in Sud, anche se il colore fosse 4-3 non affranchiamo la quarta carta di Nord.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: KQ5 / Sud: A432. Affrancamento di lunga?

**Opzioni:**
- Sì, UNA se diviso 3-3 ✅
- No
- Sì, DUE
- Sì, TRE

**Spiegazione:** UNA presa di lunga se diviso 3-3.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AK7654 / Sud: 832. Affrancamento di lunga?

**Opzioni:**
- Sì, QUATTRO se diviso 2-2 ✅
- Sì, TRE
- Sì, DUE
- Sì, UNA

**Spiegazione:** QUATTRO prese di lunga se diviso 2-2.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-3-3: 📝 Forza, lunga e influenza dei resti

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: K8763 / Sud: A642. Forza? Lunga? Resti influiscono?

**Opzioni:**
- a) Nessuna, b) 4 se 2-2, c) Sì ✅
- a) Due, b) 3, c) No
- a) Una, b) 2, c) Sì
- a) Nessuna, b) 2 se 3-2, c) No

**Spiegazione:** a) Nessuna di forza (mancano Q e J). b) 4 se 2-2. c) Sì.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: KQ742 / Sud: J65. Forza? Lunga? Resti?

**Opzioni:**
- a) Due (KQJ), b) DUE se 3-2, c) Sì ✅
- a) Una, b) TRE, c) No
- a) Nessuna, b) UNA, c) Sì
- a) Tre, b) Nessuna, c) No

**Spiegazione:** a) Due (abbiamo KQJ). b) DUE se 3-2. c) Sì.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AK873 / Sud: Q2. Forza? Lunga? Resti?

**Opzioni:**
- a) Nessuna, b) DUE se 3-3, c) Sì ✅
- a) QUATTRO, b) Nessuna, c) No
- a) Due, b) UNA, c) Sì
- a) Nessuna, b) TRE, c) No

**Spiegazione:** a) Nessuna di forza extra. b) DUE se 3-3. c) Sì.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: KQ9 / Sud: J10862. Forza? Lunga? Resti?

**Opzioni:**
- a) QUATTRO, b) Nessuna (coincidono con forza), c) No ✅
- a) Due, b) DUE, c) Sì
- a) Tre, b) UNA, c) Sì
- a) QUATTRO, b) UNA, c) Sì

**Spiegazione:** a) QUATTRO (manca solo l'A). b) Nessuna in più. c) No.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: QJ94 / Sud: 10865. Forza? Lunga? Resti?

**Opzioni:**
- a) DUE, b) Nessuna (coincidono), c) No ✅
- a) Nessuna, b) DUE, c) Sì
- a) Una, b) UNA, c) Sì
- a) TRE, b) UNA, c) No

**Spiegazione:** a) DUE (QJ contro AK). b) Nessuna in più. c) No.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-3-4: 📝 Chi ha il fermo?

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: K75, Sud: AQ64. Ovest: 9832, Est: J10. Chi ha il fermo?

**Opzioni:**
- Ovest
- Est ✅
- Nessuno
- Entrambi

**Spiegazione:** Est con J10 dietro alla forchetta AQ di Sud.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: A72, Sud: K9843. Ovest: QJ, Est: 1065. Chi ha il fermo?

**Opzioni:**
- Est
- Ovest ✅
- Nessuno
- Entrambi

**Spiegazione:** Ovest con QJ davanti al Re di Sud.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: K86432, Sud: A10. Ovest: 975, Est: QJ. Chi ha il fermo?

**Opzioni:**
- Ovest
- Est ✅
- Nessuno
- Entrambi

**Spiegazione:** Est con QJ seduto dietro al Re di Nord.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-3-5: 📝 Carte che danno una presa supplementare

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: KJ5 / Sud: A64. Quale carta può dare una presa in più?

**Opzioni:**
- Il J di Nord ✅
- Il K di Nord
- Il 6 di Sud
- Nessuna

**Spiegazione:** Il Fante di Nord: se la Q è in Ovest, con l'impasse il J diventa vincente.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: Q432 / Sud: A765. Quale carta?

**Opzioni:**
- La Q di Nord ✅
- Il 7 di Sud
- Nessuna
- L'A di Sud

**Spiegazione:** La Dama di Nord: se il K è in Ovest.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: K762 / Sud: 43. Quale carta?

**Opzioni:**
- Il K di Nord ✅
- Il 7
- Nessuna
- Il 4 di Sud

**Spiegazione:** Il Re di Nord: se l'A è in Ovest.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: 762 / Sud: AQ54. Quale carta?

**Opzioni:**
- La Q di Sud ✅
- L'A di Sud
- Nessuna
- Il 7 di Nord

**Spiegazione:** La Dama di Sud: se il K è in Ovest.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AK5 / Sud: J643. Quale carta?

**Opzioni:**
- Il J di Sud ✅
- L'A di Nord
- Nessuna
- Il 6 di Sud

**Spiegazione:** Il Fante di Sud: se la Q cade sotto AK, o se è in posizione favorevole.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-3-6: 📝 Impasse: da che lato iniziare

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AQ963 / Sud: 7542. Da dove iniziate?

**Opzioni:**
- Da Sud: gioco la dama per far scendere il Re (impasse) ✅
- Da Nord: tiro l'Asso
- Indifferente: tiro l'A e spero che il K cada
- Da Nord: gioco piccola

**Spiegazione:** a) Inizio da Nord e gioco la Dama per fare l'impasse al Re. b) Inizio da Sud e gioco il 2 per provare a mettere la Dama. c) Indifferente: tiro l'A e spero che il Re cada.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: A9763 / Sud: Q8542. Da dove?

**Opzioni:**
- Da Sud: gioco la Dama per l'impasse al Re
- Da Nord: gioco piccola verso la Dama ✅
- Indifferente: tiro l'Asso
- Da Nord: Asso e poi piccola

**Spiegazione:** a) Inizio da Sud e gioco la Dama. b) Inizio da Nord e gioco piccola verso la Dama. c) Tiro l'A e spero.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: J653 / Sud: AK42. Da dove?

**Opzioni:**
- Da Nord: gioco il J per l'impasse alla Dama ✅
- Da Sud: l'Asso e il Re e spero
- Indifferente
- Da Nord: gioco piccola

**Spiegazione:** a) Inizio da Nord e gioco il Fante per l'impasse alla Dama. b) Da Sud e gioco piccola verso il Fante. c) Tiro l'A e il Re e spero che la Dama cada.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-3-7: 📝 Dove vorreste il Re avversario?

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: AQ5 / Sud: 642. Preferite il K in Est o Ovest?

**Opzioni:**
- In Est: faremo l'impasse dalla Dama ✅
- In Ovest
- Indifferente
- In nessuno dei due

**Spiegazione:** K in Est! Giocheremo piccole verso la Dama, e faremo l'impasse.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: QJ65 / Sud: A1093. Preferite il K...?

**Opzioni:**
- In Est: faremo l'impasse ripetutamente ✅
- In Ovest
- Indifferente
- Non importa

**Spiegazione:** K in Est: faremo l'impasse più volte e realizzeremo tutte le prese.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: Q8762 / Sud: A9543. Preferite il K...?

**Opzioni:**
- Dovunque, purché secco! ✅
- In Est
- In Ovest
- Non importa

**Spiegazione:** Dovunque, purché secco! Con 10 carte, il K cadrà sotto l'A.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: A92 / Sud: Q54. Preferite il K...?

**Opzioni:**
- In Ovest: giocheremo cartina verso la Dama ✅
- In Est
- Indifferente
- Non importa

**Spiegazione:** In Ovest! Giocheremo cartina verso la Dama: Est farà il suo Re, o subito o dopo, ma la Dama si affrancherà.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: Q5 / Sud: A8763. Preferite il K...?

**Opzioni:**
- In Ovest: giocheremo piccola verso la Dama ✅
- In Est
- Indifferente
- Non importa

**Spiegazione:** In Ovest: giocheremo piccola verso la Dama. Ovest farà il Re, ma la Dama si affrancherà.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-3-8: 📝 Onore da perdere e onore da non perdere

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: KQ96 / Sud: 10542. Onore da perdere? Onore da evitare?

**Opzioni:**
- Perdere l'A sempre; evitare di dare la presa al FANTE ✅
- Perdere il K; evitare il 10
- Perdere la Q; evitare il J
- Nessun onore da perdere

**Spiegazione:** Dovremo sempre perdere l'Asso; speriamo di non dover dare la presa al Fante.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: J1094 / Sud: K642. Onore da perdere? Onore da evitare?

**Opzioni:**
- Perdere l'A sempre; evitare di dare la presa alla DAMA ✅
- Perdere il K; evitare il J
- Perdere il 10; evitare l'A
- Nessun onore da perdere

**Spiegazione:** Dovremo sempre perdere l'Asso; speriamo di non dover dare la presa alla Dama.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: Q965 / Sud: J43. Onore da perdere? Onore da evitare?

**Opzioni:**
- Perdere A e K sempre; evitare di dare la presa al DIECI ✅
- Perdere l'A; evitare la Q
- Perdere il K; evitare il J
- Nessun onore da perdere

**Spiegazione:** Dovremo perdere A e K; speriamo di non dover dare la presa al 10.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 4: Il piano di gioco a senz'atout

_Organizzare le manovre per raggiungere il contratto_


### Modulo 4-1: Il metodo del piano di gioco

#### Esempio 3 — `src/data/lessons.ts:796`

**Testo:** Sud gioca 3NT. Conta: 3 vincenti a Picche, 2 a Cuori, 1 a Fiori = 6. Servono altre 3 prese per arrivare a 9. Le Quadri (KQ1075) possono fornirle, una volta ceduto l'Asso.

**Mano(i):** `♠86 ♥K5 ♦KQ1075 ♣872`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:807`

**Domanda:** Sud gioca 3NT con 6 vincenti immediate. Quante prese deve ancora sviluppare?

**Opzioni:**
- 2
- 3 ✅
- 4
- 6

**Spiegazione:** 3NT richiede 9 prese. Con 6 vincenti, servono ancora 9 - 6 = 3 prese da sviluppare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 4-2: Il rientro e le comunicazioni

#### Esempio 3 — `src/data/lessons.ts:839`

**Testo:** Sud gioca 3NT. Attacco ♥2. Le Quadri possono dare 4 prese affrancate, ma il K♥ nel morto è l'unico rientro. Sud deve rifiutare la presa a Cuori due volte, vincendo solo alla terza, per conservare il K♥ come ingresso al morto.

**Mano(i):** `♠86 ♥K5 ♦KQ1075 ♣872`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:851`

**Domanda:** Perché il Giocante a volte rifiuta di vincere una presa che potrebbe prendere?

**Opzioni:**
- Per confondere gli avversari
- Per mantenere i rientri verso la mano con le carte affrancate ✅
- Perché non ha carte abbastanza alte
- Non ha mai senso rifiutare una presa

**Spiegazione:** Rifiutare di prendere subito (Colpo in Bianco) serve a mantenere le comunicazioni: si conserva il rientro nella mano dove si trovano le carte da affrancare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 4-3: Colori comunicanti e bloccati

#### Esempio 2 — `src/data/lessons.ts:883`

**Testo:** KQ72 su AJ83: l'incasso è fluido, 4 prese. Ma QJ109 su AK: il colore è bloccato, non si possono incassare tutte le vincenti!

**Mano(i):** `KQ72 → AJ83 (fluido) | QJ109 → AK (bloccato)`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 4 — `src/data/lessons.ts:894`

**Testo:** Con K2 su AQJ43: iniziate con il Re, poi giocate il 2 per dare la presa alle altre vincenti della mano lunga.

**Mano(i):** `K2 → AQJ43`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/lessons.ts:905`

**Domanda:** Hai AK a Nord e QJ1095 a Sud. Come eviti di bloccare il colore?

**Opzioni:**
- Giochi prima la Q da Sud
- Giochi prima l'A e poi il K da Nord ✅
- Non importa l'ordine
- Giochi una carta piccola da entrambi i lati

**Spiegazione:** Devi giocare prima gli onori del lato corto (A e K da Nord), poi passare a Sud per incassare le rimanenti QJ109. Regola: prima gli onori del lato corto!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 4-4: La scelta tra più colori

#### Esempio 2 — `src/data/lessons.ts:937`

**Testo:** Sud gioca 3NT. Attacco ♦2. Conta 3 vincenti a Picche, 1 a Cuori, 2 a Quadri, 1 a Fiori. Deve trovare 2 prese: le Fiori offrono 3-4 affrancabili (impasse al Re). Da che parte conviene muovere le Fiori? Da Nord verso Sud, per sottomettere l'eventuale Re.

**Mano(i):** `♠763 ♥864 ♦A653 ♣QJ3`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:954`

**Domanda:** Sud gioca 3NT con 5 vincenti. Ha due colori di sviluppo: Fiori (4 affrancabili cedendo 1 presa) e Quadri (5 affrancabili cedendo 2 prese). Gli avversari hanno già 3 prese pronte. Quale colore sceglie?

**Opzioni:**
- Quadri, perché danno più prese
- Fiori, perché cede solo 1 presa e gli avversari non arriveranno a 5 ✅
- Non importa
- Nessuno dei due

**Spiegazione:** Fiori! Se sviluppi Quadri cedi 2 prese, e gli avversari con le loro 3 pronte ne farebbero 5: contratto battuto. Con Fiori cedi solo 1 presa: gli avversari arrivano a 4, tu fai le tue 9.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-4-1: 📝 Taglio e atout

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Quando conviene tirare atout subito?

**Opzioni:**
- Quando abbiamo abbastanza vincenti e non ci servono tagli ✅
- Sempre, prima di fare qualsiasi altra cosa
- Mai, meglio tagliare prima
- Solo quando abbiamo 10+ atout

**Spiegazione:** Si tirano le atout quando abbiamo vincenti sufficienti e non ci servono tagli nel morto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: ♠AKQ74 / Sud: ♠J1063. Quante volte dobbiamo battere atout se gli avversari ne hanno 3?

**Opzioni:**
- Una volta (se sono 3-0 o 2-1)
- Sempre tre volte
- Dipende dalla divisione: se 2-1 bastano 2 giri, se 3-0 ne servono 3 ✅
- Non serve battere atout

**Spiegazione:** Con 3 atout avversarie: se dividono 2-1 (78%) bastano 2 giri; se 3-0 servono 3 giri.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Che cos'è il 'taglio'?

**Opzioni:**
- Giocare una carta di atout quando non si ha il seme giocato ✅
- Scartare una carta bassa
- Giocare l'Asso
- Passare il turno

**Spiegazione:** Il taglio (ruff) è giocare una carta di atout quando non si possiede il seme della presa.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Conviene tagliare nella mano lunga di atout?

**Opzioni:**
- No, di solito non conviene: quelle atout avrebbero vinto comunque ✅
- Sì, sempre
- Solo con 8+ atout in linea
- Solo in difesa

**Spiegazione:** Tagliare nella mano lunga non crea prese extra. È meglio tagliare nella mano corta.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-4-2: 📝 Piano di gioco ad atout

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** In un contratto ad atout, qual è il primo passo del piano di gioco?

**Opzioni:**
- Contare le perdenti (nella mano lunga di atout) ✅
- Tirare subito le atout
- Tagliare nel morto
- Giocare le vincenti laterali

**Spiegazione:** In un contratto ad atout si contano le perdenti nella mano del giocante (mano lunga di atout).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Con 4♠ come contratto, quante perdenti possiamo permetterci?

**Opzioni:**
- 3 (dobbiamo fare 10 prese, ne possiamo perdere 3) ✅
- 4
- 2
- 0

**Spiegazione:** 4♠ = 10 prese necessarie, quindi possiamo perdere al massimo 3 prese.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Come si elimina una perdente?

**Opzioni:**
- Con l'impasse, il taglio nel morto, o lo scarto su una vincente laterale ✅
- Solo con l'impasse
- Solo tirando atout
- Non si può eliminare una perdente

**Spiegazione:** Le perdenti si eliminano con: impasse, taglio nel morto, scarto su vincenti laterali, affrancamento.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 5: Il gioco con l'atout

_Taglio, battuta e allungamento_


### Modulo 5-1: Il fit e il ruolo dell'atout

#### Blocco 4 (quiz) — `src/data/lessons.ts:1033`

**Domanda:** Quante carte in un seme deve avere la coppia per considerarlo un buon fit?

**Opzioni:**
- 6
- 7
- 8 o più ✅
- 10

**Spiegazione:** Si parla di FIT quando la coppia possiede almeno 8 carte in un seme. Con 8+ carte conviene giocare con quel seme come atout.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 5-2: Battere le atout

#### Esempio 3 — `src/data/lessons.ts:1065`

**Testo:** Sud gioca 4♥. Attacco: A♠ e K♠. Sud taglia con una Cuori. Se provasse subito a incassare le Quadri vincenti (KQJ2), Ovest taglierebbe al terzo giro. Invece Sud deve prima battere le atout (3 giri di Cuori), e solo dopo incassare le Quadri in sicurezza.

**Mano(i):** `♠874 ♥109 ♦KQJ2 ♣AK63`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts:1071`

**Domanda:** Perché il Giocante deve battere le atout prima di incassare le vincenti laterali?

**Opzioni:**
- Per fare più prese
- È obbligatorio per regolamento
- Per evitare che gli avversari taglino le sue carte buone ✅
- Non deve farlo, è sempre meglio tagliare subito

**Spiegazione:** Se non si eliminano le atout avversarie, i difensori potrebbero tagliare le nostre vincenti nei colori laterali, impedendoci di incassarle.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 5-3: Il potere di taglio e di allungamento

#### Esempio 4 — `src/data/lessons.ts:1113`

**Testo:** Sud gioca 4♠. Con ♠1095 al morto e ♠AKQJ73 in mano, le prese normali sono 6 a Picche. Ma tagliando 2 Cuori con le Picche del Morto, Sud ottiene 8 prese dal colore di atout!

**Mano(i):** `♠1095 ♥4 ♦A762 ♣A10842`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1119`

**Domanda:** Quando il taglio con l'atout produce un vero "allungamento"?

**Opzioni:**
- Sempre
- Solo quando si taglia dalla mano lunga
- Quando il taglio aumenta il numero di prese rispetto all'incasso normale del colore ✅
- Mai, il taglio non aggiunge prese

**Spiegazione:** L'allungamento si verifica quando, tagliando dalla parte corta dell'atout, si ottengono più prese di quante se ne farebbero semplicemente incassando il colore. Tagliare dalla mano lunga normalmente non aggiunge prese.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 5-4: Il potere di affrancamento

#### Esempio 2 — `src/data/lessons.ts:1151`

**Testo:** Sud gioca 4♠. Attacco ♦K. Vincenti: 6♠ + 1♥ + 1♦ + 2♣ = 10. Ma le Fiori del morto (A98753) sono una miniera! Sud batte le atout, incassa A♣ e taglia una ♣: se i resti avversari sono 3-2, le tre Fiori restanti del Morto sono franche!

**Mano(i):** `♠KJ3 ♥A7 ♦65 ♣A98753`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts:1162`

**Domanda:** Al morto ci sono 6 carte di Fiori (A98753) e in mano K2. Dopo aver incassato A e K e tagliato una volta, i resti avversari (5 carte) erano divisi 3-2. Quante Fiori franche restano al morto?

**Opzioni:**
- 1
- 2
- 3 ✅
- 4

**Spiegazione:** Partendo da 6 carte al morto: incassato A (resta 5), incassato K (resta 4), tagliata una (resta 3). Con i resti 3-2, gli avversari hanno esaurito le Fiori: le 3 rimaste del Morto sono tutte franche!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-5-1: 📝 Contare le vincenti a SA

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** In un contratto a SA, qual è il primo passo del piano di gioco?

**Opzioni:**
- Contare le vincenti immediate ✅
- Contare le perdenti
- Giocare le carte alte
- Affrancamento di un colore lungo

**Spiegazione:** A SA si contano le vincenti (non le perdenti). Se ne mancano, si cercano fonti extra.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: ♠A65 / Sud: ♠K74. Quante vincenti in Picche?

**Opzioni:**
- 2 (Asso e Re) ✅
- 3
- 1
- 0

**Spiegazione:** Asso e Re sono 2 vincenti immediate. Le altre carte sono basse.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Perché a SA è importante l'affrancamento?

**Opzioni:**
- Perché non possiamo tagliare: l'unico modo per creare prese extra è affrancare un colore lungo ✅
- Per divertimento
- Per confondere gli avversari
- Non è importante a SA

**Spiegazione:** Senza atout non si può tagliare, quindi l'affrancamento è la tecnica principale per creare prese.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Nord: ♦KQJ109 / Sud: ♦A2. Quante prese possiamo fare in Quadri?

**Opzioni:**
- 5 (tutte: A al Sud, poi KQJT9 al Nord dopo aver incassato l'A) ✅
- 2
- 3
- 4

**Spiegazione:** Incassiamo l'A al Sud, poi entriamo al Nord e le 4 carte alte di Quadri sono tutte vincenti = 5 prese.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-5-2: 📝 Comunicazioni e rientri

#### Blocco 0 (quiz) — `src/data/lessons.ts`

**Domanda:** Cosa si intende per 'rientro' (entry)?

**Opzioni:**
- Una carta alta che permette di passare il gioco all'altra mano della linea ✅
- L'apertura dell'asta
- La prima carta giocata
- Un tipo di impasse

**Spiegazione:** Un rientro è una carta alta in una mano che ci consente di trasferire il gioco a quella mano.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Perché i rientri sono fondamentali a SA?

**Opzioni:**
- Per poter incassare le carte affrancate: senza rientro le vincenti nel morto sono irraggiungibili ✅
- Non sono fondamentali
- Solo per fare impasse
- Solo in difesa

**Spiegazione:** Senza rientri, le carte affrancate nel morto non si possono incassare. I rientri sono vitali.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 6: Il piano di gioco con l'atout

_Battere o non battere? La strategia completa_


### Modulo 6-1: Vincenti lunghe o tagli?

#### Esempio 4 — `src/data/lessons.ts:1236`

**Testo:** Sud gioca 4♠. Attacco ♦K. Ha 5 a ♠, 5 a ♣ (AJ1082). Le Fiori sono lunghe e affrancabili. Bisogna battere le atout, poi giocare fiori per affrancarle. Se tagliasse subito, perderebbe il controllo.

**Mano(i):** `♠AQ8 ♥54 ♦432 ♣AJ1082`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Con affrancabili "lunghe" nei colori laterali, qual è la strategia corretta?

**Opzioni:**
- Tagliare subito dalla parte corta
- Battere le atout prima, poi incassare le lunghe ✅
- Non battere mai le atout
- Giocare a caso

**Spiegazione:** Quando hai carte lunghe affrancabili, devi prima eliminare le atout avversarie per evitare che taglino le tue vincenti. Solo dopo puoi incassare tranquillamente.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 6-2: Costruire il taglio

#### Esempio 2 — `src/data/lessons.ts:1274`

**Testo:** Atout ♠. Nord ha ♥32 e Sud ha ♥A74. Sud gioca A♥ e poi cede una Cuori: ora Nord non ha più Cuori e può tagliare la terza con una Picca del morto.

**Mano(i):** `♠654 ♥32 → ♠AKQ32 ♥A74`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1290`

**Domanda:** Al morto ci sono ♥32 e in mano ♥A74. Quante prese di Cuori devi giocare prima di poter tagliare dal morto?

**Opzioni:**
- 0
- 1
- 2 ✅
- 3

**Spiegazione:** Devi giocare A♥ (prima presa) e poi cedere una Cuori (seconda presa). A quel punto il morto non ha più Cuori e può tagliare la terza con l'atout.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 6-3: Decidere quando battere le atout

#### Esempio 2 — `src/data/lessons.ts:1317`

**Testo:** Sud gioca 4♠. Ovest attacca ♥K. Teoricamente 10 prese: 4 atout, 1♥, 3♦, 2 affrancabili a ♣. Ma dopo l'attacco, i difensori hanno affrancato 2 prese a Cuori. Se Sud prende con l'A♥ e gioca atout, l'A♠ è in mano ai nemici che incasseranno le Cuori e poi A♣. Soluzione: scartare carte perdenti prima!

**Mano(i):** `♠K952 ♥853 ♦AQ5 ♣K65`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts:1328`

**Domanda:** Giochi 4♠. Hai bisogno di tagliare una Cuori dal morto. L'avversario ha l'A♠. Cosa fai per primo?

**Opzioni:**
- Batti le atout per eliminare quelle avversarie
- Fai il taglio di Cuori prima di battere le atout ✅
- Incassi le vincenti laterali
- Giochi una carta qualsiasi

**Spiegazione:** Se batti le atout, l'avversario con l'Asso prenderà e potrà giocare atout lui stesso, togliendoti la possibilità di taglio. Meglio fare prima il taglio, poi battere le atout.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 6-4: Consigli per i difensori ad atout

#### Blocco 4 (quiz) — `src/data/lessons.ts:1370`

**Domanda:** Il contratto è 4♥. Hai ♠KQ74. Qual è l'attacco corretto?

**Opzioni:**
- Il 4 di Picche (quarta migliore)
- Il Re di Picche (dall'alto della sequenza) ✅
- Il 7 di Picche
- Non si attacca a Picche

**Spiegazione:** Nei contratti a colore, con KQ basta la sequenza di due onori per attaccare dall'alto. Si attacca con il Re, promettendo la Dama (e negando l'Asso).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-6-1: 📝 Quando tirare atout e quando no

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Se il mio piano prevede di tagliare nel morto, quando devo tirare atout?

**Opzioni:**
- DOPO aver effettuato i tagli necessari ✅
- PRIMA di tagliare
- Non fa differenza
- Mai

**Spiegazione:** Se servono tagli nel morto, devo conservare le atout del morto. Tiro atout solo dopo i tagli.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Se ho vincenti sufficienti e non mi servono tagli, cosa faccio?

**Opzioni:**
- Tiro atout subito per evitare che gli avversari taglino le mie vincenti laterali ✅
- Aspetto
- Taglio lo stesso nel morto
- Gioco le vincenti laterali prima

**Spiegazione:** Se non servono tagli, meglio togliere le atout agli avversari subito per proteggere le vincenti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Con fit 4-4 in atout, è più vantaggioso tagliare dove?

**Opzioni:**
- Nel morto (la mano corta tagliando crea prese extra) ✅
- Nella mano del giocante
- Non fa differenza
- In entrambe le mani

**Spiegazione:** Con fit 4-4, tagliare nella mano corta (morto) crea prese extra. La mano lunga le aveva già.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 7: La valutazione della mano

_Punti onori, apertura e scelta del colore_


### Modulo 7-1: Il conteggio dei punti onori

#### Esempio 3 — `src/data/lessons.ts:1444`

**Testo:** Esempio di conteggio: ♠AQ854 ♥K9 ♦J87 ♣AKJ = 4+2+3+1+4+3+1 = 18 punti onori.

**Mano(i):** `♠AQ854 ♥K9 ♦J87 ♣AKJ`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1455`

**Domanda:** Quanti punti onori ha questa mano? ♠KJ73 ♥AQ5 ♦K84 ♣Q92

**Opzioni:**
- 12
- 14
- 15 ✅
- 16

**Spiegazione:** ♠ K(3)+J(1)=4 | ♥ A(4)+Q(2)=6 | ♦ K(3)=3 | ♣ Q(2)=2. Totale: 4+6+3+2 = 15 punti. (Il 9 non vale nulla nel conteggio dei punti onori.)

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (hand-eval) — `src/data/lessons.ts:1463`

**Domanda:** Conta i punti onori di questa mano:

**Mano:** `♠AJ84 ♥KQ73 ♦A92 ♣J5`

**Risposta corretta:** 15 ✅

**Spiegazione:** ♠ A(4)+J(1)=5 | ♥ K(3)+Q(2)=5 | ♦ A(4)=4 | ♣ J(1)=1. Totale: 5+5+4+1 = 15 punti onori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 7-2: Quando aprire la dichiarazione

#### Blocco 5 (quiz) — `src/data/lessons.ts:1505`

**Domanda:** Hai ♠93 ♥J7 ♦KQJ75 ♣K753. Sono 10 punti. Cosa fai?

**Opzioni:**
- Apri 1♦
- Apri 1♣
- Passi ✅
- Apri 1NT

**Spiegazione:** Con 10 punti onori si passa. Non si hanno i requisiti minimi per aprire (almeno 12 punti). Anche se i Quadri sono belli, la forza complessiva è insufficiente.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (hand-eval) — `src/data/lessons.ts:1518`

**Domanda:** Conta i punti di questa mano. Apriresti?

**Mano:** `♠A93 ♥KJ72 ♦Q84 ♣K53`

**Risposta corretta:** 13 ✅

**Spiegazione:** ♠ A(4)=4 | ♥ K(3)+J(1)=4 | ♦ Q(2)=2 | ♣ K(3)=3. Totale: 4+4+2+3 = 13 punti. Con 13 punti si apre SEMPRE!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (bid-select) — `src/data/lessons.ts:1525`

**Domanda:** Hai ♠93 ♥AK752 ♦Q84 ♣KJ3 (13 punti, distribuzione 5332). Cosa apri?

**Mano:** `♠93 ♥AK752 ♦Q84 ♣KJ3`

**Opzioni:**
- 1H ✅
- 1NT
- 1D
- P

**Spiegazione:** Con 13 punti e distribuzione 5332, non sei nel range 15-17 per 1NT. Apri 1♥, il tuo colore più lungo!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 7-3: La distribuzione e la scelta del colore

#### Esempio 4 — `src/data/lessons.ts:1562`

**Testo:** ♠K2 ♥4 ♦KJ876 ♣AQ873 → 1♦ (due quinti, apri nel più alto). ♠AQJ3 ♥KJ62 ♦Q7 ♣853 → 1♥ (due quarti nobili, apri nel più basso). ♠53 ♥AJ4 ♦K9 ♣AJ10762 → 1♣ (un colore lungo).

**Mano(i):** `♠K2 ♥4 ♦KJ876 ♣AQ873 → 1♦`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1568`

**Domanda:** Hai ♠AKJ8 ♥Q982 ♦K8 ♣AQ3 (17 punti, distribuzione 4432). Cosa apri?

**Opzioni:**
- 1♠
- 1♥
- 1♣
- 1NT ✅

**Spiegazione:** Con una mano bilanciata (4432) e 17 punti si apre 1NT! L'apertura di 1NT (15-17 punti, mano bilanciata) prevale sempre sull'apertura a colore.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (bid-select) — `src/data/lessons.ts:1576`

**Domanda:** Hai ♠K2 ♥4 ♦KJ876 ♣AQ873 (13 punti, due quinti). Cosa apri?

**Mano:** `♠K2 ♥4 ♦KJ876 ♣AQ873`

**Opzioni:**
- 1C
- 1D ✅
- 1H
- 1NT

**Spiegazione:** Con due colori di 5 carte, si apre nel più alto di rango: 1♦ (i Quadri hanno rango superiore ai Fiori). Così nella ridichiara potrai mostrare anche i Fiori!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (bid-select) — `src/data/lessons.ts:1584`

**Domanda:** Hai ♠AQJ3 ♥KJ62 ♦Q73 ♣85 (12 punti, due quarti nobili). Cosa apri?

**Mano:** `♠AQJ3 ♥KJ62 ♦Q73 ♣85`

**Opzioni:**
- 1S
- 1H ✅
- 1D
- 1NT

**Spiegazione:** Con due quarti nobili (♠ e ♥), apri nel più basso: 1♥. In ridichiara potrai dire 1♠ senza salire di livello!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 7-4: Le aperture forti: livello 2

#### Esempio 4 — `src/data/lessons.ts:1621`

**Testo:** ♠AKQ9653 ♥2 ♦65 ♣873 → 4♠ (7 vincenti a Picche). ♠- ♥843 ♦KQJ8763 ♣972 → 3♦ (6 vincenti a Quadri).

**Mano(i):** `♠AKQ9653 ♥2 ♦65 ♣873 → 4♠`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1627`

**Domanda:** Hai ♠AQJ975 ♥AKJ ♦5 ♣KQ4. Sono 20 punti con 8 vincenti circa. Come apri?

**Opzioni:**
- 1♠
- 2♠ ✅
- 2♣
- 2NT

**Spiegazione:** Con 20 punti e una mano sbilanciata con almeno 8 vincenti, si apre a livello 2 nel proprio colore lungo: 2♠. Non 1♠ (troppo forte), non 2♣ (riservata alle bilanciate 24+ o alle mani a base fiori), non 2NT (non è bilanciata).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-7-1: 📝 Punti onore e punti distribuzione

#### Blocco 1 (hand-eval) — `src/data/lessons.ts`

**Domanda:** Quanti punti onore (PO) ha questa mano? ♠AKJ5 ♥Q83 ♦K72 ♣J64

**Mano:** `♠AKJ5 ♥Q83 ♦K72 ♣J64`

**Risposta corretta:** 14 ✅

**Spiegazione:** ♠A(4)+K(3)+J(1) = 8, ♥Q(2) = 2, ♦K(3) = 3, ♣J(1) = 1. Totale: 14 PO.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (hand-eval) — `src/data/lessons.ts`

**Domanda:** Quanti punti onore ha questa mano? ♠Q1074 ♥AK ♦9843 ♣A52

**Mano:** `♠Q1074 ♥AK ♦9843 ♣A52`

**Risposta corretta:** 13 ✅

**Spiegazione:** ♠Q(2) = 2, ♥A(4)+K(3) = 7, ♣A(4) = 4. Totale: 13 PO.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Con quale minimo di PO si apre in prima/seconda posizione?

**Opzioni:**
- 12 PO (a volte 11 con buona distribuzione) ✅
- 15 PO
- 10 PO
- 8 PO

**Spiegazione:** L'apertura richiede almeno 12 PO, talvolta 11 con distribuzione favorevole.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Quanti punti totali nel mazzo?

**Opzioni:**
- 40 punti onore ✅
- 52 punti
- 37 punti
- 48 punti

**Spiegazione:** 4 Assi (16) + 4 Re (12) + 4 Donne (8) + 4 Fanti (4) = 40 punti onore totali.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-7-2: 📝 Scelta dell'apertura

#### Blocco 0 (bid-select) — `src/data/lessons.ts`

**Domanda:** ♠AK843 ♥72 ♦KQ5 ♣J93 — Con 13 PO e 5 Picche, cosa apri?

**Opzioni:**
- 1♠ ✅
- 1♦
- 1SA
- Passo

**Spiegazione:** 13 PO e un colore quinto nobile: apertura di 1♠.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 1 (bid-select) — `src/data/lessons.ts`

**Domanda:** ♠KJ5 ♥A83 ♦KQ72 ♣Q64 — Con 15 PO e mano bilanciata, cosa apri?

**Opzioni:**
- 1SA ✅
- 1♦
- 1♣
- Passo

**Spiegazione:** 15-17 PO e distribuzione bilanciata (4-3-3-3): apertura 1SA.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (bid-select) — `src/data/lessons.ts`

**Domanda:** ♠Q7 ♥KJ965 ♦A83 ♣K104 — Con 13 PO e 5 Cuori, cosa apri?

**Opzioni:**
- 1♥ ✅
- 1♦
- 1SA
- Passo

**Spiegazione:** 13 PO e colore quinto: si apre nel colore quinto, 1♥.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 8: L'apertura e la risposta

_Le aperture di 1NT e 2NT e le risposte del compagno_


### Modulo 8-1: L'apertura di 1NT

#### Esempio 4 — `src/data/lessons.ts:1677`

**Testo:** ♠KQ76 ♥AQ62 ♦KQ7 ♣98 → 1NT (16 punti, bilanciata 4432). ♠J6 ♥KQ7 ♦KJ2 ♣AJ854 → 1NT (15 punti, bilanciata 5332).

**Mano(i):** `♠KQ76 ♥AQ62 ♦KQ7 ♣98 → 1NT`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1683`

**Domanda:** Hai ♠AJ5 ♥KQ73 ♦A84 ♣K92 (17 punti, 4333). Cosa apri?

**Opzioni:**
- 1♥
- 1♣
- 1NT ✅
- Passo

**Spiegazione:** Con 17 punti e distribuzione bilanciata (4333) si apre 1NT. L'apertura di 1NT prevale sempre su quella a colore quando ne hai i requisiti!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (hand-eval) — `src/data/lessons.ts:1691`

**Domanda:** Conta i punti di questa mano. E un'apertura di 1NT?

**Mano:** `♠KQ8 ♥AJ73 ♦Q92 ♣K85`

**Risposta corretta:** 15 ✅

**Spiegazione:** ♠ K(3)+Q(2)=5 | ♥ A(4)+J(1)=5 | ♦ Q(2)=2 | ♣ K(3)=3. Totale: 5+5+2+3 = 15. Sì, è un'apertura di 1NT (15-17, bilanciata 4333)!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 8-2: Le risposte a 1NT

#### Esempio 4 — `src/data/lessons.ts:1727`

**Testo:** Il compagno apre 1NT. Hai ♠AQ8743 ♥K5 ♦J42 ♣76. Sai che c'è fit a Picche (almeno 8 carte) e punti per manche (25-27). Rispondi 4♠ direttamente!

**Mano(i):** `♠AQ8743 ♥K5 ♦J42 ♣76 → 4♠`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1733`

**Domanda:** Il compagno apre 1NT (15-17). Hai ♠876 ♥J109652 ♦42 ♣76 (1 punto). Cosa rispondi?

**Opzioni:**
- Passo
- 2♥ ✅
- 3♥
- 4♥

**Spiegazione:** Con 1 punto la manche è irraggiungibile (17+1=18, lontano da 25). Ma con 6 carte di Cuori, giocare 2♥ è molto meglio che lasciare il compagno a 1NT. La risposta 2♥ a colore è conclusiva: l'apertore deve passare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (bid-select) — `src/data/lessons.ts:1741`

**Domanda:** Il compagno apre 1NT. Hai ♠AK9753 ♥Q4 ♦K62 ♣83 (12 punti, 6 Picche). Cosa rispondi?

**Mano:** `♠AK9753 ♥Q4 ♦K62 ♣83`

**Opzioni:**
- 2S
- 3S
- 4S ✅
- 3NT

**Spiegazione:** Con 12 punti e 6 Picche, la somma è 27-29: manche sicura! Con un colore di almeno 6 carte, il fit è garantito (l'apertore di 1NT ha almeno 2 Picche). Rispondi direttamente 4♠!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 8-3: La Stayman

#### Esempio 3 — `src/data/lessons.ts:1773`

**Testo:** Ovest apre 1NT. Est ha ♠KJ76 ♥A842 ♦65 ♣K83. Est dice 2♣ (Stayman). Ovest risponde 2♥ ("ho 4 Cuori"). Est dichiara 4♥: fit trovato, punti per manche!

**Mano(i):** `♠KJ76 ♥A842 ♦65 ♣K83 → 2♣ (Stayman)`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1784`

**Domanda:** Il compagno apre 1NT. Hai ♠Q942 ♥J1042 ♦K5 ♣KQ3 (11 punti, due quarte nobili). Cosa rispondi?

**Opzioni:**
- 3NT direttamente
- 2♣ (Stayman) ✅
- 2♥
- Passo

**Spiegazione:** Con 11 punti e due colori nobili quarti, usa la Stayman (2♣) per cercare il fit 4-4. Se il compagno risponde 2♥ o 2♠ hai trovato il fit e vai a manche nel nobile. Se risponde 2♦ (nessuna quarta nobile), giochi 3NT.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (bid-select) — `src/data/lessons.ts:1797`

**Domanda:** Hai aperto 1NT. Il compagno dice 2♣ (Stayman). Hai ♠AK86 ♥Q93 ♦KJ7 ♣A84. Cosa rispondi?

**Mano:** `♠AK86 ♥Q93 ♦KJ7 ♣A84`

**Opzioni:**
- 2D
- 2H
- 2S ✅
- 2NT

**Spiegazione:** Hai 4 Picche e meno di 4 Cuori. La risposta alla Stayman è 2♠! Mostra le tue 4 Picche al compagno.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 8-4: L'apertura e le risposte a 2NT

#### Esempio 3 — `src/data/lessons.ts:1829`

**Testo:** Ovest apre 2NT (21-23). Est ha ♠95 ♥J965 ♦865 ♣AJ92. La somma è almeno 25: manche sicura. Est usa 3♣ (Stayman). Ovest risponde 3♥: fit trovato! Est dichiara 4♥.

**Mano(i):** `♠95 ♥J965 ♦865 ♣AJ92`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/lessons.ts:1840`

**Domanda:** Il compagno apre 2NT (21-23). Hai ♠J3 ♥K52 ♦AQJ52 ♣J76 (11 punti). Cosa rispondi?

**Opzioni:**
- Passo
- 3♦
- 3NT ✅
- 3♣ (Stayman)

**Spiegazione:** Con 11 punti la somma è almeno 32 (21+11): manche sicura e possibile slam! Senza fit nobile in vista (solo 3 carte a Cuori, 2 a Picche), la scelta migliore è 3NT direttamente. Le Quadri daranno molte prese a NT.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-8-1: 📝 Risposte all'apertura di 1SA

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Il partner apre 1SA (15-17). Voi avete 8 PO. Cosa rispondete?

**Opzioni:**
- 3SA (con 8 PO + almeno 15 del partner = 23+ punti totali in linea) ✅
- Passo
- 2SA
- 2♣ Stayman

**Spiegazione:** Con 8+ PO di fronte a 1SA (15-17), si hanno 23+ punti in linea: si va a manche 3SA.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Il partner apre 1SA. Voi avete ♠Q9843 ♥72 ♦J64 ♣852 (3 PO). Cosa fate?

**Opzioni:**
- 2♠ (transfer: mostrate le 5+ Picche e giocate in parziale) ✅
- Passo
- 3♠
- 2♣ Stayman

**Spiegazione:** Con mano debole e 5 carte a Picche, si usa il transfer 2♠ per giocare un parziale a Picche.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Quando si usa la Stayman 2♣ su apertura 1SA?

**Opzioni:**
- Quando si ha un colore quarto nobile (4♥ o 4♠) e almeno 8+ PO ✅
- Sempre con 10+ PO
- Solo con 4-4 nei nobili
- Mai senza 12 PO

**Spiegazione:** Stayman cerca un fit 4-4 in un nobile. Serve almeno un quarto nobile e 8+ PO.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 9: Aperture di 1 a colore. Le risposte

_Come rispondere all'apertura del compagno_


### Modulo 9-1: Risposte limitative, invitanti, forzanti

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Il compagno apre 1♠ e tu hai 3 punti. Cosa dici?

**Opzioni:**
- 1NT
- 2♠
- Passo ✅
- 2♣

**Spiegazione:** Con meno di 5 punti si dice Passo: la manche non è realizzabile perché la coppia avrebbe al massimo 23 punti (20+3).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/lessons.ts`

**Domanda:** Una risposta di colore nuovo è sempre forzante (l'apertore non può passare)?

**Risposta corretta:** Vero ✅

**Spiegazione:** Esatto! Il colore nuovo è la dichiarazione forzante per eccellenza: promette 5+ punti e chiede all'apertore di parlare ancora.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 9-2: Gli appoggi

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Il compagno apre 1♦ e tu hai:

**Mano(i):** `♠Q53 ♥A5 ♦Q874 ♣7654`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 7 — `src/data/lessons.ts`

**Testo:** Legge di Rivalutazione - il compagno apre 1♥ e tu hai:

**Mano(i):** `♠8 ♥KJ72 ♦KQ74 ♣7642`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 9 (quiz) — `src/data/lessons.ts`

**Domanda:** Il compagno apre 1♥ e tu hai: ♠83 ♥AJ5 ♦K9874 ♣K32. Cosa rispondi?

**Opzioni:**
- 2♥
- 3♥ ✅
- 4♥
- 1NT

**Spiegazione:** Avete 10 punti e fit di 3 carte a Cuori: è un appoggio invitante (livello 3). Se il compagno ha 14+, la manche sarà raggiungibile.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 10 (hand-eval) — `src/data/lessons.ts`

**Domanda:** Conta i punti della mano: ♠K82 ♥Q963 ♦A74 ♣J65

**Mano:** `♠K82 ♥Q963 ♦A74 ♣J65`

**Risposta corretta:** 10 ✅

**Spiegazione:** K=3, Q=2, A=4, J=1. Totale: 10 punti onori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 9-3: I colori nuovi a livello 1 e 2

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Il compagno apre 1♣ e voi avete:

**Mano(i):** `♠82 ♥KJ72 ♦Q92 ♣7642`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (quiz) — `src/data/lessons.ts`

**Domanda:** Il compagno apre 1♦ e voi avete: ♠AQ7 ♥AQJ762 ♦K4 ♣A2. Cosa rispondete?

**Opzioni:**
- 2♥
- 1♥ ✅
- 4♥
- 3NT

**Spiegazione:** Dite 1♥! La risposta 'uno su uno' mostra 5 o più punti con un massimo illimitato. Non saltate a 2♥ che richiederebbe di mostrare una mano completamente diversa.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 9 (bid-select) — `src/data/lessons.ts`

**Domanda:** Il compagno apre 1♦, avete 4 cuori e 4 picche con 8 punti. Quale colore mostrate per primo?

**Opzioni:**
- 1♥ ✅
- 1♠
- 1NT
- 2♦

**Spiegazione:** Con due colori quarti si inizia dal più economico: 1♥ viene prima di 1♠.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 9-4: La risposta 1NT, 2NT e 3NT

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Il compagno ha aperto 1♥ e voi avete:

**Mano(i):** `♠32 ♥4 ♦QJ973 ♣KQ852`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 6 — `src/data/lessons.ts`

**Testo:** Risposte a Senza - su apertura 1♣ avete:

**Mano(i):** `♠AQ6 ♥KJ4 ♦J1098 ♣QJ6`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (quiz) — `src/data/lessons.ts`

**Domanda:** Su apertura 1♠, se rispondete 1NT, cosa state negando?

**Opzioni:**
- Di avere punti
- Il fit a Picche (3+ carte) ✅
- Di avere un colore lungo
- Di voler giocare

**Spiegazione:** Su 1♠ (apertura lungo+corto, 5+ picche garantite) la risposta 1NT nega il fit a Picche: avete al massimo 2 carte di Picche. Mostra 5-10 punti e non ci sono colori dichiarabili a livello 1 sopra le Picche. Può avere qualsiasi distribuzione.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 9 (true-false) — `src/data/lessons.ts`

**Domanda:** La risposta 1NT è sempre forzante?

**Risposta corretta:** Falso ✅

**Spiegazione:** No! La risposta 1NT è NON FORZANTE: mostra 5-10 punti. L'apertore può passare se ha mano minima.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-9-1: 📝 Risposte all'apertura di 1 a colore

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Il partner apre 1♥. Con quanti PO siete obbligati a rispondere?

**Opzioni:**
- Con 6+ PO (obbligo di risposta) ✅
- Con 10+ PO
- Con 12+ PO
- Con 8+ PO

**Spiegazione:** Con 6+ PO si risponde sempre all'apertura del partner. Sotto i 6 PO si passa.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Partner apre 1♥. Avete ♠K742 ♥Q83 ♦964 ♣J75 (6 PO e 3 carte ♥). Risposta?

**Opzioni:**
- 2♥ (appoggio con 3+ carte nel seme del partner e 6-9 PO) ✅
- 1♠
- 1SA
- Passo

**Spiegazione:** Con 3+ carte nel seme del partner e 6-9 PO si dà l'appoggio semplice (2♥).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Partner apre 1♦. Avete ♠AQ85 ♥KJ3 ♦72 ♣10964 (10 PO). Risposta?

**Opzioni:**
- 1♠ (si nomina il proprio colore quarto nobile dal basso) ✅
- 1SA
- 2♣
- 2♦

**Spiegazione:** Con un quarto nobile e 6+ PO, si nomina il proprio colore a livello 1 (1♠).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Qual è il significato della risposta 1SA sull'apertura 1 a colore?

**Opzioni:**
- 6-9 PO, nessun fit con il partner, nessun colore quarto nominabile a livello 1 ✅
- 10-12 PO bilanciati
- Proposta di manche a SA
- Obbligo per una volta

**Spiegazione:** 1SA = 6-9 PO, risposta di ripiego quando non si può appoggiare né nominare un colore.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 10: L'apertore descrive

_La ridichiara dell'apertore dopo la risposta_


### Modulo 10-1: Il compito dell'apertore

#### Blocco 5 (quiz) — `src/data/lessons.ts`

**Domanda:** Avete aperto 1♦ e il compagno ha risposto 1♠. Avete 13 punti e mano bilanciata. Cosa dite?

**Opzioni:**
- 2♦
- 1NT ✅
- 2♠
- 2NT

**Spiegazione:** Con mano di Diritto bilanciata, il Livello di Guardia è 1NT. Dichiarate 1NT per descrivere forza 12-15 e distribuzione bilanciata.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/lessons.ts`

**Domanda:** L'apertore con 12-15 punti ha una mano di 'Diritto'?

**Risposta corretta:** Vero ✅

**Spiegazione:** Esatto! La mano di Diritto è nella fascia 12-15 punti. La mano di Rovescio è 16-20.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 10-2: Ridichiarazione dopo risposta 1 su 1

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Aprite 1♣, il compagno risponde 1♠ e avete:

**Mano(i):** `♠AKJ7 ♥Q43 ♦42 ♣KJ86`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 5 — `src/data/lessons.ts`

**Testo:** Aprite 1♥, il compagno risponde 1♠ e avete:

**Mano(i):** `♠J7 ♥KQ943 ♦AQ65 ♣J7`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (quiz) — `src/data/lessons.ts`

**Domanda:** Aprite 1♣, il compagno risponde 1♠. Avete: ♠AK7 ♥QJ43 ♦42 ♣KJ86. Cosa dite?

**Opzioni:**
- 1NT ✅
- 2♥
- 2♠
- 2♣

**Spiegazione:** Mano di Diritto bilanciata: non gli è concesso dichiarare le Cuori (sarebbe un colore nuovo sopra il LDG di 1NT). Dichiarate 1NT. Nessun timore di perdere fit: Nord non ha 4 carte di Cuori (altrimenti avrebbe detto 1♥ prima di 1♠), oppure le ha accanto a Picche più lunghe e le mostrerà al giro successivo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (hand-eval) — `src/data/lessons.ts`

**Domanda:** Conta i punti della mano: ♠AKJ7 ♥Q43 ♦42 ♣KJ86

**Mano:** `♠AKJ7 ♥Q43 ♦42 ♣KJ86`

**Risposta corretta:** 14 ✅

**Spiegazione:** A=4, K=3, J=1, Q=2, K=3, J=1. Totale: 14 punti. Mano di Diritto!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 10-3: Mano di Rovescio

#### Esempio 2 — `src/data/lessons.ts`

**Testo:** Aprite 1♣, il compagno risponde 1♦ e avete:

**Mano(i):** `♠AKJ7 ♥Q43 ♦4 ♣AKJ86`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 4 — `src/data/lessons.ts`

**Testo:** Aprite 1♥, il compagno risponde 1♠ e avete:

**Mano(i):** `♠A7 ♥AQ943 ♦4 ♣AKJ86`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (quiz) — `src/data/lessons.ts`

**Domanda:** Aprite 1♦, il compagno risponde 1♠. Avete: ♠A987 ♥AQ3 ♦KQ874 ♣6. Con 16 punti, cosa dite?

**Opzioni:**
- 2♠
- 3♠ ✅
- 2♦
- 4♠

**Spiegazione:** Mano di Rovescio! Dovete comunicare fit e forza. L'appoggio a livello 3 descrive una mano di Rovescio minimo (circa 16-18): se tale forza è sbilanciata, automaticamente la mano è sbilanciata, altrimenti avreste aperto 1NT.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (bid-select) — `src/data/lessons.ts`

**Domanda:** Aprite 1♥, il compagno risponde 1♠. Avete 18 punti e mano bilanciata. Cosa dite?

**Opzioni:**
- 1NT
- 2NT ✅
- 3NT
- 2♥

**Spiegazione:** Con mano di Rovescio bilanciata (18-20 punti), il salto a 2NT descrive la vostra forza extra.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 10-4: Ridichiarazione dopo risposta 2 su 1

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Ovest apre 1♦, Est risponde 2♣ e poi:

**Mano(i):** `♠93 ♥AK73 ♦KQJ5 ♣983`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (quiz) — `src/data/lessons.ts`

**Domanda:** Aprite 1♦, il compagno risponde 2♣ (forzante a manche). Avete: ♠AJ10 ♥62 ♦A73 ♣KQ754. Cosa dite?

**Opzioni:**
- 2♦ ✅
- 3♣
- 2NT
- 3NT

**Spiegazione:** Descrivete semplicemente: mostrate i Quadri per continuare il dialogo. Poiché la risposta 2 su 1 è forzante a manche, non c'è fretta di saltare livelli. Il dialogo continuerà fino alla manche.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (true-false) — `src/data/lessons.ts`

**Domanda:** Sulle risposte 2 su 1, l'apertore deve distinguere tra Diritto e Rovescio?

**Risposta corretta:** Falso ✅

**Spiegazione:** No! Sulle risposte 2 su 1 (forzanti a manche), l'apertore descrive senza fare distinzioni: non importa se è di Diritto o Rovescio.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-10-1: 📝 La ridichiara

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Avete aperto 1♥ con 14 PO. Il partner risponde 1♠ (6+ PO). Che fascia siete?

**Opzioni:**
- Fascia minima (12-15 PO): ridichiara al livello più basso possibile ✅
- Fascia intermedia (16-18 PO)
- Fascia massima (19+ PO)
- Non devo ridichiarare

**Spiegazione:** Con 14 PO siete in fascia minima (12-15). Ridichiarate al livello più basso senza forzare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Avete aperto 1♦ con 17 PO. Partner risponde 1♠. Come ridichiarate?

**Opzioni:**
- Con un salto (es. 2SA o 3♦) per mostrare 16-18 PO: fascia intermedia ✅
- Passo
- Al livello minimo
- 4♠ direttamente

**Spiegazione:** Con 17 PO siete in fascia intermedia (16-18): ridichiarate con un salto per comunicarlo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Cosa significa quando l'apertore ripete il proprio colore (es. 1♥ - 1♠ - 2♥)?

**Opzioni:**
- Ha almeno 6 carte nel colore e fascia minima ✅
- Ha 4 carte
- Ha 5 carte e tanti punti
- Vuole giocare a SA

**Spiegazione:** La ripetizione del colore a livello minimo mostra 6+ carte e fascia minima (12-15 PO).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 11: L'intervento

_Come entrare nella dichiarazione avversaria_


### Modulo 11-1: L'intervento di Contro

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Sud ha aperto 1♦, tocca a Ovest con:

**Mano(i):** `♠KJ98 ♥AQ74 ♦5 ♣K983`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (quiz) — `src/data/lessons.ts`

**Domanda:** Sud apre 1♣, tocca a voi con: ♠9854 ♥K4 ♦A765 ♣AJ3. Cosa dite?

**Opzioni:**
- Contro
- 1♦
- 1NT
- Passo ✅

**Spiegazione:** Passo! I punti basterebbero per intervenire, ma mancano le Cuori. Il compagno, a cui si sta chiedendo di scegliere un colore (con l'implicita promessa di portargli fit), si sentirebbe tradito.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (true-false) — `src/data/lessons.ts`

**Domanda:** Il Contro informativo su apertura 1♦ garantisce almeno 4 Cuori e 4 Picche?

**Risposta corretta:** Vero ✅

**Spiegazione:** Nella fascia 12-16 punti, il Contro su apertura a minore garantisce 4+4 nei nobili (o almeno 4+3).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 11-2: Il compagno del contrante

#### Esempio 2 — `src/data/lessons.ts`

**Testo:** Sud apre 1♦, Ovest dice Contro, Nord passa. Est ha:

**Mano(i):** `♠54 ♥J986 ♦952 ♣Q532`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 5 — `src/data/lessons.ts`

**Testo:** Dopo Contro del compagno, con carte buone:

**Mano(i):** `♠KJ954 ♥A76 ♦95 ♣K64`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (quiz) — `src/data/lessons.ts`

**Domanda:** Il compagno dice Contro su 1♦ avversario. Avete: ♠K4 ♥Q86 ♦AJ10 ♣K954. Cosa dite?

**Opzioni:**
- 1♥
- 2♦
- 1NT
- 3NT ✅

**Spiegazione:** 3NT! Il punteggio è sufficiente, il fit a Cuori o Picche è escluso, e il fermo a Quadri c'è: decisione facile.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (hand-eval) — `src/data/lessons.ts`

**Domanda:** Conta i punti della mano: ♠KJ954 ♥A76 ♦95 ♣K64

**Mano:** `♠KJ954 ♥A76 ♦95 ♣K64`

**Risposta corretta:** 11 ✅

**Spiegazione:** K=3, J=1, A=4, K=3. Totale: 11 punti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 11-3: L'intervento di 1NT e a colore

#### Esempio 2 — `src/data/lessons.ts`

**Testo:** Sud ha aperto 1♥, Ovest ha:

**Mano(i):** `♠AJ5 ♥KJ7 ♦AJ1053 ♣K8`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 7 — `src/data/lessons.ts`

**Testo:** Intervento a colore 1 su 1 - apertura avversaria 1♦:

**Mano(i):** `♠82 ♥AKJ1042 ♦86 ♣983`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 9 (quiz) — `src/data/lessons.ts`

**Domanda:** Sud apre 1♥. Avete: ♠AK5 ♥98 ♦AK73 ♣QJ97. Cosa dite?

**Opzioni:**
- Contro ✅
- 1NT
- 2♦
- Passo

**Spiegazione:** Contro! Non 1NT perché non avete il fermo a Cuori (98 non basta). Il Contro è appropriato: avete i punti e la giocabilità nei colori rimasti. Non importa che non abbiate esattamente 4 Picche: con 17 punti e questa distribuzione il Contro è la scelta migliore.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 10 (bid-select) — `src/data/lessons.ts`

**Domanda:** Sud apre 1♠. Avete: mano bilanciata, 16 punti, KJ7 di Picche. Come intervenite?

**Opzioni:**
- Contro
- 1NT ✅
- 2♣
- Passo

**Spiegazione:** 1NT! Avete la distribuzione bilanciata (15-17 range), il fermo a Picche (KJ7) e i punti giusti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 11-4: L'intervento a colore: requisiti e consigli

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Apertura avversaria di 1♠, intervento in 2a posizione:

**Mano(i):** `♠54 ♥98 ♦KQJ862 ♣A76`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (quiz) — `src/data/lessons.ts`

**Domanda:** L'avversario apre 1♠. Avete: ♠K98 ♥87 ♦KQ4 ♣AJ543. Cosa dite?

**Opzioni:**
- 2♣
- Contro
- 1NT
- Passo ✅

**Spiegazione:** Passo! Le Fiori sono scarsamente onorate per un intervento a livello 2 (servirebbero 6 carte), e la mano non è adatta né al Contro (mancano le Cuori) né a 1NT (manca il fermo sicuro a Picche con solo K98). Meglio aspettare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (true-false) — `src/data/lessons.ts`

**Domanda:** L'intervento a colore può mostrare più di 16/17 punti?

**Risposta corretta:** Falso ✅

**Spiegazione:** No! L'intervento a colore ha un preciso limite superiore di 16-17 punti. Con di più, si usa il Contro (seguito da eventuale cambio di colore) per mostrare forza extra.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-11-1: 📝 Intervento e contre

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** L'avversario destro apre 1♥. Cos'è un 'intervento'?

**Opzioni:**
- Una dichiarazione fatta dopo l'apertura avversaria per competere nell'asta ✅
- Un tipo di giocata in difesa
- Una penalità
- Una convenzione

**Spiegazione:** L'intervento è una dichiarazione competitiva fatta dopo l'apertura dell'avversario.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Quando è opportuno intervenire a colore?

**Opzioni:**
- Con un buon colore quinto+ e 8-15 PO circa ✅
- Solo con 12+ PO
- Con qualsiasi mano
- Mai, è rischioso

**Spiegazione:** L'intervento a colore richiede un buon colore quinto (o sesto) e circa 8-15 PO.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Cos'è il 'Contre' (X) informativo?

**Opzioni:**
- Un Contre che chiede al partner di dichiarare il suo colore migliore tra quelli non nominati ✅
- Un Contre di penalità
- Un raddoppio del punteggio
- Una richiesta di passo

**Spiegazione:** Il Contre informativo chiede al partner di scegliere tra i colori non nominati dall'avversario.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/lessons.ts`

**Domanda:** Requisiti per il Contre informativo su apertura 1♥?

**Opzioni:**
- 12+ PO e supporto (almeno 3 carte) nei colori non dichiarati (♠, ♦, ♣) ✅
- 16+ PO qualsiasi mano
- Solo con 4-4 nei minori
- 8+ PO e 5 carte a Picche

**Spiegazione:** Il Contre informativo richiede 12+ PO e supporto nei colori non dichiarati dall'avversario.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 12: Sviluppi dopo l'intervento avversario

_Come proseguire quando l'avversario interviene_


### Modulo 12-1: Dichiarazioni obbligate e libere

#### Esempio 3 — `src/data/lessons.ts`

**Testo:** Il compagno apre 1♦, l'avversario interviene 1♠:

**Mano(i):** `♠xx ♥AQxxx ♦Qx ♣KJxx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/lessons.ts`

**Domanda:** Il compagno apre 1♦, l'avversario dice 1♠. Avete: ♠Jxx ♥Kx ♦Qxxx ♣Qxxx. Cosa dite?

**Opzioni:**
- 2♦
- 1NT
- Passo ✅
- Contro

**Spiegazione:** Passo! Senza l'intervento avreste detto 2♦ (5-9 punti con fit). Ma ora non siete più obbligati a parlare, e con solo 7 punti senza nulla di speciale, lasciate che il compagno decida.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (true-false) — `src/data/lessons.ts`

**Domanda:** Dopo un intervento avversario, con 4-5 punti bisogna sempre rispondere?

**Risposta corretta:** Falso ✅

**Spiegazione:** No! L'intervento avversario toglie l'obbligo di parlare con mani deboli. Se non avete nulla di speciale, passate.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 12-2: Su intervento di Contro

#### Esempio 4 — `src/data/lessons.ts`

**Testo:** L'avversario dice Contro dopo apertura 1♥ del compagno:

**Mano(i):** `♠Kx ♥Jx ♦AQx ♣KQJ10xx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/lessons.ts`

**Domanda:** Il compagno apre 1♥, l'avversario dice Contro. Avete: ♠xx ♥Jx ♦xxx ♣KQ10xxx. Cosa dite?

**Opzioni:**
- Surcontro
- 2♣ ✅
- 2♥
- Passo

**Spiegazione:** 2♣: un colore nuovo dopo Contro è non forzante. Mostra che 'sarei contento di giocare 2♣!' con un buon colore di 6 carte. Non avete gli 11 punti per il Surcontro.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (bid-select) — `src/data/lessons.ts`

**Domanda:** Il compagno apre 1♥, l'avversario dice Contro. Avete 12 punti. Cosa dite?

**Opzioni:**
- 2♥
- Surcontro ✅
- 2♣
- Passo

**Spiegazione:** Surcontro! Con 11+ punti dopo Contro avversario, il Surcontro è l'UNICA dichiarazione forte. La descrizione si rimanda al giro dopo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 12-3: Su intervento a colore

#### Esempio 5 — `src/data/lessons.ts`

**Testo:** Apertura 1♦, intervento avversario 1♠:

**Mano(i):** `♠xx ♥AQxxx ♦Qx ♣KJxx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 7 — `src/data/lessons.ts`

**Testo:** Apertura 1♦, intervento avversario 1♥:

**Mano(i):** `♠xx ♥AQxx ♦Q10xx ♣Qxx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 9 (quiz) — `src/data/lessons.ts`

**Domanda:** Il compagno apre 1♦, l'avversario dice 1♠. Avete: ♠xxx ♥Kxx ♦AQxx ♣KJx. Cosa dite?

**Opzioni:**
- 2♦ ✅
- 1NT
- Contro
- 2NT

**Spiegazione:** 2♦: gli appoggi rimangono invariati come se l'intervento non ci fosse stato. Avete fit a Quadri e 11 punti: un appoggio invitante. Non servono 5 carte per appoggiare!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 10 (true-false) — `src/data/lessons.ts`

**Domanda:** Dopo intervento avversario a colore, un colore nuovo del rispondente è forzante?

**Risposta corretta:** Vero ✅

**Spiegazione:** Sì! A differenza del caso dopo Contro (dove il colore nuovo è non forzante), dopo intervento a colore il colore nuovo resta FORZANTE.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 12-4: Il comportamento dell'apertore

#### Esempio 4 — `src/data/lessons.ts`

**Testo:** Aprite 1♦, il compagno passa, l'avversario dice 1♥, il compagno dice 1♠. L'avversario alla vostra destra dice 2♥. Avete:

**Mano(i):** `♠Jx ♥Kx ♦AQxxx ♣Qxxx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 6 — `src/data/lessons.ts`

**Testo:** Stessa sequenza, ma avete:

**Mano(i):** `♠x ♥xx ♦AKJxxx ♣AQx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 8 (quiz) — `src/data/lessons.ts`

**Domanda:** Aprite 1♣, il compagno dice 1♥, l'avversario dice 1♠. Avete: ♠AQxx ♥x ♦Qx ♣KQxxxx. Cosa dite?

**Opzioni:**
- 2♣
- Passo ✅
- 1NT
- Contro

**Spiegazione:** Passo! La mano è 'normale': è una sbilanciata di Diritto, ma non ha un colore eccezionale né fit per il compagno. La dichiarazione libera di 1♠ rende le Fiori reali e lunghe, visto che la mano deve essere sbilanciata. Ma con carta normale, passate.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 9 (hand-eval) — `src/data/lessons.ts`

**Domanda:** Conta i punti della mano: ♠AQ92 ♥K5 ♦J1074 ♣Q83

**Mano:** `♠AQ92 ♥K5 ♦J1074 ♣Q83`

**Risposta corretta:** 12 ✅

**Spiegazione:** A=4, Q=2, K=3, J=1, Q=2. Totale: 12 punti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo eserciziario-12-1: 📝 Sviluppi dopo l'intervento

#### Blocco 1 (quiz) — `src/data/lessons.ts`

**Domanda:** Il partner apre 1♥, l'avversario interviene 1♠. Con ♥K843 e 8 PO, cosa fate?

**Opzioni:**
- 2♥ (appoggio semplice, come senza intervento) ✅
- Passo obbligato
- Contre
- 2♠

**Spiegazione:** Con fit e 6-9 PO si dà appoggio semplice, come senza intervento.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/lessons.ts`

**Domanda:** Cos'è il 'Contre' del rispondente sull'intervento avversario?

**Opzioni:**
- Un Contre che mostra 9+ PO e valori nei colori non dichiarati (Contre negativo) ✅
- Un Contre di penalità
- Una richiesta di passo
- Significa che odia l'apertura del partner

**Spiegazione:** Il Contre del rispondente (negativo) mostra PO e valori, specialmente nei colori non nominati.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/lessons.ts`

**Domanda:** Perché la dichiarazione competitiva è importante?

**Opzioni:**
- Perché in molte mani entrambe le coppie possono fare un parziale: chi dichiara di più vince ✅
- Non è importante
- Solo per confondere gli avversari
- Solo quando si ha 20+ PO in linea

**Spiegazione:** In mani competitive (20 PO per parte), chi dichiara meglio conquista il parziale e i punti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

