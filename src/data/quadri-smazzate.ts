/**
 * FIGB Corso Quadri - Smazzate Didattiche (Practice Hands)
 * Extracted from official FIGB teaching materials
 *
 * Lesson 1: Tempi e comunicazioni a Senza
 * Lesson 2: Valutazioni sull'apertura
 * Lesson 3: Contratti ad atout: tempo e controllo
 * Lesson 4: Il capitanato e la replica dell'apertore
 * Lesson 5: I colori bucati
 * Lesson 6: Le aperture di 2, 3, 4
 * Lesson 7: Attacchi e segnali di controgioco
 * Lesson 8: Accostamento a manche
 * Lesson 9: Ricevere l'attacco
 * Lesson 10: Contro e surlicita
 * Lesson 11: Controgioco: ragionare e dedurre
 * Lesson 12: Interventi e riaperture
 */

import type { Suit, Rank, Card, Position } from "../lib/bridge-engine";
import type { Vulnerability, BiddingData } from "./smazzate";

// Re-export the Smazzata type
export type { Smazzata } from "./smazzate";
import type { Smazzata } from "./smazzate";

function c(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

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

export const quadriSmazzate: Smazzata[] = [
  // ==========================================================================
  // LESSON 1: Tempi e comunicazioni a Senza
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "Q1-1",
    lesson: 1,
    board: 1,
    title: "Tempi e comunicazioni a Senza",
    contract: "3NT",
    declarer: "east",
    openingLead: c("spade", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["6", "2"], ["10", "9", "8", "7"], ["Q", "6"], ["8", "7", "5", "4", "2"]),
      east: hand(["A", "9", "8"], ["A", "J"], ["9", "7", "2"], ["A", "K", "Q", "J", "10"]),
      west: hand(["K", "3"], ["Q", "5", "4", "2"], ["K", "J", "10", "5", "3"], ["6", "3"]),
      south: hand(["Q", "J", "10", "7", "5", "4"], ["K", "6", "3"], ["A", "8", "4"], ["9"]),
    },
    commentary:
      "Il contro di Ovest cerca fit negli altri colori: quando Est salta a 2NT mostra una bilanciata (con fermo) di 18-20 quindi Ovest dice 3NT a cuor sereno. Le prese di Est: 5♣, 2♠, 1♥. Ne serve una, e ha un solo tempo per trovarla perché nel colore avversario ferma solo più una volta. Le quadri attirano, ma se la Q è mal messa si rischia di andare sotto. Una giocata molto più sicura è rinunciare all'impasse a cuori e giocare A♥ e poi J♥: la Q del morto rappresenta la nona presa. Attenzione, se questo è il Piano di gioco bisogna prendere con l'asso di picche di mano; il K servirà per trasferirsi al morto a incassare la Q♥. NON SEMPRE I TEMPI CONSENTONO DI SFRUTTARE I COLORI PIÙ LUNGHI: A VOLTE BISOGNA ACCONTENTARSI",
    bidding: { dealer: "north", bids: ["P", "1♣", "1♠", "X", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "Q1-2",
    lesson: 1,
    board: 2,
    title: "Tempi e comunicazioni a Senza",
    contract: "3NT",
    declarer: "west",
    openingLead: c("heart", "2"),
    vulnerability: "ns",
    hands: {
      north: hand(["J", "8", "5"], ["A", "9", "4", "3", "2"], ["5", "4", "3", "2"], ["9"]),
      east: hand(["6", "3"], ["J", "7"], ["K", "Q", "J", "10", "8"], ["K", "J", "3", "2"]),
      west: hand(["A", "K", "Q", "4"], ["Q", "10", "8"], ["9", "7"], ["A", "Q", "7", "5"]),
      south: hand(["10", "9", "7", "2"], ["K", "6", "5"], ["A", "6"], ["10", "8", "6", "4"]),
    },
    commentary:
      "La dichiarazione è di ordinaria amministrazione, in qualunque latitudine. Il Gioco. Sud prende e torna, e Nord può decidere se prendere o lisciare (a E/O spetta una presa comunque: sa che la Q è in Ovest). Ma Nord non ha ingressi: se ora prende e rigioca cuori le avrà affrancate ma avrà tolto di mano al suo partner tutte le cuori, quindi non le incasserà MAI. Per battere il contratto Nord deve lasciar fare la 2^presa al morto: quando Sud entrerà con l'A♦ rigiocherà l'ultima cuori e Nord ne incasserà 3 di fila. Ovest non ha colpe, questo ottimo 3NT non si può fare a meno di un errore della difesa. IL COLPO IN BIANCO È UNA MANOVRA DI GIOCO ADOTTATA DA ENTRAMBE LE LINEE",
    bidding: { dealer: "east", bids: ["P", "P", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "Q1-3",
    lesson: 1,
    board: 3,
    title: "Tempi e comunicazioni a Senza",
    contract: "3NT",
    declarer: "south",
    openingLead: c("spade", "J"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "K", "Q", "2"], ["2"], ["Q", "J", "10", "9", "7", "4"], ["Q", "6"]),
      east: hand(["6", "5", "4"], ["K", "J"], ["6", "5", "3"], ["A", "8", "5", "4", "3"]),
      west: hand(["J", "10", "9", "8", "3"], ["Q", "8", "7", "5"], ["8", "2"], ["K", "7"]),
      south: hand(["7"], ["A", "10", "9", "6", "4", "3"], ["A", "K"], ["J", "10", "9", "2"]),
    },
    commentary:
      "Nord non ha fit a cuori e per giocare 3NT la sua Q♣ è insufficiente; quando mostra le picche per Sud diventa facile proporre i Senza: J109x sono un fermo inossidabile. Il Gioco. Ci sono 10 vincenti...ma l'attacco toglie prematuramente l'ingresso accanto alla lunga di quadri, e il colore è ancora bloccato. Che fare? Semplice: basta incassare anche gli altri due onori di picche, scartando A♦ e K♦, e proseguire con le sei quadri vincenti di Nord! NON AFFEZIONATEVI ALLE CARTE ALTE, AFFEZIONATEVI A QUELLE CHE SERVONO!",
    bidding: { dealer: "south", bids: ["1♥", "P", "2♦", "P", "2♥", "P", "2♠", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "Q1-4",
    lesson: 1,
    board: 4,
    title: "Tempi e comunicazioni a Senza",
    contract: "3NT",
    declarer: "north",
    openingLead: c("spade", "4"),
    vulnerability: "both",
    hands: {
      north: hand(["K", "7"], ["8", "5", "2"], ["A", "Q", "4", "3"], ["A", "K", "J", "4"]),
      east: hand(["Q", "10", "8", "6", "4"], ["Q", "7", "4"], ["K", "10"], ["9", "3", "2"]),
      west: hand(["J", "9", "3", "2"], ["K", "6", "3"], ["J", "9", "8", "5"], ["8", "5"]),
      south: hand(["A", "5"], ["A", "J", "10", "9"], ["7", "6", "2"], ["Q", "10", "7", "6"]),
    },
    commentary:
      "Potendo contare su 2♠, 1♥, 4♣ e 1♦ Nord deve solo trovare una presa. I colori da considerare sono quadri e cuori. Nord deve scegliere, perché è rimasto con un solo fermo a picche e i difensori ci rigiocheranno ogni volta che prendono. Il piano di gioco che punta sull'impasse a quadri vale esattamente il 50%: se va bene si faranno 3NT, se va male non ci sarà tempo per cercare la nona altrove. Il piano di gioco che punta sull'affrancamento di almeno una cuori vale il 75%: occorre ripetere due volte l'impasse sperando che almeno un onore sia in Est. Si perde solo (1 volta su 4) quando K♥ e Q♥ sono entrambi in Ovest. LE PERCENTUALI NON SONO GARANZIA DI SUCCESSO, MA QUANDO AVRETE SCELTO LA LINEA DI GIOCO MIGLIORE POTRETE, SE NON ALTRO, ZITTIRE IL COMPAGNO E GLI ANGOLISTI",
    bidding: { dealer: "west", bids: ["P", "1NT", "P", "2♦", "P", "2♠", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "Q1-5",
    lesson: 1,
    board: 5,
    title: "Tempi e comunicazioni a Senza",
    contract: "3NT",
    declarer: "west",
    openingLead: c("spade", "2"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "10", "6", "4", "2"], ["J", "9", "8", "2"], ["9", "6", "5"], ["5"]),
      east: hand(["8"], ["A", "Q", "6"], ["A", "Q", "J", "4", "3", "2"], ["J", "9", "3"]),
      west: hand(["K", "Q", "5"], ["K", "7", "3"], ["10", "8"], ["A", "Q", "10", "8", "6"]),
      south: hand(["J", "9", "7", "3"], ["10", "5", "4"], ["K", "7"], ["K", "7", "4", "2"]),
    },
    commentary:
      "Ovest vince la presa sul J di Sud, e deduce che l'asso e il 10 sono in Nord: se Sud dovesse entrare in presa giocherà picche e la difesa incasserà almeno 4 prese. Sud è l'avversario pericoloso. Quale impasse fare, tra quadri e fiori? Bisogna tentare l'impasse a fiori, perché se anche andasse male (prende Nord) il K♠ resterebbe protetto, e 4 prese a fiori bastano comunque per arrivare a 9 (1♠, 3♥, 1♦ e 4♣). Quindi: cuori al morto e fiori impasse, usando il J per poterlo ripetere qualora andasse bene, e riprovandoci con il 9. QUANDO AVETE MOLTE EQUIVALENTI USATELE PER FAR LEVA SULL'ONORE CHE VOLETE CATTURARE: NON SARETE COSTRETTI A USARE INGRESSI LATERALI.",
    bidding: { dealer: "north", bids: ["P", "1♦", "P", "2♣", "P", "2♦", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "Q1-6",
    lesson: 1,
    board: 6,
    title: "Tempi e comunicazioni a Senza",
    contract: "3NT",
    declarer: "north",
    openingLead: c("spade", "J"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "Q", "2"], ["5", "3"], ["A", "6", "5", "3"], ["A", "K", "7", "4"]),
      east: hand(["J", "10", "9", "8", "5"], ["8", "4"], ["K", "7", "4"], ["10", "8", "3"]),
      west: hand(["K", "7"], ["J", "10", "9", "6"], ["Q", "J", "10"], ["Q", "J", "9", "5"]),
      south: hand(["6", "4", "3"], ["A", "K", "Q", "7", "2"], ["9", "8", "2"], ["6", "2"]),
    },
    commentary:
      "Sud prende informazioni per sapere quale sia la miglior manche: dopo aver fatto Stayman presenta le sue cuori, ma Nord (che non deve decidere il contratto, ma solo dire se ha fit o no) mostra di averne solo 2, e la conclusione è 3NT. Il giocante dopo l'attacco ha 8 vincenti; per mettere insieme 9 prese ha bisogno di fare almeno 4 prese a cuori. Se Nord ingordamente incassa AKQ, farà 5 prese se le trova 3/3 (la probabilità è solo del 36%!), ma se sono 4/2 andrà sotto, perché la quarta cuori si affrancherà ma non ci sono ingressi per incassarla. La soluzione è semplice: colpo in bianco a cuori al primo giro. Con questa manovra farà 4 prese anche se il colore è 4-2. UN COLPO IN BIANCO PUÒ ESSERE NECESSARIO ANCHE QUANDO NEL COLORE ABBIAMO AKQ",
    bidding: { dealer: "east", bids: ["P", "P", "P", "1NT", "P", "2♣", "P", "2♦", "P", "2♥", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "Q1-7",
    lesson: 1,
    board: 7,
    title: "Tempi e comunicazioni a Senza",
    contract: "3NT",
    declarer: "south",
    openingLead: c("spade", "3"),
    vulnerability: "both",
    hands: {
      north: hand(["10", "8"], ["K", "8", "2"], ["Q", "J", "10", "7", "6"], ["A", "9", "6"]),
      east: hand(["K", "J", "4"], ["10", "9", "6", "5"], ["A", "5"], ["J", "10", "5", "3"]),
      west: hand(["Q", "9", "7", "3", "2"], ["J", "4", "3"], ["9", "8", "4"], ["8", "7"]),
      south: hand(["A", "6", "5"], ["A", "Q", "7"], ["K", "3", "2"], ["K", "Q", "4", "2"]),
    },
    commentary:
      "Est deve giocare la più alta (K e J non sono affatto equivalenti) e, se rimane in presa, proseguire con il J. Sud conta 7 prese, anche se le fiori fossero divise non arriverà mai a 9 senza affrontare le quadri. Con le picche 4-4 non ci sarebbero problemi, ma se sono 5-3 e chi ha 5 carte ha anche l'A♦ non ci sarà nulla da fare. Una precauzione però è doverosa e non costa nulla: Sud aspetta a prendere al terzo giro. In questo modo si garantisce il successo se l'A♦ è in mano all'avversario che ha solo 3 carte di picche; avendole terminate – grazie alla doppia lisciata – Est andrà in presa ma il contratto non potrà essere battuto. ASPETTARE A PRENDERE SERVE A TAGLIARE I COLLEGAMENTI DEL COLORE AVVERSARIO. IN QUESTA OTTICA, A SENZA, UN FERMO DI AXX È MEGLIO DI AX (O SECCO)",
    bidding: { dealer: "south", bids: ["1♣", "P", "1♦", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "Q1-8",
    lesson: 1,
    board: 8,
    title: "Tempi e comunicazioni a Senza",
    contract: "3NT",
    declarer: "east",
    openingLead: c("diamond", "J"),
    vulnerability: "none",
    hands: {
      north: hand(["J", "10", "9", "8"], ["A", "8", "7", "6"], ["8"], ["A", "8", "6", "4"]),
      east: hand(["A", "K", "5", "4"], ["K", "Q", "10", "5"], ["A", "K", "Q"], ["Q", "10"]),
      west: hand(["7", "6"], ["J", "9"], ["7", "6", "5", "2"], ["K", "J", "7", "5", "2"]),
      south: hand(["Q", "3", "2"], ["4", "3", "2"], ["J", "10", "9", "4", "3"], ["9", "3"]),
    },
    commentary:
      "Il salto nel colore di apertura mostra una monocolore di 6+ carte, e 15-17/18 punti. Est ha tutte le carte in regola per dichiarare 3NT. Il Gioco. L'attacco, e la carta (10) giocata da Nord, evidenziano la presenza di AQ♦ in Sud: Nord, avendo una delle due, l'avrebbe giocata. Est vince con il J e rimane con un \"fermo di posizione\", in quanto il suo K♦ non avrà nulla da temere se entrerà in presa Sud, ma verrà massacrato se sarà Nord a vincere una presa. Morale: Nord NON deve prendere. Est non può fare a meno dell'impasse a quadri, ma quando vede il Re (perché mai Sud dovrebbe giocarlo, se non perché obbligato?) deve accorgersi del pericolo di 10xxx in Nord. Morale: lisciando il K♦ Est si mette in una botte di ferro! QUANDO VI SEMBRA CHE TUTTO VADA A GONFIE VELE, È IL MOMENTO DI METTERSI A RIFLETTERE. E CONTARE.",
    bidding: { dealer: "west", bids: ["P", "P", "2♣", "P", "2♦", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 2: Valutazioni sull'apertura
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "Q2-1",
    lesson: 2,
    board: 1,
    title: "Valutazioni sull'apertura",
    contract: "3♠",
    declarer: "north",
    openingLead: c("diamond", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "K", "Q", "J", "8", "5"], ["4", "2"], ["8", "3"], ["A", "K", "J"]),
      east: hand(["9", "2"], ["K", "10", "7", "5"], ["Q", "J", "9", "2"], ["6", "5", "2"]),
      west: hand(["7", "6", "4", "3"], ["A", "J", "9"], ["A", "K", "6"], ["Q", "7", "4"]),
      south: hand(["10"], ["Q", "8", "6", "3"], ["10", "7", "5", "4"], ["10", "9", "8", "3"]),
    },
    commentary:
      "La mano di Nord presenta otto vincenti e mezzo (Il J♣ è vincente al 50%), quindi l'apertura di 2♠ è legittima. Sud, che non può passare, dichiara 2NT per dar modo al compagno di avere una seconda opportunità. Nord riposa nel livello di Guardia del 3♠: \"se non mi porti almeno una presa, 4♠ non si fanno\" e Sud ragionevolmente dice Passo. Il Gioco. La difesa incassa due quadri (quando la Q♦ resta in presa bisogna proseguire con la piccola!!) e Nord taglia al terzo giro; il 10 di picche è l'unico ingresso che gli consente di tentare l'impasse a fiori. Manovra che ha successo, dopodiché Nord non ha difficoltà a mantenere il contratto. NELLE MANI SBILANCIATE IL METRO DI VALUTAZIONE SONO LE PRESE, NON SOLO I PUNTI",
    bidding: { dealer: "north", bids: ["2♠", "P", "2NT", "P", "3♠", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "Q2-2",
    lesson: 2,
    board: 2,
    title: "Valutazioni sull'apertura",
    contract: "3NT",
    declarer: "east",
    openingLead: c("spade", "2"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "J", "3"], ["10", "9", "8"], ["10", "9", "3"], ["A", "6", "4", "3"]),
      east: hand(["K", "10", "5"], ["K", "5", "4"], ["8", "7", "5", "2"], ["K", "Q", "5"]),
      west: hand(["8", "4"], ["A", "6", "3", "2"], ["A", "K", "Q", "4"], ["J", "8", "7"]),
      south: hand(["Q", "9", "7", "6", "2"], ["Q", "J", "7"], ["J", "6"], ["10", "9", "2"]),
    },
    commentary:
      "Gli 11 punti di Est, con distribuzione piatta e senza nemmeno un asso, non presentano alcun motivo per essere rivalutati. Ma sull'apertura di Ovest, Est ha un'ottima dichiarazione: il suo 2NT mostra proprio 11 e carte molto più adatte al gioco a Senz'atout che a un parziale a quadri! Il Gioco. Nord vince la prima presa e rigioca nel colore (il fante, per favore!). Est può decidere se prendere o lisciare: al momento ha 7 prese e dovrà per forza affrancare 2 fiori. Se le picche sono 4-4 non avrà problemi: perderà 3♠ e ♣. Se Sud ha 5♠, e ha l'A♣, il contratto cadrà. Ma se l'A♣ è in mano a Nord no, purché Est aspetti a prendere al terzo giro, ossia quando Nord avrà terminato le picche! E' PIÙ FACILE MOSTRARE \"IL MASSIMO DEL PASSO\" CHE \"IL MINIMO DELL'APERTURA\"",
    bidding: { dealer: "east", bids: ["P", "P", "1♦", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "Q2-3",
    lesson: 2,
    board: 3,
    title: "Valutazioni sull'apertura",
    contract: "4♥",
    declarer: "south",
    openingLead: c("diamond", "K"),
    vulnerability: "ew",
    hands: {
      north: hand(["K", "Q"], ["K", "9", "8", "4"], ["9", "7", "4", "2"], ["K", "9", "3"]),
      east: hand(["8", "6", "5", "4", "2"], ["J", "6", "2"], ["A", "J", "6", "5"], ["8"]),
      west: hand(["7"], ["5", "3"], ["K", "Q", "10"], ["A", "Q", "J", "7", "6", "5", "2"]),
      south: hand(["A", "J", "10", "9", "3"], ["A", "Q", "10", "7"], ["8", "3"], ["10", "4"]),
    },
    commentary:
      "Nord non ha motivo per aprire, con quei brutti 11, ma Sud si: ha entrambi i maggiori, punteggio di testa, e inoltre è terzo di mano. Il Contro fa scoprire a Nord il fit a cuori, e ora le sue carte valgono una scelta coraggiosa perché tutti i suoi onori (KQ di ♠, e anche il K♣, certamente ben messo) meritano di essere rivalutati. Il Gioco. Sud non farà fatica a fare 10 prese, a meno che Est organizzi un diabolico controgioco: K♦ superato dall'A♦ per giocare fiori. Se Ovest collabora (A♣ e fiori taglio) un'ulteriore presa a quadri batterà il contratto. UNA MANO MIGLIORA QUANDO TROVA FIT, E PEGGIORA QUANDO NON LO TROVA",
    bidding: { dealer: "south", bids: ["1♠", "2♣", "Dbl", "P", "2♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "Q2-4",
    lesson: 2,
    board: 4,
    title: "Valutazioni sull'apertura",
    contract: "4♥",
    declarer: "west",
    openingLead: c("diamond", "Q"),
    vulnerability: "both",
    hands: {
      north: hand(["10", "8", "7"], ["10", "5"], ["Q", "J", "10", "6"], ["A", "8", "4", "2"]),
      east: hand(["K", "Q", "J", "3"], ["7", "4"], ["A", "K", "4"], ["J", "9", "6", "3"]),
      west: hand(["6", "4"], ["K", "Q", "J", "8", "6", "3", "2"], ["5", "3", "2"], ["K"]),
      south: hand(["A", "9", "5", "2"], ["A", "9"], ["9", "8", "7"], ["Q", "10", "7", "5"]),
    },
    commentary:
      "Con una settima di KQJ Ovest stima di fare 6 prese, quindi l'apertura di 3♥ è perfetta: \"se gioco a cuori, faccio 3 prese in meno di quelle che sto dichiarando\". Ma Est, con AK♦ + KQJ♠, può ragionevolmente pensare di portarne 4, quindi il rialzo a manche è ragionevole. Il Gioco. Dovendo perdere 1♠ 1♥ e 1♣, Ovest si deve preoccupare di non perdere anche la presa di quadri: se muove subito atout darà il tempo alla difesa di smontargli anche l'altro fermo nel colore, e andrà sotto. Deve lasciar stare le atout e affrancare immediatamente le picche: la difesa proseguirà a quadri ma Ovest avrà modo di incassare altre due picche e scartare una quadri, prima di battere atout. UNA MANOVRA DI AFFRANCAMENTO È INUTILE SE FATTA NEL MOMENTO SBAGLIATO",
    bidding: { dealer: "west", bids: ["3♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "Q2-5",
    lesson: 2,
    board: 5,
    title: "Valutazioni sull'apertura",
    contract: "3NT",
    declarer: "south",
    openingLead: c("spade", "2"),
    vulnerability: "ns",
    hands: {
      north: hand(["J", "7"], ["A", "K", "10"], ["Q", "6", "5"], ["10", "8", "6", "5", "3"]),
      east: hand(["A", "Q", "10", "9", "3"], ["8", "3"], ["K", "J", "9"], ["K", "4", "2"]),
      west: hand(["8", "5", "2"], ["9", "7", "6", "4", "2"], ["10", "8", "2"], ["9", "7"]),
      south: hand(["K", "6", "4"], ["Q", "J", "5"], ["A", "7", "4", "3"], ["A", "Q", "J"]),
    },
    commentary:
      "Niente di speciale per la dichiarazione, ma Sud deve ricordarsi che Est ha aperto! Ovest ha mano nulla quindi deve attaccare per il compagno, con piccola ♠. Est vince con l'A♠ e segue con la Q, schiacciando il J di Nord e affrancando il colore. Sud non ha niente da temere, perché alla vista del morto calcola che mancano esattamente 13 punti, ossia l'apertura di Est; il K♣, unica carta che gli preme catturare, è in Est al 100%. Dovrà muovere con cura le ♣: piccola al 10 (o J per il K) e impasse a ♣. Ancora cuori al morto e secondo impasse. Ora A♣, e ancora cuori al morto per incassare altre due fiori: 10 prese. LA DICHIARAZIONE, PER CHI SE LA RICORDA, CONTIENE MOLTI INDIZI UTILI NEL GIOCO.",
    bidding: { dealer: "north", bids: ["P", "1♠", "P", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "Q2-6",
    lesson: 2,
    board: 6,
    title: "Valutazioni sull'apertura",
    contract: "4♠",
    declarer: "north",
    openingLead: c("heart", "A"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "Q", "10", "9", "3", "2"], ["4"], ["6", "5"], ["K", "Q", "8", "3"]),
      east: hand(["J", "6"], ["A", "K", "10", "8"], ["K", "J", "9", "8", "4"], ["J", "9"]),
      west: hand(["8"], ["Q", "J", "5", "2"], ["10", "3", "2"], ["A", "10", "7", "4", "2"]),
      south: hand(["K", "7", "5", "4"], ["9", "7", "6", "3"], ["A", "Q", "7"], ["6", "5"]),
    },
    commentary:
      "Le carte di Sud, nello svolgimento della licita, sono migliorate molto: AQ di quadri (dopo l'apertura di 1♦) danno quasi certezza di 2 prese, il fit a ♠ è ottimo e dopo l'appoggio a ♥ dato da Est si può dedurre che Nord sia in grado di tagliare al 1° o al 2° giro il loro colore. Tanti motivi per dare un appoggio a salto, su cui Nord, con una bella 6-4, dovrebbe prender coraggio e rialzare. Il Gioco. Nessuna difficoltà a collezionare 11 prese; l'unica difficoltà di questa manche, con 20 punti in linea, era dichiararla! QUANDO L'AVVERSARIO SI APPOGGIA ATTRIBUITEGLI ALMENO 8 CARTE: È FREQUENTE CHE POSSIATE DEDURRE MOLTO SULLA LUNGHEZZA DEL COMPAGNO.",
    bidding: { dealer: "east", bids: ["1♦", "P", "1♥", "1♠", "2♥", "3♠", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "Q2-7",
    lesson: 2,
    board: 7,
    title: "Valutazioni sull'apertura",
    contract: "4♠",
    declarer: "west",
    openingLead: c("club", "10"),
    vulnerability: "both",
    hands: {
      north: hand(["Q", "J", "5"], [], ["8", "7", "6", "4", "2"], ["10", "9", "8", "4", "3"]),
      east: hand(["K", "10", "7", "4"], ["9", "4"], ["K", "Q", "10", "9"], ["A", "K", "5"]),
      west: hand(["A", "9", "8", "6", "2"], ["10", "8", "5", "3"], ["A"], ["Q", "J", "7"]),
      south: hand(["3"], ["A", "K", "Q", "J", "7", "6", "2"], ["J", "5", "3"], ["6", "2"]),
    },
    commentary:
      "Quando ha aperto di 4♥ Sud ha detto tutto: \"se gioco a cuori, faccio 3 prese in meno di quelle che ho dichiarato\". Poi, anche se l'avversario trova manche, Sud si deve assentare e rispettare il Passo di Nord. Il Gioco. Il mancato attacco a cuori evidenzia che Nord è vuoto, ma Ovest non ha problemi: incassa le teste di atout (lasciando a Nord la vincente) e poi le quadri, su cui – grazie alla fortunosa caduta del J – scarta 3 cuori della mano, terminando con 11 prese. CHI FA UN BARRAGE, POI VA AL BAR A PRENDERE IL CAFFÈ: L'UNICO CHE PUÒ PRENDERE DECISIONI (PASSARE, CONTRARE, DIFENDERE) È IL COMPAGNO.",
    bidding: { dealer: "south", bids: ["4♥", "P", "P", "X", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "Q2-8",
    lesson: 2,
    board: 8,
    title: "Valutazioni sull'apertura",
    contract: "3NT",
    declarer: "east",
    openingLead: c("heart", "4"),
    vulnerability: "none",
    hands: {
      north: hand(["K", "Q", "7"], ["10", "8", "3", "2"], ["10", "6", "4", "3"], ["J", "9"]),
      east: hand(["J", "10", "8", "4"], ["K", "J", "6"], ["5", "2"], ["A", "8", "7", "4"]),
      west: hand(["A", "5", "3"], ["5"], ["A", "Q", "J", "9", "8", "7"], ["K", "Q", "2"]),
      south: hand(["9", "6", "2"], ["A", "Q", "9", "7", "4"], ["K"], ["10", "6", "5", "3"]),
    },
    commentary:
      "Il salto nel colore di apertura mostra una monocolore di 6+ carte, e 15-17/18 punti. Est ha tutte le carte in regola per dichiarare 3NT. Il Gioco. L'attacco, e la carta (10) giocata da Nord, evidenziano la presenza di AQ♥ in Sud: Nord, avendo una delle due, l'avrebbe giocata. Est vince con il J e rimane con un \"fermo di posizione\", in quanto il suo K♥ non avrà nulla da temere se entrerà in presa Sud, ma verrà massacrato se sarà Nord a vincere una presa. Morale: Nord NON deve prendere. Est non può fare a meno dell'impasse a quadri, ma quando vede il Re (perché mai Sud dovrebbe giocarlo, se non perché obbligato?) deve accorgersi del pericolo di 10xxx in Nord. Morale: lisciando il K♦ Est si mette in una botte di ferro! QUANDO VI SEMBRA CHE TUTTO VADA A GONFIE VELE, È IL MOMENTO DI METTERSI A RIFLETTERE. E CONTARE.",
    bidding: { dealer: "west", bids: ["1♦", "P", "1♠", "P", "3♦", "P", "3NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 3: Contratti ad atout: tempo e controllo
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "Q3-1",
    lesson: 3,
    board: 1,
    title: "Contratti ad atout: tempo e controllo",
    contract: "4♠",
    declarer: "south",
    openingLead: c("diamond", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["K", "J", "7", "6", "2"], ["K", "J"], ["7", "4", "3"], ["Q", "9", "2"]),
      east: hand(["A", "4"], ["9", "8", "4", "3"], ["9", "8", "2"], ["A", "8", "7", "3"]),
      west: hand(["9", "3"], ["A", "7", "6", "2"], ["Q", "J", "10", "5"], ["10", "6", "4"]),
      south: hand(["Q", "10", "8", "5"], ["Q", "10", "5"], ["A", "K", "6"], ["K", "J", "5"]),
    },
    commentary:
      "La difesa ha tre assi da incassare e la possibilità di affrancare la presa del down continuando a giocare ♦. Sud avrebbe a disposizione 10 prese: 4♠, 2♦, 2♣ e 2♥, deve solo evitare che la difesa riesca a incassare la ♦. Può scartare una quadri del morto su una cuori affrancata della mano, ma deve sbrigarsi e affrontare le cuori immediatamente; se perde questo tempo di vantaggio e batte atout, i difensori- purché ripetano quadri ogni volta che prendono- batteranno il contratto; Est deve collaborare, tornando nel colore d'attacco se il giocante gli cede la presa a fiori o a picche. APPROFITTA DEL TEMPO DI VANTAGGIO, SE PUOI DISFARTI DI UNA CARTA PERDENTE",
    bidding: { dealer: "north", bids: ["P", "P", "1NT", "P", "2♣", "P", "2♠", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "Q3-2",
    lesson: 3,
    board: 2,
    title: "Contratti ad atout: tempo e controllo",
    contract: "4♥",
    declarer: "east",
    openingLead: c("diamond", "K"),
    vulnerability: "ns",
    hands: {
      north: hand(["10", "8", "6", "5"], ["K", "5"], ["10", "8", "5"], ["A", "9", "7", "5"]),
      east: hand(["A", "K", "7"], ["Q", "J", "10", "8"], ["A", "4", "3"], ["Q", "10", "8"]),
      west: hand(["Q", "9"], ["A", "9", "7", "6", "4"], ["9", "7", "6"], ["K", "J", "4"]),
      south: hand(["J", "4", "3", "2"], ["3", "2"], ["K", "Q", "J", "2"], ["6", "3", "2"]),
    },
    commentary:
      "Est conta 3♠, almeno 4♥, 1♦ e 2 affrancabili a ♣. Ma dopo l'attacco, la difesa ha affrancato due ♦ e, se entrassero in presa ora, il contratto cadrebbe. Est deve urgentemente liberarsi almeno di una delle quadri del morto, scartandola su una delle vincenti a picche della mano. Incassa subito la Q di ♠, poi A♠ e K♠ scartando quadri: questa manovra consentirà al morto di controllare con un taglio il terzo giro di quadri. Dopo, Est può battere atout, mentre se giocasse atout immediatamente (e l'impasse andasse male) agli avversari sarebbero in grado di incassare due giri di quadri battendo il contratto. LE ATOUT POSSONO ATTENDERE, SE C'È QUALCOSA DI PIÙ URGENTE DA FARE!",
    bidding: { dealer: "east", bids: ["1NT", "P", "2♣", "P", "2♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "Q3-3",
    lesson: 3,
    board: 3,
    title: "Contratti ad atout: tempo e controllo",
    contract: "4♥",
    declarer: "north",
    openingLead: c("club", "Q"),
    vulnerability: "ew",
    hands: {
      north: hand(["K"], ["K", "Q", "10", "9", "6", "4"], ["K", "J", "6"], ["A", "7", "4"]),
      east: hand(["A", "10", "8", "2"], ["3", "2"], ["7", "5", "2"], ["Q", "J", "10", "8"]),
      west: hand(["9", "6", "5"], ["A", "8", "5"], ["A", "8", "4", "3"], ["9", "6", "3"]),
      south: hand(["Q", "J", "7", "4", "3"], ["J", "7"], ["Q", "10", "9"], ["K", "5", "2"]),
    },
    commentary:
      "Dopo la risposta 1♠ Nord valuta di avere 16 a pieno valore, quindi la ripetizione delle ♥ a salto è corretta. Sud conta i suoi 9, + 15/17 del compagno, e rialza. Il Gioco. Nord dovrà perdere i 3 assi, e anche una fiori se non trova come provvedere. Per sua fortuna ha ancora un onore che controlla il colore, ma non deve perdere tempo: giocando subito il K♠ affrancherà la Q del morto, su cui potrà scartare. Attenzione, però: in quel momento avrà bisogno di poter andare rapidamente al morto (se cede la presa a loro è inutile il lavoro fatto), quindi occorre mantenere per dopo l'ingresso di K♣, e prendere l'attacco iniziale con l'asso di mano. Consegna per i difensori: rigiocare ♣ ad ogni occasione! PRIMA DI DECIDERE DA CHE PARTE PRENDERE, ABBI CHIARE LE MOSSE CHE FARAI IN SEGUITO",
    bidding: { dealer: "south", bids: ["P", "P", "1♥", "P", "1♠", "P", "3♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "Q3-4",
    lesson: 3,
    board: 4,
    title: "Contratti ad atout: tempo e controllo",
    contract: "4♥",
    declarer: "west",
    openingLead: c("club", "K"),
    vulnerability: "both",
    hands: {
      north: hand(["Q", "7", "4"], ["10", "4"], ["10", "6", "4", "3"], ["K", "Q", "J", "9"]),
      east: hand(["10", "8"], ["8", "5", "3"], ["Q", "9", "8"], ["8", "7", "4", "3", "2"]),
      west: hand(["A", "K", "J"], ["K", "Q", "J", "9", "7", "6"], ["A", "K"], ["A", "6"]),
      south: hand(["9", "6", "5", "3", "2"], ["A", "2"], ["J", "7", "5", "2"], ["10", "5"]),
    },
    commentary:
      "Ovest conta 10 prese da solo: su 2NT è bene che dichiari la manche che pensa di fare, perché se dichiara 3♥ (Livello di Guardia) Est può passare. Il Gioco. Il contratto è in una botte di ferro, ma è sempre doveroso ricavare da ogni mano il maggior numero possibile di prese! Come si può raggiungere il morto per poter incassare la Q♦? Semplice: sblocca AK♦, gioca AK♠ e taglia il J al morto, incassa la Q♦ scartando fiori, e se tutto è filato liscio ora può giocare atout: 12 prese. SE HAI LA POSSIBILITÀ, SENZA RISCHIARE TROPPO, DI FARE PRESE IN PIÙ, RICORDATI CHE IN GARA IL SUCCESSO NON È \"MANTENERE L'IMPEGNO\" MA VINCERE IL \"CONFRONTO\" CON I RISULTATI DEGLI ALTRI!",
    bidding: { dealer: "west", bids: ["2♥", "P", "2NT", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "Q3-5",
    lesson: 3,
    board: 5,
    title: "Contratti ad atout: tempo e controllo",
    contract: "2♥",
    declarer: "east",
    openingLead: c("club", "10"),
    vulnerability: "ns",
    hands: {
      north: hand(["10", "9", "8", "2"], ["K", "8", "5"], ["A", "9", "7"], ["9", "5", "4"]),
      east: hand(["A", "Q", "7", "3"], ["Q", "3"], ["K", "J", "10", "4"], ["A", "8", "2"]),
      west: hand(["6", "4"], ["J", "10", "9", "7", "6", "4"], ["Q", "2"], ["7", "6", "3"]),
      south: hand(["K", "J", "5"], ["A", "2"], ["8", "6", "5", "3"], ["K", "Q", "J", "10"]),
    },
    commentary:
      "2♥ vuol dire: \"se riparli, ti tiro una seggiolata\". E Est passa senza esitazioni. Il Gioco. Teoricamente Ovest conta 9 prese, con 4♥, 1♠, 1♣ e 3♦ affrancate. Ma se perde \"tempo\" la difesa può incassare 1♠, 2♥, 2♣, e 1♦. Questo è quanto succederà se mette la Q♠ sull'attacco: Sud prende, e torna fiori: una sotto. Rifiutando l'impasse Ovest guadagna invece un tempo, e lo usa per affrancare le quadri immediatamente (prima che gli avversari gli facciano saltare l'A♣). Su qualunque ritorno, appena riesce a prendere, potrà incassare le quadri scartando almeno una fiori, mantenendo il contratto. OGNI LINEA HA UN CERTO NUMERO DI VINCENTI. LA TERRA DI NESSUNO (AFFRANCABILI) SARÀ IL PREMIO DI CHI APPROFITTA MEGLIO DEI TEMPI, NELLA GARA A \"SMONTARSI I CONTROLLI\".",
    bidding: { dealer: "north", bids: ["P", "1NT", "P", "2♥", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "Q3-6",
    lesson: 3,
    board: 6,
    title: "Contratti ad atout: tempo e controllo",
    contract: "4♠",
    declarer: "south",
    openingLead: c("diamond", "Q"),
    vulnerability: "ew",
    hands: {
      north: hand(["K", "J", "8", "2"], ["J", "8"], ["5", "4", "2"], ["A", "K", "10", "4"]),
      east: hand(["A"], ["A", "9", "6", "5", "4"], ["9", "8", "7"], ["7", "6", "5", "2"]),
      west: hand(["6", "4", "3"], ["K", "7", "2"], ["Q", "J", "10", "6"], ["Q", "9", "3"]),
      south: hand(["Q", "10", "9", "7", "5"], ["Q", "10", "3"], ["A", "K", "3"], ["J", "8"]),
    },
    commentary:
      "La difesa ha a disposizione 3 assi e sta per affrancare anche una ♦, quindi bisogna cercare di scartare o una ♦ della mano o una del morto. La Q di ♥ offrirebbe uno scarto ma… troppo tardi: ci occorrono 2 tempi per affrancarla, agli avversari ne basta 1 per liberarsi la quadri. Bisogna rischiare l'impasse alla Q di fiori, subito: J♣, sperando nella Q in Ovest. Se siamo fortunati proseguiremo con 2 giri a ♣ scartando il 3♦. Poi potremo giocare atout. Questo piano, l'unico che ha prospettive di mantenimento del contratto, richiede che la Q♣ sia in impasse, e che passino 3 giri di fiori (quindi che il colore sia diviso 4/3). UNA STRADA INCERTA È MEGLIO DI UN VICOLO CIECO; SE DEVI RISCHIARE PER MANTENERE IL CONTRATTO, FALLO: IN FONDO È UN GIOCO!",
    bidding: { dealer: "east", bids: ["P", "1♠", "P", "2♣", "P", "2NT", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "Q3-7",
    lesson: 3,
    board: 7,
    title: "Contratti ad atout: tempo e controllo",
    contract: "4♠",
    declarer: "north",
    openingLead: c("heart", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["Q", "J", "10", "7", "6"], ["A", "Q", "4"], ["J", "8"], ["A", "7", "6"]),
      east: hand(["8", "4"], ["J", "10", "9", "5", "2"], ["A", "5", "4"], ["9", "5", "3"]),
      west: hand(["9", "3", "2"], ["K", "6", "3"], ["9", "3", "2"], ["K", "Q", "10", "8"]),
      south: hand(["A", "K", "5"], ["8", "7"], ["K", "Q", "10", "7", "6"], ["J", "4", "2"]),
    },
    commentary:
      "Con un cambio di colore forzante Nord ottiene l'informazione che cercava. Il Gioco. L'attacco non disturba, ma se Nord batte le atout, e quando affronta le quadri Est rifiuta di prendere al primo giro, il morto diventa irraggiungibile. La soluzione c'è: basta incassare solo due colpi di atout, lasciando A o K al morto come ingresso! Quindi: AQ♠ e poi quadri. Anche se l'avversario prende al secondo giro, l'atout lasciata al morto consentirà sia di completare la battuta sia di andare a incassare la quadri. SE HAI UNA LUNGA DA AFFRANCARE, E GLI INGRESSI SONO DATI SOLO DALLE ATOUT, ASPETTA A BATTERLE: LA LUNGA VA AFFRANCATA PRIMA.",
    bidding: { dealer: "south", bids: ["1♦", "P", "1♠", "P", "1NT", "P", "2♣", "P", "2♠", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "Q3-8",
    lesson: 3,
    board: 8,
    title: "Contratti ad atout: tempo e controllo",
    contract: "4♥",
    declarer: "east",
    openingLead: c("spade", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "8", "7", "6"], ["9", "5"], ["A", "J", "9", "8"], ["Q", "10", "8"]),
      east: hand(["4"], ["A", "Q", "J", "8", "7", "6"], ["Q", "5", "4", "3"], ["K", "5"]),
      west: hand(["K", "5", "3", "2"], ["K", "10", "4"], ["K", "7"], ["A", "6", "4", "2"]),
      south: hand(["Q", "J", "10", "9"], ["3", "2"], ["10", "6", "2"], ["J", "9", "7", "3"]),
    },
    commentary:
      "Sul 4° colore (2♦) Ovest dà precedenza al fit nobile, quindi 2♥ e non 2NT. Il Gioco. Est taglia il 2°giro e conta 9 prese (6♥,1♦,2♣). Nessun allungamento è ottenibile tagliando le ♣ o le ♠, mentre è vantaggioso cercare di tagliare le quadri; la prima cosa da fare è aprire il taglio, cedendo l'A♦. Vinto qualsiasi ritorno procederà con Q♦ e quadri tagliata, fiori per il K e quadri tagliata. Poi, atout, per 11 prese. Se batte atout subito resterà a 9. (Nota: l'attacco e il ritorno in atout, col senno di poi, è la miglior difesa: limita a 10 le prese del giocante. PRIMA DI PRECIPITARSI A BATTERE ATOUT È OPPORTUNO VERIFICARE SE SERVONO TAGLI DALLA PARTE CORTA.",
    bidding: { dealer: "west", bids: ["1♣", "P", "1♥", "P", "1♠", "P", "2♦", "P", "2♥", "P", "4♥", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 4: Il capitanato e la replica dell'apertore
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "Q4-1",
    lesson: 4,
    board: 1,
    title: "Il capitanato e la replica dell'apertore",
    contract: "4♥",
    declarer: "north",
    openingLead: c("heart", "3"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "10", "6", "5", "4"], ["A", "Q", "10", "5", "2"], ["9"], ["A", "6"]),
      east: hand(["Q", "8", "7", "3"], ["6", "3"], ["K", "10", "5", "3"], ["8", "4", "2"]),
      west: hand(["J", "9"], ["9", "8", "4"], ["Q", "8", "7", "6", "4"], ["K", "J", "3"]),
      south: hand(["K", "2"], ["K", "J", "7"], ["A", "J", "2"], ["Q", "10", "9", "7", "5"]),
    },
    commentary:
      "Dopo il 2♣ Sud, invece di chiudere la bocca a Nord con 3NT, temporeggia con 2NT (forzante!) per avere ancora informazioni; Nord si può sfogare raccontando di avere 5 carte anche nel secondo colore e la coppia trova la miglior manche. L'attacco non è evidente, non picche e non fiori, quindi a scelta tra ♥ e ♦. Il Gioco. La via più semplice per Nord è cercare di affrancare la sua mano, tagliando al morto 1 o 2 picche. Poiché per evitare surtagli servono le atout alte di Sud, vince in mano l'attacco in atout e apre i tagli a picche usando J♥ e K♥, rientrando in mano con l'Asso di ♣. Realizzerà 12 prese, perdendo solo il K♠. DOPO LE RISPOSTE 2 SU 1 QUALSIASI DICHIARAZIONE SOTTO MANCHE È FORZANTE E PUÒ ESSERE UTILIZZATA PER AVERE UN QUADRO PIÙ CHIARO DELLA MANO DELL'APERTORE",
    bidding: { dealer: "north", bids: ["1♠", "P", "2♣", "P", "2♥", "P", "2NT", "P", "3♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "Q4-2",
    lesson: 4,
    board: 2,
    title: "Il capitanato e la replica dell'apertore",
    contract: "3NT",
    declarer: "west",
    openingLead: c("heart", "3"),
    vulnerability: "ns",
    hands: {
      north: hand(["4", "2"], ["A", "9", "7", "5", "3"], ["10", "8", "4", "2"], ["10", "9"]),
      east: hand(["Q", "8"], ["8"], ["Q", "J", "7", "5"], ["A", "K", "J", "7", "4", "2"]),
      west: hand(["A", "10", "7", "6", "3"], ["K", "Q", "10"], ["K", "6"], ["Q", "8", "6"]),
      south: hand(["K", "J", "9", "5"], ["J", "6", "4", "2"], ["A", "9", "3"], ["5", "3"]),
    },
    commentary:
      "Può sembrare strano che Ovest dica un colore che non ha, Est lo appoggi, e il contratto finisca a 3NT: ma tutto è invece molto logico se lo si guarda dal punto di vista del Capitanato. Ovest, con dichiarazioni sempre forzanti, ha conservato il comando quindi sarà lui a decidere e Est a descriversi. Il 2♦ è un cambio di colore che ha la sola funzione di allungare le picche in modo forzante; non corre nessun rischio. Il Gioco. Nessun problema: 6♣, 2♦, 2♥ e 1♠ danno 3NT + 2. LA DICHIARAZIONE NON È AFFATTO UN DIALOGO: UNO FA DOMANDE, L'ALTRO DÀ RISPOSTE.",
    bidding: { dealer: "east", bids: ["1♣", "P", "1♠", "P", "2♣", "P", "2♦", "P", "3♦", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "Q4-3",
    lesson: 4,
    board: 3,
    title: "Il capitanato e la replica dell'apertore",
    contract: "4♠",
    declarer: "south",
    openingLead: c("club", "J"),
    vulnerability: "ew",
    hands: {
      north: hand(["9", "3"], ["Q", "6", "4"], ["A", "K", "8", "6", "3", "2"], ["K", "Q"]),
      east: hand(["10", "7", "2"], ["K", "10", "8"], ["J", "10", "5"], ["8", "7", "3", "2"]),
      west: hand(["6", "5"], ["A", "9", "7", "2"], ["Q", "4"], ["J", "10", "9", "5", "4"]),
      south: hand(["A", "K", "Q", "J", "8", "4"], ["J", "5", "3"], ["9", "7"], ["A", "6"]),
    },
    commentary:
      "Un salto a colore, dopo risposta che promette manche, non serve per mostrare forza in più: per quella ci sarà tempo. Serve, invece, per mostrare una qualità eccezionale del colore (6+ carte capeggiate da almeno 4 delle 5 più alte). IL GIOCO. Il contratto è salvo, ci sono 10 prese. Ma visto che l'attacco a ♥ non c'è stato, è possibile provare ad affrancare al taglio le quadri, per fare prese in più; per incassarle servirà un ingresso, quindi l'attacco va preso assolutamente con l'A♣! Poi si battono le atout, si taglia una quadri e si torna al morto con il K♣ per incassare: 13 prese. IL SALTO NEL COLORE DI APERTURA HA SIGNIFICATI DIVERSI: MOSTRA FORZA GENERICA SE LA RISPOSTA È A LIV. 1, O MOSTRA UN COLORE CHIUSO (O SEMICHIUSO) SE LA RISPOSTA È 2 SU 1.",
    bidding: { dealer: "south", bids: ["1♠", "P", "2♦", "P", "3♠", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "Q4-4",
    lesson: 4,
    board: 4,
    title: "Il capitanato e la replica dell'apertore",
    contract: "3NT",
    declarer: "west",
    openingLead: c("club", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["J", "10"], ["A", "9", "8", "2"], ["J", "9", "7", "2"], ["J", "10", "2"]),
      east: hand(["A", "K", "5", "4", "3"], ["Q", "10", "3"], ["K", "5"], ["Q", "9", "6"]),
      west: hand(["8", "7"], ["K", "J", "7", "4"], ["A", "10", "6", "4"], ["A", "5", "3"]),
      south: hand(["Q", "9", "6", "2"], ["6", "5"], ["Q", "8", "3"], ["K", "8", "7", "4"]),
    },
    commentary:
      "Est usa un cambio di colore per sentire se nella bilanciata di Ovest ci sono almeno 3♥; il 2♥ (che a questo punto non è di certo Rever) descrive perfettamente la 2443. Est, che è ancora Capitano, decide per la manche più ragionevole. IL GIOCO. Nord attacca nell'unico colore \"non dichiarato\" (2♦ è la sola licita artificiale fatta al tavolo). La carta che salva questo 3NT è…il 9♣: Ovest copre con la Q e cattura il K di Sud, cede l'A♣, e realizza la 9^ presa con l'expasse verso il 9, sapendo che il 10 è in Nord. SUL CAMBIO DI COLORE FORZANTE IL FIT TERZO NEL NOBILE DI RISPOSTA HA LA PRECEDENZA ASSOLUTA; SE NON VIENE DATO, NON C'È.",
    bidding: { dealer: "west", bids: ["1♦", "P", "1♠", "P", "1NT", "P", "2♣", "P", "2♥", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "Q4-5",
    lesson: 4,
    board: 5,
    title: "Il capitanato e la replica dell'apertore",
    contract: "4♥",
    declarer: "east",
    openingLead: c("club", "2"),
    vulnerability: "ns",
    hands: {
      north: hand(["10", "8"], ["9", "4"], ["A", "9", "7", "5", "3"], ["K", "Q", "J", "10"]),
      east: hand(["A", "Q", "7", "3"], ["K", "J", "10", "7", "6"], [], ["8", "7", "6", "3"]),
      west: hand(["K", "6"], ["A", "Q", "8"], ["K", "J", "6", "4"], ["A", "9", "5", "4"]),
      south: hand(["J", "9", "5", "4", "2"], ["5", "3", "2"], ["Q", "10", "8", "2"], ["2"]),
    },
    commentary:
      "Est interroga, poi dichiara le cuori in cerca del possibile fit terzo. Il Capitanato gli appartiene, pertanto Ovest si deve limitare, su 2♥, a dire semplicemente se ha 3 carte di fit (3♥) oppure no (2NT). Non sta a lui decidere il contratto. Il Gioco. Est conta 9 prese: 5♥, 3♠ e 1♣. Purtroppo i valori a quadri sono inutili. La 10^ presa è facile da trovare, tagliando una picche al morto; sarebbe sciocco fare economie (ha tutte atout alte) quindi il taglio va fatto con un onore e non con l'8. Alla difesa spetteranno solo le 3 fiori di Nord. CHI APRE DI 1NT NON PRENDE MAI LA DECISIONE FINALE, A MENO CHE IL COMPAGNO NON ESPRIMA UN INVITO.",
    bidding: { dealer: "north", bids: ["P", "P", "P", "1NT", "P", "2♣", "P", "2♦", "P", "2♥", "P", "3♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "Q4-6",
    lesson: 4,
    board: 6,
    title: "Il capitanato e la replica dell'apertore",
    contract: "6♠",
    declarer: "north",
    openingLead: c("club", "3"),
    vulnerability: "ew",
    hands: {
      north: hand(["Q", "J", "8", "6", "5", "3"], ["K", "10", "9"], ["9"], ["A", "J", "8"]),
      east: hand(["10", "9"], ["A", "Q", "4", "2"], ["8", "6"], ["Q", "10", "5", "4", "3"]),
      west: hand(["7"], ["J", "8", "7", "6", "5"], ["J", "7", "4", "3"], ["K", "6", "2"]),
      south: hand(["A", "K", "4", "2"], ["3"], ["A", "K", "Q", "10", "5", "2"], ["9", "7"]),
    },
    commentary:
      "L'appoggio a manche dice: \"anche a fronte del tuo minimo (5p.)- penso tu possa mantenere il contratto di 4♠\". Nord deve immaginare una mano di 20 punti, o equivalente in distribuzione; sa di giocare con 10 atout e nei colori di probabile attacco ha un asso e un Re. Tanti motivi per sparare 6♠… Il Gioco. Le ♦ sono una miniera d'oro da sfruttare: battuti due giri di atout (lasciando almeno una ♠ alta al morto) Nord incassa le teste di quadri scartando fiori, taglia una quadri affrancandone altre due e torna al morto in atout per incassarle: 12 prese. QUANDO CAPITA UNA MANO IN CUI IL CONTO DELLE PRESE FATTIBILI È FACILE E VERITIERO, NON LA SI DEVE MORTIFICARE MISURANDOLA CON IL \"METRO\" DEI PUNTI ONORI",
    bidding: { dealer: "east", bids: ["P", "1♦", "P", "1♠", "P", "4♠", "P", "6♠", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "Q4-7",
    lesson: 4,
    board: 7,
    title: "Il capitanato e la replica dell'apertore",
    contract: "4♥",
    declarer: "south",
    openingLead: c("diamond", "Q"),
    vulnerability: "both",
    hands: {
      north: hand(["7", "6", "2"], ["3", "2"], ["A", "6", "5"], ["A", "J", "10", "9", "6"]),
      east: hand(["Q", "10", "5", "4"], ["J", "10"], ["9", "8", "3"], ["8", "7", "3", "2"]),
      west: hand(["A", "J", "9"], ["9", "8", "4"], ["Q", "J", "10", "7"], ["Q", "5", "4"]),
      south: hand(["K", "8", "3"], ["A", "K", "Q", "7", "6", "5"], ["K", "4", "2"], ["K"]),
    },
    commentary:
      "La risposta limite di 1NT sposta il Capitanato in mano all'apertore; con 3♥ Sud descrive una monocolore di 6+ carte (non necessariamente chiuse: questo salto è necessario per dare la forza) di 15-17, e Nord con due assi rialza. Il Gioco. Ci sono 10 prese, ma Sud ha una soluzione al 100% per trovare l'11^: vince in mano l'attacco, batte i 3 giri di atout, supera il K♣ con l'Asso e gioca il J♣, intenzionato a scartare se da Est non compare la Q. Ovest incasserà questa presa (e l'A♠: adesso o mai più) ma il K♣ consentirà a Sud di tornare al morto per incassare 10♣ 9♣ e 6♣. UN SALTO NEL COLORE DI APERTURA MOSTRA LA CHIUSA SE LA RISPOSTA È 2 SU 1, MOSTRA FORZA GENERICA SE LA RISPOSTA È A LIVELLO 1",
    bidding: { dealer: "south", bids: ["1♥", "P", "1NT", "P", "3♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "Q4-8",
    lesson: 4,
    board: 8,
    title: "Il capitanato e la replica dell'apertore",
    contract: "2NT",
    declarer: "east",
    openingLead: c("club", "2"),
    vulnerability: "none",
    hands: {
      north: hand(["Q", "10"], ["K", "8", "6", "2"], ["10", "9", "4", "3"], ["A", "8", "3"]),
      east: hand(["8", "5", "3"], ["A", "J", "10", "3"], ["K", "Q", "5"], ["J", "9", "6"]),
      west: hand(["K", "J", "4", "2"], ["Q", "9", "4"], ["A", "8", "7", "6"], ["Q", "4"]),
      south: hand(["A", "9", "7", "6"], ["7", "5"], ["J", "2"], ["K", "10", "7", "5", "2"]),
    },
    commentary:
      "Con 2NT Est mostra 11 e Ovest, passato in comando, decide di passare avendo il minimo. Sull'attacco si deve assolutamente giocare il 4♣ (altrimenti NS sfilano le prime 6) e accorgersi dalla carta di ritorno (Nord, rimasto con 2 carte, deve giocare l'8) che il colore è diviso 5-3. Il Gioco. La sola possibilità di mantenere il contratto è che riesca l'impasse a cuori, e c'è un solo ingresso, a quadri. Est incassa KQ♣ e poi l'A♦, vedendo che non sono divise. Ora bisogna gestire le carte di cuori in modo da poter ripetere l'impasse più volte: occorre iniziare con il 9 (e star sotto con il 3), poi la Q e infine il 7; Est manterrà l'impegno con 4♥, 3♦ e 1♣. 2NT, IN QUALUNQUE SITUAZIONE VENGA DICHIARATO, MOSTRA IL COMPLEMENTO A 22-23 A FRONTE DEL MINIMO DEL COMPAGNO E CHIEDE 2-3 PUNTI IN PIÙ PER RIALZARE.",
    bidding: { dealer: "west", bids: ["1♦", "P", "1♥", "P", "1♠", "P", "2NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 5: I colori bucati
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "Q5-1",
    lesson: 5,
    board: 1,
    title: "I colori bucati",
    contract: "4♥",
    declarer: "south",
    openingLead: c("club", "J"),
    vulnerability: "none",
    hands: {
      north: hand(["J", "7"], ["A", "Q", "10", "5", "2"], ["K", "10", "7", "6"], ["5", "3"]),
      east: hand(["K", "9", "3"], ["J", "8", "6", "3"], ["A", "8"], ["Q", "8", "7", "4"]),
      west: hand(["Q", "10", "6", "5", "2"], [], ["J", "9", "3"], ["J", "10", "9", "6", "2"]),
      south: hand(["A", "8", "4"], ["K", "9", "7", "4"], ["Q", "5", "4", "2"], ["A", "K"]),
    },
    commentary:
      "Sud può contare su 5 prese a ♥ con certezza matematica, a condizione che incassi per primo un onore del morto: qualora scoprisse la 4-0, rimanendo con Q10+K9, potrà catturare il J quarto sia in Est che in Ovest. Una volta risolto il problema delle cuori dovrà manovrare al meglio le quadri, per perdere una sola presa. QUANDO UN COLORE PRESENTA I DUE ONORI (K E Q) DIVISI, E UNO DI ESSI È A PROTEZIONE DEL 10, IL PRIMO ONORE CHE VA SACRIFICATO – GIOCANDO \"PICCOLA VERSO\" - È QUELLO DA SOLO; QUALUNQUE COSA SUCCEDA SI POTRÀ PROSEGUIRE GIOCANDO VERSO Q + 10 PER FARE L'IMPASSE AL FANTE.",
    bidding: { dealer: "north", bids: ["P", "P", "1NT", "P", "2♣", "P", "2♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "Q5-2",
    lesson: 5,
    board: 2,
    title: "I colori bucati",
    contract: "4♠",
    declarer: "west",
    openingLead: c("club", "Q"),
    vulnerability: "ns",
    hands: {
      north: hand(["10", "9", "4"], ["K", "8", "7"], ["10", "5"], ["Q", "J", "9", "5", "4"]),
      east: hand(["J", "7", "3", "2"], ["A", "J", "9", "3"], ["A", "7", "4", "3"], ["A"]),
      west: hand(["A", "Q", "6", "5"], ["Q", "10", "4"], ["K", "J", "6", "2"], ["10", "7"]),
      south: hand(["K", "8"], ["6", "5", "2"], ["Q", "9", "8"], ["K", "8", "6", "3", "2"]),
    },
    commentary:
      "In presa al morto, il primo provvedimento è battere le atout (♥ e ♦ presentano prese lunghe); la manovra corretta (l'unica con cui è possibile fare tutte le prese) è PICCOLA verso la Q, e poi l'Asso; la sola figura favorevole è che ci sia Kx in impasse. Iniziare con il J è perdente sempre, con qualsiasi figura. Ed eccoci alle quadri: un onore per parte, uno dei quali protegge il fante. La manovra corretta è Asso e poi piccola verso KJ per l'impasse. Per nessun motivo si deve iniziare con il J, visto che il 10 ce l'hanno i difensori. Infine le cuori: tante equivalenti, quindi l'impasse al Re va fatto \"a forzare\": si inizia con Q o 10. CHI GIOCA IL FANTE, E NON HA IL 10, DEVE STARE IN GINOCCHIO SUI CECI",
    bidding: { dealer: "east", bids: ["1♦", "P", "1♠", "P", "2♣", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "Q5-3",
    lesson: 5,
    board: 3,
    title: "I colori bucati",
    contract: "4♥",
    declarer: "north",
    openingLead: c("diamond", "J"),
    vulnerability: "ew",
    hands: {
      north: hand(["Q", "J", "8"], ["A", "K", "5", "4", "3", "2"], ["8"], ["8", "5", "4"]),
      east: hand(["7", "6"], ["Q", "10", "8", "7"], ["J", "10", "9", "3"], ["J", "9", "7"]),
      west: hand(["10", "5", "4", "2"], ["9"], ["A", "K", "6", "4"], ["K", "10", "6", "3"]),
      south: hand(["A", "K", "9", "3"], ["J", "6"], ["Q", "7", "5", "2"], ["A", "Q", "2"]),
    },
    commentary:
      "Nord ha a disposizione 4♠ e almeno 1♦, se dalle sue 6 carte di cuori otterrà almeno 5 prese il contratto è in porto. Tagliata la seconda quadri bisogna muovere le atout, e poiché farle tutte è impossibile si deve trovare la manovra migliore per non perderne due. Il modo migliore, che dà un valore al J, è giocare subito piccola verso il J: se le cuori sono 3-2 farà poi tutte le restanti, se ce ne sono 4 in Ovest avrebbe perso comunque, se ce ne sono 4 in Est (con la Q) Nord avrà trovato l'unica via per perdere una cuori sola. L'EXPASSE È SEMPRE UN'ALTERNATIVA DA TENER PRESENTE, QUANDO NON CI SONO I REQUISITI PER FARE UN IMPASSE",
    bidding: { dealer: "south", bids: ["1NT", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "Q5-4",
    lesson: 5,
    board: 4,
    title: "I colori bucati",
    contract: "1NT",
    declarer: "east",
    openingLead: c("heart", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["Q", "J", "10", "9", "2"], ["A", "K", "7"], ["9", "8"], ["10", "9", "8"]),
      east: hand(["A", "K", "8"], ["6", "5", "3"], ["Q", "5"], ["K", "7", "6", "5", "2"]),
      west: hand(["6", "5"], ["Q", "4", "2"], ["A", "7", "6", "4", "3"], ["Q", "4", "3"]),
      south: hand(["7", "4", "3"], ["J", "10", "9", "8"], ["K", "J", "10", "2"], ["A", "J"]),
    },
    commentary:
      "Sul J♥ non si deve mettere la Q perché non ha speranze; in compenso, a volte, Sud è quinto e Nord ha AK secchi. Purtroppo non è questo il caso e vedete Nord incassare AK, per poi proseguire con la Q♠. Est prende e conta: 2♠, 1♦ e servono 4 prese a ♣, perché l'expasse a ♦ è destinato a fallire. Perché? Perché avete già visto in Nord 7 punti a ♠ e 3 a ♠, e se avesse il K♦ o l'A♣ avrebbe aperto! La buona notizia è che ora sapete come muovere le fiori: quando si ha Kxxx + Qxxx, o Kxxxx + Qxx, si deve sperare che un avversario abbia l'Asso secondo, indovinare quale sia, passargli sotto il naso con il primo expasse (2♣ per la Q) e poi rigiocare verso l'altro onore senza metterlo (3♣ per il 5: cade l'asso). KQXX + XXXX È UNA FIGURA MOLTO PIÙ SOLIDA DI KXXX + QXXX",
    bidding: { dealer: "west", bids: ["P", "P", "1♣", "P", "1♦", "P", "1NT", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "Q5-5",
    lesson: 5,
    board: 5,
    title: "I colori bucati",
    contract: "4♥",
    declarer: "north",
    openingLead: c("diamond", "K"),
    vulnerability: "ns",
    hands: {
      north: hand(["K", "J", "10", "8", "4"], ["A", "Q", "6", "5", "2"], ["4"], ["Q", "3"]),
      east: hand(["A", "7"], ["10", "9", "8", "4"], ["K", "Q", "J", "10"], ["10", "8", "2"]),
      west: hand(["6", "5", "3", "2"], ["K"], ["9", "8", "5", "2"], ["K", "9", "7", "4"]),
      south: hand(["Q", "9"], ["J", "7", "3"], ["A", "7", "6", "3"], ["A", "J", "6", "5"]),
    },
    commentary:
      "Il 2NT è una licita morbida (comunque forzante, dopo 2♣) che consente a Nord di descrivere altro, se ha maggiori lunghezze. Se Sud avesse sparato 3NT Nord avrebbe dovuto indovinare tra Passo e 4♥. Il Gioco. Vinto l'attacco Nord deve manovrare le atout: con Jxx + AQxxx, mancando il 10, la partenza con il J è sempre perdente. Non si faranno MAI 5 prese in nessun caso, e se poi ci fosse il K secco se ne perderebbero due! Quindi, si parte di piccola con l'intenzione di passare la Q. Nord cattura il K e lascia a Est l'atout vincente per dedicarsi alle picche; Est gli batterà l'atout e giocherà quadri, ma ormai Nord ha 10 prese. E' CORRETTO GIOCARE UN IMPASSE \"A FORZARE\" SOLO SE, CATTURATO L'ONORE, AVANZATE QUANTO BASTA PER POTER ELIMINARE TUTTE LE CARTE AVVERSARIE",
    bidding: { dealer: "north", bids: ["1♠", "P", "2♣", "P", "2♥", "P", "2NT", "P", "3♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "Q5-6",
    lesson: 5,
    board: 6,
    title: "I colori bucati",
    contract: "4♠",
    declarer: "south",
    openingLead: c("heart", "2"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "K", "Q", "4"], ["K", "10"], ["10", "3"], ["A", "10", "8", "3", "2"]),
      east: hand(["6", "3"], ["A", "Q", "J", "7", "6"], ["Q", "J", "9", "6"], ["6", "5"]),
      west: hand(["7", "2"], ["5", "4", "2"], ["K", "8", "7", "5", "2"], ["Q", "9", "7"]),
      south: hand(["J", "10", "9", "8", "5"], ["9", "8", "3"], ["A", "4"], ["K", "J", "4"]),
    },
    commentary:
      "Anche se sa che il K♥, data la licita, è un valore probabilmente nullo, Nord ha comunque una buona sbilanciata di 16 pertanto l'appoggio a picche va dato a salto. Come previsto Est incassa le prime 2 prese poi per il suo meglio intavola la Q♦. Il Gioco. Dopo aver perso due cuori e smontato a quadri, per Sud diventa vitale, dopo aver battuto le atout, indovinare la Q♣: con 8 carte l'impasse va fatto, e poiché ha KJ in una mano e A10 nell'altra può scegliere da che parte farlo. Una scelta al 50%? Proprio no, se si ricorda che Est (passato di mano) ha già fatto vedere 7 punti a cuori e, verosimilmente, 3 a quadri. Se avesse lui la Q♣ avrebbe aperto, quindi K♣ e J♣ a girare. UN IMPASSE \"BILATERALE\" È LASCIATO AL CASO, A MENO CHE SI ABBIANO DEDUZIONI UTILI",
    bidding: { dealer: "east", bids: ["P", "P", "P", "1♣", "1♥", "1♠", "P", "3♠", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "Q5-7",
    lesson: 5,
    board: 7,
    title: "I colori bucati",
    contract: "4♥",
    declarer: "west",
    openingLead: c("club", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["A", "8", "2"], ["K", "2"], ["9", "4", "3"], ["J", "10", "8", "7", "4"]),
      east: hand(["K", "7", "5", "4"], ["8", "7", "5", "3"], ["A", "J", "6"], ["Q", "5"]),
      west: hand(["Q", "J", "3"], ["A", "J", "9", "6"], ["K", "Q", "7", "5"], ["A", "6"]),
      south: hand(["10", "9", "6"], ["Q", "10", "4"], ["10", "8", "2"], ["K", "9", "3", "2"]),
    },
    commentary:
      "L'attacco è il peggiore che Ovest possa ricevere, e non ha nessuno scarto veloce per disfarsi della fiori quindi si deve rassegnare a perderla. Dovrà dare anche l'A♠, quindi dovrà cercare di perdere una sola presa a ♥. Come si muove un colore fatto da xxxx + AJ9x per dare una sola presa? Si deve sperare nella 3-2, ma non solo: si deve sperare che il DIECI sia in mano al difensore che precede AJ9, e giocare piccola al NOVE. Se tale carta basterà per far scendere un onore, si potrà fare l'impasse all'altro grazie alla forchetta di AJ. LE BATTAGLIE LE VINCONO GLI ASSI, I RE E LE DAME: MA SONO I DIECI E I NOVE CHE DECIDONO L'ESITO DELLA GUERRA. IMPARATE A GUARDARLI CON AFFETTO!",
    bidding: { dealer: "south", bids: ["P", "1NT", "P", "2♣", "P", "2♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "Q5-8",
    lesson: 5,
    board: 8,
    title: "I colori bucati",
    contract: "3NT",
    declarer: "east",
    openingLead: c("heart", "J"),
    vulnerability: "none",
    hands: {
      north: hand(["Q", "J", "10", "2"], ["K", "7", "6", "5"], ["Q", "J", "4"], ["A", "9"]),
      east: hand(["K", "9", "5"], ["A", "Q"], ["9", "7", "6", "3"], ["K", "J", "6", "4"]),
      west: hand(["A", "7", "6", "3"], ["8", "2"], ["A", "K", "8", "2"], ["Q", "7", "5"]),
      south: hand(["8", "4"], ["J", "10", "9", "4", "3"], ["10", "5"], ["10", "8", "3", "2"]),
    },
    commentary:
      "Il Surcontro mostra 11+ punti e Sud sa che deve correre ai ripari dichiarando il solo colore che può giocare (nessun timore: se Nord conta i punti, lo sa perfettamente che Sud ha mano bianca). A differenza del Contro, che chiede di dichiarare, il Surcontro chiede di passare e Ovest, che non ha niente di speciale da dire, lascia arrivare la decisione al compagno. Il Gioco. Est ha un solo tempo per trovare le prese che mancano: ha a disposizione 2♠, 2♥, 2♦. Affrancarne 1♦ non basta, l'unica via è ottenere 3 prese dalle ♣. Anche se non fossero 3-3. Occorre manovrare con attenzione: ♦ al morto e ♣ verso la mano, ♦ al morto e ancora ♣, su cui cade l'Asso; il colore è bloccato ma non sarà un problema, i collegamenti per incassare 3 fiori ci sono! CON FIGURE TIPO JXX + KQXX, SE SERVONO 3 PRESE E I COLLEGAMENTI NON MANCANO, È CONVENIENTE GIOCARE DUE VOLTE VERSO IL DOPPIO ONORE",
    bidding: { dealer: "west", bids: ["1♦", "X", "XX", "P", "1♥", "P", "P", "3NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 6: Le aperture di 2, 3, 4
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "Q6-1",
    lesson: 6,
    board: 1,
    title: "Le aperture di 2, 3, 4",
    contract: "3NT",
    declarer: "east",
    openingLead: c("spade", "3"),
    vulnerability: "none",
    hands: {
      north: hand(["K", "8", "6"], ["Q", "10", "9", "8"], ["9", "8", "6"], ["9", "8", "4"]),
      east: hand(["A", "J", "2"], ["A", "J", "4", "2"], ["A", "K", "J", "2"], ["A", "K"]),
      west: hand(["10", "5"], ["7", "6", "3"], ["Q", "7", "5", "3"], ["J", "10", "6", "3"]),
      south: hand(["Q", "9", "7", "4", "3"], ["K", "5"], ["10", "4"], ["Q", "7", "5", "2"]),
    },
    commentary:
      "La bilanciata che ha come partenza l'apertura di 2♣ è illimitata: 23 e oltre può significare anche 26, 27, 28... pertanto il Rispondente non si può permettere, con il Passo, di \"decidere\" che la manche non è fattibile. Il Gioco. L'attacco a Picche, corretto, offre a Est la certezza di fare due prese nel colore, a condizione che NON metta il 10 del morto. Superato questo primo tranello, Est può raggiungere il morto due volte, a condizione che le ♦ siano divise 3-2 (Asso e Re, e se tutti rispondono J per la Q). Di questo doppio ingresso può fare un uso saggio per affrancare una Fiori: sbloccati Asso e Re, raggiunge il morto a Quadri e cede una Fiori; quando entrerà la seconda volta incasserà la Fiori buona, sua 10^ presa. COSTRUIRE (O VEDERE) INGRESSI IN UNA MANO QUASI NULLA È UNO DEGLI ASPETTI PIÙ INGEGNOSI DEL GIOCO COL MORTO",
    bidding: { dealer: "north", bids: ["P", "2♣", "P", "2♦", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "Q6-2",
    lesson: 6,
    board: 2,
    title: "Le aperture di 2, 3, 4",
    contract: "6♥",
    declarer: "west",
    openingLead: c("club", "Q"),
    vulnerability: "ns",
    hands: {
      north: hand(["10", "3"], ["9", "6"], ["J", "9", "8", "4"], ["Q", "J", "10", "8", "2"]),
      east: hand(["Q", "J", "4"], ["A", "10", "7"], ["6", "3", "2"], ["K", "6", "5", "4"]),
      west: hand(["A", "K", "6"], ["K", "Q", "J", "8", "4", "3"], ["A", "K", "7"], ["7"]),
      south: hand(["9", "8", "7", "5", "2"], ["5", "2"], ["Q", "10", "5"], ["A", "9", "3"]),
    },
    commentary:
      "Il rialzo a livello 3 (più forte del rialzo a manche) mostra fit e una mano con ambizioni di Slam; Ovest ha solo il problema di appurare che non manchino 2 assi. Li chiede, appura che ne manca solo uno, e dichiara lo Slam. Il Gioco. Ovest conta 11 prese, nessun taglio possibile e nessuna affrancabile per arrivare a 12… se non il K♣. Poiché l'Asso è in Sud con certezza assoluta, e poiché il K♣ DEVE essere salvato, non va messo sull'attacco: Ovest deve sperare che Sud abbia l'asso non più che terzo; ceduta a Nord la prima presa taglierà la continuazione e userà i numerosi ingressi al morto per tagliare ancora una fiori (cade l'asso) e poter incassare il Re, 12^ presa. NON SACRIFICATE INUTILMENTE, SULL'ATTACCO, ONORI LUNGHI DEL MORTO QUANDO SAPETE CON CERTEZZA CHE NON POSSONO VINCERE LA PRESA NÉ PROCURARVI CARTE AFFRANCATE",
    bidding: { dealer: "east", bids: ["P", "2♥", "P", "3♥", "P", "4NT", "P", "5♦", "P", "6♥", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "Q6-3",
    lesson: 6,
    board: 3,
    title: "Le aperture di 2, 3, 4",
    contract: "3NT",
    declarer: "north",
    openingLead: c("spade", "K"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "7", "4"], ["A", "Q", "5"], ["A", "Q", "7", "4"], ["A", "K", "Q"]),
      east: hand(["K", "Q", "10", "6", "2"], ["K", "8", "2"], ["10", "6", "2"], ["J", "3"]),
      west: hand(["J", "9", "3"], ["J", "10", "7"], ["J", "9", "8"], ["10", "9", "7", "4"]),
      south: hand(["8", "5"], ["9", "6", "4", "3"], ["K", "5", "3"], ["8", "6", "5", "2"]),
    },
    commentary:
      "Sud usa il 2♦ d'attesa: su 2♣ i colori si dichiarano solo se onorati, almeno quinti, e con mano FM. Il Gioco. Nord ha 3 possibilità per trovare la 9^ presa: l'impasse a ♥ o la 3-3 a ♦ o la 3-3 a ♣. Può programmare i movimenti per vincere purché una di queste possibilità si verifichi, ma con un solo ingresso al morto l'ordine dovrà essere: 1) AKQ di ♣: se sono divise va al morto col K♦ a incassare la 4^♣. Se non sono 3-3… 2) AQ di Quadri e poi piccola al Re: se sono divise viene in mano con l'A♥ (l'impasse non serve più!) e incassa la 4^♦, se non sono divise neanche le quadri... 3) approfitta di essere al morto per fare l'impasse di Cuori. A VOLTE LA NECESSITÀ IMPONE DI INCASSARE UN COLORE IN MODO ANOMALO RISPETTO AL SOLITO.",
    bidding: { dealer: "south", bids: ["P", "P", "2♣", "P", "2♦", "P", "2NT", "P", "3♣", "P", "3♦", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "Q6-4",
    lesson: 6,
    board: 4,
    title: "Le aperture di 2, 3, 4",
    contract: "4♠",
    declarer: "south",
    openingLead: c("heart", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["9", "4", "3"], ["2"], ["Q", "8", "4", "2"], ["Q", "8", "5", "4", "3"]),
      east: hand(["K", "5", "2"], ["Q", "9", "7", "6"], ["A", "9", "5"], ["9", "6", "2"]),
      west: hand(["8"], ["J", "10", "8", "5", "4", "3"], ["10", "3"], ["K", "J", "10", "7"]),
      south: hand(["A", "Q", "J", "10", "7", "6"], ["A", "K"], ["K", "J", "7", "6"], ["A"]),
    },
    commentary:
      "Nord non ha idea se le sue Dame possano servire: la sua ricchezza, sufficiente per sperare di portare una presa, sono le 3 carte di atout e il singolo a fianco. Il Gioco. Il morto porta una carta del tutto inutile (la Q♦) e due utilissime (Q♣ e 9♠). L'unica presa che si perderà certamente è l'A♦, mentre il K♠ potrebbe essere catturato se è in Est e se si riesce ad andare al morto! Andarci non è un problema, basta tagliarsi il K♥. Da lì si potrà partire col 9♠ e lasciarlo correre, e vinta la presa ripetere l'impasse; poi si cederà l'A♦, collezionando 12 prese. ANCHE SE IL CONTRATTO È SALVO NON SI DEVE MAI RINUNCIARE ALLA POSSIBILITÀ DI FARE UNA PRESA IN PIÙ.",
    bidding: { dealer: "west", bids: ["P", "P", "P", "2♠", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "Q6-5",
    lesson: 6,
    board: 5,
    title: "Le aperture di 2, 3, 4",
    contract: "5♣",
    declarer: "north",
    openingLead: c("heart", "K"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "Q", "J", "10", "6"], ["A", "5", "3"], ["2"], ["A", "K", "Q", "J"]),
      east: hand(["7", "4", "2"], ["K", "Q", "4", "2"], ["A", "9", "7", "4"], ["5", "3"]),
      west: hand(["K", "9", "8", "5"], ["J", "10", "9", "8"], ["K", "Q", "10"], ["7", "2"]),
      south: hand(["3"], ["7", "6"], ["J", "8", "6", "5", "3"], ["10", "9", "8", "6", "4"]),
    },
    commentary:
      "Sud ha una mano disgraziata, ma dopo che Nord dichiara le ♣ riprende colore e dignità: anche sapendo che Nord potrebbe avere solo tre carte, Sud non vede manche migliore. Nord non deve illudersi quando arriva questo salto a 5♣: troverà una mano poverissima, molto corta a ♠ e con un lungo fit. Il Gioco. Nord dovrà in ogni caso affrancare le sue Picche; la linea di gioco migliore -che prende due piccioni con una fava- è incassare due atout, e poi A♠ e Q♠ scartando Cuori se non compare il K. Ovest farà il Re, e poi ancora una Quadri. L'IMPASSE DI TAGLIO È UN'ALTERNATIVA VALIDA QUANDO L'IMPASSE NORMALE, POTENDOLO FARE UNA SOLA VOLTA O NEMMENO QUELLA, NON BASTEREBBE PER AFFRANCARE IL COLORE.",
    bidding: { dealer: "north", bids: ["2♠", "P", "2NT", "P", "3♣", "P", "5♣", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "Q6-6",
    lesson: 6,
    board: 6,
    title: "Le aperture di 2, 3, 4",
    contract: "4♠",
    declarer: "east",
    openingLead: c("heart", "A"),
    vulnerability: "ew",
    hands: {
      north: hand(["8", "2"], ["7", "6", "4", "2"], ["J", "9", "5"], ["J", "10", "9", "8"]),
      east: hand(["A", "K", "Q", "J", "10", "5"], ["J", "3"], ["A", "K"], ["A", "K", "5"]),
      west: hand(["6", "4", "3"], ["9", "8", "5"], ["Q", "8", "3", "2"], ["7", "6", "4"]),
      south: hand(["9", "7"], ["A", "K", "Q", "10"], ["10", "7", "6", "4"], ["Q", "3", "2"]),
    },
    commentary:
      "Ovest ha fit terzo, ma una mano assolutamente nulla che probabilmente non porta neppure una presa. Può comunicare questa ritrosia rimandando l'appoggio: se, su 2NT, Est dichiarasse un nuovo colore Ovest direbbe 3♠ (= \"chiedo pietà\"). Ma non serve, in quanto Est ha 10 prese da solo e, temendo di restare al palo, la manche se la dichiara da solo. Il Gioco. Est si accorge che, una volta perse le due Cuori, potrebbe fare tutte le restanti, se riuscirà a raggiungere il morto per incassare la Q♦. L'unico ingresso possibile è il 6♠, SE sono divise 2-2, e SE Est si ricorda di tagliare alto e conservare il 5 di picche! A CHI FA IL PIANO DI GIOCO SUBITO DOPO AVER VINTO LA PRESA, ANZICHÉ ALL'INIZIO, FACCIAMO I NOSTRI MIGLIORI AUGURI…",
    bidding: { dealer: "east", bids: ["2♠", "P", "2NT", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "Q6-7",
    lesson: 6,
    board: 7,
    title: "Le aperture di 2, 3, 4",
    contract: "6♠",
    declarer: "south",
    openingLead: c("diamond", "K"),
    vulnerability: "both",
    hands: {
      north: hand(["10", "3", "2"], ["A", "K", "2"], ["A", "8"], ["A", "K", "5", "4", "2"]),
      east: hand(["J", "5"], ["J", "10", "8", "5"], ["7", "6", "5", "4", "2"], ["Q", "9"]),
      west: hand(["8"], ["Q", "9", "7", "6", "3"], ["K", "Q", "10", "9"], ["J", "10", "6"]),
      south: hand(["A", "K", "Q", "9", "7", "6", "4"], ["4"], ["J", "3"], ["8", "7", "3"]),
    },
    commentary:
      "In Zona contro Zona il barrage dovrebbe garantire il \"3 down con le proprie\", quindi 7 prese; con 4NT Nord appura che Sud ha AKQ♠ e 12 prese sono certe, ma ci sono troppe incognite per chiamare il Grande Slam e Nord dovrebbe accontentarsi. Il Gioco. Vinto l'attacco e battuti due giri di atout, su cui cade il J (il 10 di Nord diventa un ingresso) appare chiaro che 12 prese sono sul tavolo. La possibilità di fare una presa in più non richiede grande impegno ma solo un po' di fantasia: si incassano Asso e Re di Cuori scartando FIORI (non quadri), poi Asso e Re di Fiori e Fiori taglio. Picche al morto e incasso della Fiori per lo scarto, finalmente, del J♦. SIATE PRECISI QUANDO APRITE IN BARRAGE: SE IL COMPAGNO HA MANO FORTE DEVE POTERSI FIDARE E CONTARE LE PRESE.",
    bidding: { dealer: "south", bids: ["4♠", "P", "4NT", "P", "5♥", "P", "6♠", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "Q6-8",
    lesson: 6,
    board: 8,
    title: "Le aperture di 2, 3, 4",
    contract: "3♥",
    declarer: "south",
    openingLead: c("spade", "A"),
    vulnerability: "none",
    hands: {
      north: hand(["J", "6", "5", "3"], ["8"], ["9", "7", "2"], ["A", "K", "J", "10", "7"]),
      east: hand(["10", "9", "7"], ["10", "7", "5"], ["J", "6", "4"], ["9", "8", "6", "4"]),
      west: hand(["A", "K"], ["A", "Q", "J", "4", "3", "2"], ["A", "Q", "10"], ["Q", "2"]),
      south: hand(["Q", "8", "4", "2"], ["K", "9", "6"], ["K", "8", "5", "3"], ["5", "3"]),
    },
    commentary:
      "Un fit 3° in mano nulla che per di più non taglia mai… è come se non ci fosse. Est non può dire né 4♥ (non porta nessuna presa) né tantomeno 3♠ (visuale Slam) né Passo; progetta di temporeggiare con 2NT e riportare a cuori se da Ovest venisse un 3♣ o 3♦. O di passare su 3♥, se Ovest gli darà l'opportunità di farlo. Ovest nonostante i 22 riposa nel livello di guardia: è ben lontano dal contare 10 prese, se Est ha mano nulla. Il Gioco. Tagliato il terzo giro di ♣ (Nord non ha di meglio che continuare) Ovest vede che non può entrare al morto per fare nessun impasse rosso: ma se rinuncia a quello di Cuori (giocando la Q e il J di mano) potrà usare il 10 di Cuori come ingresso per tentare l'impasse di Quadri (partendo con il J, please..). DOPO APERTURA DI 2 A COLORE, IL \"3 NEL COLORE\" È IL LIVELLO DI GUARDIA.",
    bidding: { dealer: "west", bids: ["2♥", "P", "2NT", "P", "3♥", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 7: Attacchi e segnali di controgioco
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "Q7-1",
    lesson: 7,
    board: 1,
    title: "Attacchi e segnali di controgioco",
    contract: "3♥",
    declarer: "north",
    openingLead: c("spade", "A"),
    vulnerability: "none",
    hands: {
      north: hand(["Q", "9", "5"], ["A", "Q", "5", "3", "2"], ["A", "8", "3"], ["J", "8"]),
      east: hand(["A", "K", "8", "6"], ["9", "7"], ["Q", "10", "6", "2"], ["10", "5", "4"]),
      west: hand(["10", "4", "3", "2"], ["J", "4"], ["K", "J", "4"], ["A", "9", "3", "2"]),
      south: hand(["J", "7"], ["K", "10", "8", "6"], ["9", "7", "5"], ["K", "Q", "7", "6"]),
    },
    commentary:
      "L'attacco A♠ è scontato; Ovest rifiuta con il 2. Est si deve rendere conto che la Q è quindi in Nord, e che la prosecuzione con il K♠ la affrancherebbe (offrendo uno scarto … per esempio di una quadri del morto). E' urgente cambiare, e il colore più promettente è quadri (2♦), sperando in un onore in mano al compagno. Notate che se Est prosegue pigramente a picche Nord manterrà il contratto. Se invece muove piccola quadri il giocante, che non avrà il tempo di scartare, perderà 2 picche, 1 fiori, e 2 quadri: una sotto. UN ATTACCO DI ASSO DA AK È SEMPRE UN OTTIMO ATTACCO. MA NON È AFFATTO DETTO CHE SI DEBBA SEGUIRE A RUOTA CON IL K: GUARDATE LA CARTA DEL COMPAGNO, E IL MORTO!",
    bidding: { dealer: "north", bids: ["1♥", "P", "3♥", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "Q7-2",
    lesson: 7,
    board: 2,
    title: "Attacchi e segnali di controgioco",
    contract: "3NT",
    declarer: "south",
    openingLead: c("spade", "J"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "K"], ["Q", "10", "7", "5"], ["10", "9", "7"], ["A", "8", "6", "3"]),
      east: hand(["Q", "5", "2"], ["8", "6", "4"], ["6", "4", "3"], ["Q", "J", "4", "2"]),
      west: hand(["J", "10", "9", "4", "3"], ["9", "3", "2"], ["A", "K"], ["10", "7", "5"]),
      south: hand(["8", "7", "6"], ["A", "K", "J"], ["Q", "J", "8", "5", "2"], ["K", "9"]),
    },
    commentary:
      "Ovest attacca normalmente J♠, su cui Est mostra gradimento rispondendo con il 5. Sud ha 8 prese ed è costretto a cercare di affrancare almeno una quadri, sperando che le picche siano divise 4-4 (o che la difesa sbagli). Quando muoverà quadri Ovest rigiocherà picche, senza cercare futuro in altri colori, perché sa che la Dama è in mano al compagno. Da parte sua Est dovrà essere pronto a sbloccare la propria Dama sotto l'onore del morto: sa infatti dalla dichiarazione che Sud ha non più di 3 picche e sa dall'attacco che il compagno possiede il 10!!! IMPARARE A BUTTAR VIA UN ONORE È DURA, MA È COSÌ TRISTE AGGRAPPARSI A UNA PROPRIA VINCENTE SACRIFICANDONE DUE O TRE IN MANO AL COMPAGNO…",
    bidding: { dealer: "east", bids: ["P", "1♦", "P", "1♥", "P", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "Q7-3",
    lesson: 7,
    board: 3,
    title: "Attacchi e segnali di controgioco",
    contract: "3NT",
    declarer: "east",
    openingLead: c("diamond", "K"),
    vulnerability: "ew",
    hands: {
      north: hand(["J", "10", "3", "2"], ["J", "10", "3", "2"], ["J", "3"], ["8", "5", "2"]),
      east: hand(["8", "6", "5"], ["K", "Q", "8", "6"], ["A", "9", "8"], ["K", "Q", "3"]),
      west: hand(["A", "K", "Q", "4"], ["9", "5"], ["7", "6", "4"], ["A", "J", "9", "6"]),
      south: hand(["9", "7"], ["A", "7", "4"], ["K", "Q", "10", "5", "2"], ["10", "7", "4"]),
    },
    commentary:
      "L'attacco K♦ è scontato, e Est (che ha 8 prese) dovrebbe lisciare fino al 3° giro. Nord ha sbloccato il J (sa che Sud ha KQ10 e gli semplifica il compito) e poi il 3, e sul 3° giro prende tempo scartando il 2♠. Ma quando Est incassa le ♣ Nord ha seri problemi di scarto, perché …\"regge\" sia a ♠ che a ♥! Quale \"retta\" abbandonare? CUORI! Le picche sono una certezza, Nord le vede, e sa di essere il solo che può impedire che il 4♠ si affranchi. Deve sperare che Sud tenga a cuori, altrimenti pazienza: questo è il modo giusto di affrontare il problema. CERCATE SEMPRE DI MANTENERE PARI LUNGHEZZA CON UN COLORE DEL MORTO PER IL MAGGIOR TEMPO POSSIBILE.",
    bidding: { dealer: "south", bids: ["P", "1♣", "P", "1♥", "P", "1♠", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "Q7-4",
    lesson: 7,
    board: 4,
    title: "Attacchi e segnali di controgioco",
    contract: "4♠",
    declarer: "east",
    openingLead: c("heart", "A"),
    vulnerability: "both",
    hands: {
      north: hand(["4", "3"], ["Q", "J", "9", "3"], ["10", "8", "6", "4", "3"], ["9", "6"]),
      east: hand(["K", "J", "9", "7"], ["7", "6", "5"], ["A", "9", "5"], ["A", "K", "J"]),
      west: hand(["Q", "10", "6", "5"], ["10", "4"], ["K", "Q", "J", "7"], ["Q", "10", "7"]),
      south: hand(["A", "8", "2"], ["A", "K", "8", "2"], ["2"], ["8", "5", "4", "3", "2"]),
    },
    commentary:
      "Sull'attacco di A♥ Nord, sapendo dalla licita che Sud ha almeno 4 carte (quindi: AK♥) deve rispondere con la Q, molto più convincente di qualsiasi dispari per dire: \"se vuoi, posso vincere io la prossima presa\". Sud conta i punti, 11 suoi + 10 il morto + circa 16 di Est: sa che Nord, a parte QJ♥, non ha più niente. Ma con il suo singolo di quadri può battere il contratto: sospende le cuori e gioca quadri. Appena prenderà a picche giocherà piccola cuori per Nord… e il rinvio a quadri batterà il contratto. QUANDO IL COMPAGNO, RISPONDENDO O SCARTANDO, VI SEGNALA IL POSSESSO DI UN ONORE, NON VI STA CHIEDENDO DI GIOCARE QUEL SEME MA DI FARE L'USO MIGLIORE DELL'INFORMAZIONE CHE VI HA DATO.",
    bidding: { dealer: "west", bids: ["P", "P", "1NT", "P", "2♣", "P", "2♠", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "Q7-5",
    lesson: 7,
    board: 5,
    title: "Attacchi e segnali di controgioco",
    contract: "6♥",
    declarer: "west",
    openingLead: c("club", "Q"),
    vulnerability: "ns",
    hands: {
      north: hand(["9", "6", "4", "3"], [], ["8", "6", "3", "2"], ["Q", "J", "10", "7", "5"]),
      east: hand(["K", "7", "5"], ["J", "10", "8", "6", "4"], ["A", "J", "5"], ["8", "4"]),
      west: hand(["A", "Q", "J"], ["A", "K", "Q", "7", "5", "3"], ["K", "10", "7"], ["K"]),
      south: hand(["10", "8", "2"], ["9", "2"], ["Q", "9", "4"], ["A", "9", "6", "3", "2"]),
    },
    commentary:
      "Ovest perde la prima presa (si spera che Sud non dorma) poi taglia la continuazione e batte due giri di atout. Si può vedere che il suo unico problema sarà indovinare la posizione della Q♦. Nord non ha nessun onore da segnalare e dovrebbe anche guardarsi bene dal \"rifiutare\" picche o quadri: farebbe la spia a un eventuale onore del compagno. Conservare le fiori è del tutto inutile, sono un colore morto in quanto sia Est che Ovest le hanno finite, quindi scarti fiori, non quadri e non picche! EVITATE DI SCARTARE DA UNA FIGURA DI CARTINE IN UN COLORE PROBABILMENTE INTERESSANTE PER IL GIOCANTE. SE C'È UN COLORE MORTO, SCARTATE QUELLO.",
    bidding: { dealer: "north", bids: ["P", "P", "P", "2♥", "P", "3♥", "P", "4NT", "P", "5♦", "P", "6♥", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "Q7-6",
    lesson: 7,
    board: 6,
    title: "Attacchi e segnali di controgioco",
    contract: "4♥",
    declarer: "south",
    openingLead: c("spade", "K"),
    vulnerability: "ew",
    hands: {
      north: hand(["J", "9", "8"], ["K", "J"], ["K", "7", "6", "4"], ["A", "K", "J", "9"]),
      east: hand(["A", "7", "5", "4"], ["7", "6", "2"], ["A", "Q", "9", "8"], ["5", "3"]),
      west: hand(["K", "Q", "10", "6", "2"], ["8", "3"], ["10", "2"], ["Q", "10", "4", "2"]),
      south: hand(["3"], ["A", "Q", "10", "9", "5", "4"], ["J", "5", "3"], ["8", "7", "6"]),
    },
    commentary:
      "Ovest attacca con il K♠, e qui si decide l'esito del contratto. Se Est invita (7♠) e Ovest prosegue, Sud taglia, batte atout e incassa 10 prese. Se Est guarda il morto nota che può fare 2 prese a quadri, ma solo se sarà Ovest a muoverle, per cui dovrebbe scoraggiare la continuazione a picche (4♠). Ovest deve fidarsi (sa che l'A♠ è in Est: se l'avesse Sud, avrebbe preso per affrancare il J del morto) e non ha difficoltà a indovinare quale colore giocare. Il 10♦ (da 2 carte sempre la più alta) spiega a Est (che ha il 9) che si tratta di un doubleton, e il taglio della terza quadri batte il contratto. IL CONTROGIOCO VA GUIDATO DA CHI HA PIÙ INFORMAZIONI. E IL COMPAGNO SI DEVE FIDARE!",
    bidding: { dealer: "east", bids: ["P", "P", "1NT", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "Q7-7",
    lesson: 7,
    board: 7,
    title: "Attacchi e segnali di controgioco",
    contract: "4♠",
    declarer: "north",
    openingLead: c("club", "7"),
    vulnerability: "both",
    hands: {
      north: hand(["Q", "10", "8", "7", "4", "3"], ["Q", "9"], ["A", "10"], ["K", "Q", "4"]),
      east: hand(["A", "J", "2"], ["A", "6", "5", "3"], ["Q", "6", "5", "3"], ["7", "2"]),
      west: hand(["9", "5"], ["K", "8", "7", "2"], ["J", "7", "2"], ["10", "8", "5", "3"]),
      south: hand(["K", "6"], ["J", "10", "4"], ["K", "9", "8", "4"], ["A", "J", "9", "6"]),
    },
    commentary:
      "Nord non ha bisogno di indagare: Sud (1NT) ha almeno 2 carte di ♠, il fit c'è e la forza di manche anche. Est attacca a ♣ per esclusione: non atout, non ♥ (né Asso né sotto Asso), non ♦, colore del morto. Il Gioco. Nord ha convenienza a battere atout iniziando dalla mano (piccola al K, poi piccola verso il 10) pertanto vince l'attacco in mano e muove il 3♠, su cui Est deve giocare il 2. Est vince la seconda presa a ♠ e, sperando che il compagno possa dargli qualche dritta su quale colore rosso giocare, incassa anche la terza ♠. Ovest segnala il suo unico valore scartando il 7♥ e la difesa incassa altre due prese, prima che Nord possa scartare sulle fiori. IL PRIMO SCARTO È UNO STRUMENTO ECCEZIONALE PER I DIFENSORI.",
    bidding: { dealer: "south", bids: ["1♦", "P", "1♠", "P", "1NT", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "Q7-8",
    lesson: 7,
    board: 8,
    title: "Attacchi e segnali di controgioco",
    contract: "4♠",
    declarer: "west",
    openingLead: c("diamond", "A"),
    vulnerability: "none",
    hands: {
      north: hand(["6", "5"], ["A", "Q", "6", "4"], ["A", "K", "7", "6"], ["8", "6", "4"]),
      east: hand(["K", "J", "10", "3"], ["7", "5", "3"], ["10", "9"], ["A", "Q", "10", "5"]),
      west: hand(["A", "Q", "9", "8", "7", "4"], ["K", "8"], ["5", "4", "3"], ["K", "J"]),
      south: hand(["2"], ["J", "10", "9", "2"], ["Q", "J", "8", "2"], ["9", "7", "3", "2"]),
    },
    commentary:
      "Est ha 12 \"rivalutati\", e dichiara direttamente 4♠. L'attacco è ovvio, la continuazione lo è meno: se Nord prosegue con il K♦ il contratto diventa imbattibile. A carte viste, i difensori potrebbero incassare 2♦ e 2♥, ma solo se sarà Sud a vincere la seconda presa! Sull'A♦ Sud deve rispondere con la Q♦: questa carta dice \"se vuoi, posso vincere la prossima presa, o perché taglio (Q secca) o perché ho il fante\". Nord, che si vede AQ♥ e non può muoversi se vuol fare due prese, proseguirà con piccola quadri per il J di Sud, e il rinvio J♥ condanna il contratto. QUANDO UN DIFENSORE \"SPRECA\" UN ONORE, SCARTANDO O RISPONDENDO, MOSTRA DI ESSERE PADRONE DEL COLORE DA QUELLA CARTA IN GIÙ.",
    bidding: { dealer: "west", bids: ["1♠", "X", "4♠", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 8: Accostamento a manche
  // ==========================================================================

  // --- Board 1 ---
  {
    id: "Q8-1",
    lesson: 8,
    board: 1,
    title: "Accostamento a manche",
    contract: "4♥",
    declarer: "south",
    openingLead: c("diamond", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["K", "7"], ["Q", "9", "8"], ["9", "8", "7", "6"], ["A", "10", "6", "4"]),
      east: hand(["10", "4", "3"], ["K", "7", "2"], ["A", "K", "5", "3"], ["7", "3", "2"]),
      west: hand(["J", "9", "8", "5"], ["5"], ["Q", "J", "10", "4", "2"], ["Q", "9", "8"]),
      south: hand(["A", "Q", "6", "2"], ["A", "J", "10", "6", "4", "3"], [], ["K", "J", "5"]),
    },
    commentary:
      "La mano di Sud vale un tentativo, e dichiara il più economico dei colori in cui gli servono valori. Nord potrebbe dire subito 4♥ ma mostrare l'A♣ è gratis; a Sud piace l'informazione e rialza. (lo avrebbe fatto comunque Nord, per via del K♠). Sud taglia l'attacco (e memorizza: AK♦ sono in Est). Incassa K♠ e A♠ e taglia una picche al morto, poi esegue con successo l'impasse a cuori. L'unico problema che gli rimane è indovinare la Q♣, ma non la si può sbagliare: Est, passato di mano, ha già mostrato AK♦ + K♥, non può avere anche la Q♣ altrimenti avrebbe aperto! Quindi, K♣ e J♣ per finire con 13 prese. LE INFORMAZIONI SULLE CARTE AVVERSARIE SPESSO SONO SUL TAVOLO: NON SIATE PIGRI!",
    bidding: { dealer: "north", bids: ["P", "P", "1♥", "P", "2♠", "P", "3♣", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 2 ---
  {
    id: "Q8-2",
    lesson: 8,
    board: 2,
    title: "Accostamento a manche",
    contract: "4♥",
    declarer: "east",
    openingLead: c("diamond", "K"),
    vulnerability: "ns",
    hands: {
      north: hand(["7", "6", "2"], ["J", "10"], ["J", "10", "5", "3"], ["A", "10", "6", "4"]),
      east: hand(["A", "Q", "J", "9", "3"], ["K", "Q", "3", "2"], ["A", "9"], ["7", "5"]),
      west: hand(["K", "8", "4"], ["A", "9", "6", "4"], ["7", "6", "4"], ["Q", "8", "2"]),
      south: hand(["10", "5"], ["8", "7", "5"], ["K", "Q", "8", "2"], ["K", "J", "9", "3"]),
    },
    commentary:
      "Quando Est chiede aiuto a ♥ potrebbe avere anche solo 3 carte, ma Ovest, quando dichiara 4♥, mostra di avere sia i valori a ♥ richiesti, sia 4+ carte (4♥ è gratis, equivale a dire 4♠). Est sceglie giustamente di giocare nel fit 4-4. Perché? Perché se ♠ è atout, le ♥ non servono, essendo \"a specchio\", per disfarsi di carte perdenti in altri colori. Se ♥ è atout, sulle picche si può scartare! Notate che entrambe le manche si realizzano facilmente, ma a 4♥ si fanno 11 prese (si scartano 2♦ sulle ♠ e si taglia una ♦), mentre si fanno solo 10 prese giocando a picche. IL RIALZO DEL COLORE DI INDAGINE (SOTTO IL LIVELLO DI GUARDIA) MOSTRA VALORI E LUNGHEZZA EFFETTIVA",
    bidding: { dealer: "east", bids: ["1♠", "P", "2♠", "P", "3♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 3 ---
  {
    id: "Q8-3",
    lesson: 8,
    board: 3,
    title: "Accostamento a manche",
    contract: "6♥",
    declarer: "east",
    openingLead: c("spade", "Q"),
    vulnerability: "ew",
    hands: {
      north: hand(["8", "6", "5", "3", "2"], ["9", "8", "4"], ["10"], ["K", "J", "10", "8"]),
      east: hand(["A", "9"], ["A", "K", "Q", "6", "3", "2"], ["K", "8", "3"], ["7", "2"]),
      west: hand(["K", "7"], ["J", "7"], ["A", "6", "5", "4", "2"], ["A", "Q", "6", "5"]),
      south: hand(["Q", "J", "10", "4"], ["10", "5"], ["Q", "J", "9", "7"], ["9", "4", "3"]),
    },
    commentary:
      "Est non affronterebbe lo slam a fronte del singolo a cuori, pertanto si industria per mostrare la sua monocolore forte: il 4° colore sancisce manche, poi quando su 2NT ribadisce le cuori ne mostra almeno 6, e ottiene da Ovest quel minimo appoggio che gli serve. Alla vista del morto sa che avrà da gestire fiori e quadri, ma se affranca le quadri potrà evitare l'impasse a fiori. Vinto in mano l'attacco batte atout e gioca il K♦, visto che tutti rispondono dà un colpo in bianco a quadri. Non sono divise, e Sud gioca ♣… ma Est rifiuta l'impasse e affranca una ♦ di taglio (ecco l'utilità di lasciare al morto il K♠); 12 prese. NON ILLUDETEVI DA MOSTRARE FORZA CON I SALTI: LASCIATELI FARE AI CANGURI.",
    bidding: { dealer: "south", bids: ["P", "1♦", "P", "1♥", "P", "2♣", "P", "2♠", "P", "2NT", "P", "3♥", "P", "4♥", "P", "4NT", "P", "5♥", "P", "6♥", "P", "P", "P"] },
  },

  // --- Board 4 ---
  {
    id: "Q8-4",
    lesson: 8,
    board: 4,
    title: "Accostamento a manche",
    contract: "3♦",
    declarer: "west",
    openingLead: c("heart", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["9", "2"], ["J", "10", "8", "5", "2"], ["Q", "10", "8"], ["A", "Q", "3"]),
      east: hand(["K", "10", "7", "4"], ["K", "Q", "7"], ["A", "J", "9", "2"], ["8", "4"]),
      west: hand(["A", "Q", "J", "6"], ["6"], ["6", "5", "4", "3"], ["K", "9", "6", "5"]),
      south: hand(["8", "5", "3"], ["A", "9", "4", "3"], ["K", "7"], ["J", "10", "7", "2"]),
    },
    commentary:
      "\"Mi aiuti a fiori?\" \"forse si, forse no, ho valori a cuori\" \"non mi interessano\" \"allora Passo, perché a ♣ non ho niente\". Questo è stato il dialogo; se le carte di Est fossero state ad esempio: Kxxx Axx AJxx Qx, Est avrebbe ancora potuto rialzare a 4♦. Notate come la cuori che Ovest affrancherà non gli serva assolutamente a niente: nessuno scarto utile. In questa mano è da notare la figura delle quadri: quando si hanno cartine + AJ9, per ottenere il massimo si deve giocare piccola AL NOVE! Se gli onori sono divisi, e il 10 è in impasse, il 9 farà scendere un onore e AJ serviranno a catturare l'altro. LE INDAGINI SONO UTILI ANCHE QUANDO DANNO ESITO NEGATIVO, PERCHÉ SERVONO A CAPIRE QUANDO LE CARTE DELLE DUE MANI… NON SI SPOSANO.",
    bidding: { dealer: "west", bids: ["P", "P", "1♦", "P", "1♠", "P", "2♠", "P", "3♣", "P", "3♦", "P", "3♥", "P", "P", "P"] },
  },

  // --- Board 5 ---
  {
    id: "Q8-5",
    lesson: 8,
    board: 5,
    title: "Accostamento a manche",
    contract: "4♠",
    declarer: "north",
    openingLead: c("club", "2"),
    vulnerability: "ns",
    hands: {
      north: hand(["K", "Q", "J", "6"], ["8", "7"], ["A", "8"], ["K", "Q", "J", "7", "6"]),
      east: hand(["A", "9", "2"], ["9", "6", "4", "2"], ["Q", "10", "5", "3", "2"], ["2"]),
      west: hand(["7", "3"], ["J", "10", "3"], ["K", "J", "6", "4"], ["A", "9", "5", "3"]),
      south: hand(["10", "8", "5", "4"], ["A", "K", "Q", "5"], ["9", "7"], ["10", "8", "4"]),
    },
    commentary:
      "Nord dichiara in Diritto la sua sbilanciata di 16 e quando riceve appoggio di cortesia a 2♠ (licita che Sud farebbe anche con 6-7 punti) deve appurare se il compagno sia più vicino ai 6-7 o ai 9-10; il 2NT non accende riflettori su nessun colore in particolare, chiede semplicemente punteggio massimo, dovunque dislocato. Sud, con 9 belli, non si fa pregare. Se il gioco inizia con A♣ e ♣ taglio, e ♦, Nord deve aspettare a toccare le atout: prima si deve sbarazzare della ♦, scartandola sul terzo giro di ♥. Stessa cosa, se l'attacco fosse quadri. Il contratto è imbattibile (anche con attacco ♣) perché l'Asso di atout non è in mano a Ovest. IL 2NT, A FIT NOBILE TROVATO, NON È UNA PROPOSTA DI CONTRATTO.",
    bidding: { dealer: "north", bids: ["1♣", "P", "1♠", "P", "2♠", "P", "2NT", "P", "4♠", "P", "P", "P"] },
  },

  // --- Board 6 ---
  {
    id: "Q8-6",
    lesson: 8,
    board: 6,
    title: "Accostamento a manche",
    contract: "4♥",
    declarer: "north",
    openingLead: c("spade", "K"),
    vulnerability: "ew",
    hands: {
      north: hand(["6", "5", "4"], ["A", "7", "6", "3", "2"], ["K"], ["A", "Q", "J", "9"]),
      east: hand(["K", "Q", "J", "9"], ["J", "8"], ["J", "9", "6", "3"], ["10", "4", "2"]),
      west: hand(["10", "2"], ["Q", "10", "9"], ["A", "10", "5", "4"], ["8", "7", "6", "5"]),
      south: hand(["A", "8", "7", "3"], ["K", "5", "4"], ["Q", "8", "7", "2"], ["K", "3"]),
    },
    commentary:
      "Nord valuta di avere carte per un 4° colore Forcing manche (il K♦ è secco, ma è nel colore di Sud!). Sud ha 2 informazioni possibili da dare: il fit terzo a ♥ e il fermo a ♣. La precedenza va al fit nobile! L'attacco non è amichevole: Nord conta 10 prese (sempre che le ♥ siano 3-2) ma se dovesse cedere la presa ora (ad esempio giocando ♦) andrebbe sotto. L'unica via da seguire è: eliminare le atout illegittime (quindi incassare AK♥) e poi dar piglio alle fiori, scartando picche dal morto. Se chi ha l'ultima atout ha anche 3+ fiori, quando potrà tagliare sarà tardi. SE CI SONO DUE O PIÙ POSSIBILI RISPOSTE SUL 4° COLORE, VALE L'ORDINE DI PREFERENZA DEI TIPI DI CONTRATTO: NOBILI – SENZ'ATOUT - MINORI",
    bidding: { dealer: "east", bids: ["P", "1♦", "P", "1♥", "P", "1♠", "P", "2♣", "P", "2♥", "P", "4♥", "P", "P", "P"] },
  },

  // --- Board 7 ---
  {
    id: "Q8-7",
    lesson: 8,
    board: 7,
    title: "Accostamento a manche",
    contract: "3NT",
    declarer: "west",
    openingLead: c("club", "8"),
    vulnerability: "both",
    hands: {
      north: hand(["8", "7", "5"], ["5", "4"], ["K", "Q", "7"], ["8", "7", "6", "4", "3"]),
      east: hand(["Q", "6"], ["K", "J", "10", "9", "8", "3"], ["5", "4", "3"], ["A", "Q"]),
      west: hand(["A", "10", "4", "3"], ["Q"], ["A", "J", "10", "6", "2"], ["K", "J", "10"]),
      south: hand(["K", "J", "9", "2"], ["A", "7", "6", "2"], ["9", "8"], ["9", "5", "2"]),
    },
    commentary:
      "Est ha forza di manche, quindi progetta una sequenza forzante: dopo 1♥ indaga con il 4° colore per esser certo che Ovest non lo lasci per strada. Ovest nega fit 3° e promette fermo a ♣, Est mostra di avere 6+ carte ripetendole, ma Ovest ne ha una sola e ripropone la manche a Senza. L'attacco (8♣: la più alta delle cartine) non fa danno, se non togliere un ingresso al morto che ha le cuori da affrancare. Nessun problema per Ovest, se avrà cura di giocare immediatamente il RE di cuori del morto: se Sud liscia, potrà continuare finché si deciderà a prendere, e rientrare al morto a fiori per incassare. DOPO UN NUOVO COLORE FORZANTE (3° O 4°), LE DICHIARAZIONI DI UN VECCHIO COLORE A LIVELLO 3 SONO FORZANTI A MANCHE.",
    bidding: { dealer: "south", bids: ["P", "1♦", "P", "1♥", "P", "1♠", "P", "2♣", "P", "2NT", "P", "3♥", "P", "3NT", "P", "P", "P"] },
  },

  // --- Board 8 ---
  {
    id: "Q8-8",
    lesson: 8,
    board: 8,
    title: "Accostamento a manche",
    contract: "4♥",
    declarer: "south",
    openingLead: c("spade", "K"),
    vulnerability: "none",
    hands: {
      north: hand(["8", "7", "6"], ["A", "10", "9", "3"], ["10", "5", "4"], ["K", "7", "6"]),
      east: hand(["A", "J", "5", "4"], ["8", "4"], ["Q", "J", "9", "3", "2"], ["10", "4"]),
      west: hand(["K", "Q", "9", "3", "2"], ["6", "2"], ["A", "7", "6"], ["Q", "9", "5"]),
      south: hand(["10"], ["K", "Q", "J", "7", "5"], ["K", "8"], ["A", "J", "8", "3", "2"]),
    },
    commentary:
      "Sud ha buone prospettive di manche e il modo migliore per coinvolgere Nord nella decisione è mostrare il suo colore laterale, come avrebbe fatto in assenza di competizione. Nord porta Kxx, e obbedisce. Se Ovest resta in presa, Sud realizzerà 5♥ + 4♣ (l'impasse alla Q va male) + un taglio al morto a ♦ (dopo aver scartato 2♦ sulle ♠). Ma sull'attacco di K♠ Est, che sa con certezza che a picche passa una sola presa prima che Sud tagli, dovrebbe rendersi conto che è urgente muovere quadri…e che il colore va mosso dalla sua parte: quindi supera il K♠ con l'Asso e gioca quadri, limitando Sud a 9 prese. SE IL COMPAGNO FA UN ATTACCO CON CUI SAPETE CHE RESTERÀ IN PRESA… NON È DETTO CHE SIA GIUSTO LASCIARGLIELA VINCERE!",
    bidding: { dealer: "west", bids: ["P", "P", "P", "1♥", "1♠", "2♥", "2♠", "3♣", "P", "4♥", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 9: Ricevere l'attacco
  // ==========================================================================

  {
    id: "Q9-1",
    lesson: 9,
    board: 1,
    title: "Ricevere l'attacco",
    contract: "4♠",
    declarer: "south",
    openingLead: c("diamond", "3"),
    vulnerability: "none",
    hands: {
      north: hand(["K", "Q", "7", "2"], ["10", "7", "2"], ["Q", "J", "5"], ["A", "3", "2"]),
      east: hand(["9", "8"], ["A", "K", "9"], ["K", "10", "9", "7", "4", "2"], ["K", "9"]),
      west: hand(["5"], ["Q", "6", "5", "4"], ["8", "6", "3"], ["10", "8", "7", "5", "4"]),
      south: hand(["A", "J", "10", "6", "4", "3"], ["J", "8", "3"], ["A"], ["Q", "J", "6"]),
    },
    commentary:
      "L'attacco (3♦) nel colore di intervento deve mostrare il Conto delle carte, quindi Est sa che Ovest ne ha 1 o 3. NON deve mettere il K neanche se Sud (errore!) fa giocare un onore al morto. Il Gioco. Sud ha bisogno di affrancare una quadri, quindi non deve sprecare nella prima presa né J né Q del morto: gioca il 5 e prende, batte atout finendo in Nord, e ora sì che presenta la Q♦; tagliato il K tornerà al morto con un terzo giro di atout per scartare una cuori sul J♦. Se tutti giocano al meglio alla difesa spetteranno solo 2 cuori e 1 fiori. E' SCIOCCO SPERARE NELL'ERRORE AVVERSARIO QUANDO ESISTE UNA MANOVRA MIGLIORE PER GARANTIRE IL SUCCESSO AL 100%.",
    bidding: { dealer: "north", bids: ["1♣", "1♦", "1♠", "P", "2♠", "P", "4♠", "P", "P", "P"] },
  },

  {
    id: "Q9-2",
    lesson: 9,
    board: 2,
    title: "Ricevere l'attacco",
    contract: "4♥",
    declarer: "east",
    openingLead: c("diamond", "A"),
    vulnerability: "ns",
    hands: {
      north: hand(["10", "5", "4", "3", "2"], ["8", "4"], ["6", "3"], ["J", "10", "5", "2"]),
      east: hand(["K"], ["Q", "J", "10", "9", "6", "3"], ["J", "7", "5"], ["K", "8", "3"]),
      west: hand(["A", "8", "7", "6"], ["A", "5"], ["Q", "10", "8", "2"], ["A", "Q", "9"]),
      south: hand(["Q", "J", "9"], ["K", "7", "2"], ["A", "K", "9", "4"], ["7", "6", "4"]),
    },
    commentary:
      "Est conosce dalla licita la situazione delle quadri: Nord (che invita, con il 3♦) ha al massimo 2 carte, e se la prosecuzione sarà K♦ e quadri taglierà. Può far qualcosa per dissuadere Sud? Si, può rispondere con il J sulla prima presa. Sud dovrebbe accorgersi del trucco perché se il J fosse davvero secco Nord avrebbe rifiutato con il 6. Ma se si ferma alla prima impressione, cambierà colore per non farsi tagliare il K (affrancando per di più la Q del morto). Questo buon contratto è destinato a cadere, se la difesa fa il suo dovere. SE SIETE CERTI CHE STATE PER PRENDERE UN TAGLIO, CERCATE DI CREARE UN'ILLUSIONE…",
    bidding: { dealer: "east", bids: ["P", "1♦", "1NT", "P", "4♥", "P", "P", "P"] },
  },

  {
    id: "Q9-3",
    lesson: 9,
    board: 3,
    title: "Ricevere l'attacco",
    contract: "4♠",
    declarer: "north",
    openingLead: c("heart", "2"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "Q", "J", "6", "5"], ["A", "6"], ["K", "J", "9", "7"], ["J", "6"]),
      east: hand(["K", "7"], ["10", "3", "2"], ["10", "8", "4", "2"], ["9", "7", "4", "2"]),
      west: hand(["8", "4"], ["K", "Q", "7", "5", "4"], ["A", "3"], ["K", "10", "8", "3"]),
      south: hand(["10", "9", "3", "2"], ["J", "9", "8"], ["Q", "6", "5"], ["A", "Q", "5"]),
    },
    commentary:
      "Quando scopre di avere fit Nord mette in pista un tentativo, chiedendo a Sud di… guardarsi le quadri; Sud ha i requisiti per accettare l'invito. L'attacco di Est deve essere ♥, e deve essere in Conto: da 3 carte, senza sequenze, la più piccola. Sull'8 del morto (il J sarebbe un inutile fanticidio) Ovest è costretto a impegnare la Q e Nord vince la presa. Che Ovest non abbia il 10♥ è evidente: con KQ10xx, o K10xxx, o Q10xxx, avrebbe giocato il 10 e non l'onore. Quindi, le cuori daranno una seconda presa, ed è opportuno rigiocare ♥ subito (il 6 per il 9); comunque vada l'impasse a ♠ Nord si eviterà di dover fare l'impasse a ♣, destinato probabilmente ad andare male. L'AVVERSARIO NON DISINTEGRA I PROPRI ONORI SE PUÒ EVITARLO.",
    bidding: { dealer: "south", bids: ["P", "1♥", "1♠", "P", "2♠", "P", "3♦", "P", "4♠", "P", "P", "P"] },
  },

  {
    id: "Q9-4",
    lesson: 9,
    board: 4,
    title: "Ricevere l'attacco",
    contract: "3NT",
    declarer: "west",
    openingLead: c("heart", "5"),
    vulnerability: "both",
    hands: {
      north: hand(["9", "7"], ["A", "J", "7", "6", "5"], ["Q", "6", "4"], ["J", "8", "6"]),
      east: hand(["5", "4"], ["Q", "3"], ["J", "10", "9", "8", "7"], ["Q", "5", "4", "3"]),
      west: hand(["K", "Q", "6", "2"], ["K", "10", "2"], ["A", "K"], ["A", "K", "10", "2"]),
      south: hand(["A", "J", "10", "8", "3"], ["9", "8", "4"], ["5", "3", "2"], ["9", "7"]),
    },
    commentary:
      "Se non avesse il 10, Ovest sull'attacco dovrebbe giocare la Q seconda del morto, ma il 10 cambia tutto e, giocando piccola, Ovest ha certezza di fare 2 prese nel colore. Il morto porta una lunga di quadri da sfruttare ma, se la Q♦ non cade sotto AK, serviranno 2 ingressi: uno per affrancarle cedendo la Q, e uno per andare a incassare. Le Fiori ne offrono appunto due, se divise 3-2 e manovrate con cura. Dopo AK♦ Ovest gioca AK♣, se tutti rispondono prosegue con il DIECI superato dalla Q; pagata la Q♦ e vinto qualsiasi ritorno potrà raggiungere il morto con il 2♣ superato dal 5. QUANDO SI RICEVE L'ATTACCO IN UN SEME IN CUI SI HANNO K E Q, DIVISI, LA PRESENZA DEL 10 (IN MANO) GARANTISCE 2 PRESE A CONDIZIONE DI STARE BASSI AL MORTO.",
    bidding: { dealer: "west", bids: ["2NT", "P", "3NT", "P", "P", "P"] },
  },

  {
    id: "Q9-5",
    lesson: 9,
    board: 5,
    title: "Ricevere l'attacco",
    contract: "6♥",
    declarer: "north",
    openingLead: c("club", "Q"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "K", "6"], ["K", "Q", "J", "8", "4", "3"], ["A", "K", "7"], ["7"]),
      east: hand(["10", "3"], ["9", "6"], ["J", "9", "8", "4"], ["Q", "J", "10", "8", "2"]),
      west: hand(["9", "8", "7", "5", "2"], ["5", "2"], ["Q", "10", "5"], ["A", "9", "3"]),
      south: hand(["Q", "J", "4"], ["A", "10", "7"], ["6", "3", "2"], ["K", "6", "5", "4"]),
    },
    commentary:
      "Nord, con 9 vincenti, apre a livello 2 e Sud appoggia a 3♥ mostrando fit e buone carte per un eventuale slam. Appurata la mancanza di un asso, Nord si accontenta di 6♥. L'attacco è scontato, e Nord conta: 6♥,3♠, 2♦ sono 11 prese, e non ci sono né tagli utili da fare né affrancabili. Morale: la 12^ presa può essere data solo dal K♣, che quindi va salvato e non sacrificato inutilmente sull'attacco! Nord lascia la presa alla Q♣, taglia la continuazione, torna al morto e taglia un'altra fiori, trovando esattamente la situazione che sperava: l'Asso terzo in Ovest. Batte atout e incassa. EVITATE DI GIOCARE ONORI LUNGHI DEL MORTO DESTINATI A NON VINCERE LA PRESA.",
    bidding: { dealer: "north", bids: ["2♥", "P", "3♥", "P", "4NT", "P", "5♦", "P", "6♥", "P", "P", "P"] },
  },

  {
    id: "Q9-6",
    lesson: 9,
    board: 6,
    title: "Ricevere l'attacco",
    contract: "3NT",
    declarer: "south",
    openingLead: c("diamond", "3"),
    vulnerability: "ew",
    hands: {
      north: hand(["10", "6"], ["A", "Q", "10", "9", "4"], ["J", "8"], ["A", "7", "5", "2"]),
      east: hand(["8", "4", "3", "2"], ["K", "6", "5", "2"], ["K", "5", "4"], ["9", "8"]),
      west: hand(["A", "J", "9"], ["8", "3"], ["Q", "9", "7", "6", "3"], ["10", "6", "4"]),
      south: hand(["K", "Q", "7", "5"], ["J", "7"], ["A", "10", "2"], ["K", "Q", "J", "3"]),
    },
    commentary:
      "Nord passa dalla via Stayman per poi mostrare in modo forzante la sua quinta di cuori; ma Sud ha solo due carte e deve riportare a 3NT. Un ottimo contratto, che può essere battuto solo da… Sud! La prima presa è fondamentale: se Sud gioca il J non ci sarà pietà. Nemmeno se rifiuta la presa due volte. Se gioca l'8 invece, si garantisce di fare 2 prese nel colore e quindi di potersi permettere l'impasse a cuori, comunque vada: 4♥, 2♦ e 4♣ (attenzione: le fiori sono il collegamento con il morto e non vanno incassate per prime: l'impasse a cuori (J per il 4) ha la precedenza. NON GIOCATE UN ONORE DEL MORTO SENZA GUARDARE LA FIGURA CHE AVETE IN MANO. MOLTI CONTRATTI SI PERDONO ALLA PRIMA PRESA!",
    bidding: { dealer: "east", bids: ["P", "1NT", "P", "2♣", "P", "2♠", "P", "3♥", "P", "3NT", "P", "P", "P"] },
  },

  {
    id: "Q9-7",
    lesson: 9,
    board: 7,
    title: "Ricevere l'attacco",
    contract: "4♠",
    declarer: "west",
    openingLead: c("club", "2"),
    vulnerability: "both",
    hands: {
      north: hand(["9", "8", "2"], ["A", "7", "3", "2"], ["A", "J", "7", "4", "3"], ["2"]),
      east: hand(["K", "J", "6", "3"], ["6", "4"], ["Q", "6", "5"], ["K", "10", "8", "3"]),
      west: hand(["A", "Q", "7", "5", "4"], ["K", "Q", "J", "5"], ["10"], ["Q", "J", "4"]),
      south: hand(["10"], ["10", "9", "8"], ["K", "9", "8", "2"], ["A", "9", "7", "6", "5"]),
    },
    commentary:
      "Est ha fit quarto e 9 punti, rivalutati valgono 11 e appoggia a livello 3; Ovest ha abbastanza per rialzare. E' una buona manche che può essere battuta solo se Nord trova l'attacco mortale, nel singolo. Ovest deve drizzare le antenne, perché l'attacco è molto sospetto: Nord non ha onori che giustifichino l'attacco di piccola, e l'A♣ è di certo in Sud: quindi un taglio è in agguato. E' bene che si prepari a dare, di mano, una carta che sia verosimile per far pensare a Sud che il compagno ha attaccato da 3 carte. È più verosimile un attacco da Qxx o da Jxx? Da Qxx, quindi dia il J di mano. QUANDO INTENDETE DARE UNA CARTA FALSA, PENSATECI PRIMA E POI RISPONDETE VELOCEMENTE E CON DISINVOLTURA.",
    bidding: { dealer: "south", bids: ["P", "1♠", "P", "3♠", "P", "4♠", "P", "P", "P"] },
  },

  {
    id: "Q9-8",
    lesson: 9,
    board: 8,
    title: "Ricevere l'attacco",
    contract: "3NT",
    declarer: "east",
    openingLead: c("spade", "9"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "J", "8", "7", "4"], ["Q", "J", "5"], ["Q", "J", "9"], ["7", "5"]),
      east: hand(["K", "5", "3"], ["K", "9", "7"], ["K", "7", "5", "3"], ["Q", "10", "3"]),
      west: hand(["Q", "10", "6"], ["A", "8", "2"], ["A", "10"], ["K", "J", "9", "8", "2"]),
      south: hand(["9", "2"], ["10", "6", "4", "3"], ["8", "6", "4", "2"], ["A", "6", "4"]),
    },
    commentary:
      "Gli 11 bilanciati di Est sono un esempio \"da manuale\" per la proposta di 2NT; Ovest ha 14 e non ha dubbi a rialzare a manche. Neanche Sud deve avere dubbi per l'attacco. Nessuna carta va presa in considerazione se non il 9♠. Est conosce perfettamente la situazione delle picche: il 9 è singolo o la più alta di un doubleton. Se sta basso al morto Nord farà altrettanto (invitando con il 7) e quando Sud entrerà con l'A♣ farà strage di Q10 del morto. La carta giusta da mettere è la DAMA! Nord dovrà prendere (altrimenti Est farà poi presa anche con il K) e cambiare colore, per non regalare la presa di 10 al morto. Est manterrà il contratto anche se l'A♣ fosse in Sud, perché guadagnerà o un tempo, o una presa. SE LA DICHIARAZIONE E L'ATTACCO FOTOGRAFANO LA FIGURA DI UN COLORE, SAPPIATE APPROFITTARNE!",
    bidding: { dealer: "west", bids: ["1♣", "1♠", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 10: Contro e surlicita
  // ==========================================================================

  {
    id: "Q10-1",
    lesson: 10,
    board: 1,
    title: "Contro e surlicita",
    contract: "5♦",
    declarer: "west",
    openingLead: c("spade", "2"),
    vulnerability: "none",
    hands: {
      north: hand(["10", "7", "2"], ["K", "10", "2"], ["7", "6", "5"], ["10", "6", "5", "2"]),
      east: hand(["Q", "3"], ["Q", "7", "5", "3"], ["K", "4", "2"], ["A", "Q", "7", "4"]),
      west: hand(["9", "8", "4"], ["A", "8"], ["A", "Q", "J", "10", "9", "3"], ["K", "8"]),
      south: hand(["A", "K", "J", "6", "5"], ["J", "9", "6", "4"], ["8"], ["J", "9", "3"]),
    },
    commentary:
      "Il 2♦, forzante fino a 3♦, autorizza Est a continuare la descrizione (Est si comporta come sul Contro: 2♦ non è Rever!). L'obiettivo di Ovest è 3NT, e quando surlicita con 2♠ chiede altra descrizione senza nulla promettere; Est non è in grado di dire 2NT e ripiega sul fit a quadri, al che Ovest, sfumato il 3NT, rialza a manche nel minore. Il Gioco. L'attacco è in Conto, Sud incassa 2 prese poi per il suo meglio gioca cuori. Ovest non ha problemi: prende, taglia la terza picche, batte atout e incassa le fiori. LA SURLICITA, QUANDO I COLORI SONO GIÀ STATI DESCRITTI E IL CONTRO NON È DISPONIBILE, SUGGERISCE DI DICHIARARE I SENZA SE IN POSSESSO DI FERMO NEL COLORE AVVERSARIO",
    bidding: { dealer: "north", bids: ["P", "1♣", "1♠", "2♦", "P", "2♠", "P", "3♦", "P", "5♦", "P", "P", "P"] },
  },

  {
    id: "Q10-2",
    lesson: 10,
    board: 2,
    title: "Contro e surlicita",
    contract: "3NT",
    declarer: "east",
    openingLead: c("spade", "A"),
    vulnerability: "ns",
    hands: {
      north: hand(["10", "2"], ["J", "9", "8", "6", "2"], ["J", "8", "3", "2"], ["10", "6"]),
      east: hand(["Q", "J", "6"], ["K", "10", "7", "3"], ["10", "7"], ["A", "Q", "J", "2"]),
      west: hand(["8", "7", "5"], ["A", "Q", "5"], ["K", "Q", "6", "5"], ["K", "4", "3"]),
      south: hand(["A", "K", "9", "4", "3"], ["4"], ["A", "9", "4"], ["9", "8", "7", "5"]),
    },
    commentary:
      "L'obiettivo di Ovest è 3NT, ma non ferma a picche. La forza onori gli consente di usare il Contro anche se non ha i requisiti perfetti di distribuzione, e quando gli arriva il 2♥ usa la surlicita per indurre Est a dire i Senza, se gli è possibile. Nel momento in cui surlicita il Contro non era disponibile, quindi Est non deve dare affatto per scontato che si giocherà a cuori: quando sente il rialzo a 3NT sa che quello era l'obiettivo del compagno. Il Gioco. Est dopo l'attacco sa che dovrà fare 9 prese filate, rinunciando alle ♦; l'incasso di AQ♥ rivela un facile modo per ottenere 4 prese dal colore. LA SURLICITA NON GARANTISCE FIT TROVATO, SE IL CONTRO NON È DISPONIBILE.",
    bidding: { dealer: "east", bids: ["1♣", "1♠", "Dbl", "P", "2♥", "P", "2♠", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  {
    id: "Q10-3",
    lesson: 10,
    board: 3,
    title: "Contro e surlicita",
    contract: "3♣",
    declarer: "west",
    openingLead: c("heart", "A"),
    vulnerability: "ew",
    hands: {
      north: hand(["J", "8", "7", "4"], ["A", "7", "6"], ["J", "10", "7", "6"], ["J", "3"]),
      east: hand(["K", "9"], ["9", "3", "2"], ["K", "5", "3", "2"], ["K", "9", "8", "2"]),
      west: hand(["A", "6", "5", "3"], ["10", "8"], ["A", "9", "4"], ["A", "10", "7", "6"]),
      south: hand(["Q", "10", "2"], ["K", "Q", "J", "5", "4"], ["Q", "8"], ["Q", "5", "4"]),
    },
    commentary:
      "Est ha forza sufficiente per competere, ma nessuna buona dichiarazione a disposizione, se non il Contro. Se avesse 4+♠ le dichiarerebbe, quindi Ovest deve ignorarle e mostrare l'unico altro suo colore, certo al 99% di trovare fit. Poiché non si attacca sotto asso nemmeno se si tratta di un colore mostrato e fittato, Nord attacca A♥, e Sud chiede continuazione con il 5. Il Gioco. Tagliato il terzo giro di cuori Ovest incassa AK♣ lasciando all'avversario l'atout legittima, poi apre i tagli a picche. Sud potrà surtagliare, ma la difesa non potrà incassare altro se non 2♥, 1♠, 1♦. USATE CON SERENITÀ IL CONTRO IN COMPETIZIONE: SU UN AVVERSARIO CHE SI È APPOGGIATO A LIVELLO 2, IL CONTRO NON È MAI PUNITIVO.",
    bidding: { dealer: "south", bids: ["1♥", "Dbl", "2♥", "Dbl", "P", "3♣", "P", "P", "P"] },
  },

  {
    id: "Q10-4",
    lesson: 10,
    board: 4,
    title: "Contro e surlicita",
    contract: "3NT",
    declarer: "south",
    openingLead: c("diamond", "K"),
    vulnerability: "both",
    hands: {
      north: hand(["A", "Q", "J", "9"], ["K", "7", "5", "2"], ["J", "4"], ["K", "10", "6"]),
      east: hand(["7", "5", "4"], ["Q", "10", "9", "4"], ["9", "8", "3"], ["7", "5", "4"]),
      west: hand(["K", "10", "8"], ["A", "6", "3"], ["K", "Q", "10", "7", "5"], ["8", "3"]),
      south: hand(["6", "3", "2"], ["J", "8"], ["A", "6", "2"], ["A", "Q", "J", "9", "2"]),
    },
    commentary:
      "Sul Contro, Sud, che ha troppo per dichiarare le fiori, surlicita per mostrarle dopo; Nord descrive la più bassa delle sue quarte e poi, sfumata ogni possibilità di fit nobile (3♣ esclude le ♠), surlicita a sua volta per chiedere il fermo. Il Gioco. Vinto l'attacco Sud considera di arrivare facilmente a 9 prese grazie all'impasse di ♠, che avrà successo quasi al 100%. Meglio farlo subito: se si affretta a incassare le fiori poi non potrà più rientrare in mano per farlo una seconda volta, indispensabile per ottenere 9 prese. Grazie alla divisione 3-3, farà 3NT + 1. SUL CONTRO INFORMATIVO DEL COMPAGNO, TUTTE LE MANI DI 11+ PUNTI PASSANO DALLA SURLICITA E RIMANDANO A DOPO LA DESCRIZIONE DEI COLORI.",
    bidding: { dealer: "west", bids: ["1♦", "Dbl", "P", "2♥", "P", "3♣", "P", "3♦", "P", "3NT", "P", "P", "P"] },
  },

  {
    id: "Q10-5",
    lesson: 10,
    board: 5,
    title: "Contro e surlicita",
    contract: "4♥",
    declarer: "east",
    openingLead: c("club", "Q"),
    vulnerability: "ns",
    hands: {
      north: hand(["J", "10", "2"], ["J", "10", "7", "3"], ["9", "7", "2"], ["8", "5", "4"]),
      east: hand(["K", "7", "4"], ["A", "Q", "9", "4", "2"], ["8", "6", "3"], ["A", "7"]),
      west: hand(["8", "5"], ["K", "8", "6", "5"], ["A", "Q", "J", "10"], ["K", "9", "6"]),
      south: hand(["A", "Q", "9", "6", "3"], [], ["K", "5", "4"], ["Q", "J", "10", "3", "2"]),
    },
    commentary:
      "Senza intervento Ovest avrebbe fatto precedere il salto a manche da un cambio di colore (anche fittizio: 2♣). Ma dopo un intervento il suo 2♣, o 2♦, mostrerebbe un colore reale, quinto o più! Con la surlicita in pratica comunica la stessa idea: fit sufficiente e forza almeno di manche. Poiché nessuno dei due ha forza extra, 4♥ rimane il contratto finale. Con almeno 3♦, 2♣ e probabilmente 5♥ il contratto è in salvo, ma le cuori vanno maneggiate con attenzione! Se sono 4-0 (4 in Nord) per non perdere prese si deve giocare per primo l'onore singolo (K). Con AQ9 si cattureranno J e 10. SE IL CONTRO È UN'ALTERNATIVA DISPONIBILE, LA SURLICITA PROMETTE FIT",
    bidding: { dealer: "north", bids: ["P", "1♥", "1♠", "2♠", "P", "4♥", "P", "P", "P"] },
  },

  {
    id: "Q10-6",
    lesson: 10,
    board: 6,
    title: "Contro e surlicita",
    contract: "2♠",
    declarer: "north",
    openingLead: c("diamond", "A"),
    vulnerability: "ew",
    hands: {
      north: hand(["K", "10", "7", "6"], ["10", "4", "3"], ["9", "8", "2"], ["8", "7", "4"]),
      east: hand(["8", "5"], ["A"], ["A", "K", "10", "7", "4"], ["K", "J", "10", "6", "3"]),
      west: hand(["J", "9", "2"], ["J", "9", "7", "6", "5"], ["Q", "J"], ["9", "5", "2"]),
      south: hand(["A", "Q", "4", "3"], ["K", "Q", "8", "2"], ["6", "5", "3"], ["A", "Q"]),
    },
    commentary:
      "Quando Nord, obbligato, dichiara 1♠ può avere da zero a 9/10 punti; Sud mostra mano forte e fit quando al secondo giro surlicita, ma poi deve fidarsi della reticenza di Nord, che riporta nel colore fittato al minimo livello, e passare. Il Controgioco. Sull'attacco Ovest deve dare la Q♦, carta con cui promette di poter vincere la seconda presa (o Q secca, o QJ). Se Est si fida, incassa l'A♥ e prosegue con piccola quadri; se Ovest è sveglio, gli dà il primo taglio a cuori; se Est gioca un terzo giro di quadri Ovest lo taglia (anche se vincente) per dare a Est un secondo taglio a cuori: 1 down. E' PIÙ CONVENIENTE \"CHIEDERE AL COMPAGNO QUALE SIA IL SUO CAMPO DI FORZA\" USANDO UNA SURLICITA ANZICHÉ \"MOSTRARE LA PROPRIA\" CON SALTI INCONSULTI.",
    bidding: { dealer: "east", bids: ["1♦", "Dbl", "P", "1♠", "2♣", "2♦", "P", "2♠", "P", "P", "P"] },
  },

  {
    id: "Q10-7",
    lesson: 10,
    board: 7,
    title: "Contro e surlicita",
    contract: "4♠",
    declarer: "south",
    openingLead: c("diamond", "A"),
    vulnerability: "both",
    hands: {
      north: hand(["A", "K", "5", "2"], ["A", "K", "6", "3"], ["Q", "4"], ["K", "7", "3"]),
      east: hand(["J", "10", "6"], ["J", "10", "8", "5", "4"], ["5", "2"], ["Q", "6", "2"]),
      west: hand(["9"], ["Q", "9", "2"], ["A", "K", "10", "9", "8", "7"], ["J", "10", "4"]),
      south: hand(["Q", "8", "7", "4", "3"], ["7"], ["J", "6", "3"], ["A", "9", "8", "5"]),
    },
    commentary:
      "Nord, con 3♦, mostra una mano di Rever con il fit 4° a Picche. Sud non è in grado di sapere se si tratti di una bilanciata forte o di una sbilanciata con le ♣ lunghe, ma in ogni caso ha buone carte per accettare l'invito. Ovest attacca con l'A♦ e, visto il 5 di Est segue con il K♦ ancora Quadri. Sud conta 9 prese: 5♠ (se tutto va bene), 2♥ e 2♣. Sarebbe ottimistico pensare che la 10^ possa essere il taglio al morto del terzo giro di ♣: se taglia di piccola Est surtaglierà. La soluzione migliore è scartare una ♣ di Nord; Est taglierà, ma questa sarà l'ultima presa della difesa. Sud vincerà qualunque ritorno, batterà due giri di atout, e taglierà una Fiori al morto (decima presa). LA SURLICITA DELL'APERTORE, DOPO INTERVENTO DEL QUARTO, È LA PIÙ FORTE DELLE POSSIBILI DICHIARAZIONI CHE COMUNICANO FIT.",
    bidding: { dealer: "south", bids: ["P", "P", "1♣", "P", "1♠", "2♦", "3♦", "P", "4♠", "P", "P", "P"] },
  },

  {
    id: "Q10-8",
    lesson: 10,
    board: 8,
    title: "Contro e surlicita",
    contract: "4♠",
    declarer: "north",
    openingLead: c("heart", "J"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "J", "9", "6"], ["6", "3"], ["K", "Q", "J", "8"], ["K", "Q", "9"]),
      east: hand(["8", "4"], ["J", "10", "2"], ["6", "4", "3", "2"], ["10", "8", "6", "2"]),
      west: hand(["Q", "7", "2"], ["K", "Q", "9", "8", "4"], ["A", "9", "7"], ["J", "7"]),
      south: hand(["K", "10", "5", "3"], ["A", "7", "5"], ["10", "5"], ["A", "5", "4", "3"]),
    },
    commentary:
      "Sud sul Contro fa tutto il suo dovere: surlicita (perché ha 11) e poi rialza a 3♠, non forzante, per mostrare il minimo di quanto già promesso. Nord ha in abbondanza per dichiarare manche; se avesse avuto 12 sarebbe passato su 3♠. Nord, vinto l'attacco, si rende conto che Est ha già fatto vedere tutto quello che ha: mancano 12 punti e sono tutti in Ovest, Q♠ compresa. Esegue quindi l'impasse a occhi chiusi, poi – eliminate le atout – prova a vedere se le fiori sono divise. Ma Est tiene (sempre che non abbia scartato fiori sul terzo giro di atout), quindi si rassegna a pagare l'Asso di ♦ e la cuori: 4♠ +1. SUL CONTRO INFORMATIVO LA SURLICITA PROMETTE 11+ ED È FORZANTE \"FINO A 3 IN UN COLORE FITTATO\".",
    bidding: { dealer: "west", bids: ["1♥", "Dbl", "P", "2♠", "P", "3♠", "P", "4♠", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 11: Controgioco: ragionare e dedurre
  // ==========================================================================

  {
    id: "Q11-1",
    lesson: 11,
    board: 1,
    title: "Controgioco: ragionare e dedurre",
    contract: "4♠",
    declarer: "north",
    openingLead: c("club", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["10", "9", "8", "6", "5"], ["Q", "9", "2"], ["Q", "10", "3"], ["9", "7"]),
      east: hand(["K", "4"], ["K", "7"], ["K", "J", "6", "2"], ["Q", "J", "10", "8", "2"]),
      west: hand(["7", "2"], ["8", "5", "4", "3"], ["A", "9", "5"], ["6", "5", "4", "3"]),
      south: hand(["A", "Q", "J", "3"], ["A", "J", "10", "6"], ["8", "7", "4"], ["A", "K"]),
    },
    commentary:
      "Quando dice 1♠ Nord può avere 0/10 e 4 carte. Quando sulla surlicita \"torna\" sulle ♠ ha sempre 4+ carte, e circa 0/6. Sud spinge ancora: 3♠ dice \"se sei vicino a zero passa, ma se hai 5-6 rialza!\" e Nord dovrebbe farlo, anche per via della 5^ carta di atout. Il Gioco. Asso e dama di ♣ sono il miglior inizio, per Nord: il 10 è il suo unico ingresso per fare poi l'impasse a cuori. Se Est…continua pigramente a fiori, Nord manterrà l'impegno: picche al 10, impasse a cuori e 10 prese. Ma Est si deve rendere conto che Nord non avrebbe mai mosso le atout in questo modo, se avesse l'A♦! Quindi non fiori, ma piccola quadri per incassare velocemente 3 prese e battere il contratto. ATTRIBUITE ALL'AVVERSARIO GIOCATE LOGICHE.",
    bidding: { dealer: "north", bids: ["P", "1♣", "P", "1♠", "P", "Dbl", "P", "2♠", "P", "2♣", "P", "3♠", "P", "4♠", "P", "P", "P"] },
  },

  {
    id: "Q11-2",
    lesson: 11,
    board: 2,
    title: "Controgioco: ragionare e dedurre",
    contract: "4♥",
    declarer: "east",
    openingLead: c("diamond", "J"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "Q", "4", "2"], ["10", "9"], ["8", "3", "2"], ["Q", "8", "6", "2"]),
      east: hand(["J", "10", "9", "6", "5"], ["A", "Q", "8", "3"], ["A", "K", "5"], ["9"]),
      west: hand(["K", "8"], ["7", "6", "5", "4", "2"], ["Q", "7", "4"], ["A", "J", "4"]),
      south: hand(["7", "3"], ["K", "J"], ["J", "10", "9", "6"], ["K", "10", "7", "5", "3"]),
    },
    commentary:
      "Sud segue il proverbio: \"un attacco da sequenza tien tranquilla la coscienza\". Il Gioco. Se Est è uno che pensa già alla prima carta, prenderà al morto, per anticipare l'impasse a cuori. Da questa prima mossa Sud deduce con certezza che l'Asso e il K di quadri sono entrambi in Est, oltre al 5♦ con cui ha risposto. Quindi Est ha 5♠, 4♥, 3♦ e una o zero fiori. In presa con il K♥ (la manovra suggerisce AQ in Est, quindi già 13 punti sono contati) sa che giocare ♣ o ♦ è inutile, mentre il 7♠ potrebbe battere il contratto: se Nord ha AQ, e se indovinerà a giocare ancora ♠, il J♥ di Sud, diversamente destinato a cadere, si \"promuoverà\" e batterà il contratto. LA PRIMA PRESA CONTIENE INDIZI INCREDIBILI PER I DIFENSORI.",
    bidding: { dealer: "east", bids: ["1♠", "P", "1NT", "P", "4♥", "P", "P", "P"] },
  },

  {
    id: "Q11-3",
    lesson: 11,
    board: 3,
    title: "Controgioco: ragionare e dedurre",
    contract: "3NT",
    declarer: "south",
    openingLead: c("spade", "2"),
    vulnerability: "ew",
    hands: {
      north: hand(["9", "7", "5"], ["J", "7", "6", "4", "2"], ["Q", "10", "2"], ["A", "Q"]),
      east: hand(["J", "8"], ["Q", "9", "8", "3"], ["9", "8", "7"], ["10", "5", "4", "3"]),
      west: hand(["Q", "6", "4", "3", "2"], ["A", "10", "5"], ["K", "6", "3"], ["7", "2"]),
      south: hand(["A", "K", "10"], ["K"], ["A", "J", "5", "4"], ["K", "J", "9", "8", "6"]),
    },
    commentary:
      "Nord, dato il Rever, ha forza di manche e indaga con il 4° colore, poi rialza nell'unica manche possibile. Il Gioco. Sull'attacco Est impegna il J e Sud vince con l'asso o il Re, poco importa perché Ovest sa che li ha entrambi. E sa che ha anche il 10, carta negata da Est (che con J10 avrebbe giocato il 10). Quindi sa dalla licita che Sud ha 5♣ e 4♦, e dalla prima presa sa che ha 3 picche di AK10. Rimane posto per una cuori sola. Quando entra in presa con il K♦ (per rubare questo 3NT Sud deve affrontare l'impasse a ♦ prima di incassare le fiori…) la sola carta che va messa in tavola è… l'Asso di Cuori. E visto cadere il K, la continuazione con il 10♥ batterà il contratto. SE SI APPLICANO CON DISCIPLINA FERREA GLI ACCORDI DI CONTROGIOCO, DALLE CARTE GIOCATE SI POTRANNO A VOLTE RICAVARE DEDUZIONI FONDAMENTALI.",
    bidding: { dealer: "south", bids: ["1♣", "P", "1♥", "P", "2♦", "P", "2♠", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  {
    id: "Q11-4",
    lesson: 11,
    board: 4,
    title: "Controgioco: ragionare e dedurre",
    contract: "4♥",
    declarer: "east",
    openingLead: c("spade", "J"),
    vulnerability: "both",
    hands: {
      north: hand(["A", "10", "7", "2"], ["8", "5"], ["J", "10", "5", "3"], ["Q", "5", "4"]),
      east: hand(["K", "6", "5"], ["A", "Q", "J", "7", "3", "2"], ["Q", "8"], ["8", "6"]),
      west: hand(["Q", "9", "8", "3"], ["10", "9"], ["K", "9"], ["A", "K", "J", "9", "7"]),
      south: hand(["J", "4"], ["K", "6", "4"], ["A", "7", "6", "4", "2"], ["10", "3", "2"]),
    },
    commentary:
      "Est \"mette le mani avanti\" per garantirsi che il compagno non passi prima di manche (4° colore), quindi su 2NT ribadisce ancora le cuori, mostrando la sesta (3♥ a questo punto non è più passabile, chiede una scelta tra 3NT e 4♥). Il Gioco. Sud non ha attacco migliore: quadri no (c'è l'asso), atout no (c'è K10x), fiori imbarazzante. L'attacco mortale è J♠; Nord sa che il J è \"corto\" (ha il 10), ma non può essere singolo altrimenti Est avrebbe 4 carte e avrebbe appoggiato le picche! Se Nord semplicemente \"gradisce\" con il 7, Sud rigiocherà ♠ quando prenderà a ♥ e il contratto cadrà di una presa. QUANTO FATE UN'IPOTESI SULLA DIVISIONE DI UN COLORE, COMPLETATELA SEMPRE ALLE 4 MANI E CHIEDETEVI SE È VEROSIMILE.",
    bidding: { dealer: "west", bids: ["1♣", "P", "1♥", "P", "2♦", "P", "1♠", "P", "2NT", "P", "3♥", "P", "4♥", "P", "P", "P"] },
  },

  {
    id: "Q11-5",
    lesson: 11,
    board: 5,
    title: "Controgioco: ragionare e dedurre",
    contract: "7♠",
    declarer: "north",
    openingLead: c("heart", "2"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "Q", "J", "10", "8", "6"], ["A", "K"], ["A", "K"], ["K", "9", "4"]),
      east: hand([], ["Q", "10", "7", "6", "4", "2"], ["10", "3", "2"], ["10", "8", "6", "2"]),
      west: hand(["9", "7", "4", "3"], ["J", "9", "3"], ["Q", "J", "7", "5"], ["Q", "J"]),
      south: hand(["K", "5", "2"], ["8", "5"], ["9", "8", "6", "4"], ["A", "7", "5", "3"]),
    },
    commentary:
      "Un asso e il Re di atout sono carte troppo importanti per dire \"solo\" 4♠; Sud deve appoggiare a 3♠, per mostrare fit e qualche velleità di Slam. Dopo la richiesta d'assi Nord conta 12 prese certe, e può sperare che la 13^ salti fuori da qualche parte. Alla vista del morto, della 13^ presa non c'è neanche l'ombra. La sola speranza, quando ci si trova in questa situazione, è incassare tutte le atout e sperare che la difesa sbagli a scartare (potrebbe venir buona la quarta fiori!). Est è nelle grane già dopo 4 giri, ma di una cosa è certo: se Nord, che ha ovviamente AK♥, batte tutte le atout… è perché non ha cuori da tagliare! Est quindi può scartare tutto, ma non due cartine di fiori! SE VEDETE CHE IL GIOCANTE, PUR POTENDOLO FARE, NON APPROFITTA DELLE ATOUT DEL MORTO PER TAGLIARE, È PERCHÉ NON HA NESSUN TAGLIO UTILE DA FARE!",
    bidding: { dealer: "north", bids: ["2♠", "P", "3♠", "P", "4NT", "P", "5♥", "P", "7♠", "P", "P", "P"] },
  },

  {
    id: "Q11-6",
    lesson: 11,
    board: 6,
    title: "Controgioco: ragionare e dedurre",
    contract: "3NT",
    declarer: "south",
    openingLead: c("heart", "3"),
    vulnerability: "ew",
    hands: {
      north: hand(["K", "Q", "10", "5", "4"], ["10"], ["A", "Q", "7"], ["A", "7", "4", "3"]),
      east: hand(["A", "9", "6", "2"], ["K", "8", "2"], ["J", "10", "4", "2"], ["J", "9"]),
      west: hand(["8", "3"], ["A", "J", "7", "6", "3"], ["9", "8"], ["10", "8", "6", "2"]),
      south: hand(["J", "7"], ["Q", "9", "5", "4"], ["K", "6", "5", "3"], ["K", "Q", "5"]),
    },
    commentary:
      "Le carte di Sud sembrano fatte apposta per dire 2NT e Nord, se si rende conto che 3NT è verosimilmente la miglior manche da giocare, farebbe bene a rialzare senza raccontare troppo (e inutilmente) delle sue carte. Il Gioco. Un bilancino di precisione per la difesa: attacco 3♥, Est gioca il Re e ritorna nel colore. E' rimasto con 2 carte, quindi l'8, la più alta di due. Sud per il suo meglio inserisce il 9 e Ovest vince con il J. E si deve fermare!! Con K852 Est sarebbe tornato con il 2. Quindi la Q di cuori non cade, è ancora seconda; bisogna aspettare che Est vada in presa e rigiochi cuori. Se Ovest ha fretta di fare l'A♥, regala il contratto. QUANDO SI RIGIOCA IN UN COLORE GIÀ MOSSO IL \"CONTO\" È DI IMPORTANZA VITALE.",
    bidding: { dealer: "east", bids: ["P", "P", "P", "1♠", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  {
    id: "Q11-7",
    lesson: 11,
    board: 7,
    title: "Controgioco: ragionare e dedurre",
    contract: "4♠X",
    declarer: "west",
    openingLead: c("club", "Q"),
    vulnerability: "both",
    hands: {
      north: hand(["Q", "10"], ["K", "10", "8", "5", "4"], ["K", "6", "2"], ["Q", "J", "4"]),
      east: hand(["8"], ["A", "J", "6", "3", "2"], ["J", "9"], ["10", "8", "6", "3", "2"]),
      west: hand(["A", "K", "9", "7", "6", "5", "3", "2"], ["Q"], ["7", "5", "4", "3"], []),
      south: hand(["J", "4"], ["9", "7"], ["A", "Q", "10", "8"], ["A", "K", "9", "7", "5"]),
    },
    commentary:
      "Nota: l'apertura di Sud deve essere 1♣ fiori, nella 5^: solo con la 4-4 si anticipano le quadri. La bomba di Ovest è ragionevole: un'ottava di AK richiede il livello 4. Nord ha troppo per subire e contra, e attacca a fiori, non avendo di meglio. Il Gioco. Tagliato l'attacco (Nord memorizza: l'apertore ha 5 fiori) Ovest incassa AK di atout e presenta la Q di cuori. E veniamo a cosa sa Nord: il giocante ha 8 carte di picche ed è vuoto a fiori. Accanto alle picche ci sono QUATTRO carte di quadri (Sud ha aperto 1♣, può avere 4 quadri ma mai cinque) quindi la Q di cuori è secca!! E non va coperta!! Se Nord mette il Re regala il contratto (Ovest otterrà 2 prese dalle cuori). Se liscia, Ovest perderà poi 4 prese a quadri. LA \"FANTASIA\" UTILE DA METTERE NEL GIOCO È SOLO QUESTA: PENSARE ALLE CARTE CHE NON SI VEDONO.",
    bidding: { dealer: "south", bids: ["1♣", "4♠", "Dbl", "P", "P", "P"] },
  },

  {
    id: "Q11-8",
    lesson: 11,
    board: 8,
    title: "Controgioco: ragionare e dedurre",
    contract: "3NT",
    declarer: "west",
    openingLead: c("heart", "2"),
    vulnerability: "none",
    hands: {
      north: hand(["10", "8", "3"], ["A", "J", "9", "5", "2"], ["Q", "9", "3"], ["J", "10"]),
      east: hand(["J", "5"], ["7", "6"], ["J", "5", "2"], ["A", "K", "9", "7", "3", "2"]),
      west: hand(["A", "K", "7", "4"], ["K", "Q", "4"], ["A", "8", "6", "4"], ["8", "4"]),
      south: hand(["Q", "9", "6", "2"], ["10", "8", "3"], ["K", "10", "7"], ["Q", "6", "5"]),
    },
    commentary:
      "La velocità con cui un giocatore in Est dichiara 3NT su 1NT è direttamente proporzionale alla sua esperienza…. Un grande giocatore disse: \"se provate tenerezza per i minori chiamate Telefono Azzurro; a bridge, lasciateli perdere\". Il Gioco. L'attacco di piccola cuori è scritto nelle carte; Sud impegna il 10 e Ovest prende (non importa con cosa: Nord sa che ha entrambi gli onori). La sua unica speranza è un colpo in bianco a fiori, quindi gioca piccola e liscia il 10 di Nord. Cosa deve fare Sud? Visto che la sua dama è poi destinata a cadere deve essere pronto a superare il 10 con la Dama….e incrociare cuori: solo così batterà il contratto. SE IL VOSTRO COMPAGNO È IN PRESA, CHIEDETEVI SE È GIUSTO LASCIARCELO.",
    bidding: { dealer: "west", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 12: Interventi e riaperture
  // ==========================================================================

  {
    id: "Q12-1",
    lesson: 12,
    board: 1,
    title: "Interventi e riaperture",
    contract: "5♠",
    declarer: "north",
    openingLead: c("diamond", "K"),
    vulnerability: "none",
    hands: {
      north: hand(["A", "J", "9", "6", "5"], ["K", "Q", "J", "8", "4"], ["5"], ["K", "6"]),
      east: hand(["7"], ["6", "2"], ["K", "Q", "J", "4", "3"], ["A", "Q", "10", "9", "2"]),
      west: hand(["10", "8"], ["9", "7", "5", "3"], ["A", "10", "7", "6", "2"], ["J", "7"]),
      south: hand(["K", "Q", "4", "3", "2"], ["A", "10"], ["9", "8"], ["8", "5", "4", "3"]),
    },
    commentary:
      "L'intervento 2NT mostra una bicolore minore 5+/5+, con buoni colori. Il 5♦ di Ovest è quindi ragionevole: dal suo punto di vista 4♠ è un contratto che NS realizzerà. NS hanno a loro volta una decisione sofferta e uno dei due potrebbe dire 5♠. Se gioca Nord: l'attacco è K♦, su cui Ovest, sapendo che ne passa solo una, deve superare con l'Asso per giocare il J♣; unico controgioco che limita Nord a 10 prese (quindi batte il contratto di 5♠). Se gioca Ovest: dopo l'attacco K♥ la difesa si affretterà a incassare 2 cuori e 1 picche, per l'un down. DOPO APERTURA NOBILE L'INTERVENTO 2NT MOSTRA ENTRAMBI I COLORI MINORI, TASSATIVAMENTE ALMENO QUINTI.",
    bidding: { dealer: "north", bids: ["1♠", "2NT", "4♠", "5♦", "P", "P", "P"] },
  },

  {
    id: "Q12-2",
    lesson: 12,
    board: 2,
    title: "Interventi e riaperture",
    contract: "4♥",
    declarer: "south",
    openingLead: c("diamond", "J"),
    vulnerability: "ns",
    hands: {
      north: hand(["A", "J", "10", "5"], ["K", "10", "6", "3"], ["7", "6", "5"], ["A", "J"]),
      east: hand(["K", "Q", "8"], ["7", "4"], ["A", "K", "9", "8"], ["9", "6", "3", "2"]),
      west: hand(["9", "4", "2"], ["8"], ["J", "10", "4", "2"], ["10", "8", "7", "5", "4"]),
      south: hand(["7", "6", "3"], ["A", "Q", "J", "9", "5", "2"], ["Q", "3"], ["K", "Q"]),
    },
    commentary:
      "L'intervento a salto mostra 6+ carte con valori pari a un'apertura (11/14) e Nord ha una decisione facile. Il Gioco. L'attacco J♦ viene superato da Est, che non ha di meglio che incassare l'altro onore e proseguire a ♦ per il taglio di Sud. Battuti due giri di ♥ il Giocante ha solo un problema: non perdere due prese a picche. La figura di AJ10x si presta a fare l'impasse due volte e ha alte percentuali di riuscita, ma non questa volta: Est ha aperto, oltre ad AK♦ ha sicuramente KQ♠! C'è una soluzione al 100%: incassare le due prese a fiori, prima di giocare picche al 10. Il povero Est potrà solo scegliere di che morte morire: o rigioca ♠, o gioca in taglio e scarto, regalando comunque a Sud il contratto. UN INTERVENTO A COLORE FATTO SALTANDO UN LIVELLO MOSTRA 11-14 E 6 BUONE CARTE",
    bidding: { dealer: "east", bids: ["1♦", "2♥", "P", "4♥", "P", "P", "P"] },
  },

  {
    id: "Q12-3",
    lesson: 12,
    board: 3,
    title: "Interventi e riaperture",
    contract: "3NT",
    declarer: "north",
    openingLead: c("diamond", "3"),
    vulnerability: "ew",
    hands: {
      north: hand(["A", "J", "10", "4"], ["K", "8", "3"], ["A", "K"], ["K", "Q", "7", "6"]),
      east: hand(["9", "8"], ["10", "9", "7", "4"], ["8", "7", "5", "4", "3"], ["9", "5"]),
      west: hand(["Q", "7", "3", "2"], ["A", "6"], ["Q", "10", "9", "2"], ["A", "8", "3"]),
      south: hand(["K", "6", "5"], ["Q", "J", "5", "2"], ["J", "6"], ["J", "10", "4", "2"]),
    },
    commentary:
      "Quando Nord \"rimuove\" per dire 1NT mostra una bilanciata \"troppo forte per l'intervento immediato di 1NT\": quindi circa 18-20. Sud fa due conti e rialza a 3NT. Il Gioco. Nord conosce perfettamente la posizione degli onori: mancano 12 punti e costituiscono l'apertura di Ovest. L'impasse a picche è una certezza e darà 4 prese oltre a 2♦, ma non si potranno affrancare sia le cuori sia le fiori (la difesa incasserebbe 3♦ e 2 assi). Dovendo scegliere, senza dubbio le fiori, che daranno 3 affrancate comunque sia diviso il colore (mentre le cuori daranno 3 prese solo se divise 3-3). QUANDO IL CONTRANTE \"RIMUOVE\" LA SCELTA CHE HA FATTO FARE AL PARTNER MOSTRA AUTOMATICAMENTE UNA MANO DI ALMENO (17)-18. NON SERVE… SALTARE!",
    bidding: { dealer: "south", bids: ["P", "1♦", "Dbl", "P", "1♥", "P", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  {
    id: "Q12-4",
    lesson: 12,
    board: 4,
    title: "Interventi e riaperture",
    contract: "2♥",
    declarer: "north",
    openingLead: c("diamond", "3"),
    vulnerability: "both",
    hands: {
      north: hand(["9", "8"], ["A", "K", "10", "7", "5"], ["K", "Q", "5"], ["A", "K", "J"]),
      east: hand(["A", "7", "3"], ["J", "9", "8", "2"], ["8", "6", "3"], ["9", "5", "2"]),
      west: hand(["K", "Q", "10", "6"], ["Q", "4"], ["A", "9", "7", "4"], ["Q", "8", "7"]),
      south: hand(["J", "5", "4", "2"], ["6", "3"], ["J", "10", "2"], ["10", "6", "4", "3"]),
    },
    commentary:
      "Nella situazione di \"Contro seguito da una rimozione a colore\" il compagno è legittimato a passare solo se non ha fit e se pensa di non portare neppure una presa. E' il caso di Sud… Est non ha motivo alcuno di attaccare diversamente dal colore di apertura, in Conto: quindi il 3♦. Il Gioco. Vista la mancanza assoluta di ingressi (ne serve almeno uno, per tentare l'impasse a fiori) il Giocante dovrebbe mettere il 10 del morto, se Ovest sta basso è già al morto per giocare ♣ al J. Se Ovest prende, Nord deve essere pronto a buttar via un onore. Nord troverà le atout mal divise, ma se riesce a fare l'impasse a fiori manterrà il contratto con 3 cuori, 3 fiori e 2 quadri. INDUSTRIARSI PER TROVARE INGRESSI IN UNA MANO POVERA È UNA DELLE COSE PIÙ STIMOLANTI DEL GIOCO….",
    bidding: { dealer: "west", bids: ["1♦", "Dbl", "P", "2♥", "P", "P", "P"] },
  },

  {
    id: "Q12-5",
    lesson: 12,
    board: 5,
    title: "Interventi e riaperture",
    contract: "3♣",
    declarer: "east",
    openingLead: c("spade", "K"),
    vulnerability: "ns",
    hands: {
      north: hand(["J", "9"], ["J", "9", "8", "7", "5"], ["K", "9", "3"], ["6", "5", "2"]),
      east: hand(["A", "5", "4", "3", "2"], ["K", "Q", "4", "3"], ["4"], ["10", "7", "3"]),
      west: hand(["10"], ["10", "2"], ["A", "J", "10", "5", "2"], ["K", "Q", "J", "9", "8"]),
      south: hand(["K", "Q", "8", "7", "6"], ["A", "6"], ["Q", "8", "7", "6"], ["A", "4"]),
    },
    commentary:
      "Est non deve avere tentazioni: il Passo su 2NT lascerebbe il compagno in grane davvero serie. Potrebbe essere anche più sfortunato e avere la 2-2, nei minori; una scelta tra fiori e quadri deve farla comunque. L'Attacco. La scelta di Sud è decisiva; anche se il K♠ vibra per saltare il tavola, la miglior scelta è Asso di ♣ e ♣, per togliere quanti più tagli possibile (Est andrà sotto di 1). Se l'attacco è K♠, Est aprirà immediatamente i tagli a ♥ e realizzerà 1♠, 1♥, 1♦, 3 tagli in mano e 4 atout del morto. QUANDO L'AVVERSARIO HA MOSTRATO UNA BICOLORE, E IL SUO COMPAGNO HA DATO UNA… STENTATA PREFERENZA, L'ATTACCO IN ATOUT È QUASI SEMPRE QUELLO CHE OTTIENE I MIGLIORI RISULTATI.",
    bidding: { dealer: "north", bids: ["P", "P", "1♠", "2NT", "P", "3♣", "P", "P", "P"] },
  },

  {
    id: "Q12-6",
    lesson: 12,
    board: 6,
    title: "Interventi e riaperture",
    contract: "3NT",
    declarer: "west",
    openingLead: c("club", "Q"),
    vulnerability: "ew",
    hands: {
      north: hand(["2"], ["10", "7", "4"], ["8", "6", "4"], ["Q", "J", "10", "7", "4", "3"]),
      east: hand(["7", "3"], ["A", "K", "8", "2"], ["A", "Q", "J", "9"], ["9", "8", "2"]),
      west: hand(["A", "J", "10", "6", "4"], ["Q", "J", "6"], ["10", "5"], ["K", "6", "5"]),
      south: hand(["K", "Q", "9", "8", "5"], ["9", "5", "3"], ["K", "7", "3", "2"], ["A"]),
    },
    commentary:
      "Su 1♠ Ovest \"si imbosca\" in attesa di una riapertura, e quando trasforma il Contro, passando, a tutti è chiaro che intende punire il contratto di 1♠. E' questo (e non prima) il momento in cui Nord deve correre ai ripari, scappando in un parziale a fiori (che Sud non deve correggere, se ha capito che aria tira). Per EO il bottino diventa meno appetibile, e sul 2NT proposto da Ovest Est rialza a manche. Ovest farà l'impasse a quadri e alla fine collezionerà 10 prese. SE L'INTERVENTO DEL COMPAGNO VI TROVA DISPERATI, SENZA FIT E SENZA PUNTI, IL MOMENTO PER SCAPPARE IN UN COLORE DIVERSO VA ATTESO: FATELO SOLO DOPO CHE L'AVVERSARIO ABBIA MOSTRATO INTENZIONI PUNITIVE.",
    bidding: { dealer: "east", bids: ["1♦", "1♠", "P", "P", "Dbl", "P", "2♣", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },

  {
    id: "Q12-7",
    lesson: 12,
    board: 7,
    title: "Interventi e riaperture",
    contract: "4♠",
    declarer: "east",
    openingLead: c("diamond", "6"),
    vulnerability: "both",
    hands: {
      north: hand(["6", "3"], ["K", "10", "9", "8"], ["A", "K", "J", "9", "4"], ["Q", "10"]),
      east: hand(["A", "K", "Q", "J", "5", "4"], ["A", "J", "5"], ["10", "8"], ["K", "3"]),
      west: hand(["10", "9", "2"], ["4", "3", "2"], ["Q", "7"], ["A", "9", "6", "5", "4"]),
      south: hand(["8", "7"], ["Q", "7", "6"], ["6", "5", "3", "2"], ["J", "8", "7", "2"]),
    },
    commentary:
      "Con le carte di Est la via giusta per mostrare il suo monumento di forza è \"contro e poi le picche\"; Ovest, con un asso e fit terzo, ha un tranquillo rialzo a manche. Il Gioco. L'attacco (con la carta più evidente per dare Conto pari) fa incassare a Nord le prime due prese, dopodiché il miglior rinvio è 10♣. Est ha la prospettiva di perdere 2♦ e 2♥, deve assolutamente riuscire ad affrancare almeno una fiori del morto. Quindi A♥, K♠ e ♣ asso e fiori tagliata alta (soprattutto perché 5 e 4 servono per entrare al morto); piccola ♠ per il 9 e ancora taglio alto; A♠ (va tirato perché potrebbero essere 3-1) e ♠ al 10 e quinta fiori affrancata: 10 prese. UN AFFRANCAMENTO DI TAGLIO RICHIEDE INGRESSI: QUANDO IL DESTINO VE LI REGALA, ACCORGETEVENE!",
    bidding: { dealer: "south", bids: ["P", "P", "1♦", "Dbl", "P", "2♣", "P", "2♠", "P", "4♠", "P", "P", "P"] },
  },

  {
    id: "Q12-8",
    lesson: 12,
    board: 8,
    title: "Interventi e riaperture",
    contract: "4♠",
    declarer: "south",
    openingLead: c("diamond", "Q"),
    vulnerability: "none",
    hands: {
      north: hand(["K", "7", "5"], ["9", "8", "6"], ["9", "8"], ["A", "10", "6", "4", "3"]),
      east: hand(["9", "2"], ["K", "7", "5"], ["7", "6", "4", "3", "2"], ["9", "5", "2"]),
      west: hand(["Q", "8", "3"], ["A", "Q", "J", "10", "4"], ["Q", "J", "10"], ["Q", "7"]),
      south: hand(["A", "J", "10", "6", "4"], ["3", "2"], ["A", "K", "5"], ["K", "J", "8"]),
    },
    commentary:
      "Sud ha troppo per riaprire con 1♠ o 2♠: la via giusta è il Contro, seguito dal colore. Sul Contro, Nord dichiara il suo colore, poi rialza a 3♠ (Sud potrebbe avere un po' meno dei punti che ha) e Sud conclude. Il Gioco. L'attacco più ragionevole per Ovest, data la forchetta a cuori, è Q♦. Sud può ragionevolmente dedurre che Ovest non ha AK♦ (avrebbe preferito questo attacco), quindi uno di questi onori è in Est (certamente il K: con KQJ Ovest avrebbe attaccato K♦). Ma Est non sarebbe passato con 5 punti (un K + una Q) quindi entrambe le dame nere sono in mano all'apertore, e i due impasse si fanno a occhi chiusi! DOPO APERTURA E PASSO PASSO, IL QUARTO DI MANO FA ESATTAMENTE QUELLO CHE FA IL SECONDO, SCALATO DI CIRCA 4 PUNTI. QUINDI \"CONTRO POI COLORE\" MOSTRA 13/14+.",
    bidding: { dealer: "west", bids: ["1♥", "P", "P", "Dbl", "P", "2♣", "P", "2♠", "P", "3♠", "P", "4♠", "P", "P", "P"] },
  },

];
