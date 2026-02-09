/**
 * BridgeQuest - Lesson Content Data
 * Extracted from FIGB Corso Fiori 2022 official course material
 */

export interface LessonModule {
  id: string;
  title: string;
  duration: string; // estimated minutes
  type: "theory" | "exercise" | "quiz" | "practice";
  content: ContentBlock[];
  xpReward: number;
}

export interface ContentBlock {
  type:
    | "text"
    | "heading"
    | "rule"
    | "example"
    | "hand-diagram"
    | "quiz"
    | "tip"
    | "card-select"   // tap the correct card from a visual hand
    | "hand-eval"     // evaluate a hand (count points, choose opening)
    | "bid-select"    // choose the correct bid from a bidding box
    | "true-false"    // quick true/false question
    | "sequence";     // put steps in correct order
  content: string;
  cards?: string; // card notation like "♠AK32 ♥KQJ10"
  options?: string[]; // for quiz / bid-select / sequence type
  correctAnswer?: number; // index for quiz, bid-select, true-false (0=true, 1=false)
  correctCard?: string; // for card-select: e.g. "♠A"
  correctValue?: number; // for hand-eval: the correct point count
  correctOrder?: number[]; // for sequence: correct order of option indices
  explanation?: string; // for quiz/tip
}

export interface Lesson {
  id: number;
  worldId: number;
  title: string;
  subtitle: string;
  icon: string;
  modules: LessonModule[];
  smazzateIds: string[]; // references to practice hands
}

export interface World {
  id: number;
  name: string;
  subtitle: string;
  icon: string;
  gradient: string;
  iconBg: string;
  lessons: Lesson[];
}

// ===== WORLD 1: IL TAVOLO - Scoprire il Bridge =====

const premessa: Lesson = {
  id: 0,
  worldId: 1,
  title: "Il Bridge: un gioco di prese",
  subtitle: "Le basi fondamentali del gioco",
  icon: "🃏",
  smazzateIds: [],
  modules: [
    {
      id: "0-1",
      title: "Il mazzo francese",
      duration: "3",
      type: "theory",
      xpReward: 30,
      content: [
        {
          type: "heading",
          content: "Il mazzo francese",
        },
        {
          type: "text",
          content:
            "Il Bridge e un gioco di coppia: i due giocatori che siedono di fronte giocano insieme, opposti agli altri due. La coppia N/S gioca contro la coppia E/O.",
        },
        {
          type: "text",
          content:
            "Il mazzo e quello \"Francese\", composto da 52 carte divise in quattro semi: le Picche ♠, i Cuori ♥, i Quadri ♦ e i Fiori ♣. In ogni seme ci sono 13 carte, dall'Asso al due.",
        },
        {
          type: "rule",
          content:
            "L'Asso, il Re, la Dama, il Fante e il Dieci sono detti onori. Le carte dal nove al due sono dette cartine.",
        },
        {
          type: "example",
          content: "Una mano di esempio:",
          cards: "♠J8 ♥AQJ43 ♦KQ3 ♣A98",
        },
        {
          type: "text",
          content:
            "Per convenzione si parla prima delle Picche, poi delle Cuori, Quadri e Fiori. La mancanza di un seme e detta \"vuoto\" o \"chicane\"; una carta sola e un \"singolo\", due carte sono dette \"doubleton\".",
        },
        {
          type: "quiz",
          content: "Quante carte ha ogni giocatore in una mano di bridge?",
          options: ["10", "12", "13", "15"],
          correctAnswer: 2,
          explanation:
            "Ogni giocatore riceve esattamente 13 carte. 52 carte divise tra 4 giocatori = 13 ciascuno.",
        },
        {
          type: "true-false",
          content: "Il Dieci e considerato un onore nel bridge.",
          correctAnswer: 0,
          explanation:
            "Si! Gli onori sono: Asso, Re, Dama, Fante e Dieci. Le carte dal 9 al 2 sono cartine.",
        },
      ],
    },
    {
      id: "0-2",
      title: "La presa",
      duration: "4",
      type: "theory",
      xpReward: 30,
      content: [
        {
          type: "heading",
          content: "La presa",
        },
        {
          type: "text",
          content:
            "Il giocatore alla sinistra del Mazziere sceglie una delle sue tredici carte e la espone davanti a se sul tavolo. Questa prima giocata si chiama Attacco.",
        },
        {
          type: "text",
          content:
            "Gli altri tre, a turno seguendo in senso orario, dovranno anch'essi esporre davanti a se una carta dello stesso seme. Questo obbligo si chiama rispondere al colore.",
        },
        {
          type: "rule",
          content:
            "SI AGGIUDICA LA PRESA CHI HA GIOCATO LA CARTA PIU' ALTA DEL SEME DOMINANTE",
        },
        {
          type: "text",
          content:
            "L'obbligo di rispondere a colore viene meno solo quando un giocatore e sprovvisto di carte nel seme imposto; in tal caso sceglie liberamente una carta di un altro seme: si dice che scarta.",
        },
        {
          type: "rule",
          content:
            "IL GIOCATORE CHE SCARTA NON PUO' MAI AGGIUDICARSI LA PRESA",
        },
        {
          type: "quiz",
          content:
            "Se Ovest gioca il Re di Picche e tu non hai Picche, cosa puoi fare?",
          options: [
            "Devi passare il turno",
            "Puoi scartare una carta di un altro seme",
            "Devi giocare un Asso",
            "Puoi giocare qualsiasi carta e vincere",
          ],
          correctAnswer: 1,
          explanation:
            "Quando non hai carte del seme giocato, puoi scartare qualsiasi carta di un altro seme, ma non puoi vincere la presa (a meno che non ci sia un atout).",
        },
        {
          type: "card-select",
          content: "Ovest attacca con ♠K. Nord gioca ♠3. Est gioca ♠7. Quale carta giochi da Sud per vincere la presa?",
          cards: "♠A♠Q♠5♠2",
          correctCard: "♠A",
          explanation: "L'Asso e l'unica carta che batte il Re con certezza. Non sprecare la Dama quando il Re e gia in tavola!",
        },
      ],
    },
    {
      id: "0-3",
      title: "Il Morto e il Vivo",
      duration: "4",
      type: "theory",
      xpReward: 30,
      content: [
        {
          type: "heading",
          content: "Il Morto e il Vivo",
        },
        {
          type: "text",
          content:
            "A bridge si gioca sempre con il morto: uno dei 4 giocatori, dopo l'attacco, depone scoperte sul tavolo le sue carte, ordinate e divise per seme, e non partecipa alle giocate.",
        },
        {
          type: "text",
          content:
            "Sara il suo compagno — il giocante — a decidere, di volta in volta, quale carta giocare quando sara il turno del morto.",
        },
        {
          type: "tip",
          content:
            "Il Giocante vede 26 carte (le sue 13 + le 13 del morto). Questo vantaggio gli permette di pianificare la strategia!",
          explanation:
            "I difensori vedono solo le proprie carte e quelle del morto, ma non quelle del partner.",
        },
        {
          type: "quiz",
          content: "Quante carte puo vedere il Giocante (Dichiarante)?",
          options: ["13", "26", "39", "52"],
          correctAnswer: 1,
          explanation:
            "Il Giocante vede le proprie 13 carte piu le 13 carte del morto = 26 carte totali.",
        },
        {
          type: "true-false",
          content: "Il morto puo scegliere autonomamente quale carta giocare.",
          correctAnswer: 1,
          explanation: "Falso! Il morto non sceglie: e il Giocante (Dichiarante) che decide quale carta giocare dalla mano del morto.",
        },
      ],
    },
    {
      id: "0-4",
      title: "L'atout e il Senza Atout",
      duration: "3",
      type: "theory",
      xpReward: 30,
      content: [
        {
          type: "heading",
          content: "Due modi di giocare",
        },
        {
          type: "text",
          content:
            "Gioco con un atout (♠, ♥, ♦, o ♣): se un seme e atout, chi e sprovvisto di carte nel seme dominante puo \"tagliare\" con una carta di atout e vincere la presa.",
        },
        {
          type: "rule",
          content:
            "Non e possibile tagliare se si possiedono carte del seme giocato. Tagliare e una possibilita, non un obbligo. Se tagliano in due, vince chi ha usato la carta di atout piu alta.",
        },
        {
          type: "text",
          content:
            "Gioco senza atout (S.A., o N.T.): nessun seme ha il potere di taglio. L'unica opzione per chi avesse finito le carte di un seme resta lo scarto.",
        },
        {
          type: "quiz",
          content:
            "Se il contratto e a Cuori (atout) e non hai Picche, cosa puoi fare quando viene giocata una Picca?",
          options: [
            "Solo scartare",
            "Tagliare con una carta di Cuori",
            "Giocare una Picca dal morto",
            "Passare il turno",
          ],
          correctAnswer: 1,
          explanation:
            "Se non hai carte del seme giocato e c'e un atout, puoi tagliare con una carta di atout per vincere la presa!",
        },
      ],
    },
    {
      id: "0-5",
      title: "L'asta e il contratto",
      duration: "4",
      type: "theory",
      xpReward: 30,
      content: [
        {
          type: "heading",
          content: "Chi decide il tipo di gioco?",
        },
        {
          type: "text",
          content:
            "Per poter imporre il tipo di gioco piu conveniente, la coppia si deve impegnare per un certo numero di prese, attraverso una sorta di \"asta\". Chi fa l'offerta piu alta stabilisce il tipo di gioco.",
        },
        {
          type: "text",
          content:
            "Le dichiarazioni si fanno usando il Bidding box. Il simbolo e il tipo di gioco proposto, il numero rappresenta le prese (oltre a sei) che ci si propone di fare.",
        },
        {
          type: "example",
          content:
            "Chi espone il cartellino di \"2♥\" sta dicendo: \"la mia coppia si impegna a realizzare almeno 8 prese, purche il colore di cuori sia atout\".",
        },
        {
          type: "text",
          content: "La gerarchia e: NT ♠ ♥ ♦ ♣ (dal piu alto al piu basso)",
        },
        {
          type: "rule",
          content:
            "Quando, dopo una dichiarazione attiva, tutti e tre gli altri passano, tale dichiarazione diventa \"il Contratto\".",
        },
        {
          type: "quiz",
          content:
            "Se un giocatore dichiara 1♥, quale delle seguenti dichiarazioni e valida per il giocatore successivo?",
          options: ["1♦", "1♣", "1♠", "1♥"],
          correctAnswer: 2,
          explanation:
            "1♠ e valida perche le Picche hanno rango superiore ai Cuori. 1♦ e 1♣ sono di rango inferiore e richiederebbero il livello 2.",
        },
        {
          type: "bid-select",
          content: "L'avversario apre 1♦. Tu hai una bella mano. Quale di queste dichiarazioni e VALIDA?",
          options: ["1C", "1D", "1H", "P"],
          correctAnswer: 2,
          explanation: "1♥ e valida perche i Cuori hanno rango superiore ai Quadri. 1♣ e 1♦ sarebbero allo stesso livello o inferiore!",
        },
      ],
    },
    {
      id: "0-6",
      title: "Il punteggio",
      duration: "3",
      type: "theory",
      xpReward: 30,
      content: [
        {
          type: "heading",
          content: "Il punteggio",
        },
        {
          type: "text",
          content:
            "Per ogni presa dichiarata (le prime 6 non vengono pagate): 30 punti se l'atout e ♥ o ♠, o se e a NT (40 la prima, 30 le altre). 20 punti se l'atout e ♣ o ♦.",
        },
        {
          type: "text",
          content:
            "Sono contratti di Manche quelli in cui la somma delle prese dichiarate vale almeno 100 (3NT, 4♥, 4♠, 5♣, 5♦). Il bonus e 300 se \"verdi\" o 500 se \"rossi\".",
        },
        {
          type: "text",
          content:
            "Per i contratti di 12 prese (piccolo Slam) o di 13 prese (Grande Slam) ci sono ulteriori bonus: 500/750 per il piccolo, 1000/1500 per il grande.",
        },
        {
          type: "text",
          content:
            "Se il contratto non viene mantenuto: per ogni presa in meno, 50 se il giocante e verde e 100 se e rosso.",
        },
        {
          type: "quiz",
          content: "Quante prese deve fare la coppia per mantenere un contratto di 3NT?",
          options: ["3", "6", "9", "13"],
          correctAnswer: 2,
          explanation:
            "3NT = 3 + 6 = 9 prese. Il numero del contratto + 6 (le prese \"gratuite\") = prese necessarie.",
        },
      ],
    },
  ],
};

