"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";

/**
 * Rete di sicurezza dietro il Realtime: le connessioni WebSocket cadono
 * (sospensione del dispositivo, cambio rete, proxy) e alla riconnessione gli
 * eventi persi NON vengono ritrasmessi. Il polling resta quindi come rete, ma
 * a intervallo lungo: da 30 s a 5 min (-90% richieste). La reattività la dà
 * il canale Realtime, non il timer.
 *
 * Copre anche un buco strutturale verificato il 2026-08-10: `friendships` ha
 * REPLICA IDENTITY di default (sola chiave primaria), quindi gli eventi DELETE
 * arrivano senza le colonne su cui filtriamo e il server non li consegna. Un
 * "amico rimosso" si vede quindi al primo refresh utile, non in tempo reale.
 */
const SAFETY_POLL_INTERVAL = 300_000; // 5 minuti

export interface FriendProfile {
  id: string;
  display_name: string | null;
  bbo_username: string | null;
  avatar_url: string | null;
  asd_code: string | null;
  asd_name: string | null;
  xp: number;
}

export interface Friendship {
  id: number;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  profile: FriendProfile; // the OTHER person's profile
}

export interface SearchResult {
  id: string;
  display_name: string | null;
  bbo_username: string | null;
  avatar_url: string | null;
  asd_code: string | null;
  asd_name: string | null;
}

