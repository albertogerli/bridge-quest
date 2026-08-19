"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";

/**
 * L'ingresso in aula: un nome, e si è dentro.
 *
 * PERCHÉ UN CAMPO SOLO. La barriera numero uno del nostro pubblico non è il
 * bridge, è la registrazione: molti allievi dei corsi di primo livello non
 * completano da soli un'iscrizione a un portale, e chi ci prova lo fa mentre
 * l'insegnante aspetta e gli altri guardano. Qui si inquadra un codice, si
 * scrive il nome, si è al tavolo. Niente email, niente password, niente
 * conferma da cercare nella posta.
 *
 * IL NOME SERVE ALL'INSEGNANTE, non a noi: deve poter dire «Maria, tu a Nord».
 * Per questo è l'unica cosa che si chiede, e per questo non si può saltare.
 *
 * FUORI DALLA STRUTTURA DEL SITO. La pagina non ha menù: chi arriva qui sta per
 * cominciare una lezione, e ogni cosa cliccabile che non sia «entra» è un modo
 * di perdersi davanti a una classe che aspetta.
 */
export default function IngressoAulaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function entra() {
    setInCorso(true);
    setErrore(null);
    try {
      const risposta = await fetch("/api/aula/entra", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, nome }),
      });
      const dati = (await risposta.json()) as {
        classId?: string;
        access_token?: string;
        refresh_token?: string;
        errore?: string;
      };

      if (!risposta.ok || !dati.access_token || !dati.refresh_token || !dati.classId) {
        setErrore(dati.errore ?? "Non riesco a farti entrare.");
        setInCorso(false);
        return;
      }

      // La sessione arriva dal server già pronta: qui si installa e basta.
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: dati.access_token,
        refresh_token: dati.refresh_token,
      });
      if (error) throw error;

      router.replace(`/classi/${dati.classId}/tavolo`);
    } catch (err) {
      reportError("aula:entra", err);
      setErrore("Non riesco a farti entrare adesso. Riprova fra un attimo.");
      setInCorso(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a44e]">
          Bridge LAB
        </p>
        <h1 className="mb-1 font-display text-3xl font-bold">Benvenuto in aula</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Scrivi il tuo nome: serve al tuo insegnante per darti il posto.
        </p>

        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && nome.trim().length >= 2 && void entra()}
          placeholder="Il tuo nome"
          autoFocus
          autoComplete="given-name"
          className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />

        {errore && <p className="mb-3 text-sm text-destructive">{errore}</p>}

        <Button
          onClick={() => void entra()}
          disabled={inCorso || nome.trim().length < 2}
          className="h-12 w-full text-base"
        >
          {inCorso && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {inCorso ? "Entro…" : "Entra"}
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Non serve registrarsi. A fine lezione potrai tenere quello che hai fatto creando un
          account, se vorrai.
        </p>
      </div>
    </div>
  );
}
