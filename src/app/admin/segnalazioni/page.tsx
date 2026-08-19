"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bug, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

type Stato = "nuova" | "presa-in-carico" | "risolta" | "archiviata";

interface Segnalazione {
  id: string;
  user_id: string | null;
  testo: string;
  contesto: Record<string, unknown> | null;
  screenshot_path: string | null;
  stato: Stato;
  nota_admin: string | null;
  created_at: string;
}

const ETICHETTE: Record<Stato, string> = {
  nuova: "Nuova",
  "presa-in-carico": "In carico",
  risolta: "Risolta",
  archiviata: "Archiviata",
};

/**
 * Le segnalazioni arrivate, con il loro contesto.
 *
 * L'ELENCO PARTE DALLE NUOVE, ed è il filtro predefinito: una coda che mostra
 * anche le risolte si riempie e smette di essere guardata.
 *
 * LO SCREENSHOT NON HA UN INDIRIZZO PUBBLICO. Il bucket è privato: qui si
 * chiede un indirizzo firmato al momento, valido un'ora. Un collegamento
 * permanente a una fotografia dello schermo di qualcun altro è una cosa che poi
 * gira, e non c'è motivo di crearla.
 */
export default function SegnalazioniPage() {
  const t = useT();
  const [righe, setRighe] = useState<Segnalazione[]>([]);
  const [filtro, setFiltro] = useState<Stato | "tutte">("nuova");
  const [caricando, setCaricando] = useState(true);
  const [immagini, setImmagini] = useState<Record<string, string>>({});

  const carica = useCallback(async () => {
    setCaricando(true);
    try {
      const supabase = createClient();
      let q = supabase
        .from("segnalazioni")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filtro !== "tutte") q = q.eq("stato", filtro);
      const { data, error } = await q;
      if (error) throw error;
      setRighe((data ?? []) as Segnalazione[]);
    } catch (err) {
      reportError("admin:segnalazioni", err);
    } finally {
      setCaricando(false);
    }
  }, [filtro]);

  useEffect(() => {
    void carica();
  }, [carica]);

  async function cambiaStato(id: string, stato: Stato) {
    const supabase = createClient();
    const { error } = await supabase
      .from("segnalazioni")
      .update({ stato, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) reportError("admin:segnalazioni:stato", error);
    else await carica();
  }

  async function mostraFoto(s: Segnalazione) {
    if (!s.screenshot_path || immagini[s.id]) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("segnalazioni")
      .createSignedUrl(s.screenshot_path, 3600);
    if (error) reportError("admin:segnalazioni:foto", error);
    else if (data) setImmagini((p) => ({ ...p, [s.id]: data.signedUrl }));
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Amministrazione
      </Link>
      <h1 className="mt-3 mb-1 flex items-center gap-2 font-display text-3xl font-bold">
        <Bug className="h-6 w-6 text-primary" aria-hidden="true" />
        {t("Segnalazioni")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("Ognuna porta con sé pagina, mano, browser ed errori: non serve richiamare chi l’ha mandata.")}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["nuova", "presa-in-carico", "risolta", "tutte"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            aria-pressed={filtro === f}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {f === "tutte" ? "Tutte" : ETICHETTE[f]}
          </button>
        ))}
      </div>

      {caricando ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : righe.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Niente qui. {filtro === "nuova" && "Nessuna segnalazione da guardare."}
        </p>
      ) : (
        <ul className="space-y-3">
          {righe.map((s) => (
            <li key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={s.stato === "nuova" ? "default" : "secondary"}>
                  {ETICHETTE[s.stato]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleString("it-IT")}
                </span>
                <span className="ml-auto flex gap-1.5">
                  {s.stato !== "presa-in-carico" && (
                    <Button size="sm" variant="outline" onClick={() => void cambiaStato(s.id, "presa-in-carico")}>
                      {t("Prendo in carico")}
                    </Button>
                  )}
                  {s.stato !== "risolta" && (
                    <Button size="sm" variant="outline" onClick={() => void cambiaStato(s.id, "risolta")}>
                      {t("Risolta")}
                    </Button>
                  )}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm">{s.testo}</p>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                  {t("Contesto")}
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-muted p-3 text-[12px] leading-relaxed">
                  {JSON.stringify(s.contesto, null, 2)}
                </pre>
              </details>

              {s.screenshot_path && (
                <div className="mt-3">
                  {immagini[s.id] ? (
                    <a href={immagini[s.id]} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- indirizzo firmato che scade: l'ottimizzatore di Next lo metterebbe in cache oltre la sua validità */}
                      <img
                        src={immagini[s.id]}
                        alt={t("Schermo al momento della segnalazione")}
                        className="max-h-96 rounded-lg border border-border"
                      />
                    </a>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => void mostraFoto(s)}>
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      {t("Vedi la foto dello schermo")}
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
