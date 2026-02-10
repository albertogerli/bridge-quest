/**
 * Bridge practice hands (smazzate didattiche) from FIGB Corso Fiori
 * Lessons 9-12, 8 boards each = 32 boards total
 *
 * Extracted from official FIGB teaching materials (Commissione Insegnamento, settembre 2017)
 */

import type { Suit, Rank, Position, Card } from "../lib/bridge-engine";

type Vulnerability = "none" | "ns" | "ew" | "all";

export interface Smazzata {
  id: string;
  lesson: number;
  board: number;
  title: string;
  contract: string;
  declarer: Position;
  openingLead: Card;
  vulnerability: Vulnerability;
  hands: Record<Position, Card[]>;
  commentary: string;
  bidding?: {
    dealer: Position;
    bids: string[];
  };
}

// Helper to create cards concisely
function S(rank: Rank): Card { return { suit: "spade" as const, rank }; }
function H(rank: Rank): Card { return { suit: "heart" as const, rank }; }
function D(rank: Rank): Card { return { suit: "diamond" as const, rank }; }
function C(rank: Rank): Card { return { suit: "club" as const, rank }; }

export const smazzate9to12: Smazzata[] = [
  // ============================================================
  // LESSON 9 - Risposte all'apertura di 1 a colore
  // ============================================================

  // Board 9-1: Dichiara N, Vul. Nessuno
  // North: S-A82 H-QJ102 D-103 C-QJ62
  // West: S-974 H-K65 D-KQ952 C-73
  // East: S-QJ106 H-A4 D-AJ86 C-1085
  // South: S-K53 H-9873 D-74 C-AK94
  {
    id: "9-1",
    lesson: 9,
    board: 1,
    title: "Risposte all'apertura di 1 a colore",
    contract: "3D",
    declarer: "east",
    openingLead: { suit: "club", rank: "A" },
    vulnerability: "none",
    hands: {
      north: [S("A"), S("8"), S("2"), H("Q"), H("J"), H("10"), H("2"), D("10"), D("3"), C("Q"), C("J"), C("6"), C("2")],
      west:  [S("9"), S("7"), S("4"), H("K"), H("6"), H("5"), D("K"), D("Q"), D("9"), D("5"), D("2"), C("7"), C("3")],
      east:  [S("Q"), S("J"), S("10"), S("6"), H("A"), H("4"), D("A"), D("J"), D("8"), D("6"), C("10"), C("8"), C("5")],
      south: [S("K"), S("5"), S("3"), H("9"), H("8"), H("7"), H("3"), D("7"), D("4"), C("A"), C("K"), C("9"), C("4")],
    },
    commentary: "La licita. Con una bilanciata di 12 punti Est deve aprire di 1D (1S richiede 5 carte). Ovest, certo di non avere in linea 8 carte in nessun nobile, rialza a 3D mostrando fit e carte che, rivalutate, valgono 11. Est passa: a 25 punti, richiesti per giocare manche, non si arriva. Nessun rimpianto per le C: Ovest, scegliendo le D, nega di avere 4 o piu carte a H o S. Il gioco. Est conta 5 prese a D e 2 a H, piu due affrancabili a S. Esecuzione facile: si battono i giri di atout necessari e poi si cedono A e K di S. 3D: 110.",
    bidding: {
      dealer: "north",
      bids: ["P", "1D", "P", "3D", "P", "P", "P"],
    },
  },

  // Board 9-2: Dichiara E, Vul. NS
  // North: S-Q104 H-KQ6 D-K53 C-A542
  // West: S-9763 H-7 D-A1082 C-Q1093
  // East: S-A2 H-J10853 D-J964 C-J7
  // South: S-KJ85 H-A942 D-Q7 C-K86
  {
    id: "9-2",
    lesson: 9,
    board: 2,
    title: "Risposte all'apertura di 1 a colore",
    contract: "3NT",
    declarer: "north",
    openingLead: { suit: "heart", rank: "J" },
    vulnerability: "ns",
    hands: {
      north: [S("Q"), S("10"), S("4"), H("K"), H("Q"), H("6"), D("K"), D("5"), D("3"), C("A"), C("5"), C("4"), C("2")],
      west:  [S("9"), S("7"), S("6"), S("3"), H("7"), D("A"), D("10"), D("8"), D("2"), C("Q"), C("10"), C("9"), C("3")],
      east:  [S("A"), S("2"), H("J"), H("10"), H("8"), H("5"), H("3"), D("J"), D("9"), D("6"), D("4"), C("J"), C("7")],
      south: [S("K"), S("J"), S("8"), S("5"), H("A"), H("9"), H("4"), H("2"), D("Q"), D("7"), C("K"), C("8"), C("6")],
    },
    commentary: "La licita. Sud procede per eliminazione: non puo aprire di 1S, ne di 1H, ne di 1D, ne di 1NT. Non resta che 1C. Nord e bilanciato, sa per certo di avere almeno 26 in linea e nessun fit nobile e possibile: 3NT e una decisione rapida e vincente. Il gioco. Nord conta 3 vincenti a S e 2 a H; puo affrancare 3C e 1D. Se intuisce che l'attacco proviene da J10, anche il 9 di H dara una presa, ma solo se vince l'attacco in mano! Subito S per cedere l'Asso, poi l'altro onore corto di H e impasse al 10 al 100%... infine, se non ci ha ancora pensato l'avversario, D. 3NT + 1, in seconda: 630.",
    bidding: {
      dealer: "east",
      bids: ["P", "1C", "P", "3NT", "P", "P", "P"],
    },
  },

  // Board 9-3: Dichiara S, Vul. EO
  // North: S-52 H-1072 D-J1092 C-AKJ3
  // West: S-AK1083 H-AJ854 D-7 C-87
  // East: S-QJ974 H-6 D-A8543 C-Q5
  // South: S-6 H-KQ93 D-KQ6 C-109642
  {
    id: "9-3",
    lesson: 9,
    board: 3,
    title: "Risposte all'apertura di 1 a colore",
    contract: "4S",
    declarer: "west",
    openingLead: { suit: "club", rank: "A" },
    vulnerability: "ew",
    hands: {
      north: [S("5"), S("2"), H("10"), H("7"), H("2"), D("J"), D("10"), D("9"), D("2"), C("A"), C("K"), C("J"), C("3")],
      west:  [S("A"), S("K"), S("10"), S("8"), S("3"), H("A"), H("J"), H("8"), H("5"), H("4"), D("7"), C("8"), C("7")],
      east:  [S("Q"), S("J"), S("9"), S("7"), S("4"), H("6"), D("A"), D("8"), D("5"), D("4"), D("3"), C("Q"), C("5")],
      south: [S("6"), H("K"), H("Q"), H("9"), H("3"), D("K"), D("Q"), D("6"), C("10"), C("9"), C("6"), C("4"), C("2")],
    },
    commentary: "La licita. Con due colori entrambi quinti si apre in quello di rango maggiore. Est ha un fit eccezionale: la sua mano, se si gioca a S, vale 13 punti (9+4), pertanto la dichiarazione corretta e 4S. Il gioco. Nord incassa A e K di C, poi - essendo inutile la continuazione - prosegue con il J di quadri. Ovest conta: 1H, 1D... e di conseguenza almeno 8 prese dovranno essere date dalle atout. Puo tagliare 4H al morto e 4D in mano, un colpo di atout si puo dare, poi si prosegue incassando i due Assi e tagliando tutto; 9 prese con le atout, piu i due Assi: 11. 4S + 1, in seconda: 650.",
    bidding: {
      dealer: "south",
      bids: ["P", "1S", "P", "4S", "P", "P", "P"],
    },
  },

  // Board 9-4: Dichiara O, Vul. TUTTI
  // North: S-104 H-K64 D-Q8762 C-Q74
  // West: S-A32 H-Q92 D-J94 C-J1086
  // East: S-9865 H-J D-AK103 C-9532
  // South: S-KQJ7 H-A108753 D-5 C-AK
  {
    id: "9-4",
    lesson: 9,
    board: 4,
    title: "Risposte all'apertura di 1 a colore",
    contract: "4H",
    declarer: "south",
    openingLead: { suit: "club", rank: "J" },
    vulnerability: "all",
    hands: {
      north: [S("10"), S("4"), H("K"), H("6"), H("4"), D("Q"), D("8"), D("7"), D("6"), D("2"), C("Q"), C("7"), C("4")],
      west:  [S("A"), S("3"), S("2"), H("Q"), H("9"), H("2"), D("J"), D("9"), D("4"), C("J"), C("10"), C("8"), C("6")],
      east:  [S("9"), S("8"), S("6"), S("5"), H("J"), D("A"), D("K"), D("10"), D("3"), C("9"), C("5"), C("3"), C("2")],
      south: [S("K"), S("Q"), S("J"), S("7"), H("A"), H("10"), H("8"), H("7"), H("5"), H("3"), D("5"), C("A"), C("K")],
    },
    commentary: "La licita. Sud ha buone carte, che diventano ottime quando Nord mostra fit: il colore non e molto onorato, ma piu sono le carte in linea e meno saranno le prese da cedere. Il rialzo a manche e una buona scommessa. Il gioco. Sud conta 6, o 5, o 4 prese a H (a seconda che i resti siano 2-2, 3-1, 4-0), 3C, e 3 affrancabili a picche. Vinto l'attacco, con un minimo rischio puo sbarazzarsi del 5 di D: incassa l'altro onore a C, l'Asso di H e H al Re (ora ovest ha una atout vincente, inutile batterla) e Dama di C scartando D. Poi si affrontano le picche. Agli avversari spettera solo una picche e una H. 4H + 1, in seconda: 650.",
    bidding: {
      dealer: "west",
      bids: ["P", "P", "P", "1H", "P", "2H", "P", "4H", "P", "P", "P"],
    },
  },

  // Board 9-5: Dichiara N, Vul. NS
  // North: S-A96 H-Q865 D-Q7652 C-5
  // West: S-QJ103 H-1094 D-KJ C-KJ43
  // East: S-K52 H-7 D-A1098 C-Q10962
  // South: S-874 H-AKJ32 D-43 C-A87
  {
    id: "9-5",
    lesson: 9,
    board: 5,
    title: "Risposte all'apertura di 1 a colore",
    contract: "3H",
    declarer: "south",
    openingLead: { suit: "spade", rank: "Q" },
    vulnerability: "ns",
    hands: {
      north: [S("A"), S("9"), S("6"), H("Q"), H("8"), H("6"), H("5"), D("Q"), D("7"), D("6"), D("5"), D("2"), C("5")],
      west:  [S("Q"), S("J"), S("10"), S("3"), H("10"), H("9"), H("4"), D("K"), D("J"), C("K"), C("J"), C("4"), C("3")],
      east:  [S("K"), S("5"), S("2"), H("7"), D("A"), D("10"), D("9"), D("8"), C("Q"), C("10"), C("9"), C("6"), C("2")],
      south: [S("8"), S("7"), S("4"), H("A"), H("K"), H("J"), H("3"), H("2"), D("4"), D("3"), C("A"), C("8"), C("7")],
    },
    commentary: "La licita. Ovvia l'apertura di Sud; Nord ha fit abbondante e lo deve comunicare. La sua mano, con atout H, vale 11 (8+3), punteggio critico perche la manche non e certa (11+12) ma nemmeno da escludere (11+14). L'appoggio a livello 3 dice: 'H ok, sono incerto sulla somma punti; passa se hai il minimo dell'apertura e rialza se hai almeno 14'. Sud non potrebbe avere meno di quello che ha, e passa. Il gioco. Sud conta: 1S, 5H, 1C. Ricavare 2 prese dalle D? E' quasi impossibile. Ma altre due prese dalle atout si: basta tagliare due C al morto! Preso l'attacco, C all'Asso e C taglio. H all'Asso e C taglio. Poi eliminazione delle atout... e 9 prese fatte. 3H: 140.",
    bidding: {
      dealer: "north",
      bids: ["P", "P", "1H", "P", "3H", "P", "P", "P"],
    },
  },

  // Board 9-6: Dichiara E, Vul. EO
  // North: S-K72 H-K3 D-Q10983 C-Q108
  // West: S-83 H-8764 D-KJ C-A9643
  // East: S-AJ954 H-AJ5 D-65 C-K75
  // South: S-Q106 H-Q1092 D-A742 C-J2
  {
    id: "9-6",
    lesson: 9,
    board: 6,
    title: "Risposte all'apertura di 1 a colore",
    contract: "1NT",
    declarer: "west",
    openingLead: { suit: "diamond", rank: "10" },
    vulnerability: "ew",
    hands: {
      north: [S("K"), S("7"), S("2"), H("K"), H("3"), D("Q"), D("10"), D("9"), D("8"), D("3"), C("Q"), C("10"), C("8")],
      west:  [S("8"), S("3"), H("8"), H("7"), H("6"), H("4"), D("K"), D("J"), C("A"), C("9"), C("6"), C("4"), C("3")],
      east:  [S("A"), S("J"), S("9"), S("5"), S("4"), H("A"), H("J"), H("5"), D("6"), D("5"), C("K"), C("7"), C("5")],
      south: [S("Q"), S("10"), S("6"), H("Q"), H("10"), H("9"), H("2"), D("A"), D("7"), D("4"), D("2"), C("J"), C("2")],
    },
    commentary: "La licita. Est ha le carte in regola per aprire 1S; Ovest deve evitare 2 errori: 1) passare (con 5+ punti non si passa MAI), 2) dire 2C (licita istintiva ma sbagliata: prometterebbe 12+ punti). Non ne rimane che una: 1NT. Est passa, in linea c'e al massimo 23, nessuna manche e possibile. Il gioco. Gioco duro, se NS sanno il fatto loro: Sud prende e rigioca D; Ovest in presa con il Re conta: 1S, 1H, 1D, 2C. Le C, se divise 3-2, possono dare 2 prese di lunga, cedendone una. Attenzione pero: serve un colpo in bianco, perche Ovest non ha piu ingressi: piccola C da ambo le mani, o K di C e C a dare... non A e K di C e C! 1NT: 90.",
    bidding: {
      dealer: "east",
      bids: ["1S", "P", "1NT", "P", "P", "P"],
    },
  },

  // Board 9-7: Dichiara S, Vul. Tutti
  // North: S-K7653 H-K643 D-6 C-984
  // West: S-QJ4 H-J109 D-K1072 C-A102
  // East: S-10 H-Q852 D-Q983 C-KQJ5
  // South: S-A982 H-A7 D-AJ54 C-763
  {
    id: "9-7",
    lesson: 9,
    board: 7,
    title: "Risposte all'apertura di 1 a colore",
    contract: "2S",
    declarer: "north",
    openingLead: { suit: "club", rank: "K" },
    vulnerability: "all",
    hands: {
      north: [S("K"), S("7"), S("6"), S("5"), S("3"), H("K"), H("6"), H("4"), H("3"), D("6"), C("9"), C("8"), C("4")],
      west:  [S("Q"), S("J"), S("4"), H("J"), H("10"), H("9"), D("K"), D("10"), D("7"), D("2"), C("A"), C("10"), C("2")],
      east:  [S("10"), H("Q"), H("8"), H("5"), H("2"), D("Q"), D("9"), D("8"), D("3"), C("K"), C("Q"), C("J"), C("5")],
      south: [S("A"), S("9"), S("8"), S("2"), H("A"), H("7"), D("A"), D("J"), D("5"), D("4"), C("7"), C("6"), C("3")],
    },
    commentary: "La licita. Sud ha una bilanciata, il primo colore in cui trova il numero di carte sufficiente per aprire e D. Nord ha due colori in cui chiedere se c'e fit, ma le S sono 5 quindi e da li che deve cominciare. Sud (che sa di dover dichiarare ancora) ha una licita spontanea e ovvia: 2S 'si, ho fit di 4 carte, e un'apertura di forza minima. Vedi tu.' Nord passa. Il gioco. Le prime 3 prese sono della difesa, che poi proseguira H, o D. Nord conta 5, o 4, o 3 (a seconda dei resti: 2-2, 3-1, 4-0), 2H, 1D. Bisogna ricorrere ad un allungamento di prese: tagliare 2H al morto o 3D in mano e equivalente, ma la prima ipotesi e meno complicata. 2S + 1: 140.",
    bidding: {
      dealer: "south",
      bids: ["1D", "P", "1S", "P", "2S", "P", "P", "P"],
    },
  },

  // Board 9-8: Dichiara O, Vul. Nessuno
  // North: S-J1093 H-Q D-Q632 C-K1087
  // West: S-Q876 H-K8763 D-974 C-A
  // East: S-AK4 H-AJ1095 D-K C-J432
  // South: S-52 H-42 D-AJ1085 C-Q965
  {
    id: "9-8",
    lesson: 9,
    board: 8,
    title: "Risposte all'apertura di 1 a colore",
    contract: "4H",
    declarer: "east",
    openingLead: { suit: "club", rank: "5" },
    vulnerability: "none",
    hands: {
      north: [S("J"), S("10"), S("9"), S("3"), H("Q"), D("Q"), D("6"), D("3"), D("2"), C("K"), C("10"), C("8"), C("7")],
      west:  [S("Q"), S("8"), S("7"), S("6"), H("K"), H("8"), H("7"), H("6"), H("3"), D("9"), D("7"), D("4"), C("A")],
      east:  [S("A"), S("K"), S("4"), H("A"), H("J"), H("10"), H("9"), H("5"), D("K"), C("J"), C("4"), C("3"), C("2")],
      south: [S("5"), S("2"), H("4"), H("2"), D("A"), D("J"), D("10"), D("8"), D("5"), C("Q"), C("9"), C("6"), C("5")],
    },
    commentary: "La licita. Est ha... 13 (un Re secco non va contato a pieno valore), l'apertura 1H e facile. Ovest, con fit di 5 carte e un singolo, appoggia a manche perche le sue carte, ora, valgono 13 (9 + 4). Il gioco. Est gioca comodo; puo anche permettersi di battere 2 atout, glie ne restano abbastanza per fare i tre tagli a C al morto; realizzera 5H di mano, 3 tagli con le S del morto, 1D e 3 (o 4?) C. Nota: se il morto non scarta nessuna S, Nord deve conservarle tutte e 4 (altrimenti Est fara 13 prese). 4H + 2, in prima: 480.",
    bidding: {
      dealer: "west",
      bids: ["P", "P", "1H", "P", "4H", "P", "P", "P"],
    },
  },

  // ============================================================
  // LESSON 10 - L'Apertore descrive
  // ============================================================

  // Board 10-1: Dichiara N, Vul. Nessuno
  // North: S-KJ532 H-A764 D-Q3 C-95
  // West: S-108 H-QJ9 D-10842 C-A874
  // East: S-Q9 H-K1082 D-97 C-Q10632
  // South: S-A764 H-53 D-AKJ65 C-KJ
  {
    id: "10-1",
    lesson: 10,
    board: 1,
    title: "L'Apertore descrive",
    contract: "4S",
    declarer: "north",
    openingLead: { suit: "club", rank: "2" },
    vulnerability: "none",
    hands: {
      north: [S("K"), S("J"), S("5"), S("3"), S("2"), H("A"), H("7"), H("6"), H("4"), D("Q"), D("3"), C("9"), C("5")],
      west:  [S("10"), S("8"), H("Q"), H("J"), H("9"), D("10"), D("8"), D("4"), D("2"), C("A"), C("8"), C("7"), C("4")],
      east:  [S("Q"), S("9"), H("K"), H("10"), H("8"), H("2"), D("9"), D("7"), C("Q"), C("10"), C("6"), C("3"), C("2")],
      south: [S("A"), S("7"), S("6"), S("4"), H("5"), H("3"), D("A"), D("K"), D("J"), D("6"), D("5"), C("K"), C("J")],
    },
    commentary: "La licita. Nord inizia chiedendo fit nel colore quinto e Sud, saltando un livello, mostra mano sbilanciata con 4 carte di appoggio e circa 15-17 punti; quanto basta a Nord (almeno 25 in linea ci sono) per dichiarare 4S. Il gioco. L'attacco e insidioso, quello che non si deve fare e mettere il Re: non si attacca sotto asso, ad atout, quindi il Re verrebbe catturato al 100%. Ovest, in presa, per il suo meglio potrebbe giocare la Q di H; Nord vince con l'Asso, batte A e K di atout (con 9 carte NON si fa l'impasse alla Q) e incassa le D, per 12 prese. 4S + 2, in prima: 480.",
    bidding: {
      dealer: "north",
      bids: ["P", "P", "1D", "P", "1S", "P", "3S", "P", "4S", "P", "P", "P"],
    },
  },

  // Board 10-2: Dichiara E, Vul. NS
  // North: S-J109 H-874 D-985 C-J1095
  // West: S-K6 H-AQJ D-AKJ3 C-7642
  // East: S-A843 H-962 D-Q1042 C-K8
  // South: S-Q752 H-K1053 D-76 C-AQ3
  {
    id: "10-2",
    lesson: 10,
    board: 2,
    title: "L'Apertore descrive",
    contract: "3NT",
    declarer: "west",
    openingLead: { suit: "club", rank: "J" },
    vulnerability: "ns",
    hands: {
      north: [S("J"), S("10"), S("9"), H("8"), H("7"), H("4"), D("9"), D("8"), D("5"), C("J"), C("10"), C("9"), C("5")],
      west:  [S("K"), S("6"), H("A"), H("Q"), H("J"), D("A"), D("K"), D("J"), D("3"), C("7"), C("6"), C("4"), C("2")],
      east:  [S("A"), S("8"), S("4"), S("3"), H("9"), H("6"), H("2"), D("Q"), D("10"), D("4"), D("2"), C("K"), C("8")],
      south: [S("Q"), S("7"), S("5"), S("2"), H("K"), H("10"), H("5"), H("3"), D("7"), D("6"), C("A"), C("Q"), C("3")],
    },
    commentary: "La licita. Con la bilanciata di 18-20 punti si apre di 1 a colore, e si salta a 2NT al giro seguente. Est, con 9, ha abbastanza per rialzare a 3NT; se Ovest possiede 4 carte di S potra correggere a 4S. Il gioco. Inizio drammatico, 4 prese per la difesa (se il K non viene giocato... Sud deve comunque giocare la Q e poi l'Asso) dopodiche Nord, tra H e C, dovrebbe proseguire con il J di C. Ovest ha 7 vincenti e deve assolutamente ricavare altre 2 prese dalle D; gli ingressi per fare e ripetere l'impasse abbondano, e solo il coraggio che non deve mancare! 3NT, in prima: 400.",
    bidding: {
      dealer: "east",
      bids: ["P", "P", "1D", "P", "1S", "P", "2NT", "P", "3NT", "P", "P", "P"],
    },
  },

  // Board 10-3: Dichiara S, Vul. EO
  // North: S-AQ72 H-K6 D-KJ852 C-86
  // West: S-863 H-Q854 D-94 C-KQ94
  // East: S-104 H-J7 D-10763 C-AJ1052
  // South: S-KJ95 H-A10932 D-AQ C-73
  {
    id: "10-3",
    lesson: 10,
    board: 3,
    title: "L'Apertore descrive",
    contract: "4S",
    declarer: "south",
    openingLead: { suit: "club", rank: "K" },
    vulnerability: "ew",
    hands: {
      north: [S("A"), S("Q"), S("7"), S("2"), H("K"), H("6"), D("K"), D("J"), D("8"), D("5"), D("2"), C("8"), C("6")],
      west:  [S("8"), S("6"), S("3"), H("Q"), H("8"), H("5"), H("4"), D("9"), D("4"), C("K"), C("Q"), C("9"), C("4")],
      east:  [S("10"), S("4"), H("J"), H("7"), D("10"), D("7"), D("6"), D("3"), C("A"), C("J"), C("10"), C("5"), C("2")],
      south: [S("K"), S("J"), S("9"), S("5"), H("A"), H("10"), H("9"), H("3"), H("2"), D("A"), D("Q"), C("7"), C("3")],
    },
    commentary: "La licita. Nord, poiche i punti gli consentono il livello 2, deve iniziare dal suo colore piu lungo: 2D. Ora entrambi sanno di avere forza per una manche. Sud mostra l'altro colore e Nord conclude senza tergiversare. Il gioco. Dopo aver incassato le prime due fiori Ovest deve cambiare, e il rinvio meno rischioso e atout. Sud conta 4S, 2H, 5D; e inutile tagliare le H (piu di 11 prese non puo fare!) pertanto batte tre giri, sblocca AQ di D e rientra con il Re di H per completare l'incasso. 4S + 1, in prima: 450.",
    bidding: {
      dealer: "south",
      bids: ["1H", "P", "2D", "P", "2S", "P", "4S", "P", "P", "P"],
    },
  },

  // Board 10-4: Dichiara O, Vul. TUTTI
  // North: S-98 H-A64 D-10642 C-KQJ8
  // West: S-Q73 H-QJ2 D-KJ7 C-A542
  // East: S-KJ1054 H-K73 D-AQ5 C-76
  // South: S-A62 H-10985 D-983 C-1093
  {
    id: "10-4",
    lesson: 10,
    board: 4,
    title: "L'Apertore descrive",
    contract: "4S",
    declarer: "east",
    openingLead: { suit: "heart", rank: "10" },
    vulnerability: "all",
    hands: {
      north: [S("9"), S("8"), H("A"), H("6"), H("4"), D("10"), D("6"), D("4"), D("2"), C("K"), C("Q"), C("J"), C("8")],
      west:  [S("Q"), S("7"), S("3"), H("Q"), H("J"), H("2"), D("K"), D("J"), D("7"), C("A"), C("5"), C("4"), C("2")],
      east:  [S("K"), S("J"), S("10"), S("5"), S("4"), H("K"), H("7"), H("3"), D("A"), D("Q"), D("5"), C("7"), C("6")],
      south: [S("A"), S("6"), S("2"), H("10"), H("9"), H("8"), H("5"), D("9"), D("8"), D("3"), C("10"), C("9"), C("3")],
    },
    commentary: "La licita. Est, dopo 1NT, sa di aver di fronte una bilanciata di 12-14 punti, in cui le S sono o due, oppure tre. La manche e certa, e sara o 3NT (se Ovest ha 2S) o 4S (se Ovest ne ha 3). Per ottenere questa informazione usa un cambio di colore forzante e, appurate 8 carte in linea, sa che manche dichiarare. Il gioco. Sud sceglie l'unico colore non detto, Nord vince la presa e muove il K di C. Est conta 10 prese (4S, 2H, 3D e 1C) e non deve fare altro che battere atout. Nota: a 3NT si va sotto di una (attacco K di C)! 4S, in seconda: 620.",
    bidding: {
      dealer: "west",
      bids: ["1C", "P", "1S", "P", "1NT", "P", "2D", "P", "2S", "P", "4S", "P", "P", "P"],
    },
  },

  // Board 10-5: Dichiara N, Vul. NS
  // North: S-6 H-A87 D-AQJ84 C-K864
  // West: S-109853 H-103 D-753 C-A92
  // East: S-A742 H-J952 D-K6 C-J105
  // South: S-KQJ H-KQ64 D-1092 C-Q73
  {
    id: "10-5",
    lesson: 10,
    board: 5,
    title: "L'Apertore descrive",
    contract: "3NT",
    declarer: "south",
    openingLead: { suit: "spade", rank: "10" },
    vulnerability: "ns",
    hands: {
      north: [S("6"), H("A"), H("8"), H("7"), D("A"), D("Q"), D("J"), D("8"), D("4"), C("K"), C("8"), C("6"), C("4")],
      west:  [S("10"), S("9"), S("8"), S("5"), S("3"), H("10"), H("3"), D("7"), D("5"), D("3"), C("A"), C("9"), C("2")],
      east:  [S("A"), S("7"), S("4"), S("2"), H("J"), H("9"), H("5"), H("2"), D("K"), D("6"), C("J"), C("10"), C("5")],
      south: [S("K"), S("Q"), S("J"), H("K"), H("Q"), H("6"), H("4"), D("10"), D("9"), D("2"), C("Q"), C("7"), C("3")],
    },
    commentary: "La licita. Nord ha una sbilanciata di Diritto, il livello di guardia e 2D, quindi e autorizzato a dichiarare 2C (mostrando cosi 5+ D e 4+ C). Sud sa che i punti per una manche ci sono, sa che non c'e fit nei nobili, sa che l'attacco sara nell'unico colore non detto... e KQJ dovrebbero bastare: 3NT. Il gioco. Ovest sceglie la piu alta delle cartine, e questo aiuta Est a capire, quando vede cadere il J, che Sud ha esattamente KQJ e Ovest 5 carte.... quindi S ancora. Sud conta 2S, 3H... e le D, da sole, portano a 9 prese anche se l'impasse fallisse. Quindi 10 di D subito, per le C non ci sara tempo. 3NT, in seconda: 600.",
    bidding: {
      dealer: "north",
      bids: ["1D", "P", "1H", "P", "2C", "P", "3NT", "P", "P", "P"],
    },
  },

  // Board 10-6: Dichiara E, Vul. EO
  // North: S-QJ103 H-A4 D-6543 C-QJ8
  // West: S-942 H-J109532 D-A7 C-95
  // East: S-765 H-KQ D-KQ98 C-A764
  // South: S-AK8 H-876 D-J102 C-K1032
  {
    id: "10-6",
    lesson: 10,
    board: 6,
    title: "L'Apertore descrive",
    contract: "2H",
    declarer: "west",
    openingLead: { suit: "spade", rank: "Q" },
    vulnerability: "ew",
    hands: {
      north: [S("Q"), S("J"), S("10"), S("3"), H("A"), H("4"), D("6"), D("5"), D("4"), D("3"), C("Q"), C("J"), C("8")],
      west:  [S("9"), S("4"), S("2"), H("J"), H("10"), H("9"), H("5"), H("3"), H("2"), D("A"), D("7"), C("9"), C("5")],
      east:  [S("7"), S("6"), S("5"), H("K"), H("Q"), D("K"), D("Q"), D("9"), D("8"), C("A"), C("7"), C("6"), C("4")],
      south: [S("A"), S("K"), S("8"), H("8"), H("7"), H("6"), D("J"), D("10"), D("2"), C("K"), C("10"), C("3"), C("2")],
    },
    commentary: "La licita. Sull'apertura di 1 a colore non si deve mai passare se si hanno 5+ punti; Ovest risponde 1H e poi deve essere coerente: le sue carte valgono qualcosa solo se H e atout, quindi su 1NT e doveroso salvare il compagno e decidere che il parziale debba essere 2H. E' semplice, basta dire 2H! Il gioco. La difesa incassa le prime 3S, poi al meglio devia sulle fiori. Ovest prende, vede che 'avrebbe' 9 prese (5H, 3D, 1C) ma se ora batte atout ne resteranno solo 8. Quindi Asso di D, D al morto, e sul terzo giro di D, scarto del 9 di C. Poi, atout. Nota: il contratto di 1NT cadrebbe di 2 prese! 2H+1: 140.",
    bidding: {
      dealer: "east",
      bids: ["1D", "P", "1H", "P", "1NT", "P", "2H", "P", "P", "P"],
    },
  },

  // Board 10-7: Dichiara S, Vul. Tutti
  // North: S-A653 H-AQJ986 D-void C-Q64
  // West: S-J97 H-742 D-9762 C-1085
  // East: S-Q1082 H-K D-AK103 C-J972
  // South: S-K4 H-1053 D-QJ854 C-AK3
  {
    id: "10-7",
    lesson: 10,
    board: 7,
    title: "L'Apertore descrive",
    contract: "4H",
    declarer: "south",
    openingLead: { suit: "diamond", rank: "A" },
    vulnerability: "all",
    hands: {
      north: [S("A"), S("6"), S("5"), S("3"), H("A"), H("Q"), H("J"), H("9"), H("8"), H("6"), C("Q"), C("6"), C("4")],
      west:  [S("J"), S("9"), S("7"), H("7"), H("4"), H("2"), D("9"), D("7"), D("6"), D("2"), C("10"), C("8"), C("5")],
      east:  [S("Q"), S("10"), S("8"), S("2"), H("K"), D("A"), D("K"), D("10"), D("3"), C("J"), C("9"), C("7"), C("2")],
      south: [S("K"), S("4"), H("10"), H("5"), H("3"), D("Q"), D("J"), D("8"), D("5"), D("4"), C("A"), C("K"), C("3")],
    },
    commentary: "La licita. Sud, con 1D e poi 1NT, mostra una bilanciata 12-14; Nord sa di dover dichiarare una manche e sa anche quale sia: il fit a H di 8 o 9 carte e una certezza. Il gioco. Tagliato l'attacco (se D) o vinta la presa (se S), Nord conta 5 (o 6) H a seconda che si debba dare il Re o meno, 2S, 3C. Il morto offre la possibilita di tagliare due D (quindi: meglio prendere l'attacco con il K, poi S per l'Asso..). Il primo taglio si fa con il 3, il secondo con il 10 (se fosse surtagliato dal Re, se non altro Nord avra risolto un problema). Considerando che Ovest non surtaglia... deduzione quasi al 100%: non ha il Re, l'impasse non serve: a Nord conviene incassare l'Asso di H, ogni tanto avra una bella sorpresa. Se Nord ha indovinato tutto... 4H+ 3, in seconda: 710.",
    bidding: {
      dealer: "south",
      bids: ["1D", "P", "1H", "P", "1NT", "P", "4H", "P", "P", "P"],
    },
  },

  // Board 10-8: Dichiara O, Vul. Nessuno
  // North: S-K972 H-1043 D-432 C-K76
  // West: S-AJ103 H-A5 D-KQ865 C-54
  // East: S-Q6 H-KQ96 D-J107 C-QJ32
  // South: S-854 H-J872 D-A9 C-A1098
  {
    id: "10-8",
    lesson: 10,
    board: 8,
    title: "L'Apertore descrive",
    contract: "3NT",
    declarer: "east",
    openingLead: { suit: "club", rank: "10" },
    vulnerability: "none",
    hands: {
      north: [S("K"), S("9"), S("7"), S("2"), H("10"), H("4"), H("3"), D("4"), D("3"), D("2"), C("K"), C("7"), C("6")],
      west:  [S("A"), S("J"), S("10"), S("3"), H("A"), H("5"), D("K"), D("Q"), D("8"), D("6"), D("5"), C("5"), C("4")],
      east:  [S("Q"), S("6"), H("K"), H("Q"), H("9"), H("6"), D("J"), D("10"), D("7"), C("Q"), C("J"), C("3"), C("2")],
      south: [S("8"), S("5"), S("4"), H("J"), H("8"), H("7"), H("2"), D("A"), D("9"), C("A"), C("10"), C("9"), C("8")],
    },
    commentary: "La licita. Est chiede fit a H, Ovest nega di avere 4 carte ma descrive, sempre entro il livello di guardia, una mano di diritto (bilanciata o no) con 4 carte di S. Il 2NT di Est e un invito per la manche a senza: 11 sono troppi per dire 1NT (anche al secondo giro vale 5-10) e pochi per dire 3NT (12-15); Ovest con 14 accetta l'invito e rialza; con 12-13 sarebbe passato. Il gioco. Le prime prese dovrebbero svolgersi: 10C, 4C, KC, 2C, ancora 7C, JC, AC, 4C, e 9 di C per la dama di Est, che si rassicura vedendo Nord rispondere (C 4-3). Est ha due colori di sviluppo: S e D. Ma le S, anche se il K fosse in Sud, non bastano per arrivare a 9 prese. Le D invece si! Quindi subito J di D in tavola, e 9 prese non possono scappare. 3NT, in prima: 400.",
    bidding: {
      dealer: "west",
      bids: ["1D", "P", "1H", "P", "1S", "P", "2NT", "P", "3NT", "P", "P", "P"],
    },
  },

  // ============================================================
  // LESSON 11 - L'intervento
  // ============================================================

  // Board 11-1: Dichiara N, Vul. Nessuno
  // North: S-AK986 H-1087 D-Q94 C-K7
  // West: S-52 H-Q65 D-KJ65 C-AJ98
  // East: S-QJ10 H-AKJ D-A1073 C-Q106
  // South: S-743 H-9432 D-82 C-5432
  {
    id: "11-1",
    lesson: 11,
    board: 1,
    title: "L'intervento",
    contract: "3NT",
    declarer: "east",
    openingLead: { suit: "spade", rank: "3" },
    vulnerability: "none",
    hands: {
      north: [S("A"), S("K"), S("9"), S("8"), S("6"), H("10"), H("8"), H("7"), D("Q"), D("9"), D("4"), C("K"), C("7")],
      west:  [S("5"), S("2"), H("Q"), H("6"), H("5"), D("K"), D("J"), D("6"), D("5"), C("A"), C("J"), C("9"), C("8")],
      east:  [S("Q"), S("J"), S("10"), H("A"), H("K"), H("J"), D("A"), D("10"), D("7"), D("3"), C("Q"), C("10"), C("6")],
      south: [S("7"), S("4"), S("3"), H("9"), H("4"), H("3"), H("2"), D("8"), D("2"), C("5"), C("4"), C("3"), C("2")],
    },
    commentary: "Sud, con mano nulla, deve favorire il compagno attaccando nel suo colore. La licita. L'intervento di 1NT richiede le stesse caratteristiche dell'apertura di 1NT, e il fermo; Ovest con 11 e senza interesse a interrogare dichiara direttamente 3NT. Il gioco. Nord incassa AK e ci rigioca, affrancandosi due prese. Est conta: 1S, 3H, 2D e 1C. Puo cercare di indovinare la Q di D (ha la forchetta in entrambe le mani), o fare l'impasse a C. La soluzione e nella licita! Mancano esattamente 12 punti... e Nord ha aperto. Chissa chi ha la Dama di D? 3NT, in prima: 400.",
    bidding: {
      dealer: "north",
      bids: ["1S", "1NT", "P", "3NT", "P", "P", "P"],
    },
  },

  // Board 11-2: Dichiara E, Vul. NS
  // North: S-8 H-A10964 D-QJ53 C-K72
  // West: S-AJ1096 H-3 D-K964 C-J95
  // East: S-KQ432 H-52 D-87 C-A1043
  // South: S-75 H-KQJ87 D-A102 C-Q86
  {
    id: "11-2",
    lesson: 11,
    board: 2,
    title: "L'intervento",
    contract: "4S",
    declarer: "west",
    openingLead: { suit: "heart", rank: "A" },
    vulnerability: "ns",
    hands: {
      north: [S("8"), H("A"), H("10"), H("9"), H("6"), H("4"), D("Q"), D("J"), D("5"), D("3"), C("K"), C("7"), C("2")],
      west:  [S("A"), S("J"), S("10"), S("9"), S("6"), H("3"), D("K"), D("9"), D("6"), D("4"), C("J"), C("9"), C("5")],
      east:  [S("K"), S("Q"), S("4"), S("3"), S("2"), H("5"), H("2"), D("8"), D("7"), C("A"), C("10"), C("4"), C("3")],
      south: [S("7"), S("5"), H("K"), H("Q"), H("J"), H("8"), H("7"), D("A"), D("10"), D("2"), C("Q"), C("8"), C("6")],
    },
    commentary: "La licita. Sia Nord che Est hanno un fit eccezionale nel colore del compagno, tale da suggerire per entrambi un contratto di manche. Infatti... si fanno 4H su una linea, ma anche 4S sull'altra: non vi stupite, e merito della quantita di atout. Il gioco. Nord puo proseguire H... o D... o C o atout: nulla impedira a Ovest di mettere insieme 10 prese: 5 atout di Est, 1 taglio (a H), 1D (l'Asso e ben messo) e 3C, facendo e ripetendo l'impasse a Q e K. 4S, in prima: 420.",
    bidding: {
      dealer: "east",
      bids: ["P", "1H", "1S", "4H", "4S", "P", "P", "P"],
    },
  },

  // Board 11-3: Dichiara S, Vul. EO
  // North: S-KQ4 H-AQ1092 D-75 C-985
  // West: S-AJ53 H-87 D-AK86 C-Q64
  // East: S-982 H-43 D-QJ92 C-KJ32
  // South: S-1076 H-KJ65 D-1043 C-A107
  {
    id: "11-3",
    lesson: 11,
    board: 3,
    title: "L'intervento",
    contract: "2H",
    declarer: "north",
    openingLead: { suit: "diamond", rank: "Q" },
    vulnerability: "ew",
    hands: {
      north: [S("K"), S("Q"), S("4"), H("A"), H("Q"), H("10"), H("9"), H("2"), D("7"), D("5"), C("9"), C("8"), C("5")],
      west:  [S("A"), S("J"), S("5"), S("3"), H("8"), H("7"), D("A"), D("K"), D("8"), D("6"), C("Q"), C("6"), C("4")],
      east:  [S("9"), S("8"), S("2"), H("4"), H("3"), D("Q"), D("J"), D("9"), D("2"), C("K"), C("J"), C("3"), C("2")],
      south: [S("10"), S("7"), S("6"), H("K"), H("J"), H("6"), H("5"), D("10"), D("4"), D("3"), C("A"), C("10"), C("7")],
    },
    commentary: "La licita. Nord interviene nella sua buona quinta e poiche le forze sulle linee sono equilibrate, la competizione finisce subito: Est rialza le D e Sud le H, spuntandola - come spesso accade - perche il rango dei colori avvantaggia NS (a 3D Ovest va sotto di una). Il gioco. Nessuna difficolta per Nord: 5H, 1C e due facili affrancabili a S, se avra cura di fare l'expasse due volte. 2H: 110.",
    bidding: {
      dealer: "south",
      bids: ["P", "1D", "1H", "2D", "2H", "P", "P", "P"],
    },
  },

  // Board 11-4: Dichiara O, Vul. TUTTI
  // North: S-AJ6542 H-A4 D-98 C-Q64
  // West: S-10 H-107532 D-J32 C-K987
  // East: S-Q7 H-J9 D-KQ10764 C-AJ3
  // South: S-K983 H-KQ86 D-A5 C-1052
  {
    id: "11-4",
    lesson: 11,
    board: 4,
    title: "L'intervento",
    contract: "4S",
    declarer: "north",
    openingLead: { suit: "diamond", rank: "K" },
    vulnerability: "all",
    hands: {
      north: [S("A"), S("J"), S("6"), S("5"), S("4"), S("2"), H("A"), H("4"), D("9"), D("8"), C("Q"), C("6"), C("4")],
      west:  [S("10"), H("10"), H("7"), H("5"), H("3"), H("2"), D("J"), D("3"), D("2"), C("K"), C("9"), C("8"), C("7")],
      east:  [S("Q"), S("7"), H("J"), H("9"), D("K"), D("Q"), D("10"), D("7"), D("6"), D("4"), C("A"), C("J"), C("3")],
      south: [S("K"), S("9"), S("8"), S("3"), H("K"), H("Q"), H("8"), H("6"), D("A"), D("5"), C("10"), C("5"), C("2")],
    },
    commentary: "La licita. Il contro di Sud e impeccabile: puo giocare in entrambi i maggiori e non disdegna le C. Nord deve rendersi conto che deve scegliere non solo il colore, ma anche il LIVELLO, perche - anche se il Contro 'mostra' valori di apertura - il meccanismo e diverso: chi ha detto Contro con mano standard (12-14) non ha niente da aggiungere, neanche l'appoggio! Il gioco. Facile: 6 S (probabili) 3 H, 1 D. Dopo aver battuto 2 giri di atout Nord incassa 3 H scartando la cartina di D, poi gioca C e perdera solo le tre prese nel colore. 4S, in seconda: 620.",
    bidding: {
      dealer: "west",
      bids: ["P", "P", "1D", "X", "P", "4S", "P", "P", "P"],
    },
  },

  // Board 11-5: Dichiara N, Vul. NS
  // North: S-K542 H-QJ109 D-J3 C-AJ5
  // West: S-963 H-K52 D-AK7 C-K1097
  // East: S-AQJ10 H-A743 D-Q95 C-32
  // South: S-87 H-86 D-108642 C-Q864
  {
    id: "11-5",
    lesson: 11,
    board: 5,
    title: "L'intervento",
    contract: "3NT",
    declarer: "west",
    openingLead: { suit: "heart", rank: "Q" },
    vulnerability: "ns",
    hands: {
      north: [S("K"), S("5"), S("4"), S("2"), H("Q"), H("J"), H("10"), H("9"), D("J"), D("3"), C("A"), C("J"), C("5")],
      west:  [S("9"), S("6"), S("3"), H("K"), H("5"), H("2"), D("A"), D("K"), D("7"), C("K"), C("10"), C("9"), C("7")],
      east:  [S("A"), S("Q"), S("J"), S("10"), H("A"), H("7"), H("4"), H("3"), D("Q"), D("9"), D("5"), C("3"), C("2")],
      south: [S("8"), S("7"), H("8"), H("6"), D("10"), D("8"), D("6"), D("4"), D("2"), C("Q"), C("8"), C("6"), C("4")],
    },
    commentary: "La licita. Perfetto il Contro di Est: H e S, e almeno 2-3 D. Ovest non ha bisogno d'altro per decidere, sa di avere in linea forza di manche ma nessun fit nobile di 8 carte; K109x sono un fermo eccellente (ammesso che le fiori di Nord siano reali), quindi che altro, se non 3NT? Il gioco. L'attacco non disturba, Ovest ferma due volte. Conta 2H, 3D... e basterebbe fare 4 S per mantenere il contratto (il K in Nord e al 99%!). Volendo muovere immediatamente le S Ovest vince in mano e gioca S al 10. Rientra a D e ripete: S al Fante. Rientra a D e ultimo impasse. E 9 prese garantite. (possibili 10, vedete come?). 3NT, in prima: 400 (o 3NT + 1: 430).",
    bidding: {
      dealer: "north",
      bids: ["1C", "X", "P", "3NT", "P", "P", "P"],
    },
  },

  // Board 11-6: Dichiara E, Vul. EO
  // North: S-Q1094 H-93 D-QJ5 C-J653
  // West: S-AJ76 H-QJ105 D-87 C-KQ8
  // East: S-8532 H-876 D-63 C-A1072
  // South: S-K H-AK42 D-AK10942 C-94
  {
    id: "11-6",
    lesson: 11,
    board: 6,
    title: "L'intervento",
    contract: "3D",
    declarer: "south",
    openingLead: { suit: "club", rank: "K" },
    vulnerability: "ew",
    hands: {
      north: [S("Q"), S("10"), S("9"), S("4"), H("9"), H("3"), D("Q"), D("J"), D("5"), C("J"), C("6"), C("5"), C("3")],
      west:  [S("A"), S("J"), S("7"), S("6"), H("Q"), H("J"), H("10"), H("5"), D("8"), D("7"), C("K"), C("Q"), C("8")],
      east:  [S("8"), S("5"), S("3"), S("2"), H("8"), H("7"), H("6"), D("6"), D("3"), C("A"), C("10"), C("7"), C("2")],
      south: [S("K"), H("A"), H("K"), H("4"), H("2"), D("A"), D("K"), D("10"), D("9"), D("4"), D("2"), C("9"), C("4")],
    },
    commentary: "La licita. Perfetto il Contro, Est DEVE dichiarare un colore (1S: 4+ carte, da zero a 9-10). Sud ha carte con cui non e giusto rassegnarsi: ha 14 (il K di S e presumibilmente un valore nullo) ma, se gioca nei suoi colori, ha molte prese; quando dichiara 2H mostra la quarta, e 5+ D: Nord non dorma, e riporti a 3D. Il gioco. Se Ovest ha attaccato e proseguito a C, Sud taglia e conta: 6D, 2H, 2 tagli al morto. Tagliata la prosecuzione gioca AK di H e ne taglia una, rientra in mano in atout e ne taglia un'altra. 10 prese. Se l'attacco e stato piccola S (ma davvero?? sotto asso??) ne confezionera 11. 3D+ 1: 130.",
    bidding: {
      dealer: "east",
      bids: ["P", "1D", "X", "P", "1S", "2H", "P", "3D", "P", "P", "P"],
    },
  },

  // Board 11-7: Dichiara S, Vul. Tutti
  // North: S-K643 H-93 D-QJ6 C-10942
  // West: S-AJ109 H-KQJ5 D-32 C-J76
  // East: S-Q52 H-A10864 D-K98 C-85
  // South: S-87 H-72 D-A10754 C-AKQ3
  {
    id: "11-7",
    lesson: 11,
    board: 7,
    title: "L'intervento",
    contract: "2H",
    declarer: "east",
    openingLead: { suit: "club", rank: "A" },
    vulnerability: "all",
    hands: {
      north: [S("K"), S("6"), S("4"), S("3"), H("9"), H("3"), D("Q"), D("J"), D("6"), C("10"), C("9"), C("4"), C("2")],
      west:  [S("A"), S("J"), S("10"), S("9"), H("K"), H("Q"), H("J"), H("5"), D("3"), D("2"), C("J"), C("7"), C("6")],
      east:  [S("Q"), S("5"), S("2"), H("A"), H("10"), H("8"), H("6"), H("4"), D("K"), D("9"), D("8"), C("8"), C("5")],
      south: [S("8"), S("7"), H("7"), H("2"), D("A"), D("10"), D("7"), D("5"), D("4"), C("A"), C("K"), C("Q"), C("3")],
    },
    commentary: "La licita. Est e tenuto a scegliere un colore, e non ha dubbi su quale dire. Non ha carte sufficienti per dire 4H, ma ha carte troppo belle per dire solo 1H (la stessa dichiarazione che farebbe con xxx xxxx xxx xxx!) La via di mezzo, 2H, mostra 8-10 e 5 carte, e significa 'sono contento del contratto che sto dichiarando'. Ovest non si lasci ipnotizzare dalla ricchezza a H: ha 12, il minimo, deve accontentarsi e passare. Il gioco. Mano facile: tagliato il terzo C Est batte atout e prova l'impasse a S. Purtroppo va male e la difesa (Q di D di Nord) incassa 2 D, ma il contratto e salvo. 2H: 110.",
    bidding: {
      dealer: "south",
      bids: ["1D", "X", "P", "2H", "P", "P", "P"],
    },
  },

  // Board 11-8: Dichiara O, Vul. Nessuno
  // North: S-KQ10 H-A62 D-9875 C-A98
  // West: S-97432 H-J93 D-Q643 C-3
  // East: S-J865 H-10 D-AJ C-KJ10542
  // South: S-A H-KQ8754 D-K102 C-Q76
  {
    id: "11-8",
    lesson: 11,
    board: 8,
    title: "L'intervento",
    contract: "4H",
    declarer: "south",
    openingLead: { suit: "club", rank: "3" },
    vulnerability: "none",
    hands: {
      north: [S("K"), S("Q"), S("10"), H("A"), H("6"), H("2"), D("9"), D("8"), D("7"), D("5"), C("A"), C("9"), C("8")],
      west:  [S("9"), S("7"), S("4"), S("3"), S("2"), H("J"), H("9"), H("3"), D("Q"), D("6"), D("4"), D("3"), C("3")],
      east:  [S("J"), S("8"), S("6"), S("5"), H("10"), D("A"), D("J"), C("K"), C("J"), C("10"), C("5"), C("4"), C("2")],
      south: [S("A"), H("K"), H("Q"), H("8"), H("7"), H("5"), H("4"), D("K"), D("10"), D("2"), C("Q"), C("7"), C("6")],
    },
    commentary: "La licita. Sull'intervento di Est Sud dichiara le sue H (mostrando 11+ e almeno 5 carte) e, quando sente l'appoggio di Nord, dichiara la manche. Il gioco. Sud deve entrare in allarme: il 3 e un singolo. Quindi prende con l'Asso, incassa l'Asso di S e ora, volendo andare al morto per sfruttare K e Q e scartare le due C, deve essere certo che gli avversari non abbiano piu atout quando li incassera. Pertanto, visto che le H potrebbero essere 3-1, gioca Re e Dama di H e poi H all'Asso. Scarta le due C e infine tenta con successo l'expasse al K di D. 4H + 1, in prima: 450.",
    bidding: {
      dealer: "west",
      bids: ["P", "1D", "2C", "2H", "P", "3H", "P", "4H", "P", "P", "P"],
    },
  },

  // ============================================================
  // LESSON 12 - Dichiarare in competizione
  // ============================================================

  // Board 12-1: Dichiara N, Vul. Nessuno
  // North: S-84 H-A953 D-K1085 C-932
  // West: S-QJ3 H-K6 D-AQJ2 C-J876
  // East: S-752 H-QJ102 D-943 C-AK4
  // South: S-AK1096 H-874 D-76 C-Q105
  {
    id: "12-1",
    lesson: 12,
    board: 1,
    title: "Dichiarare in competizione",
    contract: "1NT",
    declarer: "west",
    openingLead: { suit: "spade", rank: "8" },
    vulnerability: "none",
    hands: {
      north: [S("8"), S("4"), H("A"), H("9"), H("5"), H("3"), D("K"), D("10"), D("8"), D("5"), C("9"), C("3"), C("2")],
      west:  [S("Q"), S("J"), S("3"), H("K"), H("6"), D("A"), D("Q"), D("J"), D("2"), C("J"), C("8"), C("7"), C("6")],
      east:  [S("7"), S("5"), S("2"), H("Q"), H("J"), H("10"), H("2"), D("9"), D("4"), D("3"), C("A"), C("K"), C("4")],
      south: [S("A"), S("K"), S("10"), S("9"), S("6"), H("8"), H("7"), H("4"), D("7"), D("6"), C("Q"), C("10"), C("5")],
    },
    commentary: "La licita. Ovest ha una mano di forza normale: anche se ha il fermo a S, NON deve dire 1NT 'liberamente' al primo giro (mostrerebbe 18-20!) Deve aspettare una autorizzazione del compagno (Contro: 'dichiara ancora, abbiamo piu punti di loro'). Il gioco. Si interviene anche per dare un buon attacco, Nord deve fidarsi e attaccare con l'8 di S (da 2 carte sempre la piu alta). Se Sud si ingolosisce e incassa A e K, fara solo quelle due prese (e Ovest 1NT + 1: 1S, 3H, 2D e 2C) perche Nord, che entra in presa due volte, ha solo 2 S. Se Sud liscia l'attacco (Colpo in bianco!) e se Nord fiducioso rigiochera S, Sud fara 4 prese nel colore, e Ovest 1NT giusto. 1NT: 90.",
    bidding: {
      dealer: "north",
      bids: ["P", "P", "1S", "P", "P", "X", "P", "1NT", "P", "P", "P"],
    },
  },

  // Board 12-2: Dichiara E, Vul. NS
  // North: S-3 H-1087 D-J542 C-Q10743
  // West: S-KJ76 H-J95 D-Q873 C-AK
  // East: S-AQ42 H-32 D-AK106 C-865
  // South: S-10985 H-AKQ64 D-9 C-J92
  {
    id: "12-2",
    lesson: 12,
    board: 2,
    title: "Dichiarare in competizione",
    contract: "4S",
    declarer: "east",
    openingLead: { suit: "heart", rank: "A" },
    vulnerability: "ns",
    hands: {
      north: [S("3"), H("10"), H("8"), H("7"), D("J"), D("5"), D("4"), D("2"), C("Q"), C("10"), C("7"), C("4"), C("3")],
      west:  [S("K"), S("J"), S("7"), S("6"), H("J"), H("9"), H("5"), D("Q"), D("8"), D("7"), D("3"), C("A"), C("K")],
      east:  [S("A"), S("Q"), S("4"), S("2"), H("3"), H("2"), D("A"), D("K"), D("10"), D("6"), C("8"), C("6"), C("5")],
      south: [S("10"), S("9"), S("8"), S("5"), H("A"), H("K"), H("Q"), H("6"), H("4"), D("9"), C("J"), C("9"), C("2")],
    },
    commentary: "La licita. Su 1H di Sud, Ovest cerca il fit 4-4 a S usando il Contro (1S mostrerebbe 5+ carte) e, avendolo trovato, rialza a manche. Il gioco. Sud prosegue a H finche Est non taglia. Est conta 11 prese: 4S, 1 taglio, 2C e probabilmente 4D. Le atout vanno battute (altrimenti le D non sono incassabili) e la brutta sorpresa e che Sud ne ha 4. Poco male, puo togliergliele tutte e poi dedicarsi alle D. Attenzione: potrebbero essere divise male, e se cosi fosse la lunga e probabilmente in Nord: In Sud ha gia visto 9 carte tra H e S. Quindi un onore di D della mano, e poi D alla Dama, per essere dalla parte giusta per catturare l'eventuale fante quarto in Nord. 4S +1, in seconda: 650.",
    bidding: {
      dealer: "east",
      bids: ["1D", "1H", "X", "P", "1S", "P", "4S", "P", "P", "P"],
    },
  },

  // Board 12-3: Dichiara S, Vul. EO
  // North: S-AQ63 H-KJ106 D-64 C-A73
  // West: S-J7 H-874 D-AQ9732 C-J6
  // East: S-109842 H-A95 D-85 C-1094
  // South: S-K5 H-Q32 D-KJ10 C-KQ852
  {
    id: "12-3",
    lesson: 12,
    board: 3,
    title: "Dichiarare in competizione",
    contract: "3NT",
    declarer: "south",
    openingLead: { suit: "diamond", rank: "2" },
    vulnerability: "ew",
    hands: {
      north: [S("A"), S("Q"), S("6"), S("3"), H("K"), H("J"), H("10"), H("6"), D("6"), D("4"), C("A"), C("7"), C("3")],
      west:  [S("J"), S("7"), H("8"), H("7"), H("4"), D("A"), D("Q"), D("9"), D("7"), D("3"), D("2"), C("J"), C("6")],
      east:  [S("10"), S("9"), S("8"), S("4"), S("2"), H("A"), H("9"), H("5"), D("8"), D("5"), C("10"), C("9"), C("4")],
      south: [S("K"), S("5"), H("Q"), H("3"), H("2"), D("K"), D("J"), D("10"), C("K"), C("Q"), C("8"), C("5"), C("2")],
    },
    commentary: "La licita. Punti pochi, ma bel colore: 1D di Ovest e legittimo. Nord usa il Contro per trovare fit a H o a S, ma Sud non ha quarte da dichiarare. Poiche a D ha KJ10, la dichiarazione di 1NT e decisamente meglio della ripetizione delle C. Sfumata la possibilita di giocare una manche nobile Nord rialza a 3NT. Il gioco. Pur sapendo di regalare probabilmente una presa Ovest fa un investimento sul proprio colore e ci attacca. Sud vince con il 10, e si rende conto che AQ sono 'sopra' il suo KJ... quindi affrancare le H sarebbe molto pericoloso (l'Asso potrebbe essere in Est). Pertanto si garantisce le sue nove prese: 5C e 3S. Fara in effetti 3NT giusti, mentre avrebbe potuto fare 3NT+1 (affrancando le H) se Ovest non avesse attaccato a D. 3NT, in prima: 400.",
    bidding: {
      dealer: "south",
      bids: ["1C", "1D", "X", "P", "1NT", "P", "3NT", "P", "P", "P"],
    },
  },

  // Board 12-4: Dichiara O, Vul. TUTTI
  // North: S-KQ64 H-A65 D-AKJ73 C-4
  // West: S-982 H-1032 D-952 C-K1092
  // East: S-A7 H-KQJ74 D-104 C-Q863
  // South: S-J1053 H-98 D-Q86 C-AJ75
  {
    id: "12-4",
    lesson: 12,
    board: 4,
    title: "Dichiarare in competizione",
    contract: "4S",
    declarer: "north",
    openingLead: { suit: "heart", rank: "K" },
    vulnerability: "all",
    hands: {
      north: [S("K"), S("Q"), S("6"), S("4"), H("A"), H("6"), H("5"), D("A"), D("K"), D("J"), D("7"), D("3"), C("4")],
      west:  [S("9"), S("8"), S("2"), H("10"), H("3"), H("2"), D("9"), D("5"), D("2"), C("K"), C("10"), C("9"), C("2")],
      east:  [S("A"), S("7"), H("K"), H("Q"), H("J"), H("7"), H("4"), D("10"), D("4"), C("Q"), C("8"), C("6"), C("3")],
      south: [S("J"), S("10"), S("5"), S("3"), H("9"), H("8"), D("Q"), D("8"), D("6"), C("A"), C("J"), C("7"), C("5")],
    },
    commentary: "La licita. Con 17 sbilanciati l'apertura corretta e 1D; Sud cerca fit a S usando il contro (punteggio minimo, ma distribuzione perfetta) e Nord si deve rendere conto di dover raccontare sia le S che la forza... quindi non 1S (che direbbe anche con 12) ma DUE. Sud ora sa che il compagno ha mano di Rever, che i suoi pochi punti saranno tutti utili - soprattutto la preziosa Q di D, sulla lunga di Nord - e rialza a manche. Il gioco. Vinto l'attacco Nord conta: 3S, 1H, 5D, 1C e almeno un taglio. Non puo evitare di perdere una S, e anche una H. Muove il Re di S, cede la H, vince qualsiasi ritorno e allinea le restanti 11 prese senza difficolta. 4S + 1, in seconda: 650.",
    bidding: {
      dealer: "west",
      bids: ["P", "1D", "1H", "X", "P", "2S", "P", "4S", "P", "P", "P"],
    },
  },

  // Board 12-5: Dichiara N, Vul. NS
  // North: S-103 H-K1082 D-KQJ2 C-AJ10
  // West: S-874 H-J93 D-4 C-Q76532
  // East: S-AKJ62 H-76 D-A953 C-98
  // South: S-Q95 H-AQ54 D-10876 C-K4
  {
    id: "12-5",
    lesson: 12,
    board: 5,
    title: "Dichiarare in competizione",
    contract: "4H",
    declarer: "north",
    openingLead: { suit: "spade", rank: "A" },
    vulnerability: "ns",
    hands: {
      north: [S("10"), S("3"), H("K"), H("10"), H("8"), H("2"), D("K"), D("Q"), D("J"), D("2"), C("A"), C("J"), C("10")],
      west:  [S("8"), S("7"), S("4"), H("J"), H("9"), H("3"), D("4"), C("Q"), C("7"), C("6"), C("5"), C("3"), C("2")],
      east:  [S("A"), S("K"), S("J"), S("6"), S("2"), H("7"), H("6"), D("A"), D("9"), D("5"), D("3"), C("9"), C("8")],
      south: [S("Q"), S("9"), S("5"), H("A"), H("Q"), H("5"), H("4"), D("10"), D("8"), D("7"), D("6"), C("K"), C("4")],
    },
    commentary: "La licita. Est interviene nel suo colore e Sud, che deve tenere le D come ruota di scorta, cerca fit a H con il Contro. Nord, su invito del compagno, descrive la quarta e, poiche ha mano di Diritto massima accetta l'invito di Sud (3H = 11) e rialza. Il controgioco. L'attacco di Asso di S e scontato, ma quando scende il morto Est si deve fermare! Nord ha aperto 1D (DOVEROSO ricordarsi sempre la dichiarazione!), Sud e sceso con 4 carte... quindi Ovest ha una D sola, e giocando Asso di S e D tagliera. Non incassare il Re di S e fondamentale, perche e la presa con cui Ovest ridara la mano a Est per poter fare un altro taglio: una sotto. 4H - 1, in seconda: -100.",
    bidding: {
      dealer: "north",
      bids: ["1D", "1S", "X", "P", "2H", "P", "3H", "P", "4H", "P", "P", "P"],
    },
  },

  // Board 12-6: Dichiara E, Vul. EO
  // North: S-K8 H-J96 D-106432 C-832
  // West: S-Q76 H-103 D-J7 C-KQ10964
  // East: S-J543 H-AK54 D-KQ85 C-J
  // South: S-A1092 H-Q872 D-A9 C-A75
  {
    id: "12-6",
    lesson: 12,
    board: 6,
    title: "Dichiarare in competizione",
    contract: "2C",
    declarer: "west",
    openingLead: { suit: "spade", rank: "K" },
    vulnerability: "ew",
    hands: {
      north: [S("K"), S("8"), H("J"), H("9"), H("6"), D("10"), D("6"), D("4"), D("3"), D("2"), C("8"), C("3"), C("2")],
      west:  [S("Q"), S("7"), S("6"), H("10"), H("3"), D("J"), D("7"), C("K"), C("Q"), C("10"), C("9"), C("6"), C("4")],
      east:  [S("J"), S("5"), S("4"), S("3"), H("A"), H("K"), H("5"), H("4"), D("K"), D("Q"), D("8"), D("5"), C("J")],
      south: [S("A"), S("10"), S("9"), S("2"), H("Q"), H("8"), H("7"), H("2"), D("A"), D("9"), C("A"), C("7"), C("5")],
    },
    commentary: "La licita. Sud ha un Contro perfetto: entrambe le quarte maggiori e tolleranza per il minore restante. Il 2C di Ovest non e affatto 'forzante': lo sarebbe se Sud fosse passato, o avesse detto 1H o 1S. Dopo il Contro, qualsiasi colore significa 'sarei contento se tu mi lasciassi giocare questo contratto'. Per Est, anche se a malincuore, la dichiarazione vincente e Passo. Il gioco. Ottima idea l'attacco di K di S (uno dei colori che Sud ha implicitamente mostrato), per aprirsi un taglio. Ed in effetti la difesa inizia con K di S, S all'Asso, S taglio. Ma Ovest e in una botte di ferro: perdera solo piu l'Asso di D e quello di C. Anche col senno di poi, 2C era il miglior parziale per Est Ovest. 2C: 90.",
    bidding: {
      dealer: "east",
      bids: ["1D", "X", "2C", "P", "P", "P"],
    },
  },

  // Board 12-7: Dichiara S, Vul. Tutti
  // North: S-KJ10974 H-A103 D-Q43 C-9
  // West: S-53 H-Q865 D-J109 C-A1052
  // East: S-AQ6 H-K4 D-A865 C-KQJ7
  // South: S-82 H-J972 D-K72 C-8643
  {
    id: "12-7",
    lesson: 12,
    board: 7,
    title: "Dichiarare in competizione",
    contract: "3NT",
    declarer: "east",
    openingLead: { suit: "spade", rank: "8" },
    vulnerability: "all",
    hands: {
      north: [S("K"), S("J"), S("10"), S("9"), S("7"), S("4"), H("A"), H("10"), H("3"), D("Q"), D("4"), D("3"), C("9")],
      west:  [S("5"), S("3"), H("Q"), H("8"), H("6"), H("5"), D("J"), D("10"), D("9"), C("A"), C("10"), C("5"), C("2")],
      east:  [S("A"), S("Q"), S("6"), H("K"), H("4"), D("A"), D("8"), D("6"), D("5"), C("K"), C("Q"), C("J"), C("7")],
      south: [S("8"), S("2"), H("J"), H("9"), H("7"), H("2"), D("K"), D("7"), D("2"), C("8"), C("6"), C("4"), C("3")],
    },
    commentary: "La licita. Est, con 19 bilanciati, progetta la sequenza '1D poi 2NT', ma visto che Nord e intervenuto con 1S il salto non serve piu: 1NT, detto liberamente, mostra gia quel tipo di mano. Con una bilanciata di Diritto Est, pur col fermo, avrebbe detto Passo. Ovest non deve dormire: 25-27 in linea ci sono. Il gioco. Sud segue l'indicazione del compagno e attacca con l'8 di S; Est vince la presa e conta: 2S, 1H, 4D. Affrancare 1H non basta per arrivare a 9, ma affrancare altre due D si: facendo l'impasse due volte si faranno 3 prese sempre, tranne che con K e Q entrambi in Sud (1 volta su 4), Quindi S al 10 e J di D per il primo impasse (quello che di solito va male), poi C all'Asso e secondo impasse (quello che di solito va bene!) Nota: Se Sud rigioca S Est fara 3NT giusti. Se gioca altro... 3NT+1. 3NT, in seconda: 600.",
    bidding: {
      dealer: "south",
      bids: ["P", "P", "P", "1D", "P", "1H", "1S", "1NT", "P", "3NT", "P", "P", "P"],
    },
  },

  // Board 12-8: Dichiara O, Vul. Nessuno
  // North: S-A652 H-AQ103 D-52 C-A42
  // West: S-Q87 H-K76 D-A10873 C-K6
  // East: S-10943 H-954 D-K9 C-8753
  // South: S-KJ H-J82 D-QJ64 C-QJ109
  {
    id: "12-8",
    lesson: 12,
    board: 8,
    title: "Dichiarare in competizione",
    contract: "3NT",
    declarer: "south",
    openingLead: { suit: "diamond", rank: "3" },
    vulnerability: "none",
    hands: {
      north: [S("A"), S("6"), S("5"), S("2"), H("A"), H("Q"), H("10"), H("3"), D("5"), D("2"), C("A"), C("4"), C("2")],
      west:  [S("Q"), S("8"), S("7"), H("K"), H("7"), H("6"), D("A"), D("10"), D("8"), D("7"), D("3"), C("K"), C("6")],
      east:  [S("10"), S("9"), S("4"), S("3"), H("9"), H("5"), H("4"), D("K"), D("9"), C("8"), C("7"), C("5"), C("3")],
      south: [S("K"), S("J"), H("J"), H("8"), H("2"), D("Q"), D("J"), D("6"), D("4"), C("Q"), C("J"), C("10"), C("9")],
    },
    commentary: "La licita. Sul Contro di Nord (carte da manuale: entrambe le quarte maggiori, e tolleranza per le C) Sud si ritrova con 11 punti ma senza possibilita di gioco nei maggiori del compagno. In compenso, QJxx di D sono un fermo granitico, quindi propone di giocare a Senza. Non 3, non 1: 2NT descrive proprio l'incertezza sulla somma punti (11), Nord ha 14 e rialza a 3NT. Il gioco. Sull'attacco Est gioca il Re e ritorna nel colore, per il J di Sud e l'Asso di Ovest che insiste con il 10 affrancando il colore. Ora pero il gioco di Sud e a 'carte viste': quando ha mostrato il K di D Est ha gia fatto vedere tutta la sua ricchezza, tutto il resto costituisce l'apertura di Ovest! Quindi l'impasse a C si fa a occhi chiusi e poi quello a H anche. Quello di picche... meglio evitarlo!! 3NT + 2, in prima: 460.",
    bidding: {
      dealer: "west",
      bids: ["1D", "X", "P", "2NT", "P", "3NT", "P", "P", "P"],
    },
  },
];
