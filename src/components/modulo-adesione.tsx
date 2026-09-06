"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";

/**
 * «Vengo» — l'adesione dalla pagina dell'evento.
 *
 * NON CHIEDE DI REGISTRARSI. È il punto di tutto il lotto: chi ha inquadrato un
 * cartello in una sala d'attesa ha due minuti e non ha un account. Un nome, un
 * recapito, invio. L'account arriva dopo, se e quando serve.
 *
 * «TELEFONO O EMAIL» E NON «CONTATTO». Chi ha sessant'anni e legge «contatto»
 * si ferma a chiedersi cosa vogliamo. La domanda va fatta con le parole che
 * userebbe la persona, e l'esempio mostra tutti e due i modi — al Sud il
 * telefono è più probabile dell'email.
 *
 * DOPO L'INVIO NON SI RIMANDA DA NESSUNA PARTE. Chi ha aderito ha finito: una
 * schermata che subito dopo propone di registrarsi trasformerebbe un gesto
 * concluso in un primo passo di qualcos'altro, che è esattamente quello che
 * abbiamo tolto dalla porta d'ingresso.
 */
export function ModuloAdesione({ codice }: { codice: string }) {
  const [nome, setNome] = useState("");
  const [contatto, setContatto] = useState("");
  const [note, setNote] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [fatto, setFatto] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    setInCorso(true);
    setErrore(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("adesione_invia", {
        p_codice: codice,
        p_nome: nome,
        p_contatto: contatto,
        p_note: note || null,
      });
      if (error) throw error;
      const esito = (data as { esito: string })?.esito;
      if (esito === "ricevuta") setFatto(true);
      else if (esito === "evento-chiuso") setErrore("Le iscrizioni a questa serata si sono chiuse.");
      else setErrore("Controlla il nome e il recapito.");
    } catch (err) {
      reportError("adesione:invia", err);
      setErrore("Non sono riuscito a registrare la tua adesione. Riprova fra poco.");
    } finally {
      setInCorso(false);
    }
  }

  if (fatto) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-lg font-bold">Ci vediamo lì.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Abbiamo avvisato chi organizza. Se qualcosa cambia ti contattano.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={invia} className="space-y-3 rounded-xl border border-border bg-card p-5">
      <p className="font-semibold">Vuoi venire? Lascia i tuoi dati</p>
      <div>
        <label htmlFor="ad-nome" className="text-sm">Come ti chiami</label>
        <input
          id="ad-nome" required value={nome} onChange={(e) => setNome(e.target.value)}
          autoComplete="name"
          className="mt-1 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base"
        />
      </div>
      <div>
        <label htmlFor="ad-contatto" className="text-sm">Telefono o email</label>
        <input
          id="ad-contatto" required value={contatto} onChange={(e) => setContatto(e.target.value)}
          placeholder="080 1234567 oppure maria@esempio.it"
          className="mt-1 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Serve solo per avvisarti se la serata si sposta.
        </p>
      </div>
      <div>
        <label htmlFor="ad-note" className="text-sm">Vuoi dirci qualcosa? (facoltativo)</label>
        <input
          id="ad-note" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Vengo con mia moglie, preferirei il primo turno…"
          className="mt-1 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base"
        />
      </div>
      {errore && <p className="text-sm text-destructive">{errore}</p>}
      <button
        type="submit" disabled={inCorso}
        className="flex min-h-14 w-full items-center justify-center rounded-xl bg-[#003DA5] px-6 text-lg font-bold text-white disabled:opacity-60"
      >
        {inCorso ? "Un momento…" : "Vengo"}
      </button>
    </form>
  );
}
