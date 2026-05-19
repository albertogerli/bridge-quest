# Review esperto — Corso Quadri (Approfondimenti)

> Documento generato automaticamente.
> Sorgente: `src/data/quadri-lessons.ts`
> Per ogni voce, segna ✅ OK o annota la correzione.


## Lezione 1: Tempi e comunicazioni nel gioco a Senza


### Modulo Q1-1: Valutare i tempi

#### Esempio 3 — `src/data/quadri-lessons.ts:92`

**Testo:** Est gioca 3NT, attacco 5♠. Vincenti: 2♠ e 4♦. Ci sono 3 affrancabili nel colore di cuori e 4 nel colore di fiori, ma è rimasto un solo fermo a Picche. Si devono scegliere le Cuori che si affrancano in un tempo solo, e non le Fiori che richiedono due tempi.

**Mano(i):** `♠63 ♥KJ105 ♦AQ75 ♣J83 | ♠AK ♥Q6 ♦KJ6 ♣Q109762`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/quadri-lessons.ts:103`

**Domanda:** A Senza Atout, quando è meglio affrancare un colore con carte equivalenti (es. KQJ) rispetto a un colore che richiede un impasse?

**Opzioni:**
- Sempre: le carte equivalenti sono migliori
- Quando non si hanno abbastanza tempi per l'impasse ✅
- Mai: l'impasse è sempre preferibile
- Solo quando si hanno 9+ carte nel colore

**Spiegazione:** Le carte equivalenti NON danno prese extra all'avversario, mentre un impasse o un affrancamento di lunga cedono tempi. Quando il tempo stringe, preferite i colori 'solidi'.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q1-2: Valutare gli ingressi

#### Esempio 2 — `src/data/quadri-lessons.ts:136`

**Testo:** Est gioca 3NT, attacco a Cuori. Per prima cosa si dovrà dedicare alle Quadri (ha 5 vincenti), e le quadri forniranno 4 o 5 prese a seconda che riesca o meno l'impasse, muovendo dal morto verso la mano.

**Mano(i):** `♠AQ7 ♥K84 ♦875 ♣8763 | ♠86 ♥A32 ♦AQJ106 ♣AK4`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/quadri-lessons.ts:147`

**Domanda:** Se hai un colore di 7 carte tra mano e morto, con quale percentuale troverai la divisione 3/3 tra gli avversari?

**Opzioni:**
- 48%
- 36% ✅
- 50%
- 68%

**Spiegazione:** Con un colore di 7 carte, la 3/3 avversaria si trova nel 36% dei casi. La 4/2 è il 48%. Siate ottimisti se la probabilità di incassare l'intera lunghezza è altamente probabile.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q1-3: L'avversario pericoloso

#### Esempio 2 — `src/data/quadri-lessons.ts:175`

**Testo:** Est gioca 3NT, attacco Cuori su cui Nord gioca il Fante. Se l'impasse a quadri fallisce, Nord in presa gioca Cuori: mortale. Se invece l'impasse a Fiori fallisce, Sud prende col Re di Cuori senza poter continuare. Dunque scegliete Fiori!

**Mano(i):** `♠Q74 ♥KQ4 ♦AJ1097 ♣Q103 | ♠AK2 ♥Q8 ♦Q8 ♣AJ985`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:181`

**Domanda:** A 3NT, dopo un attacco nel vostro colore debole, quale difensore è l'avversario pericoloso?

**Opzioni:**
- Sempre quello alla vostra sinistra
- Sempre quello alla vostra destra
- Quello che può continuare nel colore di attacco ✅
- Quello con più punti

**Spiegazione:** L'avversario pericoloso è quello che, se entra in presa, può continuare a giocare il colore d'attacco e battere il contratto. Ogni volta che va in presa l'avversario, lavora a suo favore.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q1-4: Lisciare l'attacco

#### Esempio 1 — `src/data/quadri-lessons.ts:209`

**Testo:** Est gioca 3NT, attacco cuori su Nord con il Re. Il colore da affrancare, Fiori, prevede un impasse. Se Est vince l'attacco e lascia girare la Q♣, manterranno il contratto se l'impasse riesce. Ma rifiutando di prendere al primo e al secondo giro di Cuori, ha buone speranze di mantenere il contratto anche con le cuori divise 5-3 o 6-2.

**Mano(i):** `♠974 ♥72 ♦AK7 ♣AJ1063 | ♠AK32 ♥A94 ♦985 ♣Q92`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/quadri-lessons.ts:225`

**Domanda:** Giochi 3NT. L'attacco è nel colore di cuori. Hai Ax in mano. Quando conviene lisciare?

