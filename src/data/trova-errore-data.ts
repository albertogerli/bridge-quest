export interface ErrorScenario {
  id: number;
  category: "licita" | "gioco" | "difesa";
  difficulty: "facile" | "medio" | "difficile";
  situation: string;
  cards?: string;
  sequence?: string[];
  errorDescription: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const errorScenarios: ErrorScenario[] = [
  // ============================================================
  // FACILE (10) - Conteggio HCP, aperture base, errori di passo
  // ============================================================
  {
    id: 1,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud ha aperto 1NT con questa mano. Qual e' l'errore?",
    cards: "♠AJ72 ♥K95 ♦Q83 ♣J64",
    errorDescription: "Ha aperto 1NT con soli 11 HCP (servono 15-17)",
    options: [
      "Ha aperto 1NT con soli 11 HCP, troppo debole",
      "Doveva aprire 2NT",
      "Doveva aprire 1♠",
      "Non c'e' nessun errore",
    ],
    correctAnswer: 0,
    explanation:
      "La mano ha 11 HCP: ♠A+J = 5, ♥K = 3, ♦Q = 2, ♣J = 1. Totale 11. Per aprire 1NT servono 15-17 HCP bilanciati. Con 11 punti si deve passare (sotto i 12 richiesti per qualsiasi apertura).",
  },
  {
    id: 2,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud con questa mano ha passato. Qual e' l'errore?",
    cards: "♠AQ94 ♥KJ72 ♦A53 ♣86",
    errorDescription: "Ha passato con 14 HCP (doveva aprire)",
    options: [
      "Non c'e' errore, la mano e' troppo debole",
      "Ha passato con 14 HCP, doveva aprire",
      "Doveva aprire 1NT",
      "Doveva aprire 2♣",
    ],
    correctAnswer: 1,
    explanation:
      "La mano ha 14 HCP: ♠A+Q = 6, ♥K+J = 4, ♦A = 4. Totale 14. Con 12+ HCP si deve aprire. Con 4-4 nei nobili e distribuzione 4-4-3-2, si apre del nobile piu' basso di rango: 1♥ (regola FIGB: con due quarte nobili si apre 1♥).",
  },
  {
    id: 3,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud ha aperto 2NT con questa mano. Qual e' l'errore?",
    cards: "♠KQ7 ♥AJ4 ♦KJ53 ♣Q92",
    errorDescription: "Ha aperto 2NT con soli 16 HCP (servono 21-22)",
    options: [
      "La mano non e' bilanciata",
      "Ha aperto 2NT con soli 16 HCP, troppo debole",
      "Doveva aprire 1♦",
      "Doveva aprire 2♣",
    ],
    correctAnswer: 1,
    explanation:
      "La mano ha 16 HCP: ♠K+Q = 5, ♥A+J = 5, ♦K+J = 4, ♣Q = 2. Totale 16. Per aprire 2NT servono 21-22 HCP bilanciati. Con 15-17 bilanciata l'apertura corretta e' 1NT.",
  },
  {
    id: 4,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud ha aperto 1♠ con questa mano. Qual e' l'errore?",
    cards: "♠KJ84 ♥AQ73 ♦K95 ♣62",
    errorDescription: "Con 4-4 nei nobili doveva aprire 1♥, non 1♠",
    options: [
      "Non aveva punti sufficienti per aprire",
      "Doveva aprire 1NT",
      "Con 4-4 nei nobili doveva aprire 1♥, non 1♠",
      "Doveva aprire 1♦",
    ],
    correctAnswer: 2,
    explanation:
      "La mano ha 13 HCP: ♠K+J = 4, ♥A+Q = 6, ♦K = 3. Totale 13. Punti sufficienti per aprire, ma con 4 picche e 4 cuori (due quarte nobili) la regola FIGB e' chiara: si apre nel piu' basso di rango, cioe' 1♥. Questo permette al compagno di mostrare le picche a livello 1.",
  },
  {
    id: 5,
    category: "gioco",
    difficulty: "facile",
    situation:
      "Contratto 3NT. Al morto: ♦AKQ73. In mano: ♦J2. Il dichiarante gioca l'Asso dal morto, poi il Re, poi la Donna. Alla terza presa resta ♦73 al morto e niente in mano. Qual e' l'errore?",
    cards: "Morto: ♦AKQ73  Mano: ♦J2",
    errorDescription: "Ha giocato gli onori dal lato lungo senza prima il J dal lato corto",
    options: [
      "Ha giocato gli onori dal lato lungo: doveva iniziare col J dal lato corto",
      "Doveva fare l'impasse",
      "Doveva giocare le quadri dopo i fiori",
      "Non c'e' errore, ha incassato 3 prese",
    ],
    correctAnswer: 0,
    explanation:
      "Regola fondamentale: si giocano gli onori dal LATO CORTO per primo. Bisognava giocare il J dalla mano (lato corto con 2 carte), poi il 2 per A-K-Q del morto. Cosi' si fanno 5 prese in quadri senza bloccare il colore. Giocando AKQ dal morto, il J cade sotto un onore e le carte 7-3 restano irraggiungibili.",
  },
  {
    id: 6,
    category: "licita",
    difficulty: "facile",
    situation:
      "Nord apre 1NT (15-17). Sud risponde 2♣ Stayman con questa mano. Qual e' l'errore?",
    cards: "♠73 ♥J52 ♦Q864 ♣10953",
    errorDescription: "Usa Stayman senza un maggiore quarto e con soli 3 HCP",
    options: [
      "Doveva rispondere 2♦",
      "Usa Stayman senza avere un maggiore quarto e con soli 3 HCP",
      "Doveva rispondere 3NT",
      "La Stayman era corretta",
    ],
    correctAnswer: 1,
    explanation:
      "La Stayman (2♣) richiede almeno 8 HCP e almeno 4 carte in un colore nobile. Questa mano ha solo 3 HCP (♥J = 1, ♦Q = 2) e nessun maggiore quarto. Con mano cosi' debole senza fit nobile, l'unica risposta sensata e' Passo su 1NT.",
  },
  {
    id: 7,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud apre 1♣ con questa mano. Qual e' l'errore?",
    cards: "♠Q83 ♥A64 ♦KJ72 ♣K95",
    errorDescription: "Ha aperto 1♣ con 3 fiori avendo 4 quadri: doveva aprire 1♦",
    options: [
      "Doveva aprire 1♦ avendo 4 quadri e solo 3 fiori",
      "Doveva aprire 1NT",
      "Non aveva punti per aprire",
      "Doveva aprire 1♥",
    ],
    correctAnswer: 0,
    explanation:
      "La mano ha 13 HCP: ♠Q = 2, ♥A = 4, ♦K+J = 4, ♣K = 3. Totale 13. Con 4 quadri e 3 fiori, si apre del minore piu' lungo: 1♦. Si apre 1♣ solo con minori uguali (3-3 o 4-4). Nota: con distribuzione 3-3-4-3 e 13 HCP, non si puo' aprire 1NT (servono 15-17).",
  },
  {
    id: 8,
    category: "licita",
    difficulty: "facile",
    situation:
      "Nord apre 1♠. Est passa. Sud ha soli 4 HCP e risponde 1NT. Qual e' l'errore?",
    cards: "♠85 ♥J93 ♦Q762 ♣J854",
    errorDescription: "Ha risposto con soli 4 HCP, servono almeno 5 per rispondere",
    options: [
      "Doveva rispondere 2♣",
      "Non c'e' errore, 1NT e' corretto",
      "Ha risposto con soli 4 HCP, doveva passare",
      "Doveva appoggiare a 2♠",
    ],
    correctAnswer: 2,
    explanation:
      "Con soli 4 HCP (♥J = 1, ♦Q = 2, ♣J = 1) si deve dire Passo. Per rispondere al compagno che apre di 1 a colore servono almeno 5 HCP. Con meno di 5 la manche (25 HCP in coppia) e' irraggiungibile anche se l'apertore ha il massimo (20).",
  },
  {
    id: 9,
    category: "gioco",
    difficulty: "facile",
    situation:
      "Contratto 4♥. Il dichiarante ha 5 atout in mano (♥AKQ83) e 3 al morto (♥J74). Ha anche ♦AK974 al morto da incassare. Invece di battere le atout, gioca subito le quadri. Ovest taglia la terza quadri. Qual e' l'errore?",
    cards: "Mano: ♥AKQ83  Morto: ♥J74 + ♦AK974",
    errorDescription: "Non ha battuto le atout prima di incassare le vincenti laterali lunghe",
    options: [
      "Non c'e' errore, le quadri erano urgenti",
      "Non ha battuto le atout nemiche prima di incassare le quadri",
      "Doveva giocare a Senza Atout",
      "Doveva tagliare le quadri al morto",
    ],
    correctAnswer: 1,
    explanation:
      "Con vincenti lunghe da incassare in un colore laterale (♦AK974 al morto), la regola e': PRIMA battere le atout avversarie, POI incassare le vincenti. Se non si tolgono le atout nemiche, un avversario corto a quadri taglia le vostre vincenti. Con 8 atout in linea (5+3), bastano 2-3 giri per eliminare le atout avversarie.",
  },
  {
    id: 10,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud apre 2♣ forte con questa mano. Qual e' l'errore?",
    cards: "♠KQ85 ♥AJ3 ♦Q74 ♣K92",
    errorDescription: "Ha aperto 2♣ forte con soli 15 HCP (servono 22+)",
    options: [
      "Ha aperto 2♣ con soli 15 HCP, servono 22+",
      "Doveva aprire 2NT",
      "La mano non e' bilanciata",
      "Doveva aprire 2♠",
    ],
    correctAnswer: 0,
    explanation:
      "La mano ha 15 HCP: ♠K+Q = 5, ♥A+J = 5, ♦Q = 2, ♣K = 3. Totale 15. L'apertura 2♣ e' riservata a mani fortissime (22+ HCP o con enorme forza giocabile). Con 15-17 bilanciata l'apertura corretta e' 1NT.",
  },

  // ============================================================
  // MEDIO (12) - Risposte, Stayman/Transfer, fit, gioco intermedio
  // ============================================================
  {
    id: 11,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1♥. Sud risponde 2♥ con 10 HCP e 4 carte di appoggio. Nord rilancia con 3♥ (invito a manche). Sud passa. Qual e' l'errore?",
    cards: "♠K93 ♥QJ74 ♦A85 ♣862",
    sequence: ["1♥", "Passo", "2♥", "Passo", "3♥", "Passo", "Passo"],
    errorDescription: "Ha passato sull'invito con 10 HCP e 4 atout (massimo del 2♥)",
    options: [
      "Non doveva appoggiare a cuori",
      "Doveva rispondere 1NT",
      "Ha passato sull'invito: con 10 HCP e 4 atout doveva accettare e dire 4♥",
      "Doveva dire 3NT",
    ],
    correctAnswer: 2,
    explanation:
      "Con 10 HCP (♠K = 3, ♥Q+J = 3, ♦A = 4), 4 atout e un Asso laterale, Sud ha il massimo del suo rialzo a 2♥ (5-10 HCP). Quando l'apertore invita con 3♥ mostrando 16-17 HCP, il totale di coppia e' almeno 26-27: manche sicura. Con il minimo (5-7) si passa, con il massimo (8-10) si accetta e si dichiara 4♥.",
  },
  {
    id: 12,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1NT (15-17). Sud ha 12 HCP e mano bilanciata. Risponde 2NT (invito). Qual e' l'errore?",
    cards: "♠KJ5 ♥A93 ♦Q742 ♣Q86",
    sequence: ["1NT", "Passo", "2NT"],
    errorDescription: "Ha invitato con 12 HCP quando doveva dichiarare 3NT diretto",
    options: [
      "Doveva usare Stayman",
      "Non doveva rispondere",
      "Con 12 HCP doveva dichiarare direttamente 3NT, non invitare con 2NT",
      "Doveva fare un transfer",
    ],
    correctAnswer: 2,
    explanation:
      "Dopo 1NT (15-17), con 12 HCP (♠K+J = 4, ♥A = 4, ♦Q = 2, ♣Q = 2. Totale 12) il totale minimo in coppia e' 15+12 = 27, ampiamente sufficiente per 3NT (servono 25). La risposta 2NT e' un invito che mostra 8-9 HCP. Con 12 HCP bilanciata senza maggiore quarto, la risposta corretta e' 3NT diretta.",
  },
  {
    id: 13,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1NT (15-17). Sud risponde 2♦ (transfer per cuori) con questa mano. Nord completa con 2♥. Sud dichiara Passo. Qual e' l'errore?",
    cards: "♠A4 ♥KJ8753 ♦Q92 ♣63",
    sequence: ["1NT", "Passo", "2♦", "Passo", "2♥", "Passo", "Passo"],
    errorDescription: "Ha passato a 2♥ con 10 HCP e 6 cuori: doveva dichiarare manche",
    options: [
      "La transfer era sbagliata, doveva usare Stayman",
      "Ha passato con 10 HCP e 6 cuori: doveva dichiarare 4♥",
      "Doveva dire 3NT",
      "2♥ come parziale e' corretto",
    ],
    correctAnswer: 1,
    explanation:
      "La mano ha 10 HCP (♠A = 4, ♥K+J = 4, ♦Q = 2) e 6 carte di cuori. Il totale minimo in coppia e' 15+10 = 25, sufficiente per manche. Con 6+ cuori c'e' fit garantito (almeno 8 carte, dato che 1NT promette almeno 2 in ogni colore). Dopo il transfer 2♦-2♥, la continuazione corretta e' 4♥. Si passa il transfer solo con mano debole (0-7 HCP).",
  },
  {
    id: 14,
    category: "licita",
    difficulty: "medio",
    situation:
      "Est apre 1♠. Sud interviene 2♥ con questa mano. Qual e' l'errore?",
    cards: "♠J4 ♥KQ83 ♦A752 ♣J96",
    errorDescription: "Interviene a livello 2 con solo 4 cuori (servono 5+ carte)",
    options: [
      "Non ha abbastanza HCP per intervenire",
      "Interviene 2♥ con solo 4 carte di cuori: servono almeno 5",
      "Doveva dire 1NT",
      "L'intervento e' corretto",
    ],
    correctAnswer: 1,
    explanation:
      "Per un intervento a colore a livello 2 servono almeno 5 carte nel colore e un colore onorato. Con sole 4 cuori, 2♥ e' scorretto. Con 11 HCP (♠J = 1, ♥K+Q = 5, ♦A = 4, ♣J = 1) e tolleranza per i colori non dichiarati, la scelta migliore e' il Contro informativo.",
  },
  {
    id: 15,
    category: "gioco",
    difficulty: "medio",
    situation:
      "Contratto 3NT. Ovest attacca il 5♠. Al morto: ♠K82. In mano: ♠A94. Il dichiarante gioca il K♠ dal morto alla prima presa. Qual e' l'errore?",
    cards: "Morto: ♠K82  Mano: ♠A94",
    errorDescription: "Ha sprecato il K: doveva duccare per tagliare le comunicazioni",
    options: [
      "Ha sprecato il K: doveva giocare piccola dal morto (duck)",
      "Doveva vincere con l'Asso dalla mano",
      "Doveva rifiutare entrambe le mani",
      "Il K era la mossa giusta",
    ],
    correctAnswer: 0,
    explanation:
      "A Senza Atout, quando gli avversari attaccano il vostro punto debole, conviene spesso 'duccare' (lisciare): giocare piccola per rompere le comunicazioni tra i difensori. Se Ovest ha attaccato quarta migliore da ♠QJ1065, prendendo subito col K lasciate A-9 contro Q-J-10-6. Meglio giocare il 2 dal morto: se Est vince, poi Ovest rimane scollegato quando rientra in presa.",
  },
  {
    id: 16,
    category: "gioco",
    difficulty: "medio",
    situation:
      "Contratto 4♠. Il dichiarante vuole fare l'impasse al Re di quadri. Al morto: ♦AQ5. In mano: ♦743. Gioca la Donna dal morto come prima carta. Qual e' l'errore?",
    cards: "Morto: ♦AQ5  Mano: ♦743",
    errorDescription: "Ha giocato l'impasse dal lato sbagliato",
    options: [
      "Doveva giocare dalla MANO verso il morto (piccola per la Q)",
      "Doveva giocare l'Asso prima",
      "L'impasse non era necessaria",
      "La Donna dal morto era corretta",
    ],
    correctAnswer: 0,
    explanation:
      "L'impasse si fa giocando VERSO la forchetta (AQ), non DALLA forchetta. La manovra corretta: gioca il 3 dalla mano. Se Ovest (alla sinistra del morto) ha il Re, non puo' metterlo sopra la piccola senza sacrificarlo; voi inserite la Q e vince. Se giocate Q dal morto, Est copre col K e l'impasse fallisce sempre, qualunque sia la posizione del K.",
  },
  {
    id: 17,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1♥. Sud ha 16 HCP e 4 carte di cuori. Risponde direttamente 3♥. Qual e' l'errore?",
    cards: "♠A5 ♥KQ84 ♦AJ73 ♣Q62",
    sequence: ["1♥", "Passo", "3♥"],
    errorDescription: "Ha fatto un invito (10-11 HCP) con una mano da 16 HCP",
    options: [
      "3♥ e' corretto come invito",
      "Doveva rispondere 2♥",
      "Con 16 HCP e fit doveva dire un colore nuovo forzante, poi 4♥ o esplorare slam",
      "Doveva dire 3NT",
    ],
    correctAnswer: 2,
    explanation:
      "Con 16 HCP (♠A = 4, ♥K+Q = 5, ♦A+J = 5, ♣Q = 2) e 4 carte di appoggio, la coppia ha almeno 28 HCP. La risposta 3♥ e' un invito limitato a 10-11 HCP. Con 16 HCP si deve prima dichiarare un colore nuovo forzante (es. 2♦) per poi appoggiare o esplorare lo slam. Saltare direttamente a 3♥ sottovaluta gravemente la mano.",
  },
  {
    id: 18,
    category: "gioco",
    difficulty: "medio",
    situation:
      "Contratto 3NT. Il dichiarante ha bisogno di 4 prese dai fiori per fare il contratto. Al morto: ♣KQJ82. In mano: ♣73. Invece di giocare fiori, il dichiarante incassa A♠, A♥, A♦ (le vincenti laterali). Qual e' l'errore?",
    cards: "Morto: ♣KQJ82  Mano: ♣73",
    errorDescription: "Ha incassato le vincenti prima di sviluppare il colore lungo",
    options: [
      "Doveva sviluppare i fiori PRIMA di incassare le vincenti laterali",
      "Il colore fiori e' gia' sviluppato",
      "Doveva fare un'impasse a fiori",
      "L'ordine non conta a Senza Atout",
    ],
    correctAnswer: 0,
    explanation:
      "A Senza Atout, la regola fondamentale e': PRIMA sviluppa il colore che ti dara' le prese necessarie (fiori), POI incassa. Se incassi A♠, A♥, A♦ prima, butti via le entrate al morto. Quando poi giochi fiori e l'avversario prende con l'Asso, non hai piu' modo di raggiungere le fiori affrancate al morto. Bisogna cedere la presa a fiori subito, mantenendo le entrate.",
  },
  {
    id: 19,
    category: "difesa",
    difficulty: "medio",
    situation:
      "Sud gioca 4♠. Ovest ha ♠KQJ103 e attacca il 3♠. Qual e' l'errore nell'attacco?",
    cards: "Ovest: ♠KQJ103 ♥52 ♦A84 ♣J96",
    errorDescription: "Ha attaccato il 3 (cartina) invece del K dalla sequenza KQJ",
    options: [
      "Doveva attaccare con cuori",
      "Doveva attaccare il K♠ dalla sequenza KQJ",
      "Doveva attaccare con l'Asso di quadri",
      "Il 3♠ (quarta migliore) era corretto",
    ],
    correctAnswer: 1,
    explanation:
      "Con una sequenza di onori consecutivi (KQJ), si attacca con il piu' alto della sequenza: il K. Il K promette la Q e nega l'A. L'attacco della quarta migliore si usa per colori senza sequenza solida. Contro un contratto ad atout bastano due onori contigui per l'attacco dall'alto, e qui ce ne sono tre (KQJ).",
  },
  {
    id: 20,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1NT (15-17). Sud ha 10 HCP, 5 picche e risponde 2♠ naturale. Qual e' l'errore?",
    cards: "♠KQ973 ♥84 ♦A63 ♣J52",
    sequence: ["1NT", "Passo", "2♠"],
    errorDescription: "Ha detto 2♠ naturale, ma su 1NT la risposta 2♠ e' conclusiva e debole (0-7)",
    options: [
      "Con 10 HCP e 5 picche doveva usare il transfer (2♥) poi dichiarare 3NT o 4♠",
      "2♠ e' la risposta corretta",
      "Doveva dire Stayman 2♣",
      "Doveva passare",
    ],
    correctAnswer: 0,
    explanation:
      "Su apertura 1NT, la risposta 2♠ e' conclusiva e mostra mano debole (0-7 HCP) con 5+ picche: proposta di parziale. Con 10 HCP (♠K+Q = 5, ♦A = 4, ♣J = 1) e 5 picche, la coppia ha almeno 25 HCP. Il modo corretto e' il Transfer: dire 2♥ (transfer per picche), e dopo che Nord completa con 2♠, continuare con 3NT (offerta di giocare 3NT o 4♠) oppure direttamente 4♠.",
  },
  {
    id: 21,
    category: "difesa",
    difficulty: "medio",
    situation:
      "Compagno (Ovest) attacca il K♦ contro 3NT. Al morto c'e' ♦854. Est ha ♦A72. Il dichiarante gioca piccola. Est gioca il 2♦. Qual e' l'errore?",
    cards: "Est: ♦A72  Morto: ♦854  Attacco: K♦",
    errorDescription: "Ha giocato il 2 (sgradimento) invece di segnalare gradimento col 7",
    options: [
      "Doveva sormontare con l'Asso",
      "Doveva giocare il 7♦ (segnale di gradimento: ho l'Asso)",
      "Il 2♦ e' corretto",
      "Doveva giocare la carta piu' alta",
    ],
    correctAnswer: 1,
    explanation:
      "Quando il compagno attacca con un onore (K) e voi avete l'Asso, NON dovete sormontare (l'Asso sopra il K del compagno non serve: il K sta vincendo). Invece, dovete SEGNALARE gradimento con una carta alta: il 7 (dispari = gradimento nel sistema pari-dispari). Il 2 segnala sgradimento e il compagno potrebbe cambiare colore, perdendo tempo prezioso.",
  },
  {
    id: 22,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1♥. Est passa. Sud ha 6 HCP e 5 picche ma risponde Passo. Qual e' l'errore?",
    cards: "♠Q9742 ♥63 ♦K85 ♣J73",
    sequence: ["1♥", "Passo", "Passo"],
    errorDescription: "Ha passato con 6 HCP: doveva rispondere 1♠",
    options: [
      "Ha passato con 6 HCP: doveva dichiarare 1♠ (colore nuovo forzante)",
      "Il Passo era corretto con soli 6 punti",
      "Doveva appoggiare a 2♥",
      "Doveva dire 1NT",
    ],
    correctAnswer: 0,
    explanation:
      "Con 6 HCP (♠Q = 2, ♦K = 3, ♣J = 1) si DEVE rispondere al compagno che apre. La regola e' chiara: con 5+ HCP non si passa mai sull'apertura del compagno, perche' la coppia potrebbe avere 25 HCP (se l'apertore ha 19-20). Con 5 carte a picche, la risposta corretta e' 1♠ (colore nuovo a livello 1, forzante, promette 4+ carte e 5+ HCP).",
  },

  // ============================================================
  // DIFFICILE (10) - Slam, cue bid, difesa avanzata, segnali, gioco complesso
  // ============================================================
  {
    id: 23,
    category: "licita",
    difficulty: "difficile",
    situation:
      "La sequenza e': 1♠-Passo-2♣-Passo-2♠-Passo-4♠. Il rispondente ha 17 HCP e fit. Ha chiuso a 4♠ senza esplorare lo slam. Qual e' l'errore?",
    cards: "♠KQ4 ♥A5 ♦K83 ♣AJ972",
    sequence: ["1♠", "Passo", "2♣", "Passo", "2♠", "Passo", "4♠"],
    errorDescription: "Ha chiuso a manche con 17 HCP senza esplorare lo slam",
    options: [
      "4♠ e' la dichiarazione giusta",
      "Con 17 HCP e fit doveva esplorare lo slam con 3♠ (forzante) o cue bid",
      "Doveva dire 3NT",
      "Doveva ripetere 3♣",
    ],
    correctAnswer: 1,
    explanation:
      "Con 17 HCP (♠K+Q = 5, ♥A = 4, ♦K = 3, ♣A+J = 5), fit a picche e un buon colore di fiori, lo slam e' possibile. Dopo la risposta 2♣ (forzante a manche, 12+ HCP), la coppia ha almeno 29 HCP. Chiudere a 4♠ tronca il dialogo. Meglio dichiarare 3♠ (forzante, mostra fit e interesse slam) per permettere cue bid e richiesta d'Assi.",
  },
  {
    id: 24,
    category: "licita",
    difficulty: "difficile",
    situation:
      "Sequenza: 1♥-Passo-2♦-Passo-2NT. L'apertore ha ribattuto 2NT dopo una risposta 2 su 1. Qual e' l'errore dell'apertore?",
    cards: "Apertore: ♠84 ♥AKJ75 ♦Q3 ♣AQ62",
    sequence: ["1♥", "Passo", "2♦", "Passo", "2NT"],
    errorDescription: "Ha detto 2NT (12-14 bilanciata) con 16 HCP e mano sbilanciata 5-4",
    options: [
      "2NT era corretto",
      "Ha detto 2NT (12-14, fermi) con 16 HCP sbilanciata: doveva dire 3♣ (colore nuovo, rever)",
      "Doveva ripetere 2♥",
      "Doveva dire 3NT",
    ],
    correctAnswer: 1,
    explanation:
      "La mano ha 16 HCP (♥A+K+J = 8, ♦Q = 2, ♣A+Q = 6) con distribuzione 2-5-2-4. Nella sequenza 2 su 1 (forzante a manche), la replica 2NT mostra bilanciata 12-14 con fermi. Con 16 HCP e un bicolore cuori-fiori, la replica corretta e' 3♣: colore nuovo a livello 3, che nell'ambito della 2 su 1 mostra una mano buona (15+) o distribuzione 5-5/5-4.",
  },
  {
    id: 25,
    category: "difesa",
    difficulty: "difficile",
    situation:
      "Sud gioca 3NT. Ovest attacca il 5♥. Al morto ♥K63. Est ha ♥AJ92. Il morto gioca il 3. Est vince col J♥. Qual e' l'errore?",
    cards: "Est: ♥AJ92  Morto: ♥K63  Attacco: 5♥",
    errorDescription: "Ha finessato col J invece di vincere con l'Asso",
    options: [
      "Il J era la giocata corretta",
      "Doveva vincere con l'Asso: terza mano gioca alto",
      "Doveva giocare il 2",
      "Doveva giocare il 9",
    ],
    correctAnswer: 1,
    explanation:
      "La regola del 'terzo di mano gioca alto' e' fondamentale: con A e J, quando il morto gioca piccola (3), Est deve vincere con l'ASSO. Finessando col J si rischia che il dichiarante vinca gratuitamente col Q (che potrebbe avere). Dopo aver preso con l'A, Est ritorna il J: ora il K del morto e' intrappolato tra l'A (gia' giocato) e il resto della forchetta di Ovest.",
  },
  {
    id: 26,
    category: "gioco",
    difficulty: "difficile",
    situation:
      "Contratto 4♠. Mano: ♠AKQJ5 ♣K83. Morto: ♠974 ♣62. Il dichiarante ha 2 perdenti a fiori. Prima di tagliare, batte 3 giri di atout. Al morto non restano piu' atout. Qual e' l'errore?",
    cards: "Mano: ♠AKQJ5 ♣K83  Morto: ♠974 ♣62",
    errorDescription: "Ha tolto tutte le atout del morto che servivano per tagliare",
    options: [
      "Doveva battere solo 2 giri e poi tagliare le fiori al morto",
      "Corretto battere tutte le atout prima",
      "Le fiori non erano un problema",
      "Doveva scartare le fiori sulle quadri",
    ],
    correctAnswer: 0,
    explanation:
      "Quando il piano prevede di tagliare perdenti dalla 'parte corta' (il morto con 3 atout e doubleton fiori), NON si devono battere tutte le atout prima. Con gli avversari che hanno 5 atout divise probabilmente 3-2, bastano 2 giri per toglierne 4. Poi si gioca fiori: K, piccola (cedendo), e si taglia la terza al morto con l'atout rimasta. Se si battono 3 giri, il morto non ha piu' atout per tagliare.",
  },
  {
    id: 27,
    category: "difesa",
    difficulty: "difficile",
    situation:
      "Sud gioca 4♥. Ovest ha ♣AK84. Incassa A♣. Est gioca il 2♣. Ovest continua con K♣. Qual e' l'errore?",
    cards: "Ovest: ♣AK84  (Est gioca: 2♣ sull'Asso)",
    errorDescription: "Ha continuato fiori ignorando il segnale di sgradimento del compagno",
    options: [
      "Il 2♣ di Est segnala gradimento",
      "Doveva continuare con il 4♣",
      "Il 2♣ e' sgradimento: doveva cambiare colore",
      "Doveva giocare atout",
    ],
    correctAnswer: 2,
    explanation:
      "Nel sistema italiano pari-dispari, il 2♣ (carta pari) e' un segnale di SGRADIMENTO: Est non vuole la continuazione di fiori. Probabilmente non ha la Q♣ e non ha un doubleton per tagliare. Ovest deve rispettare il segnale e cambiare colore, cercando il punto di entrata del compagno in un altro seme per poi tornare a fiori per il taglio, oppure sviluppare un altro colore.",
  },
  {
    id: 28,
    category: "licita",
    difficulty: "difficile",
    situation:
      "Sequenza: 1♣-Passo-1♥-1♠-? L'apertore con 17 HCP e fit quarto a cuori dichiara Passo. Qual e' l'errore?",
    cards: "♠7 ♥AQ84 ♦K95 ♣AKJ73",
    sequence: ["1♣", "Passo", "1♥", "1♠", "Passo"],
    errorDescription: "Ha passato con 17 HCP e fit quarto a cuori: doveva appoggiare o rever",
    options: [
      "Il Passo era corretto dopo l'intervento",
      "Con 17 HCP e 4 cuori doveva appoggiare a cuori o dichiarare un rever",
      "Doveva dire 1NT",
      "Doveva dire 2♣",
    ],
    correctAnswer: 1,
    explanation:
      "Con 17 HCP (♥A+Q = 6, ♦K = 3, ♣A+K+J = 8) e 4 carte di cuori (fit quarto col rispondente), passare e' un errore grave. Dopo l'intervento del quarto di mano, l'apertore con mano di rovescio (16-20) e fit deve dichiarare. Puo' appoggiare a 2♥ o 3♥ (piccolo rever), oppure surlicitare 2♠ con mano forte. Il Passo e' giustificato solo con mani normali bilanciate di 12-14.",
  },
  {
    id: 29,
    category: "gioco",
    difficulty: "difficile",
    situation:
      "Contratto 3NT. Il dichiarante ha 7 vincenti e deve trovarne 2. Al morto: ♣A96543. In mano: ♣K2. Gioca A♣, K♣, poi il terzo giro. Fiori sono 4-2 e non si affrancano al terzo giro. Qual e' l'errore?",
    cards: "Morto: ♣A96543  Mano: ♣K2",
    errorDescription: "Non ha fatto il colpo in bianco per conservare la comunicazione",
    options: [
      "Doveva fare il 'colpo in bianco' (duck): cedere il primo giro di fiori",
      "A e K erano il modo giusto di giocare",
      "Doveva fare l'impasse a fiori",
      "Le fiori erano irraggiungibili comunque",
    ],
    correctAnswer: 0,
    explanation:
      "Con ♣A96543 al morto e ♣K2 in mano, il lato corto ha solo 2 carte. Giocando A e K si usano entrambe le carte della mano. Se fiori sono 4-2, al terzo giro non si hanno piu' carte dalla mano per raggiungere il morto. La tecnica del 'colpo in bianco' (duck): giocare il 2 dalla mano e piccola dal morto, cedendo la prima presa. Poi K dalla mano per l'A del morto e le fiori restanti sono franche e raggiungibili.",
  },
  {
    id: 30,
    category: "licita",
    difficulty: "difficile",
    situation:
      "Sequenza: 2♠*-3♠. L'apertura 2♠ e' una sottoapertura (6 carte, 6-10 HCP). Il rispondente con 12 HCP e fit terzo rialza a 3♠ pensando di invitare. Qual e' l'errore?",
    cards: "♠K84 ♥AQ5 ♦K973 ♣962",
    sequence: ["2♠", "Passo", "3♠"],
    errorDescription: "3♠ su sottoapertura e' competitivo/decisionale, non invitante",
    options: [
      "3♠ e' un corretto invito a manche",
      "3♠ su sottoapertura e' decisionale (9 atout = 9 prese), non invito: doveva usare 2NT (Ogust)",
      "Doveva dire 4♠ direttamente",
      "Doveva passare",
    ],
    correctAnswer: 1,
    explanation:
      "Dopo una sottoapertura 2♠, il rialzo a 3♠ e' DECISIONALE (basato sulla Legge delle Prese Totali: 9 atout = 9 prese), NON un invito a manche. L'apertore della sottoapertura passa sempre su 3♠. Con 12 HCP (♠K = 3, ♥A+Q = 6, ♦K = 3) e interesse per la manche, il modo corretto di indagare e' la risposta convenzionale 2NT (Ogust), che chiede all'apertore di descrivere il suo punteggio e la qualita' del colore.",
  },
  {
    id: 31,
    category: "difesa",
    difficulty: "difficile",
    situation:
      "Sud gioca 4♠. Ovest ha ♠A874 e vede al morto ♠KQJ109 senza entrate laterali. Il dichiarante gioca il K♠ dal morto. Ovest non prende con l'Asso. Qual e' l'errore?",
    cards: "Ovest: ♠A874  Morto: ♠KQJ109 (nessun'altra entrata)",
    errorDescription: "Non ha preso l'Asso subito per tagliare le comunicazioni col morto",
    options: [
      "Corretto il duck, per consumare gli onori",
      "Doveva prendere l'Asso SUBITO per impedire 5 prese di picche al morto",
      "Doveva giocare piccola per sempre",
      "Non importa quando prende l'Asso",
    ],
    correctAnswer: 1,
    explanation:
      "Al morto ci sono 5 picche (KQJT9) ma nessuna entrata laterale. Se Ovest ducka l'Asso, il dichiarante continua picche dal morto finche' l'Asso non viene preso, e intanto sviluppa le sue prese. Se Ovest prende l'Asso SUBITO alla prima presa, il dichiarante non ha piu' piccole picche dalla mano per tornare al morto (se ha solo 2-3 picche), tagliando cosi' la comunicazione con le picche franche.",
  },
  {
    id: 32,
    category: "gioco",
    difficulty: "difficile",
    situation:
      "Contratto 6♥. Le atout sono ♥AKQ93 in mano e ♥J74 al morto. Il dichiarante gioca A♥, K♥, Q♥, J♥ (4 giri). Le atout avversarie erano 3-2 e sono cadute dopo 3 giri. Qual e' l'errore?",
    cards: "Mano: ♥AKQ93  Morto: ♥J74",
    errorDescription: "Ha giocato un giro di atout di troppo, sprecando un tempo prezioso",
    options: [
      "Doveva giocare solo 2 giri",
      "Ha giocato 4 giri di atout: bastavano 3 (gli avversari avevano 5 atout divise 3-2)",
      "Doveva fare l'impasse al J",
      "Non c'e' errore, meglio essere sicuri",
    ],
    correctAnswer: 1,
    explanation:
      "Con 8 atout in linea (5+3), gli avversari ne hanno 5. Con divisione 3-2 (68% di probabilita'), dopo 3 giri tutte le atout avversarie sono cadute. Il quarto giro e' uno spreco di tempo: consuma un'atout vostra che poteva servire per tagliare o controllare un colore. In uno slam, ogni tempo e' prezioso. Bisogna CONTARE le atout avversarie: dopo A, K, Q ne avete viste 5 nemiche? Allora basta.",
  },
];
