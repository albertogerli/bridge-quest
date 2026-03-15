"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface FriendProfile {
  id: string;
  display_name: string | null;
  bbo_username: string | null;
  avatar_url: string | null;
  asd_id: number | null;
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
  asd_id: number | null;
}

export function useFriends() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

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
      console.error("Error getting current user:", error);
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
        console.error("Error fetching sent friendships:", sentError);
        return;
      }

      // Query friendships where I am friend_id and status is accepted
      const { data: receivedFriendships, error: receivedError } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("friend_id", userId)
        .eq("status", "accepted");

      if (receivedError) {
        console.error("Error fetching received friendships:", receivedError);
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
        .select("id, display_name, bbo_username, avatar_url, asd_id, xp")
        .in("id", allProfileIds);

      if (profilesError) {
        console.error("Error fetching friend profiles:", profilesError);
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
      console.error("Error fetching friends:", error);
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
        console.error("Error fetching pending received:", receivedError);
        return;
      }

      // Pending requests I sent (user_id = me)
      const { data: sent, error: sentError } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("user_id", userId)
        .eq("status", "pending");

      if (sentError) {
        console.error("Error fetching pending sent:", sentError);
        return;
      }

      // Collect profile IDs for the OTHER person in each pending request
      const receivedUserIds = (received || []).map((f) => f.user_id);
      const sentFriendIds = (sent || []).map((f) => f.friend_id);
      const allProfileIds = [...receivedUserIds, ...sentFriendIds];

      let profileMap = new Map<string, FriendProfile>();

      if (allProfileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, bbo_username, avatar_url, asd_id, xp")
          .in("id", allProfileIds);

        if (profilesError) {
          console.error("Error fetching pending profiles:", profilesError);
          return;
        }

        for (const p of profiles || []) {
          profileMap.set(p.id, p as FriendProfile);
        }
      }

      // Build pending received with sender's profile
      const pendingReceivedList: Friendship[] = [];
      for (const f of received || []) {
        const profile = profileMap.get(f.user_id);
        if (profile) {
          pendingReceivedList.push({ ...f, profile });
        }
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
      console.error("Error fetching pending friendships:", error);
    }
  }, [supabase, getCurrentUserId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchPending()]);
    setLoading(false);
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
          console.error("Error searching users:", error);
          setSearchResults([]);
          return;
        }

        setSearchResults((data as SearchResult[]) || []);
      } catch (error) {
        console.error("Error searching users:", error);
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
        const { error } = await supabase.from("friendships").insert({
          user_id: currentUserId,
          friend_id: userId,
          status: "pending",
        });

        if (error) {
          console.error("Error adding friend:", error);
          return;
        }

        await fetchPending();
      } catch (error) {
        console.error("Error adding friend:", error);
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
          console.error("Error accepting friend:", error);
          return;
        }

        await fetchAll();
      } catch (error) {
        console.error("Error accepting friend:", error);
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
          console.error("Error declining friend:", error);
          return;
        }

        await fetchPending();
      } catch (error) {
        console.error("Error declining friend:", error);
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
          console.error("Error removing friend:", error);
          return;
        }

        await fetchAll();
      } catch (error) {
        console.error("Error removing friend:", error);
      }
    },
    [supabase, fetchAll]
  );

  // Fetch friends and pending on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Poll pending count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPending();
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchPending]);

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
