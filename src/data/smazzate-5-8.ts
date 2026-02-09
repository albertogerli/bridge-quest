// Bridge practice hands (smazzate) from FIGB Corso Fiori - Lessons 5-8
// Extracted from official FIGB teaching materials

export type Suit = "spade" | "heart" | "diamond" | "club";
export type Rank = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
export type Direction = "north" | "south" | "east" | "west";
export type Vulnerability = "none" | "ns" | "ew" | "all";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface BridgeHand {
  id: string;
  lesson: number;
  board: number;
  title: string;
  contract: string;
  declarer: Direction;
  openingLead: Card;
  vulnerability: Vulnerability;
  hands: {
    north: Card[];
    south: Card[];
    east: Card[];
    west: Card[];
  };
  bidding?: {
    dealer: Direction;
    bids: string[];
  };
  commentary: string;
}

// Helper to build card arrays concisely
const S = (rank: Rank): Card => ({ suit: "spade" as const, rank });
const H = (rank: Rank): Card => ({ suit: "heart" as const, rank });
const D = (rank: Rank): Card => ({ suit: "diamond" as const, rank });
const C = (rank: Rank): Card => ({ suit: "club" as const, rank });

export const smazzate5to8: BridgeHand[] = [
  // ===== LESSON 5: Il gioco ad atout =====

  // Board 1 - Lesson 5
  {
    id: "5-1",
    lesson: 5,
    board: 1,
    title: "Il gioco ad atout",
    contract: "4S",
    declarer: "north",
    openingLead: { suit: "heart", rank: "J" },
    vulnerability: "none",
    hands: {
      north: [
        S("A"), S("K"), S("9"), S("8"), S("7"), S("6"),
        H("K"),
        D("A"), D("7"), D("4"),
        C("A"), C("K"), C("6"),
      ],
      south: [
        S("5"), S("4"), S("2"),
        H("A"), H("Q"), H("6"), H("4"),
        D("9"), D("8"), D("6"), D("3"),
        C("7"), C("5"),
      ],
      east: [
        S("Q"),
        H("J"), H("10"), H("9"), H("5"), H("2"),
        D("K"), D("5"), D("2"),
        C("Q"), C("8"), C("4"), C("3"),
      ],
      west: [
        S("J"), S("10"), S("3"),
        H("8"), H("7"), H("3"),
        D("Q"), D("J"), D("10"),
        C("J"), C("10"), C("9"), C("2"),
      ],
    },
    commentary:
      "Attacco J di cuori, da sequenza. Nord conta le prese: 6 a picche se i resti sono 2-2, 5 se le picche sono 3-1, 4 se sono 4-0, +1 quadri, 2 fiori e 3 cuori... a condizione di poterle incassare separatamente. Serve un ingresso al morto, ed e' facile trovarlo! Vinta la presa con il K, Nord incassa A e K di atout, poi A e K di fiori e taglia il 6 al morto, guadagnando cosi' una presa in piu' e un ingresso. Su K e Q di cuori scarta le due cartine di quadri... e finisce a 12 prese. 4 picche + 2, in prima: 480.",
  },

  // Board 2 - Lesson 5
  {
    id: "5-2",
    lesson: 5,
    board: 2,
    title: "Il gioco ad atout",
    contract: "4S",
    declarer: "east",
    openingLead: { suit: "diamond", rank: "A" },
    vulnerability: "ns",
    hands: {
      north: [
        S("3"), S("2"),
        H("Q"), H("10"), H("9"), H("5"),
        D("J"), D("6"), D("3"), D("2"),
        C("10"), C("8"), C("2"),
      ],
      south: [
        S("J"), S("6"), S("5"), S("4"),
        H("J"), H("6"), H("3"),
        D("A"), D("K"), D("Q"), D("10"),
        C("9"), C("7"),
      ],
      east: [
        S("A"), S("K"), S("Q"), S("10"), S("9"), S("8"),
        H("K"), H("8"), H("4"),
        D("7"),
        C("K"), C("4"), C("3"),
      ],
      west: [
        S("7"),
        H("A"), H("7"), H("2"),
        D("9"), D("8"), D("5"), D("4"),
        C("A"), C("Q"), C("J"), C("6"), C("5"),
      ],
    },
    commentary:
      "Attacco A di quadri, seguito dal K. Est conta su 5 o 6 picche (6 solo se cadra' il fante), 2 cuori e almeno 4 fiori. Tagliato il secondo giro a quadri batte le atout (e' necessario farlo, altrimenti non si potranno incassare le fiori). Scopre che a Sud spettera' una presa, ma e' inutile rigiocare picche: Sud la fara' di taglio, quando vorra'. Ora puo' tranquillamente incassare le fiori, prima o poi Sud tagliera', ma il morto e' raggiungibile con l'Asso di cuori - se e' stato conservato - per poter realizzare le fiori restanti. La difesa ha incassato 2 prese, Est le restanti 11. 4 picche + 1, in prima: 450.",
  },

  // Board 3 - Lesson 5
  {
    id: "5-3",
    lesson: 5,
    board: 3,
    title: "Il gioco ad atout",
    contract: "5D",
    declarer: "south",
    openingLead: { suit: "spade", rank: "J" },
    vulnerability: "ew",
    hands: {
      north: [
        S("7"), S("6"),
        H("A"), H("K"), H("6"),
        D("8"), D("5"), D("3"),
        C("K"), C("Q"), C("J"), C("4"), C("2"),
      ],
      south: [
        S("Q"), S("5"),
        H("7"), H("5"),
        D("A"), D("K"), D("Q"), D("9"), D("4"),
        C("A"), C("10"), C("7"), C("6"),
      ],
      east: [
        S("A"), S("K"), S("4"), S("3"),
        H("J"), H("9"), H("3"), H("2"),
        D("10"), D("7"), D("6"), D("2"),
        C("3"),
      ],
      west: [
        S("J"), S("10"), S("9"), S("8"), S("2"),
        H("Q"), H("10"), H("8"), H("4"),
        D("J"),
        C("9"), C("8"), C("5"),
      ],
    },
    commentary:
      "Attacco J di picche, da sequenza. Est, sapendo che la Dama di picche e' in mano a Sud, deve superare con un onore e incassare anche l'altro; dopodiche' puo' giocare qualsiasi altro colore, anche picche (nella speranza di un taglio). Veniamo a Sud, che non deve perdere altre prese. Le atout devono essere battute, ma quando sull'Asso cade il Fante deve scattare un allarme. Ancora il Re per essere sicuri, e Ovest scarta. CONTATE le carte!! Est ha ancora 10x, Sud deve andare al morto (meglio usare le cuori) e giocare quadri verso Q9, superando la carta di Est. Eliminate le atout potra' passare all'incasso. 5 quadri, in prima: 400.",
  },

  // Board 4 - Lesson 5
  {
    id: "5-4",
    lesson: 5,
    board: 4,
    title: "Il gioco ad atout",
    contract: "4H",
    declarer: "west",
    openingLead: { suit: "diamond", rank: "3" },
    vulnerability: "all",
    hands: {
      north: [
        S("A"), S("8"), S("4"), S("3"), S("2"),
        H("8"), H("7"), H("3"),
        D("3"),
        C("9"), C("6"), C("5"), C("3"),
      ],
      south: [
        S("J"), S("9"), S("7"), S("6"),
        H("9"), H("4"),
        D("A"), D("K"), D("J"), D("10"), D("9"),
        C("4"), C("2"),
      ],
      east: [
        S("10"), S("5"),
        H("A"), H("J"), H("2"),
        D("8"), D("7"), D("6"), D("5"), D("2"),
        C("K"), C("J"), C("10"),
      ],
      west: [
        S("K"), S("Q"),
        H("K"), H("Q"), H("10"), H("6"), H("5"),
        D("Q"), D("4"),
        C("A"), C("Q"), C("8"), C("7"),
      ],
    },
    commentary:
      "Attacco 3 di quadri (nella speranza di fare un taglio). Sud vince la presa con il Re e vede cadere il 4; sa con certezza che la Dama e' in Ovest (impossibile che Nord, con Q3, abbia attaccato col 3!). Incassa anche l'altro onore, e continua con il J: sa che tagliano entrambi, ma offre a Nord la possibilita' di 'surtagliare'. Ovest ha tutte atout alte, quindi non commetta l'ingenuita' di tagliare con il 5! Vincera' la presa tagliando con una cuori alta, battera' le atout, incassera' le fiori e cedera' una picche. 10 prese. 4 cuori, in seconda: 620.",
  },

  // Board 5 - Lesson 5
  {
    id: "5-5",
    lesson: 5,
    board: 5,
    title: "Il gioco ad atout",
    contract: "4H",
    declarer: "north",
    openingLead: { suit: "diamond", rank: "J" },
    vulnerability: "ns",
    hands: {
      north: [
        S("A"), S("K"),
        H("Q"), H("J"), H("10"), H("6"), H("5"), H("4"),
        D("7"),
        C("K"), C("Q"), C("J"), C("8"),
      ],
      south: [
        S("9"), S("8"), S("7"), S("6"),
        H("9"), H("8"), H("2"),
        D("K"), D("6"),
        C("A"), C("7"), C("6"), C("3"),
      ],
      east: [
        S("5"), S("4"), S("3"),
        H("A"), H("7"), H("3"),
        D("J"), D("10"), D("9"), D("4"), D("3"),
        C("5"), C("2"),
      ],
      west: [
        S("Q"), S("J"), S("10"), S("2"),
        H("K"),
        D("A"), D("Q"), D("8"), D("5"), D("2"),
        C("10"), C("9"), C("4"),
      ],
    },
    commentary:
      "Attacco J di quadri, da sequenza. Verosimilmente, che venga messo o no il Re, la difesa continuera' a quadri e Nord taglia. Ora conta: 4 prese a cuori (le sue 6 meno 2 da cedere), 2 picche, 4 fiori. Anche se mancano gli onori alti, le atout vanno assolutamente battute. Nord gioca la Dama di cuori (se Est ha fatto scopa con il Re... e' bene che rifletta: l'Asso di atout non glie lo porta via nessuno!), continuera' a giocare cuori e cuori qualunque sia il rinvio dei difensori. Solo dopo aver eliminato le cuori di Est-Ovest, finalmente, potra' dedicarsi alle fiori. 4 cuori, in seconda: 620.",
  },

  // Board 6 - Lesson 5
  {
    id: "5-6",
    lesson: 5,
    board: 6,
    title: "Il gioco ad atout",
    contract: "6D",
    declarer: "east",
    openingLead: { suit: "club", rank: "K" },
    vulnerability: "ew",
    hands: {
      north: [
        S("10"), S("9"), S("8"), S("2"),
        H("J"), H("8"), H("3"), H("2"),
        D("A"),
        C("9"), C("8"), C("3"), C("2"),
      ],
      south: [
        S("J"), S("7"), S("5"), S("3"),
        H("10"), H("7"), H("6"), H("4"),
        D("2"),
        C("K"), C("Q"), C("J"), C("4"),
      ],
      east: [
        S("A"), S("Q"), S("4"),
        H("K"), H("5"),
        D("K"), D("Q"), D("J"), D("9"), D("8"), D("7"),
        C("A"), C("6"),
      ],
      west: [
        S("K"), S("6"),
        H("A"), H("Q"), H("9"),
        D("10"), D("6"), D("5"), D("4"), D("3"),
        C("10"), C("7"), C("5"),
      ],
    },
    commentary:
      "Attacco K di fiori, che promette la Q. Est conta 12 prese: 5 quadri della mano (manca l'Asso, che dovra' essere l'unica presa della difesa), 3 picche, 3 cuori, 1 fiori. Ma attenzione, se Est batte atout adesso, i difensori incasseranno al volo l'Asso di quadri e la Dama di fiori! PRIMA di dare la presa a quadri Est dovra', con minimo rischio, giocare il K di cuori, cuori per l'Asso e Dama di cuori, scartando il 6 di fiori. Ora atout, e il contratto e' in una botte di ferro perche' Est e' in grado di tagliare la prosecuzione a fiori. 6 quadri, in seconda: 1370.",
  },

  // Board 7 - Lesson 5
  {
    id: "5-7",
    lesson: 5,
    board: 7,
    title: "Il gioco ad atout",
    contract: "4S",
    declarer: "south",
    openingLead: { suit: "heart", rank: "A" },
    vulnerability: "all",
    hands: {
      north: [
        S("K"), S("8"),
        H("Q"), H("8"), H("5"),
        D("6"), D("5"), D("2"),
        C("A"), C("K"), C("Q"), C("7"), C("3"),
      ],
      south: [
        S("A"), S("Q"), S("J"), S("10"), S("6"), S("5"),
        D("K"), D("8"), D("7"),
        C("10"), C("6"), C("4"), C("2"),
      ],
      east: [
        S("9"), S("7"), S("2"),
        H("J"), H("10"), H("7"), H("6"), H("2"),
        D("Q"), D("J"), D("10"), D("9"),
        C("5"),
      ],
      west: [
        S("4"), S("3"),
        H("A"), H("K"), H("9"), H("4"), H("3"),
        D("A"), D("4"), D("3"),
        C("J"), C("9"), C("8"),
      ],
    },
    commentary:
      "Attacco A di cuori, che normalmente promette il K. Mai vista una mano piu' facile: Sud taglia, batte le atout (prima il Re, onore della parte corta, poi altri due giri di mano) e passa all'incasso delle fiori. Ma c'e' una trappola... per chi non conta le carte: dopo aver incassato Asso e Re Sud ha VISTO la 3-1. Sa che il Fante sta per cadere sotto la Dama, quindi le altre due fiori del morto saranno comunque buone. Sempre che Sud abbia sbloccato, quell'ingombrante 10 di fiori sotto uno degli onori del morto. 4 picche + 1, in seconda: 650.",
  },

  // Board 8 - Lesson 5
  {
    id: "5-8",
    lesson: 5,
    board: 8,
    title: "Il gioco ad atout",
    contract: "7C",
    declarer: "west",
    openingLead: { suit: "spade", rank: "J" },
    vulnerability: "none",
    hands: {
      north: [
        S("J"), S("10"), S("9"), S("4"),
        H("J"), H("10"), H("9"), H("2"),
        D("8"), D("7"), D("6"), D("4"),
        C("J"),
      ],
      south: [
        S("K"), S("Q"), S("3"),
        H("8"), H("7"), H("5"), H("4"),
        D("J"), D("10"), D("9"), D("2"),
        C("10"), C("7"),
      ],
      east: [
        S("7"), S("6"), S("5"),
        H("K"), H("Q"), H("6"), H("3"),
        D("5"), D("3"),
        C("5"), C("4"), C("3"), C("2"),
      ],
      west: [
        S("A"), S("8"), S("2"),
        H("A"),
        D("A"), D("K"), D("Q"),
        C("A"), C("K"), C("Q"), C("9"), C("8"), C("6"),
      ],
    },
    commentary:
      "Attacco J di picche, o J di cuori. Ovest, dopo essersi fatto un selfie con queste carte, conta: 1 picche, 3 cuori (?), 3 quadri, 6 fiori: 13 prese. Ma il blocco delle cuori da' un po' di inquietudine: come si puo' andare al morto a incassare KQ? Le atout sono tutte piu' piccole, ingressi non ce ne sono. Serve il sacrificio di un onore! Coraggio: Asso e Re di picche, poi Asso e Re di quadri e Dama di quadri tagliata. Eccoci al morto, con le cuori a disposizione. 7 fiori, in prima: 1440.",
  },

  // ===== LESSON 6: Il piano di gioco ad atout =====

  // Board 1 - Lesson 6
  {
    id: "6-1",
    lesson: 6,
    board: 1,
    title: "Il piano di gioco ad atout",
    contract: "2S",
    declarer: "north",
    openingLead: { suit: "diamond", rank: "K" },
    vulnerability: "none",
    hands: {
      north: [
        S("A"), S("8"), S("6"), S("4"),
        H("6"),
        D("A"), D("8"), D("5"), D("4"),
        C("7"), C("6"), C("4"), C("2"),
      ],
      south: [
        S("10"), S("7"), S("5"), S("3"),
        H("A"), H("9"), H("4"), H("3"),
        D("7"),
        C("A"), C("8"), C("5"), C("3"),
      ],
      east: [
        S("Q"), S("9"),
        H("Q"), H("J"), H("8"), H("2"),
        D("K"), D("Q"), D("J"), D("2"),
        C("Q"), C("10"), C("9"),
      ],
      west: [
        S("K"), S("J"), S("2"),
        H("K"), H("10"), H("7"), H("5"),
        D("10"), D("9"), D("6"), D("3"),
        C("K"), C("J"),
      ],
    },
    commentary:
      "Attacco K di quadri, da sequenza. A contare si fa presto: una presa certa a picche, cuori, quadri, l'Asso d'atout... e di affrancabili neanche l'ombra. Ma la distribuzione dei colori e' eccezionale per un piano di gioco a tagli: niente battuta di atout, questa volta! Nord incassa i due Assi rossi (e anche quello di fiori), poi prosegue tagliando le cuori in mano e le quadri al morto. Ottera' 4 prese dagli Assi, piu' 3 tagli con le picche di Sud, piu' 3 tagli con le cartine di picche di Nord: incredibilmente... 10 prese! 2 picche + 2: 170.",
  },

  // Board 2 - Lesson 6
  {
    id: "6-2",
    lesson: 6,
    board: 2,
    title: "Il piano di gioco ad atout",
    contract: "4S",
    declarer: "east",
    openingLead: { suit: "club", rank: "Q" },
    vulnerability: "ns",
    hands: {
      north: [
        S("8"), S("4"),
        H("A"), H("10"), H("8"), H("3"), H("2"),
        D("A"), D("5"), D("4"), D("2"),
        C("8"), C("3"),
      ],
      south: [
        S("A"), S("6"), S("2"),
        H("J"), H("9"), H("7"),
        D("10"), D("8"), D("6"),
        C("Q"), C("J"), C("10"), C("4"),
      ],
      east: [
        S("Q"), S("J"), S("10"), S("9"), S("5"),
        H("Q"), H("6"), H("4"),
        D("Q"), D("J"), D("7"),
        C("A"), C("K"),
      ],
      west: [
        S("K"), S("7"), S("3"),
        H("K"), H("5"),
        D("K"), D("9"), D("3"),
        C("9"), C("7"), C("6"), C("5"), C("2"),
      ],
    },
    commentary:
      "Attacco Q di fiori, testa di sequenza. Est puo' contare su 4 picche della mano e 2 fiori; sommando le affrancabili (1 cuori e 2 quadri) arriva a 9, manca una presa. Se Est riesce a ottenere un taglio con un'atout di Ovest, avra' allungato le prese di una; c'e' un colore che si presta, e' cuori: presenta la corta dalla stessa parte delle atout corte. Quindi, vinto l'attacco, subito cuori verso il Re. Su qualunque ritorno Est potra' giocare la Dama di cuori, tagliare la cartina, e poi battere atout. Invertendo l'ordine delle operazioni... il risultato non e' affatto lo stesso!! 4 picche, in prima: 420.",
  },

  // Board 3 - Lesson 6
  {
    id: "6-3",
    lesson: 6,
    board: 3,
    title: "Il piano di gioco ad atout",
    contract: "6H",
    declarer: "south",
    openingLead: { suit: "diamond", rank: "K" },
    vulnerability: "ew",
    hands: {
      north: [
        S("K"), S("Q"), S("J"), S("6"),
        H("A"), H("5"), H("4"),
        D("10"), D("8"), D("6"), D("4"),
        C("J"), C("3"),
      ],
      south: [
        S("A"),
        H("Q"), H("J"), H("10"), H("9"), H("7"), H("3"),
        D("A"), D("7"),
        C("A"), C("K"), C("Q"), C("8"),
      ],
      east: [
        S("10"), S("9"), S("8"), S("5"),
        H("K"), H("8"),
        D("9"), D("5"), D("2"),
        C("9"), C("7"), C("6"), C("5"),
      ],
      west: [
        S("7"), S("4"), S("3"), S("2"),
        H("6"), H("2"),
        D("K"), D("Q"), D("J"), D("3"),
        C("10"), C("4"), C("2"),
      ],
    },
    commentary:
      "Attacco K di quadri, da sequenza. Il conto delle vincenti e' esaltante... ma l'attacco ha trovato il tallone d'Achille. E bisogna fare l'impasse al Re di atout. Sud puo' anche permettersi di pagare una cuori, se l'impasse andasse male, ma non di pagare una cuori e una quadri! Prima di muovere atout e' necessario disfarsi del 7 di quadri, quindi: Asso di quadri, 8 di fiori superato dal Fante, Re di picche scartando il 7 di quadri. Ora si torna in mano (c'e' ampia scelta su come farlo) e si esegue l'impasse al Re di atout. Va male, ma lo slam e' salvo. 6 cuori, in prima: 980.",
  },

  // Board 4 - Lesson 6
  {
    id: "6-4",
    lesson: 6,
    board: 4,
    title: "Il piano di gioco ad atout",
    contract: "5D",
    declarer: "west",
    openingLead: { suit: "heart", rank: "A" },
    vulnerability: "all",
    hands: {
      north: [
        S("10"), S("8"), S("5"), S("2"),
        H("A"), H("K"), H("Q"), H("2"),
        D("2"),
        C("Q"), C("6"), C("5"), C("2"),
      ],
      south: [
        S("J"), S("9"), S("7"),
        H("10"), H("8"), H("4"), H("3"),
        D("J"), D("6"),
        C("K"), C("10"), C("8"), C("3"),
      ],
      east: [
        S("K"), S("6"), S("4"), S("3"),
        H("J"), H("6"), H("5"),
        D("7"), D("5"), D("4"),
        C("J"), C("7"), C("4"),
      ],
      west: [
        S("A"), S("Q"),
        H("9"), H("7"),
        D("A"), D("K"), D("Q"), D("10"), D("9"), D("8"), D("3"),
        C("A"), C("9"),
      ],
    },
    commentary:
      "Attacco A di cuori, K di cuori. Ovest ha buone probabilita' di mantenere il contratto: a quadri conta 7 prese certe, 1 a picche, 3 a fiori ma con qualche problema di blocco: se supera la Q con il K, non fara' piu' 3 prese a fiori!! Il solo modo per raggiungere il morto, e bisogna pensarci subito, e' sperare che sotto AK di quadri cadano tutte le atout: allora Ovest potra' sbloccare AQ di fiori e andare al morto con il 3 di quadri, superato dal 7. Accidenti! ... il 3 di quadri lo avete usato per tagliare??? Peccato! Era la piu' importante delle 13 carte di Ovest... valeva 600 punti! 5 quadri, in seconda: 600.",
  },

  // Board 5 - Lesson 6
  {
    id: "6-5",
    lesson: 6,
    board: 5,
    title: "Il piano di gioco ad atout",
    contract: "4S",
    declarer: "north",
    openingLead: { suit: "heart", rank: "K" },
    vulnerability: "ns",
    hands: {
      north: [
        S("A"), S("K"), S("Q"), S("7"), S("2"),
        H("A"), H("10"), H("7"), H("5"),
        D("8"), D("2"),
        C("A"), C("8"),
      ],
      south: [
        S("J"), S("10"), S("5"),
        H("6"),
        D("A"), D("9"), D("5"), D("3"),
        C("10"), C("7"), C("5"), C("4"), C("2"),
      ],
      east: [
        S("4"), S("3"),
        H("K"), H("Q"), H("J"), H("4"), H("3"),
        D("Q"), D("10"), D("7"), D("6"),
        C("J"), C("6"),
      ],
      west: [
        S("9"), S("8"), S("6"),
        H("9"), H("8"), H("2"),
        D("K"), D("J"), D("4"),
        C("K"), C("Q"), C("9"), C("3"),
      ],
    },
    commentary:
      "Attacco K di cuori, che promette la Q. Nord conta 5 prese a picche, 1 cuori, 1 quadri, 1 fiori: 8. Serve trovare altre due prese e, poiche' affrancare due prese nei colori laterali e' molto improbabile, occorre aumentare le prese date dalle atout e ottenerne 7. Il modo piu' semplice e' tagliare due cuori con le picche di Sud (le picche daranno cosi' 7 prese: 5 di Nord, + 2 tagli). Meglio farlo immediatamente, e rimandare la battuta d'atout; se Nord si ostina a togliere di mezzo tutte le picche dei difensori, spariranno le 3 atout di Sud e rimarra' a 8 prese. 4 picche, in seconda: 620.",
  },

  // Board 6 - Lesson 6
  {
    id: "6-6",
    lesson: 6,
    board: 6,
    title: "Il piano di gioco ad atout",
    contract: "4S",
    declarer: "east",
    openingLead: { suit: "heart", rank: "K" },
    vulnerability: "ew",
    hands: {
      north: [
        S("Q"), S("10"), S("9"), S("8"),
        H("10"), H("7"), H("5"),
        D("9"), D("8"), D("5"),
        C("Q"), C("J"), C("10"),
      ],
      south: [
        S("4"),
        H("K"), H("Q"), H("J"), H("8"), H("6"), H("2"),
        D("3"), D("2"),
        C("K"), C("9"), C("5"), C("2"),
      ],
      east: [
        S("A"), S("J"), S("6"), S("2"),
        H("A"), H("3"),
        D("K"), D("Q"), D("6"),
        C("8"), C("7"), C("4"), C("3"),
      ],
      west: [
        S("K"), S("7"), S("5"), S("3"),
        H("9"), H("4"),
        D("A"), D("J"), D("10"), D("7"), D("4"),
        C("A"), C("6"),
      ],
    },
    commentary:
      "Attacco K di cuori, da sequenza. Con un colore pieno da sfruttare (le quadri danno 5 prese) Est sa di dover scegliere una strategia classica: 'elimino le atout e poi incasso le mie'. Anche se le atout dessero solo 3 prese, i colori a lato ne offrono 7. Come muovere le picche? Mancano Dama e 10, quindi il solo modo e' incassare il Re e poi piccola verso il Fante. Sud scarta, poco male: Est incassa anche l'Asso e poi gioca K e Q di quadri e quadri. Nord al quarto giro taglia, ma Est scarta la cartina di cuori e potra' tagliare il ritorno nel colore, cedendo solo piu' una fiori alla fine. 4 picche + 1, in seconda: 650.",
  },

  // Board 7 - Lesson 6
  {
    id: "6-7",
    lesson: 6,
    board: 7,
    title: "Il piano di gioco ad atout",
    contract: "4S",
    declarer: "south",
    openingLead: { suit: "diamond", rank: "K" },
    vulnerability: "all",
    hands: {
      north: [
        S("J"), S("6"), S("4"),
        H("A"), H("K"), H("6"), H("5"),
        D("9"), D("6"), D("4"),
        C("9"), C("8"), C("7"),
      ],
      south: [
        S("A"), S("K"), S("Q"), S("10"), S("7"), S("2"),
        H("Q"),
        D("A"), D("7"), D("5"),
        C("Q"), C("J"), C("10"),
      ],
      east: [
        S("9"),
        H("J"), H("10"), H("8"), H("7"), H("4"), H("3"),
        D("10"), D("8"), D("3"),
        C("K"), C("4"), C("3"),
      ],
      west: [
        S("8"), S("5"), S("3"),
        H("9"), H("2"),
        D("K"), D("Q"), D("J"), D("2"),
        C("A"), C("6"), C("5"), C("2"),
      ],
    },
    commentary:
      "Attacco K di quadri, da sequenza. Sud conta facilmente 10 prese: 6 picche, 3 cuori e 1 quadri. Vinto l'attacco (in quel momento la difesa ha a disposizione 2 fiori e 2 quadri affrancate!) il miglior modo di procedere e' questo: incassare AK di picche, poi la Dama di cuori, poi picche per il Fante eliminando l'ultima atout, poi A e K di cuori, scartando due quadri. Ora potra' giocare fiori per affrancare la sua 11a presa. 4 picche + 1, in seconda: 650.",
  },

  // Board 8 - Lesson 6
  {
    id: "6-8",
    lesson: 6,
    board: 8,
    title: "Il piano di gioco ad atout",
    contract: "4H",
    declarer: "west",
    openingLead: { suit: "diamond", rank: "Q" },
    vulnerability: "none",
    hands: {
      north: [
        S("10"), S("7"), S("4"), S("2"),
        H("K"),
        D("Q"), D("J"), D("10"), D("9"),
        C("J"), C("5"), C("4"), C("2"),
      ],
      south: [
        S("A"), S("9"), S("5"), S("3"),
        H("A"), H("7"), H("4"),
        D("8"), D("3"), D("2"),
        C("9"), C("8"), C("3"),
      ],
      east: [
        S("Q"), S("J"), S("6"),
        H("Q"), H("J"), H("6"), H("2"),
        D("7"), D("5"), D("4"),
        C("K"), C("Q"), C("7"),
      ],
      west: [
        S("K"), S("8"),
        H("10"), H("9"), H("8"), H("5"), H("3"),
        D("A"), D("K"), D("6"),
        C("A"), C("10"), C("6"),
      ],
    },
    commentary:
      "Attacco Q di quadri, la piu' alta della sequenza. Questa mano e' un esempio di corsa all'affrancamento: notate che a N-S spettano 2 cuori e 1 picche, ma stanno lavorando per affrancare una presa a quadri. Se ci riescono, Ovest perdera' il contratto. Se Ovest gioca cuori, e la difesa insiste sempre a quadri, questo avverra'. Ovest deve invece muovere subito il K di fiori; Sud prende e gioca quadri... Ovest prende, incassa Q e J di picche scartando il 6 di quadri. Ora e' a cavallo, puo' battere atout; ai difensori spetteranno due prese, ma non potranno piu' incassare la quadri affrancata perche' Ovest ha ottenuto il controllo di taglio. 4 cuori, in prima: 420 oppure 4 cuori -1: -50.",
  },

  // ===== LESSON 7: Le dichiarazioni di apertura =====

  // Board 1 - Lesson 7
  {
    id: "7-1",
    lesson: 7,
    board: 1,
    title: "Le dichiarazioni di apertura",
    contract: "3NT",
    declarer: "east",
    openingLead: { suit: "spade", rank: "2" },
    vulnerability: "none",
    hands: {
      north: [
        S("J"), S("10"), S("7"), S("4"),
        H("8"), H("5"), H("4"),
        D("5"), D("2"),
        C("K"), C("6"), C("3"), C("2"),
      ],
      south: [
        S("Q"), S("9"), S("5"), S("2"),
        H("K"), H("7"), H("6"),
        D("9"), D("7"), D("4"),
        C("A"), C("10"), C("9"),
      ],
      east: [
        S("A"), S("K"),
        H("A"), H("Q"), H("9"), H("3"),
        D("Q"), D("10"), D("8"), D("6"),
        C("J"), C("7"), C("4"),
      ],
      west: [
        S("8"), S("6"), S("3"),
        H("J"), H("10"), H("2"),
        D("A"), D("K"), D("J"), D("3"),
        C("Q"), C("8"), C("5"),
      ],
    },
    bidding: {
      dealer: "north",
      bids: ["P", "1NT", "P", "3NT", "P", "P", "P"],
    },
    commentary:
      "Attacco 2 di picche (unico colore lungo di Sud). Est ha una bilanciata compresa nel campo 15-17: l'apertura corretta e' 1NT. Ovest ha 11, sa di avere sulla linea 26/27/28: quanto basta per dichiarare una manche. E 3NT sembra proprio la migliore. Est conta 2 picche, 3 o 4 cuori a seconda che l'impasse riesca o meno, e 4 quadri. Qxx + Jxx di fiori rappresentano un fermo sicuro, ma solo se saranno gli avversari a muovere per primi. La prima cosa da fare e' l'impasse a cuori, quindi si va al morto a quadri e si lascia 'girare' il fante di cuori. Sud vince con il Re, e sa di poter giocare picche (se Nord sull'attacco ha correttamente messo il DIECI) per il J del compagno. Est realizza le sue 9 prese (o 10, se la difesa avra' fretta di giocare fiori anziche' affrancare le picche). 3NT, in prima: 400.",
  },

  // Board 2 - Lesson 7
  {
    id: "7-2",
    lesson: 7,
    board: 2,
    title: "Le dichiarazioni di apertura",
    contract: "4S",
    declarer: "north",
    openingLead: { suit: "club", rank: "A" },
    vulnerability: "ns",
    hands: {
      north: [
        S("A"), S("Q"), S("J"), S("7"), S("6"), S("5"),
        H("K"), H("10"), H("7"),
        D("10"), D("3"), D("2"),
        C("J"),
      ],
      south: [
        S("K"), S("4"), S("2"),
        H("A"), H("2"),
        D("A"), D("K"), D("4"),
        C("Q"), C("9"), C("7"), C("4"), C("2"),
      ],
      east: [
        S("10"), S("3"),
        H("J"), H("8"), H("3"),
        D("J"), D("8"), D("7"),
        C("A"), C("K"), C("8"), C("6"), C("5"),
      ],
      west: [
        S("9"), S("8"),
        H("Q"), H("9"), H("6"), H("5"), H("4"),
        D("Q"), D("9"), D("6"), D("5"),
        C("10"), C("3"),
      ],
    },
    bidding: {
      dealer: "east",
      bids: ["P", "1NT", "P", "4S", "P", "P", "P"],
    },
    commentary:
      "Perche' non 4 picche, visto che Sud ha certamente almeno 2 carte? Est vede cadere il Fante e si deve fermare: se prosegue con il K (quasi certamente tagliato), la Dama del morto sara' un regalo per Nord, che potra' fare 12 prese (6 picche, 2 cuori, un taglio al morto della cartina di cuori, 2 quadri e 1 fiori: 12). Se Est, saggiamente, prosegue in un qualsiasi altro colore Nord fara' solo 11 prese. 4 picche + 1, in seconda: 650.",
  },

  // Board 3 - Lesson 7
  {
    id: "7-3",
    lesson: 7,
    board: 3,
    title: "Le dichiarazioni di apertura",
    contract: "4S",
    declarer: "west",
    openingLead: { suit: "diamond", rank: "Q" },
    vulnerability: "ew",
    hands: {
      north: [
        S("9"), S("3"), S("2"),
        H("10"), H("7"), H("5"),
        D("Q"), D("J"), D("10"), D("2"),
        C("Q"), C("7"), C("2"),
      ],
      south: [
        S("4"),
        H("Q"), H("J"), H("9"), H("2"),
        D("K"), D("9"), D("5"),
        C("J"), C("10"), C("6"), C("4"), C("3"),
      ],
      east: [
        S("Q"), S("7"), S("5"),
        H("8"), H("6"), H("4"), H("3"),
        D("8"), D("7"), D("6"), D("4"),
        C("A"), C("5"),
      ],
      west: [
        S("A"), S("K"), S("J"), S("10"), S("8"), S("6"),
        H("A"), H("K"),
        D("A"), D("3"),
        C("K"), C("9"), C("8"),
      ],
    },
    bidding: {
      dealer: "south",
      bids: ["P", "2S", "P", "4S", "P", "P", "P"],
    },
    commentary:
      "La licita. Con 21 punti e 6 ottime carte, l'apertura di 2 picche e' perfetta. Est ha fit sufficiente e, sapendo di avere almeno 21+6=27 punti in linea, dichiara direttamente la manche. Ovest potrebbe anche avere meno di 21... ma in tal caso promette 8 prese da solo, e Est ne porta due: un Asso e la Dama di atout. Ovest vince l'attacco e conta: 6 picche, 2 cuori, 1 quadri, 2 fiori: 11 prese facili. Ma il bridge e' un gioco di confronti, quindi se non c'e' rischio bisogna sempre cercare di fare il maggior numero possibile di prese; non costa nulla incassare AK di picche, poi fiori all'Asso, picche al Re e quadri tagliata in assoluta sicurezza con la Dama di picche. E le prese sono diventate 12. 4 picche + 2, in seconda: 680.",
  },

  // Board 4 - Lesson 7
  {
    id: "7-4",
    lesson: 7,
    board: 4,
    title: "Le dichiarazioni di apertura",
    contract: "4S",
    declarer: "south",
    openingLead: { suit: "diamond", rank: "K" },
    vulnerability: "all",
    hands: {
      north: [
        S("A"), S("K"), S("Q"), S("5"),
        H("K"), H("Q"), H("J"), H("10"), H("9"),
        D("A"), D("5"),
        C("A"), C("K"),
      ],
      south: [
        S("J"), S("8"), S("7"), S("4"), S("3"), S("2"),
        H("7"),
        D("9"), D("6"),
        C("Q"), C("9"), C("7"), C("5"),
      ],
      east: [
        S("6"),
        H("A"), H("5"), H("4"), H("3"),
        D("10"), D("8"), D("7"), D("3"), D("2"),
        C("10"), C("3"), C("2"),
      ],
      west: [
        S("10"), S("9"),
        H("8"), H("6"), H("2"),
        D("K"), D("Q"), D("J"), D("4"),
        C("J"), C("8"), C("6"), C("4"),
      ],
    },
    bidding: {
      dealer: "west",
      bids: ["P", "2H", "P", "2S", "P", "4S", "P", "P", "P"],
    },
    commentary:
      "La licita. Nord ha 10 vincenti...da solo, e due possibili colori da scegliere come atout. L'apertura di 2 a colore non e' passabile, e questa mano evidenzia il perche'. Sud non ha fit, ma non puo' passare: la dichiarazione piu' ovvia e' 2 picche. Nord (che continua a vedersi 10 prese... ora e' ancora piu' contento) ne dichiara direttamente 4. Nessuna difficolta' per Sud, che se si ingegna riuscira' a fare 12 prese: Asso di quadri, Asso e Re di picche, Asso e Re di fiori, piccola picche per il Fante... e Dama di quadri per lo scarto del 5 di cuori. I difensori faranno solo l'Asso di cuori. 4 picche + 2, in seconda: 680.",
  },

  // Board 5 - Lesson 7
  {
    id: "7-5",
    lesson: 7,
    board: 5,
    title: "Le dichiarazioni di apertura",
    contract: "3NT",
    declarer: "south",
    openingLead: { suit: "spade", rank: "Q" },
    vulnerability: "ns",
    hands: {
      north: [
        S("K"), S("10"), S("5"),
        H("K"), H("9"), H("2"),
        D("J"), D("10"), D("4"),
        C("A"), C("6"), C("5"), C("3"),
      ],
      south: [
        S("A"), S("7"), S("4"),
        H("A"), H("8"), H("7"),
        D("A"), D("K"), D("Q"), D("3"),
        C("10"), C("4"), C("2"),
      ],
      east: [
        S("6"), S("2"),
        H("J"), H("10"), H("5"), H("4"), H("3"),
        D("9"), D("5"),
        C("K"), C("J"), C("9"), C("8"),
      ],
      west: [
        S("Q"), S("J"), S("9"), S("8"), S("3"),
        H("Q"), H("6"),
        D("8"), D("7"), D("6"), D("2"),
        C("Q"), C("7"),
      ],
    },
    bidding: {
      dealer: "north",
      bids: ["P", "P", "1NT", "P", "3NT", "P", "P", "P"],
    },
    commentary:
      "Attacco Q di picche (sfortunato, ma corretto). La licita. Sud e' il primo che ha requisiti di apertura; ha 17 punti e mano bilanciata: 1NT. Nord, che non ha motivo di pensare ad altri tipi di contratto, somma i suoi punti a quelli di Sud (11 + 15/16/17) e sa di dover dichiarare 3NT. Sud conta 2 picche, 2 cuori, 4 quadri, 1 fiori. Nove senza fatica. Si puo' fare di meglio? Si, e senza rischi: verosimilmente l'attacco di Dama promette il Fante, vero? Allora si vince l'attacco con l'Asso... poi si gioca piccola verso K10 facendo un impasse al 100%! ... E le prese diventano 10. 3NT + 1, in seconda: 630.",
  },

  // Board 6 - Lesson 7
  {
    id: "7-6",
    lesson: 7,
    board: 6,
    title: "Le dichiarazioni di apertura",
    contract: "3NT",
    declarer: "east",
    openingLead: { suit: "spade", rank: "10" },
    vulnerability: "ew",
    hands: {
      north: [
        S("5"), S("4"), S("3"), S("2"),
        H("10"), H("9"), H("6"), H("5"),
        D("K"), D("3"),
        C("K"), C("10"), C("6"),
      ],
      south: [
        S("10"), S("9"), S("8"), S("7"), S("6"),
        H("J"), H("7"), H("4"),
        D("A"), D("6"), D("4"),
        C("7"), C("2"),
      ],
      east: [
        S("K"), S("J"),
        H("K"), H("3"), H("2"),
        D("J"), D("9"), D("8"), D("7"),
        C("A"), C("Q"), C("J"), C("4"),
      ],
      west: [
        S("A"), S("Q"),
        H("A"), H("Q"), H("8"),
        D("Q"), D("10"), D("5"), D("2"),
        C("9"), C("8"), C("5"), C("3"),
      ],
    },
    bidding: {
      dealer: "east",
      bids: ["2NT", "P", "3NT", "P", "P", "P"],
    },
    commentary:
      "La licita. Con mano bilanciata e 21 punti l'apertura corretta e' 2NT; Ovest, pure lui bilanciato, fa le somme e sa di avere sulla linea 29 o 30 punti, pertanto rialza a 3NT. Nonostante i punti, il contratto e' a rischio, perche' purtroppo a picche si fanno solo 2 prese. A cuori 3. Le picche sono inutili, non c'e' tempo per affrancarle (i difensori incasserebbero 2 picche e 3 quadri). Morale, e' indispensabile che le fiori forniscano QUATTRO prese, quindi che il Re sia in Nord, secondo o terzo. Per ripetere l'impasse bisogna partire due volte dal morto, incominciamo dunque a mettere il Re di cuori (e star sotto con la Dama). Fiori impasse, che va bene. Allora al Re e ancora fiori impasse. E nove sudatissime prese sono in tasca. 3NT, in seconda: 600.",
  },

  // Board 7 - Lesson 7
  {
    id: "7-7",
    lesson: 7,
    board: 7,
    title: "Le dichiarazioni di apertura",
    contract: "4S",
    declarer: "north",
    openingLead: { suit: "heart", rank: "A" },
    vulnerability: "all",
    hands: {
      north: [
        S("K"), S("Q"), S("9"), S("8"), S("6"), S("3"),
        H("J"), H("5"), H("3"),
        D("A"),
        C("10"), C("7"), C("4"),
      ],
      south: [
        S("A"), S("J"), S("4"), S("2"),
        D("9"), D("8"), D("7"), D("3"), D("2"),
        C("Q"), C("J"), C("8"), C("5"),
      ],
      east: [
        S("10"), S("5"),
        H("A"), H("9"), H("8"), H("6"),
        D("J"), D("10"), D("6"), D("5"),
        C("K"), C("6"), C("2"),
      ],
      west: [
        S("7"),
        H("K"), H("Q"), H("10"), H("7"), H("4"), H("2"),
        D("K"), D("Q"), D("4"),
        C("A"), C("9"), C("3"),
      ],
    },
    bidding: {
      dealer: "south",
      bids: ["P", "1H", "1S", "2H", "2S", "3H", "3S", "P", "4S", "P", "P", "P"],
    },
    commentary:
      "In questa mano puo' succedere di tutto: entrambe le linee hanno un fit eccezionale. Ovest e' invogliato a competere dal singolo di picche, Sud lo e' altrettanto per il vuoto a cuori. Se Nord gioca con atout picche realizzera' 11 prese, purche' abbia cura di rimandare la battuta e tagliare al morto le tre cuori che ha in mano (perdera' solo A e K di cuori). Se Ovest gioca a cuori puo' fare 11 prese: 6 cuori di mano, 2 quadri, 3 quadri affrancate. Solo 10 con un brillante controgioco: A di quadri, picche per l'Asso e quadri taglio.",
  },

  // Board 8 - Lesson 7
  {
    id: "7-8",
    lesson: 7,
    board: 8,
    title: "Le dichiarazioni di apertura",
    contract: "7NT",
    declarer: "west",
    openingLead: { suit: "heart", rank: "10" },
    vulnerability: "none",
    hands: {
      north: [
        S("7"), S("5"),
        H("10"), H("9"), H("8"), H("5"), H("4"),
        D("9"), D("5"),
        C("J"), C("8"), C("6"), C("4"),
      ],
      south: [
        S("10"), S("9"), S("6"), S("4"), S("3"),
        H("7"), H("2"),
        D("Q"), D("10"), D("8"), D("4"), D("2"),
        C("9"),
      ],
      east: [
        S("Q"), S("8"),
        H("A"), H("J"), H("3"),
        D("A"), D("J"), D("6"), D("3"),
        C("A"), C("10"), C("7"), C("2"),
      ],
      west: [
        S("A"), S("K"), S("J"), S("2"),
        H("K"), H("Q"), H("6"),
        D("K"), D("7"),
        C("K"), C("Q"), C("5"), C("3"),
      ],
    },
    bidding: {
      dealer: "west",
      bids: ["2NT", "P", "7NT", "P", "P", "P"],
    },
    commentary:
      "La licita. Con 21 punti e mano bilanciata Ovest apre di 2NT; Est, che ha quasi tutti i punti che restano nel mazzo, dovrebbe ragionevolmente spararne 7. Nella sua disperazione, Nord sceglie comunque la sua sequenza di cuori. Ovest conta: 4 picche, 3 cuori, 2 quadri, 3 fiori... forse 4. E' da li' che bisogna cominciare, senza aver fretta di incassare il resto. E bisogna cominciare con K e Q di fiori: A+10 del morto consentirebbero l'impasse al Fante, se quarto in Nord. E se fosse quarto in Sud... imprendibile? Rimarrebbe la ruota di scorta dell'impasse alla Q di quadri. 7NT, in prima: 1520.",
  },

  // ===== LESSON 8: Le aperture di 1NT e 2NT =====

  // Board 1 - Lesson 8
  {
    id: "8-1",
    lesson: 8,
    board: 1,
    title: "Le aperture di 1NT e 2NT",
    contract: "3NT",
    declarer: "north",
    openingLead: { suit: "spade", rank: "2" },
    vulnerability: "none",
    hands: {
      north: [
        S("A"), S("10"), S("8"),
        H("K"), H("J"), H("5"),
        D("K"), D("10"), D("2"),
        C("A"), C("J"), C("4"), C("3"),
      ],
      south: [
        S("J"), S("3"),
        H("A"), H("Q"), H("10"), H("7"),
        D("Q"), D("J"), D("9"), D("6"),
        C("9"), C("6"), C("2"),
      ],
      east: [
        S("K"), S("9"), S("6"), S("4"), S("2"),
        H("9"), H("2"),
        D("8"), D("7"), D("4"),
        C("10"), C("8"), C("5"),
      ],
      west: [
        S("Q"), S("7"), S("5"),
        H("8"), H("6"), H("4"), H("3"),
        D("A"), D("5"), D("3"),
        C("K"), C("Q"), C("7"),
      ],
    },
    bidding: {
      dealer: "north",
      bids: ["1NT", "P", "2C", "P", "2D", "P", "3NT", "P", "P", "P"],
    },
    commentary:
      "La licita. Sud ha 10 punti, Nord mostra 15-17: la manche e' certa. Forse 3NT, forse no. L'ordine di priorita' suggerisce: 'cerca fit nobile, se non c'e' gioca a Senza, ultima spiaggia gioca a fiori o quadri'. Il fit a cuori e' possibile, per scoprirlo Sud deve chiedere a Nord se ha quarte nobili, usando il 2 fiori; appurato che a cuori non c'e' fit ripiega nella manche alternativa, a 3NT. La prima carta decide tutto: quando si riceve l'attacco in una figura come A10x + Jx si deve giocare piccola dal morto. Se Nord gioca il 3 avra' la certezza assoluta di fare 2 prese nel colore (provare per credere). Se gioca il Fante (Q di Ovest) certamente ci rimette una presa... e molte volte il contratto. 3NT + 1, in prima: 430. Oppure 3NT -1, in prima: -50.",
  },

  // Board 2 - Lesson 8
  {
    id: "8-2",
    lesson: 8,
    board: 2,
    title: "Le aperture di 1NT e 2NT",
    contract: "3NT",
    declarer: "west",
    openingLead: { suit: "diamond", rank: "J" },
    vulnerability: "ns",
    hands: {
      north: [
        S("J"), S("4"),
        H("Q"), H("4"),
        D("J"), D("10"), D("9"), D("6"), D("4"),
        C("9"), C("7"), C("4"), C("2"),
      ],
      south: [
        S("Q"), S("10"), S("9"), S("7"), S("2"),
        H("K"), H("J"), H("10"), H("7"),
        D("8"), D("7"), D("5"),
        C("A"),
      ],
      east: [
        S("8"), S("6"), S("3"),
        H("9"), H("6"), H("5"), H("2"),
        D("A"),
        C("J"), C("10"), C("6"), C("5"), C("3"),
      ],
      west: [
        S("A"), S("K"), S("5"),
        H("A"), H("8"), H("3"),
        D("K"), D("Q"), D("3"), D("2"),
        C("K"), C("Q"), C("8"),
      ],
    },
    bidding: {
      dealer: "east",
      bids: ["P", "P", "2NT", "P", "3C", "P", "3D", "P", "3NT", "P", "P", "P"],
    },
    commentary:
      "La licita. Per giocare una manche servono 24-25 punti; a volte avrete 12 + 13... a volte 20+5. Est non si deve scoraggiare, interroga per scoprire se Ovest ha 4 carte a cuori (la sua mano sarebbe piu' adatta a giocare ad atout) ma quando scopre che non c'e' fit prende coraggio e dichiara 3NT. L'attacco toglie al morto l'unico ingresso accanto alle fiori, sorgente di prese. Ovest conta 2 picche, 3 quadri, 1 cuori... e se riesce a incassare 4 fiori ha gia' 10 prese. Muove immediatamente piccola fiori verso la mano (prima gli onori della parte corta) e, se ha la prontezza di buttar via K o Q sotto l'Asso di Sud... manterra' il contratto. 3NT + 1, in prima: 430.",
  },

  // Board 3 - Lesson 8
  {
    id: "8-3",
    lesson: 8,
    board: 3,
    title: "Le aperture di 1NT e 2NT",
    contract: "3NT",
    declarer: "south",
    openingLead: { suit: "diamond", rank: "2" },
    vulnerability: "ew",
    hands: {
      north: [
        S("Q"), S("7"), S("6"),
        H("K"), H("Q"), H("7"), H("6"),
        D("Q"), D("9"),
        C("K"), C("10"), C("5"), C("4"),
      ],
      south: [
        S("A"), S("K"), S("4"), S("3"),
        H("A"), H("J"),
        D("7"), D("6"), D("5"), D("4"),
        C("A"), C("7"), C("3"),
      ],
      east: [
        S("J"), S("5"), S("2"),
        H("10"), H("9"), H("5"), H("2"),
        D("K"), D("J"),
        C("J"), C("8"), C("6"), C("2"),
      ],
      west: [
        S("10"), S("9"), S("8"),
        H("8"), H("4"), H("3"),
        D("A"), D("10"), D("8"), D("3"), D("2"),
        C("Q"), C("9"),
      ],
    },
    bidding: {
      dealer: "south",
      bids: ["1NT", "P", "2C", "P", "2S", "P", "3NT", "P", "P", "P"],
    },
    commentary:
      "La licita. Nord ha il compito di portare la sua coppia alla miglior manche; prima di dire 3NT dovrebbe assicurarsi che non ci sia un fit nobile, quindi interroga con 2 fiori. La risposta di Sud esclude la quarta di cuori (quindi non ha senso che Nord le mostri) e 3NT e' l'ovvia conclusione. Est si regolera' a seconda della carta del morto: K sulla Q e J sul 9. Comunque si svolgano le prime due prese, Ovest deve guardare con attenzione tutte le carte (il suo 8 e' prezioso) e accorgersi che deve assolutamente superare con l'Asso l'onore di Est... perche', se conta le carte, sa che Est potrebbe non averne piu'! Se avra' questa prontezza il contratto (pur ottimo) cadra' di una presa. Altrimenti Sud senza fatica mettera' insieme ben 10 prese (4 picche, data la 3-3, 4 cuori, 2 fiori). 3NT - 1, in prima: -50. Oppure 3NT +1, in prima: 430.",
  },

  // Board 4 - Lesson 8
  {
    id: "8-4",
    lesson: 8,
    board: 4,
    title: "Le aperture di 1NT e 2NT",
    contract: "2S",
    declarer: "east",
    openingLead: { suit: "club", rank: "K" },
    vulnerability: "all",
    hands: {
      north: [
        S("A"), S("6"), S("3"),
        H("10"), H("9"), H("8"), H("7"),
        D("A"), D("K"), D("J"),
        C("9"), C("8"), C("5"),
      ],
      south: [
        S("K"), S("5"),
        H("J"), H("5"), H("2"),
        D("Q"), D("8"), D("6"), D("4"),
        C("K"), C("Q"), C("J"), C("2"),
      ],
      east: [
        S("J"), S("10"), S("8"), S("7"), S("4"), S("2"),
        H("6"), H("4"),
        D("9"), D("7"),
        C("10"), C("4"), C("3"),
      ],
      west: [
        S("Q"), S("9"),
        H("A"), H("K"), H("Q"), H("3"),
        D("10"), D("5"), D("3"), D("2"),
        C("A"), C("7"), C("6"),
      ],
    },
    bidding: {
      dealer: "west",
      bids: ["1NT", "P", "2S", "P", "P", "P"],
    },
    commentary:
      "La licita. Sarebbe una grande vigliaccata se Est decidesse di far giocare 1NT al compagno (e' il PASSO su 1NT che DECIDE il contratto, non l'apertura di 1NT!). Le sue carte, a Senza, non valgono niente, mentre giocando con atout picche porteranno mediamente 3 o 4 prese. Quindi deve imporre il parziale migliore, che e' 2 picche. Basta che le dica, Ovest DEVE passare. Est conta di fare 4 picche di mano (6 meno 2 da cedere), 3 cuori, 1 fiori, ma come sempre deve chiedersi: cosa succede se ora cedo la presa a picche? Succede che loro fanno 6 prese al volo: 2 picche appena affrancate, 2 quadri, 2 fiori. Morale: giocare immediatamente AKQ di cuori e scartate una quadri o una fiori, a scelta. Poi, atout. 2 picche: 110. Oppure 1NT - 3: -300.",
  },

  // Board 5 - Lesson 8
  {
    id: "8-5",
    lesson: 8,
    board: 5,
    title: "Le aperture di 1NT e 2NT",
    contract: "4H",
    declarer: "west",
    openingLead: { suit: "club", rank: "Q" },
    vulnerability: "ns",
    hands: {
      north: [
        S("Q"), S("10"), S("2"),
        H("6"),
        D("9"), D("6"), D("4"), D("2"),
        C("Q"), C("J"), C("10"), C("3"), C("2"),
      ],
      south: [
        S("J"), S("9"), S("3"),
        H("10"), H("8"), H("5"), H("4"),
        D("10"), D("7"),
        C("A"), C("K"), C("5"), C("4"),
      ],
      east: [
        S("A"), S("8"), S("7"), S("5"),
        H("A"), H("Q"), H("J"), H("2"),
        D("K"), D("J"),
        C("9"), C("8"), C("7"),
      ],
      west: [
        S("K"), S("6"), S("4"),
        H("K"), H("9"), H("7"), H("3"),
        D("A"), D("Q"), D("8"), D("5"), D("3"),
        C("6"),
      ],
    },
    bidding: {
      dealer: "north",
      bids: ["P", "1NT", "P", "2C", "P", "2NT", "P", "4H", "P", "P", "P"],
    },
    commentary:
      "La licita. Ovest e' certo di dover dichiarare una manche: i punti in linea sono 27/29. Quello che NON deve fare... e' dire 2 cuori (Est ha l'ordine di passare, e lo fara'). La via giusta e' l'interrogativa, per scoprire se c'e' fit a cuori. Est con 2NT mostra entrambe le quarte nobili e Ovest puo' concludere a 4 cuori. La difesa prova a incassare un'altra fiori ma Ovest taglia. Conta su 2 picche, 5 quadri (molto probabili), e 5 prese a cuori: le 4 del morto piu' il taglio appena fatto. Nessuna controindicazione al battere atout, ignorando la 4-1; poi K e J di quadri, picche per il Re e le restanti quadri. 4 cuori + 2, in prima: 480.",
  },

  // Board 6 - Lesson 8
  {
    id: "8-6",
    lesson: 8,
    board: 6,
    title: "Le aperture di 1NT e 2NT",
    contract: "2NT",
    declarer: "south",
    openingLead: { suit: "spade", rank: "Q" },
    vulnerability: "ew",
    hands: {
      north: [
        S("K"), S("8"),
        H("9"), H("8"), H("6"),
        D("J"), D("3"), D("2"),
        C("A"), C("10"), C("5"), C("4"), C("3"),
      ],
      south: [
        S("A"), S("9"), S("4"),
        H("A"), H("7"), H("5"),
        D("Q"), D("9"), D("6"), D("5"),
        C("K"), C("Q"), C("2"),
      ],
      east: [
        S("7"), S("6"), S("2"),
        H("Q"), H("J"), H("3"), H("2"),
        D("A"), D("10"), D("8"),
        C("J"), C("7"), C("6"),
      ],
      west: [
        S("Q"), S("J"), S("10"), S("5"), S("3"),
        H("K"), H("10"), H("4"),
        D("K"), D("7"), D("4"),
        C("9"), C("8"),
      ],
    },
    bidding: {
      dealer: "east",
      bids: ["P", "1NT", "P", "2NT", "P", "P", "P"],
    },
    commentary:
      "La licita. Le carte di Nord si prestano a un contratto a Senza (le lunghe minori portano prese anche a Senza, ma non hanno convenienza a essere atout... a meno che sia in ballo uno Slam), la sua incertezza pero' e' sulla somma punti: i suoi 8 portano a 23 se l'apertore ha 15, a 25 se ha 17. Il rialzo a 2NT comunica proprio questo; il compito di Sud e' passare se ha il minimo e rialzare a 3NT se ha 17 (o 16 bellissimi). Mano facile, 8 prese ci sono, salvo cattiva divisione delle fiori. Vinto l'attacco in mano (meglio lasciare il K di picche accanto alle fiori, non si sa mai) Sud gioca K e Q di fiori e prosegue con le altre fiori del morto. Poi si dovra' accontentare. 2NT: 120.",
  },

  // Board 7 - Lesson 8
  {
    id: "8-7",
    lesson: 8,
    board: 7,
    title: "Le aperture di 1NT e 2NT",
    contract: "4S",
    declarer: "north",
    openingLead: { suit: "heart", rank: "Q" },
    vulnerability: "all",
    hands: {
      north: [
        S("A"), S("Q"), S("J"), S("4"), S("3"),
        H("9"), H("8"), H("4"),
        D("9"), D("6"),
        C("Q"), C("J"), C("5"),
      ],
      south: [
        S("10"), S("9"), S("5"),
        H("A"), H("K"), H("5"),
        D("J"), D("5"), D("4"),
        C("A"), C("K"), C("9"), C("6"),
      ],
      east: [
        S("6"), S("2"),
        H("Q"), H("J"), H("10"), H("7"), H("3"),
        D("K"), D("Q"), D("3"),
        C("4"), C("3"), C("2"),
      ],
      west: [
        S("K"), S("8"), S("7"),
        H("6"), H("2"),
        D("A"), D("10"), D("8"), D("7"), D("2"),
        C("10"), C("8"), C("7"),
      ],
    },
    bidding: {
      dealer: "south",
      bids: ["1NT", "P", "2C", "P", "2D", "P", "2S", "P", "3S", "P", "4S", "P", "P", "P"],
    },
    commentary:
      "La licita. Nord ha un solo dubbio: la manche sara' 3NT se Sud ha due sole picche, o sara' 4 picche se Sud ha 3 o 4 carte. Interroga con la Stayman, e Sud nega quarte maggiori. Quarte, ma non terze: su 2 quadri ora Nord deve dire 2 picche. Sud deve capire: a) che le picche di Nord sono 5, sarebbe sciocco dire un colore quarto gia' sapendo che il fit non c'e'; b) che Nord vuole giocare una manche, altrimenti avrebbe detto 2 picche subito. Poiche' ha fit di 3 carte, Sud dichiara 3 picche (con 2 avrebbe ripiegato a 2NT) e ora Nord sa che manche dichiarare. Tutta discesa: vinto l'attacco a cuori si fa l'impasse al K di picche (per piacere, iniziate con il 10 o il 9). Catturato il Re e battute le atout si incassa il resto, per un totale di 11 prese: 5 picche, 2 cuori, 4 fiori. Nulla cambia con l'attacco quadri. 4 picche + 1, in seconda: 650.",
  },

  // Board 8 - Lesson 8
  {
    id: "8-8",
    lesson: 8,
    board: 8,
    title: "Le aperture di 1NT e 2NT",
    contract: "4H",
    declarer: "east",
    openingLead: { suit: "diamond", rank: "Q" },
    vulnerability: "ns",
    hands: {
      north: [
        S("A"), S("7"), S("6"), S("3"),
        H("9"), H("8"),
        D("9"), D("6"), D("2"),
        C("A"), C("10"), C("8"), C("2"),
      ],
      south: [
        S("10"), S("9"), S("5"), S("2"),
        H("A"), H("3"),
        D("Q"), D("J"), D("10"), D("8"),
        C("6"), C("5"), C("4"),
      ],
      east: [
        S("8"),
        H("K"), H("Q"), H("J"), H("10"), H("4"), H("2"),
        D("7"), D("5"), D("4"),
        C("K"), C("J"), C("7"),
      ],
      west: [
        S("K"), S("Q"), S("J"), S("4"),
        H("7"), H("6"), H("5"),
        D("A"), D("K"), D("3"),
        C("Q"), C("9"), C("3"),
      ],
    },
    bidding: {
      dealer: "west",
      bids: ["1NT", "P", "4H", "P", "P", "P"],
    },
    commentary:
      "Est deve fare attenzione, la somma di vincenti e affrancabili potrebbe portarlo fuori strada, se non considera i 'tempi' di gioco. Fara' 5 prese a cuori e 2 picche, e puo' affrancare 2 fiori e 2 picche. E gli avversari? Hanno 3 assi a disposizione, e stanno rosicchiando un'affrancabile a quadri. Se Est muove subito atout (Sud continua a quadri) andra' sotto di una! Vinto l'attacco, invece, Est dovra' affrettarsi a giocare il K di fiori. Nord prendera' per giocare quadri, ma ora Est e' in grado di scartare la cartina di quadri sulla Q di picche. Adesso, e solo adesso, battera' le atout. 4 cuori, in prima: 420.",
  },
];
