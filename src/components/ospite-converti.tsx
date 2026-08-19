"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * «Tieni quello che hai fatto»: l'ospite diventa un account vero.
 *
 * NON MIGRA NIENTE, ed è il motivo per cui l'ingresso ospite è stato costruito
 * con un utente vero invece che con un gettone. È lo STESSO utente: gli si
 * aggiunge un'email e una password. Le mani giocate, i compiti, la classe, gli
 * XP restano dove sono perché non si sono mai mossi — «eredita tutta la sua
 * attività» non è una funzione da scrivere, è una conseguenza.
 *
 * MAI BLOCCANTE. Compare in fondo, si chiude, e chi la chiude continua a
 * giocare come prima. Una lezione che finisce con un modulo obbligatorio è una
 * lezione da cui la metà della classe esce prima.
 *
 * COMPARE SOLO QUANDO C'È QUALCOSA DA TENERE — a lezione finita, non appena si
 * entra: proporre un account a chi ha appena scritto il proprio nome è
 * esattamente la barriera che l'ingresso ospite serve a togliere.
 */
export function OspiteConverti() {
  const t = useT();
  const { user, profile } = useSharedAuth();
  const [aperto, setAperto] = useState(false);
  const [chiuso, setChiuso] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [fatto, setFatto] = useState(false);

  const ospite = profile?.ospite === true;

  useEffect(() => {
    if (!ospite || chiuso) return;
    // Mezz'ora dopo l'ingresso: la lezione è cominciata da un pezzo e chi è
    // rimasto ha qualcosa da tenere.
    const t = setTimeout(() => setAperto(true), 30 * 60 * 1000);
    return () => clearTimeout(t);
  }, [ospite, chiuso]);

  if (!ospite || chiuso || !user) return null;

  async function converti() {
    setInCorso(true);
    setErrore(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) throw error;
      await supabase
        .from("profiles")
        .update({ ospite: false, ospite_scade_il: null })
        .eq("id", user!.id);
      setFatto(true);
    } catch (err) {
      reportError("ospite:converti", err);
      setErrore("Non riesco a salvarlo. Forse quell'indirizzo è già usato.");
    } finally {
      setInCorso(false);
    }
  }

  if (!aperto) {
    return (
      <button
        onClick={() => setAperto(true)}
        className="fixed bottom-24 left-4 z-30 rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-semibold shadow-md backdrop-blur lg:bottom-4"
      >
        {t("Tieni quello che hai fatto")}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl sm:inset-x-auto sm:left-4 sm:w-80">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#c8a44e]" aria-hidden="true" />
        <span className="text-sm font-bold">{t("Tieni quello che hai fatto")}</span>
        <button
          onClick={() => {
            setAperto(false);
            setChiuso(true);
          }}
          aria-label={t("Chiudi")}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {fatto ? (
        <p className="py-3 text-sm text-primary">
          {t("Fatto. Da adesso entri con la tua email, e ritrovi tutto: le mani, i compiti, la classe.")}
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Sei entrato come ospite. Scegli email e password e diventa il tuo account: mani
            giocate, compiti e classe restano tutti.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="la-tua@email.com"
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("Una password")}
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {errore && <p className="mb-2 text-xs text-destructive">{errore}</p>}
          <Button
            onClick={() => void converti()}
            disabled={inCorso || !email.includes("@") || password.length < 8}
            className="w-full"
            size="sm"
          >
            {inCorso ? "Salvo…" : "Tieni tutto"}
          </Button>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {t("Puoi anche non farlo: continui a giocare fino a fine lezione.")}
          </p>
        </>
      )}
    </div>
  );
}
