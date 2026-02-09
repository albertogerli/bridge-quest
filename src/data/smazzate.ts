/**
 * FIGB Corso Fiori - Smazzate Didattiche (Practice Hands)
 * Extracted from official FIGB teaching materials (Commissione Insegnamento, September 2017)
 *
 * Lesson 1: Vincenti e affrancabili (Winners and establishable cards)
 * Lesson 2: Il punto di vista dei difensori (The defenders' point of view)
 * Lesson 3: Affrancamenti di lunga e di posizione (Length and positional establishment)
 * Lesson 4: Il piano di gioco a senz'atout (The game plan in no trump)
 */

import type { Suit, Rank, Card, Position } from "../lib/bridge-engine";

export type Vulnerability = "none" | "ns" | "ew" | "both";

export interface BiddingData {
  dealer: Position;
  bids: string[]; // Sequential bids starting from dealer, e.g. ["1NT", "P", "3NT", "P", "P", "P"]
}

export interface Smazzata {
  id: string;
  lesson: number;
  board: number;
  title: string;
  contract: string;
  declarer: Position;
  openingLead: Card;
  vulnerability: Vulnerability;
  hands: {
    north: Card[];
    south: Card[];
    east: Card[];
    west: Card[];
  };
  commentary: string;
  bidding?: BiddingData;
}