const lezione1: Lesson = {
  id: 1,
  worldId: 2,
  title: "Vincenti e affrancabili",
  subtitle: "Imparare a contare le prese",
  icon: "🎯",
  smazzateIds: ["1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "1-7", "1-8"],
  modules: [
    {
      id: "1-1",
      title: "Carte vincenti",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "La differenza tra carte vincenti e carte affrancabili",
        },
        {
          type: "text",
          content:
            "Si dice vincente una carta che, se giocata in quel momento, e in grado di aggiudicarsi una presa con certezza assoluta. Si dice affrancabile una carta che potra diventare vincente dopo un'opportuna manovra.",
        },
        {
          type: "example",
          content: "Tra Picche e Cuori:",
          cards: "♠AK32 ♥KQJ10",
        },
        {
          type: "text",
          content:
            "A Picche avete DUE vincenti, e a Cuori... neanche una. Ma le Cuori sono affrancabili! Una volta ceduto l'Asso avversario, gli altri tre onori diventeranno vincenti.",
        },
        {
          type: "rule",
          content:
            "Carte di valore contiguo (KQJ...QJ109...AKQJ...J1098...) si definiscono equivalenti. Sono da considerare vincenti gli Assi, i Re se accompagnati dall'Asso, le Dame se accompagnate da Asso e Re.",
        },
        {
          type: "quiz",
          content: "Quante vincenti immediate ci sono in questa mano? ♠KQ65 ♥AKJ3 ♦K4 ♣AKQ",
          options: ["5", "7", "8", "9"],
          correctAnswer: 1,
          explanation:
            "Picche: 0 (manca l'Asso), Cuori: 2 (A e K, il J non e garantito), Quadri: 0 (manca l'Asso), Fiori: 3 (AKQ) = totale 5... ma attenzione: dipende anche dalle carte del morto!",
        },
        {
          type: "card-select",
          content: "Hai ♣KQJ10 e vuoi affrancare le Fiori. Quale carta giochi per prima?",
          cards: "♣K♣Q♣J♣10",
          correctCard: "♣K",
          explanation: "Giochi il Re (il piu alto della sequenza). Cosi forzi l'Asso avversario e le altre carte si affranqueranno.",
        },
        {
          type: "true-false",
          content: "Una sequenza ♠KQJ e equivalente a una sequenza ♠AKQ per l'affrancamento.",
          correctAnswer: 1,
          explanation: "Falso! ♠AKQ sono gia vincenti. ♠KQJ devono prima \"costringere\" l'avversario a usare l'Asso prima di affrancarsi.",
        },
      ],
    },
    {
      id: "1-2",
      title: "Il punto di vista del Giocante",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Gestire 26 carte",
        },
        {
          type: "text",
          content:
            "Il Giocante ha sempre un obiettivo predefinito da raggiungere: se il contratto e 3NT, dovra fare almeno 9 prese. Solitamente il conto delle vincenti e molto lontano dall'obiettivo: ci sara da lavorare per affrancare prese nuove.",
        },
        {
          type: "rule",
          content:
            "Prima operazione: contare le prese vincenti a disposizione, colore per colore, osservando Mano e Morto \"in verticale\".",
        },
        {
          type: "text",
          content:
            "IL NUMERO MASSIMO DI PRESE REALIZZABILI IN UN SEME E PARI O INFERIORE AL NUMERO DI CARTE DEL LATO LUNGO.",
        },
        {
          type: "text",
          content:
            "Seconda operazione: individuare i colori da cui si potrebbero affrancare altre prese. La strategia migliore non e quella di affrettarsi a giocare le vincenti, ma quella di giocare nei colori che presentano carte da affrancare.",
        },
      ],
    },
    {
      id: "1-3",
      title: "Affrancare per forza",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "L'affrancamento di forza",
        },
        {
          type: "text",
          content:
            "Quando si hanno carte equivalenti affrancare e facile: ♣KQJ10 — dopo che una di queste carte avra costretto l'avversario a usare l'Asso, le altre tre si affranqueranno.",
        },
        {
          type: "rule",
          content:
            "Attenzione: le carte affrancate non saranno disponibili immediatamente. Per poterle \"incassare\" sara necessario vincere una delle prese successive.",
        },
        {
          type: "text",
          content:
            "Per prevedere quante prese si possono affrancare basta comparare il numero di equivalenti possedute e il numero di vincenti assolute degli avversari.",
        },
        {
          type: "example",
          content: "Primi colori da muovere - quelli che ci danno piu carte affrancate:",
          cards: "♠AQ8 ♥76 ♦K65 ♣K10932",
        },
        {
          type: "text",
          content:
            "Attacco: ♦Q. Sud conta le vincenti: Picche 3, Cuori 1, Quadri 2, Fiori 0. Ma le Fiori sono una grande sorgente di prese (si affrancano 4 delle 5 carte di Nord). Sud vince l'attacco e immediatamente gioca Fiori, e continua finche non scende l'Asso.",
        },
      ],
    },
    {
      id: "1-4",
      title: "Pratica: Smazzate 1",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: Vincenti e Affrancabili",
        },
        {
          type: "text",
          content:
            "Gioca le 8 smazzate della Lezione 1. In ogni mano, conta prima le vincenti, poi cerca i colori da affrancare. Ricorda: non affrettarti a incassare le vincenti!",
        },
        {
          type: "tip",
          content: "Consiglio del Maestro Fiori",
          explanation:
            "Prima di giocare la prima carta, fermati e conta: quante vincenti ho? Quante me ne servono? Da dove le prendo? Questo piano di gioco e la chiave del successo!",
        },
      ],
    },
  ],
};

