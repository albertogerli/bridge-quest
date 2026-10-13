/**
 * Quanto vale la licita che hai fatto.
 *
 * L'IDEA, PRESA DA CUEBIDS
 * Non si giudica una dichiarazione dicendo «giusta» o «sbagliata»: si confronta
 * il punteggio del contratto raggiunto con quello del PAR, cioè del miglior
 * contratto possibile su quella smazzata. Tre stelle significa esserci
 * arrivati; meno stelle misurano quanto si è lasciato per strada.
 *
 * È un metro onesto perché non dipende da opinioni sul sistema: un 4♥ che vale
 * 620 quando il par ne vale 620 è perfetto, comunque tu ci sia arrivato.
 *
 * DUE METRI, E VANNO TENUTI DISTINTI
 * `esatto` confronta col par double dummy della smazzata così com'è. È esatto,
 * ma premia chi ha indovinato: un 3SA che passa nove volte su dieci e cade su
 * questa prende zero stelle.
 * `atteso` confronta col miglior contratto per valore atteso, ottenuto
 * rimescolando molte volte le carte avversarie (`valore-atteso.ts`). È il metro
 * di Cuebids, ed è quello giusto per giudicare una DICHIARAZIONE: misura la
 * scelta, non la fortuna. Costa simulazioni, quindi si usa dove il valore
 * atteso è già stato calcolato in fase di generazione — le mani in
 * `mani_generate`.
 *
 * LA DISTANZA SI MISURA IN IMP, NON IN PUNTI.
 * Prima le soglie erano in punti secchi — 200 e 500 — e sono state cambiate
 * guardando un caso reale: su una mano da slam, 5♣ rendeva 609 e 3SA 668, e
 * prendevano una stella e due. Cinquantanove punti di differenza, una stella
 * di salto, perché cadevano ai due lati di una soglia fissa. Su una mano da
 * parziale, invece, quegli stessi 200 punti sono un abisso.
 *
 * Gli IMP sono la scala che il bridge usa da sempre proprio per questo: sono
 * concavi, quindi cento punti in basso contano più di cento punti in alto, ed
 * è esattamente il correttivo che serve. Le soglie qui sotto sono nostre
 * (Cuebids non pubblica le proprie), ma la scala non è più arbitraria.
 */

import { rawToIMP } from "./bridge-scoring";
import type { EsitoAsta } from "./licita-mano";
import { traduci } from "./traduzioni";

/** Con che cosa si confronta il contratto raggiunto. */
export type Metro = "esatto" | "atteso";

/** `t` di `useT()`, o l'italiano se non si passa niente. */
export type Traduttore = (frase: string, valori?: Record<string, string | number>) => string;
const italiano: Traduttore = (frase, valori) => traduci(frase, null, valori);

/**
 * Com'è finita l'asta, visto da chi riceve il voto.
 *
 * PERCHÉ IL COMMENTO NE HA BISOGNO. Il punteggio da solo non dice che cosa è
 * successo: cento punti sotto il par sono «la manche si poteva cercare» quando
 * la mano era vostra e vi siete fermati a un parziale, ma sono «sacrificio
 * troppo caro» quando la mano era loro e siete caduti contrati per toglierli
 * dalla manche. Il commento sceglieva la frase sulla sola distanza, e il
 * 13/10/2026 ha spiegato un 4♠X caduto di tre — contro un par di 3SA loro —
 * con «con queste carte la manche si poteva cercare»: una manche che la linea
 * dell'allievo non aveva in nessuna denominazione.
 */
export interface ContestoLicita {
  /** Chi ha giocato il contratto finale: la linea di chi riceve il voto, gli avversari, o nessuno. */
  gioca: "noi" | "loro" | "nessuno";
  /** Vero se il contratto finale è caduto su questa smazzata. */
  caduto: boolean;
}

/** Il contesto di un'asta chiusa, dal punto di vista di `lato`. */
export function contestoDaEsito(
  e: Pick<EsitoAsta, "lato" | "level" | "prese"> | null,
  lato: "ns" | "ew" = "ns",
): ContestoLicita {
  if (!e) return { gioca: "nessuno", caduto: false };
  return { gioca: e.lato === lato ? "noi" : "loro", caduto: e.prese < e.level + 6 };
}

