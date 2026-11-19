import { CONTRO, PASSO, SURCONTRO, rango } from "./asta";
import { traduci } from "@/lib/traduzioni";

/**
 * Che cosa vuol dire una dichiarazione, detto in una frase.
 *
 * PERCHÉ. Al tavolo con i robot l'allievo vede arrivare un 2♦ e non sa se è
 * una debole con le quadri o una multicolor: sulle piattaforme di gioco basta
 * toccare la dichiarazione per leggerne il significato, qui no (Lillo Irrera,
 * 19/11/2026: «sarebbe utile poter chiedere cosa significa 2 quadri»).
 *
 * BEN NON LO DICE. La sua spiegazione passa da BBA, che sul server Linux è
 * spenta («Disabling PIMC/BBA/SuitC as platform is not win32»): risponde con
 * la dichiarazione e basta. Quindi il significato si ricava qui, dalla licita,
 * con le regole dello standard in cui BEN è addestrato (il 2 su 1 americano
 * dei robot di BBO): sulle aperture e le prime risposte coincide quasi sempre
 * col Naturale dei corsi (`ben-sistema.test.ts`, 24 aperture su 25).
 *
 * DOVE NON SI SA, SI DICE. Oltre il secondo giro il significato dipende da
 * accordi che nessuna regola corta descrive: lì la frase è generica e lo
 * ammette, invece di inventare una precisione che non c'è.
 */

export type Traduttore = (frase: string, valori?: Record<string, string | number>) => string;
const italiano: Traduttore = (frase, valori) => traduci(frase, null, valori);

export interface Significato {
  /** Il nome della dichiarazione: «Apertura», «Risposta», «Intervento»… */
  titolo: string;
  /** Che cosa mostra, in una o due frasi. */
  testo: string;
}

const SEME: Record<string, string> = { "♣": "fiori", "♦": "quadri", "♥": "cuori", "♠": "picche" };
const MAGGIORE = (d: string) => d === "♥" || d === "♠";

function livello(bid: string): number {
  return Number(bid[0]);
}
function denominazione(bid: string): string {
  return bid.slice(1);
}
/** Il livello più basso a cui `d` supera `sopra`: oltre quello è un salto. */
function livelloMinimo(d: string, sopra: string): number {
  const l = livello(sopra);
  return rango(`${l}${d}`) > rango(sopra) ? l : l + 1;
}
function stessaLinea(a: number, b: number): boolean {
  return (a - b) % 2 === 0;
}

/**
 * Il significato della dichiarazione numero `i` di `bids` (contando dal
 * mazziere, che non serve sapere chi sia: conta solo l'ordine), o `null` se
 * `i` non è una dichiarazione.
 */