const lezione2: Lesson = {
  id: 2,
  worldId: 3,
  title: "Il punto di vista dei difensori",
  subtitle: "L'attacco e il gioco di terza mano",
  icon: "🛡️",
  smazzateIds: ["2-1", "2-2", "2-3", "2-4", "2-5", "2-6", "2-7", "2-8"],
  modules: [
    {
      id: "2-1",
      title: "Lo scopo dei difensori",
      duration: "4",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Cercare di battere il contratto",
        },
        {
          type: "text",
          content:
            "I difensori hanno un obiettivo in prese: il complemento a 14 delle prese del contratto. Se Sud sta giocando 3NT (9 prese), Est e Ovest devono cercare di farne 5.",
        },
        {
          type: "text",
          content:
            "A volte il colore di attacco si rivelera azzeccato, altre volte no. Quello che entrambi dovranno fare e guardare il morto e giocare nei colori dove la loro coppia potrebbe vincere o affrancare delle prese.",
        },
      ],
    },
    {
      id: "2-2",
      title: "L'attacco a Senz'Atout",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "L'attacco nei contratti a Senz'atout",
        },
        {
          type: "text",
          content:
            "I difensori non devono aver fretta di incassare le carte vincenti. Scegliere il colore e fondamentale!",
        },
        {
          type: "rule",
          content:
            "SCEGLIETE IL COLORE PIU' LUNGO. SE NE AVETE DUE DI PARI LUNGHEZZA, SCEGLIETE IL PIU' ONORATO.",
        },
        {
          type: "text",
          content:
            "Regola 1 — attacco dall'alto: con una sequenza di onori contigui (KQJ, QJ10...), si attacca con il piu alto. Regola 2 — attacco dal basso: senza una sequenza, si attacca con la cartina in coda al colore (la quarta).",
        },
        {
          type: "example",
          content: "Esempi di attacco dall'alto:",
          cards: "KQJ103 → K | QJ93 → Q | Q10976 → 10 | J1094 → J",
        },
        {
          type: "card-select",
          content: "Devi attaccare contro 3NT. Il tuo colore piu lungo e ♠QJ1073. Quale carta attacchi?",
          cards: "♠Q♠J♠10♠7♠3",
          correctCard: "♠Q",
          explanation: "Con una sequenza QJ10, attacchi dalla piu alta: la Dama. Questo segnala al compagno che hai anche il Fante e il 10.",
        },
        {
          type: "true-false",
          content: "Contro un contratto a Senz'Atout, conviene sempre attaccare nel colore piu lungo.",
          correctAnswer: 0,
          explanation: "Vero! Nei contratti a SA, il colore lungo e la miglior sorgente di prese per i difensori. Se ne avete due di pari lunghezza, scegliete il piu onorato.",
        },
      ],
    },
    {
      id: "2-3",
      title: "Il Terzo di mano",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Convenienze e accordi del Terzo di mano",
        },
        {
          type: "text",
          content:
            "Il Terzo di mano deve cercare di vincere la presa, ed eventualmente sacrificare i suoi onori allo scopo di affrancare quelli del suo compagno.",
        },
        {
          type: "rule",
          content:
            "QUANDO HA CARTE EQUIVALENTI, IL TERZO GIOCA LA PIU' BASSA DELLA SEQUENZA",
        },
        {
          type: "text",
          content:
            "Il Terzo deve anche evitare di bloccare il colore di attacco e ricordarsi di rigiocare nel colore del compagno a ogni occasione.",
        },
        {
          type: "rule",
          content:
            "LA CARTA GIOCATA DAL TERZO, QUANDO E' IMPEGNATA PER PRENDERE, ESCLUDE IL POSSESSO DELLA CARTA IMMEDIATAMENTE INFERIORE",
        },
      ],
    },
    {
      id: "2-4",
      title: "Pratica: Smazzate 2",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: Difesa",
        },
        {
          type: "text",
          content:
            "Gioca le 8 smazzate della Lezione 2 dal punto di vista dei difensori. Attacca nel colore giusto e collabora con il compagno!",
        },
      ],
    },
  ],
};

const lezione3: Lesson = {
  id: 3,
  worldId: 2,
  title: "Affrancamenti di lunga e di posizione",
  subtitle: "Impasse, expasse e colori lunghi",
  icon: "📏",
  smazzateIds: ["3-1", "3-2", "3-3", "3-4", "3-5", "3-6", "3-7", "3-8"],
  modules: [
    {
      id: "3-1",
      title: "L'affrancamento di lunga",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "L'Affrancamento di LUNGA",
        },
        {
          type: "text",
          content:
            "Possedendo un elevato numero di carte di un seme, dopo alcuni giri puo succedere che le carte rimaste, anche se piccole, si siano affrancate perche gli altri le avranno esaurite.",
        },
        {
          type: "text",
          content:
            "Le affrancabili di lunga dipendono da due fattori: a) la propria \"lunghezza\" massima, b) la \"divisione\" delle restanti carte nelle mani degli avversari.",
        },
        {
          type: "rule",
          content:
            "I colori lunghi sono sempre sorgenti di prese, anche se sono brutti (senza onori alti).",
        },
      ],
    },
    {
      id: "3-2",
      title: "L'affrancamento di posizione",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "L'Affrancamento di POSIZIONE",
        },
        {
          type: "text",
          content:
            "Un onore che al momento non e vincente potrebbe fornire una presa. Non giocatelo mai direttamente! Posizionatevi dalla parte opposta e giocate verso quell'onore.",
        },
        {
          type: "text",
          content:
            "Questa manovra (giocare \"verso\" un onore, protetto da una carta superiore) si chiama IMPASSE. La probabilita di successo e esattamente del 50%.",
        },
        {
          type: "text",
          content:
            "Molto simile come concetto e la manovra di EXPASSE: giocare verso un onore non protetto, sperando che la carta che lo puo superare sia posizionata prima e non dopo.",
        },
        {
          type: "quiz",
          content:
            "Hai AQ5 a Nord e 863 a Sud. Per fare l'impasse verso la Dama, da dove devi giocare?",
          options: ["Da Nord", "Da Sud", "Non importa", "Non si puo fare l'impasse"],
          correctAnswer: 1,
          explanation:
            "Devi giocare da Sud verso la Dama di Nord. Se il Re e in Ovest (prima della Dama), la tua Dama vincera!",
        },
        {
          type: "card-select",
          content: "Stai facendo l'impasse: hai ♠AQ5 a Nord e sei in Sud. Hai giocato ♠3 da Sud, Ovest gioca ♠4. Quale carta giochi da Nord?",
          cards: "♠A♠Q♠5",
          correctCard: "♠Q",
          explanation: "Giochi la Dama! L'impasse consiste nel giocare l'onore coperto (la Q) sperando che il Re sia in Ovest. Se fosse in Est, avresti comunque l'Asso come sicurezza.",
        },
        {
          type: "true-false",
          content: "L'impasse ha una probabilita di successo del 50%.",
          correctAnswer: 0,
          explanation: "Vero! La carta avversaria che cerchi (es. il Re) puo essere in una di due posizioni: favorevole o sfavorevole. La probabilita e quindi 50-50.",
        },
      ],
    },
    {
      id: "3-3",
      title: "Pratica: Smazzate 3",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: Lunga e Posizione",
        },
        {
          type: "text",
          content:
            "Gioca le 8 smazzate della Lezione 3. Cerca i colori lunghi da affrancare e le impasse da tentare!",
        },
      ],
    },
  ],
};

// ===== WORLD 2: IL GIOCANTE - Lezione 4 =====

