"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { courses, levelInfo } from "@/data/courses";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile } from "@/hooks/use-profile";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const allWorlds = courses.flatMap(c => c.worlds);

export default function ProfiloPage() {
  const { user, profile: authProfile, signOut } = useAuth();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [currentProfile, setCurrentProfile] = useState<UserProfile>("adulto");

  useEffect(() => {
    try {
      setXp(parseInt(localStorage.getItem("bq_xp") || "0", 10));
      setStreak(parseInt(localStorage.getItem("bq_streak") || "0", 10));
      setHandsPlayed(parseInt(localStorage.getItem("bq_hands_played") || "0", 10));
      const cm = localStorage.getItem("bq_completed_modules");
      if (cm) setCompletedModules(JSON.parse(cm));
      const p = localStorage.getItem("bq_profile") as UserProfile | null;
      if (p) setCurrentProfile(p);
    } catch {}
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const levelNames = [
    "Principiante", "Novizio", "Apprendista", "Giocatore",
    "Esperto", "Dichiarante", "Stratega", "Campione",
    "Agonista", "Maestro", "Grande Maestro", "Campione Azzurro",
  ];
  const levelName = levelNames[Math.min(level - 1, levelNames.length - 1)];
  const nextLevelName = levelNames[Math.min(level, levelNames.length - 1)];

  const totalModulesCompleted = Object.keys(completedModules).length;
  const totalModulesAvailable = allWorlds.reduce(
    (sum, w) => sum + w.lessons.reduce((s, l) => s + l.modules.length, 0),
    0
  );
  const completionPercent = totalModulesAvailable > 0
    ? Math.round((totalModulesCompleted / totalModulesAvailable) * 100)
    : 0;

  // Count completed worlds (all courses)
  const worldsCompleted = allWorlds.filter((w) => {
    const wModules = w.lessons.reduce((s, l) => s + l.modules.length, 0);
    const wCompleted = w.lessons.reduce(
      (s, l) => s + l.modules.filter((m) => completedModules[`${l.id}-${m.id}`]).length,
      0
    );
    return wModules > 0 && wCompleted === wModules;
  }).length;
  const totalWorldsCount = allWorlds.length;

  const badges = [
    { name: "Prima Presa", icon: "🃏", desc: "Completa 1 modulo", earned: totalModulesCompleted >= 1 },
    { name: "Studente", icon: "📖", desc: "Completa 5 moduli", earned: totalModulesCompleted >= 5 },
    { name: "Impasse Riuscita", icon: "🎯", desc: "Completa 10 moduli", earned: totalModulesCompleted >= 10 },
    { name: "Praticante", icon: "🃏", desc: "Gioca 10 mani", earned: handsPlayed >= 10 },
    { name: "Streak 7gg", icon: "🔥", desc: "Streak di 7 giorni", earned: streak >= 7 },
    { name: "Colpo in Bianco", icon: "🎱", desc: "Completa 20 moduli", earned: totalModulesCompleted >= 20 },
    { name: "Veterano", icon: "🎖️", desc: "Gioca 50 mani", earned: handsPlayed >= 50 },
    { name: "Piccolo Slam", icon: "⭐", desc: "Raggiungi 500 XP", earned: xp >= 500 },
    { name: "Mondo Completo", icon: "🌍", desc: "Completa un mondo", earned: worldsCompleted >= 1 },
    { name: "Grande Slam", icon: "👑", desc: "Raggiungi 2000 XP", earned: xp >= 2000 },
    { name: "Diplomato", icon: "🎓", desc: "100% completamento", earned: completionPercent >= 100 },
    { name: "Campione", icon: "🏆", desc: "Top della classifica", earned: false },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  const stats = [
    { label: "Moduli completati", value: String(totalModulesCompleted), icon: "📚" },
    { label: "Mani giocate", value: String(handsPlayed), icon: "🃏" },
    { label: "Completamento", value: `${completionPercent}%`, icon: "✅" },
    { label: "XP totali", value: String(xp), icon: "⚡" },
    { label: "Streak attuale", value: String(streak), icon: "🔥" },
    { label: "Mondi completati", value: `${worldsCompleted}/${totalWorldsCount}`, icon: "🌍" },
  ];

  return (
    <div className="pt-6 px-5">
      <div className="mx-auto max-w-lg">
        {/* Login/Register CTA */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white text-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Accedi per salvare i progressi</p>
                <p className="text-[11px] text-gray-500">Sincronizza su tutti i dispositivi</p>
              </div>
              <Link href="/login">
                <Button className="h-9 px-4 rounded-xl bg-emerald-600 font-bold text-xs shadow-md">
                  Accedi
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Avatar className="h-18 w-18 shadow-lg shadow-emerald/20">
            {user && authProfile?.avatar_url ? (
              <img src={authProfile.avatar_url} alt="" className="h-18 w-18 rounded-full object-cover" />
            ) : (
              <AvatarFallback className="h-18 w-18 bg-gradient-to-br from-emerald to-emerald-dark text-white text-2xl font-extrabold">
                {user && authProfile?.display_name ? authProfile.display_name[0].toUpperCase() : "BQ"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {user && authProfile?.display_name ? authProfile.display_name : "Bridgista"}
            </h1>
            {user && authProfile?.bbo_username && (
              <p className="text-xs text-gray-500">BBO: {authProfile.bbo_username}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <Badge className="bg-emerald text-white font-bold text-xs">
                Livello {level}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs text-gray-500 border-gray-200"
              >
                {levelName}
              </Badge>
            </div>
          </div>
          <Link href="/impostazioni" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
        </motion.div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 card-elevated rounded-2xl bg-white p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Prossimo livello
              </p>
              <p className="text-xs text-gray-500">Livello {level + 1}: {nextLevelName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-emerald">{xpInLevel}</p>
              <p className="text-[11px] text-gray-400">/ 100 XP</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald to-emerald-light"
              initial={{ width: 0 }}
              animate={{ width: `${xpInLevel}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <div className="card-elevated rounded-2xl bg-white p-3.5 text-center">
                <span className="text-xl">{stat.icon}</span>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5 leading-tight">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <Separator className="my-6 bg-gray-100" />

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900">
              Achievement
            </h2>
            <Badge
              variant="outline"
              className="text-[11px] text-gray-500 border-gray-200"
            >
              {earnedCount} / {badges.length}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.03 }}
                className={`flex flex-col items-center gap-1.5 ${
                  !badge.earned ? "opacity-25 grayscale" : ""
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white card-elevated text-2xl">
                  {badge.icon}
                </div>
                <span className="text-[10px] text-center text-gray-500 font-semibold leading-tight">
                  {badge.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <Separator className="my-6 bg-gray-100" />

        {/* Course progress by world */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">
            Progresso per Corso
          </h2>
          <div className="space-y-4">
            {courses.map((course) => {
              const courseWorldsData = allWorlds.filter(w => course.worlds.some(cw => cw.id === w.id));
              if (courseWorldsData.length === 0) return null;
              return (
                <div key={course.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{course.icon}</span>
                    <p className="text-sm font-extrabold text-gray-700">{course.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${levelInfo[course.level].bg} ${levelInfo[course.level].color}`}>
                      {levelInfo[course.level].label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {courseWorldsData.map((w) => {
                      const wModules = w.lessons.reduce((s, l) => s + l.modules.length, 0);
                      const wCompleted = w.lessons.reduce(
                        (s, l) => s + l.modules.filter((m) => completedModules[`${l.id}-${m.id}`]).length,
                        0
                      );
                      const wPercent = wModules > 0 ? Math.round((wCompleted / wModules) * 100) : 0;
                      return (
                        <div key={w.id} className="card-elevated rounded-xl bg-white p-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${w.iconBg}`}>
                              {w.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-bold text-gray-900 truncate">{w.name}</p>
                                <span className="text-[11px] font-bold text-gray-400 tabular-nums">
                                  {wCompleted}/{wModules}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${w.gradient}`}
                                  style={{ width: `${wPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <Separator className="my-6 bg-gray-100" />

        {/* Profile selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">
            Stile di gioco
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "giovane" as const, emoji: "⚡", label: "Dinamico" },
              { id: "adulto" as const, emoji: "🃏", label: "Classico" },
              { id: "senior" as const, emoji: "☕", label: "Rilassato" },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setCurrentProfile(opt.id);
                  try { localStorage.setItem("bq_profile", opt.id); } catch {}
                }}
                className={`rounded-xl p-3 text-center transition-all active:scale-95 ${
                  currentProfile === opt.id
                    ? "bg-emerald-50 border-2 border-emerald shadow-sm"
                    : "bg-white border-2 border-gray-100 card-elevated"
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <p className={`text-xs font-bold mt-1 ${
                  currentProfile === opt.id ? "text-emerald-700" : "text-gray-600"
                }`}>
                  {opt.label}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        <Separator className="my-6 bg-gray-100" />

        {/* Fiches */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card-elevated rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-100 p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber/10 text-2xl">
                🪙
              </div>
              <div>
                <p className="font-extrabold text-gray-900">Fiches</p>
                <p className="text-xs text-gray-500">
                  Per cosmetici e bonus
                </p>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-dark">{Math.floor(xp / 10)}</p>
          </div>
        </motion.div>

        {/* Logout */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <button
              onClick={() => signOut()}
              className="w-full py-3 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              Esci dall'account
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
