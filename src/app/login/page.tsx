"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ASD_LIST } from "@/data/asd-list";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";
type ProfileType = "giovane" | "adulto" | "senior";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
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
          router.push("/");
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
          setError(err.message);
        } else {
          setSuccess("Registrazione completata! Controlla la tua email per confermare l'account.");
        }
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-3xl font-black shadow-lg shadow-emerald-500/30 mb-3">
              B
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">BridgeQuest</h1>
          <p className="text-sm text-gray-500 mt-1">Impara il bridge giocando</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
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
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="la-tua@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder={mode === "signup" ? "Minimo 6 caratteri" : "La tua password"}
            />
          </div>

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
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Nome visualizzato *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Come vuoi essere chiamato"
                  />
                </div>

                {/* BBO Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Username BBO <span className="text-gray-300 normal-case">(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={bboUsername}
                    onChange={(e) => setBboUsername(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Il tuo username su BridgeBase Online"
                  />
                </div>

                {/* Profile Type */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    Profilo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: "giovane" as ProfileType, label: "Giovane", emoji: "🎮", desc: "< 26 anni" },
                      { key: "adulto" as ProfileType, label: "Adulto", emoji: "🃏", desc: "26-64 anni" },
                      { key: "senior" as ProfileType, label: "Senior", emoji: "🏆", desc: "65+ anni" },
                    ]).map(({ key, label, emoji, desc }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setProfileType(key)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          profileType === key
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <span className="text-2xl block">{emoji}</span>
                        <span className="text-xs font-bold text-gray-900 block mt-1">{label}</span>
                        <span className="text-[10px] text-gray-400 block">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ASD Selection */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
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
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
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
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
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
                      <span className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
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
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all disabled:opacity-50"
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