const lezione4: Lesson = {
  id: 4,
  worldId: 2,
  title: "Il piano di gioco a senz'atout",
  subtitle: "Organizzare le manovre per raggiungere il contratto",
  icon: "🧭",
  smazzateIds: ["4-1", "4-2", "4-3", "4-4", "4-5", "4-6", "4-7", "4-8"],
  modules: [
    {
      id: "4-1",
      title: "Il metodo del piano di gioco",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Costruire un piano di gioco a Senz'atout",
        },
        {
          type: "text",
          content:
            "Avere un preciso obiettivo induce il Giocante a organizzare le sue manovre con un certo criterio per raggiungere il numero di prese dell'impegno. Solitamente il conto delle vincenti e molto lontano dall'obiettivo, quindi occorre lavorare per affrancare prese nuove.",
        },
        {
          type: "rule",
          content:
            "Il metodo parte da un semplice conto: quante prese ho a disposizione? Quante ne devo trovare per mantenere l'impegno? Il seguito e aritmetico: scegliere da quale o quali colori reperire le prese che mancano.",
        },
        {
          type: "example",
          content:
            "Sud gioca 3NT. Conta: 3 vincenti a Picche, 2 a Cuori, 1 a Fiori = 6. Servono altre 3 prese per arrivare a 9. Le Quadri (KQ1075) possono fornirle, una volta ceduto l'Asso.",
          cards: "♠86 ♥K5 ♦KQ1075 ♣872",
        },
        {
          type: "text",
          content:
            "A volte il colore di sviluppo e uno solo ed e evidente. Altre volte ci sono piu possibilita e bisogna scegliere quella migliore, considerando quante prese si devono cedere e i rischi connessi.",
        },
        {
          type: "quiz",
          content:
            "Sud gioca 3NT con 6 vincenti immediate. Quante prese deve ancora sviluppare?",
          options: ["2", "3", "4", "6"],
          correctAnswer: 1,
          explanation:
            "3NT richiede 9 prese. Con 6 vincenti, servono ancora 9 - 6 = 3 prese da sviluppare.",
        },
      ],
    },
    {
      id: "4-2",
      title: "Il rientro e le comunicazioni",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Salvaguardare i rientri",
        },
        {
          type: "text",
          content:
            "Quando il colore sorgente di prese e nella mano povera di ingressi, il Giocante deve cercare di affrancare il colore e conservare la possibilita di incassare quanto ha affrancato.",
        },
        {
          type: "rule",
          content:
            "IL RIENTRO (O INGRESSO) E UNA CARTA CHE CONSENTE DI FAR VINCERE LA PRESA ALLA MANO GIUSTA E NEL MOMENTO GIUSTO. Salvaguardate gli ingressi accanto alla lunga che volete affrancare!",
        },
        {
          type: "example",
          content:
            "Sud gioca 3NT. Attacco ♥2. Le Quadri possono dare 4 prese affrancate, ma il K♥ nel morto e l'unico rientro. Sud deve rifiutare la presa a Cuori due volte, vincendo solo alla terza, per conservare il K♥ come ingresso al morto.",
          cards: "♠86 ♥K5 ♦KQ1075 ♣872",
        },
        {
          type: "tip",
          content: "Il Colpo in Bianco",
          explanation:
            "Il Colpo in Bianco e la cessione immediata di una presa (che comunque si sarebbe ceduta dopo) allo scopo di mantenere le comunicazioni nel colore. E una manovra fondamentale a Senz'atout!",
        },
        {
          type: "quiz",
          content:
            "Perche il Giocante a volte rifiuta di vincere una presa che potrebbe prendere?",
          options: [
            "Per confondere gli avversari",
            "Per mantenere i rientri verso la mano con le carte affrancate",
            "Perche non ha carte abbastanza alte",
            "Non ha mai senso rifiutare una presa",
          ],
          correctAnswer: 1,
          explanation:
            "Rifiutare di prendere subito (Colpo in Bianco) serve a mantenere le comunicazioni: si conserva il rientro nella mano dove si trovano le carte da affrancare.",
        },
      ],
    },
    {
      id: "4-3",
      title: "Colori comunicanti e bloccati",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Evitare il blocco del colore",
        },
        {
          type: "text",
          content:
            "Si dice che un colore comunica quando e possibile trasferire la presa da una mano all'altra. Un colore e bloccato quando il lato corto contiene tutte le carte piu alte del lato lungo.",
        },
        {
          type: "example",
          content:
            "KQ72 su AJ83: l'incasso e fluido, 4 prese. Ma QJ109 su AK: il colore e bloccato, non si possono incassare tutte le vincenti!",
          cards: "KQ72 → AJ83 (fluido) | QJ109 → AK (bloccato)",
        },
        {
          type: "rule",
          content:
            "GIOCATE PER PRIMI GLI ONORI DEL LATO CORTO. Per evitare di bloccare i colori, iniziate con gli onori dalla parte che ne ha di meno.",
        },
        {
          type: "example",
          content:
            "Con K2 su AQJ43: iniziate con il Re, poi giocate il 2 per dare la presa alle altre vincenti della mano lunga.",
          cards: "K2 → AQJ43",
        },
        {
          type: "text",
          content:
            "A volte il blocco non e irrimediabile: se nella parte lunga esiste un rientro in un altro colore, si puo usare quello per superare il blocco e incassare le carte affrancate.",
        },
        {
          type: "quiz",
          content:
            "Hai AK a Nord e QJ1095 a Sud. Come eviti di bloccare il colore?",
          options: [
            "Giochi prima la Q da Sud",
            "Giochi prima l'A e poi il K da Nord",
            "Non importa l'ordine",
            "Giochi una carta piccola da entrambi i lati",
          ],
          correctAnswer: 1,
          explanation:
            "Devi giocare prima gli onori del lato corto (A e K da Nord), poi passare a Sud per incassare le rimanenti QJ109. Regola: prima gli onori del lato corto!",
        },
      ],
    },
    {
      id: "4-4",
      title: "La scelta tra piu colori",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Quale colore sviluppare per primo?",
        },
        {
          type: "text",
          content:
            "Quando avete la possibilita di vincere l'attacco al Morto o in mano, valutate prima cosa intendete fare subito dopo: vi aiutera a prendere dalla parte giusta.",
        },
        {
          type: "example",
          content:
            "Sud gioca 3NT. Attacco ♦2. Conta 3 vincenti a Picche, 1 a Cuori, 2 a Quadri, 1 a Fiori. Deve trovare 2 prese: le Fiori offrono 3-4 affrancabili (impasse al Re). Da che parte conviene muovere le Fiori? Da Nord verso Sud, per sottomettere l'eventuale Re.",
          cards: "♠763 ♥864 ♦A653 ♣QJ3",
        },
        {
          type: "text",
          content:
            "Nella corsa all'affrancamento gli avversari partono in vantaggio e approfitteranno di ogni occasione per proseguire nel loro colore. Non fate i conti senza l'oste: le prese che rimangono dopo che i difensori ne avranno incassate abbastanza per farvi fallire l'obiettivo sono le uniche che contano.",
        },
        {
          type: "tip",
          content: "Consiglio del Maestro",
          explanation:
            "Quando avete due colori di sviluppo possibili, scegliete quello che richiede di cedere meno prese. Se sono equivalenti, preferite quello che offre piu prese affrancate.",
        },
        {
          type: "quiz",
          content:
            "Sud gioca 3NT con 5 vincenti. Ha due colori di sviluppo: Fiori (4 affrancabili cedendo 1 presa) e Quadri (5 affrancabili cedendo 2 prese). Gli avversari hanno gia 3 prese pronte. Quale colore sceglie?",
          options: [
            "Quadri, perche danno piu prese",
            "Fiori, perche cede solo 1 presa e gli avversari non arriveranno a 5",
            "Non importa",
            "Nessuno dei due",
          ],
          correctAnswer: 1,
          explanation:
            "Fiori! Se sviluppi Quadri cedi 2 prese, e gli avversari con le loro 3 pronte ne farebbero 5: contratto battuto. Con Fiori cedi solo 1 presa: gli avversari arrivano a 4, tu fai le tue 9.",
        },
      ],
    },
    {
      id: "4-5",
      title: "Pratica: Smazzate 4",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: Piano di Gioco a SA",
        },
        {
          type: "text",
          content:
            "Gioca le smazzate della Lezione 4. Prima di muovere, fai sempre il conto: vincenti, prese mancanti, colore di sviluppo, rientri. Attenzione ai blocchi!",
        },
        {
          type: "tip",
          content: "Promemoria del piano di gioco",
          explanation:
            "1) Conta le vincenti. 2) Calcola quante prese ti mancano. 3) Scegli il colore di sviluppo. 4) Verifica i rientri. 5) Attenzione ai blocchi. 6) Solo dopo, gioca la prima carta!",
        },
      ],
    },
  ],
};

// ===== WORLD 2: IL GIOCANTE - Lezione 5 =====

