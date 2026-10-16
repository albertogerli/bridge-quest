/**
 * La dichiarazione di BEN, chiesta dal server.
 *
 * Estratta da `/api/ben/bid` perché serve anche al torneo di licita
 * (`/api/licita/torneo`), dove le mani degli altri non devono mai arrivare al
 * browser: lì è il server stesso a chiedere a BEN per conto dei robot. Due
 * copie di questa logica — ritentativo sul 502 dell'edge, cache, tempi —
 * divergerebbero alla prima correzione.
 */

import { benEndpoint } from "@/lib/ben-guard";
import { reportError } from "@/lib/report-error";
import { dichiarazioneNota, ricordaDichiarazione } from "@/lib/cache-licita";
import { erroreUpstreamRitentabile } from "@/lib/ben-retry";
import { benEngine, type BenMetricContext } from "@/lib/ben-metrics";

/**
 * Quanto si aspetta BEN, e perché il numero è cambiato tre volte.
 *
 * BEN risponde in due modi, e lo dichiara nel campo `who` della risposta:
 *   · `NN`         la rete neurale risponde da sola       ~0,35 s
 *   · `Simulation` non è sicura e simula in Monte Carlo    6,4 – 10,6 s
 *
 * Misurato in produzione il 25/08/2026 su 14 aste reali: la correlazione è
 * perfetta — ogni risposta oltre i cinque secondi è una `Simulation`, nessuna
 * `NN` ci va vicino. È questa la cosa da sapere prima di toccare il numero:
 * non c'è una latenza «tipica», ce ne sono due, e distano trenta volte.
 *
 * LA STORIA DEI NUMERI, che è la parte utile.
 *   · 8 s  → tagliava una dichiarazione su cinque;
 *   · 12 s → sembrava sicuro perché il massimo osservato era 9,16 s. Ma le
 *            simulazioni stanno fra 6,4 e 10,6 s: erano appena sotto il
 *            taglio, e bastava del traffico contemporaneo per superarlo.
 *            Riprodotto in produzione: otto richieste insieme, due uccise a
 *            12,43 s con `ben unavailable`. Il lavoro veniva buttato via un
 *            secondo prima di essere pronto;
 *   · 26 s → lascia finire anche la simulazione più lenta, e resta sotto
 *            `maxDuration`.
 *
 * DEV'ESSERE PIÙ LUNGO DELLA GUARDIA (22 s, `deploy/ben-railway/guard.py`) e
 * PIÙ CORTO DI `maxDuration`. Il primo vincolo lascia l'ultima parola alla
 * guardia, che sa distinguere «BEN tarda» da «BEN non c'è»; il secondo evita
 * che la piattaforma abbatta la funzione e al browser arrivi una pagina di
 * errore invece del ripiego pulito.
 *
 * NON È LA MEMORIA: l'istanza ne ha in abbondanza e non ha mai riavviato per
 * esaurimento. È il costo della simulazione, e si paga aspettando.
 */
export const BEN_BID_TIMEOUT_MS = 26000;

/** I parametri come li vuole BEN: mano PBN, posti e zona nella sua forma. */
export interface RichiestaBidBen {
  hand: string;
  seat: string;
  dealer?: string;
  vul?: string;
  ctx?: string;
}

/**
 * `ok: false` porta lo stato HTTP e il testo d'errore che `/api/ben/bid` ha
 * sempre restituito: il browser ne ricava il motivo (`motivoDa` in
 * `ben-client.ts`), e il torneo fa lo stesso.
 */
export type EsitoBidBen =
  | { ok: true; bid: string; cache?: boolean }
  | { ok: false; status: number; error: string };

