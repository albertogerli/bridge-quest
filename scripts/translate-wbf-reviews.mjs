import { readFileSync, writeFileSync } from "fs";

const IT = {
"wbf-1.2-1": "Nord è il primo ad annunciare i suoi punti, poi fanno lo stesso Est, Sud e Ovest. Ogni coppia somma i propri punti (23 punti per NS, 17 per EO). La coppia NS ha la maggioranza e la Tabella di Decisione indica che dovrebbe riuscire a fare 8 prese.",
"wbf-1.2-2": "Est, avendo meno di 12 punti, dice 'Passo'. Sud, con 18 punti, dice semplicemente 'Apro'. Nord, il compagno, annuncia allora ad alta voce: 'Ho 4 punti'. Sud calcola che la coppia ha 22 punti e quindi annuncia: 'Giocherò per fare almeno 7 prese'. Questo significa che Sud dichiara un contratto e diventa il Dichiarante.",
"wbf-1.2-3": "Ovest, seduto alla sinistra del Dichiarante, attacca con l'asso di cuori, e Nord stende il morto sul tavolo. Sud ora vede le carte del morto e può iniziare a elaborare una strategia per mantenere il contratto combinando le due mani. Alla fine della smazzata, i punti vengono assegnati all'una o all'altra coppia a seconda che il contratto sia mantenuto o cada.",
"wbf-1.2-4": "Se Ovest gioca tutte le sue fiori, la difesa farà cinque prese. Nonostante i punti e ciò che indica la Tabella di Decisione, Sud non manterrà il contratto pur non avendo commesso errori. Punteggio: 3NT -1 / 50 EO.",
"wbf-1.3-1": "Ovest attacca con l'asso di quadri e, vedendo il morto, capisce che continuando col re tutte le sue quadri diventeranno vincenti. L'unico problema per Sud è scartare correttamente e conservare le fiori. Punteggio: 2NT = / 120 NS.",
"wbf-1.3-2": "Ovest dovrebbe notare che il fante di picche è una delle tre carte del morto e cadrà quando si giocheranno re e dama. Il 10 di picche diventerà allora vincente. Ovest fa quindi le prime quattro prese.",
"wbf-1.3-3": "Sud apre e il compagno annuncia 11 punti. Sud ha quindi un totale di 25 punti e dichiara 3NT. Ovest attacca con l'asso di cuori e vede sul morto fante, 10 e 9 di cuori. Così, dopo aver giocato asso, re e dama, l'8 e il 7 diventeranno vincenti. Punteggio: 3NT -1 / 50 EO.",
"wbf-1.3-4": "Sud chiede al compagno: 'Quanti punti hai?'. Nord risponde: 'Ho 9 punti'. Con 25 punti, la Tabella di Decisione indica che possono giocare un contratto da nove prese, quindi Sud dichiara: 'Gioco 3NT'. Punteggio: 3NT = 400 NS.",
"wbf-2.1-1": "Il Dichiarante deve fare attenzione nel giocare il colore di picche, iniziando con l'onore dalla mano corta. Vince l'attacco col re di quadri, poi gioca la dama di picche proseguendo con il 2 e il 4 verso il fante. Ora è nella mano giusta per incassare asso e re di picche. Punteggio: 2NT = / 120 NS.",
"wbf-2.1-2": "Oltre all'asso di cuori, Sud deve fare le sue prese: ogni volta deve iniziare con l'onore dalla mano corta. Punteggio: 3NT = / 400 NS.",
"wbf-2.1-3": "Est deve prendere con un onore, giocare l'altro e infine rimettere in presa il compagno con il 4 di quadri. Gioca gli onori dalla mano corta per non bloccare il colore. Punteggio: 3NT -1 / 50 EO.",
"wbf-2.1-4": "Ovest deve notare il 10 di cuori nel morto e vedere che tutte le cuori sono vincenti. Deve pensare a catturare la dama del compagno con il re. Punteggio: 3NT -1 / 50 EO.",
"wbf-2.2-1": "Sud può affrancare prese a fiori: deve farlo subito, prima di incassare le vincenti negli altri colori. Punteggio: 1NT = / 90 NS.",
"wbf-2.2-2": "Ovest attacca con il re di picche. Quando rientrerà in presa con l'asso di cuori, potrà incassare tutte le sue picche. Una presa sotto. Punteggio: 3NT -1 / 50 EO.",
"wbf-2.2-3": "Il Dichiarante deve affrancare le sue quadri. Entrambi i difensori devono tornare a fiori appena rientrano in presa. Punteggio: 3NT -1 / 50 EO.",
"wbf-2.2-4": "Sud gioca subito una cuori verso la dama per affrancare due prese d'onore. Giocando più tardi un altro giro di cuori farà cadere il secondo onore avversario e affrancherà due prese. Punteggio: 3NT +1 / 430 NS.",
"wbf-2.3-1": "L'attacco con il fante di cuori garantisce al Dichiarante due prese nel colore, perché giocherà per ultimo la carta di quella prima presa. Il Dichiarante ha otto quadri. Se le quadri sono divise 3-2, affrancherà due prese di lunga. Gioca asso, re e una piccola quadri. Punteggio: 3NT +1 / 430 NS.",
"wbf-2.3-2": "Ovest attacca con il 3 di cuori. Est deve scegliere la sua carta in base a quella giocata dal morto. Il Dichiarante affranca le sue quadri, ma la difesa vince la corsa: tre cuori affrancate più asso e re di quadri. Punteggio: 3NT -1 / 50 EO.",
"wbf-2.3-3": "Il Dichiarante deve affrancare il colore lungo del morto concedendo due prese agli avversari. Gioca quadri alla seconda presa. Punteggio: 2NT = / 120 NS.",
"wbf-2.3-4": "Ovest attacca con il 3 di fiori. Est deve collaborare con la dama per far cadere un onore alto. Così, quando Ovest rientrerà in presa, potrà incassare tutte le fiori. Le coppie che giocano 2NT cadranno.",
"wbf-T1-1": "Difesa: attacca dalla cima di una sequenza. Dichiarante: affranca le quadri del morto concedendo una presa agli avversari prima di giocare le cuori.",
"wbf-T1-2": "Licita: non dichiarare l'inutile livello di 4NT con 27 PO. Difesa: gioca la carta più alta in terza posizione sull'attacco. Dichiarante: vinci il ritorno a picche con il re, poi gioca prima gli onori di quadri dalla mano corta. Se non si scarta una fiori dal morto, l'ultima fiori diventerà vincente dopo asso, re e dama di fiori.",
"wbf-T1-3": "Difesa: gioca la carta giusta in terza posizione. Dichiarante: può fare solo otto prese.",
"wbf-T1-4": "Difesa: Sud deve continuare a fiori per affrancare una presa di lunga dopo l'attacco e il ritorno a fiori.",
"wbf-3.1-1": "Questa smazzata si gioca a Senza Atout. 3NT cade sull'attacco dell'asso di fiori: la difesa fa cinque prese a fiori e l'asso di picche.",
"wbf-3.1-2": "Est passa e Sud apre. La smazzata va giocata con le cuori come atout. Nord annuncia 9 punti. La coppia ha 28 punti: vediamo quante prese si possono fare. Ovest attacca con il fante di picche. Il secondo giro di picche viene tagliato. Sud può ora fare tutte le prese.",
"wbf-3.1-3": "Sud apre e gioca il contratto con le fiori come atout. Puoi notare che avevi 20 PO e che probabilmente hai fatto undici prese tagliando tre picche.",
"wbf-3.1-4": "Sud gioca un contratto a cuori atout. Ovest attacca con l'asso di picche. Sud farà dieci prese se la terza picche viene tagliata con una cuori alta, altrimenti la carta del morto verrà surtagliata.",
"wbf-3.2-1": "Attacco: asso di cuori. La seconda cuori viene tagliata da Nord e il Dichiarante fa tutte le prese restanti se batte prima le atout, per impedire ai difensori di tagliare.",
"wbf-3.2-2": "Sud deve battere le atout. Poiché la coppia ha nove quadri e gli avversari ne hanno quattro, qui bastano due giri. Battute le atout, al morto restano ancora due quadri per tagliare due picche. Punteggio: 5♦ = / 400 NS.",
"wbf-3.2-3": "Sud apre e Nord risponde: 'Ho una picche, cinque cuori'. Sud dice: 'cuori atout'. Nord valuta la mano: 8 PO + 2 (singolo). Anche Sud valuta la mano: 16 PO + 3 (nona e decima atout) + 1 (doubleton). Il totale delle due mani è 30. Nessun motivo per dichiarare slam, quindi Sud annuncia: 'Gioco 4 cuori'. Gioco della carta: Sud vince l'attacco e batte le atout avversarie: la coppia ha dieci atout, quindi i difensori ne hanno solo tre e qui bastano due giri. Sud gioca poi quadri per affrancare le sue prese d'onore, taglia picche nel morto e fa undici prese. Punteggio: 4♥ +1 = 450 NS.",
"wbf-3.2-4": "Ovest attacca con l'asso di fiori e, se il colore viene continuato, Sud può tagliare nel morto. Gioca poi tre giri di atout e deve ricordarsi di giocare prima l'onore dalla mano corta a cuori. Punteggio: 4♠ = / 420 NS oppure 4♠ +1 / 450 NS.",
"wbf-3.3-1": "Ovest attacca con l'asso di quadri e fa tre prese a quadri. Gioca poi il fante di fiori. Sud vede che sono disponibili nove prese e deve trovare la decima tagliando nella mano corta. Prima di battere le atout, Sud gioca asso e re di cuori, poi taglia l'ultima cuori nel morto. Punteggio: 4♠ = / 420 NS.",
"wbf-3.3-2": "Sull'attacco del 3♦, se Est prende con l'asso di quadri e rigioca quadri, il compagno potrà tagliare. Ovest non dovrebbe poi cambiare a cuori: così facendo potrà più tardi prendere il re di cuori e l'asso di picche per la caduta. Punteggio: 4♠ -1 / 50 EO.",
"wbf-3.3-3": "Ovest attacca con il re di quadri. Sud gioca due giri di atout, poi deve tagliare due fiori nel morto, rientrando in mano con le cuori. Punteggio: 4♠ +1 / 450 EO.",
"wbf-3.3-4": "Con 33 punti nella coppia, Sud annuncia 'Gioco 6'. Per fare la dodicesima presa, Sud deve tagliare nella mano corta. Deve quindi rigiocare una quadri per godere del taglio prima di battere le atout. Punteggio: 6♥ = / 980 NS.",
"wbf-4.1-1": "Nord ha 10 punti e sa che il compagno ne ha 15, 16 o 17. Il totale è quindi almeno 25 punti: la Tabella di Decisione indica che si deve dichiarare manche, cioè 3NT. Difesa: Ovest deve guardare le carte del morto per vedere che può fare quattro prese a cuori. Gioco del Dichiarante: Sud deve scartare con attenzione nel morto per conservare le sue 5 vincenti a fiori. Punteggio: 3NT = / 400 NS.",
"wbf-4.1-2": "Sud deve fare quattro prese a picche, iniziando con gli onori dalla mano corta. Punteggio: 6NT = / 990 NS.",
"wbf-4.1-3": "Con 6 punti, Nord sa che la forza della coppia non può raggiungere i 25 punti. Non essendoci speranza di manche, Nord deve passare. Gioco di difesa: Ovest deve incassare rapidamente sette prese dopo aver guardato il morto: tre cuori e quattro quadri. Punteggio: 1NT -1 / 50 EO.",
"wbf-4.1-4": "Gioco del Dichiarante: affranca subito le fiori nonostante il pericolo a picche. Gioco di difesa: Est deve continuare a picche appena la difesa rientra in presa a fiori. Poiché le picche sono divise in modo uniforme, il contratto non cadrà. Punteggio: 3NT = / 400 NS.",
"wbf-4.2-1": "Licita: 2NT è un invito a manche; decide l'apertore. Gioco della carta: affrancare le prese d'onore. Punteggio: 2NT = / 120 NS.",
"wbf-4.2-2": "Licita: 4NT è un invito al piccolo slam. Gioco della carta: affrancare prese di lunga. Punteggio: 6NT = 990 / NS.",
"wbf-4.2-3": "Licita: 4NT invito al piccolo slam, decide l'apertore. Gioco della carta: gioca le carte nell'ordine giusto. Punteggio: 4NT +1 / 430 NS (oppure +2 / 460 NS, gli scarti sono difficili).",
"wbf-4.2-4": "Licita: 2NT invito a manche, decide l'apertore. Gioco del Dichiarante: affranca subito le cuori. Gioco di difesa: Est deve giocare il re di picche alla prima presa per battere il contratto. Punteggio: 3NT -1 / 50 EO oppure 3NT = / 400 NS.",
"wbf-4.3-1": "Licita: valutazione in punti HD, certezza del fit. Gioco del Dichiarante: non battere le atout prima di aver scartato una fiori o una quadri sulla terza picche del morto. Punteggio: 2♥ = / 110 NS.",
"wbf-4.3-2": "Licita: valutazione in punti HD, certezza del fit. Gioco del Dichiarante: non battere le atout prima di aver tagliato una quadri nel morto. Punteggio: 4♥ = / 420 NS.",
"wbf-4.3-3": "",
"wbf-4.3-4": "Licita: valutazione in punti HD, certezza del fit. Gioco del Dichiarante: comincia battendo le atout avversarie. Punteggio: 4♠ = / 420 NS.",
"wbf-T2-1": "Gioco del Dichiarante: scarta con urgenza le quadri prima di battere le atout.",
"wbf-T2-2": "Licita: con soli 7 punti, Ovest dovrebbe passare. Difesa: continua nel colore d'attacco.",
"wbf-T2-3": "Difesa: attacco atout; qualunque altro attacco è pericoloso. Gioco del Dichiarante: vinci l'attacco nel morto per mantenere la comunicazione con Sud e preparare il taglio a picche nella mano corta.",
"wbf-T2-4": "Gioco del Dichiarante: affranca le prese d'onore a picche. Difesa: i giocatori in Sud che evitano di scartare una quadri otterranno un 'top'.",
"wbf-5.1-1": "Valutazione: Nord ha 15 HD; i punti totali (PT) della coppia sono almeno 28 HD. Gioco del Dichiarante: rinvia il battere le atout, taglia nella mano corta. Punteggio: 4♠ = / 420 NS.",
"wbf-5.1-2": "Gioco del Dichiarante. Punteggio: 6♠ = / 980 NS.",
"wbf-5.1-3": "Licita: l'apertore dichiara 6♠ (21 HD) sul 4♠ del compagno. Gioco del Dichiarante. Gioco di difesa: gioca la carta giusta in terza posizione. Punteggio: 6♠ = / 980 NS.",
"wbf-5.1-4": "Licita: valutazione della mano di Nord (3 PD, punti di distribuzione). Gioco del Dichiarante. Punteggio: 4♥ = / 420 NS.",
"wbf-5.2-1": "Licita: dichiara il contratto giusto. Gioco di difesa: Est deve giocare la dama solo se il morto gioca il fante. Gioco del Dichiarante: gioca due volte verso re-dama di picche. Punteggio: 3♠ = / 140 NS.",
"wbf-5.2-2": "Licita: dichiara il contratto giusto. Gioco di difesa: se Nord non gioca il re di picche, Est trattiene l'asso. Gioco del Dichiarante: fai e ripeti l'impasse al re di cuori, rientrando nel morto con una quadri. Punteggio: 4♥ = / 420 NS.",
"wbf-5.2-3": "Licita: dichiara il contratto giusto. Gioco del Dichiarante: fai l'impasse alla dama di picche. Punteggio: 6♥ = / 980 NS.",
"wbf-5.2-4": "Licita: apri di 1♠ anche se non ci sono punti onori nel colore. Gioco del Dichiarante: fai entrambi gli impasse e affranca le fiori. Punteggio: 4♠ +1 / 450 NS.",
"wbf-5.3-1": "Gioco di difesa: attacca il singolo. Dopo il taglio, rigioca una fiori, l'unico colore in cui il compagno può rientrare in presa per darti un secondo taglio. Punteggio: 4♥ -1 / 50 EO.",
"wbf-5.3-2": "Gioco di difesa: tutti gli attacchi sono pericolosi tranne l'attacco atout. Su un attacco a cuori, il Dichiarante dovrebbe fare solo sette prese. Punteggio: 2♥ -1 / 50 EO.",
"wbf-5.3-3": "Gioco di difesa: dopo asso e re di picche, Ovest continua con il fante di fiori. Est deve giocare la carta giusta. Gioco: impasse alla dama di quadri. Punteggio: 4♥ = / 420 NS.",
"wbf-5.3-4": "Gioco del Dichiarante. Punteggio: 2♠ +2 / 170 NS.",
"wbf-6.1-1": "Licita: dichiara 3NT dopo l'intervento. Gioco del Dichiarante: affranca gli onori di quadri. Se conserva le fiori, farà dieci prese. Punteggio: 3NT +1 / 430 NS.",
"wbf-6.1-2": "Licita: dichiara 1NT come intervento. Gioco del Dichiarante: affranca gli onori di fiori. Gioco di difesa: sull'attacco, Est gioca il fante di cuori. Ovest deduce che Sud ha A-K-10 di cuori e tenta la fortuna altrove. Il contratto cadrà se Ovest cambia a una piccola picche quando rientra in presa con la fiori. Punteggio: 1NT -1 / 50 EO.",
"wbf-6.1-3": "Gioco di difesa: sull'attacco dell'asso di cuori, Est segnala giocando il 9. Ovest può poi dare a Est un taglio al terzo giro del colore e limitare così il Dichiarante a otto prese. Punteggio: 2♠ = / 110 NS.",
"wbf-6.1-4": "Gioco di difesa: gioco del terzo di mano. Ovest segnala scartando il 9♠ al terzo giro di cuori. La difesa può battere il contratto con due prese a cuori, l'asso di quadri e asso-re di picche. Punteggio: 3NT -1 / 50 EO.",
"wbf-6.2-1": "Sud fa dieci prese rientrando tre volte nel morto a cuori per fare e ripetere l'impasse a fiori. Punteggio: 4♥ = / 420 NS.",
"wbf-6.2-2": "Sud fa undici prese: sei prese di atout tagliando una volta nella mano corta, e cinque prese a quadri facendo l'impasse al re. Punteggio: 4♠ +1 = 450 EO.",
"wbf-6.2-3": "Tutti e quattro i giocatori dichiarano a turno. Sud quindi interviene fino a 3♥. Gioco del Dichiarante: Sud deve fare il doppio impasse a quadri (ed eventualmente l'impasse a picche). Punteggio: 3♥ = / 140 NS.",
"wbf-6.2-4": "Nord può contare 13 punti totali e dichiara manche dopo l'intervento del compagno. Gioco del Dichiarante: Sud deve fare il doppio impasse contro asso-dama di fiori. Difesa: se il Dichiarante gioca il 10 di picche dal morto, non giocare il re di picche. Punteggio: 4♠ = / 420 NS.",
"wbf-6.2-5": "Licita: Sud non ha abbastanza per aprire, ma il suo buon colore di picche giustifica un intervento. Sud può dichiarare 4♠, sperando che la caduta gli costi meno della manche avversaria. Punteggio: 4♥ = / 420 EO. 4♠ -1 / 50 EO.",
};

