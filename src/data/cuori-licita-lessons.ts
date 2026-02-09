/**
 * BridgeQuest - Cuori Licita (Advanced Bidding) Lesson Content Data
 * Extracted from FIGB Corso Cuori Licita official course material
 * 14 lessons organized into 4 worlds (IDs 20-23)
 *
 * World 20: Fondamenti Avanzati (Lessons 200-202) - Law of Total Tricks, Evaluations, Texas
 * World 21: Sviluppi Dichiarativi (Lessons 203-206) - 2/1, Slam approach, Cue Bids, Weak twos
 * World 22: Strategia e Convenzioni (Lessons 207-210) - 2C Strong, Competitive/Constructive, Fit in Major (3 versions)
 * World 23: Interventi e Casi Speciali (Lessons 211-213) - Special interventions, Particular cases after 1/1
 */

import type { Lesson } from "./lessons";

// ===== LESSON 200: La Legge delle Prese Totali =====

const lezione200: Lesson = {
  id: 200,
  worldId: 20,
  title: "La Legge delle Prese Totali",
  subtitle: "Dichiarare in base al numero di atout in linea",
  icon: "⚖️",
  smazzateIds: ["cl-1-1", "cl-1-2", "cl-1-3", "cl-1-4"],
  modules: [
    {
      id: "200-1",
      title: "La Legge fondamentale",
      duration: "6",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "La Legge delle Prese Totali",
        },
        {
          type: "text",
          content:
            "La Legge delle Prese Totali e una legge statistica fondamentale del bridge competitivo. Afferma che la somma delle prese che le due coppie faranno, se impegnate nei rispettivi migliori contratti, e uguale alla somma delle atout che complessivamente possiedono.",
        },
        {
          type: "rule",
          content:
            "PRESE TOTALI = SOMMA DELLE ATOUT. Se NS hanno 8 picche e EO hanno 8 cuori, le Prese Totali saranno 16.",
        },
        {
          type: "example",
          content:
            "NS ha 8 picche e realizza 7 prese. EO ha 8 cuori e realizza 9 prese. Totale: 16 prese = 16 atout (8+8). Spostando un onore da una linea all'altra, l'attribuzione cambia ma il totale resta 16.",
          cards: "♠QJ104 ♥654 ♦A43 ♣Q86",
        },
        {
          type: "text",
          content:
            "La Legge e indifferente alla posizione degli onori e alla distribuzione. Se si sposta un onore da una linea all'altra si modifica l'attribuzione di prese, ma il totale non cambia. Se si modifica la distribuzione, idem.",
        },
        {
          type: "tip",
          content: "Il livello di sicurezza",
          explanation:
            "Il livello di sicurezza e pari al numero delle atout che abbiamo sulla linea. Con 8 atout giochiamo a livello 2, con 9 a livello 3, con 10 a livello 4.",
        },
        {
          type: "quiz",
          content:
            "Secondo la Legge delle Prese Totali, se NS ha 9 picche e EO ha 8 cuori, quante sono le Prese Totali?",
          options: ["15", "16", "17", "18"],
          correctAnswer: 2,
          explanation:
            "Le Prese Totali sono 9 + 8 = 17. NS, giocando a Picche, puo aspettarsi circa 9 prese; EO circa 8.",
        },
        {
          type: "true-false",
          content:
            "Secondo la Legge, spostando un Re da una linea all'altra il numero totale di prese cambia.",
          correctAnswer: 1,
          explanation:
            "Falso! La Legge e indifferente alla posizione degli onori: il totale delle prese resta invariato, cambia solo l'attribuzione tra le due coppie.",
        },
      ],
    },
    {
      id: "200-2",
      title: "Dichiarare sotto la protezione della Legge",
      duration: "6",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "Applicazioni operative della Legge",
        },
        {
          type: "rule",
          content:
            "Quando la nostra coppia ha fit e punteggio eguale o inferiore a quello avversario conviene dichiarare immediatamente un impegno che preveda di fare tante prese quante sono le atout che pensiamo di possedere in linea.",
        },
        {
          type: "example",
          content:
            "Tutti in prima, siete in Est. Sud 1♣, Ovest 1♠, Nord Dbl. Con 8 atout in linea, dichiarate 2♠:",
          cards: "♠Qxx ♥xx ♦Kxxxx ♣xxx",
        },
        {
          type: "text",
          content:
            "Con ♠Qxxx ♥xxx ♦Axxxx ♣x dichiarate 3♠ (nove atout, nove prese). Con ♠Qxxxx ♥xx ♦Axxxx ♣x dichiarate 4♠ (dieci atout, dieci prese).",
        },
        {
          type: "rule",
          content:
            "Ogni dichiarazione esplicita del colore di atout mostra che si sta dichiarando secondo la Legge. Una dichiarazione convenzionale (in situazione di fit) mostra che si sta dichiarando in base ai punti onori.",
        },
        {
          type: "bid-select",
          content:
            "Il compagno apre 1♠ e l'avversario interviene 2♥. Avete: ♠K9854 ♥7 ♦Q762 ♣743. Cosa dichiarate?",
          options: ["2♠", "3♠", "4♠", "Passo"],
          correctAnswer: 2,
          explanation:
            "4♠! Dieci carte in linea, dieci prese. Anche se andate sotto di 1 o 2, e un affare rispetto alla manche avversaria a Cuori.",
        },
      ],
    },
    {
      id: "200-3",
      title: "Distribuzioni piatte e competitivo vs invitante",
      duration: "5",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "Attenzione alle distribuzioni 'a specchio'",
        },
        {
          type: "text",
          content:
            "Le distribuzioni 5332 e 4333 sono dette 'tomba' perche non offrono tagli. La Legge funziona lo stesso, ma nella spartizione delle Prese Totali all'avversario ne spetteranno troppe e a noi troppo poche.",
        },
        {
          type: "example",
          content:
            "Tutti in zona. 1♣-1♠-Dbl-? Con distribuzione 4333, dichiarate solo 2♠, non 3♠!",
          cards: "♠K963 ♥Q82 ♦874 ♣K92",
        },
        {
          type: "rule",
          content:
            "Nelle situazioni in cui si mostra fit o in cui il fit e gia concordato, ogni dichiarazione diretta del colore di atout mostra una competizione basata sulla Legge; ogni dichiarazione 'convenzionale' mostra un reale invito a partita basato sulla forza onori.",
        },
        {
          type: "text",
          content:
            "Se dopo 1♥-1♠-2♥-2♠ volete invitare a manche, NON dite 3♥ (sarebbe competitivo). Usate 2NT, 3♣, 3♦ o Contro: sono tutti inviti a manche, mentre il rialzo a 3♥ non lo sarebbe.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♥, l'avversario interviene 1♠. Avete: ♠65 ♥AQ65 ♦97643 ♣54. Cosa dichiarate?",
          options: ["2♥", "3♥ (Prese Totali)", "2♠ (surlicita)", "4♥"],
          correctAnswer: 1,
          explanation:
            "3♥: avete nove atout in linea (5+4), nove prese. Non e un invito a manche ma una dichiarazione competitiva secondo la Legge.",
        },
        {
          type: "true-false",
          content:
            "Con distribuzione 4333 e fit quarto, il principio 'nove carte nove prese' funziona sempre bene.",
          correctAnswer: 1,
          explanation:
            "Falso! Le distribuzioni piatte 4333 e 5332 riducono la resa di taglio. Bisogna agire con prudenza, perche nella spartizione delle Prese Totali saremo svantaggiati.",
        },
      ],
    },
  ],
};

// ===== LESSON 201: Valutazioni - Le lunghe e le corte =====

