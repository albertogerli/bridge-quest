"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    key: "giovane",
    label: "Dinamico",
    description: "Gamification completa, animazioni vivaci, sfide intense",
    color: "bg-emerald-500",
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
  const [textSize, setTextSize] = useState("medio");
  const [animSpeed, setAnimSpeed] = useState("normale");
  const [sound, setSound] = useState(true);
  const [profile, setProfile] = useState("adulto");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTextSize(localStorage.getItem("bq_text_size") || "medio");
    setAnimSpeed(localStorage.getItem("bq_anim_speed") || "normale");
    setSound(localStorage.getItem("bq_sound") !== "off");
    setProfile(localStorage.getItem("bq_profile") || "adulto");
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

  const resetProgress = useCallback(() => {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(BQ_KEYS_PREFIX)
    );
    keys.forEach((k) => localStorage.removeItem(k));
    setTextSize("medio");
    setAnimSpeed("normale");
    setSound(true);
    setProfile("adulto");
    setShowResetConfirm(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-4 pt-12 pb-8">
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
            className="text-3xl font-extrabold text-white tracking-tight"
          >
            Impostazioni
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-emerald-100 mt-1 text-sm"
          >
            Personalizza la tua esperienza BridgeQuest
          </motion.p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-24 space-y-4">
        {/* Text Size */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="card-elevated bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-lg">Aa</span>
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-base">Dimensione Testo</h2>
              <p className="text-xs text-gray-500">Regola la grandezza dei caratteri</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TEXT_SIZES.map((size) => (
              <button
                key={size.key}
                onClick={() => updateTextSize(size.key)}
                className={`relative rounded-xl py-3 px-2 font-semibold transition-all duration-200 border-2 ${
                  textSize === size.key
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-gray-150 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className={size.sizeClass}>{size.icon}</span>
                <div className="text-xs mt-1">{size.label}</div>
                {textSize === size.key && (
                  <motion.div
                    layoutId="textSizeIndicator"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
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
          className="card-elevated bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <span className="text-purple-600 text-xl">✦</span>
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-base">Velocita Animazioni</h2>
              <p className="text-xs text-gray-500">Controlla la rapidita delle transizioni</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ANIM_SPEEDS.map((speed) => (
              <button
                key={speed.key}
                onClick={() => updateAnimSpeed(speed.key)}
                className={`relative rounded-xl py-3 px-2 font-semibold transition-all duration-200 border-2 ${
                  animSpeed === speed.key
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-gray-150 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="text-lg">{speed.icon}</span>
                <div className="text-xs mt-1">{speed.label}</div>
                {animSpeed === speed.key && (
                  <motion.div
                    layoutId="animSpeedIndicator"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
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
          className="card-elevated bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <span className="text-amber-600 text-xl">{sound ? "🔊" : "🔇"}</span>
              </div>
              <div>
                <h2 className="font-extrabold text-gray-900 text-base">Suoni</h2>
                <p className="text-xs text-gray-500">Effetti sonori e feedback audio</p>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                sound ? "bg-emerald-500" : "bg-gray-300"
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
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {sound ? "Attivi" : "Disattivati"}
            </Badge>
          </div>
        </motion.div>

        {/* Profile Selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="card-elevated bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-base">Profilo Giocatore</h2>
              <p className="text-xs text-gray-500">Scegli lo stile di gioco che preferisci</p>
            </div>
          </div>
          <div className="space-y-2">
            {PROFILES.map((p) => (
              <button
                key={p.key}
                onClick={() => updateProfile(p.key)}
                className={`relative w-full text-left rounded-xl p-4 transition-all duration-200 border-2 ${
                  profile === p.key
                    ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                    : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${p.color}`} />
                  <span className={`font-bold text-sm ${profile === p.key ? "text-emerald-700" : "text-gray-800"}`}>
                    {p.label}
                  </span>
                  {profile === p.key && (
                    <Badge className="ml-auto bg-emerald-500 text-white text-[10px] hover:bg-emerald-500">
                      Attivo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-6">{p.description}</p>
                {profile === p.key && (
                  <motion.div
                    layoutId="profileIndicator"
                    className="absolute inset-0 rounded-xl border-2 border-emerald-500 pointer-events-none"
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
          className="card-elevated bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
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
              <h2 className="font-extrabold text-gray-900 text-base">Reset Progressi</h2>
              <p className="text-xs text-gray-500">Cancella tutti i dati e ricomincia da zero</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {resetDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"
              >
                <span className="text-emerald-600 font-semibold text-sm">
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

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center pt-4 pb-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 border border-gray-100 rounded-full px-4 py-2 shadow-sm">
            <span className="text-emerald-600 font-bold text-sm">BridgeQuest</span>
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