**Spiegazione:** Con Ax, lisciando al primo giro si esauriscono le cuori del difensore non lungo. Quando il partner dell'attaccante entrerà in presa non potrà più giocare cuori. È la tecnica del 'hold-up'.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 3: Contratti ad atout: tempo e controllo


### Modulo Q3-1: Il piano di gioco ad atout

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:268`

**Domanda:** In un contratto ad atout, quando si deve cedere una presa è importante...

**Opzioni:**
- Battere subito tutte le atout
- Chiedersi cosa farà l'avversario in presa ✅
- Giocare sempre il colore più lungo
- Passare subito al morto

**Spiegazione:** Prima di cedere la presa, valutate cosa l'avversario farà con il tempo guadagnato. Potrebbe affrancare un colore laterale, tagliare, o battere atout.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q3-2: Scartare su vincenti laterali

#### Esempio 2 — `src/data/quadri-lessons.ts:301`

**Testo:** Est gioca 6♠, attacco Q♦. Se si precipita a muovere atout, dovendo cedere la presa d'Asso, andrà inevitabilmente sotto al ritorno di quadri. Ovest deve procurarsi un controllo (taglio) nel colore di quadri, scartando subito la terza cuori del morto: KQ di ♥, fiori al Fante e A♥ scartando quadri. Ora si batte atout.

**Mano(i):** `♠KQ75 ♥A97 ♦863 ♣J84 | ♠J10984 ♥KQ ♦A7 ♣AKQ7`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:307`

**Domanda:** In un contratto a colore, quando bisogna scartare le perdenti su vincenti laterali prima di battere atout?

**Spiegazione:** Quando il tempo stringe e gli avversari potrebbero incassare un colore se ottengono la presa durante la battuta delle atout, bisogna prima eliminare le perdenti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q3-3: Tagliare dalla parte corta

#### Esempio 3 — `src/data/quadri-lessons.ts:339`

**Testo:** Est gioca 4♠, attacco K♦. Solo 3 prese a lato delle atout, nessun affrancamento possibile. Le atout devono fornire 7 prese: 4 di una mano + 3 tagli dall'altra. A♦ e quadri taglio, fiori al morto e quadri taglio, fiori e quadri taglio con il K di atout.

**Mano(i):** `♠AQJ10 ♥J5 ♦A872 ♣AK7 | ♠K986 ♥9743 ♦4 ♣8653`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/quadri-lessons.ts:345`

**Domanda:** Qual è la 'parte corta' in un fit 5-3 di atout?

**Opzioni:**
- La mano con 5 atout
- La mano con 3 atout ✅
- Dipende dagli onori
- Non esiste parte corta

**Spiegazione:** La mano con meno atout è il Satellite (parte corta). I tagli dal Satellite aggiungono prese extra, mentre quelli dalla Base no (sono già contate).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q3-4: Il metodo Base-Satellite

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:383`

**Domanda:** Si definiscono 'atout legittime' della difesa...

**Opzioni:**
- Tutte le atout degli avversari
- Solo le atout che possono tagliare
- Quelle che comunque presa la faranno ✅
- Quelle giocate nel primo giro

**Spiegazione:** Le atout legittime della difesa sono quelle che comunque farebbero presa, indipendentemente da quando vengono giocate. Le prese di taglio in più sono 'illegittime' perché vengono guadagnate extra.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 5: I colori bucati: come muovere le figure


### Modulo Q5-1: Il principio fondamentale

#### Esempio 2 — `src/data/quadri-lessons.ts:427`

**Testo:** Disposizione Q74 in Nord, K95 in Ovest, A106 in Est, J83 in Sud. Se Sud inizia col 3, Ovest sta basso; il suo K deve prendersi cura del J di Sud, mentre l'Asso di Est si occuperà della Q di Nord. Se il colore viene mosso da Est o Ovest: una presa per NS.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/quadri-lessons.ts:437`

**Domanda:** Con AQ54 in Nord e J632 in Sud, cosa occorre perché facciate prese?

**Opzioni:**
- Che il K sia in Ovest (in impasse) ✅
- Che il K sia in Est
- Non importa dove sia il K
- Che il K sia secco