const lezione201: Lesson = {
  id: 201,
  worldId: 20,
  title: "Valutazioni: le lunghe e le corte",
  subtitle: "Singoli, lunghe e rivalutazione della mano",
  icon: "📏",
  smazzateIds: ["cl-2-1", "cl-2-2", "cl-2-3", "cl-2-4"],
  modules: [
    {
      id: "201-1",
      title: "Il valore dei singoli e delle corte",
      duration: "6",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "Valutazioni sulla distribuzione",
        },
        {
          type: "text",
          content:
            "Una situazione di fit non e di per se garanzia per fare prese extra. Le corte e le lunghe accanto al fit sono un valore determinante. Anche un fit di 10 carte puo dare risultati deludenti se mancano tagli e colori laterali sfruttabili.",
        },
        {
          type: "rule",
          content:
            "I singoli di prese non ne fanno! E la carta di atout che produce la presa nel taglio, non il singolo stesso. Chi possiede un singolo non ha gli elementi per valutarne l'efficacia: e il compagno che li ha. Morale: i singoli si raccontano e il partner valuta.",
        },
        {
          type: "example",
          content:
            "Ovest apre 1♦, poi dice 1♠, poi 3♣. Est deduce il singolo a cuori e sa che tutti i suoi punti sono utili:",
          cards: "♠Axxx ♥xxxx ♦Qxx ♣Qx",
        },
        {
          type: "text",
          content:
            "Non ha senso apprezzare un singolo a priori. Solo strada facendo un giocatore avra modo di valutare se la sua distribuzione merita rivalutazione o meno. Se il colore mostrato dal rispondente corrisponde al singolo, un gran Rever e giustificato solo da un punteggio supermassimo.",
        },
        {
          type: "tip",
          content: "Rivalutare dopo la risposta del compagno",
          explanation:
            "Con ♠AQJx ♥KQx ♦x ♣AQxxx: aprite 1♣. Su risposta 1♦ dichiarate solo 1♠ (il singolo di quadri non e un plusvalore). Su risposta 1♥ il 2♠ ci sta tutto (fit a cuori come assicurazione). Su risposta 1♠? Da bere per tutti: 4♠!",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♠ e voi avete: ♠Axxx ♥KQxx ♦xxx ♣xx. Ha poi mostrato singolo a cuori con la sequenza 1♠-2♣-3♦. Come valutate i vostri KQxx di cuori?",
          options: [
            "Eccellenti, danno prese in attacco",
            "Inutili, fronteggiano il singolo del compagno",
            "Buoni solo in difesa",
            "Indifferenti",
          ],
          correctAnswer: 1,
          explanation:
            "KQ di fronte al singolo del compagno sono inutili in attacco: non potranno mai fare prese, perche il compagno taglia al primo giro. Sono un valore solo difensivo.",
        },
      ],
    },
    {
      id: "201-2",
      title: "Le monocolori di 7+ carte",
      duration: "5",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "Le monocolori di 7 e piu carte",
        },
        {
          type: "text",
          content:
            "Un colore di 7 o piu carte e protagonista assoluto. Dara grandi gioie al suo possessore solo se ottera sempre il privilegio di essere protagonista come atout. Non bisogna nasconderlo ne tradirlo per un altro colore.",
        },
        {
          type: "rule",
          content:
            "Con le mani 7/4 e a volte anche le 7/5, sono mani MONOCOLORI. La convenienza ad offrire al partner una scelta e solo apparente. Ribadite la lunga!",
        },
        {
          type: "example",
          content:
            "Il vostro apre 2NT e voi avete un punto e una settima nobile: dichiarate 4♥!",
          cards: "♠763 ♥J1076542 ♦- ♣864",
        },
        {
          type: "text",
          content:
            "Le farete otto volte su dieci. Non sapete se troverete i punti giusti, ma il vostro compagno non ha elementi per valutare se ha carte utili, quindi prendetevi la responsabilita di decidere. Con le ottave bisogna ignorare i punti e prendere il toro per le corna!",
        },
        {
          type: "bid-select",
          content:
            "Ovest apre 1♣, Est risponde 1♠, Ovest 2♣. Est ha: ♠K9765432 ♥A52 ♦4 ♣2. Cosa dice?",
          options: ["3♠", "4♠", "2♠", "2NT"],
          correctAnswer: 1,
          explanation:
            "4♠! Avete un'ottava e verosimilmente 8 prese di gioco. Non umiliate queste carte: ci sono contratti che vanno dichiarati a spanne.",
        },
        {
          type: "true-false",
          content:
            "Con una settima maggiore e una quarta a fianco, conviene sempre mostrare entrambi i colori al compagno.",
          correctAnswer: 1,
          explanation:
            "Falso! Le 7/4 sono mani MONOCOLORI. La convenienza ad offrire una scelta e solo apparente. Il colore settimo dovrebbe prevalere quasi sempre.",
        },
      ],
    },
  ],
};

// ===== LESSON 202: Le Texas su apertura 1NT e 2NT =====

const lezione202: Lesson = {
  id: 202,
  worldId: 20,
  title: "Le Texas su apertura 1NT e 2NT",
  subtitle: "Jacoby Transfer e Transfer per i minori",
  icon: "🔀",
  smazzateIds: ["cl-3-1", "cl-3-2", "cl-3-3", "cl-3-4"],
  modules: [
    {
      id: "202-1",
      title: "Le Jacoby Transfer",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Le Jacoby Transfer sull'apertura di 1NT",
        },
        {
          type: "text",
          content:
            "Una dichiarazione in transfer (Texas) e una licita convenzionale che, per mostrare un colore, dichiara quello di rango immediatamente inferiore. I vantaggi sono due: orientano il gioco dalla parte della mano forte e funzionano da moltiplicatori di licite.",
        },
        {
          type: "rule",
          content:
            "2♦ = almeno 5 carte di Cuori. 2♥ = almeno 5 carte di Picche. Il Transfer vi consente SEMPRE una seconda dichiarazione.",
        },
        {
          type: "text",
          content:
            "L'Apertore rispetta il Transfer con tutte le mani con cui sul 'due naturale' sarebbe passato. Eccezionalmente, con fit di 4 carte e mano massima, puo 'super accettare' dichiarando 3 nel colore del rispondente.",
        },
        {
          type: "example",
          content:
            "Dopo 1NT-2♦-2♥, le opzioni del rispondente sono:",
          cards: "♠43 ♥Q10754 ♦5432 ♣93",
        },
        {
          type: "text",
          content:
            "Passo = mano da parziale. 3♥ = monocolore invitante. 4♥ = monocolore da manche. 2NT = bilanciata invitante. 3NT = bilanciata da manche. Un colore nuovo = sbilanciata 5/4+, circa 7-8 punti (invito leggero).",
        },
        {
          type: "bid-select",
          content:
            "Il compagno apre 1NT. Avete: ♠42 ♥AKJ743 ♦732 ♣42. Cosa dichiarate?",
          options: ["2♥", "2♦", "4♥", "3♥"],
          correctAnswer: 1,
          explanation:
            "2♦! E il transfer per le Cuori. Il compagno dichiarera 2♥ e sara lui a giocarle, proteggendo i suoi valori dall'attacco. Poi direte 4♥.",
        },
        {
          type: "quiz",
          content:
            "Perche il Transfer e preferibile alla dichiarazione diretta del colore?",
          options: [
            "Mostra piu punti",
            "Orienta il gioco dalla mano forte e moltiplica le licite",
            "Impedisce l'intervento avversario",
            "Mostra sempre lo slam",
          ],
          correctAnswer: 1,
          explanation:
            "I Transfer orientano il gioco dalla mano forte (proteggendo i valori) e funzionano da moltiplicatori di licite, consentendo sempre una seconda dichiarazione.",
        },
      ],
    },
    {
      id: "202-2",
      title: "Transfer per i minori e Stayman avanzata",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "I Transfer per i colori minori",
        },
        {
          type: "text",
          content:
            "A differenza delle Jacoby, i Transfer per un minore garantiscono almeno SEI carte. 2♠ mostra le Fiori. 2NT mostra le Quadri. Tra il Transfer e il colore reale esiste un 'gradino di mezzo' per la superaccettazione.",
        },
        {
          type: "rule",
          content:
            "Quando l'Apertore dichiara il gradino di mezzo mostra il possesso di almeno un onore maggiore (A, K o Q) nel minore del compagno. Quando rispetta il Transfer nega l'onore maggiore.",
        },
        {
          type: "example",
          content:
            "1NT-2♠(Fiori): Ovest con ♠A972 ♥K4 ♦KQ73 ♣K75 dira 2NT (ha K♣). Con ♠AK2 ♥KJ94 ♦AQ7 ♣875 dira 3♣ (no onori a Fiori).",
        },
        {
          type: "text",
          content:
            "La Stayman convive con i Transfer. Si usa per cercare fit nella 4-4 o quando, con mano da manche e un maggiore 5+, preme sapere se l'Apertore ha fit o solo 2 carte. Risposte avanzate: 2NT = entrambe le nobili minimo, 3♣ = 4+4+3♣ massimo, 3♦ = 4+4+3♦ massimo.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1NT, avete: ♠AK863 ♥4 ♦AKJ4 ♣752. Se usate il Transfer 2♥, dopo 2♠ non avrete piu licita adatta. Quale via e corretta?",
          options: [
            "Transfer 2♥ poi 3♦",
            "Stayman 2♣ poi dichiarare le picche",
            "3NT diretto",
            "4♠ diretto",
          ],
          correctAnswer: 1,
          explanation:
            "La via giusta e la Stayman! Potrete dire 2♠ su qualsiasi risposta, e se l'apertore nega fit con 2NT direte 3♦ forzante. Il Transfer vi avrebbe bloccato.",
        },
        {
          type: "true-false",
          content:
            "Dopo un Transfer, il 4NT e Blackwood (richiesta d'Assi).",
          correctAnswer: 1,
          explanation:
            "Falso! Dopo un Transfer, il 4NT descrive una 5332 ed e un quantitativo (tentativo di 6NT), NON richiesta d'Assi.",
        },
      ],
    },
  ],
};

