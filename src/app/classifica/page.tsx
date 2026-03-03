"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { getProfileConfig, type UserProfile } from "@/hooks/use-profile";
import { courses, type CourseId } from "@/data/courses";
import { Clock, Trophy, Landmark, ChevronUp, Filter } from "lucide-react";

const medals = ["🥇", "🥈", "🥉"];

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-[#003DA5]/10 text-[#003DA5]",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-sky-100 text-sky-700",
  "bg-lime-100 text-lime-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-red-100 text-red-700",
];

function getLevel(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const profileKey = (typeof window !== "undefined" ? localStorage.getItem("bq_profile") : null) as UserProfile | null;
  const names = getProfileConfig(profileKey || "adulto").levelNames;
  return { level, name: names[Math.min(level - 1, names.length - 1)] };
}

const leagues = [
  { name: "Lega Fiori", icon: "♣", minXp: 0, color: "from-emerald-50 to-emerald-100/50", border: "border-emerald-100", textColor: "text-emerald-700", iconBg: "bg-emerald-600", next: "Lega Quadri ♦" },
  { name: "Lega Quadri", icon: "♦", minXp: 1000, color: "from-orange-50 to-orange-100/50", border: "border-orange-100", textColor: "text-orange-700", iconBg: "bg-orange-500", next: "Lega Cuori ♥" },
  { name: "Lega Cuori", icon: "♥", minXp: 3000, color: "from-rose-50 to-rose-100/50", border: "border-rose-100", textColor: "text-rose-700", iconBg: "bg-rose-500", next: "Lega Picche ♠" },
  { name: "Lega Picche", icon: "♠", minXp: 6000, color: "from-indigo-50 to-indigo-100/50", border: "border-indigo-100", textColor: "text-indigo-700", iconBg: "bg-indigo-600", next: "Lega SA" },
  { name: "Lega SA", icon: "NT", minXp: 10000, color: "from-slate-100 to-slate-200/50", border: "border-slate-200", textColor: "text-slate-800", iconBg: "bg-slate-800", next: null },
];

function getLeague(xp: number) {
  for (let i = leagues.length - 1; i >= 0; i--) {
    if (xp >= leagues[i].minXp) return leagues[i];
  }
  return leagues[0];
}

function getWeeklyCountdown() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);
  const diff = endOfWeek.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

// Course lesson ID ranges for "Per Corso" filter
const courseRanges: Record<CourseId, { min: number; max: number }> = {
  fiori: { min: 0, max: 12 },
  quadri: { min: 1, max: 12 },        // Quadri lesson IDs 1-12 overlap, but we use completed_modules
  "cuori-gioco": { min: 100, max: 109 },
  "cuori-licita": { min: 200, max: 213 },
};

type TabId = "globale" | "settimanale" | "per-corso" | "per-asd";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "globale", label: "Globale", icon: "🌍" },
  { id: "settimanale", label: "Settimanale", icon: "📅" },
  { id: "per-corso", label: "Per Corso", icon: "📚" },
  { id: "per-asd", label: "Per ASD", icon: "🏛" },
];

const courseFilters: { id: CourseId; label: string; icon: string; color: string; activeColor: string }[] = [
  { id: "fiori", label: "Fiori", icon: "♣", color: "text-emerald-600", activeColor: "bg-emerald-600 text-white" },
  { id: "quadri", label: "Quadri", icon: "♦", color: "text-orange-600", activeColor: "bg-orange-500 text-white" },
  { id: "cuori-gioco", label: "Cuori Gioco", icon: "♥", color: "text-rose-600", activeColor: "bg-rose-500 text-white" },
  { id: "cuori-licita", label: "Cuori Licita", icon: "♥", color: "text-pink-600", activeColor: "bg-pink-600 text-white" },
];

interface PlayerEntry {
  id: string;
  name: string;
  xp: number;
  updated_at: string;
  asd_name: string | null;
}