**Spiegazione:** Occorre che il K sia secondo in impasse (in Ovest, davanti all'AQ). Si deve muovere piccola per la Q e poi tirare l'Asso. La posizione del 10 e del 9 è ininfluente.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q5-2: Il gradino di ingresso e il colpo di sonda

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:475`

**Domanda:** Con AKJ10 in Nord e 8752 in Sud, la manovra migliore è...

**Opzioni:**
- Giocare AK e sperare nella Q secca
- Fare il colpo di sonda: A, poi piccola verso J10 ✅
- Impasse al J dal Sud
- Giocare piccola da entrambe le parti

**Spiegazione:** Con 8 carte in linea e mancando solo la Dama, il colpo di sonda (battere A poi K) è opportuno per catturare una eventuale Dama secca in Est. Se entrambi gli avversari rispondono con cartine, vi mancano ancora la Dama e una cartina: tornate in Sud e fate l'impasse.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q5-3: La regola aurea dell'impasse

#### Esempio 1 — `src/data/quadri-lessons.ts:503`

**Testo:** Con AQJ109 in Nord e 87654 in Sud: si gioca piccola verso il morto. Se compare una cartina a sinistra, quando manca il K (e due cartine) si fa l'impasse. Quando manca il K e una sola cartina, si batte l'Asso.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/quadri-lessons.ts:518`

**Domanda:** Hai AQJ109 al morto e 87654 in mano. Manca il K. Se a sinistra compare una cartina, cosa fai?

**Opzioni:**
- Batti l'Asso
- Fai l'impasse inserendo il J ✅
- Giochi il 10
- Passi sotto

**Spiegazione:** Quando manca il K e gli avversari hanno un onore più due o tre cartine, si fa l'impasse. Inserendo il J (o il Q) si spera che il K sia in Ovest.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q5-4: Le expasse e i casi disperati

#### Esempio 2 — `src/data/quadri-lessons.ts:551`

**Testo:** Con K1043 in Nord e Q652 in Sud: il 10 è la vostra carta chiave, rafforzata (protetta) da un onore. Piccola alla Dama, poi piccola all'Asso isolato. Qualunque cosa succeda, rimarremo con la forchetta K10.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:556`

**Domanda:** Con AQJ10642 in mano e 3 al morto, bloccati in Ovest. Cosa fate?

**Opzioni:**
- Impasse verso la Q
- Tirate l'Asso e sperate ✅
- Non c'è soluzione
- Giocate il K di mano se lo avete

**Spiegazione:** Se siete bloccati in Ovest e non potete fare l'impasse, tirate l'Asso! Ogni tanto trovate l'onore secco. Nei casi disperati, incassate la vincente: una volta all'anno trovate l'onore secco!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 2: Valutazioni sull'apertura


### Modulo Q2-1: Mani di 11 punti: passare o aprire?

#### Esempio 2 — `src/data/quadri-lessons.ts:605`

**Testo:** ♠AK75 ♥98 ♦A543 ♣754 - Questi sono 11 punti belli: 3 prese certe, qualunque sia il contratto finale.

**Mano(i):** `♠AK75 ♥98 ♦A543 ♣754`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 3 — `src/data/quadri-lessons.ts:611`

**Testo:** ♠Q753 ♥K ♦QJ543 ♣QJ3 - Difficile immaginare di peggio: assenza di carte di testa e punti nei colori corti.

**Mano(i):** `♠Q753 ♥K ♦QJ543 ♣QJ3`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/quadri-lessons.ts:622`

**Domanda:** Hai ♠KQ75 ♥98 ♦A543 ♣754 (11 punti). Apri?

**Opzioni:**
- Sì, sempre con 11 punti
- Sì, carte di testa e distribuzione pulita ✅
- No, troppo debole
- Dipende dalla vulnerabilità

**Spiegazione:** Con A e K (carte di testa), mano pura (onori nei lunghi) e buona seconda dichiarazione, questi 11 punti meritano l'apertura.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q2-2: Forza giocabile e forza onori

#### Esempio 1 — `src/data/quadri-lessons.ts:650`

**Testo:** 1) ♠AKQ8765 ♥62 ♦J ♣543 - 7 vincenti con atout Picche, ma scarsissime possibilità in altri contratti. 2) ♠AQJ ♥KJ54 ♦AJ97 ♣K4 - Meno vincenti certe ma prese ovunque.

**Mano(i):** `♠AKQ8765 ♥62 ♦J ♣543`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:661`

**Domanda:** Una mano con solo forza giocabile ha...

**Opzioni:**
- Molti onori sparsi
- Un colore lungo e dominante ✅
- Distribuzione bilanciata
- Almeno 15 punti onori

**Spiegazione:** La forza giocabile è data dalla capacità di fare prese con un colore lungo imposto come atout. Ha scarsissime possibilità di fare prese in contratti alternativi.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q2-3: Le aperture di barrage

#### Esempio 2 — `src/data/quadri-lessons.ts:694`

**Testo:** ♠KQJ7654 ♥75 ♦43 ♣J5 = 3♠ (6 prese a Picche). ♠7 ♥75 ♦AQJ7654 ♣QJ5 = 3♦ (probabili 6 prese a Quadri). ♠AKJ87643 ♥7 ♦75 ♣54 = 4♠ (probabili 8 prese a Picche).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:699`

**Domanda:** Hai ♠Q876543 ♥K2 ♦75 ♣J5 - Apri di barrage 3♠?

**Spiegazione:** No! Le picche non sono sufficientemente onorate (dove vedete 6-7 prese?), e il K esterno è un difetto per un barrage. Questa mano va passata.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q2-4: Valutare la distribuzione

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:731`

**Domanda:** Quale distribuzione è la peggiore in assoluto per il gioco ad atout?

**Opzioni:**
- 4432
- 5332
- 4333 ✅
- 5422

**Spiegazione:** La 4333 è la peggiore: un solo colore quarto e nessuna possibilità di taglio. La 4432 è decisamente migliore perché offre un doubleton dove tagliare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 4: Il capitanato e la replica dell'apertore


### Modulo Q4-1: Capitano e Subordinato

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:775`

**Domanda:** Nella sequenza 1♥-2♣-2♥, chi è il Capitano?

**Opzioni:**
- L'Apertore (Nord)
- Il Rispondente (Sud) ✅
- Nessuno ancora
- Dipende dai punti

**Spiegazione:** Il Rispondente è il Capitano: ha dichiarato un colore nuovo (2♣ forzante) e l'Apertore, ridichiarando 2♥, si sta descrivendo come Subordinato. Sud deciderà il contratto finale.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q4-2: La replica dopo risposte 2 su 1

#### Esempio 2 — `src/data/quadri-lessons.ts:808`

**Testo:** Dopo 1♥-2♣: ♠K75 ♥Q9853 ♦AKQ ♣72 - La replica corretta è 2NT (5332 di Diritto, non 2♦!). L'Apertore si descrive senza fare invenzioni.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:813`

**Domanda:** Dopo 1♠-2♣, Nord con ♠AKQJ94 ♥64 ♦A73 ♣J6 replica...

**Opzioni:**
- 2♠
- 3♠ ✅
- 2NT
- 2♦

**Spiegazione:** 3♠ è un salto che mostra una monocolore 'chiusa': picche lunghe e solide, qualità eccezionale del colore. Il messaggio è: 'possiamo giocare a picche anche se non ne hai'.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q4-3: La replica dopo risposte a livello 1

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:846`

**Domanda:** Dopo 1♣-1♠, Nord con ♠K5 ♥J65 ♦AKJ965 ♣AJ2 replica...

**Opzioni:**
- 1NT
- 2♦
- 3♦ ✅
- 2NT

**Spiegazione:** 3♦ è un Piccolo Rever (15-17): l'Apertore salta nel proprio colore mostrando forza extra. Se avesse dichiarato solo 2♦ avrebbe mostrato 12-14.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q4-4: Repliche elastiche e forza

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:879`

**Domanda:** L'apertura di 1NT aperta mostra...

**Opzioni:**
- 12-14 bilanciata
- 15-17 bilanciata ✅
- 12-20 qualunque
- 16-18 sbilanciata

**Spiegazione:** 1NT mostra una mano bilanciata con 15-17 punti. È l'esempio tipico di mano 'definita' per punteggio e distribuzione: in una sola dichiarazione l'Apertore ha dato un'informazione precisa.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 6: Le aperture oltre il livello 1


### Modulo Q6-1: Le aperture a livello 2: 2♦, 2♥, 2♠

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:928`

**Domanda:** Il compagno apre 2♥. Con ♠52 ♥94 ♦J82 ♣AQJ832, rispondi...

**Opzioni:**
- Passo
- 2NT
- 3♣ ✅
- 2♠

**Spiegazione:** 3♣ è forzante a manche: mostra 5+ carte con almeno 2 onori al livello 3. Con un colore così bello e 5+ punti, è la risposta corretta. Non si passa MAI su apertura di 2 a colore!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q6-2: L'apertura di 2♣

#### Esempio 2 — `src/data/quadri-lessons.ts:956`

**Testo:** ♠AQJ3 ♥AK5 ♦KJ107 ♣AQ - Apre 2♣, poi dirà 2NT (bilanciata 23+). ♠KQJ3 ♥- ♦AK7 ♣AK10954 - Apre 2♣, poi dirà fiori (mano a base fiori fortissima).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:961`

**Domanda:** Dopo 2♣-2♦-2NT, cosa descrive l'Apertore?

**Opzioni:**
- Una mano con le fiori
- Una bilanciata di 23+ punti ✅
- Una mano debole
- Una bicolore minori

**Spiegazione:** Quando l'Apertore di 2♣ replica 2NT, mostra la bilanciata forte di 23+ punti. La licita prosegue come se avesse aperto di 2NT, con il 3♣ interrogativo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q6-3: La Richiesta d'Assi: Blackwood 4NT

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:999`

**Domanda:** Nella RKCB (Roman Key Card Blackwood), quanti 'assi' si contano quando si gioca ad atout?

**Opzioni:**
- 4
- 5 ✅
- 6
- Dipende dal colore

**Spiegazione:** Ad atout gli assi sono 5: i quattro Assi tradizionali più il Re di atout, che è una carta importantissima e viene accomunato agli assi.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q6-4: L'apertura di 3NT Gambling

#### Esempio 2 — `src/data/quadri-lessons.ts:1027`

**Testo:** ♠7 ♥Q3 ♦AKQJ765 ♣753 = 3NT. ♠75 ♥53 ♦86 ♣AKQJ875 = 3NT. Il compagno con ♠A753 ♥QJ32 ♦A98 ♣42 dice Passo (7 fiori + le sue 2 prese).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1032`

**Domanda:** Su apertura 3NT del compagno, con ♠J5 ♥Q765 ♦53 ♣K9876, cosa dici?

**Opzioni:**
- Passo
- 4♣ ✅
- 4NT
- 5♣

**Spiegazione:** Non hai i fermi necessari per giocare a Senza. Dici 4♣: 'passa se il tuo colore è fiori, altrimenti correggi a 4♦'. È l'unico modo per trovare il parziale giusto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 8: L'accostamento a manche


### Modulo Q8-1: Il Terzo colore

#### Esempio 2 — `src/data/quadri-lessons.ts:1076`

**Testo:** 1♦-1♠-2♦-3♣: il terzo colore a livello 3 rende la situazione forzante manche. Con 3♠ Est mostra almeno 6 carte, sta cercando di giocare 3NT o 4♠.

**Mano(i):** `♠KQ10875 ♥43 ♦A8 ♣A53`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1082`

**Domanda:** Nella sequenza 1♦-1♥-1♠-2♣, il 2♣ è...

**Opzioni:**
- Forzante a manche
- Forzante 1 giro (discendente a livello 2) ✅
- Non forzante
- Un barrage

**Spiegazione:** 2♣ è un terzo colore discendente a livello 2: è forzante un solo giro. L'Apertore non può passare ma la coppia non è ancora obbligata alla manche.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q8-2: Il Quarto colore

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1120`

**Domanda:** Dopo 1♦-1♥-1♠-2♣ (4° colore), Nord con ♠AJ75 ♥K53 ♦AJ64 ♣76 replica...

**Opzioni:**
- 2♥ ✅
- 2NT
- 2♦
- 3♣

**Spiegazione:** 2♥: Nord ha fit terzo nel primo colore del Rispondente (cuori). È la prima priorità: mostrare il fit nel maggiore del partner, prima di Senza.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q8-3: Quando il fit maggiore è trovato

#### Esempio 2 — `src/data/quadri-lessons.ts:1148`

**Testo:** Ovest: ♠AQ863 ♥KJ102 ♦6 ♣AQ3 con Est: ♠K742 ♥Q5 ♦8732 ♣K82 - Tutti e tre gli onori di Est a peso d'oro: 11 prese facili. Ma con ♠742 ♥A53 ♦KJ32 ♣852: KJ di quadri assolutamente no!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1153`

**Domanda:** Dopo 1♠-2♠, un cambio di colore del Capitano (es. 3♦) è...

**Opzioni:**
- Una proposta di nuovo contratto
- Una trial bid: chiede aiuto nel colore ✅
- Un barrage
- Un segnale di debolezza

**Spiegazione:** È una trial bid: chiede al Rispondente di chiamare manche se aiuta nel colore dichiarato (con onori o valori di taglio), ma di riportare a 3 in atout in caso contrario.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q8-4: Le trial bid

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1191`

**Domanda:** Dopo 1♠-2♠-3♣ (trial bid), con ♠Q96 ♥97643 ♦762 ♣AQ2, rispondi...

**Opzioni:**
- 3♠
- 4♠ ✅
- 3♦
- Passo

**Spiegazione:** 4♠! Avete valori ottimi nel colore richiesto (AQ di fiori). La trial bid chiede aiuto a fiori e voi ce l'avete: rialzate a manche con entusiasmo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 10: Il Contro e la Surlicita


### Modulo Q10-1: Contro e Surlicita: le basi

#### Esempio 2 — `src/data/quadri-lessons.ts:1230`

**Testo:** Dopo 1♦-1♠-?: con ♠54 ♥AJ54 ♦Q75 ♣K753 Nord dichiara CONTRO (cerca fit in altri colori). Con ♠J5 ♥AQ753 ♦KJ64 ♣A9 Nord dichiara 2♠ SURLICITA (fit cuori e almeno forza di manche).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1235`

**Domanda:** La Surlicita, a differenza del Contro, promette...

**Opzioni:**
- Più punti
- Fit nel colore del compagno ✅
- Un colore lungo proprio
- Mano bilanciata

**Spiegazione:** La Surlicita è un forzante che promette fit. Il Contro è un forzante generico che nega fit. Questa definizione è il caposaldo di tutta la dichiarazione competitiva.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q10-2: Contro e surlicita del compagno dell'apertore

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1273`

**Domanda:** Dopo 1♥-1♠-? avete ♠K75 ♥53 ♦AKJ5 ♣J976. Cosa dite?

**Opzioni:**
- 2♠ (surlicita)
- X (contro) ✅
- 2♦
- 1NT

**Spiegazione:** X (contro negativo): con 12 punti, 4-4 nei minori e niente fit a cuori, il contro mostra esattamente questa mano. Per 2♦ servirebbero 5+ quadri, qui ne avete solo 4. La surlicita 2♠ promette fit a cuori (assente) e 14+; 1NT richiederebbe il fermo a picche.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q10-3: Contro e surlicita dopo il Contro informativo

#### Blocco 2 (quiz) — `src/data/quadri-lessons.ts:1301`

**Domanda:** Dopo 1♦-X-P-?, con ♠AQ75 ♥K754 ♦43 ♣KQ2, cosa dite?

**Opzioni:**
- 1♠
- 2♦ (surlicita) ✅
- 1♥
- 2NT

**Spiegazione:** 2♦ è surlicita: una manche è certa, ma perché mettersi a indovinare quale? 'Caro compagno, almeno fino a livello di 3 possiamo giocare, comincia TU a dirmi il primo colore in cui hai 4 carte!'.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q10-4: Contro e surlicita dell'Apertore

#### Esempio 2 — `src/data/quadri-lessons.ts:1329`

**Testo:** 1♦-P-1♥-1♠: Sud con ♠A5 ♥AQ86 ♦AKJ754 ♣3 dice 2♠ (surlicita, fit quarto a cuori, 14+ belli). Con ♠AQ75 ♥KQ8 ♦AQJ4 ♣J3 dice X (contro, rever senza fit).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1334`

**Domanda:** L'Apertore surlicita per mostrare...

**Opzioni:**
- Una mano debole con fit
- Fit quarto nel colore del compagno e mano forte ✅
- Una mano bilanciata
- Che vuole giocare nel colore avversario

**Spiegazione:** La surlicita dell'Apertore esprime fit quarto nel colore del compagno con mano più forte di un semplice appoggio. Con onori concentrati nei colori lunghi, pochi punti possono bastare.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 12: Interventi e riaperture


### Modulo Q12-1: Il Contro informativo e la rimozione

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1383`

**Domanda:** Ovest ha ♠QJ87 ♥J75 ♦AQ3 ♣A754. Dopo 1♦ dell'avversario, cosa dichiara?

**Opzioni:**
- Passo
- 1NT
- X (Contro) ✅
- 2♣

**Spiegazione:** Contro informativo: mostra valore di apertura (12-14), 4 carte in entrambi i nobili e tolleranza per fiori. Perfetto per il contro!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q12-2: L'intervento a salto e 2NT minori

#### Esempio 2 — `src/data/quadri-lessons.ts:1411`

**Testo:** ♠5 ♥72 ♦KQ1082 ♣AJ1062 = 2NT su 1♥ o 1♠ (bicolore minori 5-5). ♠KJ ♥A ♦Q8732 ♣Q7653 = Passo (punti nei colori sbagliati!)

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1416`

**Domanda:** Su apertura avversaria di 1♠, con ♠4 ♥6 ♦AKJ1065 ♣J6542 dite...

**Opzioni:**
- 2NT
- 2♦ ✅
- Passo
- 3♦

**Spiegazione:** Questa non è una bicolore: è una monocolore di quadri con un ciuffo di fiori. Intervenite 2♦, non 2NT! La 2NT richiede una vera 5-5 minore con colori onesti.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q12-3: Il Passo forte e le riaperture

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1449`

**Domanda:** Dopo 1♠-P-P, siete in Est con ♠2 ♥KQJ652 ♦52 ♣Q743. Cosa dite?

**Opzioni:**
- Passo
- X (Contro)
- 2♥ ✅
- 2NT

**Spiegazione:** Riaprite a colore con 2♥: avete forza giocabile e non volete lasciare giocare 1♠. Non Contro, perché se il compagno trasformasse il contro non fareste un buon affare!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q12-4: Quando riaprire

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1482`

**Domanda:** Dopo 1♦-1♥-P-P, Sud ha ♠K762 ♥9 ♦AK963 ♣A73. Cosa fa?

**Opzioni:**
- Passo
- X (Contro) ✅
- 2♦
- 1♠

**Spiegazione:** Contro di protezione: il partner potrebbe avere un 'passo forte' con buone cuori. Il Contro riapre la licita e il compagno potrà trasformarlo dicendo Passo se ha le cuori, oppure dichiarare il suo colore.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 7: Attacchi e segnali di controgioco


### Modulo Q7-1: La carta di attacco e il Busso

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1531`

**Domanda:** Da K9754 nel colore scelto per l'attacco, quale carta giocate?

**Opzioni:**
- K
- 9
- 4 ✅
- 7

**Spiegazione:** Si attacca con il 4 (la più piccola delle cartine) per dire al compagno 'ho almeno un onore in questo colore, prendi e torna'. Il K e il 9 promettono l'inferiore e non vanno giocati in busso.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q7-2: L'attacco nel colore del compagno

#### Esempio 2 — `src/data/quadri-lessons.ts:1559`

**Testo:** Esempi: da 84 si attacca con l'8. Da J4 si attacca con il J. Da Q762 si attacca con il 7. Da K93 si attacca con il 3. Da 8752 si attacca con il 7. Da 963 si attacca con il 3.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1564`

**Domanda:** Il compagno ha dichiarato cuori. Avete ♥Q762. Quale carta attaccate?

**Opzioni:**
- Q
- 7 ✅
- 2
- 6

**Spiegazione:** Con 4 carte (numero pari) si sceglie una carta alta: il 7. La Q non va giocata perché stiamo attaccando 'in conto' (mostrando la parità) non in busso.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q7-3: Il segnale del gradimento

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1597`

**Domanda:** Con il sistema Pari-Dispari, per mostrare gradimento giocate...

**Opzioni:**
- Una carta pari (2, 4, 6, 8)
- Una carta dispari (3, 5, 7, 9) ✅
- La più alta possibile
- La più bassa possibile

**Spiegazione:** Nel Pari-Dispari, la carta dispari mostra gradimento. Il 9 è la meno equivoca per mostrare gradimento, il 2 la più lampante per mostrare sgradimento.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q7-4: Il primo scarto all'italiana

#### Esempio 2 — `src/data/quadri-lessons.ts:1630`

**Testo:** Est deve scartare con lo scarto: chiama dove vi conviene, non dove avete le carte più alte. Invitate il compagno a muovere FIORI: scartate le carte più alte dispari di fiori. E se non aveste dispari di fiori? Otterreste lo stesso risultato scartando una PARI di quadri (negando quadri).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1635`

**Domanda:** Al primo scarto, volete che il compagno giochi quadri. Avete ♦J932. Quale carta scartate?

**Opzioni:**
- ♦2 (la più bassa)
- ♦J (la più alta)
- ♦9 (dispari alta) ✅
- ♦3 (dispari bassa)

**Spiegazione:** Scartate il 9♦ (dispari = chiama). Al primo scarto all'italiana, una carta dispari mostra valori e chiama nel colore scartato. Il 9 è la più inequivocabile.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 9: Ricevere l'attacco


### Modulo Q9-1: Deduzioni sulla carta di attacco

#### Esempio 2 — `src/data/quadri-lessons.ts:1674`

**Testo:** Se subodorate un taglio, provate ad alzare un po' di nebbia: giocate carte false, come un onore alto che non vi costa nulla, per costruire un'illusione verosimile per il difensore che può dare il taglio all'altro.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1679`

**Domanda:** In un contratto ad atout, l'avversario attacca sotto un colore in cui non vedete l'Asso. Dove si trova l'Asso?

**Opzioni:**
- In mano a chi ha attaccato
- In mano al compagno di chi ha attaccato ✅
- Non si può sapere
- È stato scartato

**Spiegazione:** Nessun giocatore attacca sotto asso contro un contratto ad atout. L'Asso è sicuramente nell'altra mano difensiva.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q9-2: Lisciare l'attacco a colore

#### Esempio 1 — `src/data/quadri-lessons.ts:1707`

**Testo:** Con ♦654 al morto, ♦K in attacco da Ovest, e ♦AJ3 in mano: lisciando il K mettete Ovest in condizione di non poter proseguire, e conservate il controllo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1717`

**Domanda:** A 4♠ con ♦AJ3 in mano, l'attacco è ♦K. Conviene lisciare?

**Spiegazione:** Sì! Lisciando il K, Ovest (che ha KQ) non potrà proseguire senza darvi la presa con l'Asso. Se rovesciate gli onori, se ha KQ potrebbe darvi problemi al secondo giro. Conservate il controllo per i tempi migliori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q9-3: Prima di chiamare dal morto

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1749`

**Domanda:** In un contratto ad atout, se l'attacco vi pone la scelta di un impasse con pochissime chance...

**Opzioni:**
- Fate sempre l'impasse
- Spesso è opportuno rinunciarci ✅
- Prendete sempre con l'Asso
- Lisciate sempre

**Spiegazione:** Se l'attacco vi pone la scelta di un impasse che ha pochissime chance, può essere conveniente rinunciarci. Prendete d'Asso, battete atout, e poi cedete le prese che dovete cedere.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q9-4: Il piano di gioco alla prima presa

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1787`

**Domanda:** Al primo attacco in un contratto ad atout, la cosa più importante è...

**Opzioni:**
- Giocare velocemente
- Fare il piano di gioco completo ✅
- Battere subito atout
- Incassare subito le vincenti

**Spiegazione:** È indispensabile fare il piano di gioco PRIMA di chiamare dal morto. Contate le prese, identificate i pericoli, verificate i collegamenti e i rientri. Solo poi giocate.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 11: Controgioco: ragionare e dedurre


### Modulo Q11-1: Le basi del controgioco

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1836`

**Domanda:** Per un buon controgioco, la prima cosa da fare quando il morto viene esposto è...

**Opzioni:**
- Giocare velocemente
- Guardare il morto e ricordare la dichiarazione ✅
- Contare solo i propri punti
- Scegliere subito il colore da attaccare

**Spiegazione:** Il primo passo è guardare il morto e ricordare la dichiarazione. Da queste informazioni si deducono distribuzione e onori del giocante, e si imposta la strategia difensiva.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q11-2: Analizzare la prima presa

#### Esempio 2 — `src/data/quadri-lessons.ts:1869`

**Testo:** L'attacco è Asso di fiori. Est risponde con il 2 e Sud con il 3. Sapete che il 2 nega interesse. Proseguite con il K di Fiori! Sapete che la Dama è in Sud e che Est non taglia. Se Sud ha Qx di fiori, state per affrancarsi il J del morto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1874`

**Domanda:** Avete un colore capeggiato da AK in mano: attaccando con l'Asso, il compagno vi segnala sgradimento. Cosa fate?

**Opzioni:**
- Proseguite comunque con il K
- Cambiate colore come chiede il compagno ✅
- Giocate una terza carta nello stesso colore
- Passate ad atout

**Spiegazione:** Avere AK vi costringe a prendere al primo colpo, ma il segnale di sgradimento dice 'cerca prese da un'altra parte'. Non continuate: cambiate colore seguendo le indicazioni del compagno.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q11-3: Capire il piano del giocante

#### Esempio 2 — `src/data/quadri-lessons.ts:1907`

**Testo:** Sud gioca 3NT dopo 1♣-1♦-1NT-3NT. Attacco Q♥. Est risponde con il 2. Sud prende con l'Asso e gioca il K♣. Siete in presa. Sud ha verosimilmente ♥AKx, ♣KQxx. Tornate a cuori: al 2 di Est: 'cuori non ha' è un'informazione preziosa. Sud ha 12 punti certi: non ha l'Asso di Picche. Giocate piccola picche per l'Asso di Est!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1912`

**Domanda:** Il compagno muove una piccola chiedendo un ritorno. Ma voi non avete carte nel colore richiesto. Cosa fate?

**Opzioni:**
- Giocate un altro colore a caso
- Rispettate il linguaggio di controgioco: cercate il colore più verosimile dal morto ✅
- Battete atout
- Non importa, giocate qualunque cosa

**Spiegazione:** Rispettate i codici del linguaggio di controgioco. Se non potete dare il ritorno chiesto, cercate il colore più logico guardando il morto. Una carta di rifiuto chiede comunque un cambio di colore!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo Q11-4: Evitare il taglio e scarto

#### Blocco 3 (quiz) — `src/data/quadri-lessons.ts:1950`

**Domanda:** Se non si ottengono certezze sul controgioco, si gioca...

**Opzioni:**
- Passivamente, senza rischiare
- 'Come se': ipotizzando situazioni e agendo come se fossero certe ✅
- A caso, sperando nel meglio
- Sempre nello stesso colore

**Spiegazione:** SE NON SI OTTENGONO CERTEZZE... SI GIOCA 'COME SE'... IPOTIZZANDO DETERMINATE SITUAZIONI E AGENDO COME SE FOSSERO CERTE. È il principio fondamentale del controgioco ragionato.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

