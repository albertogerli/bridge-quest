"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import {
  type AILevel,
  AI_LEVEL_LABELS,
  AI_LEVEL_DESCRIPTIONS,
  getAILevel,
  setAILevel as saveAILevel,
} from "@/lib/ai-difficulty";

const AI_LEVELS: AILevel[] = ["base", "intermedio", "esperto"];

const AI_LEVEL_ICONS: Record<AILevel, string> = {
  base: "🟡",
  intermedio: "🔵",
  esperto: "🟢",
};

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: string }[] = [
  { key: "light", label: "Chiaro", icon: "☀️" },
  { key: "dark", label: "Scuro", icon: "🌙" },
  { key: "system", label: "Sistema", icon: "💻" },
];

const TEXT_SIZES = [
  { key: "piccolo", label: "Piccolo", icon: "A", sizeClass: "text-sm" },
  { key: "medio", label: "Medio", icon: "A", sizeClass: "text-base" },
  { key: "grande", label: "Grande", icon: "A", sizeClass: "text-lg" },
] as const;

const ANIM_SPEEDS = [
  { key: "veloce", label: "Veloce", icon: "⚡" },
  { key: "normale", label: "Normale", icon: "▶" },
  { key: "lento", label: "Lento", icon: "🐢" },
] as const;

const PROFILES = [
  {
    key: "junior",
    label: "Explorer",
    description: "Super divertente! Animazioni pazze, tanti premi",
    color: "bg-pink-500",
  },
  {
    key: "giovane",
    label: "Dinamico",
    description: "Gamification completa, animazioni vivaci, sfide intense",
    color: "bg-[#003DA5]",
  },
  {
    key: "adulto",
    label: "Classico",
    description: "Esperienza bilanciata, focus sull'apprendimento",
    color: "bg-blue-500",
  },
  {
    key: "senior",
    label: "Rilassato",
    description: "Testo grande, ritmo calmo, interfaccia semplificata",
    color: "bg-amber-500",
  },
] as const;

const BQ_KEYS_PREFIX = "bq_";

const APP_VERSION = "1.0.0";

