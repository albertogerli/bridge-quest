"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSpacedReview, type ReviewItem } from "@/hooks/use-spaced-review";
import { getLessonById, getModuleById, getCourseForLesson } from "@/data/courses";
import {
  Brain, ArrowLeft, Clock, AlertTriangle,
  CheckCircle2, Zap, BookOpen, ChevronRight,
  RotateCcw, Trophy,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns how many days until `dateISO`. Negative = overdue. */
function daysUntil(dateISO: string): number {
  const today = new Date(todayISO());
  const target = new Date(dateISO);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Human-readable label for the due date */
function dueLabel(dateISO: string): string {
  const d = daysUntil(dateISO);
  if (d < 0) return `In ritardo di ${Math.abs(d)} ${Math.abs(d) === 1 ? "giorno" : "giorni"}`;
  if (d === 0) return "Da ripassare oggi";
  if (d === 1) return "Domani";
  return `Tra ${d} giorni`;
}

/** Human-readable "last reviewed" label */
function lastReviewedLabel(dateISO: string): string {
  const d = daysUntil(dateISO);
  if (d === 0) return "Rivisto oggi";
  const abs = Math.abs(d);
  return `Rivisto ${abs} ${abs === 1 ? "giorno" : "giorni"} fa`;
}

/** Urgency: overdue > today > upcoming */
type Urgency = "overdue" | "today" | "upcoming";

function getUrgency(dateISO: string): Urgency {
  const d = daysUntil(dateISO);
  if (d < 0) return "overdue";
  if (d === 0) return "today";
  return "upcoming";
}

const urgencyConfig: Record<Urgency, { dot: string; border: string; bg: string; text: string; label: string }> = {
  overdue: {
    dot: "bg-red-500",
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50 dark:bg-red-950/20",
    text: "text-red-600",
    label: "In ritardo",
  },
  today: {
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-600",
    label: "Oggi",
  },
  upcoming: {
    dot: "bg-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-500",
    label: "Prossimamente",
  },
};

// ---------------------------------------------------------------------------
// XP award helper
// ---------------------------------------------------------------------------

const REVIEW_XP_BONUS = 15;
const REVIEW_XP_KEY = "bq_ripasso_last_award";

function awardReviewXP(): number {
  try {
    const currentXp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
    const newXp = currentXp + REVIEW_XP_BONUS;
    localStorage.setItem("bq_xp", String(newXp));
    return newXp;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Enriched review item (with lesson/module metadata)
// ---------------------------------------------------------------------------

interface EnrichedReviewItem extends ReviewItem {
  lessonTitle: string;
  lessonIcon: string;
  moduleTitle: string;
  courseName: string;
  courseIcon: string;
  urgency: Urgency;
}

function enrichItem(item: ReviewItem): EnrichedReviewItem {
  const lesson = getLessonById(item.lessonId);
  const mod = getModuleById(item.lessonId, item.moduleId);
  const course = getCourseForLesson(item.lessonId);

  return {
    ...item,
    lessonTitle: lesson?.title ?? `Lezione ${item.lessonId}`,
    lessonIcon: lesson?.icon ?? "📖",
    moduleTitle: mod?.title ?? item.moduleId,
    courseName: course?.name ?? "Corso",
    courseIcon: course?.icon ?? "♣",
    urgency: getUrgency(item.nextReview),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RipassoPage() {
  const { items, getItemsDue, markReviewed, reviewCount } = useSpacedReview();
  const [enrichedItems, setEnrichedItems] = useState<EnrichedReviewItem[]>([]);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [filter, setFilter] = useState<"due" | "all">("due");

  // Enrich items with lesson metadata
  useEffect(() => {
    const source = filter === "due" ? getItemsDue() : items;
    const enriched = source
      .map(enrichItem)
      .sort((a, b) => {
        // Sort: overdue first, then today, then upcoming; within group sort by nextReview
        const urgencyOrder: Record<Urgency, number> = { overdue: 0, today: 1, upcoming: 2 };
        const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (diff !== 0) return diff;
        return a.nextReview.localeCompare(b.nextReview);
      });
    setEnrichedItems(enriched);
  }, [items, filter, getItemsDue]);

  // Award XP when visiting with due items (once per session)
  const handleReviewStart = useCallback(
    (lessonId: number, moduleId: string) => {
      // We don't mark reviewed here - the lesson page will handle the quiz
      // But we can track that the user started the review
    },
    []
  );

  const handleMarkMastered = useCallback(
    (lessonId: number, moduleId: string) => {
      markReviewed(lessonId, moduleId, true);
      // Award XP bonus
      if (!xpAwarded) {
        const newXp = awardReviewXP();
        setXpAmount(newXp);
        setXpAwarded(true);
        // Reset award flag after some time
        setTimeout(() => setXpAwarded(false), 3000);
      }
    },
    [markReviewed, xpAwarded]
  );

  const dueCount = getItemsDue().length;
  const totalCount = items.length;

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0f1219]">
      {/* XP Toast */}
      <AnimatePresence>
        {xpAwarded && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl shadow-emerald/30">
              <Zap className="w-5 h-5" />
              Ripasso completato: +{REVIEW_XP_BONUS} XP
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F7F5F0]/80 dark:bg-[#0f1219]/80 backdrop-blur-xl border-b border-[#e5e0d5] dark:border-[#2a3040]">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3.5">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ripasso</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sistema di ripasso spaziato
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            {dueCount > 0 && (
              <Badge className="bg-[#003DA5] text-white text-xs font-bold hover:bg-[#003DA5]">
                {dueCount}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-5">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm p-3.5 text-center">
            <p className="text-2xl font-bold text-red-500">{enrichedItems.filter(i => i.urgency === "overdue").length}</p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">In ritardo</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm p-3.5 text-center">
            <p className="text-2xl font-bold text-amber-500">{enrichedItems.filter(i => i.urgency === "today").length}</p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">Oggi</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm p-3.5 text-center">
            <p className="text-2xl font-bold text-indigo-500">{totalCount}</p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">Totale</p>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("due")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === "due"
                ? "bg-[#003DA5] text-white shadow-md"
                : "bg-white dark:bg-[#1a1f2e] text-gray-500 border border-[#e5e0d5] dark:border-[#2a3040]"
            }`}
          >
            Da ripassare ({dueCount})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === "all"
                ? "bg-[#003DA5] text-white shadow-md"
                : "bg-white dark:bg-[#1a1f2e] text-gray-500 border border-[#e5e0d5] dark:border-[#2a3040]"
            }`}
          >
            Tutti ({totalCount})
          </button>
        </div>

        {/* How it works info box */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900 shrink-0 mt-0.5">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Come funziona</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                Quando sbagli una domanda nei quiz, viene aggiunta qui per il ripasso.
                La ripetizione spaziata ti aiuta a memorizzare meglio: rivedi dopo 1, 3 e 7 giorni.
                Segna come padroneggiato quando sei sicuro!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Review items list */}
        {enrichedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 15 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 mx-auto mb-4"
            >
              <Trophy className="w-10 h-10 text-emerald-500" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {filter === "due" ? "Nessun ripasso in programma" : "Nessun argomento da ripassare"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
              {filter === "due"
                ? "Sei in pari con tutti i ripassi! Continua a studiare le lezioni per aggiungere nuovi argomenti."
                : "Non hai ancora argomenti da ripassare. Gli errori nei quiz verranno aggiunti automaticamente qui."
              }
            </p>
            <Link href="/lezioni">
              <Button className="mt-5 rounded-xl bg-[#003DA5] hover:bg-[#002E7A] text-white font-semibold shadow-md">
                <BookOpen className="w-4 h-4 mr-2" />
                Vai alle lezioni
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {enrichedItems.map((item, index) => {
                const cfg = urgencyConfig[item.urgency];

                return (
                  <motion.div
                    key={`${item.lessonId}-${item.moduleId}`}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, scale: 0.95 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={`rounded-2xl bg-white dark:bg-[#1a1f2e] border ${cfg.border} shadow-sm overflow-hidden`}
                  >
                    {/* Urgency indicator bar */}
                    <div className={`h-1 ${cfg.dot}`} />

                    <div className="p-4">
                      {/* Top row: lesson info + urgency badge */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xl shrink-0">
                          {item.lessonIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                              {item.moduleTitle}
                            </p>
                            <Badge variant="outline" className={`text-[9px] font-bold ${cfg.text} ${cfg.bg} border-0 shrink-0`}>
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {item.courseIcon} {item.lessonTitle}
                          </p>
                        </div>
                      </div>

                      {/* Question preview */}
                      <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 border border-gray-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {item.question}
                        </p>
                      </div>

                      {/* Bottom row: metadata + actions */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dueLabel(item.nextReview)}
                          </span>
                          <span className="flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            {item.wrongCount}x sbagliato
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mark as mastered */}
                          <button
                            onClick={() => handleMarkMastered(item.lessonId, item.moduleId)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 transition-colors"
                            title="Segna come padroneggiato"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fatto
                          </button>

                          {/* Go to lesson */}
                          <Link href={`/lezioni/${item.lessonId}/${item.moduleId}`}>
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#003DA5] bg-[#003DA5]/5 hover:bg-[#003DA5]/10 transition-colors">
                              Ripassa
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Bottom tip */}
        {enrichedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-4"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Ripassa regolarmente per consolidare la memoria a lungo termine
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
