# Review esperto — Corso Cuori - Gioco della Carta

> Documento generato automaticamente.
> Sorgente: `src/data/cuori-gioco-lessons.ts`
> Per ogni voce, segna ✅ OK o annota la correzione.


## Lezione 100: La Prima Presa

_Deduzioni dalla carta di attacco e riflessi immediati_


### Modulo 100-1: Le regole dell'attacco normale

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:55`

**Domanda:** Quale attacco è considerato 'anormale' e sospetto nel gioco a colore?

**Opzioni:**
- Attacco da AK in un colore
- Attacco sotto Asso ✅
- Attacco nel colore del partner
- Attacco da una sequenza

**Spiegazione:** Attaccare sotto Asso nei contratti a colore è anormale: se l'avversario lo fa, sospettate un motivo nascosto come la ricerca di un taglio.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-gioco-lessons.ts:68`

**Domanda:** Quando nessuno della coppia difensiva ha parlato, è normale attaccare nel colore non dichiarato dagli avversari.

**Risposta corretta:** Vero ✅

**Spiegazione:** Esatto! Se nessuno dei difensori ha dichiarato, si preferisce attaccare nel colore che gli avversari non hanno mostrato, cercando i punti del compagno.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 100-2: Palestra: cosa giocare dal morto

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:93`

**Testo:** Morto ha J3, Mano ha A102. L'avversario attacca con il 5.

**Mano(i):** `J3 + A102`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 4 — `src/data/cuori-gioco-lessons.ts:103`

**Testo:** Morto ha Q2, Mano ha K43. L'avversario attacca con il 5.

**Mano(i):** `Q2 + K43`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/cuori-gioco-lessons.ts:113`

**Domanda:** Morto ha K3, Mano ha J54. L'avversario attacca con il 2. Se vi mancano A e Q, cosa giocate dal morto?

**Opzioni:**
- Il Re, sperando che cada l'Asso
- Piccola, stando bassi ✅
- Il 3, tanto è indifferente
- Dipende solo dalla dichiarazione

**Spiegazione:** State bassi! Chi attacca può avere la Dama ma è fortemente improbabile che abbia l'Asso. Mettendo il Re perdete sempre. Stando bassi potreste fare il Re in seguito.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (card-select) — `src/data/cuori-gioco-lessons.ts:126`

**Domanda:** Morto ha KJ3, Mano ha 874. Sud attacca piccola, Nord vince con K e gioca J♥. Dovete sbloccare per fare 2 prese con l'impasse. Quale carta giocate?

**Mano:** `♠A♠10♠5♠3`

**Risposta corretta:** `♠A` ✅

**Spiegazione:** Sbloccate l'Asso sotto il Re per poi fare l'impasse alla Dama con il 10. Se non sbloccate, resterete bloccati.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 100-3: Deduzioni dalla prima presa

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:152`

**Testo:** Est gioca 4♥. Sud attacca A♣, K♣ e fiori tagliata da Nord. Ovest: ♠AJ ♥1063 ♦AQJ104 ♣Q62. Est: ♠Q82 ♥AKQ952 ♦6 ♣J97.

**Mano(i):** `♠AJ ♥1063 ♦AQJ104 ♣Q62`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/cuori-gioco-lessons.ts:173`

**Domanda:** In un contratto a colore, l'avversario attacca con una cartina in un seme dove avete AKxxx al morto e xxxxx in mano. Cosa sospettate?

**Opzioni:**
- Ha una sequenza nel colore
- Cerca di affrancare una lunga
- Cerca un taglio dal partner ✅
- Ha attaccato a caso

**Spiegazione:** Quando l'avversario attacca in un colore dove avete molte carte e onori, è probabile che cerchi un taglio: il suo partner potrebbe essere corto in quel colore.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 7 (true-false) — `src/data/cuori-gioco-lessons.ts:186`

**Domanda:** Se siete certi che un taglio sia in agguato, potete scartare un onore dalla mano per confondere le acque al nemico.

**Risposta corretta:** Vero ✅

**Spiegazione:** Sì! Se non vi costa prese, potete dare un onore di mano per far credere al difensore che siete voi a essere singoli. È una manovra ingannevole lecita e a volte brillante.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 101: Fit 5-3 e Fit 4-4

_Controllo del colpo, taglio totale e accorciamento_


### Modulo 101-1: Due modi di giocare ad atout

#### Esempio 5 — `src/data/cuori-gioco-lessons.ts:240`

**Testo:** Est gioca 6♥. Le prese esterne sono 4: 1♠, 2♦, 1♣. Servono 8 prese con le atout tramite tagli incrociati.

**Mano(i):** `♠Q ♥AQ104 ♦AK54 ♣A732`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/cuori-gioco-lessons.ts:245`

**Domanda:** In un piano di Taglio totale, in quale ordine si eseguono i tagli?

**Opzioni:**
- Si taglia a caso, alternando le mani
- Si comincia dal colore con più tagli da fare ✅
- Si comincia dal colore con meno tagli
- Si battono prima le atout e poi si taglia

**Spiegazione:** Si comincia a tagliare il colore in cui si hanno più tagli da fare, per non restare senza collegamenti (ingressi). I tagli stessi forniscono i collegamenti con l'altra mano!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 101-2: Il fit 5-3

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:281`

