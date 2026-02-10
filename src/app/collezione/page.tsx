"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  collectibleCards,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  type CollectibleCard,
  type PlayerStats,
} from "@/data/collectible-cards";

/* ────────────────────────────────────────────── */
/*  Types                                         */
/* ────────────────────────────────────────────── */

type RarityFilter = "tutte" | CollectibleCard["rarity"];
type CategoryFilter = "tutte" | CollectibleCard["category"];

/* ────────────────────────────────────────────── */
/*  Helpers                                       */
/* ────────────────────────────────────────────── */

function loadPlayerStats(): PlayerStats {
  return {
    xp: parseInt(localStorage.getItem("bq_xp") || "0", 10),
    streak: parseInt(localStorage.getItem("bq_streak") || "0", 10),
    handsPlayed: parseInt(localStorage.getItem("bq_hands_played") || "0", 10),
    completedModules: Object.keys(
      JSON.parse(localStorage.getItem("bq_completed_modules") || "{}")
    ).length,
    badges: JSON.parse(localStorage.getItem("bq_badges") || "[]"),
    quizLampoBest: parseInt(
      localStorage.getItem("bq_quiz_lampo_best") || "0",
      10
    ),
    memoryBest: parseInt(localStorage.getItem("bq_memory_best") || "0", 10),
    dailyHandsTotal: parseInt(
      localStorage.getItem("bq_daily_hand_total") || "0",
      10
    ),
  };
}

