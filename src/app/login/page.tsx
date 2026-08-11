"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useActiveAsdClubs } from "@/store/use-asd-store";
import Link from "next/link";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { Gamepad2, Zap, Spade, Coffee } from "lucide-react";
import { trackRegistration } from "@/lib/gads";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { createClient } from "@/lib/supabase/client";
import { BBO_USERNAME_TAKEN_MESSAGE, isBboUsernameTaken } from "@/lib/bbo-username";
import { suggestEmailCorrection } from "@/lib/email-domain-hint";
import { authErrorMessage, isAlreadyRegistered } from "@/lib/auth-errors";
import { type ReactNode } from "react";
type Mode = "login" | "signup";
type ProfileType = "junior" | "giovane" | "adulto" | "senior";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-primary/5 via-primary/3 to-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const { signIn, signUp, uploadAvatar, resetPassword } = useSharedAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bboUsername, setBboUsername] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("adulto");
  const [asdSearch, setAsdSearch] = useState("");
  const [selectedAsdCode, setSelectedAsdCode] = useState<string>("");
  const [showAsdDropdown, setShowAsdDropdown] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Indirizzo per cui l'utente ha già rifiutato il suggerimento sul dominio:
  // se conferma che è giusto non glielo si ripropone a ogni tasto premuto.
  const [emailHintDismissed, setEmailHintDismissed] = useState("");

  /**
   * Correzione proposta per un probabile refuso nel dominio dell'email.
   *
   * Solo in registrazione: in fase di accesso l'indirizzo "sbagliato" è quello
   * con cui l'account esiste davvero, e suggerire di correggerlo porterebbe
   * fuori strada. Vedi `@/lib/email-domain-hint` per il caso reale che ha
   * motivato il controllo (tre account su yahoo.it, yaoo.it e uahoo.it).
   */
  const emailSuggestion = useMemo(() => {
    if (mode !== "signup") return null;
    const trimmed = email.trim();
    if (trimmed === emailHintDismissed) return null;
    return suggestEmailCorrection(trimmed);
  }, [mode, email, emailHintDismissed]);

  // Serve solo per la RPC di verifica dell'handle BBO, che avviene PRIMA della
  // registrazione e quindi da chiamante anonimo.
  const supabase = useMemo(() => createClient(), []);

  const activeClubs = useActiveAsdClubs();
  const selectedAsdName = useMemo(
    () => activeClubs.find((c) => c.code === selectedAsdCode)?.name ?? "",
    [activeClubs, selectedAsdCode]
  );
  const filteredAsd = useMemo(() => {
    if (!asdSearch.trim()) return activeClubs.slice(0, 20);
    const q = asdSearch.toLowerCase();
    return activeClubs.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 20);
  }, [asdSearch, activeClubs]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(authErrorMessage(err.message));
        } else {
          window.location.href = redirectTo;
          return;
        }
      } else {
        if (!displayName.trim()) {
          setError("Inserisci il tuo nome");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("La password deve avere almeno 6 caratteri");
          setLoading(false);
          return;
        }

        // Il nome BBO è facoltativo: si controlla solo se è stato compilato.
        // Resta una finestra di corsa fra questo controllo e l'inserimento del
        // profilo; la garanzia forte sarà l'indice unico parziale lato database
        // (vedi scripts/sql/bbo-username-unique-2026-08.sql).
        if (await isBboUsernameTaken(supabase, bboUsername, "login:verifica-bbo")) {
          setError(BBO_USERNAME_TAKEN_MESSAGE);
          setLoading(false);
          return;
        }

        const { error: err } = await signUp({
          email,
          password,
          displayName: displayName.trim(),
          bboUsername: bboUsername.trim() || undefined,
          asdCode: selectedAsdCode || undefined,
          asdName: selectedAsdName || undefined,
          profileType,
        });

        if (err) {
          // "already_registered" e' un sentinella: la UI mostra un blocco con
          // i pulsanti "Vai al login" e "Password dimenticata?" invece di un
          // testo. Tutto il resto passa dalla traduzione, che non restituisce
          // mai il messaggio inglese grezzo di Supabase.
          setError(isAlreadyRegistered(err.message) ? "already_registered" : authErrorMessage(err.message));
        } else {
          // Conversione: registrazione completata. Due destinazioni distinte,
          // con regole di consenso diverse — vedi src/lib/gads.ts.
          trackRegistration();
          trackMetaEvent("CompleteRegistration");
          // Upload avatar if selected
          if (avatarFile) {
            await uploadAvatar(avatarFile);
          }
          // Save profile type to localStorage too
          try { localStorage.setItem("bq_profile", profileType); } catch {}
          window.location.href = redirectTo;
          return;
        }
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-primary/3 to-background flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-3">
              {(["club", "diamond", "heart", "spade"] as const).map((suit) => (
                <div
                  key={suit}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-figb to-figb-dark shadow-lg shadow-figb/20"
                >
                  <SuitSymbol suit={suit} size="md" />
                </div>
              ))}
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">Bridge LAB</h1>
          <p className="text-sm text-muted-foreground mt-1">Impara il bridge giocando</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === "login"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="la-tua@email.com"
            />
            {/* Suggerimento, mai un blocco: i domini rari e legittimi qui sono
                la norma (studi, scuole, domini personali). L'ultima parola
                resta all'utente. */}
            <AnimatePresence>
              {emailSuggestion && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-1.5 text-xs text-amber-700 dark:text-amber-300"
                >
                  Forse intendevi{" "}
                  <button
                    type="button"
                    onClick={() => setEmail(emailSuggestion)}
                    className="font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    {emailSuggestion}
                  </button>
                  ?{" "}
                  <button
                    type="button"
                    onClick={() => setEmailHintDismissed(email.trim())}
                    className="underline underline-offset-2 hover:no-underline"
                  >
                    No, è corretto
                  </button>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder={mode === "signup" ? "Minimo 6 caratteri" : "La tua password"}
            />
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={async () => {
                  if (!email.trim()) {
                    setError("Inserisci la tua email prima di richiedere il reset");
                    return;
                  }
                  setError("");
                  setLoading(true);
                  const { error: err } = await resetPassword(email.trim());
                  setLoading(false);
                  if (err) {
                    setError("Errore nell'invio dell'email di reset. Riprova.");
                  } else {
                    setSuccess("Email di reset inviata! Controlla la tua casella di posta.");
                  }
                }}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Password dimenticata?
              </button>
            </div>
          )}

          {/* Signup-only fields */}
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Nome visualizzato *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Come vuoi essere chiamato"
                  />
                </div>

                {/* BBO Username */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Username BBO <span className="text-muted-foreground/50 normal-case">(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={bboUsername}
                    onChange={(e) => setBboUsername(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Il tuo username su BridgeBase Online"
                  />
                </div>

                {/* Profile Type */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Profilo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: "junior" as ProfileType, label: "8–17 anni", icon: <Gamepad2 className="w-6 h-6 text-pink-500" />, desc: "Stile Explorer" },
                      { key: "giovane" as ProfileType, label: "18–35 anni", icon: <Zap className="w-6 h-6 text-emerald-500" />, desc: "Stile Dinamico" },
                      { key: "adulto" as ProfileType, label: "36–55 anni", icon: <Spade className="w-6 h-6 text-blue-500" />, desc: "Stile Classico" },
                      { key: "senior" as ProfileType, label: "55+ anni", icon: <Coffee className="w-6 h-6 text-amber-500" />, desc: "Stile Rilassato" },
                    ] as { key: ProfileType; label: string; icon: ReactNode; desc: string }[]).map(({ key, label, icon, desc }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setProfileType(key)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          profileType === key
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card hover:border-border"
                        }`}
                      >
                        <div className="flex justify-center">{icon}</div>
                        <span className="text-xs font-semibold text-foreground block mt-1">{label}</span>
                        <span className="text-[10px] text-muted-foreground block">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ASD Selection */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Associazione (ASD) <span className="text-muted-foreground/50 normal-case">(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={selectedAsdName || asdSearch}
                    onChange={(e) => {
                      setAsdSearch(e.target.value);
                      setSelectedAsdCode("");
                      setShowAsdDropdown(true);
                    }}
                    onFocus={() => setShowAsdDropdown(true)}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Cerca la tua associazione..."
                  />
                  {selectedAsdCode && (
                    <button
                      type="button"
                      onClick={() => { setSelectedAsdCode(""); setAsdSearch(""); }}
                      className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <AnimatePresence>
                    {showAsdDropdown && !selectedAsdCode && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 w-full mt-1 bg-popover rounded-xl border border-border shadow-xl max-h-48 overflow-y-auto scrollbar-hide"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      >
                        {filteredAsd.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-muted-foreground">Nessuna ASD trovata</div>
                        ) : (
                          filteredAsd.map((club) => (
                            <button
                              key={club.code}
                              type="button"
                              onClick={() => {
                                setSelectedAsdCode(club.code);
                                setAsdSearch("");
                                setShowAsdDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <div>{club.name}</div>
                              {club.city && (
                                <div className="text-[11px] text-muted-foreground">
                                  {club.city}{club.province ? ` (${club.province})` : ""}
                                </div>
                              )}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Foto profilo <span className="text-muted-foreground/50 normal-case">(opzionale)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element -- anteprima locale (data URL) dal file input: next/image non la ottimizza
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                        {avatarPreview ? "Cambia foto" : "Carica foto"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / Success */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 text-sm font-medium rounded-xl px-4 py-3"
            >
              {error === "already_registered" ? (
                <div className="space-y-2">
                  <p>Questa email è già registrata. Prova ad accedere.</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Vai al login
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email.trim()) return;
                        setError("");
                        setLoading(true);
                        const { error: err } = await resetPassword(email.trim());
                        setLoading(false);
                        if (err) {
                          setError("Errore nell'invio dell'email di reset. Riprova.");
                        } else {
                          setSuccess("Email di reset inviata! Controlla la tua casella di posta.");
                        }
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Password dimenticata?
                    </button>
                  </div>
                </div>
              ) : (
                error
              )}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-sm font-medium rounded-xl px-4 py-3"
            >
              {success}
            </motion.div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-figb to-figb-light text-white font-semibold text-sm shadow-lg shadow-figb/25 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Attendere...</span>
              </div>
            ) : mode === "login" ? (
              "Accedi"
            ) : (
              "Crea account"
            )}
          </Button>
        </form>

        {/* Continue without account */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              try { localStorage.setItem("bq_guest", "1"); } catch {}
              window.location.href = "/";
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continua senza account
          </button>
        </div>

        {/* Close ASD dropdown on outside click */}
        {showAsdDropdown && !selectedAsdCode && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAsdDropdown(false)}
          />
        )}
      </motion.div>
    </div>
  );
}
