"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { useFriends } from "@/hooks/use-friends";
import { useChallenges } from "@/hooks/use-challenges";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, UserPlus, Users, Bell, Swords, X, Check } from "lucide-react";
import { getAsdNameById } from "@/lib/asd-utils";

type Tab = "amici" | "richieste" | "cerca";
type BoardCount = 1 | 4 | 8;

interface SelectedFriend {
  id: string;
  name: string;
}

export default function AmiciPage() {
  const { user } = useSharedAuth();
  const router = useRouter();
  const {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    searchResults,
    searchLoading,
    searchUsers,
    addFriend,
    acceptFriend,
    declineFriend,
    removeFriend,
  } = useFriends();
  const { createChallenge } = useChallenges();

  const [activeTab, setActiveTab] = useState<Tab>("amici");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<SelectedFriend | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (value.trim().length === 0) {
        return;
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(value);
      }, 300);
    },
    [searchUsers]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleChallenge = (friendId: string, friendName: string) => {
    setSelectedFriend({ id: friendId, name: friendName });
    setShowChallengeModal(true);
  };

  const handleCreateChallenge = async (boardCount: BoardCount) => {
    if (!selectedFriend) return;
    setChallengeLoading(true);
    try {
      const challengeId = await createChallenge(selectedFriend.id, boardCount);
      if (challengeId) {
        setShowChallengeModal(false);
        setSelectedFriend(null);
        router.push(`/gioca/sfida-imp?challengeId=${challengeId}`);
      }
    } catch (err) {
      console.error("Errore nella creazione della sfida:", err);
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    await addFriend(userId);
    setSentRequests((prev) => new Set(prev).add(userId));
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] px-4 py-8">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-clean rounded-2xl bg-white p-8"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#003DA5]/10 mx-auto mb-4">
              <Users className="h-8 w-8 text-[#003DA5]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Accedi per vedere i tuoi amici
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Registrati o accedi per cercare altri giocatori, aggiungere amici e sfidarli a bridge!
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#003DA5] text-white font-semibold text-sm hover:bg-[#002E7A] transition-colors"
            >
              Accedi o Registrati
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "amici", label: "Amici", icon: <Users className="h-4 w-4" /> },
    {
      id: "richieste",
      label: "Richieste",
      icon: <Bell className="h-4 w-4" />,
      badge: pendingReceived.length,
    },
    { id: "cerca", label: "Cerca", icon: <Search className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] px-4 py-6 pb-28 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">Amici</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cerca giocatori e sfidali a bridge
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#003DA5] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px] px-1.5"
                >
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-[#003DA5]" />
          </div>
        )}

        {/* Tab: Amici */}
        {!loading && activeTab === "amici" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {friends.length === 0 ? (
              <div className="card-clean rounded-2xl bg-white p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mx-auto mb-4">
                  <Users className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Non hai ancora amici
                </p>
                <p className="text-xs text-gray-500">
                  Cerca giocatori nella tab Cerca!
                </p>
                <button
                  onClick={() => setActiveTab("cerca")}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003DA5] text-white text-sm font-semibold hover:bg-[#002E7A] transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Cerca giocatori
                </button>
              </div>
            ) : (
              friends.map((friendship) => (
                <motion.div
                  key={friendship.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-clean rounded-2xl bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {friendship.profile.avatar_url ? (
                      <img
                        src={friendship.profile.avatar_url}
                        alt={friendship.profile.display_name || "Giocatore"}
                        className="h-11 w-11 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#003DA5]/10 border border-[#003DA5]/20">
                        <span className="text-base font-bold text-[#003DA5]">
                          {(friendship.profile.display_name || "G").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {friendship.profile.display_name || "Giocatore"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {friendship.profile.bbo_username && (
                          <span className="text-[11px] text-gray-400 font-mono">
                            @{friendship.profile.bbo_username}
                          </span>
                        )}
                        {friendship.profile.asd_id && (
                          <span className="text-[10px] text-gray-400 truncate">
                            {getAsdNameById(friendship.profile.asd_id)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* XP Badge */}
                    <Badge
                      variant="secondary"
                      className="bg-[#003DA5]/10 text-[#003DA5] border-[#003DA5]/20 text-[10px] font-bold shrink-0"
                    >
                      {friendship.profile.xp} XP
                    </Badge>

                    {/* Challenge button */}
                    <button
                      onClick={() =>
                        handleChallenge(
                          friendship.profile.id,
                          friendship.profile.display_name || "Giocatore"
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-xs font-semibold hover:from-violet-700 hover:to-violet-600 transition-all shadow-sm shrink-0"
                    >
                      <Swords className="h-3.5 w-3.5" />
                      Sfida
                    </button>
                  </div>

                  {/* Remove option */}
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => removeFriend(friendship.id)}
                      className="text-[11px] text-red-400 hover:text-red-600 font-medium transition-colors"
                    >
                      Rimuovi
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Tab: Richieste */}
        {!loading && activeTab === "richieste" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Ricevute */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Ricevute
              </h3>
              {pendingReceived.length === 0 ? (
                <div className="card-clean rounded-2xl bg-white p-6 text-center">
                  <p className="text-sm text-gray-400">
                    Nessuna richiesta ricevuta
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReceived.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-clean rounded-2xl bg-white p-4"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {request.profile.avatar_url ? (
                          <img
                            src={request.profile.avatar_url}
                            alt={request.profile.display_name || "Giocatore"}
                            className="h-11 w-11 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#003DA5]/10 border border-[#003DA5]/20">
                            <span className="text-base font-bold text-[#003DA5]">
                              {(request.profile.display_name || "G").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {request.profile.display_name || "Giocatore"}
                          </p>
                          {request.profile.bbo_username && (
                            <span className="text-[11px] text-gray-400 font-mono">
                              @{request.profile.bbo_username}
                            </span>
                          )}
                        </div>

                        {/* Accept / Decline */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => acceptFriend(request.id)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accetta
                          </button>
                          <button
                            onClick={() => declineFriend(request.id)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Inviate */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Inviate
              </h3>
              {pendingSent.length === 0 ? (
                <div className="card-clean rounded-2xl bg-white p-6 text-center">
                  <p className="text-sm text-gray-400">
                    Nessuna richiesta inviata
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSent.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-clean rounded-2xl bg-white p-4"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {request.profile.avatar_url ? (
                          <img
                            src={request.profile.avatar_url}
                            alt={request.profile.display_name || "Giocatore"}
                            className="h-11 w-11 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 border border-gray-200">
                            <span className="text-base font-bold text-gray-400">
                              {(request.profile.display_name || "G").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {request.profile.display_name || "Giocatore"}
                          </p>
                          {request.profile.bbo_username && (
                            <span className="text-[11px] text-gray-400 font-mono">
                              @{request.profile.bbo_username}
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 font-medium shrink-0">
                          In attesa...
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Cerca */}
        {!loading && activeTab === "cerca" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cerca per nome, username BBO o associazione..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#003DA5] focus:ring-2 focus:ring-[#003DA5]/20 transition-all card-clean"
              />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#003DA5]" />
                </div>
              )}
            </div>

            {/* Results */}
            {searchQuery.trim().length > 0 && !searchLoading && searchResults.length === 0 && (
              <div className="card-clean rounded-2xl bg-white p-8 text-center">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600">
                  Nessun giocatore trovato
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Prova con un altro nome o username
                </p>
              </div>
            )}

            {searchQuery.trim().length === 0 && (
              <div className="card-clean rounded-2xl bg-white p-8 text-center">
                <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600">
                  Cerca un giocatore
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Inserisci il nome, lo username BBO o il nome dell&apos;associazione
                </p>
              </div>
            )}

            <div className="space-y-3">
              {searchResults.map((result) => {
                const alreadySent = sentRequests.has(result.id);
                const isAlreadyFriend = friends.some(
                  (f) => f.profile.id === result.id
                );
                const isPending =
                  pendingSent.some((f) => f.profile.id === result.id) ||
                  pendingReceived.some((f) => f.profile.id === result.id);

                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-clean rounded-2xl bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {result.avatar_url ? (
                        <img
                          src={result.avatar_url}
                          alt={result.display_name || "Giocatore"}
                          className="h-11 w-11 rounded-xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#003DA5]/10 border border-[#003DA5]/20">
                          <span className="text-base font-bold text-[#003DA5]">
                            {(result.display_name || "G").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {result.display_name || "Giocatore"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {result.bbo_username && (
                            <span className="text-[11px] text-gray-400 font-mono">
                              @{result.bbo_username}
                            </span>
                          )}
                          {result.asd_id && (
                            <span className="text-[10px] text-gray-400 truncate">
                              {getAsdNameById(result.asd_id)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      {isAlreadyFriend ? (
                        <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 font-medium shrink-0">
                          Amico
                        </span>
                      ) : isPending || alreadySent ? (
                        <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 font-medium shrink-0">
                          Richiesta inviata!
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(result.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#003DA5] text-white text-xs font-semibold hover:bg-[#002E7A] transition-colors shrink-0"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Aggiungi
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Challenge Modal */}
        <AnimatePresence>
          {showChallengeModal && selectedFriend && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
              onClick={() => {
                if (!challengeLoading) {
                  setShowChallengeModal(false);
                  setSelectedFriend(null);
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 border border-violet-200">
                      <Swords className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Sfida {selectedFriend.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Scegli il numero di mani
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!challengeLoading) {
                        setShowChallengeModal(false);
                        setSelectedFriend(null);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Board count options */}
                <div className="space-y-2 mb-4">
                  {([1, 4, 8] as BoardCount[]).map((count) => (
                    <button
                      key={count}
                      onClick={() => handleCreateChallenge(count)}
                      disabled={challengeLoading}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#003DA5]/5 hover:border-[#003DA5]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {count === 1 ? "1" : count === 4 ? "4" : "8"}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {count === 1 ? "1 Mano" : `${count} Mani`}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {count === 1 ? "Veloce" : count === 4 ? "Standard" : "Lunga"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* IMP scoring info */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    Punteggio IMP
                  </span>
                </div>

                {/* Loading indicator */}
                {challengeLoading && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-violet-600" />
                    <span className="text-xs text-gray-500">
                      Creazione sfida...
                    </span>
                  </div>
                )}

                {/* Cancel */}
                <button
                  onClick={() => {
                    if (!challengeLoading) {
                      setShowChallengeModal(false);
                      setSelectedFriend(null);
                    }
                  }}
                  disabled={challengeLoading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
