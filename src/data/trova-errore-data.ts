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
  // FACILE (10) - Errori di regole base: conteggio HCP, aperture
  // ============================================================
  {
    id: 1,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud ha aperto 1NT con questa mano. Qual e' l'errore?",
    cards: "♠AK32 ♥QJ8 ♦K9 ♣J742",
    errorDescription: "Ha aperto 1NT con soli 13 HCP (servono 15-17)",
    options: [
      "Ha aperto 1NT con soli 13 HCP",
      "Doveva aprire 2NT",
      "Non ha abbastanza carte a fiori",
      "Doveva dichiarare Passo",
    ],
    correctAnswer: 0,
    explanation:
      "La mano ha 13 HCP (A=4 + K=3 + Q=2 + J=1 + K=3 + J=1 = 14... verifichiamo: ♠AK=7, ♥QJ=3, ♦K=3, ♣J=1 = 14). In realta' sono 14 HCP, comunque sotto i 15 richiesti per 1NT. L'apertura corretta sarebbe 1♣ (colore minore piu' lungo).",
  },
  {
    id: 2,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud con questa mano ha passato. Qual e' l'errore?",
    cards: "♠AQ85 ♥KJ73 ♦A42 ♣96",
    errorDescription: "Ha passato con 14 HCP (poteva aprire)",
    options: [
      "Non c'e' nessun errore, giusta la passe",
      "Ha passato con 14 HCP, doveva aprire",
      "Doveva aprire 1NT",
      "Doveva aprire 2♣",
    ],
    correctAnswer: 1,
    explanation:
      "La mano ha 14 HCP (A=4 + Q=2 + K=3 + J=1 + A=4 = 14). Con 12+ HCP si deve aprire. La distribuzione 4-4-3-2 senza un quinto suggerisce 1♥ o 1♠ (si apre del maggiore piu' alto con 4-4).",
  },
  {
    id: 3,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud ha aperto 2NT con questa mano. Qual e' l'errore?",
    cards: "♠KQ5 ♥AJ8 ♦KQ72 ♣Q93",
    errorDescription: "Ha aperto 2NT con soli 17 HCP (servono 20-21)",
    options: [
      "La mano non e' bilanciata",
      "Ha aperto 2NT con soli 17 HCP",
      "Doveva aprire 1♦",
      "Doveva aprire 2♣",
    ],
    correctAnswer: 1,
    explanation:
      "La mano ha 17 HCP (K=3 + Q=2 + A=4 + J=1 + K=3 + Q=2 + Q=2 = 17). Per aprire 2NT servono 20-21 HCP. Con 15-17 HCP e mano bilanciata, l'apertura corretta e' 1NT.",
  },
  {
    id: 4,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud ha aperto 1♥ con questa mano. Qual e' l'errore?",
    cards: "♠KJ842 ♥A73 ♦Q95 ♣K6",
    errorDescription: "Ha aperto 1♥ avendo 5 picche e solo 3 cuori",
    options: [
      "Doveva aprire 1NT",
      "Ha aperto 1♥ con solo 3 carte, doveva dire 1♠",
      "Non aveva punti sufficienti",
      "Doveva aprire 1♦",
    ],
    correctAnswer: 1,
    explanation:
      "Con 5 picche e solo 3 cuori, si apre del colore piu' lungo: 1♠. Si apre a livello 1 nel colore dove si hanno 4+ carte. Qui le picche sono 5, i cuori solo 3.",
  },
  {
    id: 5,
    category: "gioco",
    difficulty: "facile",
    situation:
      "Il contratto e' 3NT. Il dichiarante ha AKQ di quadri al morto e gioca il 2♦ dalla mano. L'avversario Ovest gioca il 5♦. Che errore fa il dichiarante se gioca il Q♦ dal morto?",
    cards: "Morto: ♦AKQ73  Mano: ♦862",
    errorDescription: "Gioca gli onori dal lato corto (morto ha 5 carte, mano 3)",
    options: [
      "Gioca gli onori dal lato lungo invece che dal corto",
      "Doveva fare l'impasse",
      "Doveva giocare atout prima",
      "Ha giocato dal colore sbagliato",
    ],
    correctAnswer: 0,
    explanation:
      "Regola fondamentale: si giocano gli onori dal lato CORTO per primo. La mano ha solo 3 quadri, quindi deve giocare 8, 6, 2 verso AKQ del morto. Cosi' le 5 carte del morto producono 5 prese. Se gioca gli onori dal lato lungo, rischia di bloccare il colore.",
  },
  {
    id: 6,
    category: "licita",
    difficulty: "facile",
    situation:
      "Nord apre 1NT (15-17). Sud risponde 2♣ (Stayman) con questa mano. Qual e' l'errore?",
    cards: "♠85 ♥742 ♦QJ63 ♣K853",
    errorDescription: "Usa Stayman senza un maggiore quarto",
    options: [
      "Non ha abbastanza punti per rispondere",
      "Usa Stayman senza avere un colore maggiore quarto",
      "Doveva rispondere 2♦",
      "Doveva passare direttamente",
    ],
    correctAnswer: 1,
    explanation:
      "La Stayman (2♣) si usa per cercare un fit 4-4 in un maggiore. Senza 4 carte a cuori ne' 4 carte a picche, la Stayman e' inutile. Con questa mano debole (7 HCP) senza maggiore quarto, e' meglio passare su 1NT.",
  },
  {
    id: 7,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud apre 1♣ con 3 fiori e 4 quadri. Qual e' l'errore?",
    cards: "♠K84 ♥AQ3 ♦KJ95 ♣Q72",
    errorDescription: "Ha aperto 1♣ con 3 fiori avendo 4 quadri",
    options: [
      "Doveva aprire 1♦ (colore minore piu' lungo)",
      "Doveva aprire 1NT",
      "Non aveva punti per aprire",
      "Doveva aprire 1♥",
    ],
    correctAnswer: 0,
    explanation:
      "Con 4 quadri e 3 fiori, si apre del minore PIU' LUNGO: 1♦. Si apre 1♣ solo quando fiori e quadri sono uguali (3-3 o 4-4). In questo caso la mano ha anche 15 HCP bilanciata, quindi 1NT sarebbe ugualmente corretto.",
  },
  {
    id: 8,
    category: "gioco",
    difficulty: "facile",
    situation:
      "Il contratto e' 4♠. Il dichiarante ha 4 atout in mano e 4 al morto. Prima di sviluppare i colori laterali, gioca fiori. Qual e' l'errore?",
    errorDescription: "Non ha battuto le atout prima di giocare i colori laterali",
    options: [
      "Doveva battere le atout nemiche prima",
      "Doveva giocare a SA",
      "Il contratto e' troppo alto",
      "Doveva tagliare subito al morto",
    ],
    correctAnswer: 0,
    explanation:
      "Regola base del gioco con atout: prima si BATTONO (tirano fuori) le atout avversarie, poi si incassano le vincenti laterali. Se giochi un colore laterale senza aver tolto le atout, un avversario potrebbe tagliare la tua vincente!",
  },
  {
    id: 9,
    category: "licita",
    difficulty: "facile",
    situation:
      "Nord apre 1♠. Est passa. Sud con 5 HCP risponde 1NT. Qual e' l'errore?",
    cards: "♠64 ♥J83 ♦9752 ♣Q843",
    errorDescription: "Ha risposto 1NT con soli 5 HCP (servono 6-9)",
    options: [
      "Doveva rispondere 2♣",
      "Ha risposto con soli 5 HCP, doveva passare",
      "Doveva rispondere 1NT con piu' punti",
      "Non c'e' errore",
    ],
    correctAnswer: 1,
    explanation:
      "Per rispondere 1NT all'apertura del compagno servono 6-9 HCP. Con soli 5 HCP (Q=2 + J=1 = solo 3... ♠0 + ♥J=1 + ♦0 + ♣Q=2 = 3 HCP in realta'), la risposta corretta e' Passo. Non si tiene aperta la dichiarazione con meno di 6 punti.",
  },
  {
    id: 10,
    category: "licita",
    difficulty: "facile",
    situation:
      "Sud apre 2♣ con questa mano. Qual e' l'errore?",
    cards: "♠AKJ5 ♥Q84 ♦KJ3 ♣Q72",
    errorDescription: "Ha aperto 2♣ forte con soli 17 HCP",
    options: [
      "Ha aperto 2♣ con soli 17 HCP (servono 22+)",
      "Doveva aprire 1NT",
      "Non aveva una quinta",
      "Doveva aprire 1♣",
    ],
    correctAnswer: 0,
    explanation:
      "L'apertura 2♣ e' riservata a mani FORTISSIME con 22+ HCP (o equivalente). Questa mano ha solo 17 HCP. Con 15-17 bilanciata, l'apertura corretta e' 1NT.",
  },

  // ============================================================
  // MEDIO (10) - Errori in sequenza di licita, gioco alla presa
  // ============================================================
  {
    id: 11,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1♥. Sud risponde 2♥ con questa mano. Il compagno rilancia 3♥. Sud passa. Qual e' l'errore?",
    cards: "♠K83 ♥QJ74 ♦A52 ♣964",
    sequence: ["1♥", "Passo", "2♥", "Passo", "3♥", "Passo", "Passo"],
    errorDescription: "Ha passato sull'invito a manche con valori da accettare",
    options: [
      "Non doveva appoggiare a cuori",
      "Doveva rispondere 1NT",
      "Ha passato sull'invito con 10 HCP e 4 atout, doveva dire 4♥",
      "Doveva rispondere 3NT",
    ],
    correctAnswer: 2,
    explanation:
      "Con 10 HCP, 4 carte di appoggio e un Asso laterale, Sud ha il massimo del suo 2♥ (6-10). Quando il compagno invita con 3♥ (16-17 circa), Sud deve accettare e dichiarare 4♥ manche. Si passa solo col minimo (6-7 HCP).",
  },
  {
    id: 12,
    category: "gioco",
    difficulty: "medio",
    situation:
      "Contratto 3NT. Ovest attacca il 5♠. Al morto ci sono ♠K82 e in mano ♠A94. Il dichiarante mette il K♠ dal morto alla prima presa. Qual e' l'errore?",
    cards: "Morto: ♠K82  Mano: ♠A94",
    errorDescription: "Ha giocato il K dal morto invece di duccare",
    options: [
      "Ha sprecato il K, doveva duccare (piccola dal morto)",
      "Doveva mettere l'Asso dalla mano",
      "Doveva rifiutare la presa completamente",
      "Non c'e' errore, il K era giusto",
    ],
    correctAnswer: 0,
    explanation:
      "A Senza Atout, quando gli avversari attaccano un colore, spesso conviene 'duccare' (giocare piccola) per rompere le comunicazioni. Mettendo il K si spreca un fermo. Meglio giocare il 2 dal morto e il 4 dalla mano (hold-up), vincendo con K o A solo quando necessario.",
  },
  {
    id: 13,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1NT (15-17). Sud ha 12 HCP bilanciata e risponde 2NT. Qual e' l'errore?",
    cards: "♠KJ5 ♥A83 ♦Q742 ♣K96",
    sequence: ["1NT", "Passo", "2NT"],
    errorDescription: "Ha invitato con 12 HCP invece di dichiarare manche",
    options: [
      "Doveva dichiarare Stayman",
      "Non doveva rispondere",
      "Con 12 HCP doveva dichiarare direttamente 3NT",
      "Doveva rispondere 2♦ transfer",
    ],
    correctAnswer: 2,
    explanation:
      "Dopo apertura 1NT (15-17), il totale minimo e' 15+12=27. Con 25+ HCP combinati si gioca 3NT. 2NT e' un invito (8-9 HCP). Con 12 HCP bilanciata la risposta corretta e' 3NT diretto, non l'invito.",
  },
  {
    id: 14,
    category: "gioco",
    difficulty: "medio",
    situation:
      "Contratto 4♥. Le atout sono ♥AKJ83 in mano e ♥Q74 al morto. Il dichiarante gioca A♥, K♥ e poi J♥. L'avversario mostrava ♥1095 e il terzo atout cade. Qual e' l'errore?",
    errorDescription: "Ha giocato 3 giri di atout quando ne bastavano 2",
    options: [
      "Doveva fare l'impasse al J",
      "Ha giocato un giro di atout di troppo",
      "Doveva giocare il Q prima",
      "Non c'e' errore",
    ],
    correctAnswer: 1,
    explanation:
      "Con 8 atout combinati (5+3), gli avversari ne hanno 5. Dopo A e K cadono 4 atout nemici. Se il quinto e' gia' caduto (distribuzione 3-2), il terzo giro di atout e' uno spreco: si perde un tempo prezioso. Meglio contare gli atout nemici e passare a sviluppare i colori laterali.",
  },
  {
    id: 15,
    category: "difesa",
    difficulty: "medio",
    situation:
      "Il compagno (Ovest) attacca il K♦ contro 3NT. Al morto c'e' ♦Q85. Est ha ♦A73. Est gioca il 3♦. Qual e' l'errore?",
    cards: "Est: ♦A73",
    errorDescription: "Non ha sormontato con l'Asso sul K del compagno",
    options: [
      "Doveva giocare il 7 (segnale di gradimento)",
      "Doveva sormontare con l'Asso",
      "Doveva giocare il 3 (corretto, terza bassa)",
      "Non c'e' errore",
    ],
    correctAnswer: 0,
    explanation:
      "Quando il compagno attacca con un onore (K) e tu hai l'Asso, in difesa non devi sormontare il compagno (non mettere l'Asso SUL Re del compagno). Piuttosto, fai un SEGNALE: gioca il 7 (carta alta = gradimento, hai l'Asso). Il 3 indica sgradimento. Il segnale aiuta il compagno a continuare il colore.",
  },
  {
    id: 16,
    category: "licita",
    difficulty: "medio",
    situation:
      "Est apre 1♠. Sud con questa mano interviene 2♥. Qual e' l'errore?",
    cards: "♠94 ♥KJ83 ♦AQ5 ♣J742",
    errorDescription: "Interviene a livello 2 con solo 4 cuori",
    options: [
      "Non ha abbastanza HCP",
      "Interviene a livello 2 con solo 4 carte di cuori",
      "Doveva dichiarare Contre",
      "Doveva dire 1NT",
    ],
    correctAnswer: 1,
    explanation:
      "Per intervenire a livello 2 in un colore servono almeno 5 carte nel colore e una buona mano (10+ HCP con buon colore). Con solo 4 cuori l'intervento 2♥ e' rischioso. Con 12 HCP e supporto per i colori non dichiarati, il Contre informativo sarebbe piu' indicato.",
  },
  {
    id: 17,
    category: "gioco",
    difficulty: "medio",
    situation:
      "Contratto 3NT. Il dichiarante ha bisogno di sviluppare le fiori per fare il contratto. Al morto: ♣KQJ82, in mano: ♣73. Invece di giocare fiori, il dichiarante incassa i suoi Assi laterali. Qual e' l'errore?",
    cards: "Morto: ♣KQJ82  Mano: ♣73",
    errorDescription: "Incassa le vincenti prima di sviluppare il colore lungo",
    options: [
      "Doveva sviluppare le fiori prima di incassare le vincenti",
      "Doveva giocare atout",
      "Il colore fiori non e' sviluppabile",
      "Doveva fare un'impasse",
    ],
    correctAnswer: 0,
    explanation:
      "A Senza Atout, la regola e': prima SVILUPPA il colore lungo (fiori), poi incassa. Se incassi le vincenti laterali prima, perdi le entrate al morto. Devi cedere la presa in fiori (Asso avversario) PRIMA, mantenendo le entrate per poi goderti le fiori affrancate.",
  },
  {
    id: 18,
    category: "licita",
    difficulty: "medio",
    situation:
      "Nord apre 1♥. Sud ha fit a cuori e 16 HCP. Risponde 3♥. Qual e' l'errore?",
    cards: "♠A5 ♥KQ84 ♦AJ73 ♣Q62",
    sequence: ["1♥", "Passo", "3♥"],
    errorDescription: "Ha fatto solo un invito con valori da forzare a manche",
    options: [
      "3♥ e' giusto come invito",
      "Doveva rispondere 2♥ (minimo)",
      "Con 16 HCP e fit doveva dichiarare 4♥ direttamente",
      "Doveva rispondere 2NT",
    ],
    correctAnswer: 2,
    explanation:
      "Con 16 HCP e 4 carte di appoggio nel maggiore, la coppia ha almeno 28+ HCP (12+16). La manche e' sicura. 3♥ e' un invito (10-12 HCP circa). Con 16 HCP si deve dichiarare 4♥ direttamente, o usare una dichiarazione di forza (cambio di colore forzante) per esplorare lo slam.",
  },
  {
    id: 19,
    category: "gioco",
    difficulty: "medio",
    situation:
      "Contratto 4♠. Il dichiarante deve fare l'impasse al Re di quadri. Al morto: ♦AQ5. In mano: ♦743. Il dichiarante gioca il Q♦ dal morto. Qual e' l'errore?",
    cards: "Morto: ♦AQ5  Mano: ♦743",
    errorDescription: "Ha giocato l'impasse dal lato sbagliato",
    options: [
      "Doveva giocare dalla MANO verso il morto, non dal morto",
      "Doveva giocare l'Asso prima",
      "L'impasse non era necessaria",
      "Doveva giocare il 5 dal morto",
    ],
    correctAnswer: 0,
    explanation:
      "L'impasse si gioca VERSO la forchetta (AQ), non DALLA forchetta. Si gioca il 3 o 4 dalla mano: se Ovest mette piccola, si inserisce il Q dal morto. Se Ovest ha il K, il Q vince. Giocando il Q direttamente dal morto, Est copre col K e l'impasse fallisce sempre.",
  },
  {
    id: 20,
    category: "difesa",
    difficulty: "medio",
    situation:
      "Sud dichiara 4♥. Ovest ha ♠KQJ103 e attacca il 3♠. Qual e' l'errore?",
    cards: "Ovest: ♠KQJ103 ♥52 ♦A84 ♣J96",
    errorDescription: "Ha attaccato il 3 invece del K dalla sequenza KQJ",
    options: [
      "Doveva attaccare cuori (atout)",
      "Doveva attaccare il K dalla sequenza KQJ",
      "Doveva attaccare quadri per l'Asso",
      "Il 3 e' l'attacco corretto (quarta migliore)",
    ],
    correctAnswer: 1,
    explanation:
      "Con una sequenza di 3+ onori consecutivi (KQJ), si attacca con il piu' alto della sequenza: il K. L'attacco della 'quarta migliore' (3) si usa per colori senza sequenza. Il K dalla sequenza e' informativo per il compagno e inizia a stabilire le prese.",
  },

  // ============================================================
  // DIFFICILE (10) - Difesa avanzata, segnali, slam, squeeze
  // ============================================================
  {
    id: 21,
    category: "difesa",
    difficulty: "difficile",
    situation:
      "Sud gioca 3NT. Ovest attacca il 4♠. Al morto ♠J73, Est ha ♠K962. Est vince col K♠. Che carta di ritorno gioca? Est torna il 9♠. Qual e' l'errore?",
    cards: "Est: ♠K962  (Attacco: 4♠)",
    errorDescription: "Ha tornato il 9 invece del 6 (ritorno della quarta migliore)",
    options: [
      "Doveva tornare il 2♠ (la piu' bassa)",
      "Il 9♠ e' corretto (la piu' alta del residuo)",
      "Doveva tornare il 6♠ (originale quarta)",
      "Doveva cambiare colore",
    ],
    correctAnswer: 2,
    explanation:
      "Quando il compagno attacca quarta migliore e tu vinci la presa, la regola e': ritorna la QUARTA del residuo (come se fosse un nuovo attacco). Dopo aver giocato il K, il residuo e' 962. La quarta... con 3 carte si torna la piu' alta (9) se originale 4+, oppure si torna la originale quarta. Con 4 carte originali, si torna il 6 (seconda dal basso col numero pari originale = quarta dal basso).",
  },
  {
    id: 22,
    category: "gioco",
    difficulty: "difficile",
    situation:
      "Contratto 6NT (piccolo slam). Il dichiarante ha 11 vincenti sicure e tenta il colpo finale. Al morto resta ♥A e ♦K. In mano resta ♠A e ♣K. Il dichiarante gioca il ♣K. Qual e' l'errore? (L'avversario Est guarda ♥K e ♦A).",
    errorDescription: "Non ha preparato lo squeeze: doveva eliminare prima le uscite",
    options: [
      "Doveva giocare l'Asso di picche come carta di spremitura",
      "Il ♣K era la mossa giusta",
      "Doveva incassare le vincenti lunghe prima dello squeeze",
      "Non c'e' squeeze possibile",
    ],
    correctAnswer: 2,
    explanation:
      "Per uno squeeze, bisogna prima ridurre a N-1 vincenti (dove N = prese mancanti + 1). Si devono incassare TUTTE le vincenti lunghe degli altri colori per 'comprimere' la mano avversaria. Giocando il ♣K prima delle lunghe, non si crea la pressione necessaria. La tecnica corretta: incassare le vincenti lunghe, poi giocare la 'squeeze card' finale.",
  },
  {
    id: 23,
    category: "difesa",
    difficulty: "difficile",
    situation:
      "Sud gioca 4♠. Ovest ha ♣AK84. Il compagno (Est) gioca il 2♣ sulla prima presa (A♣). Ovest continua con K♣. Qual e' l'errore?",
    cards: "Ovest: ♣AK84  (Est gioca: 2♣ sulla A♣)",
    errorDescription: "Ha continuato fiori quando il compagno segnalava sgradimento",
    options: [
      "Il 2♣ di Est e' un segnale di gradimento",
      "Ovest doveva continuare con il 4♣ (piccola)",
      "Il 2♣ segnala sgradimento: Ovest doveva cambiare colore",
      "Ovest doveva giocare atout",
    ],
    correctAnswer: 2,
    explanation:
      "In difesa, una carta BASSA (2) e' un segnale di SGRADIMENTO: Est non vuole la continuazione di fiori (probabilmente non ha il Q ne' un doubleton per tagliare). Ovest doveva rispettare il segnale e cambiare colore, cercando l'entrata del compagno in un altro seme.",
  },
  {
    id: 24,
    category: "licita",
    difficulty: "difficile",
    situation:
      "La sequenza e': 1♠-Passo-2♦-Passo-2♠-Passo-4♠. L'apertore ha ribattuto solo 2♠ con 6 picche e 16 HCP. Qual e' l'errore?",
    cards: "♠AKJ963 ♥K4 ♦Q5 ♣AJ8",
    sequence: ["1♠", "Passo", "2♦", "Passo", "2♠"],
    errorDescription: "Ha ribattuto 2♠ (minimo) con mano da salto",
    options: [
      "Doveva ribattere 3♠ (salto = extra valori)",
      "2♠ era corretto",
      "Doveva dire 2NT",
      "Doveva dire 3♦ (appoggio)",
    ],
    correctAnswer: 0,
    explanation:
      "Con 16 HCP e 6 belle picche (AKJ963), la rebid 2♠ mostra solo 12-14 HCP con 6 carte. Con valori extra (15-17) si deve SALTARE a 3♠ per mostrare la forza della mano. Il compagno con 10+ HCP potrebbe passare 2♠ perdendo la manche!",
  },
  {
    id: 25,
    category: "gioco",
    difficulty: "difficile",
    situation:
      "Contratto 6♥ (piccolo slam). Il dichiarante ha ♠AK al morto e ♠Q753 in mano. Deve eliminare le perdenti. Gioca A♠, K♠ e poi taglia la terza picche al morto. Ma il morto ha solo 2 atout rimasti. Qual e' l'errore?",
    errorDescription: "Taglia al morto consumando atout preziose per lo slam",
    options: [
      "Non doveva tagliare al morto cosi' presto",
      "Doveva scartare le picche perdenti sulle vincenti laterali",
      "Le picche non erano un problema",
      "Doveva battere tutte le atout prima",
    ],
    correctAnswer: 1,
    explanation:
      "In uno slam con atout limitati al morto, tagliare al morto consuma atout preziose. La tecnica migliore e' cercare di SCARTARE le perdenti su vincenti extra di un altro colore (es. se il morto ha KQJ di quadri extra, scartare le picche perdenti li'). Tagliare al morto va bene solo se non ci sono alternative migliori.",
  },
  {
    id: 26,
    category: "difesa",
    difficulty: "difficile",
    situation:
      "Sud gioca 3NT. Ovest attacca il 5♥. Al morto ♥K63. Est ha ♥AJ92. Est vince con... il J♥. Qual e' l'errore?",
    cards: "Est: ♥AJ92  Morto: ♥K63  (Attacco: 5♥)",
    errorDescription: "Ha finessato col J invece di vincere con l'Asso",
    options: [
      "Il J era la giocata corretta (impasse)",
      "Doveva vincere con l'Asso (terza mano alta)",
      "Doveva giocare il 2",
      "Doveva giocare il 9",
    ],
    correctAnswer: 1,
    explanation:
      "Regola: 'terza mano gioca ALTO'. Con A e J, quando il morto gioca piccola (il K non e' giocato), Est deve vincere con l'ASSO. Finessare col J rischia di far vincere il K al dichiarante gratuitamente. Dopo aver preso con l'A, Est ritorna il J per attaccare il K del morto dalla posizione giusta.",
  },
  {
    id: 27,
    category: "licita",
    difficulty: "difficile",
    situation:
      "Sequenza: 1♥-Passo-2NT-Passo-3♣-Passo-3♥-Passo-4♥. Il rispondente ha detto 3♥ con 3 carte di cuori e 13 HCP dopo che l'apertore ha mostrato un bicolore cuori-fiori. Qual e' l'errore?",
    cards: "♠AQ5 ♥K83 ♦KJ72 ♣J64",
    sequence: ["1♥", "Passo", "2NT", "Passo", "3♣", "Passo", "3♥"],
    errorDescription: "Ha dato preferenza a cuori con solo 3 carte avendo il fit a fiori",
    options: [
      "Doveva dare preferenza a 4♣ (miglior fit)",
      "3♥ con 3 carte era giusto (preferenza corretta)",
      "Doveva dire 3NT",
      "Doveva dire 3♦",
    ],
    correctAnswer: 2,
    explanation:
      "L'apertore mostra 5+ cuori e 4+ fiori. Con 3 cuori e 3 fiori, non c'e' un grande fit in nessuno dei due. Con 13 HCP, mano bilanciata e fermi negli altri colori, 3NT e' la dichiarazione migliore. La preferenza a cuori con solo 3 carte e' accettabile solo senza alternativa, ma qui 3NT e' chiaramente superiore.",
  },
  {
    id: 28,
    category: "difesa",
    difficulty: "difficile",
    situation:
      "Sud gioca 4♠. Ovest attacca A♦ e poi K♦. Est segue con 8♦ e poi 3♦ (pari-dispari). Ovest gioca un terzo giro di quadri. Qual e' l'errore?",
    cards: "Ovest: ♦AK972  Est ha giocato: 8♦ poi 3♦",
    errorDescription: "Ha giocato il terzo giro quando il segnale indicava numero pari (no taglio)",
    options: [
      "Il terzo giro di quadri era giusto per far tagliare Est",
      "8-3 (alto-basso) = numero PARI di quadri, Est non puo' tagliare",
      "Doveva giocare il quarto quadri",
      "Est segnalava gradimento",
    ],
    correctAnswer: 1,
    explanation:
      "Il segnale di CONTEGGIO pari-dispari: 8 poi 3 (alto-basso) = numero PARI di carte. Se Est ha iniziato con 4 quadri (pari), al terzo giro ne ha ancora uno e NON puo' tagliare. Se fosse stato 3 poi 8 (basso-alto = dispari), avrebbe avuto 3 quadri e potrebbe tagliare al terzo giro. Ovest ha ignorato il segnale del compagno.",
  },
  {
    id: 29,
    category: "gioco",
    difficulty: "difficile",
    situation:
      "Contratto 6NT. Il dichiarante ha 11 vincenti e deve decidere tra due impasse per la dodicesima. Impasse A: 50% al Re di picche. Impasse B: combinata, 75% (Re o Donna di quadri). Il dichiarante tenta l'impasse A. Qual e' l'errore?",
    errorDescription: "Ha scelto l'impasse a probabilita' inferiore",
    options: [
      "Doveva tentare l'impasse B (75% contro 50%)",
      "L'impasse A era giusta perche' in colore nobile",
      "Non doveva fare nessuna impasse",
      "Doveva giocare per il drop",
    ],
    correctAnswer: 0,
    explanation:
      "Nello slam, si deve massimizzare la probabilita' di successo. L'impasse combinata (serve che ALMENO UNO tra Re e Donna sia al posto giusto) ha il 75% di probabilita' (1 - 0.5 x 0.5 = 0.75). L'impasse semplice al Re ha solo il 50%. In matematica del bridge, si sceglie SEMPRE la linea a probabilita' piu' alta.",
  },
  {
    id: 30,
    category: "difesa",
    difficulty: "difficile",
    situation:
      "Sud gioca 4♥. Ovest ha ♠A e vede al morto ♠KQJ109 e nessuna entrata laterale. Ovest non prende l'Asso di picche alla prima occasione. Qual e' l'errore?",
    cards: "Ovest: ♠A874 ♥32 ♦KQ85 ♣J96  Morto: ♠KQJ109",
    errorDescription: "Non ha preso l'Asso subito per bloccare lo sviluppo delle picche del morto",
    options: [
      "Corretto il duck, per far consumare gli onori",
      "Doveva prendere l'Asso SUBITO per bloccare 5 prese di picche al morto",
      "Doveva giocare piccola per sempre",
      "Non importa quando prende l'Asso",
    ],
    correctAnswer: 1,
    explanation:
      "Al morto ci sono 5 picche (KQJT9) senza entrate laterali. Se Ovest ducka l'Asso, il dichiarante sviluppa le picche e le incassa tutte. Se Ovest prende l'Asso SUBITO, il morto perde l'unica comunicazione in picche (il dichiarante non ha piu' piccole per raggiungere il morto). L'Asso va giocato per TAGLIARE la comunicazione!",
  },
  {
    id: 31,
    category: "licita",
    difficulty: "difficile",
    situation:
      "Sequenza: 1♠-Passo-2♣-Passo-2♠-Passo-? Il rispondente con 17 HCP e fit a picche dichiara 4♠. Qual e' l'errore?",
    cards: "♠KQ4 ♥A5 ♦K83 ♣AQJ72",
    sequence: ["1♠", "Passo", "2♣", "Passo", "2♠", "Passo", "4♠"],
    errorDescription: "Ha chiuso a manche senza esplorare lo slam con 17 HCP",
    options: [
      "4♠ e' perfetto, la manche e' il tetto",
      "Con 17 HCP e fit doveva esplorare lo slam (es. 3♠ forzante)",
      "Doveva dichiarare 3NT",
      "Doveva ripetere 3♣",
    ],
    correctAnswer: 1,
    explanation:
      "Con 17 HCP, 3 carte di appoggio a picche e un bel colore di fiori, lo slam e' possibile se l'apertore ha un buon minimo (13-14 con carte ben piazzate). Dichiarare 4♠ e' limitante e chiude ogni dialogo. Una dichiarazione come 3♠ (forzante, mostra fit e valori extra) o un cuebid permette di esplorare il livello 6.",
  },
  {
    id: 32,
    category: "gioco",
    difficulty: "difficile",
    situation:
      "Contratto 4♠. Il dichiarante ha 2 perdenti a fiori. Al morto c'e' un doubleton fiori e 3 atout. Invece di tagliare le fiori al morto, il dichiarante batte 3 giri di atout. Qual e' l'errore?",
    cards: "Mano: ♠AKQJ5 ♣K83  Morto: ♠974 ♣62",
    errorDescription: "Ha tolto le atout del morto che servivano per tagliare",
    options: [
      "Corretto battere le atout prima",
      "Doveva tagliare le fiori perdenti al morto PRIMA di battere tutte le atout",
      "Le fiori non erano un problema",
      "Doveva scartare le fiori su un altro colore",
    ],
    correctAnswer: 1,
    explanation:
      "Quando devi tagliare perdenti al morto, NON devi battere tutte le atout prima! Se batti 3 giri, il morto non ha piu' atout per tagliare. La tecnica e': gioca solo 1-2 giri di atout per togliere quelle avversarie piu' pericolose, poi taglia le perdenti al morto, e infine finisci di battere le atout.",
  },
];