// ===== LESSON 203: Sviluppi dopo le risposte 2 su 1 =====

const lezione203: Lesson = {
  id: 203,
  worldId: 21,
  title: "Sviluppi dopo le risposte 2 su 1",
  subtitle: "Forzante manche e ridichiarazioni dell'apertore",
  icon: "🔱",
  smazzateIds: ["cl-4-1", "cl-4-2", "cl-4-3", "cl-4-4"],
  modules: [
    {
      id: "203-1",
      title: "Principi del 2 su 1 e ridichiarazioni",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "La risposta 2 su 1: forzante di manche",
        },
        {
          type: "text",
          content:
            "Una risposta 2 su 1 e forzante di manche tranne due eccezioni: quando chi la fornisce era gia passato di mano (8-11 punti), e quando l'avversario e intervenuto a colore (promette 10+ anziche 12+).",
        },
        {
          type: "rule",
          content:
            "In situazione di sicuro forcing manche, l'apertore ridichiara a livello descrivendo la distribuzione. L'apertore dichiara i colori che ha: se non li dichiara e perche non li possiede.",
        },
        {
          type: "text",
          content:
            "Le possibili ridichiarazioni: 1) Un colore nuovo a livello 2 (11-21 punti, forza indeterminata). 2) La ripetizione del nobile: non allunga il colore e non limita la mano. 3) 2NT: bilanciata di diritto 12-14, unica che limita. 4) Un colore nuovo a livello 3: mano buona (15+ o 5-5).",
        },
        {
          type: "example",
          content:
            "Dopo 1♥-2♣, Ovest ripete 2♥ anche con ♠Qx ♥AJxxxx ♦AK ♣Kxx. Perche non c'e fretta: il colore di atout per lo Slam potrebbe essere Fiori.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♥-2♦, l'apertore ha: ♠KJx ♥Kxxxx ♦xx ♣AQx. Cosa ridichiara?",
          options: ["2♥", "2NT", "2♠", "3♣"],
          correctAnswer: 1,
          explanation:
            "2NT! Mostra bilanciata di diritto (12-14) con fermi negli altri colori, giocati dalla propria parte. E l'unica replica che limita la mano.",
        },
      ],
    },
    {
      id: "203-2",
      title: "Le indagini del Rispondente",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Colori 'morti' e indagini di fit",
        },
        {
          type: "rule",
          content:
            "Al secondo giro, la dichiarazione di un colore morto mostra un problema di fermi. La dichiarazione di 2NT mostra disinteresse per i fermi (o perche li ha, o perche sa gia che giochera ad atout).",
        },
        {
          type: "text",
          content:
            "Il Riporto a 2 nel seme di apertura mostra 'almeno tolleranza' (2+ carte) e chiede un'ulteriore descrizione. Non fissa l'atout. Il 4 colore chiede il Fermo. Il rialzo a 3 in uno dei colori dell'apertore mostra velleita di Slam (almeno 15/16 punti).",
        },
        {
          type: "example",
          content:
            "1♠-2♣: Est ha ♠KQ74 ♥A9 ♦A6 ♣KQ983. Dopo 2♥-2♠-3♣, Est fissa le picche con 3♠, mostrando obiettivo Slam.",
        },
        {
          type: "bid-select",
          content:
            "Dopo 1♠-2♣-2♥, avete: ♠5 ♥K52 ♦A1097 ♣KQJ52. Cosa dichiarate?",
          options: ["2NT", "3♥", "2♠", "3NT"],
          correctAnswer: 0,
          explanation:
            "2NT per sentire ancora la descrizione dell'apertore! Ovest potrebbe ripetere le Cuori (quinta), dire 3NT (5422), mostrare la sesta di Picche (3♠), o dire 3♣ mostrando corta a Quadri.",
        },
        {
          type: "true-false",
          content:
            "In situazione forzante di manche, se il rispondente conclude a 3NT e l'apertore ha mano forte (17+), l'apertore deve passare.",
          correctAnswer: 1,
          explanation:
            "Falso! L'apertore puo riaprire: 4NT e quantitativo (non Blackwood) se ha 17+ con 5422 senza fit. Puo anche dire 4 nel colore del rispondente se ha fit e mano forte.",
        },
      ],
    },
  ],
};

// ===== LESSON 204: Accostamento a Slam - Fissare l'atout =====

