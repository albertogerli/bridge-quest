import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId, benParam, benParamOpt, rateLimit, benEndpoint } from "@/lib/ben-guard";
import { reportError } from "@/lib/report-error";

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
/** Il tetto della funzione: il timeout qui sopra deve starci sotto. */
export const maxDuration = 30;

const TIMEOUT_MS = 26000;
const RATE_MAX_PER_MIN = 60;

const bodySchema = z.object({
  hand: benParam,
  seat: benParam,
  dealer: benParamOpt,
  vul: benParamOpt,
  ctx: benParamOpt,
});

/**
 * La dichiarazione del compagno, dal modello neurale di BEN.
 *
 * È lo stesso motore che gioca la carta: `/bid` usa una rete addestrata sulla
 * licita, e stava già acceso sul nostro server senza che nessuno la usasse.
 *
 * SI DEGRADA IN SILENZIO come gli altri: se BEN non risponde si torna
 * `fallback: true` e chi chiama decide cosa fare. Un esercizio di licita che
 * si blocca perché un server è occupato è peggio di un esercizio senza
 * compagno.
 */
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ fallback: true, error: "Non autenticato" }, { status: 401 });
  }
  if (!rateLimit(`ben-bid:${userId}`, RATE_MAX_PER_MIN)) {
    return NextResponse.json({ fallback: true, error: "Troppe richieste" }, { status: 429 });
  }

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ fallback: true, error: "Parametri non validi" }, { status: 400 });
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value) params.set(key, value);
    }
    // `ctx` va mandato ANCHE vuoto. A licita appena iniziata non c'è nulla da
    // dire, ma per BEN «parametro assente» e «parametro vuoto» sono due cose
    // diverse: senza, risponde 400 e il compagno resta muto proprio alla
    // prima dichiarazione, cioè sempre.
    if (!params.has("ctx")) params.set("ctx", "");

    const controller = new AbortController();
    // Il flag serve a distinguere DUE cose che finiscono nello stesso `catch`:
    // l'attesa scaduta (BEN c'è, ma è lento: riprovare ha senso) e il server
    // che non risponde affatto (riprovare subito no). Chi chiama decide in
    // base a questo se offrire «riprova», quindi confonderle costa all'utente.
    let scaduto = false;
    const timeout = setTimeout(() => { scaduto = true; controller.abort(); }, TIMEOUT_MS);

    const { url: benUrl, headers: benHeaders } = benEndpoint();
    let res: Response;
    try {
      res = await fetch(`${benUrl}/bid?${params.toString()}`, {
        signal: controller.signal,
        headers: benHeaders,
      });
    } catch {
      clearTimeout(timeout);
      const motivo = scaduto ? "BEN timeout" : "BEN non raggiungibile";
      reportError("api:ben-bid", new Error(motivo));
      return NextResponse.json({ fallback: true, error: motivo }, { status: 502 });
    }
    clearTimeout(timeout);

    if (!res.ok) {
      // IL CORPO VA RIPORTATO, non solo il numero. La guardia distingue già
      // «BEN non risponde» (502 `ben unavailable`) da un errore di BEN stesso,
      // e buttare via quel testo faceva finire due guasti diversi sotto la
      // stessa etichetta. Si tronca: è diagnostica, non una risposta.
      const corpo = (await res.text().catch(() => "")).trim().slice(0, 120);
      // SEGNALATO DAL SERVER, che è l'unico a sapere davvero cosa ha risposto
      // BEN. Finora l'unica traccia era una stringa ricostruita nel browser, e
      // quando quella si perdeva per strada restava un «HTTP 502» che non dice
      // niente: tre giri di indagine per una cosa che il server aveva sotto gli
      // occhi. Nessun dato dell'utente finisce qui: solo stato e corpo di BEN.
      reportError("api:ben-bid", new Error(`BEN returned ${res.status}: ${corpo || "(corpo vuoto)"}`));
      return NextResponse.json(
        { fallback: true, error: `BEN returned ${res.status}${corpo ? `: ${corpo}` : ""}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    // BEN risponde con la dichiarazione in forma compatta ("1S", "PASS", "X").
    const bid: unknown = data.bid ?? data.call;
    if (typeof bid !== "string" || bid.length === 0) {
      reportError("api:ben-bid", new Error("Risposta di BEN non valida"));
      return NextResponse.json({ fallback: true, error: "Risposta di BEN non valida" }, { status: 502 });
    }

    return NextResponse.json({ bid, fallback: false });
  } catch (err) {
    reportError("api:ben-bid", err);
    return NextResponse.json({ fallback: true, error: "BEN non raggiungibile" }, { status: 502 });
  }
}
