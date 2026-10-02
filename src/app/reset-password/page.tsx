"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/hooks/use-router-lingua";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "@/components/link";
import { authErrorMessage } from "@/lib/auth-errors";
import { useT } from "@/contexts/traduzioni-provider";
import { segnalaSalvoRete } from "@/lib/report-error";
import { AvvisoPassword } from "@/components/avviso-password";

/**
 * Una sola installazione per caricamento di pagina. In sviluppo React esegue
 * gli effetti due volte: la prima consumava il frammento salvato, la seconda
 * non trovava più niente e dichiarava il link non valido.
 */
let installazione: Promise<"pronto" | "link-non-valido"> | null = null;

function installaSessioneDelLink(supabase: ReturnType<typeof createClient>) {
  installazione ??= (async () => {
    // Il frammento lo mette da parte /auth/callback (vedi lì il perché); in
    // ripiego si guarda anche l'indirizzo, se ci si arriva direttamente.
    let salvato = "";
    try {
      salvato = sessionStorage.getItem("bq_recupero") ?? "";
      sessionStorage.removeItem("bq_recupero");
    } catch {}
    const frammento = new URLSearchParams(salvato || window.location.hash.replace(/^#/, ""));
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    if (frammento.get("error_code") || frammento.get("error")) return "link-non-valido" as const;
    const accessToken = frammento.get("access_token");
    const refreshToken = frammento.get("refresh_token");
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) {
        segnalaSalvoRete("reset-password:sessione", error);
        return "link-non-valido" as const;
      }
    }
    const { data } = await supabase.auth.getSession();
    return data.session ? ("pronto" as const) : ("link-non-valido" as const);
  })();
  return installazione;
}

export default function ResetPasswordPage() {
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  /**
   * Prima di mostrare il modulo si controlla di avere una sessione.
   *
   * Il link di recupero arriva in flusso implicito (vedi `resetPassword` in
   * use-auth): la sessione sta nel frammento `#access_token=…&refresh_token=…`
   * e va installata qui. Se il link è scaduto o già usato, nel frammento c'è
   * `error_code`; se non c'è niente, il modulo fallirebbe al salvataggio con un
   * errore incomprensibile, quindi si dice subito cosa fare.
   */
  const [stato, setStato] = useState<"verifica" | "pronto" | "link-non-valido">("verifica");
  useEffect(() => {
    let attivo = true;
    void installaSessioneDelLink(supabase).then((esito) => {
      if (attivo) setStato(esito);
    });
    return () => {
      attivo = false;
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      // Prima mostrava "Riprova" per ogni errore: con la protezione contro le
      // password compromesse (attiva dall'11/08/2026) quel consiglio invitava
      // a ripetere una cosa destinata a fallire sempre.
      setError(authErrorMessage(updateError.message));
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/"), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-primary/3 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t("Nuova Password")}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {t("Inserisci la tua nuova password")}
            </p>
          </div>

          {stato === "verifica" ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
            </div>
          ) : stato === "link-non-valido" ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-foreground">
                {t("Il link non è più valido: è scaduto o è già stato usato. Chiedine uno nuovo dalla pagina di accesso, con «Password dimenticata?».")}
              </p>
              <Link href="/login" className="inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                {t("Chiedi un nuovo link")}
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-green-700 font-semibold">
                {t("Password aggiornata con successo!")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("Reindirizzamento in corso...")}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  {t("Nuova password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 pr-12 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder={t("Almeno 6 caratteri")}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <AvvisoPassword password={password} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  {t("Conferma password")}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={t("Ripeti la password")}
                  required
                />
              </div>

              {error && (
                <p className="text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 text-sm p-3 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full h-12 bg-gradient-to-r from-figb to-figb-light hover:shadow-lg text-white font-semibold rounded-xl active:scale-[0.98] transition-all"
              >
                {loading ? "Aggiornamento..." : "Aggiorna Password"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("Torna al login")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