const lezione204: Lesson = {
  id: 204,
  worldId: 21,
  title: "Accostamento a Slam: fissare l'atout",
  subtitle: "Terreno solido e non solido per lo Slam",
  icon: "🎯",
  smazzateIds: ["cl-5-1", "cl-5-2", "cl-5-3", "cl-5-4"],
  modules: [
    {
      id: "204-1",
      title: "Terreno solido e non solido",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Fissare l'atout: la differenza tra trovare fit e fissare",
        },
        {
          type: "text",
          content:
            "'Fissare l'atout' e diverso da 'trovare fit': e implicito che l'obiettivo sia lo Slam. Dopo 1♦-1♥-1♠-3♠ la coppia ha trovato fit ma 3♠ potrebbe restare il contratto finale. Dopo 1♠-2♣-2♥-3♥ Est 'fissa' l'atout Cuori in una sequenza forzante per lo Slam.",
        },
        {
          type: "rule",
          content:
            "Terreno solido: le dichiarazioni iniziali hanno individuato almeno 21-22 punti in linea. Se il terreno e solido, un atout fissato appena sotto il livello di manche e FORZANTE. Se non solido, e INVITANTE (passabile).",
        },
        {
          type: "example",
          content:
            "Terreno solido: (1) 1♥-2♣ gia FM. (2) 2♠-3♠: Ovest ha 21+ da solo. (3) 1♦-1♠-2♥-3♥: Rever 16+ e risposta 5+. (4) 1NT-2♣-2♠-3♠: Ovest 15+ e Est 8+.",
        },
        {
          type: "text",
          content:
            "Terreno non solido: Dopo 1♥-1♠-2♥ non c'era certezza di 21+, quindi 3♥ e passabile. Dopo 1♦-1♥-1♠ idem, 3♠ e passabile. Perche e importante comunicare fit e forza a basso livello? Perche lo spazio puo essere utilizzato scambiandosi cue-bid.",
        },
        {
          type: "quiz",
          content:
            "Dopo la sequenza 1♥-1♠-2♦-3♥, il 3♥ e forzante?",
          options: [
            "Si, perche ha fissato l'atout",
            "No, perche non c'era certezza di 21+ punti in linea",
            "Si, perche e una risposta 2 su 1",
            "Dipende dalla zona",
          ],
          correctAnswer: 1,
          explanation:
            "Dopo 1♥-1♠-2♦, la coppia non ha certezza di possedere 21+ punti: il terreno non e solido, quindi 3♥ e un invito passabile.",
        },
      ],
    },
    {
      id: "204-2",
      title: "Il quarto colore e la competizione",
      duration: "5",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Fissare l'atout in terreno non solido: il quarto colore",
        },
        {
          type: "text",
          content:
            "Quando il Rispondente ha risposto 1 su 1 e ha ambizioni di Slam, per arrivare a un '3 in atout' forzante deve passare dal quarto colore per costruire Terreno solido in anticipo. La strada rapida (salto diretto) e solo invitante.",
        },
        {
          type: "example",
          content:
            "1♣-1♥-1♠: Est ha ♠AK97 ♥AQ753 ♦A7 ♣86. Non deve dire 3♠ immediato (invitante!). Dice 2♦ (quarto colore), poi 3♠, chiarendo atout e obiettivo Slam.",
        },
        {
          type: "rule",
          content:
            "In competizione: ogni rialzo diretto e 'solo competitivo'. Per fissare l'atout con mano forte, usate surlicita o contro, poi dichiarate il colore. Le due domande chiave: A) Puo accontentarsi del contratto? B) Aveva strade piu forti? Se SI a entrambe, e passabile!",
        },
        {
          type: "bid-select",
          content:
            "1♦-1♥-2♥: Est ha ♠AK7 ♥KQ753 ♦K7 ♣J86. Ovest mostra 3♣. Cosa fate?",
          options: [
            "3♥ (tentativo fallito)",
            "3♦ (forzante, cerco slam)",
            "4♥",
            "3NT",
          ],
          correctAnswer: 1,
          explanation:
            "3♦ e forzante in quanto illogico (il fit e cuori). Potete poi mostrare la cue bid a 3♠. Se diceste 3♥ significherebbe 'tentativo fallito, giochiamo 3♥'.",
        },
      ],
    },
  ],
};

// ===== LESSON 205: Accostamento a Slam - Le Cue Bid =====

const lezione205: Lesson = {
  id: 205,
  worldId: 21,
  title: "Accostamento a Slam: le Cue Bid",
  subtitle: "Controlli, livelli di guardia e fasi dello Slam",
  icon: "🛡️",
  smazzateIds: ["cl-6-1", "cl-6-2", "cl-6-3", "cl-6-4"],
  modules: [
    {
      id: "205-1",
      title: "Le quattro regole delle Cue Bid",
      duration: "7",
      type: "theory",
      xpReward: 75,
      content: [
        {
          type: "heading",
          content: "Le Cue Bid: dichiarazioni illogiche che mostrano controllo",
        },
        {
          type: "text",
          content:
            "Le Cue-Bid sono dichiarazioni illogiche che mostrano controllo in un colore, dopo che la coppia abbia posto il traguardo a Slam. Non confondete Fermo e Controllo: QJx sono un fermo ma non un controllo. Il vuoto e un controllo ma non e un fermo.",
        },
        {
          type: "rule",
          content:
            "I controlli che proteggono un colore sono: Asso e Vuoto (1 giro), Re e Singolo (2 giro). Le 4 regole: 1) Non si fanno cue-bid nel colore di atout. 2) Ogni giocatore effettua la cue-bid piu economica che ha. 3) Cue-bid saltata, non c'e. 4) Cue saltata e poi fatta = controllo di 3 giro (la Dama).",
        },
        {
          type: "text",
          content:
            "Regola 3 fondamentale: se un giocatore salta una cue bid e il compagno prosegue annunciando un'altra cue bid, PROMETTE di possedere controllo anche nel colore saltato.",
        },
        {
          type: "example",
          content:
            "1♥-2♣-2♥-3♥: Ovest ha ♠6 ♥AJ10872 ♦942 ♣AK2. Deve dire 3♠ (singolo, cue piu economica) e NON 4♣ (salterebbe le picche).",
        },
        {
          type: "quiz",
          content:
            "Dopo 2♠*-3♠-4♦-4♠, cosa mostra il 4♦ di Est?",
          options: [
            "Controllo a quadri e anche a fiori (saltato)",
            "Solo controllo a quadri",
            "Fermo a quadri",
            "Vuoto a fiori",
          ],
          correctAnswer: 0,
          explanation:
            "Attenzione: il 4♦ ESCLUDE controllo a fiori (regola 3: cue saltata non c'e). Se Est non ha neppure il controllo fiori, deve riportare a 4♠ senza mostrare il cuori!",
        },
      ],
    },
    {
      id: "205-2",
      title: "Le fasi dell'accostamento a Slam",
      duration: "6",
      type: "theory",
      xpReward: 75,
      content: [
        {
          type: "heading",
          content: "Le quattro fasi dello Slam",
        },
        {
          type: "text",
          content:
            "FASE 1: fissare l'atout in forcing. FASE 2: verificare che tutti i colori siano controllati (cue bid OBBLIGATORIE sotto il livello di manche!). FASE 3: ridefinizione della forza (superare o meno il livello di guardia). FASE 4: conclusione (4NT Blackwood o secondo giro di cue bid).",
        },
        {
          type: "rule",
          content:
            "Tutte le cue bid che possono esser fatte restando sotto il livello di manche sono OBBLIGATORIE. Non rifiutatevi con la scusa della mano 'minima'. Chi RIPOSA nel livello di guardia mostra forza minima. Chi SUPERA il livello di guardia mostra forza extra.",
        },
        {
          type: "example",
          content:
            "1♥-2♣-2♠-3♠-4♣-4♦-4♥-4♠-4NT-5♦-6♠: il primo giro di cue bid (4♣, 4♦) e sotto il livello di guardia. 4♥ frenata = tentativo minimo. Ma Ovest, che non ha mostrato la forza, prende l'iniziativa.",
        },
        {
          type: "tip",
          content: "Chi chiede gli Assi?",
          explanation:
            "Solo una mano che non si e mai limitata in precedenza puo chiedere gli assi con 4NT. Se non lo fate voi quando vi spetta, il compagno proseguira con cue bid e non saprete mai quanti assi avete in linea!",
        },
        {
          type: "true-false",
          content:
            "Se un giocatore ha mano minima, puo rifiutarsi di fare cue bid sotto il livello di manche per scoraggiare il compagno.",
          correctAnswer: 1,
          explanation:
            "Falso! Sotto il livello di manche le cue bid sono OBBLIGATORIE. Negarle porterebbe il compagno a conclusioni errate sulla posizione dei controlli.",
        },
      ],
    },
  ],
};

// ===== LESSON 206: Le Sottoaperture =====

