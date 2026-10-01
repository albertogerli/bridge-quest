"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useFriends } from "@/hooks/use-friends";
import { calcTableAndPar } from "@/lib/dds-table";
import { votoLicitaChiusa } from "@/lib/voto-licita-chiusa";
import { Stelle } from "@/components/bridge/stelle";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";
import { RisultatoDoppioMorto } from "@/components/bridge/risultato-doppio-morto";
import { Asta } from "@/components/bridge/asta";
import { reportError , segnalaSalvoRete } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { generateDeals, handHcp } from "@/lib/deal-generator";
import {
  apriLicita, apriSerie, contrattoFinale, dichiara, leggiLicita, mieLicite,
  turnoDi, type RigaElenco, type SessioneLicita,
} from "@/lib/licita-a-due";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

/**
 * Licita con un amico, avversari BEN.
 *
 * ASINCRONA, ed è la scelta che conta: dichiari quando puoi, il tuo compagno
 * risponde quando può. Chiedere a due persone di trovarsi online nello stesso
 * momento è già metà della rinuncia, e i nostri iscritti hanno in media
 * cinquant'anni.
 *
 * Vedi solo la TUA mano — nemmeno quella del compagno, perché l'esercizio è
 * proprio intendersi senza vederla. Il filtro è nel database: qui non c'è
 * niente da nascondere perché non arriva niente da nascondere.
 *
 * Le dichiarazioni degli avversari le calcola BEN nel browser di chi ha appena
 * parlato, e vengono inviate come dichiarazioni di quel posto.
 */
export default function LicitaAmicoPage() {
  return (
    <Suspense fallback={null}>
      <LicitaAmico />
    </Suspense>
  );
}

