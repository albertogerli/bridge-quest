// Quick comprehension questions shown after theory modules
// Keyed by lessonId - each lesson has 3-4 quick questions

export interface ComprehensionQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index
  explanation: string;
}

export interface LessonComprehension {
  lessonId: number;
  title: string;
  questions: ComprehensionQuestion[];
}

export const comprehensionData: LessonComprehension[] = [
  // === CORSO FIORI ===
  {
    lessonId: 0,
    title: "Introduzione al Bridge",
    questions: [
      {
        question: "Quanti giocatori servono per giocare a bridge?",
        options: ["2", "3", "4", "6"],
        correctAnswer: 2,
        explanation: "Il bridge si gioca in 4, divisi in 2 coppie: Nord-Sud e Est-Ovest.",
      },
      {
        question: "Quante carte riceve ogni giocatore?",
        options: ["10", "12", "13", "26"],
        correctAnswer: 2,
        explanation: "Il mazzo di 52 carte viene diviso equamente: 13 carte a testa.",
      },
      {
        question: "Cosa determina la fase di dichiarazione?",
        options: ["Chi mescola", "Il contratto finale", "Chi gioca per primo", "Il punteggio"],
        correctAnswer: 1,
        explanation: "La dichiarazione determina il contratto: quante prese fare e in quale atout.",
      },
    ],
  },
  {
    lessonId: 1,
    title: "Contare i Punti",
    questions: [
      {
        question: "Quanti punti vale un Asso?",
        options: ["1", "2", "3", "4"],
        correctAnswer: 3,
        explanation: "A=4, K=3, Q=2, J=1. L'Asso e' la carta di maggior valore.",
      },
      {
        question: "Con quanti punti si apre la dichiarazione?",
        options: ["8+", "10+", "12+", "15+"],
        correctAnswer: 2,
        explanation: "Con 12+ punti onori (HCP) si puo' aprire la dichiarazione.",
      },
      {
        question: "Quanti punti totali ci sono nel mazzo?",
        options: ["30", "36", "40", "52"],
        correctAnswer: 2,
        explanation: "40 HCP totali: 10 per seme (A+K+Q+J = 4+3+2+1 = 10, x4 semi).",
      },
    ],
  },
  {
    lessonId: 2,
    title: "L'Apertura",
    questions: [
      {
        question: "Con 5 carte di picche e 12 HCP, cosa apri?",
        options: ["Passo", "1♣", "1♠", "1NT"],
        correctAnswer: 2,
        explanation: "Con un colore di 5+ carte e 12+ HCP, apri al livello 1 in quel colore.",
      },
      {
        question: "Quando si apre 1NT?",
        options: ["Sempre con 15 HCP", "15-17 HCP bilanciata", "Con 5 carte a cuori", "Mai"],
        correctAnswer: 1,
        explanation: "1NT mostra 15-17 HCP e distribuzione bilanciata (4-3-3-3, 4-4-3-2, 5-3-3-2).",
      },
      {
        question: "Quale colore si apre per primo con due colori di 5 carte?",
        options: ["Il piu' alto", "Il piu' basso", "Sempre picche", "Quello con piu' onori"],
        correctAnswer: 0,
        explanation: "Con due colori 5-5, si apre il colore piu' alto di rango.",
      },
    ],
  },
  {
    lessonId: 3,
    title: "La Risposta",
    questions: [
      {
        question: "Con quanti punti si risponde al partner?",
        options: ["5+", "6+", "8+", "10+"],
        correctAnswer: 1,
        explanation: "Con 6+ HCP si ha abbastanza per rispondere all'apertura del partner.",
      },
      {
        question: "Cosa significa un cambio di colore in risposta?",
        options: ["Forza per un giro", "Debolezza", "Vuole giocare li'", "Niente di speciale"],
        correctAnswer: 0,
        explanation: "Un nuovo colore in risposta e' forzante per un giro: il partner deve parlare ancora.",
      },
      {
        question: "Con fit (4+ carte) nell'atout del partner, cosa fai?",
        options: ["Cambi colore", "Alzi il colore del partner", "Dici 1NT", "Passi"],
        correctAnswer: 1,
        explanation: "Con il fit, alzi il colore del partner al livello appropriato per la tua forza.",
      },
    ],
  },
  {
    lessonId: 4,
    title: "Il Gioco della Carta",
    questions: [
      {
        question: "Chi gioca la prima carta dopo la dichiarazione?",
        options: ["Il dichiarante", "Il morto", "L'avversario a sinistra del dichiarante", "Il mazziere"],
        correctAnswer: 2,
        explanation: "L'attacco (opening lead) spetta all'avversario alla sinistra del dichiarante.",
      },
      {
        question: "Cosa fa il 'morto' dopo l'attacco?",
        options: ["Gioca normalmente", "Stende le carte in tavola", "Esce dalla stanza", "Sceglie l'atout"],
        correctAnswer: 1,
        explanation: "Il morto (dummy) stende le sue carte scoperte e il dichiarante gioca per entrambi.",
      },
      {
        question: "Quante prese bisogna fare per mantenere un contratto di 3NT?",
        options: ["3", "6", "9", "13"],
        correctAnswer: 2,
        explanation: "Il 'libro' e' 6 prese. Contratto 3 = 6+3 = 9 prese da fare.",
      },
    ],
  },
  {
    lessonId: 5,
    title: "L'Impasse",
    questions: [
      {
        question: "Cos'e' un'impasse (finesse)?",
        options: ["Un gioco forzato", "Tentativo di catturare un onore avversario", "Un tipo di contratto", "Una penalita'"],
        correctAnswer: 1,
        explanation: "L'impasse e' il tentativo di catturare un onore avversario giocando verso un onore nostro.",
      },
      {
        question: "Qual e' la probabilita' di successo di un'impasse semplice?",
        options: ["25%", "33%", "50%", "75%"],
        correctAnswer: 2,
        explanation: "Un'impasse semplice ha il 50% di probabilita': l'onore mancante e' a destra o a sinistra.",
      },
      {
        question: "Verso quale mano si gioca per fare l'impasse?",
        options: ["Verso la mano con l'onore superiore", "Verso la mano con l'onore inferiore", "Non importa", "Sempre verso il morto"],
        correctAnswer: 1,
        explanation: "Si gioca VERSO la mano che ha l'onore con cui si tenta la cattura (es. verso AQ).",
      },
    ],
  },
  {
    lessonId: 6,
    title: "Sviluppo dei Colori",
    questions: [
      {
        question: "Cosa significa 'sviluppare' un colore?",
        options: ["Toglierlo dal mazzo", "Creare prese promuovendo carte minori", "Giocare solo onori", "Scartare le carte basse"],
        correctAnswer: 1,
        explanation: "Sviluppare = forzare fuori gli onori avversari per promuovere le nostre carte a vincenti.",
      },
      {
        question: "Con AKQxx in un colore, quante prese sono sicure?",
        options: ["2", "3", "4", "5"],
        correctAnswer: 1,
        explanation: "A, K, Q sono 3 prese sicure. Le xx diventano vincenti se il colore divide bene.",
      },
      {
        question: "Quando si sviluppano i colori lunghi a SA?",
        options: ["Mai", "Prima di incassare i vincenti", "Solo alla fine", "Solo con 7+ carte"],
        correctAnswer: 1,
        explanation: "A SA, si sviluppano i colori lunghi PRIMA di incassare, per avere le prese pronte.",
      },
    ],
  },
  {
    lessonId: 7,
    title: "Il Piano di Gioco",
    questions: [
      {
        question: "Qual e' il primo passo del piano di gioco?",
        options: ["Giocare l'Asso", "Contare le prese sicure", "Fare l'impasse", "Tirare atout"],
        correctAnswer: 1,
        explanation: "STOP! Prima di giocare: conta le prese sicure, poi identifica come creare le mancanti.",
      },
      {
        question: "A contratto di atout, quando si tirano gli atout?",
        options: ["Sempre subito", "Mai", "Dipende dal piano", "Solo alla fine"],
        correctAnswer: 2,
        explanation: "Tirare atout dipende dal piano: a volte serve prima tagliare in mano corta.",
      },
      {
        question: "Cosa sono le 'comunicazioni'?",
        options: ["Segnali tra partner", "Carte che permettono di passare da una mano all'altra", "Le dichiarazioni", "I rientri del morto"],
        correctAnswer: 1,
        explanation: "Le comunicazioni sono gli ingressi (entries) per passare tra dichiarante e morto.",
      },
    ],
  },
  {
    lessonId: 8,
    title: "La Difesa",
    questions: [
      {
        question: "Cosa attacca il difensore in testa?",
        options: ["Sempre l'Asso", "Il colore del partner", "Di solito il suo colore lungo", "Sempre atout"],
        correctAnswer: 2,
        explanation: "In genere si attacca dal proprio colore lungo per sviluppare prese difensive.",
      },
      {
        question: "Cosa significa 'quarta migliore'?",
        options: ["La quarta carta del mazzo", "La quarta carta dall'alto nel colore lungo", "Il quarto seme", "Quattro carte"],
        correctAnswer: 1,
        explanation: "Si attacca la quarta carta dall'alto nel colore lungo (es. da KJ852 si attacca il 5).",
      },
      {
        question: "Il partner ha aperto, cosa attacchi?",
        options: ["Il tuo colore", "Il colore del partner", "Atout", "Un singolo"],
        correctAnswer: 1,
        explanation: "Se il partner ha dichiarato un colore, di solito si attacca quel colore.",
      },
    ],
  },
  // Lessons 9-12 (advanced topics)
  {
    lessonId: 9,
    title: "Convenzioni di Base",
    questions: [
      {
        question: "Dopo 1NT del partner, cosa significa 2♣?",
        options: ["Vuole giocare a fiori", "Stayman: chiede un fit 4-4 a maggiore", "Invitante", "Forzante a manche"],
        correctAnswer: 1,
        explanation: "2♣ Stayman chiede al partner se ha 4 carte a cuori o picche.",
      },
      {
        question: "Dopo 1NT - 2♦, cosa mostra il rispondente?",
        options: ["Fiori lunghe", "Transfer a cuori: 5+ cuori", "Invito a 2NT", "Debolezza"],
        correctAnswer: 1,
        explanation: "2♦ e' una Transfer Jacoby: ordina al partner di dire 2♥, mostrando 5+ cuori.",
      },
      {
        question: "Perche' si usano le convenzioni?",
        options: ["Per confondere gli avversari", "Per descrivere la mano con precisione", "Sono obbligatorie", "Per giocare piu' veloce"],
        correctAnswer: 1,
        explanation: "Le convenzioni permettono di scambiare informazioni precise sulla mano in modo artificiale.",
      },
    ],
  },
  {
    lessonId: 10,
    title: "La Manche e lo Slam",
    questions: [
      {
        question: "Quanti punti combinati servono per la manche a SA?",
        options: ["20", "23", "25", "30"],
        correctAnswer: 2,
        explanation: "Per 3NT servono circa 25 HCP combinati tra le due mani.",
      },
      {
        question: "Cosa significa 'invitante'?",
        options: ["Forza per manche", "Chiede al partner di valutare se andare a manche", "Debole", "Forzante"],
        correctAnswer: 1,
        explanation: "Un rialzo invitante chiede al partner: 'Con il massimo vai a manche, col minimo passa'.",
      },
      {
        question: "Per lo Slam (6 livello) servono circa quanti HCP?",
        options: ["25", "28", "33", "37"],
        correctAnswer: 2,
        explanation: "Per lo Slam servono circa 33 HCP combinati e tutti i colori controllati.",
      },
    ],
  },
  {
    lessonId: 11,
    title: "Il Contro e le Interferenze",
    questions: [
      {
        question: "Cosa mostra un 'Contro informativo'?",
        options: ["Puniti!", "Apertura con sostegno nei colori non dichiarati", "Debolezza", "Vuole giocare"],
        correctAnswer: 1,
        explanation: "Il Contro informativo mostra valori d'apertura e sostegno nei colori non dichiarati.",
      },
      {
        question: "Dopo che un avversario apre 1♥, cosa fai con 15 HCP e 5 picche?",
        options: ["Passo", "Contro", "1♠", "2♥"],
        correctAnswer: 2,
        explanation: "Con un buon colore di 5+ carte e i valori, si interviene nel proprio colore.",
      },
      {
        question: "Quando si usa il 'Contro punitivo'?",
        options: ["Sempre", "Quando pensi che gli avversari non facciano il contratto", "Mai", "Solo allo Slam"],
        correctAnswer: 1,
        explanation: "Il Contro punitivo si usa quando credi che gli avversari falliranno il loro contratto.",
      },
    ],
  },
  {
    lessonId: 12,
    title: "Strategie Avanzate",
    questions: [
      {
        question: "Cos'e' un 'squeeze'?",
        options: ["Un tipo di contratto", "Forzare un avversario a scartare una carta utile", "Un attacco", "Una convenzione"],
        correctAnswer: 1,
        explanation: "Lo squeeze forza un avversario a scegliere quale guardia abbandonare.",
      },
      {
        question: "Cos'e' un 'endplay'?",
        options: ["L'ultima presa", "Mettere in mano un avversario che deve giocare a nostro favore", "Fine partita", "Un errore"],
        correctAnswer: 1,
        explanation: "L'endplay forza un avversario a giocare, dandoci un vantaggio (rientro o impasse).",
      },
      {
        question: "Quando e' meglio il 'drop' rispetto all'impasse?",
        options: ["Mai", "Con 9+ carte combinate per la Donna", "Sempre", "Solo a SA"],
        correctAnswer: 1,
        explanation: "Con 9+ carte combinate, la Donna cade piu' spesso (52%) che con l'impasse (50%).",
      },
    ],
  },
];