const lezione206: Lesson = {
  id: 206,
  worldId: 21,
  title: "Le Sottoaperture",
  subtitle: "Aperture deboli di 2♦, 2♥ e 2♠ (6-10 punti)",
  icon: "📉",
  smazzateIds: ["cl-7-1", "cl-7-2", "cl-7-3", "cl-7-4"],
  modules: [
    {
      id: "206-1",
      title: "Requisiti delle sottoaperture",
      duration: "5",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "Le sottoaperture 2♦, 2♥ e 2♠",
        },
        {
          type: "text",
          content:
            "Se una coppia gioca le sottoaperture: 2♦, 2♥, 2♠ mostrano 6 carte e punteggio 6-10. Il 2♣ rimane l'unica apertura forte. Sono aperture interdittive: il Rispondente sara Capitano e l'Apertore non prendera piu iniziativa.",
        },
        {
          type: "rule",
          content:
            "Requisiti del colore: per 2♥ e 2♠ almeno un onore maggiore (A o K), oppure Q accompagnata dal 10. Per 2♦ servono almeno 2 onori maggiori (la manche aspirata e 3NT). Mai sottoaprire con una quarta maggiore a fianco!",
        },
        {
          type: "example",
          content: "Esempi di sottoaperture corrette:",
          cards: "♠KQ10763 ♥65 ♦K93 ♣J2",
        },
        {
          type: "text",
          content:
            "♠KQ10763 ♥65 ♦K93 ♣J2: 2♠. ♠85 ♥AJ9764 ♦92 ♣QJ5: 2♥. ♠75 ♥92 ♦AKJ1065 ♣763: 2♦. Ma ♠AJ9863 ♥K764 ♦83 ♣9: passate! Non sottoaprite mai con una quarta maggiore a fianco.",
        },
        {
          type: "bid-select",
          content:
            "Avete: ♠AQxxxx ♥x ♦Axx ♣xxx. Aprite di:",
          options: ["2♠", "1♠", "Passo", "3♠"],
          correctAnswer: 1,
          explanation:
            "1♠! La mano ha abbondantemente due prese certe di controgioco; non assomiglia a una sottoapertura. Con ♠KQxxxx ♥QJ ♦Jxx ♣Jx (10 punti ma senza prese di controgioco) potreste invece sottoaprire.",
        },
      ],
    },
    {
      id: "206-2",
      title: "Le risposte e la convenzione Ogust",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Le risposte dopo sottoapertura",
        },
        {
          type: "text",
          content:
            "Un nuovo colore del Rispondente e naturale (5+ carte), forte (14+) e forzante. Il rialzo a 3 mostra fit terzo (9 atout = 9 prese, Legge). Il rialzo a 4 puo venire da mano povera con fit quarto (Prese Totali) o mano con punti sufficienti.",
        },
        {
          type: "rule",
          content:
            "Il 2NT e la convenzione Ogust interrogativa: 3♣ = minimo + colore brutto. 3♦ = minimo + colore bello. 3♥ = massimo + colore brutto. 3♠ = massimo + colore bello. 3NT = AKQxxx chiuso.",
        },
        {
          type: "example",
          content:
            "Su apertura 2♠, compagno interroga con 2NT. Avete: ♠KQ9753 ♥87 ♦A84 ♣97. Massimo e bello: rispondete 3♠.",
        },
        {
          type: "quiz",
          content:
            "Su apertura 2♠-2NT (Ogust), con ♠Q109753 ♥87 ♦K84 ♣Q7, cosa rispondete?",
          options: ["3♣", "3♦", "3♥", "3♠"],
          correctAnswer: 0,
          explanation:
            "3♣: punteggio minimo (8 punti) e colore brutto (solo la Q come onore maggiore, senza il 10). Il colore 'bello' richiederebbe 2 onori maggiori o A/K accompagnato da J10.",
        },
        {
          type: "true-false",
          content:
            "Dopo una sottoapertura, con 12-13 punti e nessun fit, il Rispondente deve comunque dichiarare.",
          correctAnswer: 1,
          explanation:
            "Falso! Se il fit e inesistente bisogna avere il coraggio di passare, anche con 12-14 punti. Valori di apertura con fit secondo bastano appena per mantenere il contratto gia dichiarato.",
        },
      ],
    },
  ],
};

// ===== LESSON 207: L'apertura di 2♣ forte indeterminata =====

const lezione207: Lesson = {
  id: 207,
  worldId: 22,
  title: "L'apertura di 2♣ forte indeterminata",
  subtitle: "Gestire tutte le mani forti con 2♣",
  icon: "⚡",
  smazzateIds: ["cl-8-1", "cl-8-2", "cl-8-3", "cl-8-4"],
  modules: [
    {
      id: "207-1",
      title: "Struttura del 2♣ e risposte",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "L'apertura di 2♣ forte indeterminata",
        },
        {
          type: "text",
          content:
            "Con le sottoaperture attive, tutte le mani forti convogliano nel 2♣. L'apertura di 2♣ e l'unica in cui il Capitanato spetta all'Apertore. La risposta convenzionale di attesa e 2♦. Se l'Apertore mostra mano a base minore, la situazione e FM.",
        },
        {
          type: "rule",
          content:
            "Risposte: 2♥/2♠ = 5+ carte con onore, 5+ punti (FM). 3♥/3♠ = 6+ carte con 2-3 onori maggiori. 3♣/3♦ = 5+ carte con 3 onori o 6+ con 2. 2NT = 5-7 punti, 4333, nega A o 2K. 2♦ = attesa (la piu frequente).",
        },
        {
          type: "text",
          content:
            "Su 2♦, l'Apertore ridichiara: 2NT = bilanciata 23+ (FM). 2♥/2♠ = come apertura standard 2♥/2♠ (forzante fino al ritorno nel colore). 3♣/3♦ = FM, ridichiarazione del 1 gradino e negativa. 3♥/3♠ a salto = monocolore chiusa, impone l'atout.",
        },
        {
          type: "example",
          content:
            "2♣-2♦-3♠: l'atout e imposto. Est mostra l'unica cue bid (4♥), Ovest conclude a 4♠ sapendo che ci sono 2 quadri da perdere.",
          cards: "♠AKQJ763 ♥A ♦87 ♣AKQ",
        },
        {
          type: "quiz",
          content:
            "Il partner apre 2♣. Avete: ♠108653 ♥KQJ ♦73 ♣Q82. Cosa rispondete?",
          options: ["2♠", "2♦", "2NT", "3♠"],
          correctAnswer: 1,
          explanation:
            "2♦ (attesa)! Le picche hanno 5 carte ma manca l'onore (solo il 10). Per rispondere 2♠ servono almeno 5 carte capeggiate da un onore (A o K, o almeno Q).",
        },
      ],
    },
    {
      id: "207-2",
      title: "Intervento avversario su 2♣",
      duration: "4",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "L'apertura di 2♣ sancisce il 'possesso del board'",
        },
        {
          type: "rule",
          content:
            "L'apertura di 2♣ significa: 'o giochiamo noi, o giocano loro ma Contrati'. Su intervento a colore: il Contro fino a 3♠ compreso e PUNITIVO. Dichiarazioni a Senza e a colore sono naturali FM.",
        },
        {
          type: "text",
          content:
            "Se l'avversario interviene da 3♠ in su, il meccanismo si rovescia: il Contro mostra mano nulla ('non dichiarare piu'). Il Passo mostra carte utili per il gioco dell'Apertore.",
        },
        {
          type: "bid-select",
          content:
            "Il partner apre 2♣ e l'avversario interviene 4♠. Avete: ♠32 ♥K1063 ♦Q53 ♣QJ52. Cosa fate?",
          options: ["Contro", "Passo", "5♥", "4NT"],
          correctAnswer: 1,
          explanation:
            "Passo! A livello alto il Passo mostra carte utili per il gioco dell'Apertore. Il Contro mostrerebbe mano nulla. Qui avete valori che possono aiutare il compagno.",
        },
      ],
    },
  ],
};

// ===== LESSON 208: Competitivo, Costruttivo, Interdittivo =====

