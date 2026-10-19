"use client";

import { use, useEffect, useState } from "react";
import Link from "@/components/link";
import { Users } from "lucide-react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { handHcp } from "@/lib/deal-generator";
import {
  getLiveTable,
  getOpenLiveTable,
  playLiveCard,
  statoDelGioco,
  watchLiveTable,
  type LiveTable,
} from "@/lib/live-table";
import { getValidCards, parseContract } from "@/lib/bridge-engine";
import { SondaggioAllievo } from "@/components/sondaggio-allievo";
import { SceltaPosto } from "@/components/istruttori/scelta-posto";
import { VideoTavolo } from "@/components/bridge/video-tavolo";
import { createClient } from "@/lib/supabase/client";
import { nomiDellaClasse } from "@/lib/aula";
import { useT } from "@/contexts/traduzioni-provider";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";
import { statoMiaIscrizione } from "@/lib/instructors";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};
const NOME_SEME: Record<Suit, string> = {
  spade: "picche", heart: "cuori", diamond: "quadri", club: "fiori",
};

/**
 * Il tavolo condiviso, lato allievo.
 *
 * Si vede la propria mano e quelle che l'insegnante ha scoperto. Le altre non
 * sono nascoste dall'interfaccia: non arrivano proprio — il filtro sta dentro
 * il database (`live_table_view`), quindi aprire gli strumenti per
 * sviluppatori non serve a nulla. È l'unica difesa che regge in una classe.
 *
 * Chi non ha ancora un posto assegnato vede solo ciò che è scoperto per tutti:
 * è la situazione normale all'inizio della lezione, non un errore.
 */
