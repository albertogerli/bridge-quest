"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Conteggio leggero delle richieste di amicizia in arrivo (per i badge in nav).
 * Head-count al mount e quando la tab torna visibile — niente polling continuo.
 */
export function usePendingFriendRequests(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { count: c } = await supabase
          .from("friendships")
          .select("id", { count: "exact", head: true })
          .eq("friend_id", user.id)
          .eq("status", "pending");

        if (!cancelled) setCount(c ?? 0);
      } catch {
        // silenzioso: il badge è best-effort
      }
    };

    fetchCount();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return count;
}