const lezione5: Lesson = {
  id: 5,
  worldId: 2,
  title: "Il gioco con l'atout",
  subtitle: "Taglio, battuta e allungamento",
  icon: "⚔️",
  smazzateIds: ["5-1", "5-2", "5-3", "5-4", "5-5", "5-6", "5-7", "5-8"],
  modules: [
    {
      id: "5-1",
      title: "Il fit e il ruolo dell'atout",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Perche giocare con l'atout?",
        },
        {
          type: "text",
          content:
            "Nel gioco in atout si realizzano prese non solo con le carte alte ma anche con le cartine di atout. Questo rende preferibile il gioco a colore rispetto al Senz'atout, a condizione che la coppia abbia un numero di carte pari o superiore a 8 in un seme. Questo si chiama FIT.",
        },
        {
          type: "rule",
          content:
            "Se c'e un fit conveniente (♥ o ♠: 30 punti ogni presa), si gioca con questo atout. Se non c'e fit a ♥ o ♠, si gioca a Senz'atout. Se non e possibile giocare a SA, si gioca a ♣ o ♦ (20 punti ogni presa).",
        },
        {
          type: "text",
          content:
            "Il fatto di aver scelto quale atout rappresenta quasi sempre una rivalutazione per un colore, a maggior ragione se e composto da carte deboli. Ad esempio: ♠543 ♥QJ10987 ♦654 ♣2. A Senza queste carte sono quasi inutili, ma se Cuori fosse atout avremmo la certezza di almeno 4 prese!",
        },
        {
          type: "quiz",
          content:
            "Quante carte in un seme deve avere la coppia per considerarlo un buon fit?",
          options: ["6", "7", "8 o piu", "10"],
          correctAnswer: 2,
          explanation:
            "Si parla di FIT quando la coppia possiede almeno 8 carte in un seme. Con 8+ carte conviene giocare con quel seme come atout.",
        },
      ],
    },
    {
      id: "5-2",
      title: "Battere le atout",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Battere le atout: togliere le armi al nemico",
        },
        {
          type: "text",
          content:
            "Le vincenti nei colori a lato delle atout sono vincenti RELATIVE: il Giocante le potra liberamente incassare SOLO QUANDO avra eliminato le atout in mano agli avversari. Questa operazione e detta \"battere le atout\".",
        },
        {
          type: "rule",
          content:
            "Se avete vincenti o affrancabili \"lunghe\", e inevitabile che prima o poi dobbiate battere le atout, cioe togliere di mezzo quelle che hanno gli avversari. Diversamente, taglieranno le vostre carte buone!",
        },
        {
          type: "example",
          content:
            "Sud gioca 4♥. Attacco: A♠ e K♠. Sud taglia con una Cuori. Se provasse subito a incassare le Quadri vincenti (KQJ2), Ovest taglierebbe al terzo giro. Invece Sud deve prima battere le atout (3 giri di Cuori), e solo dopo incassare le Quadri in sicurezza.",
          cards: "♠874 ♥109 ♦KQJ2 ♣AK63",
        },
        {
          type: "quiz",
          content:
            "Perche il Giocante deve battere le atout prima di incassare le vincenti laterali?",
          options: [
            "Per fare piu prese",
            "E obbligatorio per regolamento",
            "Per evitare che gli avversari taglino le sue carte buone",
            "Non deve farlo, e sempre meglio tagliare subito",
          ],
          correctAnswer: 2,
          explanation:
            "Se non si eliminano le atout avversarie, i difensori potrebbero tagliare le nostre vincenti nei colori laterali, impedendoci di incassarle.",
        },
      ],
    },
    {
      id: "5-3",
      title: "Il potere di taglio e di allungamento",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Tagliare per guadagnare prese",
        },
        {
          type: "text",
          content:
            "Il taglio puo interrompere le vincenti dell'avversario. Il taglio puo essere effettuato sia dalla mano che dal morto. Ovviamente la prima mano a poterlo esercitare sara quella che per prima esaurisce le carte nel colore giocato.",
        },
        {
          type: "text",
          content:
            "Il Potere di Controllo: quando si taglia con l'atout una vincente avversaria, non si guadagnano prese supplementari se si sarebbe comunque fatta quella presa con l'atout. Il vero guadagno e l'allungamento.",
        },
        {
          type: "rule",
          content:
            "IL POTERE DI ALLUNGAMENTO DELLE ATOUT E DATO DALLA POSSIBILITA CHE ESSE OFFRONO, TAGLIANDO, DI FAR AUMENTARE LE PRESE NEL COLORE DI ATOUT. Si realizza un allungamento solo quando il taglio aumenta di almeno una le prese rispetto all'incasso normale.",
        },
        {
          type: "example",
          content:
            "Sud gioca 4♠. Con ♠1095 al morto e ♠AKQJ73 in mano, le prese normali sono 6 a Picche. Ma tagliando 2 Cuori con le Picche del Morto, Sud ottiene 8 prese dal colore di atout!",
          cards: "♠1095 ♥4 ♦A762 ♣A10842",
        },
        {
          type: "quiz",
          content:
            "Quando il taglio con l'atout produce un vero \"allungamento\"?",
          options: [
            "Sempre",
            "Solo quando si taglia dalla mano lunga",
            "Quando il taglio aumenta il numero di prese rispetto all'incasso normale del colore",
            "Mai, il taglio non aggiunge prese",
          ],
          correctAnswer: 2,
          explanation:
            "L'allungamento si verifica quando, tagliando dalla parte corta dell'atout, si ottengono piu prese di quante se ne farebbero semplicemente incassando il colore. Tagliare dalla mano lunga normalmente non aggiunge prese.",
        },
      ],
    },
    {
      id: "5-4",
      title: "Il potere di affrancamento",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Affrancare tagliando",
        },
        {
          type: "text",
          content:
            "Il potere di affrancamento consente, tagliando, di affrancare cartine di un colore lungo senza cedere prese all'avversario. E una delle manovre piu potenti del gioco a colore.",
        },
        {
          type: "example",
          content:
            "Sud gioca 4♠. Attacco ♦K. Vincenti: 6♠ + 1♥ + 1♦ + 2♣ = 10. Ma le Fiori del morto (A98753) sono una miniera! Sud batte le atout, incassa A♣ e taglia una ♣: se i resti avversari sono 3-2, le tre Fiori restanti del Morto sono franche!",
          cards: "♠KJ3 ♥A7 ♦65 ♣A98753",
        },
        {
          type: "rule",
          content:
            "IL POTERE DI AFFRANCAMENTO CONSENTE, TAGLIANDO, DI AFFRANCARE CARTINE DI UN COLORE LUNGO SENZA CEDERE PRESE ALL'AVVERSARIO.",
        },
        {
          type: "quiz",
          content:
            "Al morto ci sono 6 carte di Fiori (A98753) e in mano K2. Dopo aver incassato A e K e tagliato una volta, i resti avversari (5 carte) erano divisi 3-2. Quante Fiori franche restano al morto?",
          options: ["1", "2", "3", "4"],
          correctAnswer: 2,
          explanation:
            "Partendo da 6 carte al morto: incassato A (resta 5), incassato K (resta 4), tagliata una (resta 3). Con i resti 3-2, gli avversari hanno esaurito le Fiori: le 3 rimaste del Morto sono tutte franche!",
        },
      ],
    },
    {
      id: "5-5",
      title: "Pratica: Smazzate 5",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: Gioco con l'Atout",
        },
        {
          type: "text",
          content:
            "Gioca le smazzate della Lezione 5. Decidi quando battere le atout e quando e meglio tagliare prima. Cerca le occasioni di allungamento e affrancamento!",
        },
        {
          type: "tip",
          content: "La domanda chiave",
          explanation:
            "Prima di battere le atout chiediti: ho bisogno di tagliare dalla parte corta? Se si, fai i tagli PRIMA di battere. Se no, batti subito le atout per proteggere le tue vincenti laterali.",
        },
      ],
    },
  ],
};

// ===== WORLD 2: IL GIOCANTE - Lezione 6 =====

