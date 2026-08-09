"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useAsdClubBySlug } from "@/store/use-asd-store";
import { useSharedAuth } from "@/contexts/auth-provider";
import { getProfileConfig, type UserProfile } from "@/hooks/use-profile";
import { getLevel as getLevelFromXp } from "@/lib/xp-levels";
import { ChevronRight, Users, Zap, TrendingUp, ArrowLeft } from "lucide-react";

const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

const avatarColors = [
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "bg-figb/10 text-figb dark:bg-primary/15 dark:text-primary",
  "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
  "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
];

function getLevel(xp: number) {
  const level = getLevelFromXp(xp);
  const profileKey = (typeof window !== "undefined" ? localStorage.getItem("bq_profile") : null) as UserProfile | null;
  const names = getProfileConfig(profileKey || "adulto").levelNames;
  return { level, name: names[Math.min(level - 1, names.length - 1)] };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("it-IT").format(value);
}

interface ClubMember {
  id: string;
  display_name: string;
  xp: number;
  avatar_url: string | null;
  updated_at: string;
}

interface ClubStats {
  member_count: number;
  total_xp: number;
  avg_xp: number;
}

export default function CircoloPage() {
  const params = useParams();
  const slug = params.slug as string;
  const club = useAsdClubBySlug(slug);
  const asdCode = club?.code;
  const asdName = club?.name;

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get current user from shared auth context
  let currentUserId: string | null = null;
  try {
    const auth = useSharedAuth();
    currentUserId = auth.user?.id ?? null;
  } catch {
    // AuthProvider not available (e.g. direct access), fall back to Supabase check
  }

  useEffect(() => {
    if (!asdCode) {
      setLoading(false);
      return;
    }

    const fetchClubData = async () => {
      // Safety timeout: never stay loading forever
      const safetyTimer = setTimeout(() => {
        setLoading(false);
      }, 8000);

      try {
        const supabase = createClient();

        // Try to get current user if not already resolved via context
        // (local copy: the render-scope variable must not be reassigned here)
        let resolvedUserId = currentUserId;
        if (!resolvedUserId) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) resolvedUserId = user.id;
          } catch {}
        }

        // Fetch club stats via RPC
        const { data: statsData, error: statsError } = await supabase.rpc(
          "get_club_stats",
          { p_asd_code: asdCode }
        );

        if (statsError) {
          console.warn("Club stats fetch error:", statsError.message);
        }

        if (statsData && Array.isArray(statsData) && statsData.length > 0) {
          setStats(statsData[0] as ClubStats);
        } else if (statsData && !Array.isArray(statsData)) {
          setStats(statsData as unknown as ClubStats);
        }

        // Fetch club leaderboard via RPC
        const { data: membersData, error: membersError } = await supabase.rpc(
          "get_club_leaderboard",
          { p_asd_code: asdCode }
        );

        if (membersError) {
          console.warn("Club leaderboard fetch error:", membersError.message);
        }

        if (membersData && Array.isArray(membersData)) {
          setMembers(
            membersData.map((m: Record<string, unknown>) => ({
              id: m.id as string,
              display_name: m.display_name as string,
              xp: (m.xp as number) || 0,
              avatar_url: (m.avatar_url as string) || null,
              updated_at: m.updated_at as string,
            }))
          );
        }
      } catch (err) {
        console.warn("Club data fetch failed:", err);
        setError(true);
      }

      clearTimeout(safetyTimer);
      setLoading(false);
    };

    fetchClubData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentUserId è solo un seed opzionale (fallback interno via getUser): includerlo rifarebbe il fetch del circolo a ogni cambio di sessione
  }, [asdCode]);

  // Club not found
  if (!asdCode || !asdName) {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="card-clean rounded-2xl bg-card p-8 mx-auto max-w-sm">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <h1 className="text-lg font-bold text-foreground mb-2">
                Circolo non trovato
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Il circolo che cerchi non esiste o il link non è corretto.
              </p>
              <Link href="/classifica">
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 bg-figb hover:bg-figb-dark text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Torna alla classifica
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4"
        >
          <Link
            href="/classifica"
            className="hover:text-figb dark:hover:text-primary transition-colors font-medium"
          >
            Classifica
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground/80 font-semibold truncate max-w-[200px]">
            {asdName}
          </span>
        </motion.nav>

        {/* Header card with gradient */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-gradient-to-br from-figb to-figb-light p-5 shadow-lg shadow-figb/20 mb-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white text-2xl font-bold flex-shrink-0 backdrop-blur-sm">
              {asdName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white leading-tight truncate">
                {asdName}
              </h1>
              <p className="text-xs text-white/60 mt-0.5">
                Classifica interna del circolo
              </p>
            </div>
          </div>

          {/* Stats bar */}
          {loading ? (
            <div className="mt-4 flex gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex-1 bg-white/10 rounded-xl p-3 animate-pulse"
                >
                  <div className="h-5 w-10 bg-white/20 rounded mb-1" />
                  <div className="h-3 w-14 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="mt-4 flex gap-3">
              <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Users className="w-3.5 h-3.5 text-white/70" />
                  <p className="text-lg font-black text-white">
                    {stats.member_count}
                  </p>
                </div>
                <p className="text-[10px] text-white/50 font-medium">Membri</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-white/70" />
                  <p className="text-lg font-black text-white">
                    {formatNumber(stats.total_xp)}
                  </p>
                </div>
                <p className="text-[10px] text-white/50 font-medium">
                  XP totale
                </p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-white/70" />
                  <p className="text-lg font-black text-white">
                    {formatNumber(stats.avg_xp)}
                  </p>
                </div>
                <p className="text-[10px] text-white/50 font-medium">
                  XP medio
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-3">
              <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-lg font-black text-white">--</p>
                <p className="text-[10px] text-white/50 font-medium">Membri</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-lg font-black text-white">--</p>
                <p className="text-[10px] text-white/50 font-medium">
                  XP totale
                </p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-lg font-black text-white">--</p>
                <p className="text-[10px] text-white/50 font-medium">
                  XP medio
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Leaderboard */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : error || members.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-center py-10"
          >
            <div className="card-clean rounded-2xl bg-card p-8 mx-auto max-w-sm">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-figb/10 dark:bg-primary/15 flex items-center justify-center">
                  <Users className="w-8 h-8 text-figb/50 dark:text-primary/50" />
                </div>
              </div>
              <p className="text-base font-bold text-foreground">
                Nessun membro ancora
              </p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                I membri di questo circolo appariranno qui quando si
                registreranno su BridgeLab e selezioneranno la propria ASD.
              </p>
              <Link href="/registrati">
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="mt-5 inline-flex items-center gap-2 bg-figb hover:bg-figb-dark text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  Registrati ora
                </motion.div>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Member count header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-bold text-muted-foreground">
                Classifica del circolo
              </p>
              <span className="text-[10px] font-bold text-muted-foreground/40">
                {members.length}{" "}
                {members.length === 1 ? "membro" : "membri"}
              </span>
            </div>

            <div className="space-y-2">
              {members.map((member, index) => {
                const rank = index + 1;
                const isCurrentUser = member.id === currentUserId;
                const pl = getLevel(member.xp);

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.03 }}
                  >
                    <div
                      className={`card-clean rounded-2xl bg-card p-3.5 ${
                        isCurrentUser ? "ring-2 ring-amber-300/50" : ""
                      } ${rank <= 3 ? "border-l-[3px] border-l-figb dark:border-l-primary" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <span className="w-8 text-center text-base font-bold">
                          {rank <= 3 ? (
                            medals[rank - 1]
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {rank}
                            </span>
                          )}
                        </span>

                        {/* Avatar */}
                        <Avatar className="h-10 w-10">
                          <AvatarFallback
                            className={`text-xs font-bold ${
                              isCurrentUser
                                ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                : avatarColors[index % avatarColors.length]
                            }`}
                          >
                            {isCurrentUser
                              ? "TU"
                              : member.display_name
                                  .slice(0, 2)
                                  .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name and level */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-bold text-sm truncate ${
                              isCurrentUser
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {isCurrentUser
                              ? `${member.display_name} (Tu)`
                              : member.display_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Lv.{pl.level} &middot; {pl.name}
                          </p>
                        </div>

                        {/* XP */}
                        <div className="text-right">
                          <p className="font-bold text-sm text-foreground">
                            {formatNumber(member.xp)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">XP</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Back to classifica */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link href="/classifica">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-figb dark:hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna alla classifica generale
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-card rounded-2xl p-4 animate-pulse card-clean"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-4 bg-muted rounded" />
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-muted rounded mb-1" />
              <div className="h-3 w-16 bg-muted/50 rounded" />
            </div>
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