const lezione208: Lesson = {
  id: 208,
  worldId: 22,
  title: "Competitivo, costruttivo, interdittivo",
  subtitle: "I tre messaggi fondamentali della dichiarazione",
  icon: "📚",
  smazzateIds: ["cl-9-1", "cl-9-2", "cl-9-3", "cl-9-4"],
  modules: [
    {
      id: "208-1",
      title: "Distinguere i tre messaggi",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Competitivo, costruttivo e interdittivo",
        },
        {
          type: "text",
          content:
            "Sono i tre messaggi fondamentali che si scambiano in competizione. COMPETITIVO: 'mi accontento di giocare il parziale' (appoggio o rialzo senza salto). COSTRUTTIVO: 'ho un serio tentativo di manche, con prese di controgioco' (contro, surlicita, cambio forcing). INTERDITTIVO: 'tante prese in attacco, pochissime in difesa' (annuncio a salto).",
        },
        {
          type: "example",
          content:
            "1♠-2♥-2♠-3♥. Sud ha tre opzioni: con ♠KQJ76 ♥75 ♦KQJ9 ♣32 dice 3♠ (competitivo). Con ♠AKQ876 ♥2 ♦KQ92 ♣32 dice 4♠ (interdittivo). Con ♠A8762 ♥A5 ♦AQ2 ♣KJ2 dice Contro (costruttivo).",
        },
        {
          type: "rule",
          content:
            "Le dichiarazioni competitive corrispondono sempre a colori che si intende giocare, e sono effettuate in appoggio o rialzo ma non a salto. Le costruttive non coincidono mai con una proposta di gioco. Le interdittive sono sempre caratterizzate da un annuncio a salto.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♣-P-1♥-1♠-2♥-2♠, Nord ha: ♠63 ♥AQ87 ♦KJ5 ♣9865. Cosa dichiara?",
          options: ["3♥", "Contro", "Passo", "4♥"],
          correctAnswer: 1,
          explanation:
            "Contro! Rappresenta 'un gran bel 3♥' costruttivo, tendenzialmente bilanciato. Se dicesse 3♥ sarebbe competitivo (e l'apertore passerebbe anche con 14). Il Contro invita a manche.",
        },
      ],
    },
    {
      id: "208-2",
      title: "Riconoscere e applicare i tre messaggi",
      duration: "5",
      type: "exercise",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Come riconoscere una dichiarazione competitiva",
        },
        {
          type: "text",
          content:
            "Tre criteri: 1) Il sistema la definisce tale. 2) Vi erano alternative 'forti' (contro, surlicita). 3) La coppia ha gia manifestato l'intenzione di non giocare manche (coerenza).",
        },
        {
          type: "rule",
          content:
            "Chi fa una dichiarazione interdittiva demanda al compagno il compito di prendere tutte le successive decisioni. Consiglio fondamentale: fatela al massimo livello che le vostre carte consentono, e alla prima occasione.",
        },
        {
          type: "bid-select",
          content:
            "1♥-P-2♥-P-3♥. Questo rialzo di Sud e un invito a manche?",
          options: [
            "Si, invita a manche",
            "No, e interdittivo: mostra maggior lunghezza secondo la Legge",
            "No, e competitivo",
            "Si, e costruttivo",
          ],
          correctAnswer: 1,
          explanation:
            "No! Per un invito Sud aveva a disposizione 2NT, 2♠, 3♣, 3♦. Il solo motivo per salire a 3 e mostrare maggior lunghezza (Legge) e rendere impossibile un rientro tardivo avversario.",
        },
        {
          type: "true-false",
          content:
            "Una dichiarazione a salto in situazione di appoggio e sempre interdittiva, mai costruttiva.",
          correctAnswer: 0,
          explanation:
            "Vero! Le dichiarazioni interdittive sono SEMPRE caratterizzate da un annuncio a salto. I messaggi costruttivi usano altri mezzi: contro, surlicita, cambio di colore forcing.",
        },
      ],
    },
  ],
};

// ===== LESSON 209: Mani di fit nel nobile - Standard =====

const lezione209: Lesson = {
  id: 209,
  worldId: 22,
  title: "Mani di fit nel nobile: standard",
  subtitle: "Appoggi barrage, 2NT Truscott e 1NT semiforzante",
  icon: "❤️",
  smazzateIds: ["cl-10a-1", "cl-10a-2", "cl-10a-3", "cl-10a-4"],
  modules: [
    {
      id: "209-1",
      title: "Appoggi barrage e 2NT Truscott",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Dalla Rivalutazione alle Prese Totali",
        },
        {
          type: "text",
          content:
            "Gli appoggi a livello 3 e 4 mostrano rispettivamente 4 e 5 carte di fit, forza non superiore a 7 punti, distribuzione sbilanciata. Raccontano l'esatta lunghezza del fit. L'apertore deve immaginare di avere di fronte una mano molto povera.",
        },
        {
          type: "rule",
          content:
            "Il 2NT Truscott: fit nel nobile terzo o quarto, invito a manche (10-12 brutti). Non richiede fermi nei colori ne mano bilanciata: parla del fit. L'apertore riporta a 3 nel colore se minimo, dichiara manche se buon diritto, o mostra colore laterale se in dubbio.",
        },
        {
          type: "example",
          content: "Su 1♥, risposte con il nuovo sistema:",
          cards: "♠854 ♥10862 ♦2 ♣KJ743",
        },
        {
          type: "text",
          content:
            "3♥ = 4 carte fit, 3-7 punti, sbilanciata. 4♥ = 5 carte fit, 3-7 punti. 2NT = fit 3/4, invito a manche (10-12). 2♥ = fit 3/4, 5-9/10 punti (tutto il resto). La risposta 1NT si allarga a 5-11 (semiforzante).",
        },
        {
          type: "bid-select",
          content:
            "Il compagno apre 1♠. Avete: ♠A974 ♥2 ♦AJ976 ♣943. Cosa rispondete?",
          options: ["2♠", "2NT (Truscott)", "3♠", "4♠"],
          correctAnswer: 1,
          explanation:
            "2NT Truscott! Fit quarto con una corta e carte di testa (A+A = 8 punti che si rivalutano). E un serio invito a manche nel nobile.",
        },
      ],
    },
    {
      id: "209-2",
      title: "La risposta 1NT semiforzante",
      duration: "5",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "1NT semiforzante dopo apertura nobile",
        },
        {
          type: "text",
          content:
            "L'ampliamento della risposta 1NT fino a 11 punti e inevitabile: il 2NT ora ha altro significato. L'apertore sa che il compagno potrebbe avere 11: con 5332 minima puo passare, con 13+ cerca di tenere aperta la dichiarazione.",
        },
        {
          type: "rule",
          content:
            "Dopo apertura 1♠ e risposta 1NT: con la 3-3 minore l'apertore dichiara la terza piu bassa (non la piu bella) per stanare la lunga del compagno. Con la 5332 di 17-19 rialza a 2NT. Con solo 12-13 e 5332, puo passare.",
        },
        {
          type: "example",
          content:
            "1♥-1NT: Ovest con ♠K2 ♥AJ1087 ♦KQ8 ♣J104 (14 punti, 3-3 minore) inventa 2♣ per trovare il miglior parziale. Est passa con ♠873 ♥92 ♦J54 ♣KQ972.",
        },
        {
          type: "true-false",
          content:
            "Su intervento avversario a colore dopo apertura nobile, il 2NT Truscott promette almeno QUATTRO carte di appoggio e diventa illimitato (11+).",
          correctAnswer: 0,
          explanation:
            "Vero! In competizione il 2NT Truscott richiede fit quarto (non terzo) e diventa illimitato. La surlicita, in alternativa, mostra fit TERZO ed e anch'essa illimitata (11+).",
        },
      ],
    },
  ],
};

// ===== LESSON 210: Mani di fit nel nobile - Bergen =====

