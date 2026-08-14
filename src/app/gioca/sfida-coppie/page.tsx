"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useFriends } from "@/hooks/use-friends";
import { reportError } from "@/lib/report-error";
import {
  chiudiBoard, creaSfida, mieSfide, vistaSfida,
  type RigaSfida, type VistaSfida,
} from "@/lib/sfide-coppie-db";
import { confrontaPunteggi } from "@/lib/sfida-coppie";
import { StatisticheSfidePannello } from "@/components/bridge/statistiche-sfide";

/**
 * Sfida 2 contro 2: due coppie, le stesse smazzate.
 *
 * COME SI VINCE, E PERCHÉ SONO DUE NUMERI
 * Gli IMP dicono chi ha vinto l'incontro; le stelle dicono quanto bene si è
 * dichiarato. Servono entrambi perché si può vincere 12-0 con due licite
 * mediocri, se l'altra coppia ha fatto peggio: col solo punteggio si
 * porterebbe a casa la convinzione di aver dichiarato bene.
 *
 * NON È DUPLICATO VERO. A squadre le due coppie siedono in linee opposte sulla
 * stessa smazzata; qui giocano tutte e due la stessa linea contro BEN, perché
 * così si può giocare in momenti diversi — e per i nostri iscritti quella è la
 * differenza fra usarlo e non usarlo. Sta scritto anche qui sotto: chi conosce
 * il bridge a squadre non deve credere che sia la stessa cosa.
 */
