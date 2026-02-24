"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ASD_LIST } from "@/data/asd-list";
import Link from "next/link";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { Gamepad2, Zap, Spade, Coffee } from "lucide-react";
import { type ReactNode } from "react";
type Mode = "login" | "signup";
type ProfileType = "junior" | "giovane" | "adulto" | "senior";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#003DA5]/5 via-[#003DA5]/3 to-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { signIn, signUp, uploadAvatar } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
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
  const [selectedAsd, setSelectedAsd] = useState<string>("");
  const [showAsdDropdown, setShowAsdDropdown] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const filteredAsd = useMemo(() => {
    if (!asdSearch.trim()) return ASD_LIST.slice(0, 20);
    const q = asdSearch.toLowerCase();
    return ASD_LIST.filter((a) => a.toLowerCase().includes(q)).slice(0, 20);
  }, [asdSearch]);

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
          setError(err.message === "Invalid login credentials"
            ? "Email o password errati"
            : err.message);
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

        // Find ASD id
        const asdIndex = selectedAsd
          ? ASD_LIST.indexOf(selectedAsd as typeof ASD_LIST[number])
          : -1;

        const { error: err } = await signUp({
          email,
          password,
          displayName: displayName.trim(),
          bboUsername: bboUsername.trim() || undefined,
          asdId: asdIndex >= 0 ? asdIndex + 1 : undefined,
          profileType,
        });

        if (err) {
          if (err.message.toLowerCase().includes("rate limit")) {
            setError("Troppe richieste. Attendi qualche minuto e riprova.");
          } else if (err.message.includes("already registered")) {
            setError("Questa email e gia registrata. Prova ad accedere.");
          } else {
            setError(err.message);
          }
        } else {
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
    <div className="min-h-screen bg-gradient-to-b from-[#003DA5]/5 via-[#003DA5]/3 to-white flex items-center justify-center px-4 py-8">
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#003DA5] to-[#002E7A] shadow-lg shadow-[#003DA5]/20"
                >
                  <SuitSymbol suit={suit} size="md" />
                </div>
              ))}
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Bridge LAB</h1>
          <p className="text-sm text-gray-500 mt-1">Impara il bridge giocando</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent transition-all"
              placeholder="la-tua@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent transition-all"
              placeholder={mode === "signup" ? "Minimo 6 caratteri" : "La tua password"}
            />
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {/* TODO: implement password reset */}}
                className="text-xs font-semibold text-[#003DA5] hover:text-[#003DA5]/80 transition-colors"
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
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Nome visualizzato *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent transition-all"
                    placeholder="Come vuoi essere chiamato"
                  />
                </div>

                {/* BBO Username */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Username BBO <span className="text-gray-300 normal-case">(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={bboUsername}
                    onChange={(e) => setBboUsername(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent transition-all"
                    placeholder="Il tuo username su BridgeBase Online"
                  />
                </div>

                {/* Profile Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Profilo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: "junior" as ProfileType, label: "Explorer", icon: <Gamepad2 className="w-6 h-6 text-pink-500" />, desc: "8–17 anni" },
                      { key: "giovane" as ProfileType, label: "Dinamico", icon: <Zap className="w-6 h-6 text-emerald-500" />, desc: "18–35 anni" },
                      { key: "adulto" as ProfileType, label: "Classico", icon: <Spade className="w-6 h-6 text-blue-500" />, desc: "36–55 anni" },
                      { key: "senior" as ProfileType, label: "Rilassato", icon: <Coffee className="w-6 h-6 text-amber-500" />, desc: "55+ anni" },
                    ] as { key: ProfileType; label: string; icon: ReactNode; desc: string }[]).map(({ key, label, icon, desc }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setProfileType(key)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          profileType === key
                            ? "border-[#003DA5] bg-[#003DA5]/8"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <div className="flex justify-center">{icon}</div>
                        <span className="text-xs font-semibold text-gray-900 block mt-1">{label}</span>
                        <span className="text-[10px] text-gray-400 block">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ASD Selection */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Associazione (ASD) <span className="text-gray-300 normal-case">(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={selectedAsd || asdSearch}
                    onChange={(e) => {
                      setAsdSearch(e.target.value);
                      setSelectedAsd("");
                      setShowAsdDropdown(true);
                    }}
                    onFocus={() => setShowAsdDropdown(true)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent transition-all"
                    placeholder="Cerca la tua associazione..."
                  />
                  {selectedAsd && (
                    <button
                      type="button"
                      onClick={() => { setSelectedAsd(""); setAsdSearch(""); }}
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <AnimatePresence>
                    {showAsdDropdown && !selectedAsd && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto"
                      >
                        {filteredAsd.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-400">Nessuna ASD trovata</div>
                        ) : (
                          filteredAsd.map((asd) => (
                            <button
                              key={asd}
                              type="button"
                              onClick={() => {
                                setSelectedAsd(asd);
                                setAsdSearch("");
                                setShowAsdDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#003DA5]/8 hover:text-[#003DA5] transition-colors"
                            >
                              {asd}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Foto profilo <span className="text-gray-300 normal-case">(opzionale)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-sm font-semibold text-[#003DA5] hover:text-[#003DA5]/80 transition-colors">
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
              className="bg-red-50 text-red-600 text-sm font-medium rounded-xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-700 text-sm font-medium rounded-xl px-4 py-3"
            >
              {success}
            </motion.div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#003DA5] text-white font-semibold text-sm shadow-lg shadow-[#003DA5]/20 hover:shadow-xl transition-all disabled:opacity-50"
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
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Continua senza account
          </Link>
        </div>

        {/* Close ASD dropdown on outside click */}
        {showAsdDropdown && !selectedAsd && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAsdDropdown(false)}
          />
        )}
      </motion.div>
    </div>
  );
}