**Testo:** Est gioca 4♠ con attacco atout. La linea di gioco per affrancare le fiori è molto più semplice che tagliare al morto. Ovest: ♠KQ2 ♥65 ♦74 ♣Q98643. Est: ♠AJ875 ♥AK ♦Q863 ♣K2.

**Mano(i):** `♠KQ2 ♥65 ♦74 ♣Q98643`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:291`

**Domanda:** Nel fit 5-3, quale mano conviene usare normalmente per i tagli?

**Opzioni:**
- La mano con 5 atout
- La mano con 3 atout (la corta) ✅
- È indifferente
- La mano con più onori

**Spiegazione:** La mano corta di atout porta allungamento di prese. La mano lunga (5 atout) deve restare intatta per mantenere il controllo e battere le atout avversarie.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-gioco-lessons.ts:304`

**Domanda:** Con fit 5-3 bisogna sempre battere tutte le atout prima di affrancare i colori laterali.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! A volte è necessario posporre la battuta delle atout per produrre dei tagli o affrancare un colore laterale. L'ordine dipende dalla mano specifica.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 101-3: Il pericolo dell'accorciamento

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:334`

**Testo:** Est gioca 4♥ con fit 7 carte. Prende l'attacco a fiori e la prosecuzione. Se Est taglia, mantiene solo con cuori 3-3 (36%). Se rifiuta di tagliare scartando 2 picche, è in botte di ferro sia con 3-3 che con 4-2.

**Mano(i):** `♠7643 ♥K53 ♦KQ2 ♣763`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-gioco-lessons.ts:339`

**Domanda:** L'avversario vi forza ripetutamente nel vostro colore lungo di atout. Come vi difendete?

**Opzioni:**
- Tagliate sempre, per non perdere prese
- Rifiutate di tagliare, scartando un perdente ✅
- Battete subito tutte le atout
- Chiedete un cambio di contratto

**Spiegazione:** Rifiutando di tagliare dalla mano lunga si evita l'accorciamento. Si scarta una carta perdente e si mantiene la lunghezza delle atout per il controllo finale.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 101-4: Il fit 4-4: il più potente

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:375`

**Testo:** Est gioca 4♠ con attacco K♦. Ovest: ♠AQJ7 ♥52 ♦A875 ♣AK3. Est: ♠K863 ♥9743 ♦2 ♣8752. Avendo 3 quadri pronte da tagliare, Est può fare 4 prese in atout di Ovest + 3 tagli + 2 fiori + 1 quadri = 10.

**Mano(i):** `♠AQJ7 ♥52 ♦A875 ♣AK3`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-gioco-lessons.ts:380`

**Domanda:** Nel fit 4-4, quale è il rischio principale se si taglia da entrambe le mani senza un piano?

**Opzioni:**
- Si fanno troppe prese
- Si perde il controllo: le atout avversarie non vengono mai eliminate ✅
- Si regalano prese agli avversari
- Non c'è alcun rischio

**Spiegazione:** Tagliare 'un po' di qua e un po' di là' senza piano può essere pericoloso: si rischia di non avere più abbastanza atout per eliminare quelle avversarie, e la difesa riprenderà il controllo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/cuori-gioco-lessons.ts:393`

**Domanda:** Il fit 4-4 è più potente del fit 5-3 perché offre flessibilità nella scelta di quale mano usare per i tagli.

**Risposta corretta:** Vero ✅

**Spiegazione:** Corretto! Nel fit 4-4 si può scegliere liberamente quale mano affrancare e quale usare per i tagli, adattandosi alla situazione specifica della mano.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 102: Conto e Preferenziali

_Segnali di controgioco per la difesa_


### Modulo 102-1: Il conto della carta

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:446`

**Domanda:** Il compagno attacca con il 2♦. Voi avete A843♦. Prendete con l'Asso. Quale carta tornate per mostrare il conto di 3 carte rimaste?

**Opzioni:**
- Il 3 (la più piccola) ✅
- L'8 (la più alta)
- Il 4 (intermedia)
- Non importa quale

**Spiegazione:** Si torna in conto delle carte RIMASTE: con 3 carte rimaste (dispari) si gioca la più piccola. Con 843, la 3 dice 'dispari = mi restano 3 carte'.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-gioco-lessons.ts:454`

**Domanda:** Il conto va sempre dato, in ogni situazione di controgioco.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Il conto non va mai dato quando può essere utile solo al giocante, né quando la lunghezza nel colore mosso è già assolutamente conosciuta dalla licita.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 102-2: Il messaggio preferenziale

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:484`

**Testo:** Sud gioca 4♠. Ovest attacca A♥, ma il morto ha il singolo. Il terzo di mano gioca il 9♥: non sta chiamando a cuori, ma nel più alto dei colori rimasti (quadri).

