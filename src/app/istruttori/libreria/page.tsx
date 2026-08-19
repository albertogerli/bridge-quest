"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Download, Library, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briciole } from "@/components/briciole";
import { useCatalog } from "@/store/use-catalog-store";
import {
  cerca,
  daModerare,
  decidi,
  ETICHETTE_TIPO,
  importa,
  mieVoci,
  type TipoVoce,
  type VoceLibreria,
} from "@/lib/libreria";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * La libreria federale.
 *
 * TRE SCHEDE E NON TRE PAGINE: cercare, quello che ho pubblicato io, e — per
 * chi cura — quello che aspetta un giudizio. Sono tre momenti dello stesso
 * lavoro, e separarli in pagine diverse vorrebbe dire che la moderazione la
 * fanno solo quelli che si ricordano l'indirizzo.
 *
 * L'ORDINE È PER UTILIZZI. Quello che gli altri hanno già usato è la
 * raccomandazione più onesta che si possa dare a un insegnante alla prima
 * lezione: non è un giudizio nostro, è cosa ha funzionato.
 */
export default function LibreriaPage() {
  const t = useT();
  const { courses } = useCatalog();
  const [scheda, setScheda] = useState<"cerca" | "mie" | "modera">("cerca");
  const [voci, setVoci] = useState<VoceLibreria[]>([]);
  const [testo, setTesto] = useState("");
  const [lezione, setLezione] = useState<number | "">("");
  const [tipo, setTipo] = useState<TipoVoce | "">("");
  const [curatore, setCuratore] = useState(false);
  const [caricando, setCaricando] = useState(true);
  const [importati, setImportati] = useState<Set<string>>(new Set());

  useEffect(() => {
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setCuratore(data?.role === "curatore" || data?.role === "admin");
      } catch (err) {
        reportError("libreria:ruolo", err);
      }
    })();
  }, []);

  const ricarica = useCallback(async () => {
    setCaricando(true);
    try {
      if (scheda === "cerca") {
        setVoci(await cerca({ testo, lessonId: lezione === "" ? null : lezione, tipo: tipo || null }));
      } else if (scheda === "mie") {
        setVoci(await mieVoci());
      } else {
        setVoci(await daModerare());
      }
    } finally {
      setCaricando(false);
    }
  }, [scheda, testo, lezione, tipo]);

  useEffect(() => {
    void ricarica();
  }, [ricarica]);

  const lezioni = courses.flatMap((c) => c.lessons.map((l) => ({ id: l.id, titolo: l.title })));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[{ etichetta: "Le tue classi", href: "/istruttori" }, { etichetta: "Libreria" }]}
      />
      <h1 className="mb-1 flex items-center gap-2 font-display text-3xl font-bold">
        <Library className="h-6 w-6 text-primary" aria-hidden="true" />
        {t("Libreria")}
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {t("Materiale preparato da altri insegnanti. Quello che importi diventa tuo: puoi cambiarlo senza toccare l’originale, e l’originale non cambia sotto le tue mani.")}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {([["cerca", "Cerca"], ["mie", "Le mie"], ...(curatore ? [["modera", "Da approvare"] as const] : [])] as const).map(
          ([k, etichetta]) => (
            <button
              key={k}
              onClick={() => setScheda(k)}
              aria-pressed={scheda === k}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                scheda === k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
              }`}
            >
              {etichetta}
            </button>
          ),
        )}
      </div>

      {scheda === "cerca" && (
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder={t("Cerca per titolo")}
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={lezione}
            onChange={(e) => setLezione(e.target.value === "" ? "" : Number(e.target.value))}
            aria-label={t("Lezione")}
            className="h-10 rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value="">{t("Tutte le lezioni")}</option>
            {lezioni.map((l) => (
              <option key={l.id} value={l.id}>
                {l.titolo}
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoVoce | "")}
            aria-label={t("Tipo")}
            className="h-10 rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value="">{t("Tutti i tipi")}</option>
            {(Object.keys(ETICHETTE_TIPO) as TipoVoce[]).map((t) => (
              <option key={t} value={t}>
                {ETICHETTE_TIPO[t]}
              </option>
            ))}
          </select>
        </div>
      )}

      {caricando ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : voci.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {scheda === "cerca"
            ? "Niente per questi filtri. La libreria è giovane."
            : scheda === "mie"
              ? "Non hai ancora pubblicato niente."
              : "Nessuna proposta da guardare."}
        </p>
      ) : (
        <ul className="space-y-3">
          {voci.map((v) => (
            <li key={v.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-display text-base font-semibold">{v.titolo}</span>
                <Badge variant="secondary">{ETICHETTE_TIPO[v.tipo]}</Badge>
                {v.stato !== "approvato" && (
                  <Badge variant={v.stato === "rifiutato" ? "destructive" : "outline"}>
                    {v.stato === "in-attesa" ? t("In attesa") : t("Non approvato")}
                  </Badge>
                )}
              </div>
              {v.descrizione && (
                <p className="mb-2 text-sm text-muted-foreground">{v.descrizione}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {v.usi} {v.usi === 1 ? "utilizzo" : "utilizzi"}
                {v.lesson_id !== null && ` · lezione ${v.lesson_id}`}
              </p>

              {v.nota_curatore && (
                <p className="mt-2 rounded-lg bg-muted p-2 text-xs">{v.nota_curatore}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {scheda === "cerca" && v.tipo === "modello" && (
                  <Button
                    size="sm"
                    variant={importati.has(v.id) ? "outline" : "default"}
                    disabled={importati.has(v.id)}
                    onClick={async () => {
                      if (await importa(v)) {
                        setImportati((p) => new Set(p).add(v.id));
                      }
                    }}
                  >
                    {importati.has(v.id) ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" /> {t("Nella tua area")}
                      </>
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> {t("Importa")}
                      </>
                    )}
                  </Button>
                )}
                {scheda === "modera" && (
                  <>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await decidi(v.id, "approvato");
                        await ricarica();
                      }}
                    >
                      {t("Approva")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await decidi(v.id, "rifiutato", "Non adatto alla libreria federale.");
                        await ricarica();
                      }}
                    >
                      {t("Non approvare")}
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