const deals = JSON.parse(readFileSync("/tmp/wbf-deals.json", "utf8"));
let missing = 0;
for (const d of deals) {
  if (d.id in IT) d.review = IT[d.id];
  else { missing++; console.log("MISSING translation:", d.id); }
}
console.log("translated:", deals.length - missing, "/", deals.length);

const lines = deals.map((d) => {
  const hands = JSON.stringify(d.hands);
  const review = JSON.stringify(d.review);
  const contract = d.contract ? JSON.stringify(d.contract) : "null";
  const declarer = d.declarer ? JSON.stringify(d.declarer) : "null";
  return `  { id: ${JSON.stringify(d.id)}, session: ${JSON.stringify(d.session)}, deal: ${d.deal}, teaching: ${JSON.stringify(d.teaching)}, contract: ${contract}, declarer: ${declarer}, resultTricks: ${d.resultTricks ?? "null"}, review: ${review}, hands: ${hands} },`;
}).join("\n");

const ts = `// AUTO-GENERATED from the WBF Bridge Course Level 1 deals (bridge-training.com).
// Source: https://championships.worldbridge.org/WBA/Discovery/BRIDGE_COURSE_LEVEL1_DEALS_WEB.pdf
// 73 teaching deals across sessions 1.2 -> 6.2, with WBF commentary translated to Italian.
// Regenerate via scripts/import-wbf-deals.mjs (+ translate-reviews.mjs). Do not edit by hand.

import type { Card, Position } from "@/lib/bridge-engine";

export interface WbfDeal {
  id: string;
  session: string;
  deal: number;
  teaching: string | null;
  contract: string | null;
  declarer: Position | null;
  resultTricks: number | null;
  review: string;
  hands: Record<Position, Card[]>;
}

export const WBF_DEALS: WbfDeal[] = [
${lines}
];
`;

writeFileSync("/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest/src/data/wbf-deals.ts", ts);
console.log("wrote wbf-deals.ts (Italian reviews),", ts.length, "bytes");
