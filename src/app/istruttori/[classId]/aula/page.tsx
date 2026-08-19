"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briciole } from "@/components/briciole";
import { PulsanteSegnalazione } from "@/components/pulsante-segnalazione";
import { SondaggioAula } from "@/components/istruttori/sondaggio-aula";
import {
  apriAula,
  chiudiAula,
  distribuisciATutti,
  fermoDa,
  sessioneAperta,
  statoAula,
  type SessioneAula,
  type StatoTavolo,
} from "@/lib/aula";
import { DEAL_TEMPLATES, generateDeals } from "@/lib/deal-generator";
import { calcTableAndPar } from "@/lib/dds-table";
import { parAssignmentFromContracts } from "@/lib/par-contract";
import { reportError } from "@/lib/report-error";
import type { Position } from "@/lib/bridge-engine";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * La console dell'aula.
 *
 * A COLPO D'OCCHIO, CHI È FERMO. È l'unica informazione che serve a chi gira
 * fra i tavoli: un tavolo che non tocca una carta da tre minuti è un tavolo
 * dove qualcuno non sa cosa fare, e va raggiunto prima degli altri. Il resto —
 * che mano, quante carte — lo si legge entrando.
 *
 * «DISTRIBUISCI A TUTTI» È UNA SOLA SCRITTURA, non una per tavolo: fatta dal
 * browser sarebbero quaranta andate e ritorni, cioè la differenza fra «la
 * classe vede la mano insieme» e «la vede a scaglioni».
 *
 * I POSTI VUOTI RESTANO VUOTI. Il piano dice esplicitamente di non costruire un
 * motore dichiarativo, e qui non c'è: chi vuole coprire un posto lo fa
 * giocando per quella posizione dal tavolo, come già si può.
 */
export default function AulaPage({ params }: { params: Promise<{ classId: string }> }) {
  const t = useT();
  const { classId } = use(params);
  const [sessione, setSessione] = useState<SessioneAula | null>(null);
  const [tavoli, setTavoli] = useState<StatoTavolo[]>([]);
  const [quanti, setQuanti] = useState(4);
  const [modelloId, setModelloId] = useState(DEAL_TEMPLATES[0].id);
  const [seed, setSeed] = useState(2026);
  const [occupato, setOccupato] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const [caricando, setCaricando] = useState(true);

  const ricarica = useCallback(async () => {
    try {
      const s = await sessioneAperta(classId);
      setSessione(s);
      setTavoli(s ? await statoAula(s.id) : []);
    } finally {
      setCaricando(false);
    }
  }, [classId]);

  useEffect(() => {
    void ricarica();
    // Tre secondi: è il ritmo con cui si guarda una sala girandoci in mezzo.
    const t = setInterval(() => void ricarica(), 3000);
    return () => clearInterval(t);
  }, [ricarica]);

  async function distribuisci() {
    if (!sessione) return;
    setOccupato(true);
    setMessaggio("");
    try {
      const modello = DEAL_TEMPLATES.find((t) => t.id === modelloId) ?? DEAL_TEMPLATES[0];
      const { deals } = generateDeals(modello.constraints, { count: 1, seed });
      if (!deals.length) {
        setMessaggio("Con questi vincoli non esce nessuna mano.");
        return;
      }
      const deal = deals[0];

      // Il contratto dal par, come al tavolo singolo: senza, il gioco carta per
      // carta non parte — è il difetto che abbiamo già trovato una volta.
      let contract = "3SA";
      let declarer: Position = "south";
      try {
        const { table, par } = await calcTableAndPar(deal, "north", "none");
        const a = parAssignmentFromContracts(par.contracts, table, deal);
        if (a) {
          contract = a.contract;
          declarer = a.declarer;
        }
      } catch (err) {
        reportError("aula:par", err);
      }

      const n = await distribuisciATutti(sessione.id, deal, {
        titolo: modello.label,
        contract,
        declarer,
      });
      setSeed((s) => s + 1);
      setMessaggio(`Mandata a ${n} ${n === 1 ? "tavolo" : "tavoli"}.`);
      await ricarica();
    } finally {
      setOccupato(false);
    }
  }

  if (caricando) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: "Le tue classi", href: "/istruttori" },
          { etichetta: "La classe", href: `/istruttori/${classId}` },
          { etichetta: "Aula" },
        ]}
      />
      <h1 className="mb-1 flex items-center gap-2 font-display text-3xl font-bold">
        <LayoutGrid className="h-6 w-6 text-primary" aria-hidden="true" />
        {t("Aula")}
      </h1>

      {!sessione ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("Apri i tavoli della lezione. Gli allievi li trovano dalla loro classe.")}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="quanti" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Quanti tavoli")}
              </label>
              <input
                id="quanti"
                type="number"
                min={1}
                max={40}
                value={quanti}
                onChange={(e) => setQuanti(Math.min(40, Math.max(1, Number(e.target.value) || 1)))}
                className="h-11 w-24 rounded-xl border border-border bg-card px-3 text-sm"
              />
            </div>
            <Button
              disabled={occupato}
              onClick={async () => {
                setOccupato(true);
                await apriAula(classId, quanti);
                await ricarica();
                setOccupato(false);
              }}
            >
              Apri l&rsquo;aula
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {tavoli.length} {tavoli.length === 1 ? "tavolo" : "tavoli"} aperti.
          </p>

          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <label htmlFor="argomento" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Argomento")}
              </label>
              <select
                id="argomento"
                value={modelloId}
                onChange={(e) => setModelloId(e.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              >
                {DEAL_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <Button disabled={occupato} onClick={() => void distribuisci()}>
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              {occupato ? t("Mando…") : t("Manda a tutti i tavoli")}
            </Button>
            <SondaggioAula classId={classId} />
            <Button
              variant="outline"
              disabled={occupato}
              onClick={async () => {
                setOccupato(true);
                await chiudiAula(sessione.id);
                await ricarica();
                setOccupato(false);
              }}
            >
              Chiudi l&rsquo;aula
            </Button>
          </div>

          {messaggio && <p className="mb-4 text-sm text-primary">{messaggio}</p>}

          <div className="grid gap-2 sm:grid-cols-2">
            {tavoli.map((t) => {
              const fermo = fermoDa(t);
              const inRitardo = fermo > 3 * 60 * 1000 && t.carte_giocate > 0;
              return (
                <Link
                  key={t.tavolo_id}
                  href={`/istruttori/tavolo?classe=${classId}`}
                  className={`rounded-xl border p-3 transition-colors hover:bg-muted/50 ${
                    inRitardo ? "border-amber-400" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-semibold">
                      Tavolo {t.numero}
                    </span>
                    {inRitardo && <Badge variant="secondary">fermo</Badge>}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t.posti_assegnati}/4 ai posti
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.carte_giocate === 0
                      ? "non ha ancora cominciato"
                      : `${t.carte_giocate} carte giocate`}
                    {inRitardo && ` · da ${Math.round(fermo / 60000)} minuti`}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <PulsanteSegnalazione zona="aula" contestoExtra={{ classId }} />
    </div>
  );
}