**Mano(i):** `♠AQ75 ♥10 ♦KJ54 ♣K1086`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/cuori-gioco-lessons.ts:499`

**Domanda:** Il vostro compagno sta per tagliarvi una quadri. Volete che dopo il taglio ritorni a Fiori (il colore più basso). Quale quadri giocate per il taglio?

**Opzioni:**
- La quadri più alta possibile
- La quadri più bassa possibile ✅
- È indifferente
- Il 10 di quadri

**Spiegazione:** Una carta bassa chiama nel colore più basso di rango tra quelli restanti. Se volete il ritorno a Fiori (basso) giocate la carta più piccola.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 102-3: Scarto e preferenza in pratica

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:530`

**Testo:** Sud gioca 4♠ dopo che EstOvest si sono appoggiati fino a 4♥. L'attacco è A♥, Sud taglia e batte atout. Est scarta le cuori dall'alto (10 poi 9): segnala valori nel colore più alto dei restanti (quadri).

**Mano(i):** `♠3 ♥K10982 ♦AKJ ♣J974`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/cuori-gioco-lessons.ts:535`

**Domanda:** Siete Est e dovete scartare su un giro di atout. Avete valori a Fiori (il colore più basso). Come scartate le vostre cuori inutili?

**Opzioni:**
- Dall'alto: 10, poi 9, poi 8
- Dal basso: 2, poi 8 ✅
- È indifferente
- Scartate una fiori per mostrare il colore

**Spiegazione:** Scartando dal basso si indica interesse nel colore più basso di rango dei restanti. Per chiamare a Fiori, scartate le cuori dal basso.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (true-false) — `src/data/cuori-gioco-lessons.ts:548`

**Domanda:** Le chiamate preferenziali sono frequenti quando si risponde su un colore mosso dal partner.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Le chiamate preferenziali sono rarissime quando si risponde su un colore mosso dal partner: in queste situazioni prevale il messaggio di gradimento o rifiuto di quel colore.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 103: I Colori da Muovere in Difesa

_Tempi, controllo e attacco aggressivo vs. neutro_


### Modulo 103-1: Tempi e Controllo in difesa

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:591`

**Testo:** Sud gioca 4♠ con attacco piccola Fiori. Est prende e deve muovere cuori SUBITO, prima che Sud scarti la perdente di cuori sulle quadri affrancate del morto.

**Mano(i):** `♠QJ64 ♥A6 ♦KQ864 ♣65`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:601`

**Domanda:** Il morto ha KQ864♦ e il giocante ha dichiarato con forza. Perché è urgente muovere un altro colore prima?

**Opzioni:**
- Per confondere il giocante
- Per togliere gli ingressi al morto
- Per affrancare prese prima che il giocante scarti le perdenti sulle quadri ✅
- Non è urgente, si può aspettare

**Spiegazione:** Quando il morto ha un lungo colore affrancabile, il giocante potrebbe scartare le sue perdenti su quelle vincenti. Bisogna affrancare le proprie prese PRIMA che questo accada!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 103-2: Immaginare le figure

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:632`

**Testo:** Vedete al morto K86. Supponete che Est abbia l'Asso. Se il J è in Sud con AJxx, partire con la Q è fondamentale. Se il J è in Est con A9xx e Sud ha Jxx, non bisogna muoversi!

**Mano(i):** `Q104 + K86`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:647`

**Domanda:** Vedete al morto KJ del colore. Avete Q104 e ipotizzate l'Asso nel compagno. Come muovete?

**Opzioni:**
- La Q, per costringere il morto a coprire
- Il 4, la più piccola
- Il 10, per non perdere la Dama
- La Q o il 10, sono indifferenti ✅

**Spiegazione:** Con Q104 contro KJ al morto e Asso al compagno, Q e 10 sono indifferenti. Ma NON il 4: se partite con il 4 il compagno con AJxx resterebbe in presa col J lasciandovi la Q tagliata.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-gioco-lessons.ts:660`

**Domanda:** In un torneo a duplicato è giustificato fare giocate rischiose per battere il contratto, anche a costo di regalare prese in più.

**Risposta corretta:** Vero ✅

**Spiegazione:** Sì! In duplicato la cosa più importante è battere il contratto: le prese in più non hanno grosso peso. In Mitchell invece bisogna stare attenti a non regalare prese.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 103-3: Contare e ragionare in difesa

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:685`

**Testo:** Siete Ovest. Attaccate A♠, Est rifiuta con il 4. Sud ha 6 picche e 0 cuori, quindi 7 carte tra fiori e quadri. Non devono far paura le fiori del morto: anche se Sud scarta, gli rimangono comunque 2 quadri. Non è urgente muovere quadri!

**Mano(i):** `♠A103 ♥98732 ♦Q104 ♣86`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/cuori-gioco-lessons.ts:690`

**Domanda:** Il giocante ha 6 atout e 0 cuori. Ha quindi 7 carte tra fiori e quadri. Il morto ha 5 fiori. Dovete muovere quadri subito?

**Opzioni:**
- Sì, è sempre urgente
- No, sulle fiori il giocante non può scartare abbastanza quadri per eliminare il problema ✅
- Dipende solo dai punti
- Sì, perché il morto ha 5 fiori