const segno = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export interface EsitoLicita {
  /** Da 0 a 3. */
  stelle: number;
  /** Punteggio del contratto raggiunto, dal punto di vista di chi dichiara. */
  punteggio: number;
  /** Punteggio di riferimento: il par, o il miglior valore atteso. */
  punteggioPar: number;
  /** Quanto si è lasciato per strada (0 se si è raggiunto o superato il par). */
  differenza: number;
  /** Una frase che spiega il voto. */
  commento: string;
}

/**
 * Le soglie, in IMP persi rispetto al riferimento, e il voto che danno.
 *
 * MEZZE STELLE perché quattro gradini sono pochi per una scala che deve
 * distinguere «hai sbagliato colore» da «hai mancato la manche»: con soli
 * quattro livelli metà delle mani finiva sullo stesso voto, e il voto smetteva
 * di dire qualcosa. Sette gradini bastano — di più diventerebbe un numero con
 * la virgola travestito da stelle.
 *
 * Un IMP di scarto è rumore (venti punti su una manche) e vale il pieno.
 * Oltre i tredici si è persa una manche intera o peggio, e lì non c'è mezza
 * stella che tenga.
 */
const SCALA: { entro: number; stelle: number }[] = [
  { entro: 1, stelle: 3 },
  { entro: 3, stelle: 2.5 },
  { entro: 6, stelle: 2 },
  { entro: 8, stelle: 1.5 },
  { entro: 11, stelle: 1 },
  { entro: 13, stelle: 0.5 },
];

