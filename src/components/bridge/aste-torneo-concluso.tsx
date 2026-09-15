"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Trophy } from "lucide-react";
import { Asta } from "@/components/bridge/asta";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import {
  asteGiocatoreTorneo,
  classificaTorneo,
  ultimoTorneoConAste,
  type AsteGiocatoreTorneo,
  type ClassificaTorneo,
  type RigaClassifica,
  type TorneoConAste,
} from "@/lib/mani-condivise";

type TipoTorneo = "giornaliero" | "settimanale";

/**
 * Le aste dell'ultimo torneo chiuso.
 *
 * È un componente separato dal torneo corrente perché i due periodi non
 * coincidono mai: quando un torneo diventa consultabile, `torneoCorrente` sta
 * già restituendo quello successivo. Il dettaglio viene caricato al click, una
 * persona per volta, invece di scaricare tutte le aste della classifica.
 */
export function AsteTorneoConcluso({ tipo }: { tipo: TipoTorneo }) {
  const t = useT();
  const { lingua } = useLingua();
  const [torneo, setTorneo] = useState<TorneoConAste | null>(null);
  const [classifica, setClassifica] = useState<ClassificaTorneo | null>(null);
  const [caricamentoArchivio, setCaricamentoArchivio] = useState(true);
  const [giocatoreAperto, setGiocatoreAperto] = useState<string | null>(null);
  const [dettaglio, setDettaglio] = useState<AsteGiocatoreTorneo | null>(null);
  const [caricamentoAste, setCaricamentoAste] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const richiesta = useRef(0);

  useEffect(() => {
    let vivo = true;
    const numeroRichiesta = ++richiesta.current;

    ultimoTorneoConAste(tipo).then(async (ultimo) => {
      if (!vivo || richiesta.current !== numeroRichiesta) return;
      if (!ultimo) {
        setCaricamentoArchivio(false);
        return;
      }
      const graduatoria = await classificaTorneo(ultimo.id);
      if (!vivo || richiesta.current !== numeroRichiesta) return;
      setTorneo(ultimo);
      setClassifica(graduatoria);
      setCaricamentoArchivio(false);
      if (!graduatoria) {
        setErrore(t("Non siamo riusciti a caricare la classifica conclusa."));
      }
    });

    return () => {
      vivo = false;
    };
  }, [tipo, t]);

  const apriAste = async (riga: RigaClassifica) => {
    if (!torneo || !riga.giocatoreId || !riga.haAste) return;
    if (giocatoreAperto === riga.giocatoreId && dettaglio) {
      richiesta.current++;
      setGiocatoreAperto(null);
      setDettaglio(null);
      setErrore(null);
      return;
    }

    const numeroRichiesta = ++richiesta.current;
    setGiocatoreAperto(riga.giocatoreId);
    setDettaglio(null);
    setErrore(null);
    setCaricamentoAste(true);
    const ricevute = await asteGiocatoreTorneo(torneo.id, riga.giocatoreId);
    if (richiesta.current !== numeroRichiesta) return;
    setCaricamentoAste(false);
    if (!ricevute) {
      setErrore(t("Le aste non sono disponibili. Riprova tra poco."));
      return;
    }
    setDettaglio(ricevute);
  };

  return (
    <section className="mt-8" aria-labelledby="aste-torneo-concluso">
      <div className="mb-3 flex items-start gap-2">
        <Eye className="mt-0.5 size-5 shrink-0 text-figb" aria-hidden="true" />
        <div>
          <h2 id="aste-torneo-concluso" className="text-balance font-semibold">
            {t("Aste a confronto")}
          </h2>
          <p className="text-pretty text-xs text-muted-foreground">
            {t("Le dichiarazioni degli altri diventano visibili soltanto dopo la chiusura del torneo.")}
          </p>
        </div>
      </div>

      {caricamentoArchivio ? (
        <div
          className="rounded-2xl border border-border bg-card p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-muted-foreground">{t("Caricamento delle aste concluse…")}</p>
        </div>
      ) : !torneo ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-pretty text-sm text-muted-foreground">
            {t("Completa un torneo: dopo la sua chiusura troverai qui le aste da confrontare.")}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="size-4 text-gold" aria-hidden="true" />
            <p className="text-sm font-medium">
              {etichettaPeriodo(
                torneo,
                tipo === "giornaliero" ? t("Torneo concluso") : t("Settimana conclusa"),
                lingua,
              )}
            </p>
          </div>

          {classifica && classifica.righe.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="w-8 py-1 font-normal">#</th>
                    <th className="py-1 font-normal">{t("Giocatore")}</th>
                    <th className="py-1 text-right font-normal">{t("Stelle")}</th>
                    <th className="py-1 text-right font-normal">
                      <span className="sr-only">{t("Azioni")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {classifica.righe.map((riga, indice) => {
                    const aperto = riga.giocatoreId === giocatoreAperto && dettaglio !== null;
                    const disponibile = Boolean(riga.giocatoreId && riga.haAste);
                    return (
                      <tr
                        key={`${riga.giocatoreId ?? "senza-id"}-${indice}`}
                        className="border-t border-border"
                      >
                        <td className="py-2 tabular-nums">{riga.posizione}</td>
                        <td className="max-w-40 py-2">
                          <span className="block truncate font-medium">
                            {riga.nome ?? t("Un giocatore")}
                          </span>
                          {riga.asd && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {riga.asd}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">{riga.stelle}</td>
                        <td className="py-2 pl-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!disponibile || (caricamentoAste && riga.giocatoreId === giocatoreAperto)}
                            aria-expanded={aperto}
                            aria-controls="dettaglio-aste-torneo"
                            onClick={() => void apriAste(riga)}
                          >
                            {aperto ? t("Chiudi") : disponibile ? t("Vedi le aste") : t("Non disponibile")}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {caricamentoAste && (
            <p className="mt-4 text-sm text-muted-foreground" role="status" aria-live="polite">
              {t("Caricamento delle aste…")}
            </p>
          )}

          {errore && (
            <p className="mt-4 text-pretty text-sm text-destructive" role="alert">
              {errore}
            </p>
          )}

          {dettaglio && (
            <div id="dettaglio-aste-torneo" className="mt-5 border-t border-border pt-4">
              <h3 className="text-balance font-semibold">
                {t("Aste di")} {dettaglio.giocatore.nome ?? t("un giocatore")}
              </h3>
              <p className="mb-3 text-pretty text-xs text-muted-foreground">
                {t("Apri una mano per confrontare la sequenza completa delle dichiarazioni.")}
              </p>

              <div className="space-y-2">
                {dettaglio.aste.map((asta) => (
                  <details key={asta.numero} className="rounded-xl border border-border px-3 py-2">
                    <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span>{t("Mano")} {asta.numero}</span>
                      <span className="ml-2 font-normal text-muted-foreground">
                        {asta.contratto ?? t("Passo generale")} · {asta.stelle} {t("stelle")}
                      </span>
                    </summary>
                    <div className="mt-3">
                      <Asta dealer={asta.dealer} bids={asta.bids} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** La data utile è l'ultimo istante del torneo, non la mezzanotte successiva. */
function etichettaPeriodo(
  torneo: TorneoConAste,
  prefisso: string,
  lingua: "it" | "en",
): string {
  const chiusura = Date.parse(torneo.chiudeAt);
  if (!Number.isFinite(chiusura)) return prefisso;
  const ultimoIstante = new Date(chiusura - 1);
  return `${prefisso} · ${new Intl.DateTimeFormat(lingua === "en" ? "en-GB" : "it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(ultimoIstante)}`;
}