**Spiegazione:** Qualunque sia la distribuzione (3♦+4♣ o 4♦+3♣), il giocante non riesce a eliminare tutte le quadri sulle fiori. Lasciamolo muovere da solo: andremo meglio!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 104: I Giochi di Sicurezza

_Rinunciare a una presa per non perderne due_


### Modulo 104-1: Il concetto di sicurezza

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:739`

**Testo:** 6NT. L'unico colore nevralgico è quadri (K92 + AJ765) dove basta fare 4 prese. Si inizia battendo l'Asso (l'onore alto che accompagna il Fante) poi si muove piccola verso K9, inserendo il 9 se Sud gioca piccola.

**Mano(i):** `♦K92 + ♦AJ765`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:749`

**Domanda:** Avete K92♦ al morto e AJ765♦ in mano. Dovete fare 4 prese su 5 in quadri. Qual è la giocata di sicurezza?

**Opzioni:**
- Re e piccola al Fante (impasse normale)
- Asso e poi piccola verso K9, inserendo il 9 ✅
- Asso e Re sperando nella caduta della Q
- Piccola al J (impasse al volo)

**Spiegazione:** Si batte l'Asso (l'onore vicino al J) e si muove verso K9. Se Sud ha Q10xx il 9 farà presa. Se Est ha Q10xx lo si scoprirà e si vincerà col Re per l'expasse. La giocata normale (K e piccola al J) perde 2 prese con Q10xx in Sud.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 104-2: Figure di sicurezza comuni

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:785`

**Testo:** 8 carte mancanti di Q e 10 con J isolato (AKxxx + Jx): si gioca subito piccola verso il J. Si batte un onore e se non si possono perdere prese si incassa anche l'altro sperando nella Q seconda.

**Mano(i):** `♥AKxxx + ♥Jx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:795`

**Domanda:** Avete 7 carte (KJ52 + A43) mancanti di Q e 10. In sicurezza come giocate?

**Opzioni:**
- Asso e piccola al Fante (impasse)
- K e poi Asso, e poi piccola verso il Fante ✅
- Fante per primo
- Asso, Re e poi piccola

**Spiegazione:** In sicurezza: K e poi Asso, poi piccola verso il Fante. Questa giocata guadagna rispetto all'impasse normale nel caso in cui la Q sia seconda dopo il J: chi fa l'impasse resta a 2 prese, chi gioca in sicurezza ne fa 3.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-gioco-lessons.ts:808`

