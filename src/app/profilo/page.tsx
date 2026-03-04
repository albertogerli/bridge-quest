"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { courses, levelInfo } from "@/data/courses";
import { useSharedAuth } from "@/contexts/auth-provider";
import { ASD_LIST } from "@/data/asd-list";
import { getProfileConfig, type UserProfile } from "@/hooks/use-profile";
import { useShopCosmetics } from "@/hooks/use-shop-cosmetics";
import { useGameHistory } from "@/hooks/use-game-history";
import { StatsDashboard } from "@/components/stats-dashboard";
import {
  shareInvite, shareBadge, generateReferralCode, getReferralLink,
  copyReferralLink, shareViaWhatsApp, getInviteCount
} from "@/lib/share";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import {
  Spade, BookOpen, Target, Flame, Trophy, Star, Crown, GraduationCap,
  Globe, Medal, CheckCircle2, Zap, BookOpenCheck, BarChart3,
  Gamepad2, Coffee, Coins, Share2, UserPlus, Check, Copy, MessageCircle, Send,
  Sparkles, Snowflake
} from "lucide-react";
import { StreakFreezeCard } from "@/components/streak-freeze-card";
import { useSecretAchievements } from "@/hooks/use-secret-achievements";
import SecretAchievementPopup from "@/components/secret-achievement-popup";

const allWorlds = courses.flatMap(c => c.worlds);

const BQ_KEYS_PREFIX = "bq_";

