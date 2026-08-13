"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlatform } from "@/lib/native-bridge";
import { reportError } from "@/lib/report-error";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bbo_username: string | null;
  avatar_url: string | null;
  asd_id: number | null;
  asd_code: string | null;
  asd_name: string | null;
  profile_type: "junior" | "giovane" | "adulto" | "senior";
  role: "user" | "instructor" | "admin";
  xp: number;
  streak: number;
  last_login: string | null;
  hands_played: number;
  text_size: string;
  anim_speed: string;
  sound_on: boolean;
  memory_best: number | null;
  marketing_consent: boolean | null;
  marketing_consent_date: string | null;
  total_minutes: number;
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

  // Fetch profile from DB (non-blocking, updates state separately).
  //
  // Passa dalla RPC get_own_profile() perché le colonne personali di
  // `profiles` (marketing_consent, last_login, total_minutes, platform…) non
  // sono più leggibili direttamente: i privilegi di colonna valgono per ruolo
  // e non per riga, quindi bloccherebbero anche il proprio profilo.
  // Il fallback su select("*") copre l'intervallo fra il deploy di questo
  // codice e l'esecuzione di scripts/sql/pii-columns-2026-08.sql; si potrà
  // rimuovere una volta applicata la PARTE B di quello script.
  const fetchProfileInBackground = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_own_profile");
      if (!error && Array.isArray(data) && data.length > 0) {
        return data[0] as Profile;
      }
      const { data: legacy } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      return legacy as Profile | null;
    } catch (e) {
      // Niente toast: gira in background, ma l'errore non va scartato.
      reportError("use-auth:fetchProfileInBackground", e);
      return null;
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let authResolved = false;

    // Check if Supabase auth cookies exist in document.cookie
    const hasAuthCookies = (): boolean => {
      try {
        return document.cookie.includes("sb-") && document.cookie.includes("auth-token");
      } catch {
        return false;
      }
    };

    // Helper: set auth state immediately, then fetch profile in background
    const resolveAuth = (session: Session | null) => {
      if (!mounted || authResolved) return;
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

        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            // Valid session found → resolve immediately
            resolveAuth(session);
          }
          // If session is null, DON'T resolve yet - let the getSession() fallback
          // handle it. This fixes edge case where cookies exist but weren't parsed
          // in time for the INITIAL_SESSION event (e.g., direct URL access/refresh).
          return;
        }

        // For subsequent events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED), always update
        if (authResolved) authResolved = false;
        resolveAuth(session);

        // Update last_login on sign-in or token refresh. The platform is
        // written alongside so the DB trigger can stamp login_history with it.
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          supabase
            .from("profiles")
            .update({ last_login: new Date().toISOString(), platform: getPlatform() })
            .eq("id", session.user.id)
            .then(() => {});
        }
      }
    );

    // 2. Fallback: getSession() as authoritative check for null sessions
    //    Short delay (300ms) if cookies exist (possible recovery), otherwise 100ms
    const fallbackDelay = hasAuthCookies() ? 300 : 100;
    const fallbackTimer = setTimeout(async () => {
      if (authResolved || !mounted) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!authResolved && mounted) resolveAuth(session);
      } catch {
        if (!authResolved && mounted) resolveAuth(null);
      }
    }, fallbackDelay);

    // 3. Safety timeout: never stay loading forever (max 5 seconds)
    const timeout = setTimeout(() => {
      if (mounted && !authResolved) {
        authResolved = true;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subscription auth registrata una sola volta al mount; ri-eseguirla perderebbe/duplicherebbe eventi di login
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
    asdCode,
    asdName,
    profileType,
  }: {
    email: string;
    password: string;
    displayName: string;
    bboUsername?: string;
    asdCode?: string;
    asdName?: string;
    profileType?: "junior" | "giovane" | "adulto" | "senior";
  }) => {
    const { data, error } = await supabase.auth.signUp({
      // Spazi in coda: i correttori dei telefoni ne aggiungono uno dopo il
      // completamento automatico, e chi incolla l'indirizzo se lo porta
      // dietro. Nome e utente BBO venivano già ripuliti, l'email no — e
      // un'email diversa di uno spazio è un altro account.
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
          asd_code: asdCode || null,
          asd_name: asdName || null,
          profile_type: profileType || "adulto",
          platform: getPlatform(),
        }, { onConflict: "id" });
    }

    return { data, error: null };
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      // Stessa pulizia della registrazione: se le due strade normalizzano in
      // modo diverso, ci si registra con un indirizzo e si tenta l'accesso
      // con un altro, e il messaggio dice «password errata».
      email: email.trim(),
      password,
    });
    return { data, error };
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
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