**Domanda:** Molte giocate di sicurezza distruggono volontariamente la forchetta (incassando l'onore alto) e trasformano un impasse in un expasse.

**Risposta corretta:** Vero ✅

**Spiegazione:** Esatto! È una caratteristica comune: si rinuncia all'impasse diretto per creare un expasse che protegge da distribuzioni sfavorevoli.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 104-3: Piani di gioco in sicurezza

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:833`

**Testo:** 3NT. La protezione: se le fiori corrono ci sono 10 prese ma se Nord ha il J quarto, preso a fiori tornerà a cuori. Sicurezza: incassare Q♣ e poi ♣ al 10. Se prende Sud, il K♥ resta protetto.

**Mano(i):** `♠K83 ♥62 ♦K62 ♣AQ953`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-gioco-lessons.ts:843`

**Domanda:** In un torneo a squadre giocate un 6NT sicuro. Vale la pena rischiare per la tredicesima presa?

**Opzioni:**
- Sì, ogni presa in più conta
- No, a squadre mantenere il contratto è tutto: la presa in più vale pochissimo ✅
- Dipende dal punteggio
- Sì, per il morale della coppia

**Spiegazione:** A squadre il concetto di sicurezza è fondamentale: perdere uno slam per cercare una presa in più è un disastro. In Mitchell a coppie invece la presa in più conta per il confronto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 105: Probabilità e Percentuali

_Tabelle, scelte e calcolo delle chance_


### Modulo 105-1: La tabella delle divisioni

#### Blocco 4 (quiz) — `src/data/cuori-gioco-lessons.ts:897`

**Domanda:** Vi mancano 6 carte in un colore. Qual è la divisione più probabile?

**Opzioni:**
- 3-3 (pari)
- 4-2 ✅
- 5-1
- 2-4 e 3-3 sono uguali

**Spiegazione:** Con 6 carte mancanti la 4-2 è più probabile (48%) della 3-3 (36%). Ricordate: con un numero pari di carte mancanti la divisione più probabile non è mai quella equilibrata!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/cuori-gioco-lessons.ts:905`

**Domanda:** Con 5 carte mancanti, la divisione 3-2 ha probabilità del 68%.

**Risposta corretta:** Vero ✅

**Spiegazione:** Corretto! Con un numero dispari di carte mancanti la divisione più equilibrata È la più probabile: 3-2 = 68%.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 105-2: Impasse vs. divisione favorevole

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:930`

**Testo:** 3NT in Est. 4♠, 3♥, 1♦ sicure. La nona presa: impasse a ♦ (50%) o ♥ divise 3-3 (36%). Scartate la cartina di ♥ e fate l'impasse al K♦.

**Mano(i):** `♠AQJ ♥654 ♦A943 ♣762`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:945`

**Domanda:** Lo slam dipende da 2 impasse indipendenti: basta che almeno uno riesca. Qual è la probabilità di riuscita?

**Opzioni:**
- 50%
- 75% ✅
- 100%
- 25%

**Spiegazione:** Il primo impasse riesce il 50% delle volte. Del restante 50% in cui fallisce, il secondo riesce metà delle volte (+25%). Totale: 50% + 25% = 75%. Se servono ENTRAMBI: 50% x 50% = 25%.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-gioco-lessons.ts:953`

**Domanda:** Con 7 carte in linea (A3 + KQ1062) mancanti del J, battere in testa (52%) è leggermente meglio dell'impasse (50%).

**Risposta corretta:** Vero ✅

**Spiegazione:** Esatto! La battuta funziona con 3-3 (36%) più le volte che J è nel doubleton su 4-2 (16%). Totale 52%, meglio del 50% dell'impasse. Ma se il 10 è accanto all'Asso (A10 + KQ632), l'impasse torna a essere preferibile.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 105-3: Esercizi sulle percentuali

#### Blocco 1 (quiz) — `src/data/cuori-gioco-lessons.ts:973`

**Domanda:** Con 10 carte in linea (A7654 + QJ1098) mancanti del K: battete l'Asso o fate l'impasse?

**Opzioni:**
- Battere l'Asso: il Re secco cade il 13% delle volte
- Impasse: il 50% batte nettamente il 13% ✅
- Sono uguali
- Non importa, il K caderà comunque

**Spiegazione:** Il Re secco dietro l'asso vale solo il 13% (un terzo del 39% di singolo a destra). L'impasse vale 50%. Con 10 carte è giusto fare l'impasse!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/cuori-gioco-lessons.ts:986`

**Domanda:** Se le vostre possibilità sono: quadri 3-2 (68%) E POI, come seconda chance, impasse a cuori (50%), qual è la percentuale combinata?

**Opzioni:**
- 68%
- 84% ✅
- 50%
- 118%

**Spiegazione:** 68% (quadri buone) + 50% del restante 32% (quando le quadri sono cattive ma l'impasse riesce) = 68% + 16% = 84%. Le chance successive si sommano correttamente così!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (hand-eval) — `src/data/cuori-gioco-lessons.ts:994`

**Domanda:** In un colore mancano 4 carte. Quante volte su 100 saranno divise 2-2?

**Mano:** `♠AKJ10 ♦9876`

**Risposta corretta:** 40 ✅

**Spiegazione:** Con 4 carte mancanti: 3-1 = 50%, 2-2 = 40%, 4-0 = 10%. La divisione pari NON è la più probabile!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 106: Coprire o Non Coprire

_Quando giocare gli onori in seconda di mano_


### Modulo 106-1: Piccola su piccola. Sempre?

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:1038`

**Testo:** Morto ha Q74, voi K93 e Est A1052. Se mettete il 9 su piccola di Sud, la Q sarà catturata dall'Asso ma poi Sud farà l'impasse al 10! Giocando piccola avreste fatto 3 prese.

**Mano(i):** `Q74 / K93 / A1052`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:1048`

**Domanda:** Morto ha AQ1062, voi K7 in seconda di mano. Sud gioca il 3 verso il morto. Giocate il Re?

**Opzioni:**
- Sì, per prendere la presa
- No! Tenetevelo: Sud potrebbe decidere di battere l'Asso e il Re resterebbe vincente ✅
- Sì, sempre onore su piccola con il Re
- Dipende da quante carte ha Sud

**Spiegazione:** Tenetevi il Re! Sud potrebbe avere 10-11 carte e decidere di battere l'Asso. O anche con Jx giocare piccola al 10. Se mettete il Re, non sbaglierà mai!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 106-2: Onore su onore: quando coprire

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:1079`

**Testo:** Morto AK64, voi Q983, Sud gioca il J: coprite! 9 e 8 vi garantiscono la quarta presa. Con A84, voi K103 e Sud Q: coprite, il 10 resterà vincente nella schiena del J di Sud.

**Mano(i):** `AK64 / Q983`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-gioco-lessons.ts:1089`

**Domanda:** Il morto ha QJ4 e voi K76. Il giocante parte di Q dal morto. Coprite?

**Opzioni:**
- Sì, sempre onore su onore
- No! Non coprite il primo onore quando ce ne sono due. Coprite il secondo (il J) ✅
- Sì, il Re deve catturare la Dama
- No, mai coprire

**Spiegazione:** Con due onori al morto, non coprite mai il primo! Se coprite la Q, condannate l'eventuale 10 del compagno. Non coprendo, il colore va in 'stallo'. Coprirete il J se viene regiocato.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/cuori-gioco-lessons.ts:1102`

**Domanda:** Se il morto ha l'Asso secondo (A4) e Sud gioca la Q, è corretto coprire con il K terzo.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Vedendo l'Asso SECONDO al morto, è una follia mettere il K terzo: non mettendolo il Re farà presa sempre comunque, perché l'Asso è troppo corto per catturarlo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 106-3: Secondo di mano: prendere o no?

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:1127`

**Testo:** Morto KJ52, voi A3, Sud gioca cartina: giocate PICCOLA. Lasciate che faccia il suo impasse. Se la Q è in Sud, potrete sempre incassare l'Asso dopo.

**Mano(i):** `KJ52 / A3`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/cuori-gioco-lessons.ts:1132`

**Domanda:** Morto ha Q107, voi K53 in seconda di mano. Il giocante muove il 4 verso il morto. Cosa fate?

**Opzioni:**
- Mettete il Re per prendere subito
- Giocate piccola: se mettete il Re risolvete i problemi al giocante e non potrà più sbagliare ✅
- Mettete il 5 per segnalare
- Mettete il 3 per il conto

**Spiegazione:** Se Sud ha l'Asso, dovrà indovinare se passare la Q o il 10. Mettendo il K gli risolvete i problemi! Stesso ragionamento con l'Asso: non catturate un onore del morto a vuoto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 107: I Giochi di Eliminazione

_Messa in mano, taglio e scarto, figure delicate_


### Modulo 107-1: Il taglio e scarto

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:1181`

**Testo:** Atout picche eliminate. Ovest: ♠865 ♥- ♦AJ2 ♣-. Est: ♠43 ♥- ♦K1073 ♣-. Il difensore in presa deve uscire a cuori (taglio e scarto), fiori (taglio e scarto) o quadri (regala la presa nel colore).

**Mano(i):** `♠865 ♦AJ2 + ♠43 ♦K1073`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (quiz) — `src/data/cuori-gioco-lessons.ts:1196`

**Domanda:** Dopo l'eliminazione, il difensore in presa ha solo cuori (taglio e scarto) e quadri (dove avete AJ + K10). Cosa farete?

**Opzioni:**
- Sperare che giochi cuori per il taglio e scarto
- Non importa: qualunque cosa giochi vi favorisce! Cuori = taglio e scarto, quadri = presa regalata ✅
- Dovete ancora indovinare la posizione della Dama
- Dipende dalla dichiarazione

**Spiegazione:** Questo è il bello dell'eliminazione! L'avversario è 'inchiodato': qualunque uscita vi favorisce. Se gioca cuori scartate la perdente, se gioca quadri vi regala la presa.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 107-2: Le figure 'delicate'

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:1227`

**Testo:** A103 + J63: Se muove Sud o Nord, difficile fare 2 prese. Se muove Est, Sud cattura un onore con l'A e fa un'altra presa con J e 10. Se muove Ovest, Sud sta basso e ripete l'impasse.

**Mano(i):** `A103 + J63`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:1242`

**Domanda:** Per preparare un'eliminazione in 4♠, dovete: battere atout, tagliare l'ultima cuori del morto, incassare A e K di fiori e cedere la terza. Perché tagliare la cuori PRIMA?

**Opzioni:**
- Per fare una presa in più
- Per eliminare l'uscita neutra del difensore: se non togliete le cuori, potrà uscire di cuori senza regalare niente ✅
- Per contare i punti avversari
- Non serve tagliare la cuori

**Spiegazione:** Se non eliminate le cuori del morto, il difensore in presa a fiori potrebbe uscire tranquillamente a cuori senza regalare niente. Togliendogli questa uscita, sarà costretto a giocare quadri o a dare il taglio e scarto!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 107-3: Eliminazione in pratica

#### Esempio 1 — `src/data/cuori-gioco-lessons.ts:1268`

**Testo:** Sud gioca 4♠, attacco J♣. Rischia 3 perdenti a quadri e 1 a cuori. Battute le atout, incassa le due fiori vincenti scartando una cuori, poi A♥ e Q♥: i difensori dovranno fare taglio e scarto o muovere quadri.

**Mano(i):** `♠109xx ♥AQx ♦Jxxx ♣Kx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:1278`

**Testo:** 3NT: 8 prese sicure. Dopo A♦ e 9♦ per Ovest, le sue 3 quadri buone, è costretto a uscire a cuori o picche, regalando la nona presa. Ma prima bisogna togliergli le fiori incassandole tutte!

**Mano(i):** `♠xxx ♥AJ9 ♦xxx ♣AQxx`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-gioco-lessons.ts:1283`

**Domanda:** Il taglio e scarto NON costituisce regalo quando:

**Opzioni:**
- Il giocante ha esaurito le atout in una delle due mani
- Il giocante non ha più perdenti nei colori laterali
- Il giocante scarta ma resta con troppe carte nel colore problematico
- Tutte le precedenti ✅

**Spiegazione:** Tutte e tre! Il taglio e scarto non è un regalo se: le atout sono finite, non ci sono perdenti da scartare, o se il giocante scarta ma gli restano comunque troppe carte del colore problematico.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 108: Giocare Come Se

_Ipotesi necessarie e condizioni ineluttabili_


### Modulo 108-1: Scartare le situazioni perdenti

#### Esempio 3 — `src/data/cuori-gioco-lessons.ts:1332`

**Testo:** 7NT in Est. Solo 10 prese fuori da picche. DEVE andare bene il doppio impasse a picche (K e J in Sud). È solo il 25%? Meglio di niente. Se Nord ha un onore, si va sotto e basta. Ovest: ♠AQ10 ♥J109 ♦AKQJ ♣Q72. Est: ♠9843 ♥AKQ ♦652 ♣AKJ.

**Mano(i):** `♠AQ10 ♥J109 ♦AKQJ ♣Q72`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:1342`

**Domanda:** Giocate 6♠ e il contratto è impossibile se l'avversario ha AQ6 di atout. Che fate?

**Opzioni:**
- Cercate di indovinare dove sono le carte
- Giocate come se fossero tutte nello stesso avversario dove il contratto è fattibile ✅
- Vi arrendete
- Battete tutte le atout di testa

**Spiegazione:** Se una distribuzione è ineluttabilmente perdente, scartatela e giocate come se le carte fossero nella posizione che rende possibile il contratto. È l'unica chance!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 108-2: La catena di ragionamenti

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:1373`

**Testo:** Est gioca 6♥ con attacco 6♣. Non bisogna fare l'impasse a fiori! Visto che l'Asso di picche dovrà per forza essere ceduto, non ci si può permettere di perdere una presa in atout. L'impasse alla Q♥ DEVE riuscire. Quindi: A♣, A♥ e cuori al Fante.

**Mano(i):** `♠K4 ♥A875 ♦AJ1053 ♣AQ`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:1388`

**Domanda:** In 6♣ l'A♣ mostra che Nord ha tutte le atout (3-0). Dovete scartare la cuori sulla picche del morto. Questo richiede che Sud risponda 4 volte a picche. Come giocate?

**Opzioni:**
- Impasse a picche subito
- A e K di picche, e se il J non cade... picche al 10! Si gioca come se Sud avesse J quarto ✅
- Incassate le vincenti e sperate
- A e K di picche e poi stop

**Spiegazione:** Poiché dovete assolutamente scartare la cuori, Sud DEVE rispondere 4 volte a picche. Giocate come se avesse il J quarto: A, K e poi picche al 10 se il J non è caduto.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 108-3: Ipotesi sulla distribuzione

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:1419`

**Testo:** In 6♣ con atout 4-1 (Nord scarta), dovete incassare vincenti rosse senza che Sud tagli. Da dove cominciate? Dalle cuori! Sud DEVE avere almeno 3♥, altrimenti il piano non funziona. Se scoprite che ne ha 4, incasserete anche la quarta prima delle quadri.

**Mano(i):** `♠96 ♥AQ94 ♦AQ7 ♣AK52`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/cuori-gioco-lessons.ts:1424`

**Domanda:** Sud ha distribuzione ignota. Dovete incassare 3♥ e 3♦ senza che tagli. Sud ha 2♦ o 3♦, e 3♥ o 4♥. Da quale colore cominciate?

**Opzioni:**
- Dalle quadri, perché ne ho meno
- Dalle cuori: se Sud ha 3♥ e 3♦ è uguale, ma se ha 4♥ e 2♦ solo iniziando dalle cuori funziona ✅
- È indifferente
- Dall'istinto del momento

**Spiegazione:** Se le divisioni sono uguali (3+3) è indifferente. Ma se Sud ha 4♥ e 2♦ DOVETE cominciare dalle cuori, altrimenti vi taglia un giro di cuori. Cominciare dalle cuori copre entrambi i casi!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (true-false) — `src/data/cuori-gioco-lessons.ts:1437`

**Domanda:** La paura del down è spesso una buona consigliera, perché vi fa rimandare le giocate rischiose.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! La paura del down è una PESSIMA consigliera. Rimandando il problema spesso si perde la possibilità di risolverlo. Affrontate subito le condizioni necessarie!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


## Lezione 109: Le Deduzioni del Giocante

_Leggere l'attacco, la licita e il controgioco_


### Modulo 109-1: Deduzioni dall'attacco

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:1475`

**Testo:** In Sud giocate 4♠. Ovest attacca Q♦. L'attacco fa dedurre che Ovest non ha AK♥: un pezzo è certamente in Est (probabilmente il K). Con il K♥, Est non può avere nient'altro: le due Donne sono in Ovest. Impasse a picche su Ovest e AK fiori in testa: 11 prese.

**Mano(i):** `♠AJ6 ♥J74 ♦1087 ♣A652`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:1490`

**Domanda:** Ovest attacca Q♦ contro il vostro 4♠. Con KQ♥ avrebbe preferito quell'attacco. Cosa deducete?

**Opzioni:**
- Ha entrambi i Re
- Non ha AK di cuori, e il K♥ è probabilmente in Est ✅
- Ha 5 carte di quadri
- Non si può dedurre nulla

**Spiegazione:** Con AK di cuori Ovest avrebbe preferito quell'attacco. Attaccando Q♦ rivela che non ha la combinazione AK a cuori. Il K♥ è probabilmente in Est, e questo indirizza tutto il piano di gioco.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 6 (true-false) — `src/data/cuori-gioco-lessons.ts:1503`

**Domanda:** Se l'attacco arriva da un probabile singolo nel gioco ad atout, è improbabile che l'attaccante abbia una buona figura di atout (Qxx, Jxxx).

**Risposta corretta:** Vero ✅

**Spiegazione:** Esatto! Chi cerca un taglio non ha di solito una buona figura di atout, perché taglierebbe perdendo una presa naturale. L'attacco da singolo suggerisce mano corta in atout.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 109-2: Deduzioni dalla licita e dal controgioco

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:1528`

**Testo:** Est passa e poi mostra 2 Assi (A♠ e A♥). Dovete indovinare chi ha Q♣: non può essere Est! Con 2 Assi + Q avrebbe aperto. Impasse a fiori su Ovest.

**Mano(i):** `♠4 ♥J854 ♦KJ964 ♣AJ9`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (quiz) — `src/data/cuori-gioco-lessons.ts:1543`

**Domanda:** Ovest è passato di mano e poi ha attaccato AKQ di fiori. Il K♠ vi manca. Può avere AKQ♣ + K♠?

**Opzioni:**
- Sì, perché ha attaccato con forza
- No! Con 12+ punti avrebbe aperto. Giocate per il K♠ secco dietro l'Asso ✅
- Forse, dipende dalla vulnerabilità
- Sì, potrebbe aver passato per tattica

**Spiegazione:** Ovest è passato: non ha 12 punti. AKQ♣ = 9 punti. Se avesse anche K♠ sarebbero 12 e avrebbe aperto. Il K♠ NON è in Ovest: giocate A♠ sperando nel Re secco in Est.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 109-3: Leggere il comportamento dei difensori

#### Esempio 2 — `src/data/cuori-gioco-lessons.ts:1574`

**Testo:** 3NT. L'attacco è J♠, su cui Est invita. Deducete che Est ha la Q♠ terza: con Q seconda avrebbe sbloccato. Picche 4-3, cedete 2 quadri per le 9 prese senza avventure a cuori o fiori.

**Mano(i):** `♠864 ♥J73 ♦A9532 ♣64`

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 4 (quiz) — `src/data/cuori-gioco-lessons.ts:1584`

**Domanda:** L'attacco è J♠ e il terzo di mano mette la Q♠. Supponete che normalmente si sblocchi la Q seconda. Cosa deducete?

**Opzioni:**
- Est ha la Q secca
- Est ha la Q terza (o quarta con J10x di Ovest) ✅
- Ovest ha la Q
- Non si può dedurre nulla

**Spiegazione:** Un giocatore normalmente costituito sblocca la Q seconda sull'attacco di J. Se la Q 'non scende' al primo giro, Est ha Q terza o quarta. Con picche 4-3, potete cedere 2 quadri per le 9 prese senza rischi.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 5 (true-false) — `src/data/cuori-gioco-lessons.ts:1597`

**Domanda:** Un Maggiore dichiarato in risposta (come 2♣ su 1♦) chiede una descrizione generica dell'apertura, non fit specifico in quel seme.

**Risposta corretta:** Falso ✅

**Spiegazione:** Falso! Un MINORE chiede una descrizione generica. Un MAGGIORE chiede di SÉ: cioè chiede se c'è fit in quel seme specifico. Ricordate: Maggiore chiede di sé, minore chiede descrizione!

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---


### Modulo 109-4: Quiz finale: deduzioni integrate

#### Blocco 1 (quiz) — `src/data/cuori-gioco-lessons.ts:1617`

**Domanda:** 4♠ di Sud. Ovest attacca da cartina. Cosa potete dedurre sugli altri colori di Ovest?

**Opzioni:**
- Ha sequenze solide negli altri colori
- Non ha sequenze (AK, KQ, QJ) né singoli negli altri colori ✅
- Ha un colore lunghissimo
- Ha molti punti

**Spiegazione:** Un attacco di cartina nel gioco ad atout indica che l'attaccante non aveva alternative migliori: né sequenze di 2+ onori, né singoli promettenti negli altri colori.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 2 (quiz) — `src/data/cuori-gioco-lessons.ts:1630`

**Domanda:** L'avversario gioca consapevolmente in taglio e scarto. Cosa vi aspettate sulla sua lunghezza in atout?

**Opzioni:**
- Ha esattamente 2 atout
- È molto corto o molto lungo in atout: sta cercando di accorciarvi per salvare una presa ✅
- Ha 3 atout esatte
- Non ha atout

**Spiegazione:** Se l'avversario gioca deliberatamente il taglio e scarto, è o molto corto (non ha prese di atout da proteggere) o molto lungo (cerca di farvi tagliare dalla parte corta per accorciarvi e salvare la sua lunga di atout).

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

#### Blocco 3 (quiz) — `src/data/cuori-gioco-lessons.ts:1643`

**Domanda:** Ricevete l'attacco nel colore dichiarato da Est, ma Ovest non attacca nel colore in cui si sono appoggiati. Cosa sospettate?

**Opzioni:**
- Ovest ha dimenticato la licita
- Ovest ha un singolo nel colore di attacco, o AQ nel colore fittato ✅
- Est ha bluffato
- Nulla di particolare

**Spiegazione:** Se Ovest non attacca nel colore appoggiato, è perché ha un singolo altrove (un doubleton non giustificherebbe rinunciare al colore fittato) oppure ha AQ nel colore dell'appoggio e preferisce non muoverlo.

**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_

---

