import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId, benParam, benParamOpt, rateLimit, benEndpoint } from "@/lib/ben-guard";

/**
 * Quanto si aspetta BEN prima di rinunciare, e perché questo numero conta.
 *
 * DEV'ESSERE PIÙ CORTO DEL LIMITE DELLA FUNZIONE, altrimenti non serve a
 * niente: quando BEN è lento la piattaforma abbatte la funzione prima che il
 * nostro timeout scatti, e al browser arriva una pagina di errore invece del
 * ripiego pulito. È successo in produzione il 15/08/2026: l'asta
 * «P 1♦ 1♠ contro P» faceva impiegare a BEN più di dodici secondi, ogni volta,
 * e l'esercizio di licita si interrompeva con «mano annullata» — mentre con un
 * ripiego onesto sarebbe potuto continuare.
 *
 * `maxDuration` è dichiarato qui sotto proprio per non doverlo indovinare.
 *
 * DODICI SECONDI, E NON È UN NUMERO A CASO. Misurato sui log di produzione del
 * 15/08/2026, 21 chiamate reali a `/bid`:
 *   · mediana 0,51 s — la maggior parte è immediata;
 *   · con asta VUOTA (l'apertura) sempre 0,16 s: il modello è già caldo, e un
 *     ping periodico per tenerlo su non servirebbe a niente;
 *   · con un'asta in corso oscilla fra 0,3 e 9,16 s, a seconda di quanto è
 *     difficile campionare mani compatibili con quelle dichiarazioni;
 *   · massimo osservato 9,16 s, nessuna oltre i 10.
 * A 8 secondi ne tagliavamo 4 su 21 — quasi una dichiarazione su cinque
 * diventava «l'avversario non ha risposto in tempo». A 12 non se ne taglia
 * nessuna, e restiamo comunque ben sotto il tetto della funzione.
 *
 * NON È LA MEMORIA: l'istanza ne ha in abbondanza e non ha mai riavviato per
 * esaurimento. È il costo dell'inferenza, e si paga aspettando.
 */
/** Il tetto della funzione: il timeout qui sopra deve starci sotto. */
export const maxDuration = 30;

/**
 * DEV'ESSERE PIÙ LUNGO DELLA GUARDIA, non uguale.
 *
 * Fra noi e BEN c'è `deploy/ben-railway/guard.py`, che aspetta a sua volta —
 * `BEN_TIMEOUT`, di norma 12 secondi — e se BEN non risponde restituisce un
 * 502 `ben unavailable`. Con due attese IDENTICHE in serie i due timer
 * scadono insieme, e a decidere che cosa vede l'utente è chi arriva primo:
 * il 502 della guardia («il motore ha risposto male, è un problema nostro»)
 * oppure la nostra interruzione («non ha risposto in tempo, riprova»). Lo
 * stesso identico guasto prendeva due nomi a caso, e uno dei due non offriva
 * nemmeno di riprovare.
 *
 * Misurato in produzione il 24/08/2026: a servizio caldo la mediana è 0,37 s
 * e un'asta in corso costa fino a 7,6 s; il 502 arriva solo mentre il
 * contenitore si sveglia, e lì la guardia sfonda i suoi 12 secondi. Aspettare
 * più di lei significa lasciarle sempre l'ultima parola, che è quella
 * informativa: sappiamo che BEN c'era e non ha fatto in tempo.
 *
 * Resta sotto `maxDuration`, altrimenti la piattaforma abbatte la funzione
 * prima e al browser arriva una pagina di errore invece del ripiego.
 */
const TIMEOUT_MS = 18000;
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
      return NextResponse.json(
        { fallback: true, error: scaduto ? "BEN timeout" : "BEN non raggiungibile" },
        { status: 502 },
      );
    }
    clearTimeout(timeout);

    if (!res.ok) {
      // IL CORPO VA RIPORTATO, non solo il numero. La guardia distingue già
      // «BEN non risponde» (502 `ben unavailable`) da un errore di BEN stesso,
      // e buttare via quel testo faceva finire due guasti diversi sotto la
      // stessa etichetta. Si tronca: è diagnostica, non una risposta.
      const corpo = (await res.text().catch(() => "")).trim().slice(0, 120);
      return NextResponse.json(
        { fallback: true, error: `BEN returned ${res.status}${corpo ? `: ${corpo}` : ""}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    // BEN risponde con la dichiarazione in forma compatta ("1S", "PASS", "X").
    const bid: unknown = data.bid ?? data.call;
    if (typeof bid !== "string" || bid.length === 0) {
      return NextResponse.json({ fallback: true, error: "Risposta di BEN non valida" }, { status: 502 });
    }

    return NextResponse.json({ bid, fallback: false });
  } catch {
    return NextResponse.json({ fallback: true, error: "BEN non raggiungibile" }, { status: 502 });
  }
}
