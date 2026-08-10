"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import {
  normalizeAvailability,
  sortCandidates,
  type AvailabilitySlot,
  type PartnerCandidate,
  type PartnerLevel,
} from "@/lib/partner-matching";

export interface MyPartnerProfile {
  looking: boolean;
  level: PartnerLevel;
  province: string | null;
  availability: AvailabilitySlot[];
}

export interface PartnerFilters {
  level: PartnerLevel | "";
  province: string;
  availability: AvailabilitySlot[];
}

/**
 * Dati di "Trova un compagno".
 *
 * La scheda personale non esiste finché non la si crea: `myProfile` resta
 * `null` per chi non si è mai messo in cerca, ed è quello stato a far mostrare
 * l'invito a partecipare invece dell'elenco. Nessuno compare fra i candidati
 * senza averlo chiesto.
 */
export function usePartnerMatching() {
  const supabase = useMemo(() => createClient(), []);
  const [myProfile, setMyProfile] = useState<MyPartnerProfile | null>(null);
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMine = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("partner_profiles")
      .select("looking, level, province, availability")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      reportError("partner:load-mine", error);
      return null;
    }
    if (!data) return null;

    const mine: MyPartnerProfile = {
      looking: Boolean(data.looking),
      level: data.level as PartnerLevel,
      province: data.province ?? null,
      availability: normalizeAvailability(data.availability),
    };
    setMyProfile(mine);
    return mine;
  }, [supabase]);

  const loadCandidates = useCallback(
    async (filters: PartnerFilters, mine: MyPartnerProfile | null) => {
      const { data, error } = await supabase.rpc("list_partner_candidates", {
        p_level: filters.level || null,
        p_province: filters.province || null,
        // Array vuoto = "qualsiasi fascia": passarlo così com'è escluderebbe
        // tutti, perché nessuna disponibilità si sovrappone al vuoto.
        p_availability: filters.availability.length ? filters.availability : null,
        p_limit: 60,
      });

      if (error) {
        reportError("partner:candidates", error);
        setCandidates([]);
        return;
      }

      const rows = (data ?? []) as PartnerCandidate[];
      // Il database ordina per vicinanza e accesso recente; qui si affina con
      // l'affinità completa, che il database non può calcolare senza duplicare
      // la logica di punteggio.
      setCandidates(
        mine
          ? sortCandidates(
              { level: mine.level, province: mine.province, availability: mine.availability },
              rows
            )
          : rows
      );
    },
    [supabase]
  );

  const refresh = useCallback(
    async (filters: PartnerFilters) => {
      setLoading(true);
      const mine = await loadMine();
      if (mine?.looking) await loadCandidates(filters, mine);
      else setCandidates([]);
      setLoading(false);
    },
    [loadMine, loadCandidates]
  );

  useEffect(() => {
    void refresh({ level: "", province: "", availability: [] });
  }, [refresh]);

  /** Entra nell'elenco o aggiorna la propria scheda. */
  const saveProfile = useCallback(
    async (profile: MyPartnerProfile) => {
      setSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase.from("partner_profiles").upsert(
          {
            user_id: user.id,
            looking: profile.looking,
            level: profile.level,
            province: profile.province || null,
            availability: profile.availability,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (error) {
          reportError("partner:save", error);
          return false;
        }
        setMyProfile(profile);
        return true;
      } finally {
        setSaving(false);
      }
    },
    [supabase]
  );

  /**
   * Esce dall'elenco. Si spegne `looking` invece di cancellare la riga, così
   * chi rientra ritrova le proprie impostazioni invece di ricompilarle.
   */
  const stopLooking = useCallback(async () => {
    if (!myProfile) return false;
    return saveProfile({ ...myProfile, looking: false });
  }, [myProfile, saveProfile]);

  return {
    myProfile,
    candidates,
    loading,
    saving,
    refresh,
    saveProfile,
    stopLooking,
  };
}
