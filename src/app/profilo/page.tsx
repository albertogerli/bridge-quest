"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useGameStore } from "@/store/use-game-store";
import type { UserProfile } from "@/hooks/use-profile";
import {
  shareInvite, shareBadge, generateReferralCode, getReferralLink,
  copyReferralLink, shareViaWhatsApp, getInviteCount, incrementInviteCount
} from "@/lib/share";
import { StreakFreezeCard } from "@/components/streak-freeze-card";
// Popup di achievement segreto: compare solo quando se ne sblocca uno.
const SecretAchievementPopup = dynamic(
  () => import("@/components/secret-achievement-popup"),
  { ssr: false },
);
import { reportError } from "@/lib/report-error";
import { toast } from "sonner";
import { BQ_KEYS_PREFIX } from "./_types";
import { useProfileData } from "./_use-profile-data";
import { useProfileEdit } from "./_use-profile-edit";
import { LoginCta } from "./_components/login-cta";
import { ProfileHeader } from "./_components/profile-header";
import { LevelProgressCard } from "./_components/level-progress-card";
import { QuickStats } from "./_components/quick-stats";
import { AdvancedStatsSection } from "./_components/advanced-stats-section";
import { ChallengeHistorySection } from "./_components/challenge-history-section";
import { BadgesSection } from "./_components/badges-section";
import { CourseProgressSection } from "./_components/course-progress-section";
import { EditProfileSection } from "./_components/edit-profile-section";
import { ProfileStyleSelector } from "./_components/profile-style-selector";
import { FichesCard } from "./_components/fiches-card";
import { InviteFriendSection } from "./_components/invite-friend-section";
import { AccountActions } from "./_components/account-actions";

