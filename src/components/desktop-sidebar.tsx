"use client";

import Link from "next/link";
import Image from "next/image";
import { useStats } from "@/hooks/use-local-stats";
import { useSpacedReview } from "@/hooks/use-spaced-review";
import { useWeeklyObjectives } from "@/hooks/use-weekly-objectives";
import { useCollectibleCards } from "@/store/use-collectible-cards-store";
import { useProfile } from "@/hooks/use-profile";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useT } from "@/contexts/traduzioni-provider";

export function DesktopSidebar() {
  const t = useT();
  const stats = useStats();
  const profile = useProfile();
  const { user, signOut } = useSharedAuth();
  useSpacedReview();
  useWeeklyObjectives();
  useCollectibleCards();

  return (
    <aside className="hidden lg:block w-[320px] shrink-0" aria-label="Barra laterale">
      <div className="sticky top-6 space-y-4 pb-6">

        {/* Level & XP */}
        <div className="rounded-2xl bg-card card-clean p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Livello {stats.level}</p>
                <p className="text-[12px] text-muted-foreground font-medium">{stats.levelName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{stats.xp.toLocaleString()}</p>
              <p className="text-[12px] text-muted-foreground font-medium">{profile.xpLabel} totali</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-muted border border-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-figb to-figb-light transition-all"
              style={{ width: `${stats.levelProgress}%` }}
            />
          </div>
          <p className="text-[12px] text-muted-foreground mt-1.5 font-medium">
            {stats.xpInLevel.toLocaleString()} / {stats.xpNeededForNext.toLocaleString()} {profile.xpLabel} · {stats.totalModulesCompleted}/{stats.totalModulesAvailable} moduli
          </p>
        </div>

        {/* Streak */}
        <div className="rounded-2xl bg-card card-clean p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{stats.streak >= 7 ? "🔥" : "📅"}</span>
              <p className="text-sm font-semibold text-foreground">
                Streak: {stats.streak} {stats.streak === 1 ? "giorno" : "giorni"}
              </p>
            </div>
            {stats.streak > 0 && (
              <span className="text-[12px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                {`+${Math.min(stats.streak * 5, 50)} ${profile.xpLabel}/giorno`}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {["L", "M", "M", "G", "V", "S", "D"].map((day, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 flex-1 items-center justify-center rounded-lg text-[12px] font-bold ${
                  i < Math.min(stats.streak, 7)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Continue CTA */}
        {stats.nextModule && (
          <Link href={`/lezioni/${stats.nextModule.lessonId}/${stats.nextModule.moduleId}`} aria-label={`Riprendi: ${stats.nextModule.moduleTitle}`}>
            <div className="rounded-2xl bg-gradient-to-r from-figb to-figb-light p-4 text-white shadow-sm hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stats.nextModule.lessonIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-white/70 uppercase tracking-wider">{t("Riprendi")}</p>
                  <p className="text-sm font-semibold truncate">{stats.nextModule.moduleTitle}</p>
                </div>
                <svg className="h-5 w-5 text-white/60 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* Account */}
        {user ? (
          <button
            onClick={async () => {
              await signOut();
              try { localStorage.removeItem("bq_guest"); } catch {}
              window.location.href = "/";
            }}
            aria-label="Esci dal tuo account"
            className="w-full flex items-center gap-2.5 rounded-xl bg-card card-clean p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 group-hover:bg-rose-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground/80 group-hover:text-rose-600">{t("Esci")}</p>
              <p className="text-[12px] text-muted-foreground">{user.email}</p>
            </div>
          </button>
        ) : stats.xp > 0 ? (
          <Link
            href="/login"
            aria-label="Accedi per sincronizzare"
            className="w-full flex items-center gap-2.5 rounded-xl bg-card card-clean p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                <path d="M4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-semibold text-foreground/80">Livello {stats.level} · {stats.xp} XP</p>
              <p className="text-[12px] text-muted-foreground group-hover:text-indigo-500 transition-colors">{t("Accedi per sincronizzare →")}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            aria-label="Accedi o Registrati"
            className="w-full flex items-center gap-2.5 rounded-xl bg-figb p-3 hover:bg-figb-dark transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">{t("Accedi o Registrati")}</p>
          </Link>
        )}

        {/* FIGB + CONI logos */}
        <div className="rounded-xl bg-figb/5 dark:bg-primary/10 border border-figb/15 dark:border-primary/20 p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-4">
            <Image src="/icons/logo-figb.png" alt="FIGB" width={400} height={355} className="h-10 w-auto" />
            <Image src="/icons/logo-coni.png" alt="CONI - Disciplina Sportiva Associata" width={400} height={146} className="h-8 w-auto" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-figb dark:text-primary uppercase tracking-wider">
              {t("Un progetto della FIGB")}
            </p>
            <p className="text-[12px] text-figb dark:text-primary mt-0.5">
              {t("Commissione Insegnamento")}
            </p>
            <p className="text-[12px] text-figb dark:text-primary mt-1">
              {t("Sviluppo: A. G. Gerli / Tourbillon Tech")}
            </p>
          </div>
        </div>

      </div>
    </aside>
  );
}
