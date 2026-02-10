/**
 * FIGB Corso Cuori Gioco - Smazzate Didattiche (Practice Hands)
 * Extracted from official FIGB teaching materials
 *
 * Lesson 1: La prima presa
 * Lesson 2: Il Fit 5-3 e 4-4
 * Lesson 3: Il conto e i preferenziali
 * Lesson 4: I colori da muovere in difesa
 * Lesson 5: I giochi di sicurezza
 * Lesson 6: Probabilita e percentuali
 * Lesson 7: Coprire o non coprire
 * Lesson 8: I giochi di eliminazione
 * Lesson 9: Giocare come se
 * Lesson 10: Le deduzioni del giocante
 */

import type { Suit, Rank, Card, Position } from "../lib/bridge-engine";
import type { Vulnerability, BiddingData, Smazzata } from "./smazzate";

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

export const cuoriGiocoSmazzate: Smazzata[] = [
  // ==========================================================================
  // LESSON 1: La prima presa
  // ==========================================================================
  {
    id: "CG1-1", lesson: 1, board: 1, title: "La prima presa",
    contract: "3NT", declarer: "east", openingLead: c("spade", "10"), vulnerability: "none",
    hands: {
      north: hand(["A", "J", "8", "7", "5"], ["J", "9", "2"], ["8", "2"], ["K", "Q", "J"]),
      east: hand(["K", "9", "3"], ["8", "4"], ["A", "J", "5", "4"], ["A", "10", "8", "6"]),
      south: hand(["10", "4"], ["10", "7", "6", "3"], ["K", "6", "3"], ["7", "5", "4", "3"]),
      west: hand(["Q", "6", "2"], ["A", "K", "Q", "5"], ["Q", "10", "9", "7"], ["9", "2"]),
    },
    commentary: "Ovest ha contrato in riapertura. La figura delle picche e chiara e il 9 di picche e prezioso perche dara una seconda presa comunque... a patto che venga messa la Q del morto sull'attacco. Diversamente, sulla piccola, Nord si limitera a invitare. E quando Sud, in presa a quadri, rigiochera picche Nord fara 4 prese filate. In una smazzata, Assi Re e Dame si disputano si e no 7/8 prese su 13. I protagonisti sono i 10, i 9 e a volte gli 8.",
    bidding: { dealer: "north", bids: ["1S", "P", "P", "Dbl", "P", "1NT", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG1-2", lesson: 1, board: 2, title: "La prima presa",
    contract: "3NT", declarer: "west", openingLead: c("heart", "3"), vulnerability: "none",
    hands: {
      north: hand(["Q", "10", "2"], ["K", "9", "7", "6", "3"], ["10", "3", "2"], ["6", "5"]),
      east: hand(["6", "5"], ["Q", "10", "4"], ["Q", "J", "9", "8", "4"], ["J", "7", "4"]),
      south: hand(["A", "K", "9", "7"], ["A", "J", "2"], ["A", "K"], ["A", "8", "3", "2"]),
      west: hand(["J", "8", "4", "3"], ["8", "5"], ["7", "6", "5"], ["K", "Q", "10", "9"]),
    },
    commentary: "Non e cosi male l'attacco per Ovest, ma deve garantirsi un passaggio al morto nel colore, visto che le Quadri sono bloccate. E' necessario rinunciare alla facile presa di Fante (o di 10 del morto) altrimenti le Quadri saranno irraggiungibili. Ovest deve vincere la prima presa con l'Asso, sbloccare AK di quadri, e poi a sua scelta giocare il 2 per il 10, o il Fante per la Dama: lo portera al morto di sicuro, anche se l'attacco fosse stato diverso. Sull'attacco siate pronti a usare carte alte, se non vi costa nulla e vi agevola nei collegamenti.",
    bidding: { dealer: "south", bids: ["P", "2C", "P", "2D", "P", "2NT", "P", "3NT"] },
  },
  {
    id: "CG1-3", lesson: 1, board: 3, title: "La prima presa",
    contract: "3NT", declarer: "south", openingLead: c("heart", "K"), vulnerability: "none",
    hands: {
      north: hand(["A", "Q", "2"], ["8", "5"], ["A", "10", "7", "6", "3"], ["9", "8", "6"]),
      east: hand(["J", "10", "6", "5"], ["7", "4", "2"], ["K", "4", "2"], ["K", "4", "3"]),
      south: hand(["K", "7", "4", "3"], ["A", "J", "6"], ["Q", "J", "5"], ["A", "J", "10"]),
      west: hand(["9", "8"], ["K", "Q", "10", "9", "3"], ["9", "8"], ["Q", "7", "5", "2"]),
    },
    commentary: "Con 6 vincenti e almeno 3 quadri affrancabili il contratto e salvo, ma se ora Sud vince l'attacco corre un grave pericolo: qualora il K di quadri fosse in Est, il rinvio a cuori annienterebbe il suo J di cuori. Questa e una figura classica: Sud NON prende, e lascia a Ovest una scelta: o continua a cuori regalando una presa. Lisciare l'attacco e una strategia che deve sempre avere una motivazione legata al gioco. 'Liscio perche i bravi ogni tanto lo fanno'... non lo e.",
    bidding: { dealer: "south", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG1-4", lesson: 1, board: 4, title: "La prima presa",
    contract: "4H", declarer: "north", openingLead: c("diamond", "J"), vulnerability: "none",
    hands: {
      north: hand(["K", "Q", "7"], ["K", "J", "7", "2"], ["K", "10"], ["Q", "8", "7", "2"]),
      east: hand(["9", "6", "5", "3", "2"], ["10", "8", "4"], ["J", "5"], ["10", "6", "3"]),
      south: hand(["10", "4"], ["A", "9"], ["A", "Q", "9", "8", "3"], ["K", "J", "9", "5"]),
      west: hand(["A", "J", "8"], ["Q", "6", "5", "3"], ["7", "6", "4", "2"], ["A", "4"]),
    },
    commentary: "Sud ha 11, quanto basta per usare la surlicita. Trovato fit rialza a 3 cuori, mostrando i requisiti minimi; ma Nord ha 14 e rialza a manche. La presenza del 10 evidenzia che Est sta attaccando da Jx o J secco. Ovest prende e rigioca quadri. La soluzione: picche al J e piccola cuori verso la mano. Fate caso alle 'carte spia'. Vi diranno a volte come e diviso un colore.",
    bidding: { dealer: "south", bids: ["1D", "P", "2H", "P", "3H", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG1-5", lesson: 1, board: 5, title: "La prima presa",
    contract: "4S", declarer: "east", openingLead: c("heart", "2"), vulnerability: "none",
    hands: {
      north: hand(["10"], ["J", "8"], ["Q", "10", "9", "8"], ["A", "9", "7", "6", "3", "2"]),
      east: hand(["A", "J", "6", "4", "2"], ["K", "4"], ["K", "7", "6", "2"], ["Q", "4"]),
      south: hand(["Q", "9", "8"], ["Q", "7", "6", "5", "2"], ["J", "4"], ["K", "10", "5"]),
      west: hand(["K", "7", "5", "3"], ["A", "10", "9", "3"], ["A", "5", "3"], ["J", "8"]),
    },
    commentary: "L'attacco a cuori e implicito, per esclusione. Est perdera 3 prese nei colori minori e tutto pare affidato alla caduta della Q. Nel dubbio, e saggio inserire sull'attacco il 9 o il 10; catturato il J con il K Est trovera una brutta sorpresa a picche, ma una chance di salvezza c'e ancora. Che una giocata meticolosa salvi contratto avviene molto piu spesso di quanto crediate.",
    bidding: { dealer: "west", bids: ["P", "1S", "P", "4S", "P", "P"] },
  },
  {
    id: "CG1-6", lesson: 1, board: 6, title: "La prima presa",
    contract: "4H", declarer: "north", openingLead: c("spade", "3"), vulnerability: "none",
    hands: {
      north: hand(["9", "7", "4"], ["A", "K", "J", "10", "8", "7"], ["A"], ["A", "Q", "2"]),
      east: hand(["Q", "5", "3"], ["9", "6", "3"], ["6", "4", "3"], ["9", "7", "6", "5"]),
      south: hand(["10", "8", "6", "2"], ["Q", "4", "2"], ["Q", "J", "10", "2"], ["K", "8"]),
      west: hand(["A", "K", "J"], ["5"], ["K", "9", "8", "7", "5"], ["J", "10", "4", "3"]),
    },
    commentary: "Nord Contra e poi 'rimuove', mostrando mano di 17 e oltre. Sud lo premia saltando a manche. Sappiamo che il K di picche e in Ovest. Nord ha 10 prese ma puo fare di piu se conserva QJ10 per dopo; incassa AK cuori e ancora cuori. Se Ovest copre, taglia, torna al morto K fiori e scarta picche sulle DUE quadri affrancate. Se non copre, Nord scarta. 12 prese. Se avete una linea di gioco tecnica che vi consentira un affrancamento di taglio al 100%, evitate le piccole astuzie.",
    bidding: { dealer: "east", bids: ["P", "1D", "Dbl", "P", "1S", "P", "2H", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG1-7", lesson: 1, board: 7, title: "La prima presa",
    contract: "3NT", declarer: "east", openingLead: c("diamond", "2"), vulnerability: "none",
    hands: {
      north: hand(["10", "6", "2"], ["K", "7", "5", "4"], ["A", "7"], ["A", "10", "9", "5"]),
      east: hand(["9", "8", "4"], ["J", "10", "8", "3"], ["Q", "8"], ["8", "6", "3", "2"]),
      south: hand(["A", "5", "3"], ["Q", "6", "2"], ["K", "J", "9", "6", "2"], ["7", "4"]),
      west: hand(["K", "Q", "J", "7"], ["A", "9"], ["10", "5", "4", "3"], ["K", "Q", "J"]),
    },
    commentary: "Non picche: le ha il vivo; non cuori: le ha il morto; non fiori: se Est avesse una buona lunga di fiori avrebbe la Stayman per suggerire l'attacco. Quadri e in effetti il peggior attacco. Ovest non ha KQJ di quadri, avrebbe attaccato con il K. Almeno UN pezzo e in Est. Quindi si mette l'Asso! Il 10 che resta in mano rendera impossibile a EO l'incasso delle 4 quadri affrancate. Lisciare per tagliare i collegamenti, o prendere sperando di bloccare il colore, sono due strategie opposte. Sta a voi capire quando usare una e quando l'altra.",
    bidding: { dealer: "south", bids: ["1NT", "P", "2C", "P", "2D", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG1-8", lesson: 1, board: 8, title: "La prima presa",
    contract: "4S", declarer: "west", openingLead: c("spade", "9"), vulnerability: "none",
    hands: {
      north: hand(["9", "3"], ["K", "9", "5", "4"], ["9", "8", "7"], ["8", "5", "4", "3"]),
      east: hand(["6", "5", "4", "2"], ["A", "7", "6", "2"], ["Q", "10", "2"], ["Q", "6"]),
      south: hand(["A", "Q", "J", "10"], ["3"], ["K", "J", "3"], ["A", "J", "10", "9", "2"]),
      west: hand(["K", "8", "7"], ["Q", "J", "10", "8"], ["A", "6", "5", "4"], ["K", "7"]),
    },
    commentary: "L'attacco quadri non e scontato ma probabilmente il migliore. Ovest sceglie una replica morbida (il singolo nelle cuori di Est non e un fattore positivo, anzi). Est mostra fit in mano limite. Una mano molto semplice, basta non farsi prendere dallo sconforto quando si osserva la consistenza delle atout in linea. Non esiste nessun altro contratto in cui si poteva evitare di pagare AKQ di picche! Evitate di cominciare a pensare solo dopo essere entrati in presa. La pigrizia costa cara!",
    bidding: { dealer: "south", bids: ["1C", "P", "1H", "P", "1S", "P", "2S", "P", "4S", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 2: Il Fit 5-3 e 4-4
  // ==========================================================================
  {
    id: "CG2-1", lesson: 2, board: 1, title: "Il Fit 5-3 e 4-4",
    contract: "4S", declarer: "west", openingLead: c("club", "2"), vulnerability: "none",
    hands: {
      north: hand(["8", "6"], ["J", "9", "8", "4", "3"], ["Q", "J"], ["K", "10", "7", "2"]),
      east: hand(["A", "Q", "J", "10", "4"], ["K", "7", "5"], ["A", "K", "9", "7"], ["A"]),
      south: hand(["9", "7", "5"], ["A", "Q", "10"], ["10", "8", "6"], ["J", "8", "6", "5"]),
      west: hand(["K", "3", "2"], ["6", "2"], ["5", "4", "3", "2"], ["Q", "9", "4", "3"]),
    },
    commentary: "Ovest porta una presa, e rialza a 4 picche. Se l'attacco e piccola fiori, Nord deve inserire il 10 e non il K. Est manterra il contratto se gioca subito cuori dalla mano, rinunciando all'expasse: per farlo dovrebbe usare il K di picche, e Sud in presa con A cuori e' assicurato. L'attacco in atout puo essere molto piu efficace quando l'avversario sta giocando con un fit 5-3 che quando gioca con la 4-4; la 4-4 e inaccorabile.",
    bidding: { dealer: "south", bids: ["P", "2D", "P", "2S", "P", "4S", "P", "P"] },
  },
  {
    id: "CG2-2", lesson: 2, board: 2, title: "Il Fit 5-3 e 4-4",
    contract: "7S", declarer: "south", openingLead: c("club", "3"), vulnerability: "none",
    hands: {
      north: hand(["Q", "J", "10", "8"], ["A", "7"], ["K", "10"], ["A", "J", "9", "6", "2"]),
      east: hand(["6", "2"], ["J", "10", "8", "3", "2"], ["Q", "8", "7", "3"], ["5", "4"]),
      south: hand(["A", "K", "9", "7"], ["K", "4"], ["A", "J", "6", "4", "2"], ["K", "10"]),
      west: hand(["5", "4", "3"], ["Q", "9", "6", "5"], ["9", "5"], ["Q", "8", "7", "3"]),
    },
    commentary: "Dopo l'attacco Sud conta 6 prese esterne alle atout piu quella fatta sull'attacco: 7. Anziche pensare di battere Quadri o le Fiori vede che le 6 prese che mancano possono essere date dalle carte di quadri che gli rimangono (Taglio in croce). Prima di iniziare a tagliare deve incassare A e K in tutti i colori, anche cuori. Poi proseguira tagliando tutto il tagliabile. Quando si hanno tutte le atout piu alte un gioco a taglio in croce, se la distribuzione lo consente, mette il contratto in una botte di ferro.",
    bidding: { dealer: "south", bids: ["1D", "P", "2C", "P", "2S", "P", "4NT", "P", "5S", "P", "7S", "P", "P", "P"] },
  },
  {
    id: "CG2-3", lesson: 2, board: 3, title: "Il Fit 5-3 e 4-4",
    contract: "6C", declarer: "west", openingLead: c("spade", "A"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "2"], ["J", "6", "5", "4"], ["6", "5", "4", "2"], ["3", "2"]),
      east: hand(["7", "6", "4", "3"], ["A", "7", "2"], ["A", "10", "9"], ["Q", "10", "8"]),
      south: hand(["Q", "J", "10", "9", "5"], ["Q", "10", "8"], ["8", "7"], ["7", "6", "4"]),
      west: hand(["8"], ["K", "9", "3"], ["K", "Q", "J", "3"], ["A", "K", "J", "9", "5"]),
    },
    commentary: "Sull'attacco Sud risponde con la Q e Nord continua con il K che Ovest taglia. Incassare 4 quadri scartando cuori e poi tagliare una cuori e improponibile. Un'altra via porta a 6 le prese: tagliare in mano altre 2 picche e usare le fiori del morto. Si faranno 3 fiori(Q108)+3tagli(AKJ)+4quadri+2cuori=12. Unica condizione necessaria: le atout 3-2. Quando studiamo una mano proviamo a sederci dalla parte opposta del tavolo. Si possono trovare soluzioni inaspettate.",
    bidding: { dealer: "south", bids: ["P", "1C", "P", "1S", "P", "2D", "P", "2NT", "P", "4NT", "P", "6C", "-", "-"] },
  },
  {
    id: "CG2-4", lesson: 2, board: 4, title: "Il Fit 5-3 e 4-4",
    contract: "4S", declarer: "north", openingLead: c("heart", "10"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "J", "2"], ["8", "4", "3"], [], ["A", "K", "7", "6", "5", "2"]),
      east: hand(["8", "7", "4"], ["10"], ["10", "7", "6", "5", "3"], ["Q", "10", "4", "3"]),
      south: hand(["Q", "6", "5", "3"], ["J", "7", "6"], ["A", "K", "9", "4", "2"], ["9"]),
      west: hand(["10", "9"], ["A", "K", "Q", "9", "5", "2"], ["Q", "J", "8"], ["J", "8"]),
    },
    commentary: "L'avversario incassa AKQ cuori e torna Atout. Nord conta le prese: 4 picche,2 quadri, 2 fiori = 8. E' facile arrivare a 10 affrancando i Fiori o le Quadri. Quando dobbiamo fare queste scelte pensiamo che dovremo anche battere le Atout. Non usate per i tagli le atout che avra il compito di batterle.",
    bidding: { dealer: "south", bids: ["2D", "2H", "2S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG2-5", lesson: 2, board: 5, title: "Il Fit 5-3 e 4-4",
    contract: "6H", declarer: "east", openingLead: c("club", "K"), vulnerability: "none",
    hands: {
      north: hand(["K", "Q", "10"], ["5", "3"], ["Q", "10", "8", "4"], ["7", "4", "3", "2"]),
      east: hand(["A", "7", "6", "4"], ["J", "7", "2"], ["A", "6", "5"], ["Q", "J", "6"]),
      south: hand(["J", "8", "3", "2"], ["K", "9", "4"], ["K", "9", "7", "2"], ["A", "K"]),
      west: hand(["9", "5"], ["A", "Q", "10", "8", "6"], ["J", "3"], ["10", "9", "8", "5"]),
    },
    commentary: "Ovest conta 11 prese, la 12^ puo saltare fuori o dalle quadri 3-3 oppure da un taglio al morto. Ecco l'ordine esatto delle manovre: incasso di un onore di cuori (solo uno), poi AK fiori, quadri per l'Asso e Q picche scartando. Se le quadri sono divise 3-3, finira di battere le atout. Se non lo sono, taglia un quadri al morto con il prezioso J. Anche un colore 4-3 puo avere perdenti da tagliare: che la quarta carta sia vincente e un evento raro (36%).",
    bidding: { dealer: "south", bids: ["P", "1H", "P", "1S", "P", "2D", "P", "2H", "P", "4NT", "P", "5H", "-", "-"] },
  },
  {
    id: "CG2-6", lesson: 2, board: 6, title: "Il Fit 5-3 e 4-4",
    contract: "4S", declarer: "east", openingLead: c("heart", "2"), vulnerability: "none",
    hands: {
      north: hand(["K", "J", "10", "9"], ["7", "6"], ["A", "J", "8"], ["9", "8", "6", "4"]),
      east: hand(["7", "6", "3", "2"], ["K", "J", "10", "9"], ["Q", "7", "3"], ["Q", "3"]),
      south: hand(["A", "Q", "8", "4"], ["A", "4", "3", "2"], ["9", "5", "2"], ["A", "K"]),
      west: hand(["5"], ["Q", "8", "5"], ["K", "10", "6", "4"], ["J", "10", "7", "5", "2"]),
    },
    commentary: "Nord conta le prese nei colori laterali: sono 4, e neanche l'ombra di una affrancabile. Quindi 6 prese devono essere date dalle 6 carte di picche sull'attacco: una e stata fatta sull'attacco. bisogna ora tagliare 2 fiori al morto o tagliare 2 cuori in mano. Ovviamente, non dovra battere le Atout. C'e gia l'avversario che sta cercando di farlo! Se pensate al piano di gioco solo dopo aver battuto le atout perderete molti contratti. Battere, o non battere, e l'essenza stessa di ogni piano di gioco a colore.",
    bidding: { dealer: "south", bids: ["1NT", "P", "2C", "P", "1S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG2-7", lesson: 2, board: 7, title: "Il Fit 5-3 e 4-4",
    contract: "4H", declarer: "south", openingLead: c("diamond", "Q"), vulnerability: "none",
    hands: {
      north: hand(["8", "4", "3"], ["J", "10", "9"], ["A", "7", "4", "2"], ["K", "8", "7"]),
      east: hand(["A", "K", "7"], ["8", "7"], ["K", "10", "9", "5"], ["9", "6", "5", "3"]),
      south: hand(["9", "5", "2"], ["A", "K", "Q", "5", "3"], ["8"], ["A", "Q", "4", "2"]),
      west: hand(["Q", "J", "10", "6"], ["6", "4", "2"], ["Q", "J", "6", "3"], ["J", "10"]),
    },
    commentary: "Gli avversari incassano 3 Picche e poi giocano Quadri. Sud conta 5 cuori+1 quadri+3 picche sicure, la decima potrebbe venire dalla divisione 3-3 delle Fiori o battendo 2 colpi di atout e poi Fiori... sperando di trovare o la 3-3 o 4 fiori in chi ha la terza atout. Potrebbe invece pensare di tagliare 3 Quadri in mano (con A,K e Q di Cuori), visto che le atout del morto sono tutte abbastanza alte per battere; questa strada consente di fare 3 cuori (di Nord)+3 Tagli (di Sud)+1 quadri+3 fiori. Unica condizione che le Atout siano divise 3-2 (68%). Una percentuale molto piu alta rispetto alle fiori 3-3. Le percentuali, se sono conosciute, ci danno molte possibilita alternative.",
    bidding: { dealer: "south", bids: ["1H", "P", "2H", "P", "3C", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG2-8", lesson: 2, board: 8, title: "Il Fit 5-3 e 4-4",
    contract: "4S", declarer: "east", openingLead: c("heart", "Q"), vulnerability: "none",
    hands: {
      north: hand(["A", "Q"], ["7", "6", "5", "3", "2"], ["J", "10", "9", "7"], ["8", "4"]),
      east: hand(["7", "6", "4", "2"], ["8", "4"], ["5", "4"], ["A", "Q", "9", "5", "2"]),
      south: hand(["9", "8", "5", "3"], ["A", "K"], ["A", "K", "Q", "6", "2"], ["K", "6"]),
      west: hand(["K", "J", "10"], ["Q", "J", "10", "9"], ["8", "3"], ["J", "10", "7", "3"]),
    },
    commentary: "Una mano molto semplice, basta non farsi prendere dallo sconforto quando si osserva la consistenza delle atout in linea. Vi consoli pensare che non esiste nessun altro contratto in cui si poteva evitare di pagare AKQ. Bisogna ostinatamente giocare atout e continuare, per evitare che, tagliando, gli avversari possano 'sdoppiarle'. Quando a lato delle Atout abbiamo solo vincenti (o facilmente affrancabili) battiamo le Atout il prima possibile.",
    bidding: { dealer: "south", bids: ["1D", "P", "1S", "P", "4S", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 3: Il conto e i preferenziali
  // ==========================================================================
  {
    id: "CG3-1", lesson: 3, board: 1, title: "Il conto e i preferenziali",
    contract: "4S", declarer: "east", openingLead: c("diamond", "Q"), vulnerability: "none",
    hands: {
      north: hand(["10", "7", "6"], ["A", "9", "5", "2"], ["A", "9", "6"], ["Q", "J", "10"]),
      east: hand(["A", "K", "J", "9", "8", "5", "4"], ["4"], ["K", "5"], ["A", "9", "3"]),
      south: hand(["Q"], ["Q", "J", "10", "8", "6"], ["7", "4", "3", "2"], ["7", "6", "4"]),
      west: hand(["3", "2"], ["K", "7", "3"], ["Q", "J", "10", "8"], ["K", "8", "5", "2"]),
    },
    commentary: "Nord invita e Sud prosegue, ma Est taglia al secondo giro di atout catturando la Q secca e poi presenta il K di quadri. Per la difesa e un momento cruciale: se Nord prende subito regala il contratto. Il momento esatto per prendere e al secondo giro, e Solo Sud puo aiutare il compagno a contare il colore. Come? Rispondendo con il 7, la carta piu evidene per mostrare un numero pari di carte.",
    bidding: { dealer: "north", bids: ["P", "1S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG3-2", lesson: 3, board: 2, title: "Il conto e i preferenziali",
    contract: "4S", declarer: "south", openingLead: c("club", "A"), vulnerability: "none",
    hands: {
      north: hand(["J", "10", "9", "4"], ["K", "Q", "10", "6"], ["K", "10", "4"], ["Q", "5"]),
      east: hand(["7", "3"], ["A", "9", "7", "5", "3"], ["5", "3", "2"], ["8", "7", "3"]),
      south: hand(["K", "Q", "8", "5"], ["J"], ["A", "Q", "J", "9", "8", "6"], ["K", "10"]),
      west: hand(["A", "6", "2"], ["8", "4", "2"], ["7"], ["A", "J", "9", "6", "4", "2"]),
    },
    commentary: "Ovest attacca con l'A di fiori, Est rifiuta con l'8. Ovest incassa anche il K; Est segue con il 7, Sud con il 9. Scegliere il 7: non e casuale: mostra preferenza 'alta', quindi a cuori. E' per questo che Ovest ora gioca... quadri!! Saputo che Est ha un ingresso (unica carta con cui puo chiamare: KQ sono al morto!) Ovest si apre il taglio. Quando prendera con l'A di picche giochera cuori per l'Asso di Est che gli dara il taglio a quadri, battendo il contratto di 2 prese. Troppo bello questo gioco. Sull'attacco, il terzo di mano dara priorita assoluta all'informazione relativa al colore di attacco.",
    bidding: { dealer: "south", bids: ["1D", "2C", "X", "P", "2S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG3-3", lesson: 3, board: 3, title: "Il conto e i preferenziali",
    contract: "3NT", declarer: "west", openingLead: c("diamond", "2"), vulnerability: "none",
    hands: {
      north: hand(["J", "4", "3"], ["8", "4", "3"], ["A", "J", "9", "5", "2"], ["5", "2"]),
      east: hand(["Q", "5"], ["J", "7", "6", "5"], ["3"], ["A", "Q", "J", "9", "8", "3"]),
      south: hand(["10", "9", "8", "7"], ["Q", "10", "9", "2"], ["K", "7", "4"], ["K", "7"]),
      west: hand(["A", "K", "6", "2"], ["A", "K"], ["Q", "10", "8", "6"], ["10", "6", "4"]),
    },
    commentary: "Dopo una dichiarazione in transfer con cui Est ha mostrato una 6-4 da manche, Ovest ha preferito 3NT. Nord attacca con il 2 di quadri, Sud prende con il K e ora la carta con cui ritorna e importante: deve essere il 7, conto delle carte rimaste. Se Nord ha notato che il 4 non e comparso in tavola (un po' di fatica bisogna farla, in questo gioco) capira che Sud ha iniziato con Kxx e Ovest con Q10xx. Sull'attacco in 'busso', quando il terzo di mano non e in grado di superare la carta del morto, il suo segnale sara il 'conto'.",
    bidding: { dealer: "west", bids: ["P", "1NT", "P", "2S*", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG3-4", lesson: 3, board: 4, title: "Il conto e i preferenziali",
    contract: "6S", declarer: "south", openingLead: c("heart", "A"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "7", "6", "3"], ["10"], ["A", "K", "7", "6", "4"], ["A", "7"]),
      east: hand(["9", "2"], ["J", "8", "7", "3", "2"], [], ["9", "6", "5", "4", "3", "2"]),
      south: hand(["Q", "J", "10", "8", "5"], ["9", "4"], ["Q", "J", "9", "8", "2"], ["K"]),
      west: hand(["4"], ["A", "K", "Q", "6", "5"], ["10", "5", "3"], ["Q", "J", "10", "8"]),
    },
    commentary: "L'attacco A cuori e scontato e ovvio che la continuazione a cuori sia inutile. Ovest lo capisce quindi la carta che fornira Est non avra valore di chiamata o rifiuto ma di preferenza per il ritorno. Est vorrebbe disperatamente Quadri, per ottenere questo rinvio dovra rispondere con la cuori piu ALTA che che fornira. Quando, nei contratti a colore, l'attaccante resta in presa e il morto ha il singolo, il 3 di mano da messaggi di preferenziale; la sua carta, se alta, chiama con certezza il colore di rango piu alto. Se bassa, chiama nel piu basso o non chiama niente.",
    bidding: { dealer: "south", bids: ["1H", "X", "4H", "P", "6S", "P", "P", "P"] },
  },
  {
    id: "CG3-5", lesson: 3, board: 5, title: "Il conto e i preferenziali",
    contract: "3NT", declarer: "west", openingLead: c("diamond", "J"), vulnerability: "none",
    hands: {
      north: hand(["A", "9"], ["7", "6", "4"], ["J", "10", "9", "6", "2"], ["8", "5", "2"]),
      east: hand(["K", "J", "6", "2"], ["A", "Q", "8", "2"], ["5", "4", "3"], ["9", "3"]),
      south: hand(["8", "7", "4", "3"], ["5", "3"], ["A", "K"], ["J", "10", "7", "6", "4"]),
      west: hand(["Q", "10", "5"], ["K", "J", "10", "9"], ["Q", "8", "7"], ["A", "K", "Q"]),
    },
    commentary: "Se i difensori sono ligi agli accordi e fanno sempre cose normali, avranno grandi vantaggi perche potranno dare un significato a ogni anomalia. In Sud sarebbe 'normale' con il K. Ma Sud questa volta inverte l'ordine: gioca Asso e poi Re. Nord deve chiedersi al compagno: e facile, vuole sapere dove trovare un ingresso per fare il taglio. Nord sul K di quadri risponde con il 10 (= picche, il colore piu alto). E il taglio a quadri batte il contratto. Sia in attacco che il risposta, invertire l'ordine di AK mostra il doubleton.",
    bidding: { dealer: "west", bids: ["P", "1NT", "P", "2H", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG3-6", lesson: 3, board: 6, title: "Il conto e i preferenziali",
    contract: "4S", declarer: "south", openingLead: c("heart", "A"), vulnerability: "none",
    hands: {
      north: hand(["8", "7", "3"], ["J", "10", "5"], ["Q", "J", "6"], ["7", "6", "5", "4"]),
      east: hand(["A", "K", "9", "6", "5"], ["3"], ["K", "8", "4"], ["A", "K", "9", "2"]),
      south: hand(["Q", "J", "4"], ["Q", "8", "6"], ["9", "5", "2"], ["Q", "J", "10", "3"]),
      west: hand(["10", "2"], ["A", "K", "9", "7", "4", "2"], ["A", "10", "7", "3"], ["8"]),
    },
    commentary: "Sud attacca con A cuori, prosegue con il K su invito di Nord, e poi per il suo meglio devia a quadri, con il 5. Est sa che, non trattandosi di un attacco iniziale, l'onore di Sud puo essere sia l'Asso sia la dama, e ora deve indovinare che carta mettere. Ha 6 prese a cuori, per arrivare a 9 ha bisogno di fare 2 prese a Fiori ed una a Quadri: gioca quindi il J di quadri per l'Asso in Nord e colleziona - muovendo accortamente le fiori - 9 prese. Quando avete 'bisogno' che una carta sia in mano a un preciso avversario comportatevi come se lo fosse, e ricostruite la sua mano di conseguenza.",
    bidding: { dealer: "south", bids: ["2H", "2S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG3-7", lesson: 3, board: 7, title: "Il conto e i preferenziali",
    contract: "3NT", declarer: "south", openingLead: c("heart", "2"), vulnerability: "none",
    hands: {
      north: hand(["A", "J", "7", "4"], ["J", "10", "7"], ["Q", "6"], ["K", "8", "5", "2"]),
      east: hand(["10", "9", "2"], ["8", "4", "3"], ["7", "4", "3"], ["Q", "J", "10", "3"]),
      south: hand(["K", "Q", "6"], ["K", "5"], ["A", "J", "10", "9", "5"], ["A", "7", "6"]),
      west: hand(["8", "5", "3"], ["A", "Q", "9", "6", "2"], ["K", "8", "2"], ["9", "4"]),
    },
    commentary: "L'attacco di 2 cuori viene vinto dal 10 del morto, mentre Est risponde con il 3. Sud e a 8 prese, e dovrebbe sapere, con certezza assoluta, che sull' A cuori cadra il K di Sud! Perche? Perche il 3 mostra carte dispari, e poiche dalla Stayman si sa che Sud non ha 4 carte di cuori... e scontato che le carte dispari di Est sono TRE, e non UNA. Ovest passa all'incasso, tranquillo. Quando si torna in un colore gia mosso la carta che si sceglie mostra il conto di quelle rimaste.",
    bidding: { dealer: "south", bids: ["1NT", "P", "2C", "P", "2D", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG3-8", lesson: 3, board: 8, title: "Il conto e i preferenziali",
    contract: "4S", declarer: "west", openingLead: c("club", "A"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "7", "6"], ["10", "3"], ["K", "J"], ["A", "K", "Q", "9", "4"]),
      east: hand(["Q", "5", "3"], ["J", "9", "8", "7", "4", "2"], ["2"], ["8", "7", "6"]),
      south: hand(["J", "8", "4", "2"], ["K", "Q", "6", "5"], ["Q", "10", "6", "5"], ["5"]),
      west: hand(["10", "9"], ["A"], ["A", "9", "8", "7", "4", "3"], ["J", "10", "3", "2"]),
    },
    commentary: "L'attacco e sicuramente un singolo: Ovest si prepara a prendere e a tornare con una carta alta per segnalare l'A cuori. Certo! Ci si puo organizzare il PROPRIO taglio a cuori, incassando l'asso prima di dare il taglio! Quindi A cuori, e poi 9 di quadri per dire al compagno 'taglia, e poi gioca nel colore piu alto dei restanti' (fiori e cuori). Est tagliera, dara a Ovest il taglio a cuori, e un nuovo rinvio a quadri promuovera la Dama di atout. 2 down. Bellissimo. Quando si da un taglio al compagno costui si chiedera in che colore tornare. Basta dirglelo, con la carta che usiamo per dargli il taglio: alta per l'alto, bassa per il basso.",
    bidding: { dealer: "south", bids: ["P", "1C", "P", "2S", "P", "4S", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 4: I colori da muovere in difesa
  // ==========================================================================
  {
    id: "CG4-1", lesson: 4, board: 1, title: "I colori da muovere in difesa",
    contract: "4H", declarer: "north", openingLead: c("club", "J"), vulnerability: "none",
    hands: {
      north: hand(["Q"], ["K", "J", "10", "9", "7"], ["9", "8", "5", "3"], ["A", "K", "7"]),
      east: hand(["7", "6", "3"], ["A", "Q"], ["K", "7", "6", "2"], ["J", "10", "9", "8"]),
      south: hand(["A", "J", "5", "4"], ["8", "6", "3"], ["A", "J", "10", "4"], ["6", "3"]),
      west: hand(["K", "10", "9", "8", "2"], ["5", "4", "2"], ["Q"], ["Q", "5", "4", "2"]),
    },
    commentary: "La Q di fiori vince la presa e Nord risponde con la piccola, mostrando evidentemente possedere AKx. Est ha gia gli elementi per leggere la mano di Nord: 5 cuori, 4 picche, 3 fiori; quindi la difesa non incassera nessuna picche. Nord gioca atout e Est entra in presa; sa che il compagno ha una quadri sola, quindi Quadri! Quando prenderai con l'A cuori e darai il taglio al partner: una sotto.",
    bidding: { dealer: "south", bids: ["1S", "P", "2D", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG4-2", lesson: 4, board: 2, title: "I colori da muovere in difesa",
    contract: "4S", declarer: "north", openingLead: c("diamond", "10"), vulnerability: "none",
    hands: {
      north: hand(["4", "3"], ["10", "9", "7", "6", "2"], ["K", "8", "7", "5"], ["10", "8"]),
      east: hand(["A", "10", "9", "8"], ["Q", "J"], ["10", "3", "2"], ["A", "5", "3", "2"]),
      south: hand(["Q", "J", "7", "6"], ["A", "8", "5"], ["Q", "6", "4"], ["K", "Q", "J"]),
      west: hand(["K", "5", "2"], ["K", "4", "3"], ["A", "J", "9"], ["9", "7", "6", "4"]),
    },
    commentary: "L'avversario prende il nostro K con l'Asso e intavola la Q lasciandola girare fino al nostro partner. Adesso? Il nostro partner non dovrebbe avere piu di un Re. Se e quello di picche non abbiamo alcuna possibilita se invece fosse il K di quadri... Torniamo quindi Quadri. Se le quadri sono divise, Ovest ha rifiutato, non ha la Q. Quindi ce l'ha Nord. Ovest Sull'A picche. Ovest ha rifiutato, non ha la Q. Quindi ce l'ha Nord.",
    bidding: { dealer: "south", bids: ["P", "1NT", "P", "2C", "P", "2S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG4-3", lesson: 4, board: 3, title: "I colori da muovere in difesa",
    contract: "4S", declarer: "south", openingLead: c("club", "J"), vulnerability: "none",
    hands: {
      north: hand(["6", "5"], ["Q", "5"], ["8", "6"], ["A", "K", "Q", "J", "7", "6", "4"]),
      east: hand(["4", "3"], ["7", "6", "4", "3", "2"], ["Q", "J", "10", "3"], ["10", "3"]),
      south: hand(["K", "J", "10", "9", "8", "7", "2"], ["A", "K"], ["A", "K", "9"], ["5"]),
      west: hand(["A", "Q"], ["J", "10", "9", "8"], ["7", "5", "4", "2"], ["9", "8", "2"]),
    },
    commentary: "Il contratto di 3NT da Sud sarebbe stato di battuta ma anche battere 4 picche non e semplice. Dopo l'attacco Sud prende e per il suo meglio, gioca il K di Picche dalla mano. Voi in Ovest prendete e giocate... Fiori! Sapete che Sud ha A e K di Cuori secchi (ha rinunciato all'impasse a Picche) ed il colore di fiori adesso e anche dopo aver preso con l'Asso di Picche: non potendo piu utilizzare le fiori Sud sara costretto a fare l'expasse a Quadri. Un giocante che rinuncia a un impasse ha certamente problemi di collegamento. Le deduzioni che potete trarre sono tutte a vostro vantaggio.",
    bidding: { dealer: "south", bids: ["1S", "P", "2C", "P", "2S", "P", "3S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG4-4", lesson: 4, board: 4, title: "I colori da muovere in difesa",
    contract: "4S", declarer: "west", openingLead: c("club", "2"), vulnerability: "none",
    hands: {
      north: hand(["10", "5"], ["J", "9", "8", "4", "3", "2"], ["Q", "7", "6", "2"], ["2"]),
      east: hand(["K", "8", "7", "6"], ["Q", "7", "6", "5"], ["8"], ["K", "Q", "J", "10"]),
      south: hand(["A", "4", "3"], ["10"], ["J", "10", "9", "5", "3"], ["A", "9", "6", "4"]),
      west: hand(["Q", "J", "9", "2"], ["A", "K"], ["A", "K", "4"], ["8", "7", "5", "3"]),
    },
    commentary: "Di certo non e taglio e scarto: e taglio, e Ovest vuole che Est non ha QJ cuori (avrebbe attaccato di Q) quindi Sud ha ancora il J in mano. Ora e Ovest che deve stare attento: NON dovra prendere a picche fino al terzo giro, giocando Cuori fara usare a Sud la sua ultima picche e si promuovera la propria quarta carta: 1 down. In difesa l'Asso di Atout e una carta da rispettare.",
    bidding: { dealer: "east", bids: ["P", "P", "P", "1S", "P", "3D", "P", "3S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG4-5", lesson: 4, board: 5, title: "I colori da muovere in difesa",
    contract: "4S", declarer: "south", openingLead: c("heart", "2"), vulnerability: "none",
    hands: {
      north: hand(["Q", "10", "8", "3"], ["8", "4"], ["Q", "10", "2"], ["K", "Q", "7", "2"]),
      east: hand(["5"], ["A", "K", "9", "5"], ["9", "8", "4", "3"], ["10", "9", "8", "5"]),
      south: hand(["K", "J", "9", "7"], ["J", "7", "6"], ["A", "K", "7"], ["A", "J", "6"]),
      west: hand(["A", "6", "4", "2"], ["Q", "10", "3", "2"], ["J", "6", "5"], ["4", "3"]),
    },
    commentary: "Est vince con il K cuori e poiche la Q e di certo in mano a Ovest, il morto continuando cuori tagliera il morto. Non e taglio e scarto: Nord non puo scartare nessun colore laterale perche sono tutti buoni. Bisogna superare il K di picche giocare la Q di Fiori. In difesa l'Asso di Atout e una carta da rispettare.",
    bidding: { dealer: "south", bids: ["1NT", "P", "2C", "P", "2S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG4-6", lesson: 4, board: 6, title: "I colori da muovere in difesa",
    contract: "4H", declarer: "south", openingLead: c("diamond", "A"), vulnerability: "none",
    hands: {
      north: hand(["Q", "7"], ["A", "J", "9", "8", "5"], ["J", "2"], ["A", "J", "7", "3"]),
      east: hand(["A", "K", "9", "4"], ["K", "3", "2"], ["K", "7", "6", "4"], ["10", "5"]),
      south: hand(["10", "8", "6", "5"], ["7", "6"], ["Q", "10", "9", "5", "3"], ["9", "6"]),
      west: hand(["J", "3", "2"], ["Q", "10", "4"], ["A", "8"], ["K", "Q", "8", "4", "2"]),
    },
    commentary: "Alla vista del morto Est, consapevole che Ovest, dato il Passo, puo avere solo robetta, deve rendersi conto che la sola speranza e la Q di quadri in Ovest. Sull'A di picche Ovest ha rifiutato, non ha la Q. L'attacco di Asso da AK e ottimo perche consente di vedere il morto e decidere come proseguire.",
    bidding: { dealer: "east", bids: ["P", "P", "1H", "P", "2C", "P", "3C", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG4-7", lesson: 4, board: 7, title: "I colori da muovere in difesa",
    contract: "4S", declarer: "east", openingLead: c("club", "K"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "4"], ["8", "7", "2"], ["9", "7"], ["10", "9", "8", "5", "3"]),
      east: hand(["Q", "J", "10", "9", "6", "5"], ["A", "J", "5", "4"], ["J", "4"], ["A"]),
      south: hand(["7", "2"], ["K", "Q", "9", "3"], ["8", "5", "3"], ["K", "Q", "J", "4"]),
      west: hand(["8", "3"], ["10", "6"], ["A", "K", "Q", "10", "6", "2"], ["7", "6", "2"]),
    },
    commentary: "L'avversario prende con l'A fiori, gioca Picche e Nord prende. Ancora in presa a picche Nord rigiochera nuovamente quadri, pronto a tagliare con il 4 se Est provasse a proseguire scartando. Morale: Est dovra pagare almeno 2 Cuori. In difesa prima di effettuare un controgioco ripensiamo alla licita avversaria.",
    bidding: { dealer: "east", bids: ["P", "P", "P", "1S", "P", "1NT", "P", "2H", "P", "3D", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG4-8", lesson: 4, board: 8, title: "I colori da muovere in difesa",
    contract: "4H", declarer: "west", openingLead: c("spade", "K"), vulnerability: "none",
    hands: {
      north: hand(["K", "Q", "7", "4", "3"], ["5", "4"], ["8", "5", "2"], ["A", "8", "7"]),
      east: hand(["10", "9", "8", "5"], ["Q", "J", "10", "3"], ["Q", "10"], ["9", "6", "3"]),
      south: hand(["A", "6", "2"], ["7", "6"], ["9", "7", "4", "3"], ["Q", "J", "10", "4"]),
      west: hand(["J"], ["A", "K", "9", "8", "2"], ["A", "K", "J", "6"], ["K", "5", "2"]),
    },
    commentary: "In base alla licita e alla vista del morto Sud si rende conto che le Picche potranno produrre al massimo una presa. Non c'e alcuna convenienza a lasciare in presa Nord: fiori e l'unico colore in cui la difesa potrebbe incassare prese, ma solo se Sud a presa. Bisogna superare il K di picche giocare la Q di Fiori. Quando in difesa un colore deve essere giocato in maniera conveniente da uno dei due, chi ha le idee chiare deve prendere l'iniziativa.",
    bidding: { dealer: "south", bids: ["1H", "1S", "3D", "P", "4H", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 5: I giochi di sicurezza
  // ==========================================================================
  {
    id: "CG5-1", lesson: 5, board: 1, title: "I giochi di sicurezza",
    contract: "3NT", declarer: "west", openingLead: c("club", "J"), vulnerability: "none",
    hands: {
      north: hand(["A"], ["K", "7", "6"], ["K", "Q", "J", "8", "4", "3", "2"], ["J", "2"]),
      east: hand(["6", "5", "3", "2"], ["J", "10"], ["10", "9", "7", "5"], ["K", "8", "7"]),
      south: hand(["K", "Q", "8", "4"], ["A", "8", "4", "2"], ["A"], ["A", "10", "6", "5"]),
      west: hand(["J", "10", "9", "7"], ["Q", "9", "5", "3"], ["6"], ["Q", "9", "4", "3"]),
    },
    commentary: "L'attacco di Ovest pone il dichiarante di fronte ad un morto rassicurante. Si contano 3 picche, 2 cuori e le prese che mancano si potranno trovare facilmente a Quadri 3-2. Ma se le Quadri fossero 3-1? Ci si puo cautelare dal farsi mangiare un onore di Quadri da un eventuale Asso secco? Che significherebbe perdere due prese (in quanto l'altro avrebbe il dieci quarto) se le Quadri fossero 4-1. J (in questo caso il K) e poi piccola verso il morto superando di misura la carta giocata. In questo modo si perdera una sola presa anche trovando Q10xx in una mano. Soprattutto nel gioco a squadre conoscere alcune situazioni ci fa risparmiare fatica e ci fa raggiungere piu facilmente il successo.",
    bidding: { dealer: "south", bids: ["1H", "P", "2D", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG5-2", lesson: 5, board: 2, title: "I giochi di sicurezza",
    contract: "6S", declarer: "east", openingLead: c("heart", "Q"), vulnerability: "none",
    hands: {
      north: hand(["Q", "10", "5", "2"], ["5", "4", "3"], ["Q", "J", "10"], ["Q", "6", "5"]),
      east: hand(["A", "8", "6", "3"], ["A", "K", "7", "6", "2"], ["7", "6"], ["K", "3"]),
      south: hand(["K", "J", "9", "4"], ["Q", "J"], ["A", "K", "3"], ["A", "J", "4", "2"]),
      west: hand(["7"], ["10", "9", "8"], ["9", "8", "5", "4", "2"], ["10", "9", "8", "7"]),
    },
    commentary: "Uno slam corazzato, a patto di non perdere 2 prese in Atout. E' possibile cautelarsi da Q10xx in Sud? Il compito dei giochi di sicurezza e rinunciare ad una eventuale Asso secco (che significherebbe perdere 0 prese) per assicurarci il nostro contratto. Con 8 carte e la divisione 3-2 ci dara la nona presa nel 68% dei casi. Possiamo pero aumentare ancora le nostre chance dando un doppio 'colpo in bianco': ci prenderemo una assicurazione anche con le Quadri 4-1, mantenendo le Comunicazioni. Questo modo di affrontare il colore e 'obbligatorio' in duplicato, meno raccomandabile in una gara a coppie (con le carte 3-2 faremmo una presa in meno di tutti gli altri!). Il 'Colpo in Bianco' e una delle manovre di sicurezza piu importanti.",
    bidding: { dealer: "south", bids: ["P", "1S", "P", "2S", "P", "4NT", "P", "5H", "P", "6S", "P", "P"] },
  },
  {
    id: "CG5-3", lesson: 5, board: 3, title: "I giochi di sicurezza",
    contract: "4S", declarer: "west", openingLead: c("heart", "10"), vulnerability: "none",
    hands: {
      north: hand(["Q", "5"], ["10", "9", "8", "7"], ["9", "5", "2"], ["A", "9", "7", "3"]),
      east: hand(["A", "J", "10", "7", "6", "4", "3"], ["2"], ["A", "K", "6"], ["5", "2"]),
      south: hand(["K", "9", "8", "2"], ["A", "K", "J", "5", "4"], ["Q", "7", "3"], ["4"]),
      west: hand([], ["Q", "6", "3"], ["J", "10", "8", "4"], ["K", "Q", "J", "10", "8", "6"]),
    },
    commentary: "...4 picche (e non 3NT!) e la giusta dichiarazione di Est. Dopo l'attacco Ovest si accorge facilmente che le 10 prese sono alla portata a patto di non perdere piu di 2 atout. Picche sono divise 3-3. Questa divisione non capita spesso (36%), bisogna quindi trovare una soluzione nel caso delle 4-2. Il gioco da effettuare e di giocare prima l'Asso e poi una piccola. In questo modo non ci faremo mangiare una carta fondamentale dall'onore secondo. Poi giocheremo il J e se le Picche fossero 4-2, troveremmo la soluzione. Un misto di sicurezza e conoscenza delle probabilita di divisione di un colore. Cerchiamo di arrivare a vedere il problema saliente della mano. Sara piu facile risolverlo.",
    bidding: { dealer: "south", bids: ["P", "3S", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG5-4", lesson: 5, board: 4, title: "I giochi di sicurezza",
    contract: "6S", declarer: "north", openingLead: c("heart", "J"), vulnerability: "none",
    hands: {
      north: hand(["Q", "9", "6", "3"], ["A", "K", "Q"], ["A", "J", "7", "6"], ["9", "8"]),
      east: hand(["10", "8", "7", "4"], ["J", "10", "9", "7"], ["5", "2"], ["K", "7", "2"]),
      south: hand(["A", "K", "J", "5", "2"], ["4"], ["K", "Q", "8", "3"], ["A", "Q", "3"]),
      west: hand([], ["8", "6", "5", "3", "2"], ["10", "9", "4"], ["J", "10", "6", "5", "4"]),
    },
    commentary: "Nord ha due problemi: i due Re neri. Le picche possono essere mosse in due modi; se le Quadri fossero divise 3-2, cosa semplice se le fiori sono 4-2, non avremmo problema con le Atout 3-2, ma se fossero 4-1? A forza di tagliare ci troveremmo con meno atout dell'avversario. Come possiamo rimediare? Basta giocare le Quadri subito, prima delle Atout. Cedendo le 3 Quadri e non avendo ancora battuto avremmo un atout al morto per tagliare le cuori dalla parte corta. Giocare ad Atout con la 4-3 non e sempre una cosa brutta se riusciamo a prevedere i pericoli della eventuale battuta delle Atout.",
    bidding: { dealer: "south", bids: ["P", "1NT", "P", "P", "P"] },
  },
  {
    id: "CG5-5", lesson: 5, board: 5, title: "I giochi di sicurezza",
    contract: "4S", declarer: "south", openingLead: c("heart", "K"), vulnerability: "none",
    hands: {
      north: hand(["8", "7", "5", "4"], ["10", "9", "6"], ["A", "10"], ["J", "10", "8", "4"]),
      east: hand(["A", "K", "Q", "J", "9", "2"], ["2"], ["Q", "8", "3", "2"], ["K", "3"]),
      south: hand(["10", "6"], ["A", "4", "3"], ["7", "6", "5", "4"], ["A", "9", "5", "2"]),
      west: hand(["3"], ["K", "Q", "J", "8", "7", "5"], ["K", "J", "9"], ["Q", "7", "6"]),
    },
    commentary: "Dopo l'attacco contiamo 9 prese sicure (6P-1C-2F) e la decima puo venire solo dalle Quadri cedendo 3 volte la presa all'avversario. Battendo le Atout non avremmo problema con le Atout 3-2, ma se fossero 4-1? Se l'avversario ci aiutassero. Prendiamo con il K cuori, poi AK fiori, quadri per l'Asso e Q picche scartando. Se le quadri sono divise 3-3, finira di battere. Se l'avversario non ha avuto questa situazione non esiste, se si potra evitare di perdere due prese! Se l'avversario ci costringe a tagliare dalla parte lunga cerchiamo di prevedere i pericoli di una eventuale battuta delle Atout.",
    bidding: { dealer: "south", bids: ["P", "1S", "X", "P", "2H", "P", "4S", "P", "P"] },
  },
  {
    id: "CG5-6", lesson: 5, board: 6, title: "I giochi di sicurezza",
    contract: "3NT", declarer: "south", openingLead: c("heart", "J"), vulnerability: "none",
    hands: {
      north: hand(["10", "7", "3"], ["6", "5"], ["A", "K", "5", "4", "3"], ["8", "4", "2"]),
      east: hand(["6", "5", "4"], ["7", "4", "3", "2"], ["J"], ["Q", "J", "10", "9", "5"]),
      south: hand(["A", "Q", "8", "2"], ["A", "K", "Q"], ["7", "6", "2"], ["A", "K", "7"]),
      west: hand(["K", "J", "9"], ["J", "10", "9", "8"], ["Q", "10", "9", "8"], ["6", "3"]),
    },
    commentary: "Sud conta 8 prese sicure. La nona potra venire dall'impasse a Picche o dalla divisione delle Quadri. Scegliamo questa seconda opzione perche abbiamo 8 carte e la divisione 3-2 ci dara nel 68% dei casi. Possiamo pero aumentare le nostre chance dando un doppio 'colpo in bianco'. Il 'Colpo in Bianco' e una delle manovre di sicurezza piu importanti.",
    bidding: { dealer: "south", bids: ["2NT", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG5-7", lesson: 5, board: 7, title: "I giochi di sicurezza",
    contract: "4S", declarer: "north", openingLead: c("heart", "A"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "10", "4"], ["6", "4"], ["A", "7", "8", "5", "2"], ["J", "7"]),
      east: hand(["9", "8", "7", "2"], ["A", "K", "Q", "J", "9"], ["K", "9", "4"], ["2"]),
      south: hand(["Q", "J", "3"], ["8", "5", "3"], ["10", "6"], ["A", "K", "Q", "10", "6"]),
      west: hand(["6", "5"], ["10", "7", "2"], ["Q", "J", "3"], ["9", "8", "5", "4", "3"]),
    },
    commentary: "Sul Contro di Nord Sud non ha di meglio che ripetere le fiori; quando appoggia le picche e ovvio che sta mostrando la terza, e non fermo a Cuori. Nord decide quindi di giocare manche nella 4-3. Ovest attacca con A, K e Q di cuori; Nord deve rifiutarsi di prendere (colpo in bianco), perche sa che non entrera piu in presa. Giocare ad Atout con la 4-3 non e sempre una cosa brutta se riusciamo a prevedere i pericoli delle eventuali atout in mano all'avversario.",
    bidding: { dealer: "south", bids: ["1C", "P", "1D", "1H", "P", "P", "Dbl", "P", "2S", "P", "3S", "P", "4S", "-", "-"] },
  },
  {
    id: "CG5-8", lesson: 5, board: 8, title: "I giochi di sicurezza",
    contract: "3H", declarer: "south", openingLead: c("spade", "Q"), vulnerability: "none",
    hands: {
      north: hand(["8", "4", "3"], ["Q", "J", "10", "9"], ["Q", "10", "9"], ["A", "8", "5"]),
      east: hand(["A", "5"], ["A", "K", "7", "6"], ["A", "6", "2"], ["K", "Q", "J", "7"]),
      south: hand(["K", "7", "6"], ["8", "5", "4", "2"], ["K", "8", "5", "3"], ["10", "2"]),
      west: hand(["Q", "J", "10", "9", "2"], ["3"], ["J", "7", "4"], ["9", "6", "4", "3"]),
    },
    commentary: "Dopo la Puppet Stayman (3 quadri) Ovest dichiara quella che NON ha. Est vince l'attacco in mano e conta 2 picche. Le altre 4 prese potranno venire dalle Fiori, una volta ceduto l'Asso, e la decima sicuramente dalle Atout, tagliando in una delle 2 mani. Ma per fare un taglio dobbiamo avere le Atout! Se battiamo A e K, e le troviamo 4-1, quando cederemo l'Asso di Fiori l'avversario potra eliminarci tutte, e addio tagli. Per evitare questo problema la prima cosa da fare e sempre affrancare i colori laterali, quindi cediamo l'Asso di Fiori. Quando giochiamo con 8 Atout ricordiamoci che la divisione dei resti 4-1 non e un evento cosi raro: capita il 28% delle volte.",
    bidding: { dealer: "south", bids: ["P", "2NT", "P", "3D*", "P", "3S*", "P", "4H", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 6: Probabilita e percentuali
  // ==========================================================================
  {
    id: "CG6-1", lesson: 6, board: 1, title: "Probabilita e percentuali",
    contract: "2H", declarer: "south", openingLead: c("club", "J"), vulnerability: "none",
    hands: {
      north: hand(["K", "J", "10", "2"], ["A", "7", "5"], ["J", "9", "5"], ["10", "8", "4"]),
      east: hand(["Q", "7", "3"], ["9"], ["A", "K", "7", "6", "3"], ["K", "Q", "6", "2"]),
      south: hand(["A", "9", "6"], ["J", "6", "3"], ["Q", "10", "2"], ["A", "9", "7", "3"]),
      west: hand(["8", "5", "4"], ["K", "Q", "10", "8", "4", "2"], ["8", "4"], ["J", "5"]),
    },
    commentary: "Gli avversari dopo aver incassato 3 prese di Picche continuano da Nord con l'8 di Fiori e dopo aver incassato in Sud l'A di fiori continuano a Fiori. Ovest si rende conto che l'unico problema rimasto nella mano risiede nel seme di atout. Come muovere il J cuori e superiore a qualsiasi altra manovra quindi si deve giocare il 9 e superarlo con il 10 sperando nel J in mano a Sud secondo o terzo. Se al primo giro si giocasse un onore superiore, non esiste situazione in cui si potra evitare di perdere due prese! Una strada che ci dia qualche probabilita di successo, anche se non altissima, e sempre meglio di niente.",
    bidding: { dealer: "south", bids: ["P", "1D", "P", "2C", "P", "2H", "P", "P", "P"] },
  },
  {
    id: "CG6-2", lesson: 6, board: 2, title: "Probabilita e percentuali",
    contract: "3NT", declarer: "south", openingLead: c("heart", "Q"), vulnerability: "none",
    hands: {
      north: hand(["6", "5"], ["K", "10", "7", "5", "4"], ["J", "10", "8", "2"], ["10", "8"]),
      east: hand(["Q", "J", "9"], ["A", "8"], ["Q", "4"], ["7", "6", "5", "4", "3", "2"]),
      south: hand(["A", "10", "8", "7"], ["6", "3"], ["A", "K", "9", "6", "3"], ["A", "K"]),
      west: hand(["K", "4", "3", "2"], ["Q", "J", "9", "2"], ["7", "5"], ["Q", "J", "9"]),
    },
    commentary: "L'attacco a Cuori da parte di Sud pone il giocante di fronte ad un problema: avendo solo 7 prese certe dovra cercare altre 2 senza mai cedere presa. Le opzioni sono giocare Quadri o fare l'impasse a Picche. I Quadri 3-3 offrono il 36% l'impasse a Picche il 50% quindi...dimentichiamo le Quadri e via con l'impasse a Picche. Se il numero di carte in mano agli avversari e pari, la distribuzione equa (quella a noi favorevole: 2/2, 3/3, 4/4) e sempre inferiore al 50%.",
    bidding: { dealer: "south", bids: ["P", "1D", "P", "1NT", "P", "2S", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG6-3", lesson: 6, board: 3, title: "Probabilita e percentuali",
    contract: "3NT", declarer: "south", openingLead: c("heart", "4"), vulnerability: "none",
    hands: {
      north: hand(["A", "10", "8", "7"], ["6", "3"], ["A", "K", "9", "6", "3"], ["A", "K"]),
      east: hand(["K", "4", "3", "2"], ["Q", "J", "10", "2"], ["J", "5"], ["Q", "J", "10"]),
      south: hand(["Q", "J", "9"], ["A", "8"], ["Q", "4", "2"], ["7", "6", "5", "4", "3"]),
      west: hand(["6", "5"], ["K", "9", "7", "5", "4"], ["10", "8", "7"], ["9", "8", "2"]),
    },
    commentary: "L'attacco a Cuori pone il giocante di fronte ad un problema: ha solo 7 prese certe e dovra cercare altre 2. Le quadri corrono (se 3/2) e i quadri danno subito, ma se fossero 6-2 deve comunque sperare che le fiori siano 4/4. Ora, quale colore scegliere? La divisione delle Quadri 3-2 ci porterebbe al successo nel 68% dei casi, e non e poco. Ma ripetere 2 volte l'impasse a Cuori porterebbe la nostra probabilita al 75%! Quindi senza ripensamenti si sceglie la percentuale maggiore. Quadri e Cuori, consapevoli che il primo impasse andra male ed e nel secondo che bisogna avere fiducia. Conoscere le percentuali, almeno quelle fondamentali, ci da sempre una marcia in piu.",
    bidding: { dealer: "south", bids: ["1NT", "P", "2S", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG6-4", lesson: 6, board: 4, title: "Probabilita e percentuali",
    contract: "3NT", declarer: "north", openingLead: c("diamond", "A"), vulnerability: "none",
    hands: {
      north: hand(["A", "Q", "5", "3", "2"], ["A", "Q"], ["10", "6", "4"], ["K", "J", "2"]),
      east: hand(["J", "9", "8", "6"], ["J", "5", "4"], ["A", "K", "7"], ["7", "5", "4"]),
      south: hand(["K", "4"], ["7", "6", "3", "2"], ["J", "3", "2"], ["A", "Q", "10", "3"]),
      west: hand(["10", "7"], ["K", "10", "9", "8"], ["Q", "9", "8", "5"], ["9", "8", "6"]),
    },
    commentary: "Gli avversari incassano le prime 4 prese a Quadri e poi Ovest torna con il 10 di Cuori. Che fare? L'impasse a Cuori o affidarsi alle Picche? Purtroppo la scelta dovra essere immediata (con un ritorno neutro avremmo avuto il tempo di testare le picche, e poi decidere se l'impasse a cuori fosse necessario o no). Abbiamo in linea 7 carte di picche, ce ne mancano 6 e sappiamo che la probabilita di trovarle divise 3-3 vale solo il 36%. L'impasse al K cuori vale il 50%. Non ci pensiamo troppo e facciamo l'impasse. Affidarsi alle probabilita facilita le scelte e migliora l'affiatamento con il partner, che dira sempre: 'Hai giocato con le migliori probabilita. Bravo!'",
    bidding: { dealer: "south", bids: ["P", "1NT", "P", "P", "3NT", "P", "P", "p"] },
  },
  {
    id: "CG6-5", lesson: 6, board: 5, title: "Probabilita e percentuali",
    contract: "3NT", declarer: "south", openingLead: c("club", "Q"), vulnerability: "none",
    hands: {
      north: hand(["8", "5", "4", "3"], ["K", "9", "5", "3"], ["10"], ["K", "5", "4", "2"]),
      east: hand(["A", "K", "Q", "2"], ["7", "6", "2"], ["A", "K", "2"], ["7", "6", "3"]),
      south: hand(["J", "10", "9"], ["A", "J", "10"], ["9", "8", "7", "4", "3"], ["A", "8"]),
      west: hand(["7", "6"], ["Q", "8", "4"], ["Q", "J", "6", "5"], ["Q", "J", "10", "9"]),
    },
    commentary: "Est, dopo l'attacco, conta 8 vincenti (4 picche,1 cuori,2 quadri,1 fiori) e puo trovare la nona presa in ben 2 colori, Quadri (se 3/2) o Cuori (impasse ripetuto). Dovra pero cedere sicuramente la presa agli avversari, e poiche lisciare l'attacco e inutile (taglia i collegamenti solo se le fiori sono 6-2) deve comunque sperare che le fiori siano divise 4/4. Ora, quale colore scegliere? Se le Quadri sono 3-2, incasseremo 3 prese. Ma la probabilita che lo siano e il 68%, e non poco. Ma ripetere 2 volte l'impasse a Cuori porterebbe la nostra probabilita al 75%. Quindi senza ripensamenti si sceglie la percentuale maggiore. Conoscere le percentuali, almeno quelle fondamentali, ci da sempre una marcia in piu.",
    bidding: { dealer: "south", bids: ["P", "1NT", "P", "P", "P", "3NT", "P", "P"] },
  },
  {
    id: "CG6-6", lesson: 6, board: 6, title: "Probabilita e percentuali",
    contract: "7S", declarer: "north", openingLead: c("heart", "J"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "Q", "J", "6", "4"], ["A"], ["6", "4", "3", "2"], ["A", "Q"]),
      east: hand(["3", "2"], ["J", "10", "9", "8"], ["8", "5"], ["K", "J", "7", "5", "3"]),
      south: hand(["10", "9", "8", "5"], ["K", "Q", "2"], ["Q", "10", "9"], ["9", "4", "2"]),
      west: hand(["7"], ["7", "6", "5", "4", "3"], ["A", "K", "J", "7"], ["10", "8", "6"]),
    },
    commentary: "Nord ha 12 vincenti; puo trovare la 13^ presa con l'impasse a Quadri, o a Fiori; oppure (gia meglio!) scegliere quello a fiori ma per vedere se cade la Q. Ci sono strade con probabilita maggiori? In effetti, si. Puo scartare su KQ cuori le cartine del morto. Incassare prima A e poi K di quadri per vedere se cade la Q. In questo modo le possibilita sono le migliori. Quando cerchiamo il K in un colore avendo fino a 10 carte complessive tra mano e morto BISOGNA fare l'impasse.",
    bidding: { dealer: "south", bids: ["1D", "P", "1S", "P", "2S", "P", "4NT", "P", "5D", "P", "7S", "-"] },
  },
  {
    id: "CG6-7", lesson: 6, board: 7, title: "Probabilita e percentuali",
    contract: "3NT", declarer: "west", openingLead: c("club", "A"), vulnerability: "none",
    hands: {
      north: hand(["5", "4"], ["10", "9", "3", "2"], ["J", "5", "4"], ["A", "K", "Q", "3"]),
      east: hand(["10", "8", "6"], ["J", "7", "6", "5"], ["8", "7", "3"], ["7", "6", "4"]),
      south: hand(["A", "K", "Q", "3", "2"], ["A", "Q"], ["9", "6", "2"], ["J", "10", "2"]),
      west: hand(["J", "9", "7"], ["K", "8", "4"], ["A", "K", "Q", "10"], ["9", "8", "5"]),
    },
    commentary: "Possiamo provare la divisione delle Picche, senza cedere la mano all'avversario, e se le Picche non fossero divise in maniera a noi favorevole saremmo ancora in tempo per fare l'impasse a Cuori, unico ingresso al morto. Quando si vuole cumulare le probabilita senza cedere la mano all'avversario prima si controlla la divisione di un colore, e in caso negativo si ricorre a un impasse. Da un impasse andato male non si puo tornare indietro.",
    bidding: { dealer: "south", bids: ["1NT", "P", "2C", "P", "2NT", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG6-8", lesson: 6, board: 8, title: "Probabilita e percentuali",
    contract: "4S", declarer: "west", openingLead: c("club", "K"), vulnerability: "none",
    hands: {
      north: hand([], ["A", "6", "5", "2"], ["10", "6", "4", "3"], ["K", "Q", "9", "3", "2"]),
      east: hand(["Q", "J", "10", "9", "2"], ["J", "10"], ["J", "8", "7", "2"], ["J", "4"]),
      south: hand(["A", "7", "6", "5", "3"], ["K", "Q", "7", "4", "3"], ["A"], ["7", "5"]),
      west: hand(["K", "8", "4"], ["9", "8"], ["K", "Q", "9", "5"], ["A", "10", "8", "6"]),
    },
    commentary: "Dichiarazione in puro stile 'Legge': 10 Atout 10 prese. L'avversario incassa 2 Fiori e torna con il K di cuori. L'A cuori va ceduto per forza, quindi se l'impasse a picche fallisce andremo down. Abbiamo 10 atout. Battiamo l'Asso o facciamo l'impasse? Le probabilita sono nettamente a favore dell'impasse, quindi dobbiamo trovare il modo di andare al morto per intavolare la Q di picche. E' possibile? Si, basta giocare una piccola cuori verso J e 10, che vale sempre il 50%. La probabilita del K secco in Nord vale circa il 13%: prevede la 2/1 (78%), ma col singolo in Nord (scende al 39%), e il K - che ha 3 posti possibili - deve essere esattamente nel singolo (un terzo del 39%!). Convinti? Quando cerchiamo il K in un colore avendo fino a 10 carte complessive tra mano e morto BISOGNA fare l'impasse.",
    bidding: { dealer: "south", bids: ["1S", "P", "4S", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 7: Coprire o non coprire
  // ==========================================================================
  {
    id: "CG7-1", lesson: 7, board: 1, title: "Coprire o non coprire",
    contract: "3NT", declarer: "west", openingLead: c("club", "A"), vulnerability: "none",
    hands: {
      north: hand(["10", "9", "8", "5"], ["10", "6", "5"], ["A", "K", "Q", "10"], ["J", "9"]),
      east: hand(["J", "4"], ["Q", "J", "9", "2"], ["J", "2"], ["A", "K", "8", "5", "4"]),
      south: hand(["7", "6", "3"], ["K", "8", "7"], ["7", "6", "4"], ["Q", "10", "3", "2"]),
      west: hand(["A", "K", "Q", "2"], ["A", "4", "3"], ["9", "8", "5", "3"], ["7", "6"]),
    },
    commentary: "Nord attacca a quadri e incassa le prime 4 prese, poi gioca il 10 di picche (e Sud si guardi bene dall'invitare a cuori...). La sola speranza di Ovest e ricavare 4 prese dalle cuori. Potri riuscirci solo se Sud coprisse la Q di cuori al primo giro, condannando cosi il 10 del morto. Compagno. Se Sud non mette il Re, e si ferma a guardare il morto, chiuso con tutte prese vincenti. Dove puo venire la presa del down? Solo da una promozione in Atout, se Sud gioca serenamente sotto. Proverai a giocare la Q cuori (ma Sud NON mettera il suo Re, non al primo giro). Quando una figura di impasse presenta due onori contigui non coprite mai il primo onore. Coprite il secondo, se verra giocato.",
    bidding: { dealer: "south", bids: ["P", "1D", "P", "1H", "P", "3NT", "P", "P"] },
  },
  {
    id: "CG7-2", lesson: 7, board: 2, title: "Coprire o non coprire",
    contract: "4S", declarer: "east", openingLead: c("spade", "J"), vulnerability: "none",
    hands: {
      north: hand(["Q", "8", "3"], ["9", "7", "6", "5", "4"], ["4", "3"], ["A", "J", "9"]),
      east: hand(["A", "9", "7", "6", "5", "4"], ["J", "3"], ["A", "K", "J", "8"], ["8"]),
      south: hand(["J", "10", "2"], ["A", "8"], ["Q", "10", "2"], ["K", "Q", "5", "4", "3"]),
      west: hand(["K"], ["K", "Q", "10", "2"], ["9", "7", "6", "5"], ["10", "7", "6", "2"]),
    },
    commentary: "Est vince l'attacco a cuori, ed essendo ormai tardi per affrancare una fiori approfitta di essere al morto per giocare il J di picche. Se Nord e vittima di automatismi e copre con la Q, il suo compagno non sara molto contento. La Q non va messa perche, coprendo, Nord non promuove nessuna carta. Coprite per far contento il compagno, non l'avversario.",
    bidding: { dealer: "south", bids: ["P", "2C", "P", "2D", "P", "4S", "P", "P"] },
  },
  {
    id: "CG7-3", lesson: 7, board: 3, title: "Coprire o non coprire",
    contract: "3NT", declarer: "south", openingLead: c("diamond", "Q"), vulnerability: "none",
    hands: {
      north: hand(["Q", "10", "4"], ["K", "6", "4"], ["A", "K"], ["10", "9", "6", "4", "2"]),
      east: hand(["8", "6", "5", "3", "2"], ["J", "10", "9", "3"], ["8", "7"], ["K", "8"]),
      south: hand(["A", "K", "9"], ["A", "Q", "5"], ["6", "5", "4", "2"], ["Q", "J", "3"]),
      west: hand(["J", "7"], ["8", "7", "2"], ["Q", "J", "10", "9", "3"], ["A", "7", "5"]),
    },
    commentary: "A carte viste Sud e destinato al down: gli serve almeno una presa a fiori, ma la difesa e in vantaggio di tempo e affranchera le proprie quadri. Questo avverra solo se Est sara la prima a vincere la presa di fiori. Est sara a vincere la prima presa a fiori, per giocare la sua ultima carta di fiori che verra mossa dal morto, che sia il 10 o il 2, Est deve mettere il suo Re. Felicemente sorpreso di aver vinto, potra giocare quadri e aspettare che Sud getti la spugna. Usiamo le nostre carte alte per affrancare il seme del partner preservando i suoi rientri.",
    bidding: { dealer: "south", bids: ["1NT", "P", "3NT", "P", "P", "P"] },
  },
  {
    id: "CG7-4", lesson: 7, board: 4, title: "Coprire o non coprire",
    contract: "4H", declarer: "north", openingLead: c("club", "K"), vulnerability: "none",
    hands: {
      north: hand(["A", "K"], ["K", "Q", "7", "6", "3"], ["A", "5", "3", "2"], ["9", "7"]),
      east: hand(["Q", "9", "7", "5"], ["10", "4"], ["Q", "8", "6"], ["K", "Q", "10", "5"]),
      south: hand(["4", "2"], ["A", "J", "9", "5", "2"], ["J", "10", "7"], ["4", "3", "2"]),
      west: hand(["J", "10", "8", "6", "3"], ["8"], ["K", "9", "4"], ["A", "J", "8", "6"]),
    },
    commentary: "Nord taglia il 3 giro di fiori e gioca Quadri verso il morto. Che fare? Se Ovest impegna il K, Nord mette l'A di quadri. A questo punto, eliminati i semi neri, intavola il J di quadri. Se Ovest segue la regola e, rigiocando verso il 10 del morto, pagherà a Est la Q di quadri come unica presa: 4 cuori fatte. Se Ovest non copre, regola e sta basso, Nord poi Nord, rimasto con A53 per 107, sara costretto a pagarne ancora una! (nota: eliminare le picche sarebbe dovuto uscire o in taglio e scarto o a quadri). 'Onore copre onore' e una regola di buon senso, ma le eccezioni sono tante e ogni volta bisogna ragionarci sopra.",
    bidding: { dealer: "south", bids: ["P", "1H", "P", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG7-5", lesson: 7, board: 5, title: "Coprire o non coprire",
    contract: "4S", declarer: "north", openingLead: c("heart", "A"), vulnerability: "none",
    hands: {
      north: hand(["Q", "J", "10", "8", "6", "5", "4", "2"], ["4", "3"], ["8"], ["K", "Q"]),
      east: hand(["K", "7"], ["A", "K", "7", "6"], ["5", "4", "3"], ["10", "8", "5", "2"]),
      south: hand(["9", "3"], ["8", "5", "2"], ["A", "K", "9", "7", "6"], ["A", "6", "4"]),
      west: hand(["A"], ["Q", "J", "10", "9"], ["Q", "J", "10", "2"], ["J", "9", "7", "3"]),
    },
    commentary: "Anche se in zona, un nobile ottavo... richiede il livello 4. Est attacca A cuori (il partner fornisce la Q, mostrando la sequenza a scendere) e prosegue con il K e ancora cuori. Nord taglia e muove una piccola picche verso il 9 del morto. Una mossa inattesa, ma prima di fiondare il suo Re secondo Est si dovrebbe chiedere: 'perche, con un morto che ha piu ingressi del Colosseo, Nord dovrebbe rinunciare a fare l'impasse al K di atout??' Quando l'avversario non fa un impasse necessario... e perche non ha impasse da fare.",
    bidding: { dealer: "south", bids: ["P", "4S", "P", "P"] },
  },
  {
    id: "CG7-6", lesson: 7, board: 6, title: "Coprire o non coprire",
    contract: "3NT", declarer: "north", openingLead: c("spade", "3"), vulnerability: "none",
    hands: {
      north: hand(["K", "Q", "2"], ["10", "8", "5"], ["Q", "J", "9"], ["J", "8", "7", "3"]),
      east: hand(["7", "6", "3"], ["Q", "J", "9", "4"], ["A", "K", "10"], ["A", "Q", "6"]),
      south: hand(["A", "4"], ["A", "6", "2"], ["8", "7", "5", "3", "2"], ["K", "9", "5"]),
      west: hand(["J", "10", "9", "8", "5"], ["K", "7", "3"], ["6", "4"], ["10", "4", "2"]),
    },
    commentary: "Sia che Est prenda, sia che lisci, Nord al primo giro sblocchera il K (non la Q, il K) di picche. E il primo colore che Est muovera sara certamente una piccola quadri; se Nord non mette nessun onore e se ne vada serenamente sotto. Provera a giocare la Q cuori (ma Sud NON mettera il suo Re, non al primo giro). Non mettiamo carte alte inutilmente solo per paura che l'avversario indovini. Lui non vede le nostre carte. Se indovina, bravo. Ma non aiutiamolo.",
    bidding: { dealer: "south", bids: ["P", "3NT", "P", "P"] },
  },
  {
    id: "CG7-7", lesson: 7, board: 7, title: "Coprire o non coprire",
    contract: "4S", declarer: "south", openingLead: c("club", "A"), vulnerability: "none",
    hands: {
      north: hand(["J", "4", "2"], ["A", "9", "7", "3"], ["Q", "10", "4"], ["J", "8", "6"]),
      east: hand(["9", "8", "3"], ["Q", "10", "8", "4"], ["J", "9"], ["Q", "10", "9", "3"]),
      south: hand(["A", "K", "Q", "6", "5"], ["K"], ["A", "8", "5", "3", "2"], ["5", "4"]),
      west: hand(["10", "7"], ["J", "6", "5", "2"], ["K", "7", "6"], ["A", "K", "7", "2"]),
    },
    commentary: "Ovest attacca A di fiori e, vista la chiamata di Est, prosegue con K di fiori e fiori. Il giocante taglia, batte le Atout e Asso di Quadri e Quadri verso il morto. Che fare? Al morto restano Q e 10. Se Ovest impegna il K, Nord mettera... Sud dovremo indovinare se passare la Q o il 10. Se Ovest ha i problemi suoi. Se non lo mette (sa che lo farà solo quando Est avrà qualcosa di utile), passa tranquillo. E se sbaglia, va sotto. Nota: Ovest ha avuto tutto il tempo per chiedersi cosa avrebbe fatto in questo frangente: il morto e in mano e mette a pensare sul momento! Nel controgioco cerchiamo di accorgerci in tempo dei problemi del dichiarante, cosi quando li affrontera ci troveremo preparati per giocare senza esitazioni.",
    bidding: { dealer: "south", bids: ["1S", "P", "2S", "P", "3D", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG7-8", lesson: 7, board: 8, title: "Coprire o non coprire",
    contract: "3NT", declarer: "west", openingLead: c("spade", "9"), vulnerability: "none",
    hands: {
      north: hand(["9", "6"], ["Q", "10", "7", "3"], ["Q", "5"], ["Q", "10", "9", "8", "3"]),
      east: hand(["Q", "4", "2"], ["9", "8", "2"], ["A", "J", "10", "9", "8"], ["7", "5"]),
      south: hand(["K", "10", "8", "7", "5", "3"], ["J", "6", "4"], ["K", "4", "3"], ["J"]),
      west: hand(["A", "J"], ["A", "K", "5"], ["7", "6", "2"], ["A", "K", "6", "4", "2"]),
    },
    commentary: "Ovest dopo l'intervento dichiara 1NT e mostra cosi una Bilanciata 18-20 (con 12-14 sarebbe passato). Nord intavola il 9 di picche; per Sud la figura e chiara, quindi 'lascia lavorare' il 9 e si limita a invitare. Come entrambi i difensori possono prevedere, il primo colore che Ovest muove e quadri. Nord, se ipotizza (spera) che il K sia in mano al compagno, DEVE giocare la Dama! Se lo fa, Ovest e fritto; puo fare l'impasse dopo. Ma Nord non gioca la Q di fiori al primo giro. Il secondo liscia e sbagliato farlo.",
    bidding: { dealer: "south", bids: ["1S", "1NT", "P", "3NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 8: I giochi di eliminazione
  // ==========================================================================
  {
    id: "CG8-1", lesson: 8, board: 1, title: "I giochi di eliminazione",
    contract: "4S", declarer: "south", openingLead: c("heart", "K"), vulnerability: "none",
    hands: {
      north: hand(["J", "3"], ["10", "9", "8", "5"], ["7", "4"], ["Q", "10", "6", "5", "2"]),
      east: hand(["A", "K", "10", "9", "8"], ["A", "7", "6"], ["K", "10", "9"], ["A", "K"]),
      south: hand(["Q", "7", "6", "5", "4"], ["4", "3", "2"], ["Q", "3", "2"], ["8", "3"]),
      west: hand(["2"], ["K", "Q", "J"], ["A", "J", "8", "6", "5"], ["J", "9", "7", "4"]),
    },
    commentary: "Con un fit quinto Est deve dire subito 4 picche. Il contratto sarebbe molto semplice indovinando la posizione del J di Quadri. Puo farsi aiutare dagli avversari? Si, se prima di metterli in presa toglie loro tutte le uscite tranne quelle che gli farebbero comodo, due giri di atout e poi fiori. L'avversario non e mai propenso ad aiutarci a indovinare una figura. Lo fara solo se non gli lasciamo alternative, ossia se prima gli togliamo tutte le uscite utili.",
    bidding: { dealer: "south", bids: ["P", "3H*", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG8-2", lesson: 8, board: 2, title: "I giochi di eliminazione",
    contract: "6S", declarer: "south", openingLead: c("club", "2"), vulnerability: "none",
    hands: {
      north: hand(["K", "10", "9", "8"], ["A", "K"], ["Q", "J", "7", "6"], ["A", "10", "9"]),
      east: hand(["5", "4"], ["9", "7", "5", "4"], ["8", "3"], ["7", "6", "5", "3", "2"]),
      south: hand(["A", "J", "7", "6"], ["3", "2"], ["A", "K", "10", "9"], ["Q", "J", "8"]),
      west: hand(["Q", "3", "2"], ["Q", "J", "10", "8", "6"], ["5", "4", "2"], ["K", "4"]),
    },
    commentary: "Purtroppo la distribuzione a 'specchio' rende problematico questo slam. Si potrebbero fare 2 impasse prima alla Q di Fiori con ben il 75% di riuscita, trovando almeno 1 delle 2 dame. Pero ci sarebbe una soluzione al 100% se Sud potesse obbligare gli avversari a muovere fiori o quadri. Asso e K di atout - rinunciando all'impasse - e poi anche il K cuori. A questo punto inizia a giocare le Quadri per fare un primo impasse. Giocare Fiori per la Q e cuori per il Re; eliminando dalle carte di Sud le Fiori prima che prendesse. La strategia di 'eliminazione e messa in presa' puo farci rinunciare, a volte, a una possibile presa in piu. Ma spesso ci da la soluzione al 100%.",
    bidding: { dealer: "south", bids: ["1NT", "P", "2C", "P", "2S", "P", "4NT", "P", "5H", "P", "6S", "-"] },
  },
  {
    id: "CG8-3", lesson: 8, board: 3, title: "I giochi di eliminazione",
    contract: "5D", declarer: "north", openingLead: c("heart", "A"), vulnerability: "none",
    hands: {
      north: hand(["9", "4", "2"], [], ["A", "K", "Q", "J", "10", "5", "4"], ["A", "7", "6"]),
      east: hand(["Q", "5", "3"], ["A", "K", "J", "10", "7", "5"], ["6", "3"], ["J", "3"]),
      south: hand(["K", "10", "7", "6"], ["6", "4", "3", "2"], ["9", "8", "7"], ["K", "Q"]),
      west: hand(["A", "J", "8"], ["Q", "9", "8"], ["2"], ["10", "9", "8", "5", "4", "2"]),
    },
    commentary: "Nord ha 10 prese; l'intervento di Est farebbe supporre l'A cuori in Ovest. Tagliato l'attacco Nord comincia l'opera di eliminazione delle cuori: tagliata, fiori per il K e cuori e tagliata. A questo punto elimina le atout in due giri (e per fortuna sono 2-1, per cui ne rimane al morto una in taglio e scarto), incassa l'A fiori scartando l'ultima cuori, e gioca picche superando di misura la carta di Est. Ovest non avra difesa o rigiochera picche o in taglio e scarto. Dare per scontato che una carta alta sia sempre in mano a chi ha interferito e un modo molto semplicistico di affrontare i problemi.",
    bidding: { dealer: "south", bids: ["P", "P", "1D", "1H", "X", "2H", "3S", "P", "5D", "P", "P", "P"] },
  },
  {
    id: "CG8-4", lesson: 8, board: 4, title: "I giochi di eliminazione",
    contract: "6NT", declarer: "west", openingLead: c("diamond", "J"), vulnerability: "none",
    hands: {
      north: hand(["7", "6", "3"], ["7", "4", "2"], ["J", "10", "9", "8"], ["Q", "5", "4"]),
      east: hand(["A", "J", "10", "5"], ["K", "J", "10"], ["A", "Q", "4"], ["K", "7", "6"]),
      south: hand(["K", "Q", "2"], ["A", "9", "8"], ["K", "7", "3", "2"], ["A", "10", "8"]),
      west: hand(["9", "8", "4"], ["Q", "6", "5", "3"], ["6", "5"], ["J", "9", "3", "2"]),
    },
    commentary: "I punti sono ben 35 ma le prese sono solo 11 e le 2 che mancano possono venire solo dalle Cuori, col doppio impasse. Quando dobbiamo fare per questo deve prima eliminare i colori; Asso e K di atout - rinunciando all'impasse. Quadri. Se sono 3-3 bene, se sono 4-2... cediamo la presa a quadri e aspettiamo: chiunque la vinca dovra giocare o fiori o cuori. La manovra di eliminazione e messa in presa non e prerogativa solo del gioco ad atout ma puo presentarsi anche nel gioco a Senza.",
    bidding: { dealer: "south", bids: ["1NT", "P", "6NT", "P", "P", "P"] },
  },
  {
    id: "CG8-5", lesson: 8, board: 5, title: "I giochi di eliminazione",
    contract: "6D", declarer: "south", openingLead: c("heart", "10"), vulnerability: "none",
    hands: {
      north: hand(["A", "Q", "5"], ["A", "K", "J", "3"], ["5", "4"], ["A", "Q", "9", "2"]),
      east: hand(["J", "10", "9", "8"], ["Q", "5", "4"], ["3", "2"], ["K", "10", "5", "4"]),
      south: hand(["6", "2"], ["8", "2"], ["A", "K", "Q", "J", "10", "9", "8"], ["7", "6"]),
      west: hand(["K", "7", "4", "3"], ["10", "9", "7", "6"], ["7", "6"], ["J", "8", "3"]),
    },
    commentary: "La dichiarazione lascia un po' a desiderare (certamente al tavolo avrete fatto di meglio) ma poco importa. Dopo l'attacco abbiamo 11 prese sicure (7 quadri-1 cuori-1 picche-2A) e la 12^ puo saltare fuori in molti modi. Certo, sarebbe meglio se gli avversari ci aiutassero. Prendiamo con il K cuori, poi AK fiori, picche per l'Asso, eliminare cuori e fiori ed infine cuori per loro. A volte basta anche eliminare un solo colore per raggiungere lo scopo.",
    bidding: { dealer: "south", bids: ["2NT", "P", "P", "P", "6D", "P", "P", "P"] },
  },
  {
    id: "CG8-6", lesson: 8, board: 6, title: "I giochi di eliminazione",
    contract: "6S", declarer: "south", openingLead: c("heart", "Q"), vulnerability: "none",
    hands: {
      north: hand(["2"], ["6", "5", "4", "3"], ["Q", "J", "10", "4"], ["K", "Q", "4", "3"]),
      east: hand(["A", "J", "9", "5", "4"], ["K", "7"], ["A", "8", "3"], ["J", "9", "8"]),
      south: hand(["K", "Q", "10", "8", "7", "6"], ["A", "2"], ["K", "2"], ["A", "10", "2"]),
      west: hand(["3"], ["Q", "J", "10", "9", "8"], ["9", "7", "6", "5"], ["7", "6", "5"]),
    },
    commentary: "Una mano che puo sembrare molto semplice: facendo il doppio impasse a Fiori vinceremmo con ben il 75% di probabilita. E' gia buono, ma al 100% e meglio! Eliminiamo le atout, poi le cuori, poi le quadri tagliandone una al morto. Ora usiamo una atout per rientrare la mano. A questo punto - e solo ora- giochiamo Fiori per fare un primo impasse. Se non funziona, l'avversario dovra giocare fiori o in taglio e scarto. Quando avete trovato una buona soluzione, prima di attuarla chiedetevi se per caso ce ne sia una migliore.",
    bidding: { dealer: "south", bids: ["1S", "4NT", "P", "5H", "P", "6S", "P", "P"] },
  },
  {
    id: "CG8-7", lesson: 8, board: 7, title: "I giochi di eliminazione",
    contract: "6S", declarer: "north", openingLead: c("heart", "10"), vulnerability: "none",
    hands: {
      north: hand(["A", "J", "10", "8", "7", "6", "5"], ["6"], ["A", "Q"], ["A", "J", "6"]),
      east: hand([], ["10", "9", "8", "7"], ["K", "6", "5", "4", "3"], ["Q", "8", "7", "2"]),
      south: hand(["Q", "4", "3", "2"], ["A", "Q", "J", "5", "4"], ["7", "2"], ["K", "9"]),
      west: hand(["K", "9"], ["K", "3", "2"], ["J", "10", "9", "8"], ["10", "5", "4", "3"]),
    },
    commentary: "Dopo l'attacco (Est non ha molta scelta: regala il contratto con 2 attacchi su 3) le strade possibili sono molte (impasse a Quadri, caduta del K di Picche, impasse a Cuori) ma ce n'e una sicura: preso al morto con A cuori giochiamo Picche e poi Quadri verso il morto. In ogni caso l'avversario non ha piu difesa. Ogni regola ha le sue eccezioni. A volte bisogna fare qualcosa di diverso dalle strade battute, ad esempio fare l'impasse al K con 11 carte!",
    bidding: { dealer: "south", bids: ["1H", "P", "1S", "P", "2S", "P", "4NT", "P", "5D", "P", "6S", "P", "P", "P"] },
  },
  {
    id: "CG8-8", lesson: 8, board: 8, title: "I giochi di eliminazione",
    contract: "4S", declarer: "west", openingLead: c("club", "K"), vulnerability: "none",
    hands: {
      north: hand(["5", "4"], ["J", "10", "8", "6"], ["5", "2"], ["K", "Q", "J", "10", "8"]),
      east: hand(["8", "7", "6"], ["K", "Q"], ["Q", "J", "10", "9", "8"], ["A", "4", "3"]),
      south: hand(["A", "3", "2"], ["A", "9", "5", "4", "3"], ["6", "4", "3"], ["9", "6"]),
      west: hand(["K", "Q", "J", "10", "9"], ["7", "2"], ["A", "K", "7"], ["7", "5", "2"]),
    },
    commentary: "Dopo l'attacco notiamo che le prese a disposizione sarebbero anche molte ma gli avversari sono in vantaggio di tempo ed incasseranno 2 fiori, 1 cuori e l'Asso di Atout. Sembra impossibile mettervi rimedio a meno che l'avversario che dovesse prendere a picche non abbia piu Fiori da giocare. Per questo motivo non prendiamo immediatamente ma al secondo giro, poi Atout. Siamo riusciti a non far incassare 2 fiori all'avversario, semplicemente eliminando dalle carte di Sud le Fiori prima che prendesse. Non prendere al primo giro, nel gioco ad atout, puo essere conveniente tutte le volte che ritenete (o sperate) che uno degli avversari abbia due sole carte.",
    bidding: { dealer: "south", bids: ["1S", "P", "2D", "P", "2S", "P", "4S", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 9: Giocare come se
  // ==========================================================================
  {
    id: "CG9-1", lesson: 9, board: 1, title: "Giocare come se",
    contract: "4H", declarer: "south", openingLead: c("club", "10"), vulnerability: "none",
    hands: {
      north: hand(["K", "4"], ["Q", "J", "5", "3", "2"], ["K", "10", "9"], ["7", "6", "4"]),
      east: hand(["Q", "J", "5", "2"], ["10"], ["Q", "7", "2"], ["A", "K", "J", "3", "2"]),
      south: hand(["8", "7"], ["A", "K", "7", "6", "4"], ["A", "J", "8", "6"], ["Q", "5"]),
      west: hand(["A", "10", "9", "6", "3"], ["9", "8"], ["5", "4", "3"], ["10", "9", "8"]),
    },
    commentary: "Il contratto non e di battuta ma nemmeno... bruttissimo. Si ha bisogno di indovinare chi abbia la Q di quadri, e di indovinare chi abbia dell'A di picche in Ovest e' una condizione indispensabile per il mantenimento del contratto, quindi giochiamo come se fosse cosi. L'A di picche ben piazzato e una condizione indispensabile. Anche in controgioco, quando sembra inevitabile che il giocante mantenga il contratto, se esiste una sola situazione possibile per battere bisogna trovarla e provarci.",
    bidding: { dealer: "south", bids: ["1H", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG9-2", lesson: 9, board: 2, title: "Giocare come se",
    contract: "6C", declarer: "west", openingLead: c("club", "10"), vulnerability: "none",
    hands: {
      north: hand(["J", "9", "6", "4"], ["K", "Q", "J", "5"], ["J"], ["Q", "8", "6", "2"]),
      east: hand(["A", "K", "Q", "10"], ["9", "6"], ["Q", "8", "7", "3", "2"], ["5", "4"]),
      south: hand(["8", "5", "2"], ["A", "7"], ["A", "K", "10", "9"], ["A", "10", "7", "3"]),
      west: hand(["7", "3"], ["10", "8", "4", "3", "2"], ["6", "5", "4"], ["K", "J", "9"]),
    },
    commentary: "Con la replica 2 quadri Est mostra mano di Diritto; 2NT e forzante e 3NT mostra una bilanciata approssimativa ha portato a un ottimo slam, purtroppo il primo colpo di atout svela la Q quarta in Nord. L'importante e non perdere la calma. Lo slam e la decima. Nord ha 2 strade: a) fare l'impasse al K di quadri e poi tagliare una al morto; b) affrancare le fiori con un impasse di taglio. Quale strada seguire? Sicuramente la seconda perche Est, passato di mano, ha gia mostrato AKQ cuori quindi non puo avere il K di quadri, e nemmeno l'A di fiori. Nord incassa AK di picche e intavola il K di picche, scartando quadri, e poi anche il K cuori. A questo punto e sicuro: incassa le fiori. Quando si deve ripetere un impasse occorre conservare i rientri necessari.",
    bidding: { dealer: "south", bids: ["P", "2C", "P", "2D*", "P", "3D", "P", "3S", "P", "6C"] },
  },
  {
    id: "CG9-3", lesson: 9, board: 3, title: "Giocare come se",
    contract: "3NT", declarer: "east", openingLead: c("heart", "Q"), vulnerability: "none",
    hands: {
      north: hand(["Q", "J", "8", "3"], ["A", "K", "5"], ["9", "8", "7"], ["10", "8", "4"]),
      east: hand(["A", "K", "10"], ["7", "6", "4"], ["A", "J", "4", "2"], ["K", "7", "3"]),
      south: hand(["7", "6", "4", "2"], ["Q", "J", "10", "9", "8", "2"], ["K", "Q"], ["A"]),
      west: hand(["9", "5"], ["3"], ["10", "6", "5", "3"], ["Q", "J", "9", "6", "5", "2"]),
    },
    commentary: "Dopo l'attacco gli avversari incassano 4 Cuori e poi Nord sblocca A e K. Dopo l'attacco, Est ha 8 vincenti (3 picche + 2 Quadri + 2 fiori + K cuori in coppia) e la nona puo venire dalla Q di quadri (se cade, il che e improbabile: sembra 4-1) o dall'impasse al K di picche. Quando abbiamo una sola possibilita non sprechiamola, per poco probabile che sia.",
    bidding: { dealer: "south", bids: ["P", "P", "P", "1NT", "P", "3NT", "P", "P"] },
  },
  {
    id: "CG9-4", lesson: 9, board: 4, title: "Giocare come se",
    contract: "7S", declarer: "north", openingLead: c("club", "10"), vulnerability: "none",
    hands: {
      north: hand(["7", "6"], ["Q", "J"], ["A", "K", "8", "7", "5", "2"], ["A", "Q", "6"]),
      east: hand(["10", "9", "8", "2"], ["A", "K", "10", "2"], ["10"], ["10", "9", "4", "2"]),
      south: hand(["A", "K", "J", "5", "3"], ["9", "4"], ["Q", "J", "9", "6"], ["K", "8"]),
      west: hand(["Q", "4"], ["8", "7", "6", "5", "3"], ["4", "3"], ["J", "7", "5", "3"]),
    },
    commentary: "Nord attacca con l'Asso di Cuori e si ferma a guardare il morto, chiuso con tutte prese vincenti. Dove puo venire la presa del down? Solo da una promozione in Atout, se Sud gioca il J di picche terzo o piu. Giocando ancora Cuori Nord gioca la sua unica chance di salvezza. La sua unica speranza, se riesce o piu. Anche in controgioco, quando sembra inevitabile che il giocante mantenga il contratto, se esiste una sola situazione possibile per battere bisogna trovarla e provarci.",
    bidding: { dealer: "south", bids: ["P", "3S", "P", "5C", "P", "6S", "P", "P", "P"] },
  },
  {
    id: "CG9-5", lesson: 9, board: 5, title: "Giocare come se",
    contract: "7NT", declarer: "west", openingLead: c("spade", "10"), vulnerability: "none",
    hands: {
      north: hand(["10", "9", "8", "4", "2"], ["9", "8", "4", "3", "2"], ["6"], ["8", "7"]),
      east: hand(["Q", "7", "6"], ["K", "10", "7"], ["A", "10", "9", "4"], ["K", "6", "2"]),
      south: hand(["J", "3"], ["6", "5"], ["J", "5", "3", "2"], ["10", "9", "5", "4", "3"]),
      west: hand(["A", "K", "5"], ["A", "Q", "J"], ["K", "Q", "8", "7"], ["A", "Q", "J"]),
    },
    commentary: "Con la replica 2 quadri Est mostra mano di Diritto; 2NT e forzante e 3NT mostra una bilanciata. Se Ovest sa far di somma, chiamare il grande (a Senza!) non e difficile. Dopo l'attacco conta 12 prese certe, 13 se le quadri ne daranno 4. Prima di giocare il seme di Quadri pero si potrebbe esaminare, giocando gli altri semi, a volte si scopre qualcosa di utile. Giocando 3 Picche e 3 Cuori; per differenza Sud possiede 4 cuori. Quindi K quadri e A quadri, e poi impasse su di lui.",
    bidding: { dealer: "south", bids: ["P", "2C", "P", "2D*", "P", "2NT", "P", "3NT", "P", "7NT", "P", "P", "P"] },
  },
  {
    id: "CG9-6", lesson: 9, board: 6, title: "Giocare come se",
    contract: "6H", declarer: "north", openingLead: c("spade", "A"), vulnerability: "none",
    hands: {
      north: hand(["K", "Q"], ["8", "7", "6"], ["A", "Q", "J", "10", "8", "4"], ["A", "Q"]),
      east: hand(["A", "9", "8", "3"], ["9", "5", "4"], ["9"], ["K", "9", "5", "4", "3"]),
      south: hand(["J", "6", "2"], ["A", "K", "Q", "J", "3"], ["7", "6", "2"], ["J", "10"]),
      west: hand(["10", "7", "5", "4"], ["10", "2"], ["K", "5", "3"], ["8", "7", "6", "2"]),
    },
    commentary: "La dichiarazione evidenzia in Sud la mancanza di controlli laterali, ma Nord confidando nelle Quadri chiama il slam. Sud vede che dovra per forza perdere l'A di picche quindi dovremo fare tutte le altre. Eliminare le atout, poi le fiori con impasse. Se l'impasse a fiori funziona, bene. Se no, dobbiamo fare tutte le quadri (impasse al K). Quando la linea di gioco e obbligata possiamo rilassarci e affrontare sereni il destino: non avendo scelte da fare o la va o la spacca.",
    bidding: { dealer: "south", bids: ["1H", "P", "2D", "P", "2H", "P", "3H", "P", "4H", "P", "4NT", "P", "5S", "P", "6H"] },
  },
  {
    id: "CG9-7", lesson: 9, board: 7, title: "Giocare come se",
    contract: "3NT", declarer: "south", openingLead: c("heart", "K"), vulnerability: "none",
    hands: {
      north: hand(["K", "8", "6", "5"], ["7", "5", "3", "2"], ["7", "4"], ["A", "4", "2"]),
      east: hand(["A", "J", "10", "2"], ["J", "6"], ["A", "K", "Q", "J"], ["8", "7", "3"]),
      south: hand(["Q", "9", "3"], ["A", "8"], ["9", "5", "6", "3"], ["J", "9", "6", "5"]),
      west: hand(["7", "4"], ["K", "Q", "10", "9", "4"], ["10", "8", "2"], ["K", "Q", "10"]),
    },
    commentary: "Con ben 28 punti il contratto non e al sicuro; le Fiori vanno ignorate perche Sud e in vantaggio di tempo e affrancare le Fiori significa rassegnarsi al down. E' necessario ottenere 4 prese dalle picche, quindi bisogna per forza fare l'impasse al K e garantirsi di poterlo ripetere 'restando nel colore', visto che il morto non ha ingressi. Bisogna muovere prima il 9 e poi altrimenti corriamo il rischio di bloccare il colore (se giochiamo la Q e Nord astutamente non copre, non faremo 4 prese perche la seconda presa dovremo vincerla in mano per forza). Anche quando abbiamo trovato la via corretta, attenzione a come muovere le carte. Una buccia di banana e sempre possibile.",
    bidding: { dealer: "south", bids: ["P", "P", "P", "2NT", "P", "3NT", "P", "P"] },
  },
  {
    id: "CG9-8", lesson: 9, board: 8, title: "Giocare come se",
    contract: "6NT", declarer: "east", openingLead: c("spade", "10"), vulnerability: "none",
    hands: {
      north: hand(["8", "7", "6", "3"], ["A", "Q"], ["Q", "9", "6", "4"], ["A", "K", "Q"]),
      east: hand(["K", "J", "9", "2"], ["10", "9", "5", "4"], ["8"], ["10", "9", "8", "3"]),
      south: hand(["A", "Q", "10"], ["K", "J"], ["A", "K", "7", "2"], ["J", "7", "6", "2"]),
      west: hand(["5", "4"], ["8", "7", "6", "3", "2"], ["J", "10", "5", "3"], ["5", "4"]),
    },
    commentary: "Una dichiarazione semplice ma efficace. A prima vista, nonostante la sfortunata duplicazione a cuori, Nord conta 11 prese 'certe', ma l'incasso delle Quadri da una brutta sorpresa. Ora non basta piu il semplice impasse al K di picche, il colore deve dare 3 prese ed e quindi necessario trovare sia il K sia il J entrambi in Est! Se non fosse cosi non potremmo mantenere il nostro impegno. Quindi giochiamo immediatamente Picche verso il 10; se non va pazienza, provarci e meglio che imbussolare dichiarandoci down. Nota: anche se avessimo trovato le Quadri divise avremmo dovuto giocare picche al 10: dovendo fare una sola presa in piu, il 75% e meglio del 50%. Il J entrambi in Est! Quando tutto sembra andare male, provarci e meglio che arrendersi.",
    bidding: { dealer: "south", bids: ["6NT", "P", "P", "P"] },
  },

  // ==========================================================================
  // LESSON 10: Le deduzioni del giocante
  // ==========================================================================
  {
    id: "CG10-1", lesson: 10, board: 1, title: "Le deduzioni del giocante",
    contract: "4H", declarer: "west", openingLead: c("diamond", "A"), vulnerability: "none",
    hands: {
      north: hand(["A", "8", "4"], ["7", "6", "3"], ["A", "K", "6", "2"], ["9", "5", "2"]),
      east: hand(["K", "Q", "9", "7", "6"], ["A", "8", "5"], ["Q", "J", "10"], ["7", "6"]),
      south: hand(["J", "10", "5"], ["K"], ["8", "7", "5", "3"], ["J", "10", "8", "4", "3"]),
      west: hand(["3", "2"], ["Q", "J", "10", "9", "4", "2"], ["9", "4"], ["A", "K", "Q"]),
    },
    commentary: "Nord attacca A di quadri, e poiche la Q scende al morto Sud, come da accordi, da il conto (8). Nord sa di poter incassare anche il K e, temendo che Ovest possa avere una 1624, incassa l'A di picche e ci prosegue. Ovest sa che ora tutto dipende dall'impasse al K cuori; e si prepara a farlo quando scatta un allarme: e possibile che Nord abbia il K di cuori, avendo detto passo di mano? Il K e sicuramente in Sud e l'unica possibilita e sperare che sia secco. Batte l'A cuori e la fortuna lo premia. Stiamo attenti alla dichiarazione avversaria. Anche un Passo puo dire molto!",
    bidding: { dealer: "south", bids: ["P", "2H", "P", "4H", "P", "P", "P"] },
  },
  {
    id: "CG10-2", lesson: 10, board: 2, title: "Le deduzioni del giocante",
    contract: "4S", declarer: "north", openingLead: c("heart", "2"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "J", "10", "9"], ["10", "8", "5"], ["K", "3"], ["A", "8", "4"]),
      east: hand(["6"], ["K", "J", "9", "7", "4", "2"], ["A", "J", "4"], ["K", "7", "3"]),
      south: hand(["Q", "7", "4", "3", "2"], ["3"], ["Q", "9", "8", "6"], ["Q", "10", "6"]),
      west: hand(["8", "5"], ["A", "Q", "6"], ["10", "7", "5", "2"], ["J", "9", "5", "2"]),
    },
    commentary: "Dichiarazione in puro stile Legge: il 3 cuori di Est e una competizione basata sul numero delle atout e non sulla forza. L'attacco viene preso dall'A cuori per il suo meglio torna Atout. Nord conta 3 prese sicure (5 picche+2 cuori+1A) ne fara un'altra a quadri, ma la decima dovra saltar fuori dalle Fiori passando la carta giusta quando muovera piccola verso Q10. Analizziamo l'attacco: Est non puo avere K e Q di Cuori (avrebbe attaccato con K) quindi Ovest ha AQ e Est il K, o KJ. Per giustificare l'apertura Est deve l'A quadri, ma anche il K fiori! Nord passa la dama. A volte gia dall'attacco possiamo ricostruire quasi completamente le mani avversarie.",
    bidding: { dealer: "south", bids: ["P", "2H", "2S", "3H", "4S", "P", "P", "P"] },
  },
  {
    id: "CG10-3", lesson: 10, board: 3, title: "Le deduzioni del giocante",
    contract: "3H", declarer: "south", openingLead: c("spade", "A"), vulnerability: "none",
    hands: {
      north: hand(["Q", "9", "3"], ["4", "2"], ["A", "10", "9", "7", "3"], ["10", "7", "5"]),
      east: hand(["J", "10"], ["A", "K", "Q", "10", "9", "8"], ["4", "2"], ["8", "3", "2"]),
      south: hand(["7", "6", "4", "2"], ["J", "5", "3"], ["K", "J"], ["A", "Q", "9", "4"]),
      west: hand(["A", "K", "8", "5"], ["7", "6"], ["Q", "8", "6", "5"], ["K", "J", "6"]),
    },
    commentary: "Sud attacca A di picche, prosegue con il K su invito di Nord, e poi per il suo meglio devia a quadri, con il 5. Est sa che, non trattandosi di un attacco iniziale, l'onore di Sud puo essere sia l'Asso sia la dama, e ora deve indovinare che carta mettere. Ha 6 prese a cuori, per arrivare a 9 ha bisogno di fare 2 prese a Fiori ed una a Quadri: gioca quindi il J di quadri per l'Asso in Nord e colleziona muovendo accortamente le fiori 9 prese. Quando avete 'bisogno' che una carta sia in mano a un preciso avversario comportatevi come se lo fosse, e ricostruite la sua mano di conseguenza.",
    bidding: { dealer: "south", bids: ["1D", "P", "2D", "2H", "P", "3H", "P", "P"] },
  },
  {
    id: "CG10-4", lesson: 10, board: 4, title: "Le deduzioni del giocante",
    contract: "4S", declarer: "south", openingLead: c("heart", "A"), vulnerability: "none",
    hands: {
      north: hand(["K", "10", "9", "7"], ["7", "6"], ["A", "K", "Q", "4"], ["K", "Q", "6"]),
      east: hand(["Q", "6", "3"], ["K", "9", "3", "2"], ["J", "10", "9"], ["8", "4", "2"]),
      south: hand(["A", "J", "8", "5", "4"], ["10", "4"], ["8", "3"], ["A", "9", "5", "3"]),
      west: hand(["2"], ["A", "Q", "J", "8", "5"], ["7", "6", "5", "2"], ["J", "10", "7"]),
    },
    commentary: "Ovest incassa A cuori e K cuori e sul 3 di scarto del partner continua 8 di fiori. Est gioca A e poi continua. Sud prende in mano da il taglio di Cuori e gioca atout. Nord conta 3 prese sicure la decima dovra saltar fuori dalle Fiori o dalla caduta della Q di picche. Qual e la percentuale? Con 9 carte di atout, mancano solo 4, il che ci darebbe circa il 62%. Ma la distribuzione di Est (mostrata 10 cuori e fiori) e 3-2-2-6. Ovest ha mostrato 10 carte (cuori e fiori), al massimo 3 carte tra picche e quadri. Sicuramente la seconda perche la Q dovra cadere. Le deduzioni sono una delle gratificazioni piu eccitanti del gioco.",
    bidding: { dealer: "south", bids: ["4H", "X", "P", "P"] },
  },
  {
    id: "CG10-5", lesson: 10, board: 5, title: "Le deduzioni del giocante",
    contract: "7NT", declarer: "west", openingLead: c("spade", "10"), vulnerability: "none",
    hands: {
      north: hand(["10", "9", "8", "4", "2"], ["9", "8", "4", "3", "2"], ["6"], ["8", "7"]),
      east: hand(["Q", "7", "6"], ["K", "10", "7"], ["A", "10", "9", "4"], ["K", "6", "2"]),
      south: hand(["J", "3"], ["6", "5"], ["J", "5", "3", "2"], ["10", "9", "5", "4", "3"]),
      west: hand(["A", "K", "5"], ["A", "Q", "J"], ["K", "Q", "8", "7"], ["A", "Q", "J"]),
    },
    commentary: "Con la replica 2 quadri Est mostra mano di Diritto; 2NT e forzante e 3NT mostra una bilanciata. Se Ovest sa far di somma, chiamare il grande (a Senza!) non e difficile. Dopo l'attacco conta 12 prese certe, 13 se le quadri ne daranno 4. Prima di giocare il seme di Quadri pero si potrebbe esaminare, giocando gli altri semi, a volte si scopre qualcosa di utile. Giocando 3 Picche e 3 Cuori; per differenza Sud possiede K di quadri. Quindi K quadri e A quadri e poi impasse. Prima di affrontare un problema cerchiamo, se non ci costa nulla, di ottenere il maggior numero possibile di informazioni.",
    bidding: { dealer: "south", bids: ["P", "2C", "P", "2D*", "P", "2NT", "P", "3NT", "P", "7NT", "P", "P", "P"] },
  },
  {
    id: "CG10-6", lesson: 10, board: 6, title: "Le deduzioni del giocante",
    contract: "4S", declarer: "south", openingLead: c("club", "A"), vulnerability: "none",
    hands: {
      north: hand(["A", "K", "Q", "10", "9", "8", "6"], ["9", "6", "3"], ["8", "5", "2"], []),
      east: hand(["J"], ["A", "K", "Q", "10"], ["9", "7", "6", "3"], ["9", "7", "4", "2"]),
      south: hand(["7", "4", "2"], ["J", "8", "7", "4"], ["K", "Q", "J", "10"], ["8", "5"]),
      west: hand(["5", "3"], ["5", "2"], ["A", "4"], ["A", "K", "Q", "J", "10", "6", "3"]),
    },
    commentary: "Est gioca A, K e Q di Cuori ed ancora Cuori per il taglio e surtaglio di Nord (non con il 6, per favore: se cade il J del morto puo essere ingresso un ingresso). Nord ha 10 prese Nord ha 2 strade: a) fare l'impasse al K di quadri e poi tagliare una al morto; b) affrancare le fiori con un impasse di taglio. Quale strada seguire? Se un solo colore ci fornisce le prese che mancano guardiamo solo quello.",
    bidding: { dealer: "south", bids: ["1C", "P", "1S", "P", "1NT", "P", "4S", "P", "P", "P"] },
  },
  {
    id: "CG10-7", lesson: 10, board: 7, title: "Le deduzioni del giocante",
    contract: "2S", declarer: "south", openingLead: c("club", "A"), vulnerability: "none",
    hands: {
      north: hand(["A", "J", "6", "5"], ["7", "6", "4", "3"], ["10", "4"], ["6", "4", "3"]),
      east: hand(["3", "2"], ["10", "9", "8", "2"], ["K", "8", "7", "5", "3"], ["J", "5"]),
      south: hand(["Q", "10", "9", "8", "7"], ["K", "J"], ["A", "Q", "9"], ["Q", "9", "8"]),
      west: hand(["K", "4"], ["A", "Q", "5"], ["J", "6", "2"], ["A", "K", "10", "7", "2"]),
    },
    commentary: "Ovest ha mostrato AK di fiori, AQ cuori e K di picche: sono 16. Se avesse anche il K di quadri avrebbe 19 punti, incompatibili con l'intervento. Con questo impasse, tranquillo al 100%, NS segnano 110 sudatissimi punti. Contare i punti mentre si gioca non e difficile, quando la licita ha dato informazioni. Non siate pigri!",
    bidding: { dealer: "south", bids: ["1S", "1NT", "2S", "P", "P", "P"] },
  },
  {
    id: "CG10-8", lesson: 10, board: 8, title: "Le deduzioni del giocante",
    contract: "4S", declarer: "south", openingLead: c("club", "A"), vulnerability: "none",
    hands: {
      north: hand(["J", "10", "9", "8"], ["8", "5", "2"], ["A", "Q", "6", "4"], ["5", "3"]),
      east: hand(["3"], ["10", "6", "3"], ["K", "9", "3", "2"], ["Q", "10", "9", "4", "2"]),
      south: hand(["A", "K", "Q", "7", "6", "5"], ["A", "Q", "J"], ["J", "8"], ["J", "6"]),
      west: hand(["4", "2"], ["K", "9", "7", "4"], ["10", "7", "5"], ["A", "K", "8", "7"]),
    },
    commentary: "Ovest gioca AK di fiori e poi atout. Sud ha 8 prese sicure (6 picche+1 cuori+1A) e le 2 che mancano possono trovarle facendo l'impasse a Cuori e quello a Quadri. Ben giocato, anche se va tutto storto. C'era una soluzione? Si, difficile da vedere: Ovest (passato di mano) non puo avere entrambi i K quindi se l'impasse a Cuori andra male, andra male anche quello a Quadri. Ma che succederebbe giocando invece il 4 verso il J? Se prendesse Ovest si avrebbe la certezza che l'impasse a Cuori andra bene, e se se e Est a prendere - su niente- le Quadri darebbero 3 prese: A, Q, J. Una soluzione difficile restera sempre tale, se non la incontrate almeno una volta!",
    bidding: { dealer: "south", bids: ["1S", "P", "3S", "P", "4S", "P", "P", "P"] },
  }
];

// Development-time validation
if (process.env.NODE_ENV === "development") {
  cuoriGiocoSmazzate.forEach((s) => {
    const positions: (keyof typeof s.hands)[] = ["north", "south", "east", "west"];
    const allCards: string[] = [];

    positions.forEach((pos) => {
      const cardCount = s.hands[pos].length;
      if (cardCount !== 13) {
        console.warn(
          `[cuori-gioco-smazzate] WARNING: ${s.id} ${pos} has ${cardCount} cards (expected 13)`
        );
      }
      s.hands[pos].forEach((card) => {
        allCards.push(`${card.suit}-${card.rank}`);
      });
    });

    if (allCards.length !== 52) {
      console.warn(
        `[cuori-gioco-smazzate] WARNING: ${s.id} has ${allCards.length} total cards (expected 52)`
      );
    }

    const unique = new Set(allCards);
    if (unique.size !== 52) {
      console.warn(
        `[cuori-gioco-smazzate] WARNING: ${s.id} has ${unique.size} unique cards (expected 52, ${52 - unique.size} duplicates)`
      );
    }
  });
}

export default cuoriGiocoSmazzate;
