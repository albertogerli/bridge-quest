"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { Asta } from "@/components/bridge/asta";
import { Stelle } from "@/components/bridge/stelle";
import { RiepilogoMano } from "@/components/bridge/riepilogo-mano";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { handHcp } from "@/lib/deal-generator";
import type { DdsTable } from "@/lib/dds-table";
import { benBid } from "@/lib/ben-client";
import { astaChiusa, esitoAsta, ordineDa } from "@/lib/licita-mano";
import { contrattiDaRivedere } from "@/lib/riepilogo-mano";
import { valutaLicita, type EsitoLicita } from "@/lib/stelle-licita";
import type { Strain } from "@/lib/minibridge";
import {
  classificaTorneo, evDelContratto, registraRisultatoTorneo, riferimento,
  torneoCorrente, torneoMano,
  type ClassificaTorneo, type ManoCondivisa, type TorneoCorrente,
} from "@/lib/mani-condivise";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
type Tipo = "giornaliero" | "settimanale";

/**
 * Tornei di licita: le stesse smazzate per tutti, con una classifica.
 *
 * PERCHÉ LE STELLE E NON I PUNTI. I punti di bridge dipendono dalla forza
 * delle carte — otto mani da slam valgono più di otto parziali — mentre le
 * stelle misurano quanto bene hai dichiarato QUELLA mano. In un torneo dove
 * tutti hanno le stesse carte le due cose ordinerebbero quasi allo stesso
 * modo, ma le stelle restano leggibili anche quando la classifica si guarda a
 * distanza di giorni.
 *
 * UNA MANO PER VOLTA, e arriva dal server. Consegnarle tutte insieme
 * vorrebbe dire mandare al browser le carte degli avversari di tutto il
 * torneo: chiunque guardi la risposta di rete vincerebbe.
 *
 * SI PUÒ INTERROMPERE: le mani già dichiarate restano, e riaprendo la pagina
 * si riprende da dove si era. Otto mani sono un quarto d'ora, ventiquattro
 * sono tre sere: pretendere che si facciano in una volta vorrebbe dire non
 * farle fare a nessuno.
 */
