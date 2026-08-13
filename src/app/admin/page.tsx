"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useSharedAuth } from "@/contexts/auth-provider";
import {
  buildUsersCsv,
  defaultSortDir,
  filterUsers,
  formatLastLogin as formatLastLoginAt,
  isDidactaPeriod,
  sortUsers,
} from "@/lib/admin-stats";
import { useAdminData } from "./_use-admin-data";
import type { AsdTab, SortDir, SortKey } from "./_types";
import {
  AccessDeniedScreen,
  AuthLoadingScreen,
  ConnectionErrorScreen,
  ProfileLoadingScreen,
} from "./_components/admin-gate";
import { AdminHeader } from "./_components/admin-header";
import { DidactaBanner } from "./_components/didacta-banner";
import { SummaryCards } from "./_components/summary-cards";
import { EngagementMetrics } from "./_components/engagement-metrics";
import { BboAsdSegmentation } from "./_components/bbo-asd-segmentation";
import { ProfileTypeBreakdown } from "./_components/profile-type-breakdown";
import { PlatformBreakdown } from "./_components/platform-breakdown";
import { SignupCharts } from "./_components/signup-charts";
import { DailyActivePanel } from "./_components/daily-active-panel";
import { GameStatsPanel } from "./_components/game-stats-panel";
import { TopUsersPanel } from "./_components/top-users-panel";
import { AsdDistributionPanel } from "./_components/asd-distribution-panel";
import { UsersTable } from "./_components/users-table";
import { UserDetailModal } from "./_components/user-detail-modal";

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useSharedAuth();
  const { users, stats, gameStats, loginHistory, accessiAttendibili, loading, fetchError, lastUpdated, fetchData } = useAdminData();
  const [search, setSearch] = useState("");
  const [authTimeout, setAuthTimeout] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const userDialogRef = useRef<HTMLDivElement>(null);
  const closeUserDetail = useCallback(() => setSelectedUserId(null), []);
  useFocusTrap(userDialogRef, selectedUserId !== null, { onEscape: closeUserDetail });
  const [asdTab, setAsdTab] = useState<AsdTab>("asd");
  const [asdSearch, setAsdSearch] = useState("");

  useEffect(() => {
    if (authLoading) {
      const t = setTimeout(() => setAuthTimeout(true), 8000);
      return () => clearTimeout(t);
    }
  }, [authLoading]);

  // Stable clock for timeAgo
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const formatLastLogin = useMemo(
    () => (val: string | null) => formatLastLoginAt(val, now),
    [now],
  );

  // Auth guards
  if (authLoading && !authTimeout) {
    return <AuthLoadingScreen />;
  }

  if (authTimeout && !user) {
    return <ConnectionErrorScreen />;
  }

  // Il profilo arriva in background dopo la sessione: finché non c'è, spinner
  // (evita il flash di "Accesso negato" per l'admin legittimo).
  if (user && !profile) {
    return <ProfileLoadingScreen />;
  }

  // Autorizzazione a ruolo (profiles.role), come /admin/classi e /admin/istruttori;
  // la protezione reale dei dati resta nelle RLS/RPC con is_admin().
  if (!user || profile?.role !== "admin") {
    return <AccessDeniedScreen />;
  }

  // Sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultSortDir(key));
    }
  };

  const filteredUsers = filterUsers(users, search);

  const sortedUsers = sortUsers(filteredUsers, sortKey, sortDir);

  // CSV export
  const exportCsv = () => {
    const blob = new Blob([buildUsersCsv(users)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bridgelab-utenti-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedUser = selectedUserId ? users.find(usr => usr.id === selectedUserId) : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader
        lastUpdated={lastUpdated}
        onExportCsv={exportCsv}
        onRefresh={() => fetchData(false)}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-red-700">{fetchError}</p>
            <button
              onClick={() => fetchData(false)}
              className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
            >
              Riprova
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* DIDACTA live counter */}
            {isDidactaPeriod(new Date()) && <DidactaBanner stats={stats} users={users} />}

            <SummaryCards stats={stats} />

            <EngagementMetrics stats={stats} />

            <BboAsdSegmentation stats={stats} />

            <ProfileTypeBreakdown stats={stats} />

            <PlatformBreakdown stats={stats} />

            <SignupCharts stats={stats} />

            <DailyActivePanel
              stats={stats}
              users={users}
              expandedDay={expandedDay}
              onExpandDay={setExpandedDay}
              onSelectUser={setSelectedUserId}
              accessiAttendibili={accessiAttendibili}
            />

            {/* Game stats (RPC admin_game_stats) */}
            {gameStats && <GameStatsPanel gameStats={gameStats} />}

            {/* Top 10 + ASD row */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <TopUsersPanel stats={stats} />

              <AsdDistributionPanel
                stats={stats}
                asdTab={asdTab}
                asdSearch={asdSearch}
                onTabChange={(key) => { setAsdTab(key); setAsdSearch(""); }}
                onSearchChange={setAsdSearch}
              />
            </div>

            {/* Users table */}
            <UsersTable
              users={sortedUsers}
              search={search}
              onSearchChange={setSearch}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              onSelectUser={setSelectedUserId}
              formatLastLogin={formatLastLogin}
            />

            {/* User detail modal */}
            {selectedUser && (
              <UserDetailModal
                user={selectedUser}
                users={users}
                loginHistory={loginHistory}
                dialogRef={userDialogRef}
                onClose={closeUserDetail}
                formatLastLogin={formatLastLogin}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
