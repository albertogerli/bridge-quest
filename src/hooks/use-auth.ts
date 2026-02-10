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

  // Fetch profile from DB
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data as Profile | null;
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ user: session.user, profile, session, loading: false });
        } else {
          setState({ user: null, profile: null, session: null, loading: false });
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setState({ user: null, profile: null, session: null, loading: false });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ user: session.user, profile, session, loading: false });
        } else {
          setState({ user: null, profile: null, session: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

    // Update profile with additional info
    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bbo_username: bboUsername || null,
          asd_id: asdId || null,
          profile_type: profileType || "adulto",
        })
        .eq("id", data.user.id);
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
    updateProfile,
    uploadAvatar,
    refreshProfile: async () => {
      if (state.user) {
        const profile = await fetchProfile(state.user.id);
        setState((prev) => ({ ...prev, profile }));
      }
    },
  };
}