// Helper to build a Card
function c(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

// Helper to build an array of Cards from a suit and rank string
function hand(
  spades: Rank[],
  hearts: Rank[],
  diamonds: Rank[],
  clubs: Rank[]
): Card[] {
  return [
    ...spades.map((r) => c("spade", r)),
    ...hearts.map((r) => c("heart", r)),
    ...diamonds.map((r) => c("diamond", r)),
    ...clubs.map((r) => c("club", r)),
  ];
}

export const smazzate: Smazzata[] = [
  // ==========================================================================
  // LESSON 1: Vincenti e affrancabili (Winners and establishable cards)
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "1-1",
    lesson: 1,
    board: 1,
    title: "Vincenti e affrancabili",
    contract: "3NT",
    declarer: "north",
    openingLead: c("spade", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "K", "6", "3"], ["A", "6", "4"], ["K", "Q"], ["A", "8", "6", "3"]),
      east: hand(["Q", "J", "10", "9", "2"], ["J", "9", "3"], ["9", "8"], ["J", "10", "4"]),
      south: hand(["7", "5"], ["8", "7", "5"], ["A", "J", "10", "5", "2"], ["9", "5", "2"]),
      west: hand(["8", "4"], ["K", "Q", "10", "2"], ["7", "6", "4", "3"], ["K", "Q", "7"]),
    },
    commentary:
      "Est sceglie il suo miglior colore e seleziona la Dama; Ovest potra dedurre che Est ha sicuramente il Fante, ma non ha assolutamente il Re. Il Gioco. Nord conta: 2 prese certe a picche, 1 a cuori, 1 a fiori. Altre 5 prese sono a disposizione, con certezza quasi assoluta, nel colore di quadri, in quanto Sud ha 5 carte e tra Nord e Sud vi sono le 5 carte piu alte del colore. Ma e necessario un piccolo spreco: Nord deve incassare per primo uno dei suoi onori di quadri, poi deve giocare l'altro e superarlo con l'Asso del morto. Solo cosi potra proseguire incassando anche J,10 e 5. Infine incassera le vincenti negli altri colori. 3NT, in prima: 400 (40+30+30 le prese dichiarate, + 300 di Bonus di manche)",
    bidding: { dealer: "north", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "1-2",
    lesson: 1,
    board: 2,
    title: "Vincenti e affrancabili",
    contract: "1NT",
    declarer: "east",
    openingLead: c("heart", "Q"),
    vulnerability: "ns",
    hands: {
      north: hand(["K", "Q", "6", "3"], ["K", "9", "7"], ["K", "8", "6"], ["10", "8", "4"]),
      east: hand(["A", "10", "5"], ["A", "8", "4"], ["J", "10", "7", "3"], ["A", "K", "2"]),
      south: hand(["J", "4"], ["Q", "J", "10", "6", "3"], ["A", "Q", "5", "4"], ["9", "3"]),
      west: hand(["9", "8", "7", "2"], ["5", "2"], ["9", "2"], ["Q", "J", "7", "6", "5"]),
    },
    commentary:
      "Sud sceglie il suo colore piu lungo e intavola la Dama; questo attacco promuove il Fante e nega il Re. Il Gioco. Est puo contare su 7 vincenti gia disponibili: 1 a picche, 1 a cuori, e 5 a fiori, purche le 5 carte restanti non siano tutte in mano allo stesso avversario. Non avra difficolta a mantenere il contratto, purche le fiori siano mosse correttamente: prima l'Asso ed il Re, poi la cartina per incassare le fiori restanti. 1NT, 90 (40 la presa dichiarata, + 50 di bonus del parziale)",
    bidding: { dealer: "east", bids: ["1NT", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "1-3",
    lesson: 1,
    board: 3,
    title: "Vincenti e affrancabili",
    contract: "3NT",
    declarer: "south",
    openingLead: c("club", "2"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "K", "Q", "6"], ["J", "10", "7"], ["Q", "9", "2"], ["10", "6", "3"]),
      east: hand(["J", "10", "9", "4", "3", "2"], ["Q", "8", "4"], ["A", "6"], ["K", "8"]),
      south: hand(["7", "5"], ["A", "6", "3", "2"], ["K", "J", "10", "4", "3"], ["A", "J"]),
      west: hand(["8"], ["K", "9", "5"], ["8", "7", "5"], ["Q", "9", "7", "5", "4", "2"]),
    },
    commentary:
      "Attacco: 2 di fiori. Est deve giocare il suo Re. Sud ha a disposizione 5 vincenti: 3 a picche, 1 a cuori, 1 a fiori. Le quadri, sorgente di prese, presentano ben cinque carte equivalenti, tra mano e morto: bastera giocare una di queste (meglio iniziare con la Q o il 9) e insistere finche non scende l'Asso, per ottenere altre 4 prese affrancate. Sarebbe un errore grave iniziare con AKQ di picche: Est, quando entrera in presa con l'Asso di quadri, avra 3 picche franche, che aggiunte alla Dama di fiori batteranno il contratto: sotto di una. 3NT+1, in prima, 430 punti (40+30+30 le prese dichiarate, + 30 la presa in piu, + 300 di bonus di manche)",
    bidding: { dealer: "south", bids: ["1D", "P", "1S", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "1-4",
    lesson: 1,
    board: 4,
    title: "Vincenti e affrancabili",
    contract: "3NT",
    declarer: "west",
    openingLead: c("spade", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["J", "10", "9", "7"], ["A", "K"], ["9", "6", "4", "3"], ["7", "6", "4"]),
      east: hand(["8", "6", "3"], ["8", "4"], ["A", "K", "2"], ["10", "9", "8", "5", "3"]),
      south: hand(["5", "4", "2"], ["9", "7", "6", "5", "3"], ["J", "7", "5"], ["A", "K"]),
      west: hand(["A", "K", "Q"], ["Q", "J", "10", "2"], ["Q", "10", "8"], ["Q", "J", "2"]),
    },
    commentary:
      "Attacco J di picche... e non cuori (incassando AK lavorerebbe a favore di Ovest). Ovest ha 6 vincenti: 3 a picche e 3 a quadri. E non deve aver fretta di incassarle. Le fiori, mancanti di Asso e Re, possono offrire 3 affrancabili (Est ha 5 carte, 2 vanno cedute). Ovest, vinto l'attacco, deve immediatamente giocare la Dama di fiori, e continuare con il Fante di fiori quando avra vinto il rinvio dei difensori. Se cade in tentazione con uno o piu giri a fiori sempre picche, perdera il contratto (NS hanno 4 vincenti... piu una A di Nord che si affrancherebbe). 3NT, in seconda: 600 (40+30+30 le prese dichiarate, + 500 di bonus di manche)",
    bidding: { dealer: "west", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "1-5",
    lesson: 1,
    board: 5,
    title: "Vincenti e affrancabili",
    contract: "6NT",
    declarer: "north",
    openingLead: c("heart", "J"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "K", "2"], ["K", "Q", "5", "2"], ["A", "K", "J"], ["A", "6", "4"]),
      east: hand(["J", "9", "5", "3"], ["J", "10", "9", "7"], ["8", "6"], ["10", "8", "2"]),
      south: hand(["8", "7", "6", "4"], ["A"], ["Q", "10", "9", "5", "4", "2"], ["Q", "5"]),
      west: hand(["Q", "10"], ["8", "6", "4", "3"], ["7", "3"], ["K", "J", "9", "7", "3"]),
    },
    commentary:
      "Est attacca J di cuori (la figura di cuori e picche sono piu solide). Il gioco. Nord conta 2 prese a picche, 3 a cuori, 6 a quadri, 1 a fiori: 12! Preso l'attacco con l'Asso si dedica subito al colore di quadri... facendo attenzione: e assolutamente necessario che la TERZA presa (quella in cui saranno esaurite le quadri di Nord) sia vinta dalla Dama di Sud; solo cosi potra continuare ad incassare le altre quadri. Quindi i primi onori da usare sono Asso e Re, poi il Fante... avendo cura di superarlo con la Dama! 6NT, in seconda: 1440 (190 le prese dichiarate + 500 di bonus di manche in zona + 750 di bonus di Piccolo Slam in zona)",
    bidding: { dealer: "north", bids: ["2NT", "P", "6NT", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "1-6",
    lesson: 1,
    board: 6,
    title: "Vincenti e affrancabili",
    contract: "3NT",
    declarer: "east",
    openingLead: c("spade", "10"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "5", "4"], ["K", "Q", "J", "9"], ["A", "6", "4"], ["10", "8", "6"]),
      east: hand(["J", "6"], ["8", "6", "4", "3"], ["K", "8", "3"], ["A", "K", "Q", "5"]),
      south: hand(["10", "9", "8", "3", "2"], ["7", "2"], ["9", "2"], ["9", "4", "3", "2"]),
      west: hand(["K", "Q", "7"], ["A", "10", "5"], ["Q", "J", "10", "7", "5"], ["J", "7"]),
    },
    commentary:
      "Il gioco. L'attacco non disturba... ma il rinvio si! Se Nord si guarda le carte si accorge che puo battere il contratto, prendendo con l'Asso di picche e giocando il Re di cuori. Quando Est dovra cedere l'Asso di quadri, Nord potra incassare le cuori affrancate e guadagnare 100 punti (una sotto: 1 picche, 3 cuori e 1 quadri). Se Nord sonnecchia... Est avra il tempo per affrancare 4 prese a picche, da sommare a 4 fiori, la cuori, e le due picche. 3NT - 1: -100. Se il controgioco e difettoso... 3NT+2: 660 (100 le prese dichiarate, + 60 per le due prese in piu, + 500 di bonus di manche in zona)",
    bidding: { dealer: "west", bids: ["1D", "P", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "1-7",
    lesson: 1,
    board: 7,
    title: "Vincenti e affrancabili",
    contract: "1NT",
    declarer: "south",
    openingLead: c("diamond", "A"),
    vulnerability: "both",
    hands: {
      north: hand(["K", "Q", "J", "9", "2"], ["9", "8", "7"], ["Q", "9"], ["Q", "J", "3"]),
      east: hand(["10", "8", "5"], ["J", "3"], ["8", "6", "5", "3"], ["A", "K", "10", "9"]),
      south: hand(["A", "6"], ["A", "K", "5", "2"], ["10", "4", "2"], ["8", "7", "5", "2"]),
      west: hand(["7", "4", "3"], ["Q", "10", "6", "4"], ["A", "K", "J", "7"], ["6", "4"]),
    },
    commentary:
      "Ovest attacca con l'Asso di quadri e, vedendo al morto Q9, sa di poter incassare almeno tre prese a quadri di fila, quindi prosegue con il K, il J ed il 7, preso da Est con l'8. Ora Est ha altre due prese a fiori da incassare. Tutto facile per la difesa, ma la domanda e: cosa ha scartato Sud, dalla mano e dal morto? Sud non ha difficolta, sul quarto giro di quadri scarta fiori. Il morto... NON deve scartare picche (fara 5 prese nel colore, ma solo se le conserva tutte); NON DEVE scartare il 3 di fiori (altrimenti Est fara 4 prese e non due). Puo tranquillamente scartare due cuori, che non hanno influenza sulle prese che ha a disposizione nel colore. 1NT: 90 (40 per la presa dichiarata, + 50 di bonus del parziale). Oppure 1SA - 1, o - 2, se ha scartato male (-100, - 200)",
    bidding: { dealer: "south", bids: ["1NT", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "1-8",
    lesson: 1,
    board: 8,
    title: "Vincenti e affrancabili",
    contract: "7NT",
    declarer: "west",
    openingLead: c("club", "J"),
    vulnerability: "none",
    hands: {
      north: hand(["6", "5", "3"], ["J", "4", "3"], ["8", "7", "3"], ["J", "10", "9", "7"]),
      east: hand(["J", "7"], ["A", "8", "7", "6"], ["J", "10", "6", "5", "4"], ["Q", "2"]),
      south: hand(["10", "9", "8", "4"], ["10", "9", "5", "2"], ["9", "2"], ["K", "6", "5"]),
      west: hand(["A", "K", "Q", "2"], ["K", "Q"], ["A", "K", "Q"], ["A", "8", "4", "3"]),
    },
    commentary:
      "L'attacco di Fante aiuta Sud a fare la cosa giusta: mettera il Re se viene giocata la Dama, e... lascera lavorare il Fante se il morto sta basso. Il gioco. Ci sono 13 vincenti: 4 a picche, 3 a cuori, 5 a quadri, 1 a fiori. Ma occorre muoversi con accortezza, le cose non sono mai facili quando una delle due mani e ricchissima e l'altra e povera. Ovest deve prendere l'attacco, incassare AKQ di quadri e KQ di cuori, dare la presa al morto giocando il 2 di fiori per il Fante e proseguire con le altre due quadri e l'Asso di cuori. Poi tornera 'in mano' per terminare con AKQ di picche: 13 prese. 7NT, in prima: 1520 (220 per le prese dichiarate + 300 bonus di manche + 1000 bonus Grande slam in prima).",
    bidding: { dealer: "west", bids: ["2C", "P", "2D", "P", "3NT", "P", "7NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 2: Il punto di vista dei difensori (The defenders' point of view)
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "2-1",
    lesson: 2,
    board: 1,
    title: "Il punto di vista dei difensori",
    contract: "3NT",
    declarer: "north",
    openingLead: c("heart", "2"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "K", "5", "2"], ["Q", "6"], ["Q", "J"], ["A", "K", "8", "6", "2"]),
      east: hand(["Q", "10", "6"], ["A", "10", "8", "3", "2"], ["7", "6"], ["Q", "10", "3"]),
      south: hand(["J", "4"], ["9", "7", "4"], ["A", "K", "10", "9", "2"], ["7", "5", "4"]),
      west: hand(["9", "8", "7", "3"], ["K", "J", "5"], ["8", "5", "4", "3"], ["J", "9"]),
    },
    commentary:
      "E' un ottimo attacco per la difesa, l'unico che consente di battere il contratto. Ovest ha K e J, non si tratta di carte equivalenti, quindi deve mettere la piu alta: il Re. Rimasto in presa deve giocare ancora cuori; il Fante e non il 5 (se muovesse il 5, gli rimarrebbe in mano una cuori piu alta di quelle di Est, impedendone l'incasso). Il gioco. Nord e destinato ad andare sotto di una, se la difesa non pasticcia; se cosi e, Nord potra incassare 2 picche, 2 fiori, e 5 quadri (purche abbia cura di far vincere la seconda presa al morto, superando la Dama o il Fante). 3NT -1, in prima: -50. Oppure 3NT, in prima: 400 (100 per le prese + 300 di Bonus)",
    bidding: { dealer: "north", bids: ["1C", "P", "1D", "P", "1S", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "2-2",
    lesson: 2,
    board: 2,
    title: "Il punto di vista dei difensori",
    contract: "3NT",
    declarer: "east",
    openingLead: c("heart", "A"),
    vulnerability: "ns",
    hands: {
      north: hand(["J", "10", "3", "2"], ["9", "6", "5", "4"], ["10", "3", "2"], ["K", "9"]),
      east: hand(["Q", "9", "7", "5"], ["J"], ["K", "Q", "9", "8", "5"], ["A", "6", "4"]),
      south: hand(["8", "6"], ["A", "K", "Q", "8", "3"], ["7", "6"], ["Q", "7", "5", "2"]),
      west: hand(["A", "K", "4"], ["10", "7", "2"], ["A", "J", "4"], ["J", "10", "8", "3"]),
    },
    commentary:
      "Attacco facile: Asso di cuori, poi Re...poi Dama.. e poi le altre due carte, per un totale di 5 prese veloci e contratto battuto. Ma c'e una trappola: Nord, quando vede cadere il Fante nella prima presa, non ha ancora la certezza che sia l'unica carta di Est. Ma quando lo vede scartare, sulla seconda presa, conosce perfettamente la distribuzione e le carte di Sud! Deve quindi fare attenzione a non affezionarsi egoisticamente al suo 9, anzi lo deve assolutamente buttar via quando Sud incassa la Dama, altrimenti Sud non fara mai la quinta carta e Est manterra il contratto con 3 picche, 5 quadri (AJ i primi onori da giocare), e 1 fiori. 3NT -1, in prima: -50. Oppure 3NT in prima: 400 (100 per le prese + 300 di Bonus)",
    bidding: { dealer: "west", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "2-3",
    lesson: 2,
    board: 3,
    title: "Il punto di vista dei difensori",
    contract: "3NT",
    declarer: "south",
    openingLead: c("spade", "2"),
    vulnerability: "ew",
    hands: {
      north: hand(["8", "7"], ["A", "K", "7", "5"], ["A", "J", "2"], ["7", "6", "4", "3"]),
      east: hand(["J", "10", "5"], ["Q", "J", "10", "4"], ["10", "9", "5"], ["9", "8", "2"]),
      south: hand(["A", "K", "3"], ["9", "3", "2"], ["K", "Q", "6"], ["Q", "J", "10", "5"]),
      west: hand(["Q", "9", "6", "4", "2"], ["8", "6"], ["8", "7", "4", "3"], ["A", "K"]),
    },
    commentary:
      "Attacco 2 di picche, Est gioca il 10, la piu bassa delle equivalenti. Il gioco. Questa smazzata puo avere esiti diversi: - se Ovest inizia con AK di fiori, Sud fara 9 prese senza fatica. - se Ovest gioca un solo onore di fiori, poi gioca picche, Sud fara ancora 9 prese se rigioca fiori immediatamente per completare l'affrancamento - se Ovest attacca a picche, e dalla prima presa (7-10-K) si accorge che il J e in Est, e continua con il 4 di picche quando entra in presa a fiori (evitando di incassare anche l'altro onore)...il contratto cadra. Ogni linea possiede AK nel colore dell'avversario; vince la corsa chi ha incominciato prima: Est-Ovest. 3NT - 1, in prima: -50. Oppure 3NT in prima 400 (100 per le prese + 300 di Bonus)",
    bidding: { dealer: "south", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "2-4",
    lesson: 2,
    board: 4,
    title: "Il punto di vista dei difensori",
    contract: "3NT",
    declarer: "west",
    openingLead: c("spade", "2"),
    vulnerability: "both",
    hands: {
      north: hand(["K", "8", "7", "6", "2"], ["9", "8", "3", "2"], ["A", "4"], ["5", "3"]),
      east: hand(["9", "4"], ["K", "6", "5"], ["K", "Q", "J", "10"], ["8", "7", "6", "4"]),
      south: hand(["Q", "J", "3"], ["J", "10", "7"], ["9", "3", "2"], ["J", "10", "9", "2"]),
      west: hand(["A", "10", "5"], ["A", "Q", "4"], ["8", "7", "6", "5"], ["A", "K", "Q"]),
    },
    commentary:
      "Attacco 2 di picche, la piu alta delle toccanti di Nord, facendo sequenza l'attacco e fatto con una cartina di coda. La prima presa e illuminante: Sud inserisce il Fante e Ovest prende con l'Asso; per Nord e tutto chiaro, la logica - e gli accordi - assegnano la dama di picche a Sud con certezza assoluta. Quindi, quando entrera in presa con l'Asso di quadri, rigiochera una piccola picche e non il Re: solo cosi la sua coppia potra incassare facilmente 4 prese, e battere il contratto. 3NT - 1, in seconda: -100. Oppure 3NT + 1, in seconda: 630 (130 per le prese, + 500 di bonus)",
    bidding: { dealer: "west", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "2-5",
    lesson: 2,
    board: 5,
    title: "Il punto di vista dei difensori",
    contract: "6NT",
    declarer: "north",
    openingLead: c("heart", "K"), // The PDF shows "Attacco: ?" as a teaching quiz; the commentary reveals the correct lead is the King of hearts
    vulnerability: "ns",
    hands: {
      north: hand(["A", "K", "5"], ["A", "J"], ["K", "Q", "9", "8", "7"], ["K", "Q", "8"]),
      east: hand(["J", "10", "9", "8", "4"], ["K", "Q", "6"], ["5", "4"], ["A", "7", "4"]),
      south: hand(["Q", "6", "2"], ["10", "9", "2"], ["A", "J", "6"], ["J", "10", "9", "2"]),
      west: hand(["7", "3"], ["8", "7", "5", "4", "3"], ["10", "3", "2"], ["6", "5", "3"]),
    },
    commentary:
      "Attacco....e il vero problema: sono in ballo 1440 punti e tutto dipende dall'attacco di Est! Se la scelta cade sulle picche (J), o sull'asso di fiori, o sulle quadri (?), Nord manterra il contratto: gli spettano 3 picche, 1 cuori, 5 quadri e puo trovare 3 affrancabili a fiori (colore che muovera per primo, appena potra prendere). Ma non se l'attacco e Re di cuori: Est entrera prima o poi in presa con l'Asso di fiori, e incassera la Dama di cuori: una sotto. Puo Est prevedere questo, quando sceglie l'attacco? Certamente si, gli bastano due prese per battere lo Slam, e a cuori sarebbe stato l'attacco corretto. Se il contratto fosse stato 1NT, o 3NT, picche sarebbe stato l'attacco corretto. 6NT - 1, in seconda: -100. Oppure 6NT, in seconda: 1440 (190 le prese, + 600 bonus di manche, + 750 bonus di Slam)",
    bidding: { dealer: "north", bids: ["2NT", "P", "6NT", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "2-6",
    lesson: 2,
    board: 6,
    title: "Il punto di vista dei difensori",
    contract: "3NT",
    declarer: "east",
    openingLead: c("spade", "Q"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "4", "3"], ["A", "9", "3", "2"], ["10", "6", "5", "2"], ["9", "8"]),
      east: hand(["K"], ["Q", "7", "6", "4"], ["A", "K", "Q", "8", "7"], ["A", "K", "10"]),
      south: hand(["Q", "J", "10", "9", "2"], ["K", "10", "8"], ["9", "3"], ["5", "3", "2"]),
      west: hand(["8", "7", "6", "5"], ["J", "5"], ["J", "4"], ["Q", "J", "7", "6", "4"]),
    },
    commentary:
      "Il gioco. L'attacco non disturba... ma il rinvio si! Se Nord si guarda le carte si accorge che puo battere il contratto, prendendo con l'Asso di picche e giocando il Re di cuori. Quando Est dovra cedere l'Asso di quadri, Nord potra incassare le cuori affrancate e guadagnare 100 punti. 3NT - 3, in seconda: -300. Oppure 3NT + 2, in seconda: 660 (160 le prese + 500 di bonus).",
    bidding: { dealer: "east", bids: ["1D", "P", "1H", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "2-7",
    lesson: 2,
    board: 7,
    title: "Il punto di vista dei difensori",
    contract: "3NT",
    declarer: "south",
    openingLead: c("spade", "Q"),
    vulnerability: "both",
    hands: {
      north: hand(["6", "4", "2"], ["A", "9"], ["J", "10", "9", "6", "3"], ["A", "K", "4"]),
      east: hand(["K", "8"], ["Q", "J", "10", "7", "3", "2"], ["5", "2"], ["9", "8", "7"]),
      south: hand(["A", "7", "5"], ["K", "6", "5", "4"], ["K", "Q", "7"], ["Q", "J", "3"]),
      west: hand(["Q", "J", "10", "9", "3"], ["8"], ["A", "8", "4"], ["10", "6", "5", "2"]),
    },
    commentary:
      "Attacco facile: Q di picche, la piu alta delle toccanti. L'esito del contratto dipende da Est: se la prima presa si svolge Q - 2 - 8 - Asso, Sud guadagnera 630 punti (3NT + 1); giochera subito il K o la Q di quadri e affranchera 4 prese, oltre alle 2 prese a cuori e 3 fiori. Ovest prendera con l'Asso e rigiochera picche... ma il Re che Est si e conservato il mano impedira ai difensori di incassare tutto il colore. Se quel prezioso Re viene giocato nella prima presa (sblocco), Ovest potra incassare le sue 4 prese (4 picche + l'Asso di quadri) e battere il contratto. 3NT - 1, in seconda: -100. Oppure 3NT + 1, in seconda: 630 (130 per le prese, + 500 di bonus)",
    bidding: { dealer: "south", bids: ["1D", "P", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "2-8",
    lesson: 2,
    board: 8,
    title: "Il punto di vista dei difensori",
    contract: "1NT",
    declarer: "west",
    openingLead: c("club", "J"), // Diagram shows J♣; commentary references "J di quadri" but the diagram lead card is clubs
    vulnerability: "none",
    hands: {
      north: hand(["A", "K"], ["10", "3"], ["A", "J", "10", "9", "3"], ["J", "8", "5", "4"]),
      east: hand(["9", "8"], ["A", "9", "6"], ["6", "5", "4"], ["Q", "10", "7", "3", "2"]),
      south: hand(["10", "7", "6", "5", "4"], ["Q", "J", "8", "5"], ["K", "8", "7"], ["9"]),
      west: hand(["Q", "J", "3", "2"], ["K", "7", "4", "2"], ["Q", "2"], ["A", "K", "6"]),
    },
    commentary:
      "Attacco: J di quadri, la piu alta delle toccanti. L'attacco di Fante nega la Dama (quindi Sud sa con certezza che la Dama e in Ovest) ma non esclude un onore piu alto, in cima al colore. Per questo motivo Sud DEVE giocare il suo Re nella prima presa, intanto: - se Ovest ha AQ, fara 2 prese in ogni caso, e non di piu - se Ovest ha la Dama, ma non l'Asso, non mettere il Re sarebbe disastroso! Ovest non puo far nulla... a meno che Sud sbagli e gli lasci vincere la prima presa. In tal caso iniziera incassando Asso e Re di fiori, e accorgendosi di come sono divise rigiochera il 6... superando di misura la carta di Nord. Fara cosi 5 a quadri 1 cuori, 2 cuori. 1NT - 1, in prima: -50. Oppure 1NT+1, in prima: 120 (70 le prese, + 50 di bonus)",
    bidding: { dealer: "west", bids: ["1NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 3: Affrancamenti di lunga e di posizione (Length and positional establishment)
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "3-1",
    lesson: 3,
    board: 1,
    title: "Affrancamenti di lunga e di posizione",
    contract: "6NT",
    declarer: "north",
    openingLead: c("heart", "J"),
    vulnerability: "none",
    hands: {
      north: hand(["6", "4", "2"], ["K", "Q", "5"], ["8", "6", "5", "3"], ["10", "7", "5"]),
      east: hand(["K", "8", "5"], ["J", "10", "9", "6", "4"], ["9", "4", "2"], ["J", "8"]),
      south: hand(["A", "Q", "J"], ["A", "8", "2"], ["A", "K", "Q", "J"], ["A", "K", "6"]),
      west: hand(["10", "9", "7", "3"], ["7", "3"], ["10", "7"], ["Q", "9", "4", "3", "2"]),
    },
    commentary:
      "Attacco: J di cuori, la piu alta delle toccanti. Il gioco. Nord puo vincere la presa sia al morto in mano: prima di decidere, e bene avere le idee chiare su cosa fare subito dopo. Le vincenti sono 10: 1 picche, 3 cuori, 4 quadri e 2 fiori. La condizione e che il Re sia in mano a Est, e che Nord esegua per DUE volte la manovra di impasse, da Nord verso Sud. Ora sappiamo da che parte vincere l'attacco: Nord! E subito impasse a picche. Visto che ha successo, si rigioca piccola cuori per l'altro onore di Nord e si ripete l'impasse, poi si prosegue sereni all'incasso delle vincenti negli altri colori. 6NT, in prima: 990 (190 le prese, + 300 di bonus di manche, + 500 di bonus di piccolo slam)",
    bidding: { dealer: "south", bids: ["2C", "P", "2D", "P", "2NT", "P", "6NT", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "3-2",
    lesson: 3,
    board: 2,
    title: "Affrancamenti di lunga e di posizione",
    contract: "3NT",
    declarer: "east",
    openingLead: c("spade", "10"),
    vulnerability: "ns",
    hands: {
      north: hand(["J", "3"], ["Q", "10", "8", "3", "2"], ["J", "9"], ["K", "J", "10", "4"]),
      east: hand(["7", "6", "5", "4"], ["6", "4"], ["A", "K"], ["A", "8", "5", "3", "2"]),
      south: hand(["Q", "10", "9", "8", "2"], ["J", "9"], ["10", "8", "6", "3"], ["Q", "9"]),
      west: hand(["A", "K"], ["A", "K", "7", "5"], ["Q", "7", "5", "4", "2"], ["7", "6"]),
    },
    commentary:
      "Attacco: 10 di picche, che promuove il 9, nega il Fante, non esclude onori piu alti. Il gioco. Est conta le vincenti: 2 picche, 2 cuori, 3 quadri, 1 fiori. Serve una presa, ed e ragionevole riguardare con affetto le quadri (se fossero divise 3-3, darebbero 5 prese). Il colore e bloccato, quindi da la prima manovra, dopo aver vinto l'attacco, e incassare A e K di quadri. Poi si deve tornare al morto (meglio usare le cuori e lasciar li l'ultimo baluardo di picche). Si incassa la Dama di quadri ma si scopre la 4-2: poco male, tutti i colori sono ancora controllati... basta rigiocare quadri e affrancare cosi la quinta carta. Qualunque sia il ritorno di Sud, il contratto e mantenuto. 3NT, in prima: 400 (100 per le prese + 300 di bonus)",
    bidding: { dealer: "west", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "3-3",
    lesson: 3,
    board: 3,
    title: "Affrancamenti di lunga e di posizione",
    contract: "3NT",
    declarer: "south",
    openingLead: c("heart", "J"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "K", "6", "3"], ["K", "7"], ["7", "6", "5", "3"], ["A", "10", "4"]),
      east: hand(["J", "8", "4", "2"], ["8", "4", "2"], ["K", "Q", "9"], ["Q", "J", "2"]),
      south: hand(["10", "7"], ["A", "Q", "6"], ["A", "10", "8", "4", "2"], ["K", "8", "5"]),
      west: hand(["Q", "9", "5"], ["J", "10", "9", "5", "3"], ["J"], ["9", "7", "6", "3"]),
    },
    commentary:
      "Attacco: J di cuori, la piu alta delle toccanti del miglior colore di Ovest. Il gioco. Sud ha 8 vincenti, facili da contare: 2 picche, 3 cuori, 1 quadri e 2 fiori. E anche facile individuare il colore in cui affrancarne almeno una: quadri. Vinto l'attacco Sud, resistendo a ogni tentazione, gioca immediatamente l'asso di quadri e ancora quadri. Vincera Est, e qualunque sia il suo rinvio Sud ostinatamente proseguira a quadri. Ora avra in mano due cartine affrancate, da aggiungere alle 8 vincenti gia conteggiate. 3NT + 2, in prima: 460 (160 le prese + 300 di bonus). Se Sud, ignorando le brutte quadri, ha fatto la cicala e ha incassato un po' di vincenti a caso, metta da parte il manuale e si rilegga La Fontaine: tra cicale e formiche non c'e corsa!",
    bidding: { dealer: "south", bids: ["1D", "P", "1S", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "3-4",
    lesson: 3,
    board: 4,
    title: "Affrancamenti di lunga e di posizione",
    contract: "3NT",
    declarer: "west",
    openingLead: c("club", "Q"),
    vulnerability: "both",
    hands: {
      north: hand(["10", "8", "2"], ["Q"], ["7", "6", "4", "3"], ["Q", "J", "10", "4", "3"]),
      east: hand(["K", "6", "4"], ["J", "6", "5", "3"], ["A", "K", "2"], ["K", "6", "2"]),
      south: hand(["A", "Q", "J", "9"], ["10", "8", "4", "2"], ["J", "10", "9"], ["8", "7"]),
      west: hand(["7", "5", "3"], ["A", "K", "9", "7"], ["Q", "8", "5"], ["A", "9", "5"]),
    },
    commentary:
      "Attacco Q di fiori, da sequenza. Il gioco. Ovest ha 7 vincenti in partenza: 2 cuori, 3 quadri e 2 fiori. Deve trovare altre due prese. E possibile che l'expasse a picche abbia buon esito, ma anche se fosse sarebbe l'ottava presa e ne mancherebbe ancora una, da cercare a cuori. Allora, tanto vale cominciare dalle cuori. Iniziare con il Fante e una pessima idea (non abbiamo il 10). Incassando un onore, vediamo cadere la Dama. Contiamo le carte: se Nord ha una cuori sola, Sud ne ha ancora 3, e ha il 10. Quindi cuori per il Fante e cuori dal morto, superando di misura la carta di Sud, faremo 4 prese nel colore. 3NT, in seconda: 600 (100 le prese, + 500 di bonus)",
    bidding: { dealer: "west", bids: ["1H", "P", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "3-5",
    lesson: 3,
    board: 5,
    title: "Affrancamenti di lunga e di posizione",
    contract: "3NT",
    declarer: "north",
    openingLead: c("spade", "10"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "K", "7"], ["A", "9", "5", "2"], ["A", "K", "6"], ["A", "7", "4"]),
      east: hand(["10", "9", "8", "3", "2"], ["K", "J", "4"], ["J", "8", "2"], ["K", "9"]),
      south: hand(["Q", "J"], ["10", "7", "6"], ["9", "7", "5", "4", "3"], ["J", "8", "6"]),
      west: hand(["6", "5", "4"], ["Q", "8", "3"], ["Q", "10"], ["Q", "10", "5", "3", "2"]),
    },
    commentary:
      "Attacco 10 di picche, la piu alta della sequenza. Il gioco. La forza in linea e molto sbilanciata, eppure Sud porta una sorgente di prese, nella lunga di quadri. Nord ha solo 7 vincenti, deve sperare di affrancare il colore del morto augurandosi che le quadri siano divise 3-2: otterranno 2 prese di lunga. Ma come andra ad incassarle? Il solo passaggio dalla mano al morto e dato solo dal 7 di fiori, superabile con la Q o il J. Se avete lasciato vincere la prima presa al morto, siete fritti. Superate il J con il K, giocate A e K di quadri e fiori. Qualunque sia il ritorno, il prezioso 7 di fiori vi consentira di andare al morto a incassare le quadri affrancate. 3NT, in seconda: 600 (100 le prese + 500 di bonus)",
    bidding: { dealer: "north", bids: ["2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "3-6",
    lesson: 3,
    board: 6,
    title: "Affrancamenti di lunga e di posizione",
    contract: "6NT",
    declarer: "east",
    openingLead: c("club", "10"),
    vulnerability: "ew",
    hands: {
      north: hand(["K", "J", "10", "8"], ["10", "8", "4", "2"], ["9", "5", "3"], ["3", "2"]),
      east: hand(["7", "5", "2"], ["A", "7", "3"], ["A", "J", "4"], ["K", "Q", "J", "6"]),
      south: hand(["9", "6", "4"], ["K", "J", "9"], ["10", "2"], ["10", "9", "8", "5", "4"]),
      west: hand(["A", "Q", "3"], ["Q", "6", "5"], ["K", "Q", "8", "7", "6"], ["A", "7"]),
    },
    commentary:
      "Attacco 10 di fiori, da sequenza. Il gioco. Est conta 5 prese a picche, 4 a fiori, e i due Assi: 11. La presa mancante e affidata alla buona sorte: l'expasse alla di Dama cuori (giocando piccola verso la Q) oppure l'impasse al Re di cuori (giocando piccola verso AQ) dovra fornire questa presa. Da quale cominciare? E una differenza di importanza vitale! Riflettete: se cominciate con l'expasse, e va male, avete ancora la possibilita di provare l'impasse. Se iniziate con l'impasse, e va male... non avete piu chance. Quindi, CUORI VERSO LA DAMA. Subito, senza perdere tempo (e collegamenti) con fiori e quadri! 6NT, in seconda: 1440 (190 le prese, + 500 di bonus di manche in zona + 750 di bonus di Slam)",
    bidding: { dealer: "west", bids: ["1D", "P", "1S", "P", "2NT", "P", "6NT", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "3-7",
    lesson: 3,
    board: 7,
    title: "Affrancamenti di lunga e di posizione",
    contract: "3NT",
    declarer: "south",
    openingLead: c("heart", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["A", "K", "10", "9"], ["Q", "6"], ["8", "7", "4"], ["7", "6", "5", "3"]),
      east: hand(["6", "3", "2"], ["K", "4", "2"], ["K", "9", "5", "2"], ["K", "J", "10"]),
      south: hand(["Q", "J", "8"], ["A", "7", "3"], ["A", "Q", "J", "10"], ["Q", "8", "4"]),
      west: hand(["7", "5", "4"], ["J", "10", "9", "8", "5"], ["6", "3"], ["A", "9", "2"]),
    },
    commentary:
      "Attacco facile: J di cuori, la piu alta delle toccanti. Il gioco. Le vincenti sono 6: 4 a picche, 1 a cuori, 1 a quadri. Sud deve provare a mettere la Q del morto (o fa presa ora, se Ovest ha KJ10x, o mai piu) ma Est la copre con il Re. Pazienza, ora pero diventa indispensabile ottenere 4 prese dalle quadri; serve il Re in Est, e poiche Q,J,10 devono fare ognuno una presa l'impasse andra ripetuto piu volte. Quindi, servono tre ingressi. Ci sono, se usate con cura le picche: l'8 superato dal 9 e primo impasse a quadri. Poi J superato dal Re, altro impasse. Poi Dama superata dall'Asso, incasso della quarta picche (altrimenti non la fate piu), e ultimo impasse a quadri: 9 prese! 3NT, in seconda: 600 (100 le prese, + 500 di bonus)",
    bidding: { dealer: "south", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "3-8",
    lesson: 3,
    board: 8,
    title: "Affrancamenti di lunga e di posizione",
    contract: "3NT",
    declarer: "west",
    openingLead: c("heart", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "10", "4", "3"], ["Q", "J", "10", "7", "4"], ["J", "6"], ["10", "7"]),
      east: hand(["K", "Q", "2"], ["K", "6", "5", "3", "2"], ["A", "K"], ["A", "K", "J"]),
      south: hand(["J", "9"], ["9"], ["Q", "10", "9", "8", "4"], ["9", "8", "5", "4", "2"]),
      west: hand(["8", "7", "6", "5"], ["A", "8"], ["7", "5", "3", "2"], ["Q", "6", "3"]),
    },
    commentary:
      "Attacco Q di cuori, che promuove il J ed almeno il 9. Il gioco. Ovest conta 7 vincenti: 2 cuori, 2 quadri e purtroppo solo 3 fiori. Servono altre 2 prese. Inutile sperare in prese di lunga a cuori: l'attacco ci dice che il colore non e certo ben diviso! La speranza quindi e nelle picche, che daranno 2 prese se l'Asso e piazzato prima di KQ. Poiche dovremo muovere verso gli onori l'attacco si prende con l'Asso; picche verso un onore (se Nord prende subito vi fa un favore) e, vinta la presa, si rientra in mano (J di fiori superato dalla Dama) e si ripete l'expasse. 3NT, in prima: 400 (100 le prese, + 300 di bonus)",
    bidding: { dealer: "east", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 4: Il piano di gioco a senz'atout (The game plan in no trump)
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "4-1",
    lesson: 4,
    board: 1,
    title: "Il piano di gioco a senz'atout",
    contract: "3NT",
    declarer: "north",
    openingLead: c("spade", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "8", "6", "5"], ["J", "4", "3"], ["A", "7", "2"], ["A", "K", "Q"]),
      east: hand(["Q", "J", "10", "9", "4"], ["K", "9", "7"], ["Q", "9", "5"], ["9", "3"]),
      south: hand(["K"], ["Q", "6", "2"], ["K", "8", "6", "4", "3"], ["J", "8", "6", "4"]),
      west: hand(["7", "3", "2"], ["A", "10", "8", "5"], ["J", "10"], ["10", "7", "5", "2"]),
    },
    commentary:
      "Attacco Q di picche, la piu alta della sequenza. Il gioco. Con il Re di picche sparisce uno dei pochissimi ingressi al morto, resta solo il Re di quadri. E quadri... e il colore da affrancare: Nord conta su 2 picche, 4 fiori (bloccate) e 2 quadri... ma se sono 3-2 potra ricavare altre 2 prese dal colore. Nessuna illusione sulle cuori: si fara una presa, ma solo se saranno gli avversari a muoverlo per primi. Il collegamento 'interno' a quadri va assolutamente mantenuto, quindi Nord dovra cedere la prima (o la seconda) presa, a sua scelta. E sbloccare AKQ di fiori prima di trasferirsi al morto. 3NT+1, in prima: 430 (130 le prese, + 300 di bonus)",
    bidding: { dealer: "north", bids: ["1C", "P", "1D", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "4-2",
    lesson: 4,
    board: 2,
    title: "Il piano di gioco a senz'atout",
    contract: "1NT",
    declarer: "east",
    openingLead: c("heart", "Q"),
    vulnerability: "ns",
    hands: {
      north: hand(["Q", "J", "10", "4"], ["8", "3"], ["Q", "9", "3"], ["A", "K", "J", "10"]),
      east: hand(["A", "K", "3"], ["A", "5", "4"], ["A", "K", "2"], ["8", "7", "5", "4"]),
      south: hand(["9", "2"], ["Q", "J", "10", "9", "6", "2"], ["J", "8"], ["9", "6", "2"]),
      west: hand(["8", "7", "6", "5"], ["K", "7"], ["10", "7", "6", "5", "4"], ["Q", "3"]),
    },
    commentary:
      "Attacco: Q di cuori, che promuove il J ed almeno il 9. Il gioco. Est deve ragionare su quello che vorra fare, PRIMA di decidere se vincere la presa in mano o al morto. Ha 6 vincenti e i soli due colori presentano affrancabili: le quadri (se divise 3-2 si affrancano 2 prese dopo averne ceduta una) o le fiori (se divise 3-3, evento piu raro della 3-2, si affranchera una presa dopo averne ceduta una). Entrambe le risorse sono al morto, quindi... il Re di cuori va lasciato li! Vinto l'attacco in mano Est deve giocare AK di quadri e fiori. Nord si sfogera con le sue 4 prese a picche, ma quando Est vincera qualsiasi ritorno avra modo di tornare al morto con il K di cuori ed incassare altre 2 quadri. 1NT + 1: 120 (70 le prese, + 50 di bonus)",
    bidding: { dealer: "east", bids: ["1NT", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "4-3",
    lesson: 4,
    board: 3,
    title: "Il piano di gioco a senz'atout",
    contract: "3NT",
    declarer: "south",
    openingLead: c("heart", "10"),
    vulnerability: "ew",
    hands: {
      north: hand(["3", "2"], ["K", "8", "6"], ["Q", "J", "10", "7", "5", "4"], ["Q", "3"]),
      east: hand(["K", "J", "10", "8"], ["7", "4", "2"], ["9", "2"], ["A", "J", "10", "8"]),
      south: hand(["A", "7", "6", "5", "4"], ["A", "J"], ["A", "K"], ["7", "5", "4", "2"]),
      west: hand(["Q", "9"], ["Q", "10", "9", "5", "3"], ["8", "6", "3"], ["K", "9", "6"]),
    },
    commentary:
      "Attacco 10 di cuori, la piu alta delle toccanti da sequenza interrotta. Il gioco. Finalmente, 9 prese pronte! 1 picche, 2 cuori e 6 quadri. Ma una trappola mortale mette alla prova l'ingordigia di Sud: se non si accorge che le quadri sono bloccate, che il Re di cuori e l'unico ingresso al morto, e che un Asso non puo essere superato da un Re, vincera la prima presa con il Fante. Poi si mettera a pensare... ma sara tardi! Quindi: rinunciare al regalo e prendere l'Asso, incassare AK di quadri, trasferirsi al morto superando il Fante di cuori con il Re e proseguire con le 4 quadri affrancate. 3NT, in prima: 400 (100 le prese + 300 di bonus)",
    bidding: { dealer: "south", bids: ["1D", "P", "2D", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "4-4",
    lesson: 4,
    board: 4,
    title: "Il piano di gioco a senz'atout",
    contract: "3NT",
    declarer: "west",
    openingLead: c("spade", "4"),
    vulnerability: "both",
    hands: {
      north: hand(["Q", "9", "7", "6", "4"], ["10", "4", "3", "2"], ["K", "6"], ["Q", "6"]),
      east: hand(["8", "5", "2"], ["A", "K", "7"], ["J", "9", "3"], ["7", "5", "3", "2"]),
      south: hand(["J", "3"], ["Q", "J", "9"], ["8", "4", "2"], ["K", "J", "10", "9", "8"]),
      west: hand(["A", "K", "10"], ["8", "6", "5"], ["A", "Q", "10", "7", "5"], ["A", "4"]),
    },
    commentary:
      "Attacco 4 di picche. Sud inpegna il Fante. Il gioco. Vinto l'attacco, Ovest puo stare tranquillo: 2 picche, 2 cuori, 1 fiori e 4 o 5 quadri, a seconda che riesca o meno l'impasse al Re. Va al morto a cuori ed intavola il J di quadri (non il 3!), in modo da poter ripetere l'impasse qualora il K fosse in Sud. Cosi non e, ma ormai Ovest ha le sue 9 prese. Il controgioco. Nella prima presa Nord si deve accorgere che AK10 di picche sono tutti in mano al giocante (Sud ha giocato il J: non ha ne il 10 ne un onore alto). Quindi, quando sara in presa, dovra scegliere tra cuori e fiori (Ovest fara le sue 9 prese)... ma NON deve piu muoversi a picche, altrimenti Ovest fara una presa il piu: il 10 di picche. 3NT, in seconda: 600 (100 le prese, + 500 di bonus)",
    bidding: { dealer: "west", bids: ["1D", "P", "1H", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "4-5",
    lesson: 4,
    board: 5,
    title: "Il piano di gioco a senz'atout",
    contract: "3NT",
    declarer: "north",
    openingLead: c("club", "Q"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "K", "7", "4"], ["A", "K", "Q", "2"], ["A", "Q"], ["6", "5", "4"]),
      east: hand(["J", "9"], ["8", "6", "4", "3"], ["8", "2"], ["Q", "J", "10", "7", "3"]),
      south: hand(["6", "5", "3"], ["J", "5"], ["K", "7", "6", "5", "4"], ["A", "9", "2"]),
      west: hand(["Q", "10", "8", "2"], ["10", "9", "7"], ["J", "10", "9", "3"], ["K", "8"]),
    },
    commentary:
      "Attacco: Q di fiori, da sequenza. Il gioco. Relax per Nord: le fiori daranno 3 prese (forse di piu, se divise 3-3) solo se gli onori si potranno incassare separatamente. Vinto l'attacco al morto (su cui Ovest deve, assolutamente, buttar via il suo Re per non bloccare il colore di Est) Nord deve occuparsi immediatamente delle quadri: incassa AQ della mano, poi usa il prezioso Fante di cuori per tornare al morto ed incassa anche il K di quadri. Non sono divise, pazienza: 10 prese sono assicurate. 3NT + 1, in seconda: 630 (130 le prese, + 500 di bonus)",
    bidding: { dealer: "north", bids: ["2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "4-6",
    lesson: 4,
    board: 6,
    title: "Il piano di gioco a senz'atout",
    contract: "3NT",
    declarer: "east",
    openingLead: c("heart", "2"),
    vulnerability: "ew",
    hands: {
      north: hand(["10", "8", "5", "2"], ["A", "6", "4"], ["J", "9", "8", "6"], ["J", "10"]),
      east: hand(["A", "7", "3"], ["Q", "9", "7"], ["K", "10", "4", "3"], ["A", "8", "4"]),
      south: hand(["J", "9", "4"], ["K", "10", "8", "5", "2"], ["7"], ["Q", "9", "6", "2"]),
      west: hand(["K", "Q", "6"], ["J", "3"], ["A", "Q", "5", "2"], ["K", "7", "5", "3"]),
    },
    commentary:
      "Attacco 2 di cuori, una carta piccola che promette uno o piu onori (senza sequenza). Il gioco. La prima presa e fondamentale: con Jx per Qxx Est e CERTO di fare prima o poi una presa... a patto che non metta il Fante del morto (Nord prende e rigioca cuori, e Sud Deve giocare la piccola, visto che ha la Dama in mano! Nord se vuole prende e muove ancora cuori, ma ad Est ora spetta una presa. Dovra, pero, incassare velocemente tutte le altre: ha a disposizione 3 picche, 1 cuori, 2 quadri e verosimilmente 4 fiori, che vanno incassate inziando con Asso e Dama, salvando la forchetta di K10 nell'eventualita del Fante quarto in Nord. E proprio questo il caso, ma, poco male, si fa l'impasse! 3NT + 1, in seconda: 630 (130 le prese + 500 di bonus)",
    bidding: { dealer: "west", bids: ["1D", "P", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "4-7",
    lesson: 4,
    board: 7,
    title: "Il piano di gioco a senz'atout",
    contract: "3NT",
    declarer: "south",
    openingLead: c("spade", "2"),
    vulnerability: "both",
    hands: {
      north: hand(["J", "10"], ["K", "5"], ["A", "Q", "J", "9", "4", "3"], ["7", "5", "4"]),
      east: hand(["K", "6", "4"], ["J", "10", "9", "8"], ["K", "6"], ["Q", "9", "3", "2"]),
      south: hand(["Q", "9", "5"], ["A", "Q", "6", "3"], ["10", "2"], ["A", "K", "8", "6"]),
      west: hand(["A", "8", "7", "3", "2"], ["7", "4", "2"], ["8", "7", "5"], ["J", "10"]),
    },
    commentary:
      "Attacco: 2 di picche, cartina che promuove uno o piu onori e nega sequenze. Il controgioco. Questo contratto e destinato a cadere, se i difensori lavorano bene: quando Est vince la prima presa con il Re, Ovest si deve accorgere che NON ha la Dama. Est rigioca picche... e Ovest deve rinunciare a prendere (colpo in bianco), perche sa che non entrera piu in presa; deve sperare che entri Est, ma se Est non avra piu picche... non potra piu giocare il colore. Sud e in balia degli avversari; provera a fare l'impasse a quadri, e manterra il contratto solo se Ovest non ha resistito alla tentazione di vincere la seconda presa a picche. 3NT-1, in seconda: -100. Oppure 3NT+1, in seconda: 630 (130 le prese + 500 di bonus)",
    bidding: { dealer: "south", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "4-8",
    lesson: 4,
    board: 8,
    title: "Il piano di gioco a senz'atout",
    contract: "6NT",
    declarer: "west",
    openingLead: c("spade", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["Q", "J", "10", "7", "6", "5"], ["Q", "8", "7", "2"], ["8"], ["7", "6"]),
      east: hand(["A"], ["9", "6", "5", "4"], ["5", "4", "3", "2"], ["Q", "9", "3", "2"]),
      south: hand(["8", "4", "3", "2"], ["J", "10"], ["K", "9", "7", "6"], ["10", "5", "4"]),
      west: hand(["K", "9"], ["A", "K", "3"], ["A", "Q", "J", "10"], ["A", "K", "J", "8"]),
    },
    commentary:
      "Attacco Q di picche, che promuove il J ed almeno il 9. Il gioco. Ovest conta le prese: 2 picche, 2 cuori, 4 fiori, ... e per arrivare a 12 prese non ci sono santi, e necessario fare 4 prese a quadri. L'impasse va fatto, subito. Purtroppo non ci sono carte alte di quadri al morto su cui appoggiarsi, quindi per ripetere questo impasse il maggior numero possibile di volte servono altri due ingressi in Est. Ci sono, a fiori: vinta la presa con il 10 di quadri. Ovest incassa A e K di fiori... e constatata la 3-2 giochera il FANTE superato con la DAMA, per fare il secondo impasse a quadri. Ancora al morto con l'OTTO di fiori superato dal NOVE... e terzo e ultimo impasse a quadri: 12 prese. 6NT, in prima: 990 (190 le prese + 300 di bonus manche + 500 di bonus Slam)",
    bidding: { dealer: "west", bids: ["2C", "P", "2D", "P", "2NT", "P", "6NT", "P", "P", "P"] },
  },
];

// Development-time validation: ensure every hand has exactly 13 unique cards
if (process.env.NODE_ENV === "development") {
  smazzate.forEach((s) => {
    const positions: (keyof typeof s.hands)[] = ["north", "south", "east", "west"];
    const allCards: string[] = [];

    positions.forEach((pos) => {
      const cardCount = s.hands[pos].length;
      if (cardCount !== 13) {
        console.warn(
          `[smazzate] WARNING: ${s.id} ${pos} has ${cardCount} cards (expected 13)`
        );
      }
      s.hands[pos].forEach((card) => {
        allCards.push(`${card.suit}-${card.rank}`);
      });
    });

    if (allCards.length !== 52) {
      console.warn(
        `[smazzate] WARNING: ${s.id} has ${allCards.length} total cards (expected 52)`
      );
    }

    // Check for duplicates
    const unique = new Set(allCards);
    if (unique.size !== 52) {
      console.warn(
        `[smazzate] WARNING: ${s.id} has ${unique.size} unique cards (expected 52, ${52 - unique.size} duplicates)`
      );
    }
  });
}

export default smazzate;