export default function ProfiloPage() {
  const { user, profile: authProfile, loading: authLoading, signOut } = useSharedAuth();
  const data = useProfileData();
  const edit = useProfileEdit();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [advancedStatsOpen, setAdvancedStatsOpen] = useState(false);
  const [challengeHistoryOpen, setChallengeHistoryOpen] = useState(false);
  const [inviteToast, setInviteToast] = useState<string | null>(null);
  const [inviteXpToast, setInviteXpToast] = useState(false);
  const [sharedBadge, setSharedBadge] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const referralCode = user?.id ? generateReferralCode(user.id) : null;
  const referralLink = user?.id ? getReferralLink(user.id) : getReferralLink();

  const { setInvitesSent, setCurrentProfile } = data;

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
      reportError("profilo:logout", err);
      toast.error("Uscita non riuscita. Riprova.");
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  }, [signOut]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      if (user?.id) {
        // Cancellazione dei dati personali. `profiles` va per ultimo: le
        // tabelle che lo referenziano (login_history, email_events,
        // tournament_results) spariscono a cascata.
        //
        // NB: le colonne sono `challenger_id`/`opponent_id`. Prima la seconda
        // delete usava `challenged_id`, colonna inesistente: falliva in
        // silenzio e le sfide RICEVUTE restavano nel database.
        const deletions: Array<[string, PromiseLike<{ error: unknown }>]> = [
          ["completed_modules", supabase.from("completed_modules").delete().eq("user_id", user.id)],
          ["badges", supabase.from("badges").delete().eq("user_id", user.id)],
          ["review_items", supabase.from("review_items").delete().eq("user_id", user.id)],
          ["challenges:challenger", supabase.from("challenges").delete().eq("challenger_id", user.id)],
          ["challenges:opponent", supabase.from("challenges").delete().eq("opponent_id", user.id)],
          ["friendships:user", supabase.from("friendships").delete().eq("user_id", user.id)],
          ["friendships:friend", supabase.from("friendships").delete().eq("friend_id", user.id)],
          ["profiles", supabase.from("profiles").delete().eq("id", user.id)],
        ];

        for (const [table, query] of deletions) {
          const { error } = await query;
          // Un fallimento non deve restare invisibile: senza questo, dati
          // personali sopravvivono a un'eliminazione dichiarata completa.
          if (error) reportError(`profilo:delete-account:${table}`, error);
        }
      }
      // Clear all local data
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(BQ_KEYS_PREFIX));
      keys.forEach((k) => localStorage.removeItem(k));
      try { localStorage.removeItem("bq_guest"); } catch {}
      await signOut();
      window.location.href = "/";
    } catch (err) {
      reportError("profilo:delete-account", err);
      toast.error("Eliminazione account non riuscita. Riprova.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [user, signOut]);

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
      useGameStore.getState().addXp(xpAwarded);
      setInviteXpToast(true);
      setTimeout(() => setInviteXpToast(false), 3000);
    }
  }, [user?.id, setInvitesSent]);

  /**
   * Registra un invito: l'incremento su localStorage sta FUORI dall'updater di
   * `setInvitesSent`. Sotto StrictMode React invoca l'updater due volte, e un
   * side effect lì dentro contava l'invito due volte.
   */
  const registerInviteSent = useCallback(() => {
    const count = incrementInviteCount();
    if (count > 0) setInvitesSent(count);
  }, [setInvitesSent]);

  const handleCopyLink = useCallback(async () => {
    await copyReferralLink(user?.id);
    setLinkCopied(true);
    registerInviteSent();
    setTimeout(() => setLinkCopied(false), 2500);
  }, [user?.id, registerInviteSent]);

  const handleWhatsApp = useCallback(() => {
    const text = "Impara il Bridge con me su Bridge LAB! L'app ufficiale della FIGB per imparare a giocare a bridge.";
    shareViaWhatsApp(text, referralLink);
    registerInviteSent();
  }, [referralLink, registerInviteSent]);

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

  const handleSelectProfile = useCallback((profile: UserProfile) => {
    setCurrentProfile(profile);
    try { localStorage.setItem("bq_profile", profile); } catch {}
  }, [setCurrentProfile]);

  return (
    <div className="pt-6 px-5">
      <div className="mx-auto max-w-6xl">
        {/* Login/Register CTA */}
        {!authLoading && !user && <LoginCta />}

        {/* Profile header */}
        <ProfileHeader
          user={user}
          authProfile={authProfile}
          cosmetics={data.cosmetics}
          level={data.level}
          levelName={data.levelName}
        />

        {/* Stats Card with Progress Ring */}
        <LevelProgressCard
          level={data.level}
          levelName={data.levelName}
          nextLevelName={data.nextLevelName}
          streak={data.streak}
          levelProgress={data.levelProgress}
          xpInLevel={data.xpInLevel}
          xpForNext={data.xpForNext}
          xp={data.xp}
        />

        {/* Quick stats */}
        <QuickStats
          totalModulesCompleted={data.totalModulesCompleted}
          handsPlayed={data.handsPlayed}
          completionPercent={data.completionPercent}
          worldsCompleted={data.worldsCompleted}
          totalWorldsCount={data.totalWorldsCount}
        />

        {/* Advanced Stats - Expandable */}
        <AdvancedStatsSection
          open={advancedStatsOpen}
          onToggle={() => setAdvancedStatsOpen(!advancedStatsOpen)}
          gameStats={data.gameStats}
          gamesPerDay={data.gamesPerDay}
          courseCompetence={data.courseCompetence}
          gamePerformanceStats={data.gamePerformanceStats}
        />

        {/* Challenge History IMP */}
        {user && (
          <ChallengeHistorySection
            userId={user.id}
            open={challengeHistoryOpen}
            onToggle={() => setChallengeHistoryOpen(!challengeHistoryOpen)}
            challengeStats={data.challengeStats}
            challengeHistory={data.challengeHistory}
          />
        )}

        {/* Streak Freeze */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-4"
        >
          <StreakFreezeCard streak={data.streak} xp={data.xp} />
        </motion.div>

        <Separator className="my-6 bg-border" />

        {/* Badges */}
        <BadgesSection
          badges={data.badges}
          earnedCount={data.earnedCount}
          sharedBadge={sharedBadge}
          onShareBadge={handleShareBadge}
          earnedSecretAchievements={data.earnedSecretAchievements}
          totalSecretAchievements={data.totalSecretAchievements}
        />

        <Separator className="my-6 bg-border" />

        {/* Course progress by world */}
        <CourseProgressSection
          courses={data.courses}
          allWorlds={data.allWorlds}
          completedModules={data.completedModules}
        />

        {/* Edit Profile — logged-in users only */}
        {user && <EditProfileSection edit={edit} authProfile={authProfile} />}

        <Separator className="my-6 bg-border" />

        {/* Profile selector */}
        <ProfileStyleSelector
          currentProfile={data.currentProfile}
          onSelect={handleSelectProfile}
        />

        <Separator className="my-6 bg-border" />

        {/* Fiches */}
        <FichesCard xp={data.xp} />

        {/* Invita un Amico */}
        <InviteFriendSection
          referralCode={referralCode}
          invitesSent={data.invitesSent}
          linkCopied={linkCopied}
          inviteToast={inviteToast}
          inviteXpToast={inviteXpToast}
          onCopyLink={handleCopyLink}
          onWhatsApp={handleWhatsApp}
          onInvite={handleInvite}
        />

        {/* Logout / Login */}
        <AccountActions
          user={user}
          showLogoutConfirm={showLogoutConfirm}
          onShowLogoutConfirm={setShowLogoutConfirm}
          loggingOut={loggingOut}
          onLogout={handleLogout}
          showDeleteConfirm={showDeleteConfirm}
          onShowDeleteConfirm={setShowDeleteConfirm}
          deleting={deleting}
          onDeleteAccount={handleDeleteAccount}
        />
      </div>

      {/* Secret Achievement Popup */}
      {data.achievementPopupArmed && (
        <SecretAchievementPopup
          achievement={data.pendingAchievement}
          onClose={() => data.setPendingAchievement(null)}
        />
      )}
    </div>
  );
}