const lezione6: Lesson = {
  id: 6,
  worldId: 2,
  title: "Il piano di gioco con l'atout",
  subtitle: "Battere o non battere? La strategia completa",
  icon: "📋",
  smazzateIds: ["6-1", "6-2", "6-3", "6-4", "6-5", "6-6", "6-7", "6-8"],
  modules: [
    {
      id: "6-1",
      title: "Vincenti lunghe o tagli?",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "La prima valutazione: lunghe o tagli?",
        },
        {
          type: "text",
          content:
            "Se il vostro contratto e ad atout, ricordatevi che la possibilita di tagliare e data anche all'avversario, e ne fara uso se glielo permetterete. La prima valutazione riguarda i colori che avete a lato delle atout.",
        },
        {
          type: "text",
          content:
            "Se avete vincenti o affrancabili \"lunghe\", e inevitabile che prima o poi dobbiate battere le atout. Diversamente, taglieranno le vostre carte buone. Se invece avete solo vincenti o affrancabili \"corte\", cercate di fare il maggior numero possibile di prese facendo dei tagli.",
        },
        {
          type: "rule",
          content:
            "Con affrancabili lunghe: BATTI LE ATOUT, poi incassa. Con sole affrancabili corte: TAGLIA dalla parte corta per aggiungere prese.",
        },
        {
          type: "example",
          content:
            "Sud gioca 4♠. Attacco ♦K. Ha 5 a ♠, 5 a ♣ (AJ1082). Le Fiori sono lunghe e affrancabili. Bisogna battere le atout, poi giocare fiori per affrancarle. Se tagliasse subito, perderebbe il controllo.",
          cards: "♠AQ8 ♥54 ♦432 ♣AJ1082",
        },
        {
          type: "quiz",
          content:
            "Con affrancabili \"lunghe\" nei colori laterali, qual e la strategia corretta?",
          options: [
            "Tagliare subito dalla parte corta",
            "Battere le atout prima, poi incassare le lunghe",
            "Non battere mai le atout",
            "Giocare a caso",
          ],
          correctAnswer: 1,
          explanation:
            "Quando hai carte lunghe affrancabili, devi prima eliminare le atout avversarie per evitare che taglino le tue vincenti. Solo dopo puoi incassare tranquillamente.",
        },
      ],
    },
    {
      id: "6-2",
      title: "Costruire il taglio",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Preparare i tagli dalla parte corta",
        },
        {
          type: "text",
          content:
            "La possibilita di taglio non e sempre immediata: e il Giocante che deve adoperarsi per costruirla, cedendo le prese del caso. Se la parte corta dell'atout ha ancora carte nel colore che si vuole tagliare, bisogna prima eliminarle.",
        },
        {
          type: "example",
          content:
            "Atout ♠. Nord ha ♥32 e Sud ha ♥A74. Sud gioca A♥ e poi cede una Cuori: ora Nord non ha piu Cuori e puo tagliare la terza con una Picca del morto.",
          cards: "♠654 ♥32 → ♠AKQ32 ♥A74",
        },
        {
          type: "rule",
          content:
            "ASPETTATE A BATTERE LE ATOUT SE AVETE BISOGNO DI FARE TAGLI DALLA PARTE CORTA. Prima fate i tagli necessari, poi procedete con la battuta.",
        },
        {
          type: "text",
          content:
            "A volte anche un solo giro di atout sarebbe fatale: se l'avversario entra in presa a Cuori e gioca atout, addio taglio! Quindi fate prima cio che e urgente (i tagli), poi battete.",
        },
        {
          type: "quiz",
          content:
            "Al morto ci sono ♥32 e in mano ♥A74. Quante prese di Cuori devi giocare prima di poter tagliare dal morto?",
          options: ["0", "1", "2", "3"],
          correctAnswer: 2,
          explanation:
            "Devi giocare A♥ (prima presa) e poi cedere una Cuori (seconda presa). A quel punto il morto non ha piu Cuori e puo tagliare la terza con l'atout.",
        },
      ],
    },
    {
      id: "6-3",
      title: "Decidere quando battere le atout",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Battere subito o aspettare?",
        },
        {
          type: "text",
          content:
            "Decidere di battere atout non significa farlo subito! Se avete bisogno di fare tagli dalla parte corta, aspettate. Ci puo essere qualche altra cosa urgente da fare prima di battere.",
        },
        {
          type: "example",
          content:
            "Sud gioca 4♠. Ovest attacca ♥K. Teoricamente 10 prese: 4 atout, 1♥, 3♦, 2 affrancabili a ♣. Ma dopo l'attacco, i difensori hanno affrancato 2 prese a Cuori. Se Sud prende con l'A♥ e gioca atout, l'A♠ e in mano ai nemici che incasseranno le Cuori e poi A♣. Soluzione: scartare carte perdenti prima!",
          cards: "♠K952 ♥853 ♦AQ5 ♣K65",
        },
        {
          type: "rule",
          content:
            "QUANDO IL VOSTRO PIANO DI GIOCO PREVEDE DI CEDERE LA PRESA, CHIEDETEVI SEMPRE COSA FARA L'AVVERSARIO. Anticipate le sue mosse per non perdere il controllo.",
        },
        {
          type: "quiz",
          content:
            "Giochi 4♠. Hai bisogno di tagliare una Cuori dal morto. L'avversario ha l'A♠. Cosa fai per primo?",
          options: [
            "Batti le atout per eliminare quelle avversarie",
            "Fai il taglio di Cuori prima di battere le atout",
            "Incassi le vincenti laterali",
            "Giochi una carta qualsiasi",
          ],
          correctAnswer: 1,
          explanation:
            "Se batti le atout, l'avversario con l'Asso prendera e potra giocare atout lui stesso, togliendoti la possibilita di taglio. Meglio fare prima il taglio, poi battere le atout.",
        },
      ],
    },
    {
      id: "6-4",
      title: "Consigli per i difensori ad atout",
      duration: "4",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "La difesa nei contratti a colore",
        },
        {
          type: "text",
          content:
            "Quando si gioca ad atout non ha piu molto senso cercare di affrancare il proprio colore lungo, perche quand'anche ci si riuscisse il giocante taglierebbe le nostre vincenti. A volte sara meglio cercare di affrancare prese rapide, o sperare nei tagli.",
        },
        {
          type: "rule",
          content:
            "SE IL CONTRATTO AVVERSARIO E AD ATOUT, PER L'ATTACCO DA SEQUENZA BASTANO DUE ONORI CONTIGUI (KQ, QJ, J10). Quando si attacca da due carte, si sceglie sempre la piu alta.",
        },
        {
          type: "text",
          content:
            "Non attaccate mai \"sotto asso\" se il contratto e ad atout: rischiate di regalare una presa che non tornera piu. Quello che non si deve mai fare e attaccare sotto asso in un contratto a colore.",
        },
        {
          type: "quiz",
          content:
            "Il contratto e 4♥. Hai ♠KQ74. Qual e l'attacco corretto?",
          options: [
            "Il 4 di Picche (quarta migliore)",
            "Il Re di Picche (dall'alto della sequenza)",
            "Il 7 di Picche",
            "Non si attacca a Picche",
          ],
          correctAnswer: 1,
          explanation:
            "Nei contratti a colore, con KQ basta la sequenza di due onori per attaccare dall'alto. Si attacca con il Re, promettendo la Dama (e negando l'Asso).",
        },
      ],
    },
    {
      id: "6-5",
      title: "Pratica: Smazzate 6",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: Piano di Gioco ad Atout",
        },
        {
          type: "text",
          content:
            "Gioca le smazzate della Lezione 6. In ogni mano chiediti: ho affrancabili lunghe o corte? Devo battere subito le atout o prima tagliare? Cosa fara l'avversario quando entrera in presa?",
        },
        {
          type: "tip",
          content: "Checklist del piano di gioco ad atout",
          explanation:
            "1) Conta le vincenti (incluse le atout). 2) Prese mancanti: servono tagli o affrancamenti? 3) Se servono tagli: NON battere subito le atout. 4) Se servono affrancamenti lunghi: BATTI prima le atout. 5) Anticipa la mossa dell'avversario.",
        },
      ],
    },
  ],
};

// ===== WORLD 4: LA DICHIARAZIONE - Lezione 7 =====