export function valutaLicita(
  punteggio: number,
  punteggioPar: number,
  metro: Metro = "esatto",
  /**
   * Il punteggio realizzato su QUESTA smazzata, quando le stelle si danno sul
   * valore atteso (`punteggio` è allora la media del contratto). Serve solo al
   * commento: vedi sotto «quando la fortuna contraddice il voto».
   */
  punteggioReale?: number,
  /**
   * Com'è finita l'asta (vedi `ContestoLicita`) e in che lingua parlare.
   *
   * Il contesto cambia SOLO il commento, mai le stelle: il voto resta la
   * distanza dal riferimento, qualunque sia la strada per cui ci si è
   * arrivati. Senza contesto il commento è quello di sempre, tranne in un
   * punto: non dice «la manche si poteva cercare» se la mano non era vostra.
   */
  opzioni: { contesto?: ContestoLicita; tr?: Traduttore } = {},
): EsitoLicita {
  const tr = opzioni.tr ?? italiano;
  const contesto = opzioni.contesto;
  const differenza = Math.max(0, punteggioPar - punteggio);
  const imp = rawToIMP(differenza);
  const stelle = SCALA.find((s) => imp <= s.entro)?.stelle ?? 0;

  /**
   * DI CHI ERA LA MANO. Il riferimento è visto dalla linea che riceve il voto:
   * positivo vuol dire che il meglio della smazzata era vostro, negativo che
   * era loro. Col metro atteso `riferimento` (mani-condivise) sceglie il valore
   * atteso solo quando la mano è vostra, quindi il segno dice la stessa cosa.
   */
  const manoDi: "noi" | "loro" | "nessuno" =
    punteggioPar > 0 ? "noi" : punteggioPar < 0 ? "loro" : "nessuno";
  // Sacrificio e difesa si giudicano sul PAR, che è l'equilibrio fra le due
  // linee: col metro atteso il riferimento è un contratto vostro giocato
  // indisturbato, e quelle frasi non avrebbero niente con cui confrontarsi.
  const competizione = metro === "esatto" && manoDi === "loro";
  const sacrificio = competizione && contesto?.gioca === "noi" && contesto.caduto;
  const difesa = competizione && contesto?.gioca === "loro";
  const valori = { d: differenza, punti: segno(punteggio), par: segno(punteggioPar) };
  // Le frasi sono intere, una per metro, e non un pezzo «sotto il par»
  // incollato dentro: un frammento interpolato non si traduce in una lingua
  // che mette le parole in un altro ordine (vedi `traduzioni.ts`).
  const perMetro = (esatto: string, atteso: string) =>
    tr(metro === "atteso" ? atteso : esatto, valori);

  let commento: string;

  if (stelle === 3) {
    /**
     * TRE STELLE NON VUOL DIRE «PERFETTO».
     *
     * La scala dà tre stelle fino a un IMP di scarto, cioè fino a una
     * quarantina di punti: è giusto, al tavolo quella differenza non si vede.
     * Ma il commento diceva «in media nessun altro contratto rendeva di più»
     * ANCHE con lo scarto, e quella frase è vera solo a scarto zero — con la
     * tabella dei contratti stampata subito sotto, che mostrava il contratto
     * migliore con un punteggio più alto di quello ottenuto. Visto in
     * produzione il 19/08/2026: verdetto «la scelta migliore» sopra una
     * tabella in cui 1♦ di Nord rendeva 101 e il contratto raggiunto 67.
     *
     * Una lode che il resto della schermata smentisce non è generosità: è il
     * modo più rapido di far smettere di credere ai voti.
     */
    const perfetto = punteggio >= punteggioPar;
    if (sacrificio) {
      commento = perfetto
        ? tr("Buon sacrificio: {punti}, contro i {par} del par. Cadere costava meno che lasciarli giocare.", valori)
        : tr("Sacrificio quasi alla pari: solo {d} punti peggio del par, una differenza che al tavolo non si vede.", valori);
    } else if (difesa && perfetto) {
      commento = tr("La mano era loro, e non hanno segnato più del par ({par}): in licita avete fatto quanto si poteva.", valori);
    } else if (perfetto) {
      commento =
        punteggio > punteggioPar
          ? perMetro(
              "Meglio del par: hai preso più di quanto la smazzata prometteva.",
              "Meglio del contratto migliore: con queste carte hai preso di più di quanto ci si potesse aspettare.",
            )
          : perMetro(
              "Contratto par: su questa smazzata non si poteva fare meglio.",
              "La scelta migliore: in media nessun altro contratto rendeva di più.",
            );
    } else {
      commento = perMetro(
        "Ottima scelta: solo {d} punti sotto il par, una differenza che al tavolo non si vede.",
        "Ottima scelta: solo {d} punti sotto il contratto migliore, una differenza che al tavolo non si vede.",
      );
    }
  } else if (sacrificio) {
    // Il caso del 13/10/2026: 4♠X caduto di tre, −500, contro i −400 della
    // loro 3SA. La mano era loro: niente manche da cercare, ma un sacrificio
    // che costava più di quanto salvava.
    commento = tr(
      "Sacrificio troppo caro: {punti}, contro i {par} del par. Lasciarli giocare costava meno: un sacrificio conviene solo se costa meno di quanto segnerebbero loro.",
      valori,
    );
  } else if (difesa) {
    commento = tr(
      "La mano era loro, ma hanno segnato {d} punti più del par: in licita si potevano limitare i danni.",
      valori,
    );
  } else if (contesto?.gioca === "nessuno" && manoDi === "noi") {
    commento = tr("Passo generale, ma la mano era vostra: {d} punti lasciati sul tavolo.", valori);
  } else if (contesto?.gioca === "loro" && manoDi === "noi") {
    commento = perMetro(
      "La mano era vostra, ma il contratto l'hanno giocato loro: {d} punti sotto il par. Qui bisognava continuare a dichiarare, o contrarli.",
      "La mano era vostra, ma il contratto l'hanno giocato loro: {d} punti sotto il contratto migliore. Qui bisognava continuare a dichiarare, o contrarli.",
    );
  } else if (contesto?.gioca === "noi" && contesto.caduto) {
    // Siete caduti su una mano che non era loro: non è un sacrificio, è un
    // contratto più alto di quello che le carte reggevano (o nel colore
    // sbagliato). Dire «la manche si poteva cercare» a chi è caduto proprio
    // cercandola sarebbe il consiglio opposto a quello giusto.
    commento = perMetro(
      "Il contratto è caduto: {d} punti sotto il par. Le carte reggevano un contratto più basso, o in un'altra denominazione.",
      "Il contratto è caduto: {d} punti sotto il contratto migliore. Le carte reggevano un contratto più basso, o in un'altra denominazione.",
    );
  } else if (manoDi !== "noi") {
    // Senza contesto e con la mano non vostra non si sa che cosa è successo:
    // si dice il numero, che è vero, e non si inventa una spiegazione.
    commento = perMetro("{d} punti sotto il par.", "{d} punti sotto il contratto migliore.");
  } else {
    /**
     * IL COMMENTO SEGUE I PUNTI, NON LE STELLE.
     *
     * Prima dipendeva dal voto, e siccome due stelle coprono tutto ciò che sta
     * entro sei IMP, lo stesso «Ci sei quasi: di solito è un parziale al posto
     * di un altro» usciva sia per venti punti sia per duecentoventicinque —
     * dove non è un parziale al posto di un altro, è una manche mancata. Un
     * commento che dice una cosa falsa è peggio di nessun commento: l'allievo
     * impara la spiegazione sbagliata e la porta al tavolo.
     *
     * Le soglie sono quelle che un giocatore riconosce: sotto il centinaio si
     * cambia parziale, intorno ai trecento si perde la manche, oltre i
     * cinquecento si è persa una manche in zona o uno slam.
     *
     * Qui si arriva solo con la mano vostra e il contratto mantenuto (o senza
     * contesto): è l'unico caso in cui «la manche si poteva cercare» è vero.
     */
    if (differenza < 100) {
      commento = perMetro(
        "Ci sei quasi: {d} punti sotto il par — un parziale al posto di un altro, o una presa in meno.",
        "Ci sei quasi: {d} punti sotto il contratto migliore — un parziale al posto di un altro, o una presa in meno.",
      );
    } else if (differenza < 300) {
      commento = perMetro(
        "{d} punti sotto il par: è la distanza fra un parziale e la manche. Con queste carte la manche si poteva cercare.",
        "{d} punti sotto il contratto migliore: è la distanza fra un parziale e la manche. Con queste carte la manche si poteva cercare.",
      );
    } else if (differenza < 600) {
      // Con il contesto si sa che il contratto è stato mantenuto: «non stava
      // in piedi» sarebbe falso, resta solo la manche non dichiarata. Senza
      // contesto le due spiegazioni restano tutte e due possibili.
      commento = contesto?.gioca === "noi"
        ? perMetro(
            "{d} punti sotto il par: una manche intera. Il contratto l'avete mantenuto, ma con queste carte c'era una manche da dichiarare.",
            "{d} punti sotto il contratto migliore: una manche intera. Il contratto l'avete mantenuto, ma con queste carte c'era una manche da dichiarare.",
          )
        : perMetro(
            "{d} punti sotto il par: una manche intera. O non è stata dichiarata, o il contratto scelto non stava in piedi.",
            "{d} punti sotto il contratto migliore: una manche intera. O non è stata dichiarata, o il contratto scelto non stava in piedi.",
          );
    } else {
      commento = perMetro(
        "{d} punti sotto il par: qui è andato perso uno slam, oppure il contratto è caduto pesante. Vale la pena rivedere la mano.",
        "{d} punti sotto il contratto migliore: qui è andato perso uno slam, oppure il contratto è caduto pesante. Vale la pena rivedere la mano.",
      );
    }
  }

  /**
   * QUANDO LA FORTUNA CONTRADDICE IL VOTO.
   *
   * Con il metro atteso le stelle giudicano la SCELTA, e il punteggio reale può
   * andare nella direzione opposta: un 7SA mantenuto per fortuna fa 2220 e
   * prende mezza stella, un 4♠ caduto prende tre stelle perché in media era il
   * contratto giusto. Il criterio è corretto — misura la scelta, non le carte
   * messe bene — ma senza dirlo il giocatore vede +2220 accanto a «1500 punti
   * sotto il contratto migliore» e conclude che le stelle sono «stabilite senza
   * criterio» (forum, 28/09/2026: nei dati di trenta giorni, 174 coppie di
   * risultati nella stessa mano con più punti e meno stelle). Qui lo si dice,
   * con tutti e due i numeri.
   */
  if (metro === "atteso" && punteggioReale !== undefined) {
    const media = Math.round(punteggio);
    const reale = Math.round(punteggioReale);
    const numeri = { reale: segno(reale), media: segno(media), rif: segno(punteggioPar) };
    if (stelle < 3 && reale >= punteggioPar) {
      commento = tr(
        "Stavolta ti è andata bene: {reale}. Ma le stelle giudicano la scelta, e in media questo contratto rende {media}, contro {rif} del contratto migliore. Con le carte messe diversamente sarebbe andata peggio.",
        numeri,
      );
    } else if (stelle >= 2.5 && reale < media - 100) {
      commento = tr(
        "Stavolta è andata male ({reale}), ma la scelta era buona: in media questo contratto rende {media}. Le stelle giudicano la scelta, non la sfortuna di questa smazzata.",
        numeri,
      );
    }
  }

  return { stelle, punteggio, punteggioPar, differenza, commento };
}