function LicitaAmico() {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const params = useSearchParams();
  const router = useRouter();
  const idAperta = params.get("s");

  // L'elenco serve per scegliere con chi giocare, e lo si legge una volta
  // all'apertura: un amico aggiunto nel frattempo lo si vede rientrando.
  const { friends } = useFriends({ live: false });
  const [elenco, setElenco] = useState<RigaElenco[] | null>(null);
  const [sessione, setSessione] = useState<SessioneLicita | null>(null);
  const [attesa, setAttesa] = useState(false);
  const [errore, setErrore] = useState("");
  // Il seme si estrae una volta al montaggio: `Date.now()` nel corpo del
  // componente sarebbe una funzione impura chiamata durante il render, e a
  // ogni ri-render darebbe mani diverse.
  const [seme, setSeme] = useState(() => Math.floor(Date.now() % 1_000_000));

  const ricarica = useCallback(async () => {
    if (idAperta) setSessione(await leggiLicita(idAperta));
    else setElenco(await mieLicite());
  }, [idAperta]);

  /**
   * All'apertura, se la licita è ferma sul turno di un avversario la si
   * sblocca.
   *
   * PERCHÉ PUÒ RESTARE FERMA. Gli avversari li fa dichiarare il server, ma
   * qualcuno deve chiederglielo, e a chiederlo è il browser di chi ha appena
   * parlato. Se quel browser si chiude nel mezzo — schermo bloccato, rete che
   * cade, scheda chiusa — la licita resta lì per sempre, in attesa di un robot
   * che nessuno ha svegliato. È il difetto peggiore possibile in una funzione
   * asincrona: non dà errori, semplicemente non succede più niente.
   */
  useEffect(() => {
    if (loading || !user) return;
    let vivo = true;
    (idAperta ? leggiLicita(idAperta) : mieLicite())
      .then(async (r) => {
        if (!vivo) return;
        if (!idAperta) { setElenco(r as RigaElenco[]); return; }

        const s = r as SessioneLicita | null;
        setSessione(s);
        if (!s || s.chiusa || s.turno === "north" || s.turno === "south") return;

        await fetch("/api/licita/avversario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: s.id }),
          // LA RETE CHE CADE NON SI SEGNALA. Questo è il caso più probabile su
          // un telefono, ed è anche quello in cui non c'è niente da correggere:
          // la licita resta sul turno dell'avversario e l'effetto RIPROVA alla
          // prossima apertura — è la stessa rete di sicurezza descritta qui
          // sopra, vista dall'altro lato.
          //
          // Tutto il resto continua ad arrivare: un 500 dell'API o una risposta
          // malformata vogliono dire che il robot non si sveglia MAI, e quella
          // è la cosa da sapere.
        }).catch((err) => { segnalaSalvoRete("licita-amico:sblocca", err); });
        const aggiornata = await leggiLicita(idAperta);
        if (vivo) setSessione(aggiornata);
      })
      .catch((err) => reportError("licita-amico:carica", err));
    return () => { vivo = false; };
  }, [idAperta, user, loading]);

  /**
   * IN DIRETTA. Prima la pagina diceva «puoi chiudere: quando il tuo compagno
   * avrà dichiarato la troverai qui», e per vedere la sua dichiarazione
   * bisognava ricaricare (01/10/2026: «bisogna sempre riaggiornare»). Ora,
   * finché la licita è aperta e non tocca a te, la si rilegge ogni tre
   * secondi — solo a pagina visibile, per non consumare batteria in tasca.
   *
   * NON IL TEMPO REALE DEL DATABASE: `bidding_sessions` non è nella
   * pubblicazione Realtime, e aggiungercela manderebbe la riga intera — mani
   * del compagno comprese — a chi la guarda. La lettura passa da
   * `bidding_session_view`, che quelle mani le toglie.
   */
  const aspettoAltri = !!sessione && !sessione.chiusa && sessione.turno !== sessione.seat;
  useEffect(() => {
    if (!idAperta || !aspettoAltri) return;
    let vivo = true;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void leggiLicita(idAperta).then((nuova) => {
        if (!vivo || !nuova) return;
        setSessione((vecchia) =>
          vecchia && vecchia.bids.length === nuova.bids.length && vecchia.chiusa === nuova.chiusa ? vecchia : nuova,
        );
      });
    }, 3000);
    return () => { vivo = false; clearInterval(t); };
  }, [idAperta, aspettoAltri]);

  /** Su quante mani confrontarsi: si sceglie prima di invitare. */
  const [quanteMani, setQuanteMani] = useState<1 | 4 | 8>(4);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/login?redirect=/gioca/licita-amico" className="underline">{t("Accedi")}</Link>{" "}
          per licitare con un amico.
        </p>
      </div>
    );
  }

  // ── Una licita aperta ────────────────────────────────────────────────────
  if (idAperta) {
    if (!sessione) {
      return (
        <div className="min-h-screen px-4 py-16 max-w-md mx-auto text-center">
          <p className="text-sm text-muted-foreground">{t("Licita non trovata.")}</p>
          <Link href="/gioca/licita-amico" className="text-sm underline">{t("Torna all'elenco")}</Link>
        </div>
      );
    }

    const mia = sessione.hands[sessione.seat] ?? [];
    const tocca = sessione.turno === sessione.seat && !sessione.chiusa;
    const contratto = contrattoFinale(sessione.bids);

    const invia = async (bid: string) => {
      setAttesa(true);
      setErrore("");
      const r = await dichiara(sessione.id, bid);
      if (!r.ok) {
        setErrore(r.errore ?? "Non è stato possibile dichiarare.");
        setAttesa(false);
        return;
      }
      // Gli avversari li fa dichiarare il SERVER: le loro mani non arrivano
      // qui, ed è tutto il punto — se arrivassero, i due amici potrebbero
      // leggerle e la licita non varrebbe niente.
      try {
        await fetch("/api/licita/avversario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessione.id }),
        });
      } catch (err) {
        reportError("licita-amico:avversari", err);
      }
      await ricarica();
      setAttesa(false);
    };

    return (
      <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
        <Link href="/gioca/licita-amico" className="text-sm text-muted-foreground hover:underline">
          ← Le tue licite
        </Link>

        <div className="rounded-2xl border border-border bg-card p-5 my-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary">Sei {ETICHETTA[sessione.seat]}</Badge>
            {sessione.di && sessione.di > 1 && (
              <Badge variant="outline">{t("Mano {n} di {di}", { n: sessione.numero ?? 1, di: sessione.di })}</Badge>
            )}
            <span className="text-xs text-muted-foreground">{handHcp(mia)} PO</span>
          </div>
          {SUITS.map((suit) => (
            <p key={suit} className="text-lg font-mono flex items-center gap-2">
              <SuitSymbol suit={suit} size="sm" />
              {formatSuit(mia, suit)}
            </p>
          ))}
        </div>

        <div className="mb-4">
          <Asta
            dealer={sessione.dealer}
            bids={sessione.bids}
            ioSono={sessione.seat}
            onDichiara={tocca ? invia : undefined}
            disabilitato={attesa}
          />
        </div>

        {errore && <p className="text-sm text-destructive mb-3">{errore}</p>}

        {sessione.chiusa ? (
          <div className="rounded-2xl border border-figb/30 bg-figb/5 p-4">
            <p className="font-semibold mb-2">
              {contratto ? `Contratto: ${contratto}` : "Passo generale"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("Ora si vedono tutte le mani: guardate insieme se il contratto era quello giusto.")}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {(["north", "east", "south", "west"] as Position[]).map((p) => (
                <div key={p}>
                  <p className="text-xs font-bold text-muted-foreground mb-0.5">
                    {ETICHETTA[p]} <span className="font-normal">{handHcp(sessione.hands[p] ?? [])} PO</span>
                  </p>
                  {SUITS.map((suit) => (
                    <p key={suit} className="text-xs font-mono flex items-center gap-1">
                      <SuitSymbol suit={suit} size="xs" />
                      {formatSuit(sessione.hands[p] ?? [], suit)}
                    </p>
                  ))}
                </div>
              ))}
            </div>
            {/* Il risultato a doppio morto e il par: la risposta a «il nostro
                contratto stava in piedi?». La zona è «nessuno»: è quella con
                cui nascono tutte le licite a due (107 su 107 al 29/09/2026). */}
            {(["north", "east", "south", "west"] as Position[]).every((p) => (sessione.hands[p]?.length ?? 0) === 13) && (
              <div className="mt-4">
                <RisultatoDoppioMorto
                  mani={sessione.hands as Record<Position, Card[]>}
                  dealer={sessione.dealer}
                  vulnerability="none"
                  bids={sessione.bids}
                  conStelle
                />
              </div>
            )}
            {sessione.prossima && (
              <Button className="mt-4 w-full" onClick={() => router.push(`/gioca/licita-amico?s=${sessione.prossima}`)}>
                {t("Mano successiva")} →
              </Button>
            )}
            {sessione.serie && sessione.di && sessione.di > 1 && (
              <RiepilogoSerie serie={sessione.serie} attuale={sessione.id} />
            )}
          </div>
        ) : tocca ? (
          <p className="text-sm font-semibold text-center py-2">{t("Tocca a te")}</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Tocca a {ETICHETTA[sessione.turno]}. La pagina si aggiorna da sola; se
            la chiudi, la ritrovi qui quando il tuo compagno avrà dichiarato.
          </p>
        )}
      </div>
    );
  }

  // ── Elenco ───────────────────────────────────────────────────────────────
  /** Apre una licita nuova e restituisce dove andare. */
  const nuova = async (partnerId: string): Promise<string | null> => {
    setAttesa(true);
    const { deals } = generateDeals({}, { count: quanteMani, seed: seme });
    // Il prossimo invito avrà mani diverse.
    setSeme((s) => s + 7919);
    // Una mano sola resta com'era (mazziere Sud); da quattro in su è una serie.
    const id = quanteMani === 1
      ? await apriLicita({ partnerId, hands: deals[0], dealer: "south" })
      : await apriSerie({ partnerId, mani: deals });
    setAttesa(false);
    if (!id) setErrore("Non è stato possibile aprire la licita.");
    return id;
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Users className="w-6 h-6 text-figb" aria-hidden="true" />
          {t("Licita con un amico")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Ognuno vede solo la propria mano e dichiara quando può. Agli avversari pensa il computer.")}
        </p>
      </header>

      {errore && <p className="text-sm text-destructive mb-3">{errore}</p>}

      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {t("Invita un amico")}
      </h2>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("Quante mani")}</span>
        {([1, 4, 8] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setQuanteMani(n)}
            aria-pressed={quanteMani === n}
            className={`min-h-10 min-w-10 rounded-lg px-3 font-semibold ${
              quanteMani === n ? "bg-figb text-white" : "border border-border hover:bg-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-6">
          Non hai ancora amici sulla piattaforma.{" "}
          <Link href="/amici" className="underline">{t("Trovane uno")}</Link> e potrete
          licitare insieme.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6">
          {friends.map((f) => {
            const altro = f.user_id === user.id ? f.friend_id : f.user_id;
            return (
              <Button
                key={f.id}
                variant="outline"
                disabled={attesa}
                onClick={async () => {
                  const id = await nuova(altro);
                  if (id) router.push(`/gioca/licita-amico?s=${id}`);
                }}
              >
                {f.profile?.display_name ?? "Amico"}
              </Button>
            );
          })}
        </div>
      )}

      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {t("Le tue licite")}
      </h2>
      {elenco === null && <p className="text-sm text-muted-foreground">{t("Carico…")}</p>}
      {elenco?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("Nessuna licita aperta.")}</p>
      )}
      <ul className="space-y-2">
        {/* Le mani di una serie nascono nello stesso istante: si ordinano per
            numero, dalla prima, invece che come capita. */}
        {[...(elenco ?? [])]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || (a.numero ?? 0) - (b.numero ?? 0))
          .map((r) => {
          const tuo = !r.chiusa && turnoDi(r.dealer, r.bids) === r.seat;
          return (
            <li key={r.id}>
              <Link
                href={`/gioca/licita-amico?s=${r.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">
                    Con {r.compagno ?? "un amico"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.di && r.di > 1 ? `${t("Mano {n} di {di}", { n: r.numero ?? 1, di: r.di })} · ` : ""}
                    {r.chiusa
                      ? `Chiusa · ${contrattoFinale(r.bids) ?? "passo generale"}`
                      : `${r.bids.length} dichiarazioni`}
                  </p>
                </div>
                {tuo && (
                  <span className="text-xs font-bold text-foreground bg-gold/25 rounded-full px-2 py-0.5 shrink-0">
                    {t("Tocca a te")}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatSuit(hand: readonly Card[], suit: Suit): string {
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join(" ") : "—";
}

/**
 * Il riepilogo della serie: mano per mano contratto e stelle, e il totale.
 *
 * Le stelle si calcolano con `votoLicitaChiusa`, la stessa funzione del
 * riquadro di fine mano: il totale non può dire una cosa e la mano un'altra.
 * Le mani ancora aperte compaiono come «in corso»: la serie si legge anche a
 * metà, e si vede quanto manca.
 */
function RiepilogoSerie({ serie, attuale }: { serie: string; attuale: string }) {
  const t = useT();
  const [righe, setRighe] = useState<{ id: string; numero: number; contratto: string | null; stelle: number | null }[] | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const elenco = (await mieLicite()).filter((r) => r.serie === serie).sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
      const out: { id: string; numero: number; contratto: string | null; stelle: number | null }[] = [];
      for (const r of elenco) {
        if (!r.chiusa) { out.push({ id: r.id, numero: r.numero ?? 0, contratto: null, stelle: null }); continue; }
        const s = await leggiLicita(r.id);
        const mani = s?.hands as Record<Position, Card[]> | undefined;
        if (!s || !mani || !(["north", "east", "south", "west"] as Position[]).every((p) => mani[p]?.length === 13)) {
          out.push({ id: r.id, numero: r.numero ?? 0, contratto: contrattoFinale(r.bids), stelle: null });
          continue;
        }
        const dati = await calcTableAndPar(mani, s.dealer, "none");
        const { voto } = votoLicitaChiusa(s.bids, s.dealer, "none", dati);
        out.push({ id: r.id, numero: r.numero ?? 0, contratto: contrattoFinale(r.bids), stelle: voto.stelle });
      }
      if (vivo) setRighe(out);
    })().catch((err) => segnalaSalvoRete("licita-amico:serie", err));
    return () => { vivo = false; };
  }, [serie, attuale]);

  if (!righe) return null;
  const finite = righe.filter((r) => r.stelle !== null);
  const totale = finite.reduce((s, r) => s + (r.stelle ?? 0), 0);
  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 font-semibold">
        {finite.length === righe.length
          ? t("Serie finita: {s} stelle su {max}", { s: totale.toLocaleString("it-IT"), max: righe.length * 3 })
          : t("La serie finora: {s} stelle in {n} mani", { s: totale.toLocaleString("it-IT"), n: finite.length })}
      </p>
      <ul className="space-y-1 text-sm">
        {righe.map((r) => (
          <li key={r.id} className={`flex items-center justify-between ${r.id === attuale ? "font-semibold" : ""}`}>
            <Link href={`/gioca/licita-amico?s=${r.id}`} className="hover:underline">
              {t("Mano {n}", { n: r.numero })} · {r.contratto ? contrattoLeggibile(r.contratto) : r.stelle === null ? t("in corso") : t("Passo generale")}
            </Link>
            {r.stelle !== null && <Stelle quante={r.stelle} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
