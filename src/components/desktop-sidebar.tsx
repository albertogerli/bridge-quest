"use client";

import Link from "next/link";
import { useStats } from "@/hooks/use-stats";
import { useSpacedReview } from "@/hooks/use-spaced-review";
import { useWeeklyObjectives } from "@/hooks/use-weekly-objectives";
import { collectibleCards } from "@/data/collectible-cards";
import { useProfile } from "@/hooks/use-profile";
import { useSharedAuth } from "@/contexts/auth-provider";

const miniGames = [
  { href: "/gioca/quiz-lampo", emoji: "⚡", label: "Quiz Lampo", color: "bg-rose-50 border-rose-200 text-rose-700" },
  { href: "/gioca/conta-veloce", emoji: "🔢", label: "Conta Veloce", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { href: "/gioca/dichiara", emoji: "📢", label: "Dichiara!", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { href: "/gioca/memory", emoji: "🧠", label: "Memory", color: "bg-purple-50 border-purple-200 text-purple-700" },
];

// Objective icon mapping for sidebar
const objectiveEmojiMap: Record<string, string> = {
  quiz: "📝",
  hands: "🃏",
  xp: "⭐",
  modules: "📚",
  streak: "🔥",
  minigames: "🎮",
  daily: "📅",
  perfect: "💯",
};

export function DesktopSidebar() {
  const stats = useStats();
  const profile = useProfile();
  const { user, signOut } = useSharedAuth();
  const { reviewCount } = useSpacedReview();
  const { objectives, allCompleted, bonusClaimed } = useWeeklyObjectives();

  const playerStats = {
    xp: stats.xp,
    streak: stats.streak,
    handsPlayed: stats.handsPlayed,
    completedModules: stats.totalModulesCompleted,
    badges: [] as string[],
    quizLampoBest: 0,
    memoryBest: 0,
    dailyHandsTotal: 0,
  };
  const unlockedCards = collectibleCards.filter((c) => c.checkUnlock(playerStats));
  const totalCards = collectibleCards.length;

  return (
    <aside className="hidden lg:block w-[320px] shrink-0" aria-label="Barra laterale">
      <div className="sticky top-6 space-y-4 pb-6">

        {/* Level & XP */}
        <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] card-clean p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003DA5]/10 border border-[#003DA5]/20">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Livello {stats.level}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{stats.levelName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-[#003DA5]">{stats.xpInLevel}</p>
              <p className="text-[10px] text-gray-500 font-medium">{`/ 100 ${profile.xpLabel}`}</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#003DA5] to-[#0052CC] transition-all"
              style={{ width: `${stats.xpInLevel}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5 font-medium">
            {stats.xp} {profile.xpLabel} totali · {stats.totalModulesCompleted}/{stats.totalModulesAvailable} moduli
          </p>
        </div>

        {/* Streak */}
        <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] card-clean p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{stats.streak >= 7 ? "🔥" : "📅"}</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Streak: {stats.streak} {stats.streak === 1 ? "giorno" : "giorni"}
              </p>
            </div>
            {stats.streak > 0 && (
              <span className="text-[10px] font-medium text-[#003DA5] bg-[#003DA5]/8 border border-[#003DA5]/20 rounded-full px-2 py-0.5">
                {`+${Math.min(stats.streak * 5, 50)} ${profile.xpLabel}/giorno`}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {["L", "M", "M", "G", "V", "S", "D"].map((day, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 flex-1 items-center justify-center rounded-lg text-[10px] font-bold ${
                  i < Math.min(stats.streak, 7)
                    ? "bg-[#003DA5] text-white"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Daily Challenge */}
        <Link href="/gioca/sfida" aria-label="Sfida del Giorno">
          <div className={`rounded-2xl p-4 transition-all hover:translate-y-[-1px] hover:shadow-md cursor-pointer ${
            stats.dailyDone
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-white card-clean"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                stats.dailyDone ? "bg-emerald-100" : "bg-[#c8a44e]/15 border border-[#c8a44e]/25"
              }`}>
                {stats.dailyDone ? "✅" : "🔥"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sfida del Giorno</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {stats.dailyDone ? "Completata! Torna domani" : "Gioca la mano quotidiana"}
                </p>
              </div>
              {!stats.dailyDone && (
                <span className="text-[10px] font-medium text-[#c8a44e] bg-[#c8a44e]/10 border border-[#c8a44e]/20 rounded-full px-2 py-0.5">
                  {`+40 ${profile.xpLabel}`}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Weekly Objectives */}
        {objectives.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] card-clean p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Obiettivi</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  allCompleted
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-[#003DA5]/10 text-[#003DA5]"
                }`}>
                  {objectives.filter(o => o.completed).length}/3
                </span>
              </div>
              <Link href="/obiettivi" className="text-[10px] font-semibold text-[#003DA5] hover:underline">
                Dettagli →
              </Link>
            </div>
            <div className="space-y-2">
              {objectives.map((obj) => {
                const pct = obj.target > 0 ? Math.min(Math.round((obj.current / obj.target) * 100), 100) : 0;
                return (
                  <div
                    key={obj.id}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                      obj.completed
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <span className="text-sm shrink-0">{objectiveEmojiMap[obj.id] || "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-semibold truncate ${
                          obj.completed ? "text-emerald-700 line-through" : "text-gray-900 dark:text-gray-100"
                        }`}>
                          {obj.title}
                        </p>
                        <span className="text-[10px] font-bold text-gray-500 tabular-nums ml-1 shrink-0">
                          {obj.current}/{obj.target}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            obj.completed ? "bg-emerald-500" : "bg-[#003DA5]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {allCompleted && !bonusClaimed && (
              <Link href="/obiettivi">
                <div className="mt-2.5 py-2 rounded-xl bg-[#003DA5] text-white text-center text-xs font-bold cursor-pointer hover:bg-[#002E7A] transition-colors">
                  🎁 Riscuoti bonus +100 XP!
                </div>
              </Link>
            )}
            {bonusClaimed && (
              <div className="mt-2.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-[11px] font-bold text-emerald-700">Bonus riscosso! Torna lunedi</p>
              </div>
            )}
          </div>
        )}

        {/* Spaced Review */}
        {reviewCount > 0 && (
          <Link href="/ripasso" aria-label={`Ripasso del giorno: ${reviewCount} domande da ripassare`}>
            <div className="rounded-2xl bg-[#003DA5]/5 border border-[#003DA5]/15 p-4 cursor-pointer hover:translate-y-[-1px] hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003DA5]/10 border border-[#003DA5]/20">
                  <span className="text-xl">🧠</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ripasso del giorno</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {reviewCount} {reviewCount === 1 ? "domanda" : "domande"} da ripassare
                  </p>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003DA5] text-white text-xs font-bold">
                  {reviewCount}
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Continue CTA */}
        {stats.nextModule && (
          <Link href={`/lezioni/${stats.nextModule.lessonId}/${stats.nextModule.moduleId}`} aria-label={`Riprendi: ${stats.nextModule.moduleTitle}`}>
            <div className="rounded-2xl bg-[#003DA5] p-4 text-white shadow-sm hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stats.nextModule.lessonIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Riprendi</p>
                  <p className="text-sm font-semibold truncate">{stats.nextModule.moduleTitle}</p>
                </div>
                <svg className="h-5 w-5 text-white/60 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Links - Mini Games */}
        <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] card-clean p-4">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">Mini-Giochi</p>
          <div className="grid grid-cols-2 gap-2">
            {miniGames.map((game) => (
              <Link key={game.href} href={game.href} aria-label={`Mini-gioco: ${game.label}`}>
                <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer ${game.color}`}>
                  <span className="text-base" aria-hidden="true">{game.emoji}</span>
                  <span>{game.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Collectible Cards */}
        <Link href="/collezione" aria-label="Collezione carte">
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] card-clean p-4 cursor-pointer hover:translate-y-[-1px] hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {(unlockedCards.length > 0 ? unlockedCards.slice(-3) : collectibleCards.slice(0, 3)).map((card) => {
                  const isUnlocked = unlockedCards.includes(card);
                  return (
                    <div
                      key={card.id}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${
                        isUnlocked
                          ? `bg-gradient-to-br ${card.gradient} border border-gray-200`
                          : "bg-gray-100 grayscale opacity-40"
                      }`}
                    >
                      {isUnlocked ? card.emoji : "?"}
                    </div>
                  );
                })}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Collezione</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {unlockedCards.length}/{totalCards} sbloccate
                </p>
              </div>
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="9,6 15,12 9,18" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Account */}
        {user ? (
          <button
            onClick={async () => {
              await signOut();
              try { localStorage.removeItem("bq_guest"); } catch {}
              window.location.href = "/";
            }}
            aria-label="Esci dal tuo account"
            className="w-full flex items-center gap-2.5 rounded-xl bg-white dark:bg-[#1a1f2e] card-clean p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 group-hover:bg-rose-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-rose-600">Esci</p>
              <p className="text-[10px] text-gray-400">{user.email}</p>
            </div>
          </button>
        ) : (
          <Link
            href="/login"
            aria-label="Accedi o Registrati"
            className="w-full flex items-center gap-2.5 rounded-xl bg-[#003DA5] p-3 hover:bg-[#002E7A] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">Accedi o Registrati</p>
          </Link>
        )}

        {/* FIGB + CONI logos */}
        <div className="rounded-xl bg-[#003DA5]/5 border border-[#003DA5]/15 p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-4">
            <img src="/icons/logo-figb.png" alt="FIGB" className="h-10 w-auto" />
            <img src="/icons/logo-coni.png" alt="CONI - Disciplina Sportiva Associata" className="h-8 w-auto" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-[#003DA5] uppercase tracking-wider">
              Un progetto della FIGB
            </p>
            <p className="text-[10px] text-[#003DA5]/70 mt-0.5">
              Commissione Insegnamento
            </p>
            <p className="text-[9px] text-[#003DA5]/40 mt-1">
              Sviluppo: A. G. Gerli / Tourbillon Tech
            </p>
          </div>
        </div>

      </div>
    </aside>
  );
}
