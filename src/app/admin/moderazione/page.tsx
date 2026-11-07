"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/components/link";
import { Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";
import { MOTIVI, type TipoContenuto } from "@/lib/moderazione";

type Stato = "nuova" | "rimosso" | "nessuna-azione";

interface SegnalazioneContenuto {
  id: string;
  tipo: TipoContenuto;
  contenuto_id: string;
  contenitore_id: string | null;
  autore_id: string | null;
  testo: string;
  motivo: string;
  nota: string | null;
  stato: Stato;
  created_at: string;
}

const TIPI: Record<TipoContenuto, string> = {
  forum_post: "Post del forum",
  forum_commento: "Commento nel forum",
  messaggio_classe: "Messaggio nella chat di classe",
};

const TABELLE: Record<TipoContenuto, string> = {
  forum_post: "forum_posts",
  forum_commento: "forum_comments",
  messaggio_classe: "class_messages",
};

/**
 * I contenuti segnalati da chi usa il forum e la chat di classe.
 *
 * Togliere il contenuto lo cancella davvero dalla sua tabella: la copia del
 * testo resta qui, per sapere cosa era. Un post tolto si porta via i suoi
 * commenti (cascata del database).
 */
export default function ModerazionePage() {
  const t = useT();
  const [righe, setRighe] = useState<SegnalazioneContenuto[]>([]);
  const [filtro, setFiltro] = useState<Stato | "tutte">("nuova");
  const [caricando, setCaricando] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);

  const carica = useCallback(async () => {
    setCaricando(true);
    try {
      const supabase = createClient();
      let q = supabase
        .from("segnalazioni_contenuti")
        .select("id, tipo, contenuto_id, contenitore_id, autore_id, testo, motivo, nota, stato, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filtro !== "tutte") q = q.eq("stato", filtro);
      const { data, error } = await q;
      if (error) throw error;
      setRighe((data ?? []) as SegnalazioneContenuto[]);
    } catch (err) {
      segnalaSalvoRete("admin:moderazione", err);
    } finally {
      setCaricando(false);
    }
  }, [filtro]);

  useEffect(() => {
    void carica();
  }, [carica]);

  async function chiudi(s: SegnalazioneContenuto, stato: Stato) {
    setErrore(null);
    const supabase = createClient();
    if (stato === "rimosso") {
      if (!confirm(t("Togliere il contenuto? Non si può annullare."))) return;
      const { error } = await supabase.from(TABELLE[s.tipo]).delete().eq("id", s.contenuto_id);
      if (error) {
        segnalaSalvoRete("admin:moderazione:togli", error);
        setErrore(t("Il contenuto non è stato tolto."));
        return;
      }
    }
    // Tutte le segnalazioni dello stesso contenuto si chiudono insieme.
    const { error } = await supabase
      .from("segnalazioni_contenuti")
      .update({ stato, updated_at: new Date().toISOString() })
      .eq("tipo", s.tipo)
      .eq("contenuto_id", s.contenuto_id)
      .eq("stato", "nuova");
    if (error) {
      segnalaSalvoRete("admin:moderazione:stato", error);
      setErrore(t("La segnalazione non è stata aggiornata."));
    }
    await carica();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/scuola" className="text-sm text-muted-foreground hover:underline">
        ← {t("Scuola")}
      </Link>
      <h1 className="mt-3 mb-1 flex items-center gap-2 font-display text-3xl font-bold">
        <Flag className="h-6 w-6 text-primary" aria-hidden="true" />
        {t("Contenuti segnalati")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("Post, commenti e messaggi segnalati dagli utenti. Il testo è una copia fatta al momento della segnalazione.")}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["nuova", "rimosso", "nessuna-azione", "tutte"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            aria-pressed={filtro === f}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {f === "nuova" ? t("Da guardare") : f === "rimosso" ? t("Tolti") : f === "nessuna-azione" ? t("Lasciati") : t("Tutte")}
          </button>
        ))}
      </div>

      {errore && <p role="alert" className="mb-3 text-sm text-destructive">{errore}</p>}

      {caricando ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : righe.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("Nessuna segnalazione.")}</p>
      ) : (
        <ul className="space-y-3">
          {righe.map((s) => (
            <li key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={s.stato === "nuova" ? "default" : "secondary"}>{t(TIPI[s.tipo])}</Badge>
                <Badge variant="outline">{t(MOTIVI.find((m) => m.valore === s.motivo)?.etichetta ?? s.motivo)}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("it-IT")}</span>
                {s.stato === "nuova" && (
                  <span className="ml-auto flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => void chiudi(s, "nessuna-azione")}>
                      {t("Lascia")}
                    </Button>
                    <Button size="sm" onClick={() => void chiudi(s, "rimosso")}>
                      {t("Togli il contenuto")}
                    </Button>
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{s.testo}</p>
              {s.nota && (
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">{t("Nota di chi segnala:")}</span> {s.nota}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {s.tipo === "messaggio_classe" ? (
                  <Link href="/admin/classi" className="hover:underline">
                    {t("Tutte le classi")}
                  </Link>
                ) : (
                  <Link href={`/forum/${s.contenitore_id}`} className="hover:underline">
                    {t("Apri il post")}
                  </Link>
                )}
                {s.autore_id && <> · {t("Autore")}: <code>{s.autore_id}</code></>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