const lezione210: Lesson = {
  id: 210,
  worldId: 22,
  title: "Mani di fit nel nobile: Bergen",
  subtitle: "Appoggi Bergen 3♣/3♦, 1NT forzante e 2NT Truscott",
  icon: "❤️",
  smazzateIds: ["cl-10b-1", "cl-10b-2", "cl-10b-3", "cl-10b-4"],
  modules: [
    {
      id: "210-1",
      title: "Appoggi Bergen e 1NT forzante",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "La convenzione Bergen: appoggi speciali per fit quarto",
        },
        {
          type: "text",
          content:
            "La convenzione Bergen attribuisce alle risposte di 3♣ e 3♦ significati speciali su apertura di 1♥ o 1♠: 3♣ = fit quarto, 7-9 punti (piu solida del barrage). 3♦ = fit quarto, 10-11 punti (vicina al FM, accetta parziale se apertore minimo).",
        },
        {
          type: "rule",
          content:
            "L'appoggio a livello 2 e costruttivo: 7/8-10 punti. Per mani piu deboli (4-7) o piu forti (10-11) con fit terzo, si usa 1NT forzante seguito dall'appoggio ritardato. Con 4-7: 1NT poi riporto a 2. Con 8-10: appoggio diretto a 2. Con 10-11: 1NT poi riporto a 3.",
        },
        {
          type: "example",
          content: "Su 1♥:",
          cards: "♠J2 ♥Q872 ♦KQ63 ♣985",
        },
        {
          type: "text",
          content:
            "♠J2 ♥Q872 ♦KQ63 ♣985: 3♣ (fit 4, 7-9). ♠K52 ♥AJ92 ♦73 ♣K875: 3♦ (fit 4, 10-11). ♠82 ♥A10862 ♦2 ♣J10543: 4♥ barrage (fit 5, 3-7). Il 2NT Truscott mostra tutte le mani 12+ con fit quarto o piu.",
        },
        {
          type: "bid-select",
          content:
            "Il compagno apre 1♠, voi avete: ♠QJ2 ♥AJ86 ♦32 ♣J852. Cosa rispondete?",
          options: ["2♠", "3♣ (Bergen)", "3♦ (Bergen)", "2NT (Truscott)"],
          correctAnswer: 1,
          explanation:
            "3♣ Bergen: fit quarto nel maggiore e punteggio 7-9 (qui avete 8 punti). E una mano un po' piu solida dell'appoggio barrage a 3♠.",
        },
      ],
    },
    {
      id: "210-2",
      title: "Il Senza forzante e il 2NT Truscott",
      duration: "5",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "1NT forzante e 2NT Truscott nella versione Bergen",
        },
        {
          type: "text",
          content:
            "Giocare il Senza forzante significa estendere il campo della risposta 1NT da 5-10 a 5-11/12 brutti. L'Apertore non puo mai passare (tranne con 5332 di 11). Se non ha un colore da dire, inventa il minore terzo piu basso.",
        },
        {
          type: "rule",
          content:
            "Su 2NT Truscott (12+, fit 4+), l'apertore risponde: colore nuovo = singolo/vuoto. 3 in atout = mano interessante senza corti. 4 in atout = mano peggiore (no singoli, minimo). 3NT = 5332 forte.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♠-3♣ (Bergen 7-9), l'apertore ha ♠AKQ82 ♥3 ♦A654 ♣K72. Cosa fa?",
          options: [
            "3♦ (Trial, invito a manche)",
            "3♠ (rifiuta l'invito)",
            "3♥ (cue bid, obiettivo slam)",
            "4♠",
          ],
          correctAnswer: 2,
          explanation:
            "3♥! Un colore al di sopra del 3♠ in atout rende obbligatoria la manche, quindi e cue bid per lo Slam. L'apertore ha una mano cosi forte da pensare allo slam anche a fronte di 7-9.",
        },
      ],
    },
  ],
};

// ===== LESSON 211: Mani di fit nel nobile - Costruttivi e NT forzante =====

const lezione211: Lesson = {
  id: 211,
  worldId: 23,
  title: "Mani di fit nel nobile: appoggi costruttivi",
  subtitle: "Appoggio costruttivo a 2, 1NT forzante e 2NT Truscott",
  icon: "❤️",
  smazzateIds: ["cl-10c-1", "cl-10c-2", "cl-10c-3", "cl-10c-4"],
  modules: [
    {
      id: "211-1",
      title: "Appoggio costruttivo e 2NT Truscott",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Versione con appoggi costruttivi e Senza forzante",
        },
        {
          type: "text",
          content:
            "In questa versione l'appoggio a livello 2 e 'costruttivo': 8-10 punti, tipicamente fit terzo. Non si usano i Bergen. Per le mani con fit quarto e invito (10-12) si usa il 2NT Truscott. Con fit terzo fuori range: 1NT forzante poi appoggio ritardato.",
        },
        {
          type: "rule",
          content:
            "Con fit terzo: 4-7 punti -> 1NT poi riporto a 2. 8-10 punti -> appoggio diretto a 2 (costruttivo). 10 belli-11 -> 1NT poi riporto a 3. Con fit quarto invitante (10-12): 2NT Truscott. Con fit quarto barrage (3-7): salto a 3 o 4.",
        },
        {
          type: "example",
          content:
            "Su 1♥: ♠Q984 ♥A83 ♦876 ♣Q83 -> 2♥ (costruttivo, fit 3, 8-10). ♠54 ♥Q1062 ♦KJ6 ♣A1043 -> 2NT Truscott (fit 4, invito). ♠854 ♥10862 ♦2 ♣KJ743 -> 3♥ barrage.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♠. Avete: ♠K94 ♥83 ♦A10965 ♣983 (7 punti onori con A+K da rivalutare, fit terzo). Cosa rispondete?",
          options: ["1NT (poi 2♠)", "2♠", "2NT", "Passo"],
          correctAnswer: 1,
          explanation:
            "2♠ costruttivo! A+K sono punti di testa che si rivalutano. Anche se l'onore-conteggio e 7, la qualita dei punti (due Assi/Re) giustifica l'appoggio costruttivo 8-10.",
        },
      ],
    },
  ],
};

// ===== LESSON 212: Interventi speciali e difese =====

const lezione212: Lesson = {
  id: 212,
  worldId: 23,
  title: "Interventi speciali e difese",
  subtitle: "Michael's, Ghestem e interventi su 1NT",
  icon: "⚔️",
  smazzateIds: ["cl-11-1", "cl-11-2", "cl-11-3", "cl-11-4"],
  modules: [
    {
      id: "212-1",
      title: "Michael's e Ghestem",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Interventi in bicolore: Michael's e Ghestem",
        },
        {
          type: "text",
          content:
            "Dopo apertura 1♥ o 1♠: Michael's: la surlicita mostra l'altro nobile + un minore sconosciuto (12+ punti, 5-5). 2NT mostra la bicolore minore. Dopo apertura 1♣ o 1♦: 2♦ mostra la bicolore nobile. 2NT mostra i due colori di rango piu basso tra i restanti.",
        },
        {
          type: "rule",
          content:
            "NON spacciate MAI per bicolori le mani 5-4 o 6-4! La quinta carta in entrambi i colori non deve mai mancare. Su 2NT il partner non passa mai: se ha fit, scegliera il seme a un livello consono alle Prese Totali.",
        },
        {
          type: "text",
          content:
            "Le Ghestem mostrano immediatamente entrambi i colori. Su 1♠: surlicita = ♥ + ♣, 2NT = minori, 3♣ = ♥ + ♦. Su 1♣: 2♦ = nobili, 2NT = ♦ + ♥, 3♣ a salto = ♦ + ♠.",
        },
        {
          type: "bid-select",
          content:
            "L'avversario apre 1♠. Avete: ♠8 ♥AK985 ♦76 ♣KQ1075. Con le Michael's, cosa dichiarate?",
          options: ["2♠ (surlicita)", "2NT", "3♣", "Contro"],
          correctAnswer: 0,
          explanation:
            "2♠ surlicita! Mostra l'altro nobile (♥) + un minore sconosciuto (♣ in questo caso). Se il compagno vuole conoscere il minore, chiedera 2NT.",
        },
      ],
    },
    {
      id: "212-2",
      title: "Interventi su 1NT e aperture speciali",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Intervenire sull'apertura di 1NT e su aperture speciali",
        },
        {
          type: "text",
          content:
            "Su 1NT il fattore principale e la distribuzione, non i punti. Si 'entra' solo con le seste o con le bicolori. Se avete bilanciata forte, passate: lasciate nelle grane l'avversario. Convenzioni: 2♣ (Landy) = 5/4+ nobile. 2♦ = cuori (transfer). 2♥ = picche. 2♠ = 4♠ + sesta minore. 2NT = minori.",
        },
        {
          type: "rule",
          content:
            "Su 2♦ Multicolor avversaria: il Contro immediato mostra 12+ punti e le CUORI. Passo seguito da Contro mostra le PICCHE. 2NT immediato = bicolore minore. 2NT ritardato = bilanciata 15+ con fermo.",
        },
        {
          type: "text",
          content:
            "Su sottoaperture 2♥/2♠ avversarie: Contro = 4/5 carte nell'altro nobile + tolleranza dei restanti (o mano molto forte). 2NT = bilanciata 16/17 con fermo (non i minori!). Intervento a colore = valori di apertura e 6+ carte.",
        },
        {
          type: "quiz",
          content:
            "L'avversario apre 2♥ (sottoapertura). Avete: ♠AJ97 ♥J8 ♦AQ84 ♣K65. Cosa dichiarate?",
          options: ["2♠", "Contro", "2NT", "Passo"],
          correctAnswer: 1,
          explanation:
            "Contro informativo! Mostra 4/5 carte nell'altro nobile (Picche) e tolleranza degli altri colori. Con 2NT mostrerete bilanciata 16/17; qui avete solo 14 ma ottima distribuzione per il Contro.",
        },
      ],
    },
  ],
};