export default function SfidaCoppiePage() {
  const { user } = useSharedAuth();
  const { friends } = useFriends();
  const [elenco, setElenco] = useState<RigaSfida[] | null>(null);
  const [aperta, setAperta] = useState<VistaSfida | null>(null);
  const [compagno, setCompagno] = useState("");
  const [avv1, setAvv1] = useState("");
  const [avv2, setAvv2] = useState("");
  const [creando, setCreando] = useState(false);
  const [errore, setErrore] = useState("");

  const ricarica = useCallback(() => {
    mieSfide().then(setElenco).catch((err) => reportError("sfida-coppie:elenco", err));
  }, []);

  useEffect(() => {
    if (user) ricarica();
  }, [user, ricarica]);

  /**
   * Apre una sfida e, per prima cosa, chiede al server di registrare le board
   * la cui licita è finita.
   *
   * Si fa qui e non alla fine della licita perché chi chiude l'asta può essere
   * il compagno: se il risultato lo scrivesse solo lui, la sfida resterebbe
   * indietro finché non torna. Chiamarlo due volte non fa danni.
   */
  const apri = async (id: string) => {
    const v = await vistaSfida(id);
    if (!v) { setErrore("Questa sfida non è tua."); return; }
    const daChiudere = v.board.filter((b) => !b.chiusa);
    if (daChiudere.length) {
      await Promise.all(daChiudere.map((b) => chiudiBoard(b.sessioneId)));
      setAperta(await vistaSfida(id));
    } else {
      setAperta(v);
    }
    ricarica();
  };

  const crea = async () => {
    setErrore("");
    if (!compagno || !avv1 || !avv2) return;
    setCreando(true);
    const id = await creaSfida(compagno, [avv1, avv2], 4);
    setCreando(false);
    if (!id) {
      setErrore(
        "Non è stato possibile creare la sfida. Il compagno dev'essere un amico, e le quattro persone devono essere diverse."
      );
      return;
    }
    ricarica();
    void apri(id);
  };

  if (!user) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold font-display mb-3">Sfida 2 contro 2</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Serve l&apos;accesso: una sfida è fra quattro persone, e devono
          potersi ritrovare.
        </p>
        <Link href="/login"><Button>Entra</Button></Link>
      </div>
    );
  }

  if (aperta) return <Dettaglio sfida={aperta} onIndietro={() => { setAperta(null); ricarica(); }} />;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold font-display mb-1 flex items-center gap-2">
        <Swords className="w-6 h-6 text-figb" aria-hidden="true" />
        Sfida 2 contro 2
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Tu e il tuo compagno contro un&apos;altra coppia, sulle stesse
        smazzate. Si dichiara quando si può: non serve essere collegati
        insieme.
      </p>

      {/* Le sfide in corso */}
      {elenco === null && <p className="text-sm text-muted-foreground">Carico…</p>}
      {elenco?.length === 0 && (
        <p className="text-sm text-muted-foreground mb-6">
          Nessuna sfida ancora. Lanciane una qui sotto.
        </p>
      )}
      {elenco && elenco.length > 0 && (
        <ul className="space-y-2 mb-8">
          {elenco.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => apri(s.id)}
                className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-figb transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    contro {s.avversari.filter(Boolean).join(" e ") || "una coppia"}
                  </span>
                  <Badge variant={s.daFare > 0 ? "default" : "secondary"}>
                    {s.daFare > 0 ? `${s.daFare} da fare` : "finita"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {s.totale} smazzate · coppia {s.miaCoppia}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Nuova sfida */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-figb" aria-hidden="true" />
          Nuova sfida
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Il compagno dev&apos;essere un amico. Gli avversari no: al circolo si
          sfida anche chi si conosce appena.
        </p>

        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Prima serve almeno un amico:{" "}
            <Link href="/amici" className="text-figb hover:underline">aggiungine uno</Link>.
          </p>
        ) : (
          <div className="space-y-3">
            <Scelta etichetta="Il tuo compagno" valore={compagno} onCambia={setCompagno} amici={friends} />
            <Scelta etichetta="Primo avversario" valore={avv1} onCambia={setAvv1} amici={friends} />
            <Scelta etichetta="Secondo avversario" valore={avv2} onCambia={setAvv2} amici={friends} />
            <Button onClick={crea} disabled={!compagno || !avv1 || !avv2 || creando}>
              {creando ? "Preparo le mani…" : "Lancia la sfida (4 smazzate)"}
            </Button>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold mb-3">Come vai</h2>
        <StatisticheSfidePannello />
      </section>

      <p className="text-xs text-muted-foreground mt-6">
        Non è un duplicato vero: a squadre le due coppie siedono in linee
        opposte, qui giocano entrambe la stessa linea contro il computer. Serve
        a poter giocare in momenti diversi.
      </p>
    </div>
  );
}

function Scelta({
  etichetta, valore, onCambia, amici,
}: {
  etichetta: string;
  valore: string;
  onCambia: (v: string) => void;
  amici: { friend_id: string; user_id: string; profile: { id: string; display_name: string | null } }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {etichetta}
      </span>
      <select
        value={valore}
        onChange={(e) => onCambia(e.target.value)}
        className="mt-1 w-full h-12 px-3 rounded-xl border border-border bg-card"
      >
        <option value="">Scegli…</option>
        {amici.map((a) => (
          <option key={a.profile.id} value={a.profile.id}>
            {a.profile.display_name ?? "Un giocatore"}
          </option>
        ))}
      </select>
    </label>
  );
}

function Dettaglio({ sfida, onIndietro }: { sfida: VistaSfida; onIndietro: () => void }) {
  const miei = sfida.miaCoppia === "A" ? sfida.coppiaA : sfida.coppiaB;
  const loro = sfida.miaCoppia === "A" ? sfida.coppiaB : sfida.coppiaA;

  const confronto = confrontaPunteggi(
    sfida.board.map((b) => ({
      mio: b.punteggio ?? 0,
      altro: b.altroPunteggio,
      riferimento: riferimentoDiBoard(b),
    }))
  );

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <button onClick={onIndietro} className="text-sm text-muted-foreground hover:underline mb-4">
        ← Le mie sfide
      </button>

      <h1 className="text-xl font-bold font-display mb-1">
        {miei.filter(Boolean).join(" e ")} contro {loro.filter(Boolean).join(" e ")}
      </h1>

      <div className="flex gap-6 my-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">IMP</p>
          <p className="text-2xl font-bold">
            {confronto.impMiei} <span className="text-muted-foreground">–</span> {confronto.impAltri}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Le tue stelle</p>
          <p className="text-2xl font-bold text-figb">{confronto.stelle} ⭐</p>
        </div>
      </div>
      {confronto.confrontate < sfida.board.length && (
        <p className="text-xs text-muted-foreground mb-4">
          Gli IMP contano solo le {confronto.confrontate} smazzate finite da
          entrambe le coppie.
        </p>
      )}

      <ul className="space-y-2">
        {sfida.board.map((b, i) => (
          <li key={b.manoId} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-semibold">Smazzata {b.numero}</span>
              {b.chiusa ? (
                <span className="text-sm">
                  {b.contratto ?? "passo"} · {b.punteggio}
                </span>
              ) : (
                <Link href={`/gioca/licita-amico?s=${b.sessioneId}`}>
                  <Button>Dichiara</Button>
                </Link>
              )}
            </div>

            {b.chiusa && (
              <p className="text-sm text-muted-foreground">
                {b.altraChiusa ? (
                  <>
                    Loro: {b.altroContratto ?? "passo"} · {b.altroPunteggio} —{" "}
                    {confronto.board[i].aFavoreDi === "pari"
                      ? "pari"
                      : `${confronto.board[i].imp} IMP ${confronto.board[i].aFavoreDi === "mia" ? "per voi" : "per loro"}`}
                  </>
                ) : (
                  "L'altra coppia non ha ancora dichiarato questa mano."
                )}
              </p>
            )}
            {b.chiusa && (
              <p className="text-sm mt-1">
                {"⭐".repeat(confronto.board[i].stelle) || "nessuna stella"}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Il metro per le stelle di una board.
 *
 * Il valore atteso quando c'è, il par altrimenti — le stesse regole del gioco
 * in solitaria, perché una stella deve valere lo stesso dappertutto.
 */
function riferimentoDiBoard(b: {
  parScore: number | null;
  valoreAtteso: { ns?: { ev: number }; ew?: { ev: number } } | null;
}): number {
  const va = b.valoreAtteso;
  if (va?.ns && va?.ew) {
    return va.ns.ev >= va.ew.ev ? va.ns.ev : -va.ew.ev;
  }
  return b.parScore ?? 0;
}