const lezione7: Lesson = {
  id: 7,
  worldId: 4,
  title: "La valutazione della mano",
  subtitle: "Punti onori, apertura e scelta del colore",
  icon: "⚖️",
  smazzateIds: [],
  modules: [
    {
      id: "7-1",
      title: "Il conteggio dei punti onori",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Il sistema dei punti di Milton Work",
        },
        {
          type: "text",
          content:
            "Le carte che statisticamente realizzano piu frequentemente le prese sono gli assi e le tre figure di ogni colore. Un giocatore americano, Milton Work, ha attribuito a queste carte un valore numerico per avere un riferimento statistico:",
        },
        {
          type: "rule",
          content:
            "Asso (A) = 4 punti | Re (K) = 3 punti | Donna (Q) = 2 punti | Fante (J) = 1 punto. In ogni seme ci sono 10 punti (A+K+Q+J) e un totale di 40 punti nel mazzo.",
        },
        {
          type: "example",
          content:
            "Esempio di conteggio: ♠AQ854 ♥K9 ♦J87 ♣AKJ = 4+2+3+1+4+3+1 = 18 punti onori.",
          cards: "♠AQ854 ♥K9 ♦J87 ♣AKJ",
        },
        {
          type: "text",
          content:
            "Statisticamente la coppia che possiede piu punti e in grado di realizzare piu prese dell'altra. Come riferimento: con 20-24 punti coppia si fanno contratti parziali; con 25-31 contratti di manche; con 32-36 piccoli slam; con 37+ grandi slam.",
        },
        {
          type: "quiz",
          content:
            "Quanti punti onori ha questa mano? ♠KJ73 ♥AQ5 ♦K84 ♣Q92",
          options: ["12", "14", "15", "16"],
          correctAnswer: 1,
          explanation:
            "♠ K(3)+J(1)=4 | ♥ A(4)+Q(2)=6 | ♦ K(3)=3 | ♣ Q(2)=2. Totale: 4+6+3+1 = 14 punti. (Il 9 non vale nulla nel conteggio dei punti onori.)",
        },
        {
          type: "hand-eval",
          content: "Conta i punti onori di questa mano:",
          cards: "♠AJ84 ♥KQ73 ♦A92 ♣J5",
          correctValue: 15,
          explanation: "♠ A(4)+J(1)=5 | ♥ K(3)+Q(2)=5 | ♦ A(4)=4 | ♣ J(1)=1. Totale: 5+5+4+1 = 15 punti onori.",
        },
      ],
    },
    {
      id: "7-2",
      title: "Quando aprire la dichiarazione",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "La decisione di aprire",
        },
        {
          type: "text",
          content:
            "L'apertura e la prima dichiarazione diversa da Passo fatta al tavolo. Aprire e una libera scelta, non un obbligo. La decisione di Aprire o Passare dipende dalla Forza della mano.",
        },
        {
          type: "rule",
          content:
            "SI APRE CON ALMENO 12 PUNTI ONORI. Con 13 punti si apre SEMPRE. Con 12 punti si apre QUASI SEMPRE. Con 11 punti si apre QUALCHE VOLTA (se gli onori sono ben concentrati). Con 0-10 punti: PASSO.",
        },
        {
          type: "text",
          content:
            "La forza della mano determina anche il LIVELLO in cui si apre: da 12 a 20 punti si apre a livello 1 (1♣, 1♦, 1♥, 1♠, 1NT). Da 21 punti in su si apre a livello 2 (2♣, 2♦, 2♥, 2♠, 2NT).",
        },
        {
          type: "tip",
          content: "11 punti: come decidere?",
          explanation:
            "Con 11 punti, valutate la qualita degli onori. Onori concentrati nei colori lunghi e prese rapide (Assi) sono buoni. Onori secchi (Q o J da soli) e senza prese rapide sono cattivi. In pratica: 11 punti NON ESISTONO, o sono 10 o sono 12!",
        },
        {
          type: "quiz",
          content:
            "Hai ♠93 ♥J7 ♦KQJ75 ♣K753. Sono 10 punti. Cosa fai?",
          options: [
            "Apri 1♦",
            "Apri 1♣",
            "Passi",
            "Apri 1NT",
          ],
          correctAnswer: 2,
          explanation:
            "Con 10 punti onori si passa. Non si hanno i requisiti minimi per aprire (almeno 12 punti). Anche se i Quadri sono belli, la forza complessiva e insufficiente.",
        },
        {
          type: "hand-eval",
          content: "Conta i punti di questa mano. Apriresti?",
          cards: "♠A93 ♥KJ72 ♦Q84 ♣K53",
          correctValue: 13,
          explanation: "♠ A(4)=4 | ♥ K(3)+J(1)=4 | ♦ Q(2)=2 | ♣ K(3)=3. Totale: 4+4+2+3 = 13 punti. Con 13 punti si apre SEMPRE!",
        },
        {
          type: "bid-select",
          content: "Hai ♠93 ♥AK752 ♦Q84 ♣KJ3 (13 punti, distribuzione 5332). Cosa apri?",
          cards: "♠93 ♥AK752 ♦Q84 ♣KJ3",
          options: ["1H", "1NT", "1D", "P"],
          correctAnswer: 0,
          explanation: "Con 13 punti e distribuzione 5332, non sei nel range 15-17 per 1NT. Apri 1♥, il tuo colore piu lungo!",
        },
      ],
    },
    {
      id: "7-3",
      title: "La distribuzione e la scelta del colore",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Mani bilanciate e sbilanciate",
        },
        {
          type: "text",
          content:
            "Il TIPO di apertura e determinato dalla DISTRIBUZIONE. La distribuzione di una mano e l'insieme delle lunghezze dei quattro semi. Le distribuzioni bilanciate sono tre: 4333, 4432 e 5332.",
        },
        {
          type: "rule",
          content:
            "Con mani bilanciate da 15 a 17 punti: apri 1NT. Con mani bilanciate da 12-14 o 18-20: apri di 1 a colore. Con mani sbilanciate: apri sempre di 1 a colore.",
        },
        {
          type: "text",
          content:
            "Per le aperture a colore, la regola generale e: SI APRE NEL SEME PIU LUNGO POSSEDUTO. Con semi di diversa lunghezza: apri nel piu lungo. Con due semi di 5 carte: apri nel piu alto di rango. Con due o tre semi di 4 carte: apri nel piu basso di rango.",
        },
        {
          type: "example",
          content:
            "♠K2 ♥4 ♦KJ876 ♣AQ873 → 1♦ (due quinti, apri nel piu alto). ♠AQJ3 ♥KJ62 ♦Q7 ♣853 → 1♣ (due quarti, apri nel piu basso). ♠53 ♥AJ4 ♦K9 ♣AJ10762 → 1♣ (un colore lungo).",
          cards: "♠K2 ♥4 ♦KJ876 ♣AQ873 → 1♦",
        },
        {
          type: "quiz",
          content:
            "Hai ♠AKJ8 ♥Q982 ♦K8 ♣AQ3 (17 punti, distribuzione 4432). Cosa apri?",
          options: ["1♠", "1♥", "1♣", "1NT"],
          correctAnswer: 3,
          explanation:
            "Con una mano bilanciata (4432) e 17 punti si apre 1NT! L'apertura di 1NT (15-17 punti, mano bilanciata) prevale sempre sull'apertura a colore.",
        },
        {
          type: "bid-select",
          content: "Hai ♠K2 ♥4 ♦KJ876 ♣AQ873 (13 punti, due quinti). Cosa apri?",
          cards: "♠K2 ♥4 ♦KJ876 ♣AQ873",
          options: ["1C", "1D", "1H", "1NT"],
          correctAnswer: 1,
          explanation: "Con due colori di 5 carte, si apre nel piu alto di rango: 1♦ (i Quadri hanno rango superiore ai Fiori). Cosi nella ridichiara potrai mostrare anche i Fiori!",
        },
        {
          type: "bid-select",
          content: "Hai ♠AQJ3 ♥KJ62 ♦Q73 ♣85 (12 punti, due quarti nobili). Cosa apri?",
          cards: "♠AQJ3 ♥KJ62 ♦Q73 ♣85",
          options: ["1S", "1H", "1D", "1NT"],
          correctAnswer: 1,
          explanation: "Con due quarti nobili (♠ e ♥), apri nel piu basso: 1♥. In ridichiara potrai dire 1♠ senza salire di livello!",
        },
      ],
    },
    {
      id: "7-4",
      title: "Le aperture forti: livello 2",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Aperture a livello 2 e di barrage",
        },
        {
          type: "text",
          content:
            "Le aperture a livello 2 (2♦, 2♥, 2♠) mostrano mani troppo forti per il livello 1: punti onori 21+ oppure una mano che suggerisce 8-9 vincenti. Se sono sbilanciate si apre nel colore lungo; se sono bilanciate (21-23 punti): 2NT.",
        },
        {
          type: "rule",
          content:
            "L'apertura di 2♣ e speciale: e un \"contenitore\" per due tipi di mano — la bilanciata fortissima (24+) e la mano a base fiori. SULLE APERTURE DI 2 A COLORE E VIETATO DIRE PASSO dal rispondente.",
        },
        {
          type: "text",
          content:
            "Le aperture di barrage (livello 3 e 4) sono riservate a mani con un colore molto lungo (almeno 7 carte) capeggiato da almeno due onori, e nient'altro a lato. Il messaggio e: \"faccio da solo 3 prese in meno di quelle che dichiaro\".",
        },
        {
          type: "example",
          content:
            "♠AKQ9653 ♥2 ♦65 ♣873 → 4♠ (7 vincenti a Picche). ♠- ♥843 ♦KQJ8763 ♣972 → 3♦ (6 vincenti a Quadri).",
          cards: "♠AKQ9653 ♥2 ♦65 ♣873 → 4♠",
        },
        {
          type: "quiz",
          content:
            "Hai ♠AQJ975 ♥AKJ ♦5 ♣KQ4. Sono 20 punti con 8 vincenti circa. Come apri?",
          options: ["1♠", "2♠", "2♣", "2NT"],
          correctAnswer: 1,
          explanation:
            "Con 20 punti e una mano sbilanciata con almeno 8 vincenti, si apre a livello 2 nel proprio colore lungo: 2♠. Non 1♠ (troppo forte), non 2♣ (riservata alle bilanciate 24+ o alle mani a base fiori), non 2NT (non e bilanciata).",
        },
      ],
    },
  ],
};

// ===== WORLD 4: LA DICHIARAZIONE - Lezione 8 =====