export function useFriends() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);
  const [realtimeUserId, setRealtimeUserId] = useState<string | null>(null);

  const supabase = createClient();

  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    if (currentUserIdRef.current) return currentUserIdRef.current;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        currentUserIdRef.current = user.id;
        return user.id;
      }
      return null;
    } catch (error) {
      reportError("use-friends:getUser", error);
      return null;
    }
  }, [supabase]);

  const fetchFriends = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    try {
      // Query friendships where I am user_id and status is accepted
      const { data: sentFriendships, error: sentError } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("user_id", userId)
        .eq("status", "accepted");

      if (sentError) {
        reportError("use-friends:fetchFriends", sentError);
        return;
      }

      // Query friendships where I am friend_id and status is accepted
      const { data: receivedFriendships, error: receivedError } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("friend_id", userId)
        .eq("status", "accepted");

      if (receivedError) {
        reportError("use-friends:fetchFriends", receivedError);
        return;
      }

      // Collect profile IDs for the OTHER person
      const sentFriendIds = (sentFriendships || []).map((f) => f.friend_id);
      const receivedUserIds = (receivedFriendships || []).map((f) => f.user_id);
      const allProfileIds = [...sentFriendIds, ...receivedUserIds];

      if (allProfileIds.length === 0) {
        setFriends([]);
        return;
      }

      // Fetch profiles for all friend IDs
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, bbo_username, avatar_url, asd_code, asd_name, xp")
        .in("id", allProfileIds);

      if (profilesError) {
        reportError("use-friends:fetchFriends", profilesError);
        return;
      }

      const profileMap = new Map<string, FriendProfile>();
      for (const p of profiles || []) {
        profileMap.set(p.id, p as FriendProfile);
      }

      // Build Friendship objects with the other person's profile
      const combinedFriends: Friendship[] = [];

      for (const f of sentFriendships || []) {
        const profile = profileMap.get(f.friend_id);
        if (profile) {
          combinedFriends.push({ ...f, profile });
        }
      }

      for (const f of receivedFriendships || []) {
        const profile = profileMap.get(f.user_id);
        if (profile) {
          combinedFriends.push({ ...f, profile });
        }
      }

      setFriends(combinedFriends);
    } catch (error) {
      reportError("use-friends:fetchFriends", error);
    }
  }, [supabase, getCurrentUserId]);

  const fetchPending = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    try {
      // Pending requests I received (friend_id = me)
      const { data: received, error: receivedError } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("friend_id", userId)
        .eq("status", "pending");

      if (receivedError) {
        reportError("use-friends:fetchPending", receivedError);
        return;
      }

      // Pending requests I sent (user_id = me)
      const { data: sent, error: sentError } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("user_id", userId)
        .eq("status", "pending");

      if (sentError) {
        reportError("use-friends:fetchPending", sentError);
        return;
      }

      // Collect profile IDs for the OTHER person in each pending request
      const receivedUserIds = (received || []).map((f) => f.user_id);
      const sentFriendIds = (sent || []).map((f) => f.friend_id);
      const allProfileIds = [...receivedUserIds, ...sentFriendIds];

      const profileMap = new Map<string, FriendProfile>();

      if (allProfileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, bbo_username, avatar_url, asd_code, asd_name, xp")
          .in("id", allProfileIds);

        if (profilesError) {
          reportError("use-friends:fetchPending", profilesError);
          return;
        }

        for (const p of profiles || []) {
          profileMap.set(p.id, p as FriendProfile);
        }
      }

      // Build pending received with sender's profile. If the sender's profile
      // fails to load, include the request anyway with a fallback profile:
      // hiding it made incoming friend requests invisible (bug segnalato).
      const pendingReceivedList: Friendship[] = [];
      for (const f of received || []) {
        const profile: FriendProfile = profileMap.get(f.user_id) ?? {
          id: f.user_id,
          display_name: "Utente",
          bbo_username: null,
          avatar_url: null,
          asd_code: null,
          asd_name: null,
          xp: 0,
        };
        pendingReceivedList.push({ ...f, profile });
      }

      // Build pending sent with recipient's profile
      const pendingSentList: Friendship[] = [];
      for (const f of sent || []) {
        const profile = profileMap.get(f.friend_id);
        if (profile) {
          pendingSentList.push({ ...f, profile });
        }
      }

      setPendingReceived(pendingReceivedList);
      setPendingSent(pendingSentList);
    } catch (error) {
      reportError("use-friends:fetchPending", error);
    }
  }, [supabase, getCurrentUserId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchPending()]);
    setLoading(false);
  }, [fetchFriends, fetchPending]);

  /** Come fetchAll ma senza toccare `loading`: usato dai refresh in background
   *  (Realtime, timer di sicurezza, ritorno sulla tab) per non far lampeggiare
   *  gli scheletri di caricamento a schermo. */
  const refreshQuiet = useCallback(async () => {
    await Promise.all([fetchFriends(), fetchPending()]);
  }, [fetchFriends, fetchPending]);

  const searchUsers = useCallback(
    async (query: string) => {
      const userId = await getCurrentUserId();
      if (!userId || !query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const { data, error } = await supabase.rpc("search_users", {
          p_query: query,
          p_user_id: userId,
        });

        if (error) {
          reportError("use-friends:search", error);
          setSearchResults([]);
          return;
        }

        setSearchResults((data as SearchResult[]) || []);
      } catch (error) {
        reportError("use-friends:search", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [supabase, getCurrentUserId]
  );

  const addFriend = useCallback(
    async (userId: string) => {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) return;

      try {
        const { data: inserted, error } = await supabase
          .from("friendships")
          .insert({
            user_id: currentUserId,
            friend_id: userId,
            status: "pending",
          })
          .select("id")
          .single();

        if (error) {
          reportError("use-friends:add", error);
          return;
        }

        // Avvisa il destinatario via email (fire-and-forget)
        if (inserted?.id) {
          fetch("/api/friends/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ friendshipId: inserted.id }),
          }).catch(() => {});
        }

        await fetchPending();
      } catch (error) {
        reportError("use-friends:add", error);
      }
    },
    [supabase, getCurrentUserId, fetchPending]
  );

  const acceptFriend = useCallback(
    async (friendshipId: number) => {
      try {
        const { error } = await supabase
          .from("friendships")
          .update({ status: "accepted" })
          .eq("id", friendshipId);

        if (error) {
          reportError("use-friends:accept", error);
          return;
        }

        await fetchAll();
      } catch (error) {
        reportError("use-friends:accept", error);
      }
    },
    [supabase, fetchAll]
  );

  const declineFriend = useCallback(
    async (friendshipId: number) => {
      try {
        const { error } = await supabase
          .from("friendships")
          .update({ status: "declined" })
          .eq("id", friendshipId);

        if (error) {
          reportError("use-friends:decline", error);
          return;
        }

        await fetchPending();
      } catch (error) {
        reportError("use-friends:decline", error);
      }
    },
    [supabase, fetchPending]
  );

  const removeFriend = useCallback(
    async (friendshipId: number) => {
      try {
        const { error } = await supabase
          .from("friendships")
          .delete()
          .eq("id", friendshipId);

        if (error) {
          reportError("use-friends:remove", error);
          return;
        }

        await fetchAll();
      } catch (error) {
        reportError("use-friends:remove", error);
      }
    },
    [supabase, fetchAll]
  );

  // Fetch friends and pending on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Utente corrente per il canale Realtime. Va tenuto in stato (non solo nel
  // ref) perché il canale deve essere ricreato al cambio utente: login, logout
  // e refresh del token passano tutti da onAuthStateChange.
  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) setRealtimeUserId(data.user?.id ?? null);
      })
      .catch((error) => reportError("use-friends:getUser", error));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      currentUserIdRef.current = id;
      setRealtimeUserId(id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Supabase Realtime: due sottoscrizioni mirate sulla stessa connessione.
  // `friend_id=eq.<me>` copre le richieste RICEVUTE (insert) e il loro ciclo di
  // vita; `user_id=eq.<me>` copre quelle INVIATE (accettate/rifiutate da altri).
  // Il filtro è lato server e le RLS di `friendships` valgono anche qui: se una
  // riga non sarebbe leggibile via SELECT, l'evento non arriva.
  // Il suffisso casuale nel nome del canale evita collisioni di topic quando il
  // hook è montato da più componenti contemporaneamente (o in StrictMode, dove
  // l'effetto viene eseguito due volte).
  useEffect(() => {
    if (!realtimeUserId) return;

    const onChange = () => {
      void refreshQuiet();
    };

    const channel = supabase
      .channel(`friendships-${realtimeUserId}-${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `friend_id=eq.${realtimeUserId}`,
        },
        onChange
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `user_id=eq.${realtimeUserId}`,
        },
        onChange
      )
      .subscribe((status, error) => {
        if (error) reportError("use-friends:realtime", error);
        else if (status === "CHANNEL_ERROR") {
          reportError("use-friends:realtime", new Error(`canale in stato ${status}`));
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, realtimeUserId, refreshQuiet]);

  // Rete di sicurezza (vedi SAFETY_POLL_INTERVAL): il Realtime può perdere
  // eventi mentre il socket è giù e non li ritrasmette alla riconnessione.
  // Un timer lento più un refresh quando la tab torna in primo piano coprono
  // il buco senza reintrodurre il costo del polling a 30 s.
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshQuiet();
    }, SAFETY_POLL_INTERVAL);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshQuiet();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshQuiet]);

  return {
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
    refreshFriends: fetchAll,
    pendingCount: pendingReceived.length,
  };
}