export async function chiediBidABen(
  r: RichiestaBidBen,
  metric: BenMetricContext = { attempts: 0, cache: false, engine: "other" },
): Promise<EsitoBidBen> {
  try {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(r)) {
      if (value) params.set(key, value);
    }
    // `ctx` va mandato ANCHE vuoto. A licita appena iniziata non c'è nulla da
    // dire, ma per BEN «parametro assente» e «parametro vuoto» sono due cose
    // diverse: senza, risponde 400 e il compagno resta muto proprio alla
    // prima dichiarazione, cioè sempre.
    if (!params.has("ctx")) params.set("ctx", "");

    // GIÀ CHIESTA? Nel torneo la smazzata è la stessa per tutti e le aste si
    // ripetono: l'apertura del mazziere è identica per ogni partecipante.
    // Ripescarla evita una richiesta che, quando BEN simula, costa fino a nove
    // secondi — ed è su quelle lunghe che l'infrastruttura davanti a noi ha
    // restituito 502 (fino al 28/08/2026 il proxy Cloudflare, poi rimosso).
    // Vedi `src/lib/cache-licita.ts` anche per il motivo di equità.
    const chiave = params.toString();
    const nota = dichiarazioneNota(chiave);
    if (nota) {
      metric.cache = true;
      return { ok: true, bid: nota, cache: true };
    }

    const controller = new AbortController();
    // Il flag serve a distinguere DUE cose che finiscono nello stesso `catch`:
    // l'attesa scaduta (BEN c'è, ma è lento: riprovare ha senso) e il server
    // che non risponde affatto (riprovare subito no). Chi chiama decide in
    // base a questo se offrire «riprova», quindi confonderle costa all'utente.
    let scaduto = false;
    const timeout = setTimeout(() => { scaduto = true; controller.abort(); }, BEN_BID_TIMEOUT_MS);

    const { url: benUrl, headers: benHeaders } = benEndpoint();
    const url = `${benUrl}/bid?${params.toString()}`;
    const inizioBen = Date.now();
    let res: Response;
    let corpoGiaLetto: string | null = null;
    let ritentato = false;
    try {
      metric.attempts = 1;
      res = await fetch(url, {
        signal: controller.signal,
        headers: benHeaders,
      });

      // Il 16/09/2026 BEN ha finito correttamente in 5,767 s e Railway lo ha
      // registrato come HTTP 200, ma il suo edge ha restituito al chiamante
      // `502 upstream error`. Il browser non poteva riconoscerlo come errore
      // edge perché questa rotta lo aveva già avvolto nel proprio JSON.
      //
      // Si ritenta QUI, una sola volta e soltanto per quella firma stretta.
      // Il controller resta lo stesso: i due tentativi insieme non possono
      // superare il tetto complessivo di 26 secondi della rotta. Un 504 dopo
      // 22 secondi non passa da questo ramo e non viene raddoppiato.
      if (!res.ok) {
        const corpoPrimo = (await res.text().catch(() => "")).trim();
        const durataPrimo = Date.now() - inizioBen;
        if (erroreUpstreamRitentabile(res.status, corpoPrimo, durataPrimo)) {
          const richiestaRailway = res.headers.get("x-railway-request-id");
          const edgeRailway = res.headers.get("x-railway-edge");
          ritentato = true;
          metric.attempts = 2;
          await new Promise((risolvi) => setTimeout(risolvi, 300));
          res = await fetch(url, {
            signal: controller.signal,
            headers: benHeaders,
          });
          if (res.ok) {
            console.warn(JSON.stringify({
              level: "warn",
              message: "BEN: 502 upstream transitorio recuperato",
              route: "/api/ben/bid",
              primoTentativoMs: durataPrimo,
              richiestaRailway,
              edgeRailway,
            }));
          }
        } else {
          corpoGiaLetto = corpoPrimo;
        }
      }
    } catch {
      clearTimeout(timeout);
      const motivo = scaduto ? "BEN timeout" : "BEN non raggiungibile";
      reportError("api:ben-bid", new Error(motivo));
      return { ok: false, status: 502, error: motivo };
    }
    clearTimeout(timeout);

    if (!res.ok) {
      // IL CORPO VA RIPORTATO, non solo il numero. La guardia distingue già
      // «BEN non risponde» (502 `ben unavailable`) da un errore di BEN stesso,
      // e buttare via quel testo faceva finire due guasti diversi sotto la
      // stessa etichetta. Si tronca: è diagnostica, non una risposta.
      const corpo = (corpoGiaLetto ?? await res.text().catch(() => "")).trim().slice(0, 120);
      console.error(JSON.stringify({
        level: "error",
        message: "BEN ha risposto con errore",
        route: "/api/ben/bid",
        stato: res.status,
        durataMs: Date.now() - inizioBen,
        ritentato,
        richiestaRailway: res.headers.get("x-railway-request-id"),
        edgeRailway: res.headers.get("x-railway-edge"),
      }));
      // SEGNALATO DAL SERVER, che è l'unico a sapere davvero cosa ha risposto
      // BEN. Finora l'unica traccia era una stringa ricostruita nel browser, e
      // quando quella si perdeva per strada restava un «HTTP 502» che non dice
      // niente: tre giri di indagine per una cosa che il server aveva sotto gli
      // occhi. Nessun dato dell'utente finisce qui: solo stato e corpo di BEN.
      reportError("api:ben-bid", new Error(`BEN returned ${res.status}: ${corpo || "(corpo vuoto)"}`));
      return { ok: false, status: 502, error: `BEN returned ${res.status}${corpo ? `: ${corpo}` : ""}` };
    }

    const data = await res.json();
    metric.engine = benEngine(data.who);
    // BEN risponde con la dichiarazione in forma compatta ("1S", "PASS", "X").
    const bid: unknown = data.bid ?? data.call;
    if (typeof bid !== "string" || bid.length === 0) {
      reportError("api:ben-bid", new Error("Risposta di BEN non valida"));
      return { ok: false, status: 502, error: "Risposta di BEN non valida" };
    }

    ricordaDichiarazione(chiave, bid);
    return { ok: true, bid };
  } catch (err) {
    reportError("api:ben-bid", err);
    return { ok: false, status: 502, error: "BEN non raggiungibile" };
  }
}
