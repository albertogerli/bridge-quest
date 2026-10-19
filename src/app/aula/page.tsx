"use client";

import { useState } from "react";
import { useRouter } from "@/hooks/use-router-lingua";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * L'ingresso in aula con il codice di sei cifre.
 *
 * Per chi non sa inquadrare il QR, o non ha un'app per farlo (Trevissoi,
 * feedback 5): l'insegnante scrive il codice alla lavagna, l'allievo lo scrive
 * qui e arriva alla stessa pagina del QR, dove mette il nome.
 *
 * Come la pagina del link, niente menù: chi è qui sta entrando in una lezione.
 */
export default function CodiceAulaPage() {
  const t = useT();
  const router = useRouter();
  const [codice, setCodice] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const cerca = async () => {
    const cifre = codice.replace(/\D/g, "");
    if (cifre.length !== 6) {
      setErrore(t("Il codice ha sei cifre."));
      return;
    }
    setInCorso(true);
    setErrore(null);
    try {
      const r = await fetch(`/api/aula/codice?c=${cifre}`);
      const dati = (await r.json().catch(() => ({}))) as { token?: string; errore?: string };
      if (r.ok && dati.token) {
        router.push(`/aula/${dati.token}`);
        return;
      }
      setErrore(dati.errore ? t(dati.errore) : t("Non riesco a controllare il codice adesso."));
    } catch {
      setErrore(t("Non riesco a controllare il codice adesso."));
    }
    setInCorso(false);
  };

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="mb-2 text-center font-display text-2xl font-bold">{t("Entra in aula")}</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t("Scrivi il codice di sei cifre che ti ha dato l'insegnante.")}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void cerca();
        }}
        className="space-y-3"
      >
        <label htmlFor="codice-aula" className="sr-only">{t("Codice dell'aula")}</label>
        <input
          id="codice-aula"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          value={codice}
          onChange={(e) => setCodice(e.target.value.replace(/[^\d ]/g, ""))}
          placeholder="123456"
          className="h-16 w-full rounded-xl border border-border bg-card text-center font-mono text-3xl tracking-[0.3em]"
        />
        {errore && <p className="text-center text-sm text-destructive" role="alert">{errore}</p>}
        <Button type="submit" className="h-12 w-full text-base" disabled={inCorso}>
          {inCorso ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : t("Entra")}
        </Button>
      </form>
    </main>
  );
}
