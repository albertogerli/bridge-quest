"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Printer, Upload, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Briciole } from "@/components/briciole";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import {
  componiAllievi,
  ETICHETTE_CAMPO,
  leggiCsv,
  nomeCompleto,
  proponiCampo,
  type Allievo,
  type Campo,
  type FoglioLetto,
} from "@/lib/import-allievi";
import { useT } from "@/contexts/traduzioni-provider";

interface Riga {
  id: string;
  nome: string;
  presente: boolean;
  tavolo: number | null;
  posto: string | null;
}

const POSTI = ["Nord", "Est", "Sud", "Ovest"];

/**
 * L'elenco degli allievi e la formazione dei tavoli.
 *
 * ----------------------------------------------------------------------------
 * SI SALVANO SOLO I NOMI, E NON È UNA SEMPLIFICAZIONE
 * ----------------------------------------------------------------------------
 *
 * Il foglio dell'insegnante ha quasi sempre anche email e telefono, e questa
 * pagina li LEGGE — servono a far riconoscere le colonne e a far vedere
 * l'anteprima giusta — ma non li scrive da nessuna parte. Sono dati personali
 * di persone che non hanno un account e non hanno acconsentito a niente: è lo
 * stesso nodo che tiene ferma la Lezione Zero, e conservarli qui perché
 * «tanto c'erano nel file» sarebbe il modo classico di aggirare una decisione
 * invece di prenderla.
 *
 * Per l'aula il nome basta: serve a dire «Maria, tu a Nord» e a stampare il
 * tagliando. Quando la base giuridica sarà definita si aggiungono due colonne.
 *
 * ----------------------------------------------------------------------------
 * L'ASSENTE SI TOGLIE, NON SI CANCELLA
 * ----------------------------------------------------------------------------
 *
 * Chi manca resta nell'elenco con la spunta tolta: alla lezione dopo torna, e
 * ricomporre i tavoli da zero ogni settimana è il motivo per cui una funzione
 * del genere si smette di usare.
 */