interface AsdRanking {
  asd_name: string;
  total_xp: number;
  member_count: number;
}

export default function ClassificaPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerEntry[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [asdRankings, setAsdRankings] = useState<AsdRanking[]>([]);
  const [asdLoading, setAsdLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("globale");
  const [selectedCourse, setSelectedCourse] = useState<CourseId>("fiori");
  const [userFullRank, setUserFullRank] = useState<number | null>(null);
  const [userFullTotal, setUserFullTotal] = useState<number>(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const countdown = getWeeklyCountdown();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        // Fetch all profiles with ASD join
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, xp, updated_at, asd_id, asd:asd_id(name)")
          .order("xp", { ascending: false })
          .limit(100);

        if (data && data.length > 0) {
          const players = data
            .filter((u: Record<string, unknown>) => u.display_name)
            .map((u: Record<string, unknown>) => ({
              id: u.id as string,
              name: u.display_name as string,
              xp: (u.xp as number) || 0,
              updated_at: u.updated_at as string,
              asd_name: (u.asd as { name: string } | null)?.name || null,
            }));
          setAllPlayers(players);

          // Calculate user's full rank (even if not in top 100)
          if (user) {
            const userInList = players.findIndex((p: PlayerEntry) => p.id === user.id);
            if (userInList >= 0) {
              setUserFullRank(userInList + 1);
              setUserFullTotal(players.length);
            } else {
              // User not in top 100, fetch their rank separately
              const { count } = await supabase
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .not("display_name", "is", null);

              const userProfile = await supabase
                .from("profiles")
                .select("xp")
                .eq("id", user.id)
                .single();

              if (userProfile.data && count) {
                const { count: aboveCount } = await supabase
                  .from("profiles")
                  .select("id", { count: "exact", head: true })
                  .not("display_name", "is", null)
                  .gt("xp", userProfile.data.xp);

                setUserFullRank((aboveCount || 0) + 1);
                setUserFullTotal(count);

                // Add user to the list for display
                const { data: fullUser } = await supabase
                  .from("profiles")
                  .select("id, display_name, xp, updated_at, asd_id, asd:asd_id(name)")
                  .eq("id", user.id)
                  .single();

                if (fullUser) {
                  const fu = fullUser as Record<string, unknown>;
                  setAllPlayers(prev => [...prev, {
                    id: fu.id as string,
                    name: fu.display_name as string,
                    xp: (fu.xp as number) || 0,
                    updated_at: fu.updated_at as string,
                    asd_name: (fu.asd as { name: string } | null)?.name || null,
                  }]);
                }
              }
            }
          }
        }
      } catch {}
      setPlayersLoading(false);
    };
    fetchData();
  }, []);

  const fetchAsdRankings = async () => {
    if (asdRankings.length > 0) return;
    setAsdLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("xp, asd_id, asd:asd_id(name)")
        .not("asd_id", "is", null);

      if (data) {
        const asdMap = new Map<string, { total_xp: number; member_count: number }>();
        for (const row of data as unknown as Array<{ xp: number; asd_id: number; asd: { name: string } | null }>) {
          const asdName = row.asd?.name;
          if (!asdName) continue;
          const existing = asdMap.get(asdName) || { total_xp: 0, member_count: 0 };
          existing.total_xp += row.xp || 0;
          existing.member_count += 1;
          asdMap.set(asdName, existing);
        }
        const rankings = Array.from(asdMap.entries())
          .map(([name, stats]) => ({ asd_name: name, ...stats }))
          .sort((a, b) => b.total_xp - a.total_xp);
        setAsdRankings(rankings);
      }
    } catch {}
    setAsdLoading(false);
  };

  // Current user info from Supabase data
  const currentPlayer = allPlayers.find((p) => p.id === currentUserId);
  const userXp = currentPlayer?.xp ?? 0;
  const league = getLeague(userXp);
  const nextLeague = leagues.find((l) => l.minXp > userXp);

  // Filter players by activity period
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklyPlayers = useMemo(
    () => allPlayers.filter((p) => new Date(p.updated_at) >= weekAgo),
    [allPlayers]
  );

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "per-asd") {
      fetchAsdRankings();
    }
  };

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900">Classifica</h1>
          <p className="text-sm text-gray-500 mt-1">Scala le leghe e diventa Campione Azzurro</p>
        </motion.div>

        {/* User's own rank - Sticky highlight card */}
        {currentPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="sticky top-2 z-20 mt-4"
          >
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 card-clean rounded-2xl border-2 border-amber-200/60 p-4 shadow-lg shadow-amber-100/40">
              <div className="flex items-center gap-3">
                {/* Rank badge */}
                <div className="flex flex-col items-center justify-center min-w-[48px]">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pos.</span>
                  <span className="text-2xl font-black text-amber-600">
                    {userFullRank ? `#${userFullRank}` : (
                      (() => {
                        const sorted = [...allPlayers].sort((a, b) => b.xp - a.xp);
                        const idx = sorted.findIndex(p => p.id === currentUserId);
                        return idx >= 0 ? `#${idx + 1}` : "--";
                      })()
                    )}
                  </span>
                  {userFullTotal > 0 && (
                    <span className="text-[9px] text-gray-400">
                      su {userFullTotal}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12 ring-2 ring-amber-300/50">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white text-sm font-bold">
                    TU
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {currentPlayer.name}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Lv.{getLevel(currentPlayer.xp).level} · {getLevel(currentPlayer.xp).name}
                  </p>
                  {currentPlayer.asd_name && (
                    <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5 font-medium">
                      <Landmark className="w-2.5 h-2.5" />
                      {currentPlayer.asd_name}
                    </span>
                  )}
                </div>

                {/* XP */}
                <div className="text-right">
                  <p className="font-black text-lg text-gray-900">
                    {currentPlayer.xp.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">XP</p>
                </div>
              </div>

              {/* Distance to next player */}
              {(() => {
                const sorted = [...allPlayers].sort((a, b) => b.xp - a.xp);
                const idx = sorted.findIndex(p => p.id === currentUserId);
                if (idx > 0) {
                  const above = sorted[idx - 1];
                  const gap = above.xp - currentPlayer.xp;
                  return (
                    <div className="mt-2.5 pt-2 border-t border-amber-100/60">
                      <div className="flex items-center justify-center gap-1.5">
                        <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
                        <p className="text-[11px] text-gray-500">
                          <span className="font-bold text-amber-600">{gap.toLocaleString()} XP</span> per superare {above.name}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </motion.div>
        )}

        {/* Weekly countdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-4 flex items-center justify-between bg-white card-clean rounded-xl p-3"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs font-bold text-gray-900">Fine settimana</p>
              <p className="text-[10px] text-gray-400">Top 3 promossi!</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-gray-900 text-white rounded-lg px-2 py-1 text-center min-w-[32px]">
              <p className="text-sm font-bold">{countdown.days}</p>
              <p className="text-[8px] text-gray-400">GG</p>
            </div>
            <span className="text-gray-300 font-bold">:</span>
            <div className="bg-gray-900 text-white rounded-lg px-2 py-1 text-center min-w-[32px]">
              <p className="text-sm font-bold">{countdown.hours}</p>
              <p className="text-[8px] text-gray-400">ORE</p>
            </div>
          </div>
        </motion.div>

        {/* League progress */}
        {nextLeague && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 bg-white card-clean rounded-xl p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-700">
                Prossima lega: {nextLeague.name} {nextLeague.icon}
              </p>
              <p className="text-[11px] font-bold text-gray-400">
                {userXp}/{nextLeague.minXp} XP
              </p>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(to right, #059669, #34d399)` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((userXp / nextLeague.minXp) * 100, 100)}%` }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Mancano {(nextLeague.minXp - userXp).toLocaleString()} XP per la promozione
            </p>
          </motion.div>
        )}

        {/* Tab bar - horizontal scrollable pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-5"
        >
          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-white text-gray-600 card-clean hover:bg-gray-50"
                  }`}
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="text-sm">{tab.icon}</span>
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-indigo-600 rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Course filter sub-pills (only when Per Corso tab is active) */}
        <AnimatePresence>
          {activeTab === "per-corso" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <div className="flex items-center gap-1 mr-1 flex-shrink-0">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                </div>
                {courseFilters.map((course) => {
                  const isActive = selectedCourse === course.id;
                  return (
                    <motion.button
                      key={course.id}
                      onClick={() => setSelectedCourse(course.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                        isActive
                          ? course.activeColor + " shadow-sm"
                          : "bg-white text-gray-500 card-clean hover:bg-gray-50"
                      }`}
                      whileTap={{ scale: 0.96 }}
                    >
                      <span className={isActive ? "text-white" : course.color}>{course.icon}</span>
                      {course.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab content with animated transitions */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "globale" && (
              <motion.div
                key="globale"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {playersLoading ? (
                  <LeaderboardSkeleton />
                ) : allPlayers.length === 0 ? (
                  <EmptyState message="La classifica e ancora vuota" />
                ) : (
                  <LeaderboardList
                    players={allPlayers}
                    currentUserId={currentUserId}
                    league={league}
                  />
                )}
              </motion.div>
            )}

            {activeTab === "settimanale" && (
              <motion.div
                key="settimanale"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {playersLoading ? (
                  <LeaderboardSkeleton />
                ) : weeklyPlayers.length === 0 ? (
                  <EmptyState message="Nessun giocatore attivo questa settimana" />
                ) : (
                  <>
                    {/* Weekly info banner */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 card-clean rounded-xl p-3"
                    >
                      <p className="text-xs text-indigo-700 font-medium">
                        Classifica basata sugli XP dei giocatori attivi negli ultimi 7 giorni. Chi gioca di piu sale in cima!
                      </p>
                    </motion.div>
                    <LeaderboardList
                      players={weeklyPlayers}
                      currentUserId={currentUserId}
                      league={league}
                    />
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "per-corso" && (
              <motion.div
                key="per-corso"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PerCorsoView
                  courseId={selectedCourse}
                  allPlayers={allPlayers}
                  currentUserId={currentUserId}
                />
              </motion.div>
            )}

            {activeTab === "per-asd" && (
              <motion.div
                key="per-asd"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {asdLoading ? (
                  <LeaderboardSkeleton />
                ) : asdRankings.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <span className="flex justify-center mb-3"><Landmark className="w-10 h-10 text-gray-400" /></span>
                    <p className="text-sm text-gray-500">
                      Le classifiche ASD appariranno quando i giocatori si registreranno con la propria associazione
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {asdRankings.map((asd, i) => (
                      <motion.div
                        key={asd.asd_name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="card-clean rounded-2xl bg-white p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 text-center text-base font-bold">
                            {i < 3 ? medals[i] : <span className="text-gray-400 text-sm">{i + 1}</span>}
                          </span>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003DA5]/10 text-[#003DA5] text-lg font-bold flex-shrink-0">
                            {asd.asd_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">
                              {asd.asd_name}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {asd.member_count} {asd.member_count === 1 ? "membro" : "membri"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-gray-900">
                              {asd.total_xp.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400">XP totali</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Per Corso view - shows leaderboard filtered by course completion
   ============================================================================ */
function PerCorsoView({
  courseId,
  allPlayers,
  currentUserId,
}: {
  courseId: CourseId;
  allPlayers: PlayerEntry[];
  currentUserId: string | null;
}) {
  const [coursePlayers, setCoursePlayers] = useState<(PlayerEntry & { courseXp: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const courseInfo = courses.find(c => c.id === courseId);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        // Get completed modules for this course's lessons
        const range = courseRanges[courseId];
        const { data: modules } = await supabase
          .from("completed_modules")
          .select("user_id, lesson_id, module_id")
          .gte("lesson_id", String(range.min))
          .lte("lesson_id", String(range.max));

        if (modules && modules.length > 0) {
          // Count unique modules completed per user as a proxy for course XP
          const userModuleCount = new Map<string, number>();
          for (const m of modules) {
            const count = userModuleCount.get(m.user_id) || 0;
            userModuleCount.set(m.user_id, count + 1);
          }

          // Map to players with course XP (modules * 10 XP each as estimate)
          const playerMap = new Map(allPlayers.map(p => [p.id, p]));
          const result: (PlayerEntry & { courseXp: number })[] = [];
          for (const [userId, moduleCount] of userModuleCount) {
            const player = playerMap.get(userId);
            if (player) {
              result.push({ ...player, courseXp: moduleCount * 10 });
            } else {
              // Player not in top 100, create minimal entry
              result.push({
                id: userId,
                name: "Giocatore",
                xp: 0,
                updated_at: "",
                asd_name: null,
                courseXp: moduleCount * 10,
              });
            }
          }
          result.sort((a, b) => b.courseXp - a.courseXp);
          setCoursePlayers(result);
        } else {
          setCoursePlayers([]);
        }
      } catch {
        setCoursePlayers([]);
      }
      setLoading(false);
    };
    fetchCourseData();
  }, [courseId, allPlayers]);

  if (loading) return <LeaderboardSkeleton />;

  if (coursePlayers.length === 0) {
    return (
      <EmptyState
        message={`Nessun giocatore ha ancora completato moduli del ${courseInfo?.name || "corso"}`}
      />
    );
  }

  return (
    <>
      {/* Course header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-clean rounded-2xl bg-white p-4 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white text-2xl font-bold shadow-md ${
            courseId === "fiori" ? "bg-emerald-600" :
            courseId === "quadri" ? "bg-orange-500" :
            courseId === "cuori-gioco" ? "bg-rose-500" :
            "bg-pink-600"
          }`}>
            {courseInfo?.icon || "?"}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base text-gray-900">
              {courseInfo?.name || "Corso"}
            </p>
            <p className="text-xs text-gray-500">
              {coursePlayers.length} {coursePlayers.length === 1 ? "partecipante" : "partecipanti"} · {courseInfo?.lessonCount || 0} lezioni
            </p>
          </div>
        </div>
      </motion.div>

      {/* Course leaderboard */}
      <div className="space-y-2">
        {coursePlayers.map((player, index) => {
          const isCurrentUser = player.id === currentUserId;
          const rank = index + 1;
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div className={`card-clean rounded-2xl bg-white p-3.5 ${
                isCurrentUser ? "ring-2 ring-amber-300/50" : ""
              } ${rank <= 3 ? "border-l-[3px] border-l-emerald-400" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center text-base font-bold">
                    {rank <= 3
                      ? medals[rank - 1]
                      : <span className="text-gray-400 text-sm">{rank}</span>}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`text-xs font-bold ${isCurrentUser ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" : avatarColors[index % avatarColors.length]}`}>
                      {isCurrentUser ? "TU" : player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isCurrentUser ? "text-amber-600" : "text-gray-900"}`}>
                      {isCurrentUser ? `${player.name} (Tu)` : player.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] text-gray-500">
                        {player.courseXp} XP corso
                      </p>
                      {player.asd_name && (
                        <span className="inline-flex items-center text-[9px] text-indigo-600 bg-indigo-50 rounded-full px-1.5 py-0.5 font-medium">
                          {player.asd_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">
                      {player.courseXp}
                    </p>
                    <p className="text-[10px] text-gray-400">XP</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/* ============================================================================
   LeaderboardList component
   ============================================================================ */
function LeaderboardList({
  players,
  currentUserId,
  league,
}: {
  players: PlayerEntry[];
  currentUserId: string | null;
  league: (typeof leagues)[0];
}) {
  // Sort by XP and assign ranks
  const sorted = [...players].sort((a, b) => b.xp - a.xp);
  const ranked = sorted.map((p, i) => ({ ...p, rank: i + 1 }));
  const totalPlayers = ranked.length;

  return (
    <>
      {/* League card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`card-clean rounded-2xl bg-gradient-to-r ${league.color} border ${league.border} p-4 mb-4`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${league.iconBg} text-white text-2xl font-bold shadow-md`}>
            {league.icon}
          </div>
          <div className="flex-1">
            <p className={`font-semibold text-lg ${league.textColor}`}>
              {league.name}
            </p>
            {league.next && (
              <p className={`text-xs ${league.textColor} opacity-60`}>
                Top 3 promossi a {league.next}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Promotion / Relegation zone legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-4 mb-3 px-1"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-gray-400">Promozione</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="text-[10px] font-bold text-gray-400">Retrocessione</span>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] font-bold text-gray-300">{totalPlayers} giocatori</span>
      </motion.div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {ranked.map((player, index) => {
          const isCurrentUser = player.id === currentUserId;
          const pl = getLevel(player.xp);
          const isPromotion = player.rank <= 3;
          const isRelegation = totalPlayers > 6 && player.rank > totalPlayers - 3;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.03 }}
            >
              <div className={`card-clean rounded-2xl bg-white p-3.5 ${
                isCurrentUser ? "ring-2 ring-amber-300/50" : ""
              } ${isPromotion ? "border-l-[3px] border-l-emerald-400" : ""} ${
                isRelegation ? "border-l-[3px] border-l-rose-300" : ""
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center text-base font-bold">
                    {player.rank <= 3
                      ? medals[player.rank - 1]
                      : <span className="text-gray-400 text-sm">{player.rank}</span>}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`text-xs font-bold ${isCurrentUser ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" : avatarColors[index % avatarColors.length]}`}>
                      {isCurrentUser ? "TU" : player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isCurrentUser ? "text-amber-600" : "text-gray-900"}`}>
                      {isCurrentUser ? `${player.name} (Tu)` : player.name}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[11px] text-gray-500">
                        Lv.{pl.level} · {pl.name}
                      </p>
                      {player.asd_name && (
                        <span className="inline-flex items-center text-[9px] text-indigo-600 bg-indigo-50 rounded-full px-1.5 py-0.5 font-medium">
                          {player.asd_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">
                      {player.xp.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">XP</p>
                  </div>
                </div>
              </div>

              {player.rank === 3 && totalPlayers > 3 && (
                <div className="flex items-center gap-2 my-2 px-2">
                  <div className="flex-1 h-px bg-emerald-200" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">zona promozione</span>
                  <div className="flex-1 h-px bg-emerald-200" />
                </div>
              )}
              {totalPlayers > 6 && player.rank === totalPlayers - 3 && (
                <div className="flex items-center gap-2 my-2 px-2">
                  <div className="flex-1 h-px bg-rose-200" />
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">zona retrocessione</span>
                  <div className="flex-1 h-px bg-rose-200" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/* ============================================================================
   Empty state & skeleton
   ============================================================================ */
function EmptyState({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
      <span className="flex justify-center mb-4"><Trophy className="w-12 h-12 text-amber-400" /></span>
      <p className="text-base font-bold text-gray-700">{message}</p>
      <p className="text-sm text-gray-500 mt-1">Completa lezioni e sfide per scalare le posizioni!</p>
    </motion.div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 animate-pulse card-clean">
          <div className="flex items-center gap-3">
            <div className="w-8 h-4 bg-gray-100 rounded" />
            <div className="h-10 w-10 bg-gray-100 rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-16 bg-gray-50 rounded" />
            </div>
            <div className="h-4 w-12 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
