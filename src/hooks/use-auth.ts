"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bbo_username: string | null;
  avatar_url: string | null;
  asd_id: number | null;
  profile_type: "junior" | "giovane" | "adulto" | "senior";
  xp: number;
  streak: number;
  last_login: string | null;
  hands_played: number;
  text_size: string;
  anim_speed: string;
  sound_on: boolean;
  memory_best: number | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  const supabase = createClient();

  // Fetch profile from DB (non-blocking, updates state separately)
  const fetchProfileInBackground = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      return data as Profile | null;
    } catch {
      return null;
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let authResolved = false;

    // Helper: set auth state immediately, then fetch profile in background
    const resolveAuth = (session: Session | null) => {
      if (!mounted) return;
      authResolved = true;

      if (session?.user) {
        // Set user IMMEDIATELY (don't wait for profile fetch)
        setState({ user: session.user, profile: null, session, loading: false });
        // Fetch profile in background (non-blocking)
        fetchProfileInBackground(session.user.id).then((profile) => {
          if (mounted && profile) {
            setState((prev) => ({ ...prev, profile }));
          }
        });
      } else {
        setState({ user: null, profile: null, session: null, loading: false });
      }
    };

    // 1. Subscribe to auth changes FIRST (catches INITIAL_SESSION event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // For subsequent events after initial, always update
        if (authResolved && event !== "INITIAL_SESSION") {
          authResolved = false;
        }

        resolveAuth(session);

        // Update last_login on sign-in or token refresh
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          supabase
            .from("profiles")
            .update({ last_login: new Date().toISOString() })
            .eq("id", session.user.id)
            .then(() => {});
        }
      }
    );

    // 2. Fallback: if onAuthStateChange hasn't fired within 1s, try getSession directly
    const fallbackTimer = setTimeout(async () => {
      if (authResolved || !mounted) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!authResolved && mounted) resolveAuth(session);
      } catch {
        if (!authResolved && mounted) resolveAuth(null);
      }
    }, 1000);

    // 3. Safety timeout: never stay loading forever (max 5 seconds)
    const timeout = setTimeout(() => {
      if (mounted) {
        setState((prev) => {
          if (prev.loading) {
            console.warn("Auth loading timeout - forcing loading=false");
            return { ...prev, loading: false };
          }
          return prev;
        });
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Inactivity timeout: auto-logout after 30 minutes of no interaction
  useEffect(() => {
    if (!state.user) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        console.log("Session timeout: auto-logout due to inactivity");
        try { localStorage.removeItem("bq_guest"); } catch {}
        await supabase.auth.signOut();
        setState({ user: null, profile: null, session: null, loading: false });
        window.location.href = "/";
      }, INACTIVITY_TIMEOUT);
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [state.user, supabase]);

  // Refresh session periodically (every 10 min) to keep token alive while active
  useEffect(() => {
    if (!state.session) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.refreshSession();
      if (!data.session) {
        // Session expired server-side
        setState({ user: null, profile: null, session: null, loading: false });
      }
    }, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(interval);
  }, [state.session, supabase]);

  // Sign up with email/password
  const signUp = async ({
    email,
    password,
    displayName,
    bboUsername,
    asdId,
    profileType,
  }: {
    email: string;
    password: string;
    displayName: string;
    bboUsername?: string;
    asdId?: number;
    profileType?: "junior" | "giovane" | "adulto" | "senior";
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) return { error };

    // Upsert profile with additional info (handles case where auto-trigger hasn't created row yet)
    if (data.user) {
      await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          display_name: displayName,
          bbo_username: bboUsername || null,
          asd_id: asdId || null,
          profile_type: profileType || "adulto",
        }, { onConflict: "id" });
    }

    return { data, error: null };
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, session: null, loading: false });
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) return { error: new Error("Not logged in") };

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", state.user.id)
      .select()
      .single();

    if (data) {
      setState((prev) => ({ ...prev, profile: data as Profile }));
    }

    return { data, error };
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!state.user) return { error: new Error("Not logged in"), url: null };

    const fileExt = file.name.split(".").pop();
    const filePath = `${state.user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) return { error: uploadError, url: null };

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Update profile with avatar URL
    await updateProfile({ avatar_url: publicUrl });

    return { error: null, url: publicUrl };
  };

  return {
    user: state.user,
    profile: state.profile,
    session: state.session,
    loading: state.loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    uploadAvatar,
    refreshProfile: async () => {
      if (state.user) {
        const profile = await fetchProfileInBackground(state.user.id);
        setState((prev) => ({ ...prev, profile }));
      }
    },
  };
}