export default function ImpostazioniPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const notifications = useNotifications();
  const { theme, setTheme } = useTheme();
  const [textSize, setTextSize] = useState("medio");
  const [animSpeed, setAnimSpeed] = useState("normale");
  const [sound, setSound] = useState(true);
  const [profile, setProfile] = useState("adulto");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [aiLevel, setAiLevel] = useState<AILevel>("intermedio");

  useEffect(() => {
    setTextSize(localStorage.getItem("bq_text_size") || "medio");
    setAnimSpeed(localStorage.getItem("bq_anim_speed") || "normale");
    setSound(localStorage.getItem("bq_sound") !== "off");
    setProfile(localStorage.getItem("bq_profile") || "adulto");
    setAiLevel(getAILevel());
    setMounted(true);
  }, []);

  const updateTextSize = useCallback((value: string) => {
    setTextSize(value);
    localStorage.setItem("bq_text_size", value);
  }, []);

  const updateAnimSpeed = useCallback((value: string) => {
    setAnimSpeed(value);
    localStorage.setItem("bq_anim_speed", value);
  }, []);

  const toggleSound = useCallback(() => {
    setSound((prev) => {
      const next = !prev;
      localStorage.setItem("bq_sound", next ? "on" : "off");
      return next;
    });
  }, []);

  const updateProfile = useCallback((value: string) => {
    setProfile(value);
    localStorage.setItem("bq_profile", value);
  }, []);

  const updateAiLevel = useCallback((value: AILevel) => {
    setAiLevel(value);
    saveAILevel(value);
  }, []);

  const resetProgress = useCallback(() => {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(BQ_KEYS_PREFIX)
    );
    keys.forEach((k) => localStorage.removeItem(k));
    setTextSize("medio");
    setAnimSpeed("normale");
    setSound(true);
    setProfile("adulto");
    setAiLevel("intermedio");
    setShowResetConfirm(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  }, []);

  const handleLogout = useCallback(async (clearData: boolean) => {
    setLoggingOut(true);
    try {
      if (clearData) {
        const keys = Object.keys(localStorage).filter((k) =>
          k.startsWith(BQ_KEYS_PREFIX)
        );
        keys.forEach((k) => localStorage.removeItem(k));
      }
      // Always clear guest flag so landing page shows
      try { localStorage.removeItem("bq_guest"); } catch {}
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  }, [signOut, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0f1219] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0f1219]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#002E7A] via-[#003DA5] to-[#0052CC] px-4 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-sm font-medium">Indietro</span>
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            Impostazioni
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-white/80 mt-1 text-sm"
          >
            Personalizza la tua esperienza Bridge LAB
          </motion.p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-24 space-y-4">
        {/* Text Size */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#003DA5]/8 flex items-center justify-center">
              <span className="text-[#003DA5] font-bold text-lg">Aa</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Dimensione Testo</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Regola la grandezza dei caratteri</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TEXT_SIZES.map((size) => (
              <button
                key={size.key}
                onClick={() => updateTextSize(size.key)}
                className={`relative rounded-xl py-3 px-2 font-semibold transition-all duration-200 border-2 ${
                  textSize === size.key
                    ? "border-[#003DA5] bg-[#003DA5]/8 text-[#003DA5] shadow-sm"
                    : "border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className={size.sizeClass}>{size.icon}</span>
                <div className="text-xs mt-1">{size.label}</div>
                {textSize === size.key && (
                  <motion.div
                    layoutId="textSizeIndicator"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#003DA5] rounded-full flex items-center justify-center"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Animation Speed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <span className="text-purple-600 text-xl">✦</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Velocità Animazioni</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Controlla la rapidità delle transizioni</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ANIM_SPEEDS.map((speed) => (
              <button
                key={speed.key}
                onClick={() => updateAnimSpeed(speed.key)}
                className={`relative rounded-xl py-3 px-2 font-semibold transition-all duration-200 border-2 ${
                  animSpeed === speed.key
                    ? "border-[#003DA5] bg-[#003DA5]/8 text-[#003DA5] shadow-sm"
                    : "border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-lg">{speed.icon}</span>
                <div className="text-xs mt-1">{speed.label}</div>
                {animSpeed === speed.key && (
                  <motion.div
                    layoutId="animSpeedIndicator"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#003DA5] rounded-full flex items-center justify-center"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sound Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <span className="text-amber-600 text-xl">{sound ? "🔊" : "🔇"}</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Suoni</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Effetti sonori e feedback audio</p>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                sound ? "bg-[#003DA5]" : "bg-gray-300"
              }`}
            >
              <motion.div
                animate={{ x: sound ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
              />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge
              variant={sound ? "default" : "secondary"}
              className={`text-xs ${
                sound
                  ? "bg-[#003DA5]/15 text-[#003DA5] hover:bg-[#003DA5]/15"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {sound ? "Attivi" : "Disattivati"}
            </Badge>
          </div>
        </motion.div>

        {/* Theme */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.21 }}
          className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#003DA5]/10 dark:bg-[#003DA5]/20 flex items-center justify-center">
              <span className="text-[#003DA5] dark:text-blue-400 text-xl">🎨</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Tema</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scegli l&apos;aspetto dell&apos;app</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`relative rounded-xl py-3 px-2 font-semibold transition-all duration-200 border-2 ${
                  theme === opt.key
                    ? "border-[#003DA5] bg-[#003DA5]/8 dark:bg-[#003DA5]/15 text-[#003DA5] dark:text-[#003DA5]/70 shadow-sm"
                    : "border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                <div className="text-xs mt-1">{opt.label}</div>
                {theme === opt.key && (
                  <motion.div
                    layoutId="themeIndicator"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#003DA5] rounded-full flex items-center justify-center"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        {notifications.supported && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#003DA5]/10 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003DA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Notifiche</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Promemoria streak e lezioni</p>
                </div>
              </div>
              <button
                onClick={() => notifications.toggle()}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                  notifications.enabled ? "bg-[#003DA5]" : "bg-gray-300"
                }`}
              >
                <motion.div
                  animate={{ x: notifications.enabled ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge
                variant={notifications.enabled ? "default" : "secondary"}
                className={`text-xs ${
                  notifications.enabled
                    ? "bg-[#003DA5]/15 text-[#003DA5] hover:bg-[#003DA5]/15"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {notifications.enabled ? "Attive" : notifications.permission === "denied" ? "Bloccate dal browser" : "Disattivate"}
              </Badge>
            </div>
            {notifications.permission === "denied" && (
              <p className="mt-2 text-[11px] text-red-500/80">
                Le notifiche sono bloccate dal browser. Per riattivarle, modifica le impostazioni del sito nel browser.
              </p>
            )}
          </motion.div>
        )}

        {/* AI Difficulty Level */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V11h3a3 3 0 0 1 3 3v1a2 2 0 0 1-2 2h-1v3a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-3H6a2 2 0 0 1-2-2v-1a3 3 0 0 1 3-3h3V9.4A4 4 0 0 1 8 6a4 4 0 0 1 4-4z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Livello AI Avversari</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scegli la difficolta degli avversari AI</p>
            </div>
          </div>
          <div className="space-y-2">
            {AI_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => updateAiLevel(level)}
                className={`relative w-full text-left rounded-xl p-4 transition-all duration-200 border-2 ${
                  aiLevel === level
                    ? "border-[#003DA5] bg-[#003DA5]/8 dark:bg-[#003DA5]/10 shadow-sm"
                    : "border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:border-gray-200 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{AI_LEVEL_ICONS[level]}</span>
                  <span className={`font-bold text-sm ${aiLevel === level ? "text-[#003DA5] dark:text-[#003DA5]/70" : "text-gray-800 dark:text-gray-200"}`}>
                    {AI_LEVEL_LABELS[level]}
                  </span>
                  {aiLevel === level && (
                    <Badge className="ml-auto bg-[#003DA5] text-white text-[10px] hover:bg-[#003DA5]">
                      Attivo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-9">{AI_LEVEL_DESCRIPTIONS[level]}</p>
                {aiLevel === level && (
                  <motion.div
                    layoutId="aiLevelIndicator"
                    className="absolute inset-0 rounded-xl border-2 border-[#003DA5] pointer-events-none"
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Profile Selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Profilo Giocatore</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scegli lo stile di gioco che preferisci</p>
            </div>
          </div>
          <div className="space-y-2">
            {PROFILES.map((p) => (
              <button
                key={p.key}
                onClick={() => updateProfile(p.key)}
                className={`relative w-full text-left rounded-xl p-4 transition-all duration-200 border-2 ${
                  profile === p.key
                    ? "border-[#003DA5] bg-[#003DA5]/8 shadow-sm"
                    : "border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:border-gray-200 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${p.color}`} />
                  <span className={`font-bold text-sm ${profile === p.key ? "text-[#003DA5] dark:text-[#003DA5]/70" : "text-gray-800 dark:text-gray-200"}`}>
                    {p.label}
                  </span>
                  {profile === p.key && (
                    <Badge className="ml-auto bg-[#003DA5] text-white text-[10px] hover:bg-[#003DA5]">
                      Attivo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{p.description}</p>
                {profile === p.key && (
                  <motion.div
                    layoutId="profileIndicator"
                    className="absolute inset-0 rounded-xl border-2 border-[#003DA5] pointer-events-none"
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reset Progress */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Reset Progressi</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cancella tutti i dati e ricomincia da zero</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {resetDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#003DA5]/8 border border-[#003DA5]/25 rounded-xl p-4 text-center"
              >
                <span className="text-[#003DA5] font-semibold text-sm">
                  Progressi resettati con successo
                </span>
              </motion.div>
            ) : showResetConfirm ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <p className="text-red-700 text-sm font-semibold mb-1">Sei sicuro?</p>
                <p className="text-red-600/80 text-xs mb-4">
                  Questa azione cancellera tutti i tuoi progressi, XP, badge e impostazioni. Non potrai annullarla.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={resetProgress}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold h-10"
                  >
                    Conferma Reset
                  </Button>
                  <Button
                    onClick={() => setShowResetConfirm(false)}
                    variant="outline"
                    className="flex-1 rounded-xl text-sm font-bold h-10 border-gray-300"
                  >
                    Annulla
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button
                  onClick={() => setShowResetConfirm(true)}
                  variant="outline"
                  className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold h-11 text-sm"
                >
                  Resetta tutti i progressi
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Logout / Login */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="card-clean bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a3040]"
        >
          {user ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Esci dall&apos;account</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Disconnettiti da Bridge LAB</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {showLogoutConfirm ? (
                  <motion.div
                    key="logout-confirm"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-rose-50 border border-rose-200 rounded-xl p-4"
                  >
                    <p className="text-rose-700 text-sm font-semibold mb-1">Vuoi anche cancellare i dati locali?</p>
                    <p className="text-rose-600/80 text-xs mb-4">
                      Puoi scegliere se mantenere i progressi salvati localmente o cancellarli insieme al logout.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleLogout(true)}
                        disabled={loggingOut}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold h-10 disabled:opacity-50"
                      >
                        {loggingOut ? "Uscita..." : "Esci e cancella dati locali"}
                      </Button>
                      <Button
                        onClick={() => handleLogout(false)}
                        disabled={loggingOut}
                        variant="outline"
                        className="w-full rounded-xl text-sm font-bold h-10 border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        {loggingOut ? "Uscita..." : "Esci e mantieni dati locali"}
                      </Button>
                      <Button
                        onClick={() => setShowLogoutConfirm(false)}
                        variant="outline"
                        className="w-full rounded-xl text-sm font-bold h-10 border-gray-300 text-gray-600"
                      >
                        Annulla
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="logout-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button
                      onClick={() => setShowLogoutConfirm(true)}
                      variant="outline"
                      className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold h-11 text-sm"
                    >
                      Esci dall&apos;account
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#003DA5]/10 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003DA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Account</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Accedi per salvare i progressi su tutti i dispositivi</p>
                </div>
              </div>
              <a
                href="/login"
                className="flex items-center justify-center w-full rounded-xl bg-[#003DA5] text-white font-bold h-11 text-sm shadow-sm hover:opacity-90 transition-opacity"
              >
                Accedi o Registrati
              </a>
            </>
          )}
        </motion.div>

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center pt-4 pb-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-[#1a1f2e]/80 border border-gray-100 dark:border-[#2a3040] rounded-full px-4 py-2 shadow-sm">
            <span className="text-[#003DA5] font-bold text-sm">Bridge LAB</span>
            <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[10px] hover:bg-gray-100">
              v{APP_VERSION}
            </Badge>
          </div>
          <p className="text-gray-400 text-xs mt-2">FIGB - Corso Fiori</p>
          <p className="text-gray-300 text-[10px] mt-1">Sviluppato con Claude Code</p>
        </motion.div>
      </div>
    </div>
  );
}
