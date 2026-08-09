"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useActiveAsdClubs, useAsdClub } from "@/store/use-asd-store";
import type { AsdClub } from "@/lib/catalog";
import { reportError } from "@/lib/report-error";
import { toast } from "sonner";

export interface ProfileEdit {
  editing: boolean;
  setEditing: Dispatch<SetStateAction<boolean>>;
  editName: string;
  setEditName: Dispatch<SetStateAction<string>>;
  editBbo: string;
  setEditBbo: Dispatch<SetStateAction<string>>;
  editAsdSearch: string;
  setEditAsdSearch: Dispatch<SetStateAction<string>>;
  editAsdCode: string;
  setEditAsdCode: Dispatch<SetStateAction<string>>;
  editAsdSelectedName: string;
  showAsdDropdown: boolean;
  setShowAsdDropdown: Dispatch<SetStateAction<boolean>>;
  activeClubsSorted: AsdClub[];
  editAvatarPreview: string;
  saving: boolean;
  /** Apre il form precompilandolo con i valori correnti del profilo. */
  startEditing: () => void;
  /** Registra il file scelto e ne genera l'anteprima (data URL). */
  selectAvatarFile: (file: File) => void;
  /** Salva profilo + avatar e chiude il form. */
  save: () => Promise<void>;
}

/**
 * Stato del form "Modifica profilo" e salvataggio.
 *
 * Estratto da `src/app/profilo/page.tsx` senza cambi di comportamento: stesse
 * condizioni di diff sui campi, stessi `reportError`/`toast` in caso di errore.
 * Resta un hook (e non un componente) perché `useActiveAsdClubs`/`useAsdClub`
 * innescano il caricamento dei circoli e devono essere invocati a ogni render
 * della pagina, come prima.
 */
export function useProfileEdit(): ProfileEdit {
  const { profile: authProfile, updateProfile, uploadAvatar, refreshProfile } = useSharedAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBbo, setEditBbo] = useState("");
  const [editAsdSearch, setEditAsdSearch] = useState("");
  const [editAsdCode, setEditAsdCode] = useState("");
  const [showAsdDropdown, setShowAsdDropdown] = useState(false);
  const editAsdClub = useAsdClub(editAsdCode || undefined);
  const editAsdSelectedName = editAsdClub?.name ?? "";
  const activeClubsSorted = useActiveAsdClubs();
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = useCallback(() => {
    setEditName(authProfile?.display_name || "");
    setEditBbo(authProfile?.bbo_username || "");
    setEditAsdCode(authProfile?.asd_code || "");
    setEditAvatarFile(null);
    setEditAvatarPreview("");
    setEditing(true);
  }, [authProfile]);

  const selectAvatarFile = useCallback((file: File) => {
    setEditAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    const updates: Record<string, unknown> = {};
    if (editName.trim()) updates.display_name = editName.trim();
    if (editBbo !== (authProfile?.bbo_username || "")) updates.bbo_username = editBbo.trim() || null;
    if (editAsdCode !== (authProfile?.asd_code || "")) {
      updates.asd_code = editAsdCode || null;
      updates.asd_name = editAsdSelectedName || null;
    }
    if (Object.keys(updates).length > 0) {
      const { error } = await updateProfile(updates);
      if (error) {
        reportError("profilo:salva-profilo", error);
        toast.error("Salvataggio del profilo non riuscito. Riprova.");
      }
    }
    if (editAvatarFile) {
      const { error } = await uploadAvatar(editAvatarFile);
      if (error) {
        reportError("profilo:upload-avatar", error);
        toast.error("Caricamento della foto non riuscito. Riprova.");
      }
    }
    await refreshProfile();
    setSaving(false);
    setEditing(false);
    setEditAsdCode("");
    setEditAsdSearch("");
  }, [
    authProfile,
    editAsdCode,
    editAsdSelectedName,
    editAvatarFile,
    editBbo,
    editName,
    refreshProfile,
    updateProfile,
    uploadAvatar,
  ]);

  return {
    editing,
    setEditing,
    editName,
    setEditName,
    editBbo,
    setEditBbo,
    editAsdSearch,
    setEditAsdSearch,
    editAsdCode,
    setEditAsdCode,
    editAsdSelectedName,
    showAsdDropdown,
    setShowAsdDropdown,
    activeClubsSorted,
    editAvatarPreview,
    saving,
    startEditing,
    selectAvatarFile,
    save,
  };
}