export default function AllieviPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = useT();
  const { classId } = use(params);
  const [righe, setRighe] = useState<Riga[]>([]);
  const [caricando, setCaricando] = useState(true);
  const [foglio, setFoglio] = useState<FoglioLetto | null>(null);
  const [mappa, setMappa] = useState<Campo[]>([]);
  const [anteprima, setAnteprima] = useState<Allievo[]>([]);
  const [messaggio, setMessaggio] = useState("");

  const ricarica = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("elenco_allievi")
        .select("id, nome, presente, tavolo, posto")
        .eq("class_id", classId)
        .order("tavolo", { ascending: true, nullsFirst: false })
        .order("nome", { ascending: true });
      if (error) throw error;
      setRighe((data ?? []) as Riga[]);
    } catch (err) {
      reportError("allievi:elenco", err);
    } finally {
      setCaricando(false);
    }
  }, [classId]);

  useEffect(() => {
    void ricarica();
  }, [ricarica]);

  async function apriFile(file: File) {
    const testo = await file.text();
    const f = leggiCsv(testo);
    const m = f.intestazioni.map(proponiCampo);
    setFoglio(f);
    setMappa(m);
    setAnteprima(componiAllievi(f, m));
    setMessaggio("");
  }

  function aggiornaMappa(i: number, c: Campo) {
    const m = [...mappa];
    m[i] = c;
    setMappa(m);
    if (foglio) setAnteprima(componiAllievi(foglio, m));
  }

  async function conferma() {
    try {
      const supabase = createClient();
      const nuovi = anteprima
        .map((a) => nomeCompleto(a))
        .filter(Boolean)
        .map((nome) => ({ class_id: classId, nome }));
      if (nuovi.length === 0) return;
      const { error } = await supabase.from("elenco_allievi").insert(nuovi);
      if (error) throw error;
      setMessaggio(`Aggiunti ${nuovi.length} allievi.`);
      setFoglio(null);
      setAnteprima([]);
      await ricarica();
    } catch (err) {
      reportError("allievi:importa", err);
      setMessaggio("Non sono riuscito a importarli.");
    }
  }

  async function aggiorna(id: string, campi: Partial<Riga>) {
    const supabase = createClient();
    await supabase.from("elenco_allievi").update(campi).eq("id", id);
    await ricarica();
  }

  /**
   * Distribuisce i presenti sui tavoli, quattro per tavolo.
   *
   * Non mescola: rispetta l'ordine in cui sono nell'elenco, che è quello in cui
   * l'insegnante li ha messi. Chi vuole tavoli diversi cambia l'ordine o
   * sposta a mano — un sorteggio che rifà tutto a ogni clic è un sorteggio che
   * non si usa due volte.
   */
  async function componiTavoli() {
    const presenti = righe.filter((r) => r.presente);
    const supabase = createClient();
    await Promise.all(
      presenti.map((r, i) =>
        supabase
          .from("elenco_allievi")
          .update({ tavolo: Math.floor(i / 4) + 1, posto: POSTI[i % 4] })
          .eq("id", r.id),
      ),
    );
    await ricarica();
  }

  const presenti = righe.filter((r) => r.presente);
  const tavoli = [...new Set(presenti.map((r) => r.tavolo).filter((t): t is number => t !== null))];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="print:hidden">
        <Briciole
          percorso={[
            { etichetta: "Le tue classi", href: "/istruttori" },
            { etichetta: "La classe", href: `/istruttori/${classId}` },
            { etichetta: "Allievi e tavoli" },
          ]}
        />
        <h1 className="mb-1 font-display text-3xl font-bold">{t("Allievi e tavoli")}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Carica il tuo elenco da Excel — salvato come CSV — e componi i tavoli. Di ogni allievo
          conserviamo <strong>solo il nome</strong>: email e telefono restano nel tuo file.
        </p>

        {!foglio ? (
          <label className="mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 hover:bg-muted/40">
            <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm">
              <span className="font-medium">{t("Scegli un file CSV")}</span>
              <span className="block text-xs text-muted-foreground">
                {t("In Excel: File → Salva con nome → CSV. Il separatore lo riconosciamo da soli.")}
              </span>
            </span>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void apriFile(f);
              }}
            />
          </label>
        ) : (
          <div className="mb-6 rounded-xl border border-border p-4">
            <p className="mb-3 text-sm font-semibold">{t("Che cosa c’è in ogni colonna?")}</p>
            <div className="mb-4 space-y-2">
              {foglio.intestazioni.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-40 shrink-0 truncate text-sm text-muted-foreground">
                    {h || `Colonna ${i + 1}`}
                  </span>
                  <select
                    value={mappa[i]}
                    onChange={(e) => aggiornaMappa(i, e.target.value as Campo)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                  >
                    {(Object.keys(ETICHETTE_CAMPO) as Campo[]).map((c) => (
                      <option key={c} value={c}>
                        {ETICHETTE_CAMPO[c]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <p className="mb-2 text-sm font-semibold">
              Anteprima ({anteprima.length} {anteprima.length === 1 ? "allievo" : "allievi"})
            </p>
            <ul className="mb-4 max-h-40 space-y-0.5 overflow-y-auto text-sm">
              {anteprima.slice(0, 30).map((a, i) => (
                <li key={i} className="truncate">
                  {nomeCompleto(a)}
                  {(a.email || a.telefono) && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({[a.email, a.telefono].filter(Boolean).join(" · ")} — non verrà salvato)
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <Button onClick={() => void conferma()} disabled={anteprima.length === 0}>
                Importa {anteprima.length} allievi
              </Button>
              <Button variant="outline" onClick={() => setFoglio(null)}>
                {t("Annulla")}
              </Button>
            </div>
          </div>
        )}

        {messaggio && <p className="mb-4 text-sm text-primary">{messaggio}</p>}

        {righe.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void componiTavoli()}>
              Componi i tavoli ({presenti.length} presenti)
            </Button>
            <Link href={`/istruttori/${classId}/tagliandi`}>
              <Button variant="outline">
                <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t("Stampa i tagliandi")}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {caricando ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : righe.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("Nessun allievo nell’elenco. Carica il tuo file.")}
        </p>
      ) : tavoli.length > 0 ? (
        <div className="space-y-4">
          {tavoli.map((t) => (
            <div key={t} className="rounded-xl border border-border p-3">
              <p className="mb-2 text-sm font-bold">Tavolo {t}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {presenti
                  .filter((r) => r.tavolo === t)
                  .map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <span className="w-14 shrink-0 text-xs text-muted-foreground">{r.posto}</span>
                      <span className="min-w-0 flex-1 truncate">{r.nome}</span>
                      <button
                        onClick={() => void aggiorna(r.id, { presente: false, tavolo: null, posto: null })}
                        aria-label={`Segna ${r.nome} assente`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {righe.some((r) => !r.presente) && (
            <div className="rounded-xl border border-dashed border-border p-3">
              <p className="mb-2 text-sm font-semibold text-muted-foreground">{t("Assenti")}</p>
              <div className="flex flex-wrap gap-1.5">
                {righe
                  .filter((r) => !r.presente)
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => void aggiorna(r.id, { presente: true })}
                      className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm hover:bg-muted/70"
                    >
                      <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                      {r.nome}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {righe.map((r) => (
            <div key={r.id} className="flex items-center gap-2 px-4 py-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={r.presente}
                onChange={(e) => void aggiorna(r.id, { presente: e.target.checked })}
              />
              <span className="min-w-0 flex-1 truncate">{r.nome}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