export default function TorneoLicitaPage() {
  const { user, loading } = useSharedAuth();
  const [tipo, setTipo] = useState<Tipo>("giornaliero");
  const [torneo, setTorneo] = useState<TorneoCorrente | null>(null);
  const [mano, setMano] = useState<(ManoCondivisa & { numero: number }) | null>(null);
  const [tabella, setTabella] = useState<DdsTable | null>(null);
  const [bids, setBids] = useState<string[]>([]);
  const [attesa, setAttesa] = useState(false);
  const [esito, setEsito] = useState<EsitoLicita | null>(null);
  const [giocato, setGiocato] = useState<
    { level: number; strain: Strain; declarer: Position } | null
  >(null);
  const [classifica, setClassifica] = useState<ClassificaTorneo | null>(null);
  const [avversarioMuto, setAvversarioMuto] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let vivo = true;
    torneoCorrente(tipo)
      .then(async (t) => {
        if (!vivo) return;
        setTorneo(t);
        if (!t) return;
        const [m, cl] = await Promise.all([torneoMano(t.id), classificaTorneo(t.id)]);
        if (!vivo) return;
        setMano(m);
        setTabella(m?.dd_table ? ({ tricks: m.dd_table } as DdsTable) : null);
        setBids([]);
        setEsito(null);
        setGiocato(null);
        setAvversarioMuto(false);
        setClassifica(cl);
      })
      .catch((err) => reportError("torneo-licita:carica", err));
    return () => { vivo = false; };
  }, [tipo, user, loading]);

  /** Una dichiarazione dal motore, con l'errore già ridotto a «non risponde». */
  const chiediABen = async (m: ManoCondivisa, chi: Position, fatte: string[]) => {
    try {
      return await benBid({
        hand: m.hands[chi],
        seat: chi,
        dealer: m.dealer,
        vulnerability: m.vulnerability,
        bidding: { dealer: m.dealer, bids: fatte },
      });
    } catch (err) {
      reportError("torneo-licita:ben", err);
      return { bid: "P", fallback: true };
    }
  };

  const chiudi = async (m: ManoCondivisa, t: DdsTable, finali: string[]) => {
    const e = esitoAsta(finali, m.dealer, t, m.vulnerability);
    const rif = riferimento(m, "ns");
    const perStelle =
      e && rif.metro === "atteso"
        ? (evDelContratto(m, { level: e.level, strain: e.strain, declarer: e.declarer }) ??
           e.punteggio)
        : (e?.punteggio ?? 0);

    const voto = valutaLicita(perStelle, rif.punteggio, rif.metro);
    setEsito(voto);
    setGiocato(e ? { level: e.level, strain: e.strain, declarer: e.declarer } : null);

    if (torneo) {
      await registraRisultatoTorneo({
        torneoId: torneo.id,
        manoId: m.id,
        contratto: e?.contratto ?? null,
        dichiarante: e?.declarer ?? null,
        punteggio: e?.punteggio ?? 0,
        stelle: voto.stelle,
      });
      setTorneo({ ...torneo, fatte: torneo.fatte + 1 });
      setClassifica(await classificaTorneo(torneo.id));
    }
  };

  /**
   * Fa dichiarare gli altri finché non tocca di nuovo a te.
   *
   * Se a tacere è un avversario passa d'ufficio e la schermata lo dice; se
   * tace il compagno non si può fare altro che fermarsi, perché l'esercizio è
   * proprio intendersi con lui. In torneo però la mano NON si annulla: la
   * classifica è la stessa per tutti e una mano saltata resterebbe un buco.
   * Si dice cosa è successo e si lascia riprovare.
   */
  const avanza = async (m: ManoCondivisa, t: DdsTable, iniziali: string[]) => {
    let correnti = iniziali;
    setBids(correnti);
    if (astaChiusa(correnti)) { await chiudi(m, t, correnti); return; }

    setAttesa(true);
    const ordine = ordineDa(m.dealer);
    while (!astaChiusa(correnti)) {
      const chi = ordine[correnti.length % 4];
      if (chi === "south") break;

      let r = await chiediABen(m, chi, correnti);
      if (r.fallback) r = await chiediABen(m, chi, correnti);
      if (r.fallback) {
        if (chi === "north") { setAttesa(false); return; }
        setAvversarioMuto(true);
        r = { bid: "P", fallback: false };
      }
      correnti = [...correnti, r.bid];
      setBids(correnti);
    }
    setAttesa(false);
    if (astaChiusa(correnti)) await chiudi(m, t, correnti);
  };

  const prossima = async () => {
    if (!torneo) return;
    const m = await torneoMano(torneo.id);
    setMano(m);
    setTabella(m?.dd_table ? ({ tricks: m.dd_table } as DdsTable) : null);
    setBids([]);
    setEsito(null);
    setGiocato(null);
    setAvversarioMuto(false);
  };

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold font-display mb-3">Tornei di licita</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Serve l&apos;accesso: un torneo ha una classifica, e una classifica ha
          bisogno di sapere chi sei.
        </p>
        <Link href="/login?redirect=/gioca/torneo-licita"><Button>Entra</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold font-display mb-1 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-gold" aria-hidden="true" />
        Tornei di licita
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Le stesse smazzate per tutti. Si dichiara, si prendono le stelle, si
        finisce in classifica.
      </p>

      <div className="flex gap-2 mb-5" role="group" aria-label="Quale torneo">
        {([["giornaliero", "Oggi · 8 mani"], ["settimanale", "Settimana · 24 mani"]] as [Tipo, string][])
          .map(([t, etichetta]) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              aria-pressed={tipo === t}
              className={`text-sm rounded-full px-4 py-2 border transition-colors ${
                tipo === t
                  ? "bg-figb text-white border-figb"
                  : "border-border text-muted-foreground hover:border-figb"
              }`}
            >
              {etichetta}
            </button>
          ))}
      </div>

      {torneo && (
        <p className="text-sm mb-4">
          <strong>{torneo.fatte}</strong> mani su {torneo.quante}
          {torneo.fatte >= torneo.quante && " — finito"}
        </p>
      )}

      {/* ── La mano ─────────────────────────────────────────────────────── */}
      {torneo && !mano && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <p className="text-sm">
            {torneo.fatte >= torneo.quante
              ? "Hai finito questo torneo. La classifica qui sotto continua ad aggiornarsi finché non chiude."
              : "Non ci sono altre mani da dichiarare: il torneo è chiuso."}
          </p>
        </div>
      )}

      {mano && tabella && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">
                Mano {mano.numero} · sei Sud
              </Badge>
              <span className="text-xs text-muted-foreground">
                {handHcp(mano.hands.south)} PO
              </span>
            </div>
            {SUITS.map((s) => (
              <p key={s} className="text-lg font-mono flex items-center gap-2">
                <SuitSymbol suit={s} size="sm" />
                {formatta(mano.hands.south, s)}
              </p>
            ))}
          </div>

          <div className="mb-4">
            <Asta
              dealer={mano.dealer}
              bids={bids}
              ioSono="south"
              onDichiara={(b) => { void avanza(mano, tabella, [...bids, b]); }}
              disabilitato={attesa || !!esito}
            />
            {attesa && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Gli altri stanno dichiarando…
              </p>
            )}
          </div>

          {avversarioMuto && (
            <p className="text-xs text-muted-foreground mb-3">
              Un avversario non ha risposto in tempo e ha passato d&apos;ufficio.
            </p>
          )}

          {esito && (
            <div className="rounded-2xl border border-border bg-card p-4 mb-6">
              <div className="flex justify-center mb-2">
                <Stelle quante={esito.stelle} className="[&_svg]:w-8 [&_svg]:h-8" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{esito.commento}</p>
              <RiepilogoMano
                deal={mano.hands}
                contratti={contrattiDaRivedere({
                  table: tabella,
                  lato: "ns",
                  vulnerability: mano.vulnerability,
                  riferimento: riferimento(mano, "ns").punteggio,
                  metro: riferimento(mano, "ns").metro,
                  giocato,
                  ev:
                    riferimento(mano, "ns").metro === "atteso"
                      ? (c) => evDelContratto(mano, c)
                      : undefined,
                })}
              />
              <Button className="mt-4" onClick={prossima}>
                {torneo && torneo.fatte >= torneo.quante ? "Vedi la classifica" : "Prossima mano"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── La classifica ───────────────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-3">Classifica</h2>
        {!classifica || classifica.totale === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ancora nessuno ha dichiarato. Il primo che finisce una mano compare qui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="font-normal py-1 w-8">#</th>
                  <th className="font-normal py-1">Giocatore</th>
                  <th className="font-normal py-1 text-right">Mani</th>
                  <th className="font-normal py-1 text-right">Stelle</th>
                </tr>
              </thead>
              <tbody>
                {classifica.righe.map((r, i) => (
                  <tr
                    key={`${r.posizione}-${i}`}
                    className={`border-t border-border ${r.sonoIo ? "font-bold text-figb" : ""}`}
                  >
                    <td className="py-2">{r.posizione}</td>
                    <td className="py-2">
                      {r.nome ?? "Un giocatore"}
                      {r.asd && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {r.asd}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">{r.mani}</td>
                    <td className="py-2 text-right font-mono">{r.stelle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground mt-6">
        Le mani del torneo non compaiono in allenamento finché è aperto: chi si
        allena molto le incontrerebbe prima, e la classifica non direbbe più
        niente.
      </p>
    </div>
  );
}

function formatta(hand: readonly Card[], suit: Suit): string {
  const carte = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return carte.length ? carte.join(" ") : "—";
}