export default function ProfiloPage() {
  const router = useRouter();
  const { user, profile: authProfile, loading: authLoading, signOut, updateProfile, uploadAvatar, refreshProfile } = useSharedAuth();
  const cosmetics = useShopCosmetics();
  const [editing, setEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBbo, setEditBbo] = useState("");
  const [editAsdSearch, setEditAsdSearch] = useState("");
  const [editAsdSelected, setEditAsdSelected] = useState("");
  const [showAsdDropdown, setShowAsdDropdown] = useState(false);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [currentProfile, setCurrentProfile] = useState<UserProfile>("adulto");
  const [advancedStatsOpen, setAdvancedStatsOpen] = useState(false);
  const [inviteToast, setInviteToast] = useState<string | null>(null);
  const [inviteXpToast, setInviteXpToast] = useState(false);
  const [sharedBadge, setSharedBadge] = useState<string | null>(null);
  const [invitesSent, setInvitesSent] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const referralCode = user?.id ? generateReferralCode(user.id) : null;
  const referralLink = user?.id ? getReferralLink(user.id) : getReferralLink();
  const { getStats } = useGameHistory();
  const gameStats = getStats();
  const { checkAchievements, earnedSecretAchievements, totalSecretAchievements } = useSecretAchievements();
  const [pendingAchievement, setPendingAchievement] = useState<{ id: string; name: string; icon: string; description: string } | null>(null);

  useEffect(() => {
    const newOnes = checkAchievements();
    if (newOnes.length > 0) {
      setPendingAchievement(newOnes[0]);
    }
  }, [checkAchievements]);

  useEffect(() => {
    try {
      setXp(parseInt(localStorage.getItem("bq_xp") || "0", 10));
      setStreak(parseInt(localStorage.getItem("bq_streak") || "0", 10));
      setHandsPlayed(parseInt(localStorage.getItem("bq_hands_played") || "0", 10));
      const cm = localStorage.getItem("bq_completed_modules");
      if (cm) setCompletedModules(JSON.parse(cm));
      const p = localStorage.getItem("bq_profile") as UserProfile | null;
      if (p) setCurrentProfile(p);
      setInvitesSent(getInviteCount());
    } catch {}
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
      // Hard redirect to force full page reload and clean auth state
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  }, [signOut]);

  const handleInvite = useCallback(async () => {
    const { outcome, xpAwarded } = await shareInvite(user?.id);
    if (outcome === "clipboard") {
      setInviteToast("Link copiato!");
      setTimeout(() => setInviteToast(null), 2500);
    } else if (outcome === "shared") {
      setInviteToast("Invito condiviso!");
      setTimeout(() => setInviteToast(null), 2500);
    }
    if (outcome !== "cancelled") {
      setInvitesSent(getInviteCount());
    }
    if (xpAwarded > 0) {
      setXp((prev) => prev + xpAwarded);
      setInviteXpToast(true);
      setTimeout(() => setInviteXpToast(false), 3000);
    }
  }, [user?.id]);

  const handleCopyLink = useCallback(async () => {
    await copyReferralLink(user?.id);
    setLinkCopied(true);
    setInvitesSent((prev) => {
      try {
        const count = parseInt(localStorage.getItem("bq_invites_sent") || "0", 10) + 1;
        localStorage.setItem("bq_invites_sent", String(count));
        return count;
      } catch { return prev; }
    });
    setTimeout(() => setLinkCopied(false), 2500);
  }, [user?.id]);

  const handleWhatsApp = useCallback(() => {
    const text = "Impara il Bridge con me su Bridge LAB! L'app ufficiale della FIGB per imparare a giocare a bridge.";
    shareViaWhatsApp(text, referralLink);
    setInvitesSent((prev) => {
      try {
        const count = parseInt(localStorage.getItem("bq_invites_sent") || "0", 10) + 1;
        localStorage.setItem("bq_invites_sent", String(count));
        return count;
      } catch { return prev; }
    });
  }, [referralLink]);

  const handleShareBadge = useCallback(async (badgeName: string) => {
    const outcome = await shareBadge(badgeName);
    if (outcome === "clipboard") {
      setSharedBadge(badgeName);
      setTimeout(() => setSharedBadge(null), 2500);
    } else if (outcome === "shared") {
      setSharedBadge(badgeName);
      setTimeout(() => setSharedBadge(null), 2500);
    }
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const profileKey = (typeof window !== "undefined" ? localStorage.getItem("bq_profile") : null) as UserProfile | null;
  const profileLevelNames = getProfileConfig(profileKey || "adulto").levelNames;
  const levelName = profileLevelNames[Math.min(level - 1, profileLevelNames.length - 1)];
  const nextLevelName = profileLevelNames[Math.min(level, profileLevelNames.length - 1)];

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
    { name: "Prima Presa", icon: <Spade className="w-6 h-6" />, desc: "Completa 1 modulo", earned: totalModulesCompleted >= 1 },
    { name: "Studente", icon: <BookOpenCheck className="w-6 h-6" />, desc: "Completa 5 moduli", earned: totalModulesCompleted >= 5 },
    { name: "Impasse Riuscita", icon: <Target className="w-6 h-6" />, desc: "Completa 10 moduli", earned: totalModulesCompleted >= 10 },
    { name: "Praticante", icon: <Gamepad2 className="w-6 h-6" />, desc: "Gioca 10 mani", earned: handsPlayed >= 10 },
    { name: "Streak 7gg", icon: <Flame className="w-6 h-6" />, desc: "Streak di 7 giorni", earned: streak >= 7 },
    { name: "Colpo in Bianco", icon: <Target className="w-6 h-6" />, desc: "Completa 20 moduli", earned: totalModulesCompleted >= 20 },
    { name: "Veterano", icon: <Medal className="w-6 h-6" />, desc: "Gioca 50 mani", earned: handsPlayed >= 50 },
    { name: "Piccolo Slam", icon: <Star className="w-6 h-6" />, desc: "Raggiungi 500 XP", earned: xp >= 500 },
    { name: "Mondo Completo", icon: <Globe className="w-6 h-6" />, desc: "Completa un mondo", earned: worldsCompleted >= 1 },
    { name: "Grande Slam", icon: <Crown className="w-6 h-6" />, desc: "Raggiungi 2000 XP", earned: xp >= 2000 },
    { name: "Diplomato", icon: <GraduationCap className="w-6 h-6" />, desc: "100% completamento", earned: completionPercent >= 100 },
    { name: "Campione", icon: <Trophy className="w-6 h-6" />, desc: "Top della classifica", earned: false },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  const stats = [
    { label: "Moduli completati", value: String(totalModulesCompleted), icon: <BookOpen className="w-5 h-5 text-indigo-500" /> },
    { label: "Mani giocate", value: String(handsPlayed), icon: <Spade className="w-5 h-5 text-gray-700" /> },
    { label: "Completamento", value: `${completionPercent}%`, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
    { label: "XP totali", value: String(xp), icon: <Zap className="w-5 h-5 text-amber-500" /> },
    { label: "Streak attuale", value: String(streak), icon: <Flame className="w-5 h-5 text-orange-500" /> },
    { label: "Mondi completati", value: `${worldsCompleted}/${totalWorldsCount}`, icon: <Globe className="w-5 h-5 text-blue-500" /> },
  ];

  return (
    <div className="pt-6 px-5">
      <div className="mx-auto max-w-lg">
        {/* Login/Register CTA */}
        {!authLoading && !user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-[#003DA5]/5 rounded-2xl p-4 border-2 border-[#003DA5]/20 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003DA5] text-white text-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Accedi per salvare i progressi</p>
                <p className="text-[11px] text-gray-500">Sincronizza su tutti i dispositivi</p>
              </div>
              <a href="/login" className="inline-flex h-9 px-4 items-center rounded-xl bg-[#003DA5] text-white font-semibold text-xs shadow-md hover:bg-[#003DA5]/90 transition-colors">
                Accedi
              </a>
            </div>
          </motion.div>
        )}

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Avatar className={`h-18 w-18 shadow-lg shadow-[#003DA5]/20 ${cosmetics.avatarFrame || ""}`}>
            {user && authProfile?.avatar_url ? (
              <img src={authProfile.avatar_url} alt="Foto profilo" className="h-18 w-18 rounded-full object-cover" />
            ) : (
              <AvatarFallback className="h-18 w-18 bg-[#003DA5] text-white text-2xl font-bold">
                {user && authProfile?.display_name ? authProfile.display_name[0].toUpperCase() : "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {user && authProfile?.display_name ? authProfile.display_name : "Bridgista"}
            </h1>
            {cosmetics.activeTitle && (
              <p className="text-xs font-semibold text-[#003DA5]">{cosmetics.activeTitle}</p>
            )}
            {user && authProfile?.bbo_username && (
              <p className="text-xs text-gray-500">BBO: {authProfile.bbo_username}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <Badge className="bg-[#003DA5] text-white font-medium text-xs">
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
          className="mt-6 card-clean rounded-2xl bg-white p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Prossimo livello
              </p>
              <p className="text-xs text-gray-500">Livello {level + 1}: {nextLevelName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#003DA5]">{xpInLevel}</p>
              <p className="text-[11px] text-gray-400">/ 100 XP</p>
            </div>
          </div>
          <div className="h-3.5 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#003DA5] to-[#0052CC]"
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
              <div className="rounded-2xl bg-white p-3.5 text-center border-2 border-[#e5e7eb] shadow-sm">
                <span className="flex items-center justify-center">{stat.icon}</span>
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5 leading-tight">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Advanced Stats - Expandable */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mt-4"
        >
          <button
            onClick={() => setAdvancedStatsOpen(!advancedStatsOpen)}
            className="w-full rounded-2xl bg-white p-4 text-left border-2 border-[#e5e7eb] shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003DA5] text-white text-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Statistiche Avanzate</p>
                <p className="text-[11px] text-gray-500">
                  {gameStats.totalGames > 0
                    ? `${gameStats.totalGames} partite · ${gameStats.winRate}% vittorie`
                    : "Gioca per sbloccare le statistiche"}
                </p>
              </div>
              <motion.svg
                animate={{ rotate: advancedStatsOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polyline points="9,6 15,12 9,18" />
              </motion.svg>
            </div>
          </button>
          <AnimatePresence>
            {advancedStatsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <StatsDashboard stats={gameStats} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bridge Wrapped link */}
          <Link
            href="/profilo/wrapped"
            className="mt-3 w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 flex items-center gap-3 hover:shadow-lg transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Bridge Wrapped</p>
              <p className="text-[11px] text-white/70">Le tue statistiche del mese</p>
            </div>
            <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9,6 15,12 9,18" /></svg>
          </Link>
        </motion.div>

        {/* Streak Freeze */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-4"
        >
          <StreakFreezeCard streak={streak} xp={xp} />
        </motion.div>

        <Separator className="my-6 bg-[#e5e7eb]" />

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
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
                className={`relative flex flex-col items-center gap-1.5 ${
                  !badge.earned ? "opacity-25 grayscale" : ""
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border-2 border-[#e5e7eb] shadow-sm text-2xl">
                  {badge.icon}
                </div>
                {badge.earned && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShareBadge(badge.name); }}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#003DA5] text-white shadow-sm hover:bg-[#002E7A] transition-colors"
                    title="Condividi badge"
                  >
                    {sharedBadge === badge.name ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <Share2 className="w-2.5 h-2.5" />
                    )}
                  </button>
                )}
                <span className="text-[10px] text-center text-gray-500 font-semibold leading-tight">
                  {badge.name}
                </span>
              </motion.div>
            ))}
          </div>
          {/* Badge share toast */}
          <AnimatePresence>
            {sharedBadge && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-3 text-center"
              >
                <span className="inline-flex items-center gap-1.5 bg-[#003DA5]/10 text-[#003DA5] text-xs font-bold rounded-full px-3 py-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Badge condiviso!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Secret Achievements */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500" />
                Achievement Segreti
              </h3>
              <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-200">
                {earnedSecretAchievements.length} / {totalSecretAchievements}
              </Badge>
            </div>
            {earnedSecretAchievements.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {earnedSecretAchievements.map((a) => (
                  <div key={a.id} className="flex flex-col items-center gap-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 border border-amber-200 text-xl">
                      {a.icon}
                    </div>
                    <span className="text-[9px] text-center text-amber-700 font-semibold leading-tight">{a.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                <span className="text-lg">🔒</span>
                <p className="text-xs text-amber-700">
                  Ci sono <span className="font-bold">{totalSecretAchievements} achievement nascosti</span> da scoprire. Gioca, esplora e completa sfide per sbloccarli!
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <Separator className="my-6 bg-[#e5e7eb]" />

        {/* Course progress by world */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
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
                    <p className="text-sm font-semibold text-gray-700">{course.name}</p>
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
                        <div key={w.id} className="rounded-xl bg-white p-3.5 border-2 border-[#e5e7eb] shadow-sm">
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
                              <div className="h-2.5 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
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

        {/* Edit Profile — logged-in users only */}
        {user && (
          <>
            <Separator className="my-6 bg-[#e5e7eb]" />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.47 }}
            >
              {!editing ? (
                <button
                  onClick={() => {
                    setEditName(authProfile?.display_name || "");
                    setEditBbo(authProfile?.bbo_username || "");
                    setEditAsdSelected("");
                    setEditAvatarFile(null);
                    setEditAvatarPreview("");
                    setEditing(true);
                  }}
                  className="w-full rounded-2xl bg-white p-4 text-left border-2 border-[#e5e7eb] shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">Modifica profilo</p>
                      <p className="text-[11px] text-gray-500">Foto, nome, BBO, associazione</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="9,6 15,12 9,18" />
                    </svg>
                  </div>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-white p-5 border-2 border-[#e5e7eb] shadow-sm"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Modifica profilo</h3>

                  {/* Avatar upload */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-16 w-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {editAvatarPreview ? (
                        <img src={editAvatarPreview} alt="Foto profilo" className="h-full w-full object-cover" />
                      ) : authProfile?.avatar_url ? (
                        <img src={authProfile.avatar_url} alt="Foto profilo" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl">{(authProfile?.display_name || "B")[0].toUpperCase()}</span>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                        Cambia foto
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditAvatarFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setEditAvatarPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Name */}
                  <div className="mb-3">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Nome</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5]"
                    />
                  </div>

                  {/* BBO */}
                  <div className="mb-3">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Username BBO</label>
                    <input
                      type="text"
                      value={editBbo}
                      onChange={(e) => setEditBbo(e.target.value)}
                      placeholder="Il tuo username su BridgeBase Online"
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5]"
                    />
                  </div>

                  {/* ASD */}
                  <div className="mb-4 relative">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Associazione (ASD)</label>
                    <input
                      type="text"
                      value={editAsdSelected || editAsdSearch}
                      onChange={(e) => {
                        setEditAsdSearch(e.target.value);
                        setEditAsdSelected("");
                        setShowAsdDropdown(true);
                      }}
                      onFocus={() => setShowAsdDropdown(true)}
                      placeholder="Cerca la tua associazione..."
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5]"
                    />
                    {showAsdDropdown && !editAsdSelected && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowAsdDropdown(false)} />
                        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl max-h-40 overflow-y-auto">
                          {ASD_LIST.filter((a) => !editAsdSearch || a.toLowerCase().includes(editAsdSearch.toLowerCase())).slice(0, 15).map((asd) => (
                            <button
                              key={asd}
                              type="button"
                              onClick={() => { setEditAsdSelected(asd); setEditAsdSearch(""); setShowAsdDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              {asd}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                      className="flex-1 h-10 rounded-xl font-semibold text-xs"
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={async () => {
                        setSaving(true);
                        const updates: Record<string, unknown> = {};
                        if (editName.trim()) updates.display_name = editName.trim();
                        if (editBbo !== (authProfile?.bbo_username || "")) updates.bbo_username = editBbo.trim() || null;
                        if (editAsdSelected) {
                          const idx = ASD_LIST.indexOf(editAsdSelected as typeof ASD_LIST[number]);
                          if (idx >= 0) updates.asd_id = idx + 1;
                        }
                        if (Object.keys(updates).length > 0) {
                          await updateProfile(updates);
                        }
                        if (editAvatarFile) {
                          await uploadAvatar(editAvatarFile);
                        }
                        await refreshProfile();
                        setSaving(false);
                        setEditing(false);
                      }}
                      disabled={saving}
                      className="flex-1 h-10 rounded-xl bg-[#003DA5] font-semibold text-xs shadow-md disabled:opacity-50"
                    >
                      {saving ? "Salvataggio..." : "Salva"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}

        <Separator className="my-6 bg-[#e5e7eb]" />

        {/* Profile selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Stile di gioco
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "junior" as const, icon: <Gamepad2 className="w-6 h-6" />, label: "Explorer" },
              { id: "giovane" as const, icon: <Zap className="w-6 h-6" />, label: "Dinamico" },
              { id: "adulto" as const, icon: <Spade className="w-6 h-6" />, label: "Classico" },
              { id: "senior" as const, icon: <Coffee className="w-6 h-6" />, label: "Rilassato" },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setCurrentProfile(opt.id);
                  try { localStorage.setItem("bq_profile", opt.id); } catch {}
                }}
                className={`rounded-xl p-3 text-center transition-all active:scale-95 ${
                  currentProfile === opt.id
                    ? "bg-[#003DA5]/10 border-[3px] border-[#003DA5] shadow-sm"
                    : "bg-white border-2 border-[#e5e7eb] shadow-sm"
                }`}
              >
                <span className={`flex items-center justify-center ${currentProfile === opt.id ? "text-[#003DA5]" : "text-gray-500"}`}>{opt.icon}</span>
                <p className={`text-xs font-bold mt-1 ${
                  currentProfile === opt.id ? "text-[#003DA5]" : "text-gray-600"
                }`}>
                  {opt.label}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        <Separator className="my-6 bg-[#e5e7eb]" />

        {/* Fiches */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-300 shadow-sm p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber/10">
                <Coins className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Fiches</p>
                <p className="text-xs text-gray-500">
                  Per cosmetici e bonus
                </p>
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-dark">{Math.floor(xp / 10)}</p>
          </div>
          <Link
            href="/negozio"
            className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold h-11 text-sm shadow-md shadow-amber-500/20 transition-all active:scale-[0.97]"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Vai al Negozio
          </Link>
        </motion.div>

        {/* Invita un Amico */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="mb-6"
        >
          <div className="rounded-2xl bg-gradient-to-r from-[#003DA5]/5 to-indigo-50 border-2 border-[#003DA5]/20 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#003DA5] text-white shadow-md shadow-[#003DA5]/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Invita un Amico</p>
                <p className="text-xs text-gray-500">
                  Condividi Bridge LAB e guadagna +25 XP
                </p>
              </div>
              {invitesSent > 0 && (
                <div className="flex items-center gap-1.5 bg-[#003DA5]/10 rounded-full px-3 py-1">
                  <Send className="w-3 h-3 text-[#003DA5]" />
                  <span className="text-[11px] font-bold text-[#003DA5]">
                    {invitesSent} invit{invitesSent === 1 ? "o" : "i"}
                  </span>
                </div>
              )}
            </div>

            {/* Referral code card */}
            {referralCode && (
              <div className="mb-4 rounded-xl bg-white/80 border border-[#003DA5]/10 p-3.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Il tuo codice referral
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-lg font-bold text-[#003DA5] tracking-widest">
                    {referralCode}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-lg bg-[#003DA5]/10 hover:bg-[#003DA5]/20 text-[#003DA5] px-3 py-1.5 text-xs font-bold transition-colors"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copia link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Share buttons row */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* WhatsApp button */}
              <Button
                onClick={handleWhatsApp}
                className="rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold h-11 text-sm shadow-md shadow-[#25D366]/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              {/* Generic share button */}
              <Button
                onClick={handleInvite}
                className="rounded-xl bg-[#003DA5] hover:bg-[#002E7A] text-white font-semibold h-11 text-sm shadow-md shadow-[#003DA5]/20 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Condividi
              </Button>
            </div>

            {/* Invite toast feedback */}
            <AnimatePresence>
              {inviteToast && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3 text-center"
                >
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full px-3 py-1.5">
                    <Check className="h-3.5 w-3.5" />
                    {inviteToast}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* XP award toast */}
            <AnimatePresence>
              {inviteXpToast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mt-2 text-center"
                >
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full px-3 py-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    +25 XP guadagnati!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Logout / Login */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          {user ? (
            <AnimatePresence mode="wait">
              {showLogoutConfirm ? (
                <motion.div
                  key="logout-confirm"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl bg-white border-2 border-rose-200 shadow-sm p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Vuoi anche cancellare i dati locali?</p>
                      <p className="text-[11px] text-gray-500">I progressi locali possono essere mantenuti o rimossi</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleLogout(true)}
                      disabled={loggingOut}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold h-10 shadow-md disabled:opacity-50"
                    >
                      {loggingOut ? "Uscita..." : "Esci e cancella dati locali"}
                    </Button>
                    <Button
                      onClick={() => handleLogout(false)}
                      disabled={loggingOut}
                      variant="outline"
                      className="w-full rounded-xl text-sm font-semibold h-10 border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {loggingOut ? "Uscita..." : "Esci e mantieni dati locali"}
                    </Button>
                    <Button
                      onClick={() => setShowLogoutConfirm(false)}
                      variant="outline"
                      className="w-full rounded-xl text-sm font-semibold h-10 border-gray-300 text-gray-600"
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
                    className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold h-12 text-sm border-2 shadow-sm"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Esci dall&apos;account
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <a
              href="/login"
              className="flex items-center justify-center w-full rounded-xl bg-[#003DA5] text-white font-semibold h-12 text-sm shadow-lg shadow-[#003DA5]/20 hover:opacity-90 transition-opacity"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Accedi o Registrati
            </a>
          )}
        </motion.div>
      </div>

      {/* Secret Achievement Popup */}
      <SecretAchievementPopup
        achievement={pendingAchievement}
        onClose={() => setPendingAchievement(null)}
      />
    </div>
  );
}