const lezione8: Lesson = {
  id: 8,
  worldId: 4,
  title: "L'apertura e la risposta",
  subtitle: "Le aperture di 1NT e 2NT e le risposte del compagno",
  icon: "💬",
  smazzateIds: [],
  modules: [
    {
      id: "8-1",
      title: "L'apertura di 1NT",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Requisiti per l'apertura di 1NT",
        },
        {
          type: "text",
          content:
            "Le aperture di 1NT (15-17) e 2NT (21-23) sono aperture speciali riservate a mani bilanciate (4333, 4432, 5332). Promettono almeno 2 carte in qualunque colore.",
        },
        {
          type: "rule",
          content:
            "Si apre di 1NT quando si ha una forza onori di 15, 16 o 17 punti e una distribuzione bilanciata. Se una mano ha i requisiti per 1NT, tale apertura prevale sull'apertura di 1 a colore.",
        },
        {
          type: "text",
          content:
            "Il Rispondente decide il contratto: e il CAPITANO. Sapendo che l'apertore ha 15-17, il rispondente contera i propri punti e avra un'idea abbastanza precisa della somma sulla linea, decidendo di conseguenza il livello di contratto conveniente.",
        },
        {
          type: "example",
          content:
            "♠KQ76 ♥AQ62 ♦KQ7 ♣98 → 1NT (16 punti, bilanciata 4432). ♠J6 ♥KQ7 ♦KJ2 ♣AJ854 → 1NT (15 punti, bilanciata 5332).",
          cards: "♠KQ76 ♥AQ62 ♦KQ7 ♣98 → 1NT",
        },
        {
          type: "quiz",
          content:
            "Hai ♠AJ5 ♥KQ73 ♦A84 ♣K92 (17 punti, 4333). Cosa apri?",
          options: ["1♥", "1♣", "1NT", "Passo"],
          correctAnswer: 2,
          explanation:
            "Con 17 punti e distribuzione bilanciata (4333) si apre 1NT. L'apertura di 1NT prevale sempre su quella a colore quando ne hai i requisiti!",
        },
        {
          type: "hand-eval",
          content: "Conta i punti di questa mano. E un'apertura di 1NT?",
          cards: "♠KQ8 ♥AJ73 ♦Q92 ♣K85",
          correctValue: 15,
          explanation: "♠ K(3)+Q(2)=5 | ♥ A(4)+J(1)=5 | ♦ Q(2)=2 | ♣ K(3)=3. Totale: 5+5+2+3 = 15. Si, e un'apertura di 1NT (15-17, bilanciata 4333)!",
        },
      ],
    },
    {
      id: "8-2",
      title: "Le risposte a 1NT",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Come rispondere all'apertura di 1NT",
        },
        {
          type: "text",
          content:
            "Il rispondente valuta la somma dei punti sulla linea (i propri + 15-17 dell'apertore) e decide il livello finale. Le risposte si dividono in conclusive, invitanti e forzanti.",
        },
        {
          type: "rule",
          content:
            "Risposte CONCLUSIVE (l'apertore passa): 4♥, 4♠, 3NT (manche trovata). Oppure 2♥, 2♠ (parziale minimo, la mano e debole). Risposte INVITANTI (l'apertore decide se rialzare): 2NT, 3♥, 3♠ (\"rialza con il massimo, altrimenti passa\").",
        },
        {
          type: "text",
          content:
            "Decisioni facili: con un fit maggiore sicuro e punti per manche (25+), dichiara direttamente 4♥ o 4♠. Con punti per manche ma senza fit, dichiara 3NT. Con mano debole (0-7 punti) e un colore lungo di almeno 5 carte, puoi \"scappare\" a 2♥ o 2♠.",
        },
        {
          type: "example",
          content:
            "Il compagno apre 1NT. Hai ♠AQ8743 ♥K5 ♦J42 ♣76. Sai che c'e fit a Picche (almeno 8 carte) e punti per manche (25-27). Rispondi 4♠ direttamente!",
          cards: "♠AQ8743 ♥K5 ♦J42 ♣76 → 4♠",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1NT (15-17). Hai ♠876 ♥J109652 ♦42 ♣76 (2 punti). Cosa rispondi?",
          options: ["Passo", "2♥", "3♥", "4♥"],
          correctAnswer: 1,
          explanation:
            "Con 2 punti la manche e irraggiungibile (17+2=19, lontano da 25). Ma con 6 carte di Cuori, giocare 2♥ e molto meglio che lasciare il compagno a 1NT. La risposta 2♥ a colore e conclusiva: l'apertore deve passare.",
        },
        {
          type: "bid-select",
          content: "Il compagno apre 1NT. Hai ♠AK9753 ♥Q4 ♦K62 ♣83 (12 punti, 6 Picche). Cosa rispondi?",
          cards: "♠AK9753 ♥Q4 ♦K62 ♣83",
          options: ["2S", "3S", "4S", "3NT"],
          correctAnswer: 2,
          explanation: "Con 12 punti e 6 Picche, la somma e 27-29: manche sicura! Con un colore di almeno 6 carte, il fit e garantito (l'apertore di 1NT ha almeno 2 Picche). Rispondi direttamente 4♠!",
        },
      ],
    },
    {
      id: "8-3",
      title: "La Stayman",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "L'interrogativa Stayman: 2♣",
        },
        {
          type: "text",
          content:
            "Quando il Rispondente non ha abbastanza informazioni per decidere il contratto, puo usare una dichiarazione convenzionale speciale: \"2 Fiori\" (detta \"Stayman\", dal nome del suo inventore). Chiede all'Apertore quali colori nobili quarti possiede.",
        },
        {
          type: "rule",
          content:
            "Si usa Stayman con almeno 8 punti e 4/5 carte in un colore nobile. Le risposte dell'Apertore: 2♦ = \"non ho ne 4 Cuori ne 4 Picche\"; 2♥ = \"ho 4 Cuori (e meno di 4 Picche)\"; 2♠ = \"ho 4 Picche (e meno di 4 Cuori)\"; 2NT = \"ho 4 Cuori e 4 Picche\".",
        },
        {
          type: "example",
          content:
            "Ovest apre 1NT. Est ha ♠KJ76 ♥A842 ♦65 ♣K83. Est dice 2♣ (Stayman). Ovest risponde 2♥ (\"ho 4 Cuori\"). Est dichiara 4♥: fit trovato, punti per manche!",
          cards: "♠KJ76 ♥A842 ♦65 ♣K83 → 2♣ (Stayman)",
        },
        {
          type: "text",
          content:
            "Dopo la risposta alla Stayman ci sono tre scenari: fit 4-4 trovato → dichiarare manche (o slam). Fit non trovato → dichiarare a NT proporzionalmente alla forza. Fit 5-3 ancora possibile → il rispondente dichiara la sua quinta.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1NT. Hai ♠Q942 ♥J1042 ♦K5 ♣KQ3 (11 punti, due quarte nobili). Cosa rispondi?",
          options: [
            "3NT direttamente",
            "2♣ (Stayman)",
            "2♥",
            "Passo",
          ],
          correctAnswer: 1,
          explanation:
            "Con 11 punti e due colori nobili quarti, usa la Stayman (2♣) per cercare il fit 4-4. Se il compagno risponde 2♥ o 2♠ hai trovato il fit e vai a manche nel nobile. Se risponde 2♦ (nessuna quarta nobile), giochi 3NT.",
        },
        {
          type: "bid-select",
          content: "Hai aperto 1NT. Il compagno dice 2♣ (Stayman). Hai ♠AK86 ♥Q93 ♦KJ7 ♣A84. Cosa rispondi?",
          cards: "♠AK86 ♥Q93 ♦KJ7 ♣A84",
          options: ["2D", "2H", "2S", "2NT"],
          correctAnswer: 2,
          explanation: "Hai 4 Picche e meno di 4 Cuori. La risposta alla Stayman e 2♠! Mostra le tue 4 Picche al compagno.",
        },
      ],
    },
    {
      id: "8-4",
      title: "L'apertura e le risposte a 2NT",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "L'apertura di 2NT e come rispondere",
        },
        {
          type: "text",
          content:
            "Si apre di 2NT quando si hanno 21, 22 o 23 punti e una distribuzione bilanciata (4333, 4432, 5332). Non ci sono mai singoli ne vuoti, ne colori di 6+ carte. Se la mano ha i requisiti per 2NT, tale apertura prevale su quella a colore.",
        },
        {
          type: "rule",
          content:
            "Su 2NT l'unico modo per fermarsi prima di manche e dire Passo. Le risposte di 3♥, 3♠ mostrano 5+ carte e forza almeno di manche. L'apertore rialza con fit, altrimenti 3NT. Per cercare il fit 4-4 si usa 3♣ (Stayman scalata di un livello).",
        },
        {
          type: "example",
          content:
            "Ovest apre 2NT (21-23). Est ha ♠95 ♥J965 ♦865 ♣AJ92. La somma e almeno 25: manche sicura. Est usa 3♣ (Stayman). Ovest risponde 3♥: fit trovato! Est dichiara 4♥.",
          cards: "♠95 ♥J965 ♦865 ♣AJ92",
        },
        {
          type: "text",
          content:
            "Le risposte alla Stayman su 2NT sono identiche a quelle su 1NT, scalate di un livello: 3♦ = nessuna quarta nobile, 3♥ = 4 Cuori, 3♠ = 4 Picche, 3NT = entrambe le quarte.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 2NT (21-23). Hai ♠J3 ♥K52 ♦AQJ52 ♣J76 (11 punti). Cosa rispondi?",
          options: ["Passo", "3♦", "3NT", "3♣ (Stayman)"],
          correctAnswer: 2,
          explanation:
            "Con 11 punti la somma e almeno 32 (21+11): manche sicura e possibile slam! Senza fit nobile in vista (solo 3 carte a Cuori, 2 a Picche), la scelta migliore e 3NT direttamente. Le Quadri daranno molte prese a NT.",
        },
      ],
    },
  ],
};

// ===== LESSONS 9-12 (imported from separate file) =====
import { lessons9to12 } from "./lessons-9-12";

// ===== ESERCIZIARIO (exercise modules from FIGB official exercise book) =====
import { eserciziarioModules } from "./eserciziario";

// Append eserciziario exercise modules to each lesson
function withEserciziario(lesson: Lesson): Lesson {
  const extra = eserciziarioModules[lesson.id];
  if (!extra || extra.length === 0) return lesson;
  return { ...lesson, modules: [...lesson.modules, ...extra] };
}

// ===== LESSON INDEX =====

export const allLessons: Lesson[] = [
  premessa,
  withEserciziario(lezione1),
  withEserciziario(lezione2),
  withEserciziario(lezione3),
  withEserciziario(lezione4),
  withEserciziario(lezione5),
  withEserciziario(lezione6),
  withEserciziario(lezione7),
  withEserciziario(lezione8),
  ...lessons9to12.map(withEserciziario),
];

export const worlds: World[] = [
  {
    id: 1,
    name: "Il Tavolo",
    subtitle: "Scoprire il Bridge — le basi fondamentali",
    icon: "♣",
    gradient: "from-emerald to-emerald-dark",
    iconBg: "bg-emerald-50 text-emerald",
    lessons: [premessa],
  },
  {
    id: 2,
    name: "Il Giocante",
    subtitle: "Padroneggiare il Gioco della Carta",
    icon: "♠",
    gradient: "from-indigo-500 to-indigo-700",
    iconBg: "bg-indigo-50 text-indigo-700",
    lessons: [lezione1, lezione3, lezione4, lezione5, lezione6],
  },
  {
    id: 3,
    name: "Il Difensore",
    subtitle: "Battere il Contratto",
    icon: "♥",
    gradient: "from-rose-500 to-rose-700",
    iconBg: "bg-rose-50 text-rose-700",
    lessons: [lezione2],
  },
  {
    id: 4,
    name: "La Dichiarazione",
    subtitle: "Valutare la mano e comunicare con il compagno",
    icon: "♦",
    gradient: "from-amber-500 to-amber-700",
    iconBg: "bg-amber-50 text-amber-700",
    lessons: [lezione7, lezione8, ...lessons9to12.filter((l) => l.worldId === 4)],
  },
  {
    id: 5,
    name: "La Competizione",
    subtitle: "Dichiarazione competitiva e interventi",
    icon: "NT",
    gradient: "from-slate-700 to-slate-800",
    iconBg: "bg-slate-100 text-slate-700",
    lessons: lessons9to12.filter((l) => l.worldId === 5),
  },
];

export function getLessonById(id: number): Lesson | undefined {
  return allLessons.find((l) => l.id === id);
}

export function getModuleById(
  lessonId: number,
  moduleId: string
): LessonModule | undefined {
  const lesson = getLessonById(lessonId);
  return lesson?.modules.find((m) => m.id === moduleId);
}
