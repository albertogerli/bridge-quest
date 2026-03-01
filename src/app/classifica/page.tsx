"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { getProfileConfig, type UserProfile } from "@/hooks/use-profile";
import { Clock, Trophy, Landmark } from "lucide-react";

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
  { name: "Lega Fiori", icon: "♣", minXp: 0, color: "from-emerald-50 to-emerald-100/50", border: "border-emerald-100", textColor: "text-emerald-dark", iconBg: "bg-emerald", next: "Lega Quadri ♦" },
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

interface PlayerEntry {
  id: string;
  name: string;
  xp: number;
  updated_at: string;
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
  const countdown = getWeeklyCountdown();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        // Fetch all profiles
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, xp, updated_at")
          .order("xp", { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
          setAllPlayers(
            data
              .filter((u) => u.display_name)
              .map((u) => ({
                id: u.id,
                name: u.display_name!,
                xp: u.xp || 0,
                updated_at: u.updated_at,
              }))
          );
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
  const userLevel = getLevel(userXp);
  const league = getLeague(userXp);
  const nextLeague = leagues.find((l) => l.minXp > userXp);

  // Filter players by activity period
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weeklyPlayers = allPlayers.filter((p) => new Date(p.updated_at) >= weekAgo);
  const monthlyPlayers = allPlayers.filter((p) => new Date(p.updated_at) >= monthAgo);

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900">Classifica</h1>
          <p className="text-sm text-gray-500 mt-1">Scala le leghe e diventa Campione Azzurro</p>
        </motion.div>

        {/* Weekly countdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
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
            transition={{ delay: 0.08 }}
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
              Mancano {nextLeague.minXp - userXp} XP per la promozione
            </p>
          </motion.div>
        )}

        <Tabs defaultValue="sempre" className="w-full mt-4">
          <TabsList className="w-full bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="settimana" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Settimana
            </TabsTrigger>
            <TabsTrigger value="mese" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Mese
            </TabsTrigger>
            <TabsTrigger value="sempre" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Sempre
            </TabsTrigger>
            <TabsTrigger value="asd" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm" onClick={fetchAsdRankings}>
              Per ASD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settimana" className="mt-4">
            {playersLoading ? (
              <LeaderboardSkeleton />
            ) : weeklyPlayers.length === 0 ? (
              <EmptyState message="Nessun giocatore attivo questa settimana" />
            ) : (
              <LeaderboardList
                players={weeklyPlayers}
                currentUserId={currentUserId}
                league={league}
              />
            )}
          </TabsContent>

          <TabsContent value="mese" className="mt-4">
            {playersLoading ? (
              <LeaderboardSkeleton />
            ) : monthlyPlayers.length === 0 ? (
              <EmptyState message="Nessun giocatore attivo questo mese" />
            ) : (
              <LeaderboardList
                players={monthlyPlayers}
                currentUserId={currentUserId}
                league={league}
              />
            )}
          </TabsContent>

          <TabsContent value="sempre" className="mt-4">
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
          </TabsContent>

          <TabsContent value="asd" className="mt-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

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

  const currentEntry = ranked.find((p) => p.id === currentUserId);

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

      {/* Your position - sticky highlight (only if logged in) */}
      {currentEntry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 card-clean rounded-2xl bg-white border-2 border-amber/30 p-4"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 text-center text-sm font-bold text-amber-500">
              {currentEntry.rank}
            </span>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-emerald to-emerald-dark text-white text-xs font-bold">
                TU
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-sm text-amber-600">{currentEntry.name}</p>
              <p className="text-[11px] text-gray-500">
                Lv.{getLevel(currentEntry.xp).level} {getLevel(currentEntry.xp).name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{currentEntry.xp.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">XP</p>
            </div>
          </div>
          {currentEntry.rank > 1 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center">
                {(() => {
                  const above = ranked.find((p) => p.rank === currentEntry.rank - 1);
                  if (!above) return "";
                  return `${above.xp - currentEntry.xp} XP per superare ${above.name}`;
                })()}
              </p>
            </div>
          )}
        </motion.div>
      )}

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
              transition={{ delay: 0.3 + index * 0.03 }}
            >
              <div className={`card-clean rounded-2xl bg-white p-3.5 ${
                isCurrentUser ? "ring-2 ring-amber/40" : ""
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
                    <AvatarFallback className={`text-xs font-bold ${isCurrentUser ? "bg-gradient-to-br from-emerald to-emerald-dark text-white" : avatarColors[index % avatarColors.length]}`}>
                      {isCurrentUser ? "TU" : player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isCurrentUser ? "text-amber-600" : "text-gray-900"}`}>
                      {isCurrentUser ? `${player.name} (Tu)` : player.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Lv.{pl.level} · {pl.name}
                    </p>
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
