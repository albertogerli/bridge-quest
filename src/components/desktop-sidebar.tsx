"use client";

import Link from "next/link";
import { useStats } from "@/hooks/use-stats";
import { useSpacedReview } from "@/hooks/use-spaced-review";
import { collectibleCards } from "@/data/collectible-cards";
import { useProfile } from "@/hooks/use-profile";

const miniGames = [
  { href: "/gioca/quiz-lampo", emoji: "⚡", label: "Quiz Lampo", color: "bg-rose-50 border-rose-200 text-rose-700" },
  { href: "/gioca/conta-veloce", emoji: "🔢", label: "Conta Veloce", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { href: "/gioca/dichiara", emoji: "📢", label: "Dichiara!", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { href: "/gioca/memory", emoji: "🧠", label: "Memory", color: "bg-purple-50 border-purple-200 text-purple-700" },
];

export function DesktopSidebar() {
  const stats = useStats();
  const profile = useProfile();
  const { reviewCount } = useSpacedReview();

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
    <aside className="hidden lg:block w-[320px] shrink-0">
      <div className="sticky top-6 space-y-4 pb-6">

        {/* Level & XP */}
        <div className="rounded-2xl bg-white border border-[#e5e0d5] shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-200">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900">Livello {stats.level}</p>
                <p className="text-[11px] text-gray-500 font-bold">{stats.levelName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-indigo-600">{stats.xpInLevel}</p>
              <p className="text-[10px] text-gray-400 font-bold">{`/ 100 ${profile.xpLabel}`}</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all"
              style={{ width: `${stats.xpInLevel}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 font-bold">
            {stats.xp} {profile.xpLabel} totali · {stats.totalModulesCompleted}/{stats.totalModulesAvailable} moduli
          </p>
        </div>

        {/* Streak */}
        <div className="rounded-2xl bg-white border border-[#e5e0d5] shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{stats.streak >= 7 ? "🔥" : "📅"}</span>
              <p className="text-sm font-extrabold text-gray-900">
                Streak: {stats.streak} {stats.streak === 1 ? "giorno" : "giorni"}
              </p>
            </div>
            {stats.streak > 0 && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                {`+${Math.min(stats.streak * 5, 50)} ${profile.xpLabel}/giorno`}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {["L", "M", "M", "G", "V", "S", "D"].map((day, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 flex-1 items-center justify-center rounded-lg text-[10px] font-extrabold ${
                  i < Math.min(stats.streak, 7)
                    ? "bg-blue-500 text-white border border-blue-600"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
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
              : "bg-white border border-[#e5e0d5] shadow-sm"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                stats.dailyDone ? "bg-emerald-100" : "bg-amber-100 border border-amber-200"
              }`}>
                {stats.dailyDone ? "✅" : "🔥"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-gray-900">Sfida del Giorno</p>
                <p className="text-[11px] text-gray-500">
                  {stats.dailyDone ? "Completata! Torna domani" : "Gioca la mano quotidiana"}
                </p>
              </div>
              {!stats.dailyDone && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  {`+40 ${profile.xpLabel}`}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Spaced Review */}
        {reviewCount > 0 && (
          <Link href="/lezioni">
            <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 cursor-pointer hover:translate-y-[-1px] hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 border border-purple-200">
                  <span className="text-xl">🧠</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-gray-900">Ripasso del giorno</p>
                  <p className="text-[11px] text-gray-500">
                    {reviewCount} {reviewCount === 1 ? "domanda" : "domande"} da ripassare
                  </p>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-extrabold">
                  {reviewCount}
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Continue CTA */}
        {stats.nextModule && (
          <Link href={`/lezioni/${stats.nextModule.lessonId}/${stats.nextModule.moduleId}`}>
            <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white shadow-md hover:translate-y-[-1px] hover:shadow-lg active:translate-y-[1px] active:shadow-sm transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stats.nextModule.lessonIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Riprendi</p>
                  <p className="text-sm font-extrabold truncate">{stats.nextModule.moduleTitle}</p>
                </div>
                <svg className="h-5 w-5 text-white/60 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Links - Mini Games */}
        <div className="rounded-2xl bg-white border border-[#e5e0d5] shadow-sm p-4">
          <p className="text-xs font-extrabold text-gray-900 mb-3 uppercase tracking-wider">Mini-Giochi</p>
          <div className="grid grid-cols-2 gap-2">
            {miniGames.map((game) => (
              <Link key={game.href} href={game.href}>
                <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer ${game.color}`}>
                  <span className="text-base">{game.emoji}</span>
                  <span>{game.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Collectible Cards */}
        <Link href="/collezione" aria-label="Collezione carte">
          <div className="rounded-2xl bg-white border border-[#e5e0d5] shadow-sm p-4 cursor-pointer hover:translate-y-[-1px] hover:shadow-md transition-all">
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
                <p className="text-sm font-extrabold text-gray-900">Collezione</p>
                <p className="text-[11px] text-gray-500 font-bold">
                  {unlockedCards.length}/{totalCards} sbloccate
                </p>
              </div>
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="9,6 15,12 9,18" />
              </svg>
            </div>
          </div>
        </Link>

        {/* FIGB badge */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-3 text-center">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            Un progetto della FIGB
          </p>
          <p className="text-[10px] text-indigo-500 mt-0.5">
            Commissione Insegnamento
          </p>
        </div>

      </div>
    </aside>
  );
}