// ===== LESSON 213: Casi particolari dopo le risposte 1 su 1 =====

const lezione213: Lesson = {
  id: 213,
  worldId: 23,
  title: "Casi particolari dopo le risposte 1 su 1",
  subtitle: "Rever a Senza, dichiarazioni libere e dopo il Contro",
  icon: "🧩",
  smazzateIds: ["cl-12-1", "cl-12-2", "cl-12-3", "cl-12-4"],
  modules: [
    {
      id: "213-1",
      title: "Il Rever a Senza",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Il Rever a Senza e le sue implicazioni",
        },
        {
          type: "text",
          content:
            "Il salto a 2NT dopo apertura maggiore e risposta 1NT (o 1 su 1) mostra bilanciata 5332 di 17-18. Il salto a 3NT mostra 19-20. Conseguenza: se apriamo 1NT con un nobile quinto, il punteggio e minimo (15-16).",
        },
        {
          type: "rule",
          content:
            "Dopo apertura di minore, per distinguere mani bilanciate da sbilanciate: il salto diretto a manche (es. 1♣-1♥-4♥) mostra sempre una SBILANCIATA. Con la bilanciata 18-20 e fit quarto, l'apertore salta a 3NT (che mostra fit!). Se salta a 2NT esclude fit quarto.",
        },
        {
          type: "example",
          content:
            "1♦-1♥-3NT: mostra fit quarto a cuori e bilanciata 18-20. Quindi 4♣ e 4♦ dopo sono cue bid per lo Slam a Cuori!",
          cards: "♠A98 ♥Q1073 ♦AKJ2 ♣KJ",
        },
        {
          type: "text",
          content:
            "Dopo 2NT, il 3♣ ha funzione 'tipo Stayman': 3♦ = non ho quarte maggiori. 3♥ = ho 3 cuori, non 4 picche. 3♠ = ho 4 picche, non 3 cuori. 3NT = non ho 4♠ ne 3♥. 2NT di Est = entrambe le nobili minimo.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♣-1♥-2NT, il 2NT esclude fit quarto a cuori. Se Nord ha ♠xx ♥K109xxx ♦xx ♣Jxx, cosa dichiara?",
          options: ["3♥ (a passare)", "3NT", "Passo", "4♥"],
          correctAnswer: 0,
          explanation:
            "3♥ a passare! Con carte con cui la manche pare del tutto improbabile, la ripetizione del colore e non forzante. L'apertore puo passare.",
        },
      ],
    },
    {
      id: "213-2",
      title: "Dichiarazioni libere dopo intervento",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Quando l'avversario interviene dopo 1 su 1",
        },
        {
          type: "text",
          content:
            "L'intervento avversario produce un effetto 'sponda': l'apertore e esentato da ogni obbligo. Se dichiara, e perche ha qualcosa di speciale. Dopo 1♦-P-1♥-1♠: l'appoggio immediato mostra fit quarto (2♥ normale, 3♥ piccolo Rever sbilanciato, 4♥ prese, 2♠ surlicita = il modo piu forte).",
        },
        {
          type: "rule",
          content:
            "1NT mostra bilanciata di Rever (18-20) con fermo (non serve saltare a 2NT). La ripetizione del colore mostra un ottimo sesto. Un colore nuovo mostra buona bicolore (5-5 o 5-4 concentrata). Il Contro mostra 16-20 non adatta a dichiarazione naturale.",
        },
        {
          type: "text",
          content:
            "Se l'apertore passa, il rispondente: colore nuovo = forzante un giro. Vecchio colore = limite/invitante. CONTRO = chiede all'apertore di descriversi (7/8+ punti). SURLICITA = mano da manche+ sbilanciata.",
        },
        {
          type: "bid-select",
          content:
            "Dopo 1♦-P-1♥-1♠-P-P, avete (Nord): ♠xxx ♥KJxxx ♦Axx ♣Jx. Cosa dichiarate?",
          options: ["2♥", "Contro", "1NT", "Passo"],
          correctAnswer: 1,
          explanation:
            "Contro di riapertura! Garantisce almeno 7/8 punti e chiede all'apertore di continuare a descriversi. L'apertore potra dire NT con bilanciata 12-14 e fermo, o ripetere il colore, o appoggiare le cuori.",
        },
        {
          type: "true-false",
          content:
            "Il Contro dell'apertore dopo intervento avversario garantisce sempre tolleranza del colore di risposta.",
          correctAnswer: 1,
          explanation:
            "Falso! Il Contro dell'apertore NON garantisce tolleranza del colore di risposta. Pero: tanto minore e la tolleranza, tanto maggiore e la forza della mano.",
        },
      ],
    },
  ],
};

// ===== WORLDS & EXPORT =====

import type { World } from "./lessons";

export const cuoriLicitaWorlds: World[] = [
  {
    id: 20,
    name: "Fondamenti Avanzati",
    subtitle: "Legge delle prese totali, valutazione e Texas",
    icon: "📐",
    gradient: "from-rose-500 to-red-500",
    iconBg: "bg-rose-100",
    lessons: [] as any,
  },
  {
    id: 21,
    name: "Sviluppi Dichiarativi",
    subtitle: "2/1, approccio allo Slam, Cue Bid e Weak Two",
    icon: "📈",
    gradient: "from-red-500 to-rose-600",
    iconBg: "bg-red-100",
    lessons: [] as any,
  },
  {
    id: 22,
    name: "Strategia e Convenzioni",
    subtitle: "2♣ forte, dichiarazioni competitive e costruttive",
    icon: "♟️",
    gradient: "from-rose-600 to-pink-600",
    iconBg: "bg-pink-100",
    lessons: [] as any,
  },
  {
    id: 23,
    name: "Interventi e Casi Speciali",
    subtitle: "Interventi particolari e situazioni dopo 1/1",
    icon: "⚡",
    gradient: "from-pink-600 to-red-700",
    iconBg: "bg-rose-200",
    lessons: [] as any,
  },
];

// Assign lessons to worlds
cuoriLicitaWorlds[0].lessons = [lezione200, lezione201, lezione202];
cuoriLicitaWorlds[1].lessons = [lezione203, lezione204, lezione205, lezione206];
cuoriLicitaWorlds[2].lessons = [lezione207, lezione208, lezione209, lezione210];
cuoriLicitaWorlds[3].lessons = [lezione211, lezione212, lezione213];

export const cuoriLicitaLessons: Lesson[] = cuoriLicitaWorlds.flatMap(w => w.lessons);