function loadSeenCards(): Set<string> {
  try {
    const raw = localStorage.getItem("bq_collection_seen");
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function persistSeenCards(seen: Set<string>) {
  try {
    localStorage.setItem("bq_collection_seen", JSON.stringify([...seen]));
  } catch {}
}

/* Rarity sort order for breakdown */
const RARITY_ORDER: CollectibleCard["rarity"][] = [
  "comune",
  "rara",
  "epica",
  "leggendaria",
];

const RARITY_EMOJI: Record<CollectibleCard["rarity"], string> = {
  comune: "🔵",
  rara: "🟣",
  epica: "🟠",
  leggendaria: "🟡",
};

/* ────────────────────────────────────────────── */
/*  Main Page                                     */
/* ────────────────────────────────────────────── */

export default function CollezionePage() {
  /* state */
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [seenCards, setSeenCards] = useState<Set<string>>(new Set());
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("tutte");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("tutte");
  const [selectedCard, setSelectedCard] = useState<CollectibleCard | null>(null);
  const [revealingNew, setRevealingNew] = useState(false);

  /* hydrate from localStorage */
  useEffect(() => {
    try {
      const s = loadPlayerStats();
      setStats(s);
      setSeenCards(loadSeenCards());

      const ids = new Set<string>();
      for (const card of collectibleCards) {
        if (card.checkUnlock(s)) ids.add(card.id);
      }
      setUnlockedIds(ids);
    } catch {}
  }, []);

  /* derived */
  const totalCards = collectibleCards.length;
  const unlockedCount = unlockedIds.size;

  const filteredCards = collectibleCards.filter((c) => {
    if (rarityFilter !== "tutte" && c.rarity !== rarityFilter) return false;
    if (categoryFilter !== "tutte" && c.category !== categoryFilter) return false;
    return true;
  });

  /* Per-rarity breakdown */
  const rarityBreakdown = RARITY_ORDER.map((r) => {
    const total = collectibleCards.filter((c) => c.rarity === r).length;
    const unlocked = collectibleCards.filter(
      (c) => c.rarity === r && unlockedIds.has(c.id)
    ).length;
    return { rarity: r, total, unlocked };
  });

  /* Check if any full category is complete */
  const categories = Object.keys(CATEGORY_CONFIG) as CollectibleCard["category"][];
  const completedCategories = categories.filter((cat) => {
    const cardsInCat = collectibleCards.filter((c) => c.category === cat);
    return cardsInCat.length > 0 && cardsInCat.every((c) => unlockedIds.has(c.id));
  });

  /* mark card as seen */
  const markSeen = useCallback(
    (id: string) => {
      if (seenCards.has(id)) return;
      const next = new Set(seenCards);
      next.add(id);
      setSeenCards(next);
      persistSeenCards(next);
    },
    [seenCards]
  );

  /* handle card tap */
  const handleCardTap = useCallback(
    (card: CollectibleCard) => {
      const isUnlocked = unlockedIds.has(card.id);
      const isNew = isUnlocked && !seenCards.has(card.id);

      if (isNew) {
        setRevealingNew(true);
      } else {
        setRevealingNew(false);
      }

      setSelectedCard(card);

      if (isNew) {
        markSeen(card.id);
      }
    },
    [unlockedIds, seenCards, markSeen]
  );

  /* loading state */
  if (!stats) {
    return (
      <div className="pt-6 px-5 pb-28">
        <div className="mx-auto max-w-lg">
          <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 px-5 pb-28">
      <div className="mx-auto max-w-lg">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Collezione
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Sblocca tutte le carte leggendarie
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white card-elevated rounded-xl px-3 py-2">
            <span className="text-lg">🃏</span>
            <span className="text-sm font-extrabold text-gray-900">
              {unlockedCount}
            </span>
            <span className="text-sm text-gray-400 font-bold">
              /{totalCards}
            </span>
          </div>
        </motion.div>

        {/* ── Overall progress bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 card-elevated rounded-xl bg-white p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-700">
              Progresso collezione
            </p>
            <p className="text-xs font-extrabold text-emerald-600">
              {Math.round((unlockedCount / totalCards) * 100)}%
            </p>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{
                width: `${(unlockedCount / totalCards) * 100}%`,
              }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />
          </div>
          {/* Per-rarity mini breakdown */}
          <div className="flex items-center gap-3 mt-3">
            {rarityBreakdown.map((rb) => (
              <div key={rb.rarity} className="flex items-center gap-1">
                <span className="text-xs">{RARITY_EMOJI[rb.rarity]}</span>
                <span className="text-[10px] font-bold text-gray-500">
                  {rb.unlocked}/{rb.total}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Rarity filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-4"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Rarita
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: "tutte" as const, label: "Tutte" },
                { key: "comune" as const, label: "Comuni" },
                { key: "rara" as const, label: "Rare" },
                { key: "epica" as const, label: "Epiche" },
                { key: "leggendaria" as const, label: "Leggendarie" },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.key}
                variant={rarityFilter === opt.key ? "default" : "outline"}
                size="sm"
                onClick={() => setRarityFilter(opt.key)}
                className={`rounded-xl text-xs font-bold ${
                  rarityFilter === opt.key
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* ── Category filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Categoria
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={categoryFilter === "tutte" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("tutte")}
              className={`rounded-xl text-xs font-bold ${
                categoryFilter === "tutte"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Tutte
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-xl text-xs font-bold ${
                  categoryFilter === cat
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* ── Card Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          {filteredCards.map((card, i) => {
            const isUnlocked = unlockedIds.has(card.id);
            const isNew = isUnlocked && !seenCards.has(card.id);
            const rarityConf = RARITY_CONFIG[card.rarity];

            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.12 + i * 0.03, type: "spring", stiffness: 260, damping: 22 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCardTap(card)}
                className="relative text-left focus:outline-none"
              >
                {/* New card sparkle indicator */}
                {isNew && (
                  <motion.div
                    className="absolute -inset-1 rounded-[20px] z-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706, #fbbf24)",
                      backgroundSize: "300% 300%",
                    }}
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}

                <div
                  className={`relative z-10 aspect-[3/4] rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all ${
                    isUnlocked
                      ? `bg-gradient-to-br ${card.gradient} card-elevated-lg`
                      : "bg-gray-100 border-2 border-dashed border-gray-200"
                  }`}
                >
                  {isUnlocked ? (
                    <>
                      {/* Subtle shine overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

                      {/* Rarity badge top-right */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide ${rarityConf.bg} ${rarityConf.color} ${rarityConf.border} border`}
                        >
                          {rarityConf.label[0]}
                        </span>
                      </div>

                      {/* New sparkle badge */}
                      {isNew && (
                        <motion.div
                          className="absolute top-2 left-2"
                          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <span className="text-lg">✨</span>
                        </motion.div>
                      )}

                      {/* Emoji */}
                      <motion.span
                        className="text-5xl mb-2 drop-shadow-sm relative z-10"
                        initial={false}
                        animate={isNew ? { scale: [1, 1.15, 1] } : {}}
                        transition={
                          isNew
                            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                            : {}
                        }
                      >
                        {card.emoji}
                      </motion.span>

                      {/* Name */}
                      <p className="text-xs font-extrabold text-gray-800 text-center px-2 leading-tight relative z-10">
                        {card.name}
                      </p>

                      {/* Category */}
                      <p className="text-[9px] text-gray-500/80 font-semibold mt-1 relative z-10">
                        {CATEGORY_CONFIG[card.category].emoji}{" "}
                        {CATEGORY_CONFIG[card.category].label}
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Locked card */}
                      <div className="opacity-30">
                        <svg
                          className="w-8 h-8 text-gray-400 mb-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <span className="text-3xl text-gray-300 mb-1">?</span>
                      <p className="text-xs font-bold text-gray-300 text-center px-2">
                        ???
                      </p>
                    </>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredCards.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-sm text-gray-400 font-medium">
              Nessuna carta con questi filtri
            </p>
          </motion.div>
        )}

        {/* ── Stats bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 card-elevated rounded-2xl bg-white p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-extrabold text-gray-900">
              Riepilogo collezione
            </h3>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-xs text-gray-500 font-medium">
              Totale sbloccate
            </span>
            <span className="text-sm font-extrabold text-gray-900">
              {unlockedCount}/{totalCards}
            </span>
          </div>

          {/* Per-rarity breakdown */}
          {rarityBreakdown.map((rb) => {
            const conf = RARITY_CONFIG[rb.rarity];
            return (
              <div
                key={rb.rarity}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide ${conf.bg} ${conf.color} ${conf.border} border`}
                  >
                    {conf.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rb.rarity === "comune"
                          ? "bg-gray-400"
                          : rb.rarity === "rara"
                          ? "bg-blue-400"
                          : rb.rarity === "epica"
                          ? "bg-purple-400"
                          : "bg-amber-400"
                      }`}
                      style={{
                        width: `${rb.total > 0 ? (rb.unlocked / rb.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 tabular-nums w-8 text-right">
                    {rb.unlocked}/{rb.total}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Completion bonus hint */}
          {completedCategories.length < categories.length && (
            <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-xl p-3">
              <span className="text-base">🏆</span>
              <p className="text-[11px] text-amber-700 font-semibold leading-tight">
                Completa tutte le carte di una categoria per +100 XP bonus!
              </p>
            </div>
          )}

          {/* Show completed categories */}
          {completedCategories.length > 0 && (
            <div className="mt-3 space-y-2">
              {completedCategories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3"
                >
                  <span className="text-base">✅</span>
                  <p className="text-[11px] text-emerald-700 font-bold">
                    {CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].label}{" "}
                    completata!
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedCard(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Card detail */}
            <motion.div
              key="card-detail"
              initial={
                revealingNew
                  ? { opacity: 0, scale: 0.3, rotateY: 180 }
                  : { opacity: 0, scale: 0.85, y: 30 }
              }
              animate={
                revealingNew
                  ? { opacity: 1, scale: 1, rotateY: 0 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={
                revealingNew
                  ? { type: "spring", stiffness: 200, damping: 18, duration: 0.7 }
                  : { type: "spring", stiffness: 300, damping: 24 }
              }
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-xs"
            >
              {(() => {
                const isUnlocked = unlockedIds.has(selectedCard.id);
                const rarityConf = RARITY_CONFIG[selectedCard.rarity];

                return (
                  <div
                    className={`rounded-3xl overflow-hidden ${
                      isUnlocked
                        ? `bg-gradient-to-br ${selectedCard.gradient}`
                        : "bg-gray-100"
                    }`}
                    style={{
                      boxShadow: isUnlocked
                        ? "0 20px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.1)"
                        : "0 10px 30px rgba(0,0,0,0.1)",
                    }}
                  >
                    {/* Top section */}
                    <div className="relative pt-8 pb-6 flex flex-col items-center">
                      {/* Shine */}
                      {isUnlocked && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
                      )}

                      {/* New reveal sparkles */}
                      {revealingNew && isUnlocked && (
                        <>
                          {[...Array(6)].map((_, idx) => (
                            <motion.span
                              key={idx}
                              className="absolute text-lg pointer-events-none"
                              initial={{
                                opacity: 0,
                                x: 0,
                                y: 0,
                                scale: 0,
                              }}
                              animate={{
                                opacity: [0, 1, 0],
                                x: (Math.random() - 0.5) * 140,
                                y: (Math.random() - 0.5) * 100 - 20,
                                scale: [0, 1.2, 0],
                              }}
                              transition={{
                                duration: 1.2,
                                delay: 0.2 + idx * 0.12,
                                ease: "easeOut",
                              }}
                              style={{
                                top: "50%",
                                left: "50%",
                              }}
                            >
                              ✨
                            </motion.span>
                          ))}
                        </>
                      )}

                      {/* Rarity badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${rarityConf.bg} ${rarityConf.color} ${rarityConf.border} border mb-4 relative z-10`}
                      >
                        {rarityConf.label}
                      </span>

                      {/* Emoji or lock */}
                      {isUnlocked ? (
                        <motion.span
                          className="text-7xl drop-shadow-md relative z-10"
                          animate={
                            revealingNew
                              ? { scale: [0.5, 1.2, 1], rotate: [0, 10, -10, 0] }
                              : {}
                          }
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          {selectedCard.emoji}
                        </motion.span>
                      ) : (
                        <div className="relative z-10">
                          <svg
                            className="w-16 h-16 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                      )}

                      {/* Name */}
                      <h2
                        className={`text-xl font-extrabold mt-3 relative z-10 ${
                          isUnlocked ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {isUnlocked ? selectedCard.name : "???"}
                      </h2>
                    </div>

                    {/* Info section */}
                    <div className="bg-white rounded-t-3xl px-5 pt-5 pb-6">
                      {isUnlocked ? (
                        <>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {selectedCard.description}
                          </p>

                          <div className="flex items-center gap-2 mt-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${rarityConf.bg} ${rarityConf.color}`}
                            >
                              {RARITY_EMOJI[selectedCard.rarity]}{" "}
                              {rarityConf.label}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600">
                              {CATEGORY_CONFIG[selectedCard.category].emoji}{" "}
                              {CATEGORY_CONFIG[selectedCard.category].label}
                            </span>
                          </div>

                          <div className="mt-4 bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
                            <span className="text-sm">✅</span>
                            <p className="text-[11px] text-emerald-700 font-semibold">
                              {selectedCard.unlockCondition}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            Questa carta non e' ancora stata sbloccata.
                          </p>

                          <div className="mt-4 bg-amber-50 rounded-xl p-3 flex items-center gap-2">
                            <span className="text-sm">🔒</span>
                            <p className="text-[11px] text-amber-700 font-semibold">
                              {selectedCard.unlockCondition}
                            </p>
                          </div>
                        </>
                      )}

                      <Button
                        onClick={() => setSelectedCard(null)}
                        className="w-full mt-4 h-11 rounded-xl bg-gray-900 text-white font-bold text-sm shadow-md"
                      >
                        Chiudi
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