export default function TavoloAllievoPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = useT();
  const { classId } = use(params);
  const { user, loading } = useSharedAuth();
  const [tableId, setTableId] = useState<string | null>(null);
  const [stato, setStato] = useState<LiveTable | null>(null);
  const [nomi, setNomi] = useState<Map<string, string>>(new Map());
  const [videoAcceso, setVideoAcceso] = useState(false);
  const [cercato, setCercato] = useState(false);
  const [errore, setErrore] = useState("");
  // Una carta alla volta: il doppio clic giocava la carta al primo tocco e
  // al secondo riceveva «carta non giocabile» — un falso allarme dopo una
  // giocata riuscita (Trevissoi, feedback 4, punto 3.5).
  const [giocando, setGiocando] = useState(false);

  /**
   * Si RICHIEDE finché un tavolo non c'è.
   *
   * La pagina dice «puoi lasciare la pagina aperta», e prima non era vero:
   * questo effetto girava una volta sola al montaggio, e il realtime ascolta
   * solo gli UPDATE di un tavolo che si conosce già — l'INSERT di un tavolo
   * nuovo non lo sentiva nessuno. Chi apriva la pagina prima dell'insegnante
   * restava su «nessun tavolo aperto» per sempre.
   *
   * Ogni otto secondi, e solo finché non si è trovato: appena c'è il tavolo
   * subentra il canale realtime e questo si ferma.
   */
  useEffect(() => {
    if (tableId) return;
    let vivo = true;
    const cerca = () => {
      void getOpenLiveTable(classId)
        .then((id) => {
          if (!vivo) return;
          if (id) setTableId(id);
        })
        .finally(() => {
          if (vivo) setCercato(true);
        });
    };
    cerca();
    const t = setInterval(cerca, 8000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [classId, tableId]);

  useEffect(() => {
    if (!tableId) return;
    return watchLiveTable(tableId, setStato);
  }, [tableId]);

  // Chi è entrato dal link e aspetta l'OK dell'insegnante: si ricontrolla ogni
  // cinque secondi, e appena è dentro la pagina prosegue da sola.
  const [inAttesa, setInAttesa] = useState(false);
  useEffect(() => {
    if (!user) return;
    let vivo = true;
    const controlla = () => {
      void statoMiaIscrizione(classId).then((st) => {
        if (vivo) setInAttesa(st === "pending");
      });
    };
    controlla();
    const timer = setInterval(controlla, 5000);
    return () => {
      vivo = false;
      clearInterval(timer);
    };
  }, [classId, user]);

  // I nomi dei compagni servono per far vedere chi è già seduto: si caricano
  // una volta, non cambiano durante la lezione.
  useEffect(() => {
    void nomiDellaClasse(classId).then(setNomi);
  }, [classId]);

  // Se l'insegnante ha acceso la telecamera per questa classe. Spenta di
  // partenza: in caso di dubbio non si apre niente.
  useEffect(() => {
    const supabase = createClient();
    void supabase.from("classes").select("video_tavolo").eq("id", classId).maybeSingle()
      .then(({ data }) => setVideoAcceso(data?.video_tavolo === true));
  }, [classId]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href={`/login?redirect=/classi/${classId}/tavolo`} className="underline">{t("Accedi")}</Link>{" "}
          per vedere il tavolo della tua classe.
        </p>
      </div>
    );
  }

  if (inAttesa) {
    return (
      <div className="min-h-screen px-4 py-16 max-w-md mx-auto text-center">
        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold font-display mb-2">{t("Aspetta l'insegnante")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("L'insegnante deve farti entrare. Appena lo fa, il tavolo compare qui da solo: lascia la pagina aperta.")}
        </p>
      </div>
    );
  }

  if (cercato && !tableId) {
    return (
      <div className="min-h-screen px-4 py-16 max-w-md mx-auto text-center">
        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold font-display mb-2">{t("Nessun tavolo aperto")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("Quando l'insegnante apre il tavolo, la mano comparirà qui da sola: puoi lasciare la pagina aperta.")}
        </p>
      </div>
    );
  }

  const visibili = (Object.keys(stato?.hands ?? {}) as Position[]).filter(
    (p) => (stato?.hands[p]?.length ?? 0) > 0
  );

  // Turno e presa in corso si ricavano dalle carte giocate: il database
  // conserva solo quelle, le regole stanno in un posto solo.
  const trump = stato?.contract ? parseContract(stato.contract).trumpSuit : null;
  const gioco = stato?.declarer
    ? statoDelGioco(stato.played ?? [], stato.declarer, trump)
    : null;
  const tocca = gioco?.turno === stato?.seat && stato?.seat != null;
  const miePlayable = tocca && stato?.seat
    ? getValidCards(stato.hands[stato.seat] ?? [], gioco?.presaCorrente ?? [])
    : [];
  const playableSet = new Set(miePlayable.map((c) => `${c.suit}-${c.rank}`));
  const manoFinita = !!stato?.seat && (stato.hands[stato.seat]?.length ?? 0) === 0 && (stato.played?.length ?? 0) > 0;

  /**
   * PERCHÉ una carta non si può giocare, detto prima di chiederlo al database.
   * Le carte della propria mano restano tutte toccabili: una carta spenta che
   * non risponde non insegna niente, una che dice «devi rispondere a cuori»
   * insegna la regola.
   */
  const motivoNonGiocabile = (carta: Card): string | null => {
    if (!gioco || !stato?.seat) return null;
    if (manoFinita) return t("La mano è finita.");
    if (gioco.turno !== stato.seat) {
      return t("Non tocca a te: ora gioca {chi}.", { chi: t(ETICHETTA[gioco.turno]) });
    }
    if (!playableSet.has(`${carta.suit}-${carta.rank}`)) {
      const attacco = gioco.presaCorrente[0]?.card.suit;
      if (attacco) {
        return t("Devi rispondere a {seme}: hai ancora carte di quel seme.", { seme: t(NOME_SEME[attacco]) });
      }
    }
    return null;
  };

  /** Le risposte del database, in parole che dicono cosa fare. */
  const spiegaRifiuto = (codice: string | undefined, carta: Card): string | null => {
    switch (codice) {
      case "carta non giocabile": {
        // Già giocata (tipicamente da un doppio clic, o da un'altra scheda):
        // non c'è niente da dire, solo da rileggere il tavolo.
        const giaUscita = (stato?.played ?? []).some(
          (g) => g.card.suit === carta.suit && g.card.rank === carta.rank,
        );
        return giaUscita ? null : t("Questa carta non è più nella tua mano: aggiorno il tavolo.");
      }
      case "nessun posto assegnato":
        return t("Prima siediti: scegli il tuo posto qui sopra.");
      case "tavolo non disponibile":
        return t("L'insegnante ha chiuso il tavolo.");
      case "non fai parte di questa classe":
        return t("Non risulti iscritto a questa classe.");
      // Gli stessi controlli dell'interfaccia, ripetuti dal server
      // (gioco-regole-server-2026-10.sql): arrivano qui solo se la vista era
      // rimasta indietro rispetto al tavolo.
      case "non tocca a te":
        return t("Non tocca a te: aggiorno il tavolo.");
      case "devi rispondere al seme":
        return t("Devi rispondere al seme della presa: hai ancora carte di quel seme.");
      case "mano finita":
        return t("La mano è finita.");
      default:
        return codice ?? t("Non è stato possibile giocare la carta. Riprova.");
    }
  };

  const gioca = async (carta: Card) => {
    if (!tableId || giocando) return;
    const motivo = motivoNonGiocabile(carta);
    if (motivo) {
      setErrore(motivo);
      return;
    }
    setErrore("");
    setGiocando(true);
    try {
      const esito = await playLiveCard(tableId, carta);
      if (!esito.ok) {
        setErrore(spiegaRifiuto(esito.errore, carta) ?? "");
        const aggiornato = await getLiveTable(tableId);
        if (aggiornato) setStato(aggiornato);
      }
    } finally {
      setGiocando(false);
    }
  };

  const altreVisibili = visibili.filter((p) => p !== stato?.seat);
  const miaVisibile = !!stato?.seat && visibili.includes(stato.seat);

  return (
    <div className="min-h-screen px-4 py-4 max-w-2xl mx-auto">
      <header className="mb-3 text-center">
        <h1 className="text-xl font-bold font-display">{stato?.titolo ?? t("Tavolo della classe")}</h1>
        {stato?.seat ? (
          <p className="text-sm text-muted-foreground mt-1">
            {t("Sei")} <strong>{t(ETICHETTA[stato.seat])}</strong>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            {t("Scegli dove sederti.")}
          </p>
        )}
      </header>

      {/*
        LA SCELTA DEL POSTO STA IN CIMA, e sparisce appena la mano comincia.
        Prima l'allievo aspettava che l'insegnante gli assegnasse una sedia;
        adesso si siede da sé, vedendo chi c'è già — che è come funziona in
        circolo, e come Trevissoi ha chiesto: «loro devono poter sedere dove
        vogliono, gli altri posti rimangono liberi e loro entrano».
      */}
      {/*
        LA TELECAMERA, se la classe l'ha accesa. Sta sopra al tavolo e non
        dentro: chi gioca guarda le carte, e un riquadro in mezzo alle mani
        sposterebbe l'attenzione proprio dove non deve stare.
      */}
      {tableId && videoAcceso && user && (
        <VideoTavolo tavoloId={tableId} io={user.id} nomi={nomi} />
      )}

      {tableId && stato && (stato.played?.length ?? 0) === 0 && (
        <div className="mb-5">
          <SceltaPosto
            tavoloId={tableId}
            postiOccupati={stato.seatOf ?? {}}
            nomi={nomi}
            ioSono={user?.id ?? null}
            inAttesa={stato.inAttesa ?? []}
            maniAlTurno={stato.maniAlTurno ?? 0}
            prossimoAUscire={stato.prossimoAUscire ?? null}
            // Il canale realtime porta già lo stato nuovo, ma può tardare di
            // qualche secondo: rileggere subito evita che chi si è appena
            // seduto veda ancora il posto libero e ci ritocchi sopra.
            onCambiato={() => void getLiveTable(tableId).then((t) => t && setStato(t))}
          />
        </div>
      )}

      {/*
        Il sondaggio sta QUI e non solo nella pagina della classe: durante la
        lezione l'allievo è al tavolo, e una domanda che compare da un'altra
        parte è una domanda a cui non risponde nessuno.
      */}
      <SondaggioAllievo classId={classId} />

      {/*
        UN BLOCCO SOLO per tutto quello che serve mentre si gioca: contratto,
        chi dichiara, il proprio posto, le prese, la presa in corso con ogni
        carta vicino a chi l'ha giocata, il turno e la propria mano. Prima
        erano quattro riquadri impilati, e su uno schermo da PC la mano finiva
        sotto la piega (Trevissoi, feedback 4, punto 3.2).
      */}
      {/*
        Il blocco c'è anche SENZA contratto: la propria mano l'allievo la vede
        appena seduto. Prima stava tutto dentro la condizione sul contratto, e
        il contratto all'allievo arriva solo dopo «Mostra il contratto» — che
        si azzera a ogni mano nuova: chi si sedeva vedeva il tavolo e nessuna
        carta (Trevissoi, feedback 5).
      */}
      {(stato?.contract || miaVisibile) && (
        <section className="mb-4 rounded-2xl border-2 border-figb/30 bg-card p-3 sm:p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            {stato?.contract ? (
            <p className="text-2xl font-bold text-figb font-display">
              {contrattoLeggibile(stato.contract)}
              {stato.declarer && (
                <span className="ml-2 text-sm font-semibold text-muted-foreground">
                  {t("dichiara {chi}", { chi: t(ETICHETTA[stato.declarer]) })}
                </span>
              )}
            </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("Il contratto lo dirà l'insegnante.")}</p>
            )}
            {gioco && (
              <p className="text-sm tabular-nums text-muted-foreground">
                {t("Presa {n}", { n: Math.min(gioco.prese.length + 1, 13) })} · {t("Nord-Sud")} <strong className="text-foreground">{gioco.preseNs}</strong> · {t("Est-Ovest")} <strong className="text-foreground">{gioco.preseEw}</strong>
              </p>
            )}
          </div>

          {gioco && (
            <div className="my-3 grid grid-cols-3 grid-rows-3 items-center justify-items-center gap-1 rounded-xl bg-muted/40 py-2 text-sm">
              {(["north", "west", "east", "south"] as Position[]).map((pos) => {
                const giocata = gioco.presaCorrente.find((g) => g.position === pos);
                const area =
                  pos === "north" ? "col-start-2 row-start-1"
                  : pos === "south" ? "col-start-2 row-start-3"
                  : pos === "west" ? "col-start-1 row-start-2"
                  : "col-start-3 row-start-2";
                return (
                  <div key={pos} className={`${area} flex flex-col items-center leading-tight`}>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${pos === stato.seat ? "text-figb" : "text-muted-foreground"}`}>
                      {pos === stato.seat ? t("Tu") : t(ETICHETTA[pos])}
                    </span>
                    <span className="flex min-h-8 items-center gap-0.5 text-xl font-bold">
                      {giocata ? (
                        <>
                          <SuitSymbol suit={giocata.card.suit} size="sm" />
                          {giocata.card.rank}
                        </>
                      ) : (
                        <span className="text-muted-foreground/50">·</span>
                      )}
                    </span>
                  </div>
                );
              })}
              {/*
                ANNUNCIATO, non solo scritto: il turno cambia per una carta
                giocata da un altro, e chi non guarda lo schermo in quel momento
                non ha modo di accorgersene. `polite`: non interrompe.
              */}
              <p
                className={`col-start-2 row-start-2 text-center font-semibold ${tocca ? "text-figb" : ""}`}
                aria-live="polite"
                role="status"
              >
                {manoFinita ? t("Mano finita") : tocca ? t("Tocca a te") : t("Gioca {chi}", { chi: t(ETICHETTA[gioco.turno]) })}
              </p>
            </div>
          )}

          {errore && <p className="mb-2 text-center text-sm font-medium text-destructive" role="alert">{errore}</p>}

          {miaVisibile && stato?.seat && (
            <div>
              <p className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-semibold text-figb">
                  {t("La tua mano")} · {t(ETICHETTA[stato.seat])}
                </span>
                <span className="text-xs text-muted-foreground">{handHcp(stato.hands[stato.seat] ?? [])} PO</span>
              </p>
              <div className="space-y-1">
                {SUITS.map((suit) => {
                  const delSeme = (stato.hands[stato.seat!] ?? [])
                    .filter((c) => c.suit === suit)
                    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
                  return (
                    <div key={suit} className="flex flex-wrap items-center gap-1">
                      <span className="w-6 shrink-0"><SuitSymbol suit={suit} size="md" /></span>
                      {delSeme.length === 0 && <span className="text-xl text-muted-foreground">—</span>}
                      {delSeme.map((c) => {
                        const giocabile = playableSet.has(`${c.suit}-${c.rank}`);
                        return (
                          <button
                            key={`${c.suit}-${c.rank}`}
                            onClick={() => void gioca(c)}
                            disabled={giocando}
                            aria-label={`${c.rank} ${t(NOME_SEME[c.suit])}`}
                            className={`min-h-11 min-w-10 rounded-lg border px-1.5 text-2xl font-bold transition-colors ${
                              giocabile
                                ? "border-figb bg-figb/10 hover:bg-figb/20"
                                : "border-border bg-background opacity-60"
                            }`}
                          >
                            {c.rank}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {!stato?.contract && errore && <p className="text-sm text-destructive text-center mb-3">{errore}</p>}

      {visibili.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {t("L'insegnante non ha ancora scoperto nessuna mano.")}
        </p>
      ) : (
        altreVisibili.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {altreVisibili.map((p) => (
              <div key={p} className="rounded-xl border border-border bg-card px-3 py-2">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="font-bold">{t(ETICHETTA[p])}</span>
                  <span className="text-xs text-muted-foreground">{handHcp(stato?.hands[p] ?? [])} PO</span>
                </div>
                {SUITS.map((suit) => {
                  const delSeme = (stato?.hands[p] ?? [])
                    .filter((c) => c.suit === suit)
                    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
                  return (
                    <p key={suit} className="flex items-center gap-1.5 text-lg font-semibold leading-snug">
                      <SuitSymbol suit={suit} size="sm" />
                      {delSeme.length === 0 ? "—" : delSeme.map((c) => c.rank).join(" ")}
                    </p>
                  );
                })}
              </div>
            ))}
          </div>
        )
      )}

      <p className="text-center text-xs text-muted-foreground mt-6">
        {t("La pagina si aggiorna da sola quando l'insegnante cambia mano.")}
      </p>
    </div>
  );
}