export function significatoDichiarazione(
  bids: readonly string[],
  i: number,
  tr: Traduttore = italiano,
): Significato | null {
  const bid = bids[i];
  if (bid === undefined) return null;
  const seme = (d: string) => tr(SEME[d] ?? d);

  const apertura = bids.findIndex((b) => b !== PASSO);
  // Le dichiarazioni prima di questa, solo della propria linea e di quella avversaria.
  const prima = bids.slice(0, i);
  const giaDettoDallaLinea = prima.some((b, k) => stessaLinea(k, i) && b !== PASSO);

  // ── Passo ────────────────────────────────────────────────────────────
  if (bid === PASSO) {
    if (apertura === -1 || i < apertura) {
      return { titolo: tr("Passo"), testo: tr("Niente apertura: di solito meno di 12 punti, o una mano senza un colore da barrage.") };
    }
    if (i === apertura + 2) {
      return { titolo: tr("Passo"), testo: tr("Il compagno ha aperto: passare dice meno di 6 punti circa.") };
    }
    if (!giaDettoDallaLinea) {
      return { titolo: tr("Passo"), testo: tr("Niente da dire sopra l'apertura avversaria: pochi punti, o nessun colore adatto a intervenire.") };
    }
    return { titolo: tr("Passo"), testo: tr("Non ha altro da aggiungere a quello che ha già detto.") };
  }

  // ── Contro e surcontro ───────────────────────────────────────────────
  if (bid === CONTRO) {
    const ultimo = [...prima].reverse().find((b) => rango(b) >= 0) ?? "";
    if (!giaDettoDallaLinea && ultimo && denominazione(ultimo) !== "SA" && livello(ultimo) <= 3) {
      return {
        titolo: tr("Contro informativo"),
        testo: tr("Chiede al compagno di dichiarare: forza d'apertura o più, corto a {seme} e appoggio negli altri colori.", { seme: seme(denominazione(ultimo)) }),
      };
    }
    if (ultimo && denominazione(ultimo) === "SA" && !giaDettoDallaLinea) {
      return { titolo: tr("Contro"), testo: tr("Sopra il senza atout il contro è di forza: almeno quanto l'apertore, di solito 15 punti o più.") };
    }
    return { titolo: tr("Contro"), testo: tr("A questo punto della licita di solito è punitivo: pensa che gli avversari non mantengano il contratto. Il significato preciso dipende dagli accordi.") };
  }
  if (bid === SURCONTRO) {
    return { titolo: tr("Surcontro"), testo: tr("Dopo il contro avversario mostra forza: di solito 10 punti o più, e la linea pensa di mantenere il contratto.") };
  }

  const lv = livello(bid);
  const d = denominazione(bid);

  // ── Apertura ─────────────────────────────────────────────────────────
  if (i === apertura) {
    const terzaQuarta = i >= 2;
    const leggera = terzaQuarta ? " " + tr("In terza o quarta posizione può essere un po' più leggera.") : "";
    if (lv === 1 && d === "SA") return { titolo: tr("Apertura"), testo: tr("Mano bilanciata da 15 a 17 punti.") };
    if (lv === 1 && MAGGIORE(d)) return { titolo: tr("Apertura"), testo: tr("Da 12 a 21 punti, con almeno 5 carte a {seme}.", { seme: seme(d) }) + leggera };
    if (lv === 1) return { titolo: tr("Apertura"), testo: tr("Da 12 a 21 punti, con almeno 3 carte a {seme} e senza una quinta maggiore.", { seme: seme(d) }) + leggera };
    if (lv === 2 && d === "♣") return { titolo: tr("Apertura forte"), testo: tr("Artificiale: non dice niente sulle fiori. Mano fortissima, di solito 22 punti o più, forzante.") };
    if (lv === 2 && d === "SA") return { titolo: tr("Apertura"), testo: tr("Mano bilanciata da 20 a 21 punti.") };
    if (lv === 2) return { titolo: tr("Sottoapertura"), testo: tr("Debole: 6 carte di {seme} e circa 6-10 punti. Non è una multicolor.", { seme: seme(d) }) };
    if (lv === 3 && d === "SA") return { titolo: tr("Apertura"), testo: tr("Di solito un minore lungo e solido, da giocare a senza atout. Il significato dipende dagli accordi.") };
    if (lv <= 4) return { titolo: tr("Barrage"), testo: tr("Mano debole con un colore lungo di {seme}, di solito 7 carte o più: toglie spazio agli avversari.", { seme: seme(d) }) };
    return { titolo: tr("Barrage"), testo: tr("Colore lunghissimo di {seme} e poche carte difensive.", { seme: seme(d) }) };
  }

  const aperta = bids[apertura];
  const lvA = livello(aperta);
  const dA = denominazione(aperta);
  const primaDellaLinea = !giaDettoDallaLinea;
  const rhoPasso = bids[i - 1] === PASSO;

  // ── Risposta del compagno dell'apertore (prima dichiarazione, senza interferenza) ──
  if (i === apertura + 2 && rhoPasso) {
    const R = (testo: string) => ({ titolo: tr("Risposta"), testo });
    if (lvA === 1 && dA === "SA") {
      if (bid === "2♣") return R(tr("Stayman: chiede all'apertore se ha una quarta maggiore. Di solito almeno 8 punti."));
      if (bid === "2♦") return R(tr("Transfer: almeno 5 carte di cuori. Chiede all'apertore di dire 2♥."));
      if (bid === "2♥") return R(tr("Transfer: almeno 5 carte di picche. Chiede all'apertore di dire 2♠."));
      if (bid === "3SA") return R(tr("Per giocare: circa 10-15 punti, senza una quarta maggiore da cercare."));
      if (bid === "4♥" || bid === "4♠") return R(tr("Per giocare: colore lungo e punti da manche."));
      return R(tr("Risposta a 1SA: il significato preciso dipende dagli accordi."));
    }
    if (lvA === 2 && dA === "♣") {
      if (bid === "2♦") return R(tr("Attesa: artificiale, non dice niente sulle quadri. Lascia spazio all'apertore per descrivere la mano."));
      return R(tr("Risposta naturale all'apertura forte: mostra un colore buono e qualche valore."));
    }
    if (lvA === 2 && dA !== "SA") {
      if (bid === "2SA") return R(tr("Domanda: forzante, chiede all'apertore di descrivere meglio la mano. Di solito 15 punti o più."));
      if (d === dA) return R(tr("Appoggio: allunga il barrage del compagno, non promette forza."));
      return R(tr("Colore proprio, di solito forzante: almeno 5 carte buone e forza."));
    }
    if (lvA === 1) {
      if (d === "SA" && lv === 1) {
        return MAGGIORE(dA)
          ? R(tr("Da 6 a 12 punti circa, senza appoggio a {seme} e senza un colore da dire a livello uno.", { seme: seme(dA) }))
          : R(tr("Da 6 a 10 punti, mano bilanciata senza una quarta maggiore."));
      }
      if (d === "SA" && lv === 2) {
        return MAGGIORE(dA)
          ? R(tr("Appoggio di almeno 4 carte a {seme}, forzante a manche: 13 punti o più (2SA Jacoby).", { seme: seme(dA) }))
          : R(tr("Mano bilanciata da 11 a 12 punti: invitante a 3SA."));
      }
      if (d === "SA" && lv === 3) return R(tr("Per giocare: mano bilanciata da 13 a 15 punti."));
      if (d === dA && lv === 2) return R(tr("Appoggio semplice: da 6 a 10 punti, con almeno {n} carte a {seme}.", { n: MAGGIORE(dA) ? 3 : 4, seme: seme(dA) }));
      if (d === dA && lv === 3) return R(tr("Appoggio invitante: da 10 a 12 punti, con almeno 4 carte a {seme}.", { seme: seme(dA) }));
      if (d === dA && lv === 4) return R(tr("Barrage: appoggio lungo a {seme} e mano debole.", { seme: seme(dA) }));
      if (lv === 1) return R(tr("Almeno 4 carte di {seme} e 6 punti o più. Forzante: l'apertore deve dichiarare ancora.", { seme: seme(d) }));
      if (lv === 2 && d !== dA && livelloMinimo(d, aperta) === 2) {
        // Livello due senza salto: il 2 su 1.
        return R(tr("Cambio di colore a livello due: almeno 4-5 carte di {seme} e 12 punti o più, forzante a manche (2 su 1).", { seme: seme(d) }));
      }
      return R(tr("Mostra le {seme}. È un salto: il significato preciso dipende dagli accordi.", { seme: seme(d) }));
    }
  }

  // ── Intervento: prima dichiarazione della linea che non ha aperto ──────
  if (!stessaLinea(i, apertura) && primaDellaLinea) {
    const I = (testo: string, titolo = tr("Intervento")) => ({ titolo, testo });
    const ultimo = [...prima].reverse().find((b) => rango(b) >= 0) ?? aperta;
    const salto = d !== "SA" && lv > livelloMinimo(d, ultimo);
    if (lvA === 1 && dA !== "SA") {
      if (bid === "1SA") return I(tr("Da 15 a 18 punti, mano bilanciata con il fermo a {seme}.", { seme: seme(dA) }));
      if (bid === "2SA" && ultimo === aperta) return I(tr("Due colori: almeno 5-5 nei due colori più bassi non dichiarati."), tr("Intervento a due colori"));
      if (lv === 2 && d === dA) {
        return I(
          MAGGIORE(dA)
            ? tr("Michaels: almeno 5-5, con l'altro maggiore e un minore.")
            : tr("Michaels: almeno 5-5 nei due colori maggiori."),
          tr("Surlicita"),
        );
      }
      if (d !== "SA" && salto) return I(tr("Intervento a salto, debole: 6 carte di {seme} e pochi punti.", { seme: seme(d) }));
      if (d !== "SA" && lv === 1) return I(tr("Almeno 5 carte di {seme}, da 8 a 16 punti circa.", { seme: seme(d) }));
      if (d !== "SA" && lv === 2) return I(tr("A livello due: almeno 5 carte buone di {seme}, di solito 11 punti o più.", { seme: seme(d) }));
    }
    if (lvA === 2 && dA !== "♣" && dA !== "SA") {
      if (bid === "2SA") return I(tr("Da 15 a 18 punti, mano bilanciata con il fermo a {seme}.", { seme: seme(dA) }));
      if (d !== "SA") return I(tr("Sopra la sottoapertura: almeno 5 carte di {seme} e forza d'apertura.", { seme: seme(d) }));
    }
    if (dA === "SA") return I(tr("Sopra il senza atout: di solito un colore lungo. Il significato preciso dipende dagli accordi."));
    if (d !== "SA") return I(tr("Mostra le {seme}: almeno 5 carte.", { seme: seme(d) }));
  }

  // ── Il resto: naturale, ma senza promettere precisione ───────────────
  if (d === "SA") {
    return { titolo: tr("Senza atout"), testo: tr("Propone di giocare a senza atout: di solito senza un fit chiaro e con i fermi nei colori avversari. Il significato preciso dipende dalla licita fin qui.") };
  }
  const giaDettoDalCompagno = prima.some((b, k) => stessaLinea(k, i) && k % 4 !== i % 4 && denominazione(b) === d);
  if (giaDettoDalCompagno) {
    return { titolo: tr("Appoggio"), testo: tr("Appoggia le {seme} del compagno.", { seme: seme(d) }) };
  }
  return { titolo: tr("Naturale"), testo: tr("Di solito mostra le {seme}. Il significato preciso dipende dalla licita fin qui.", { seme: seme(d) }) };
}
