"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Profile } from "@/hooks/use-auth";
import type { ProfileEdit } from "../_use-profile-edit";
import { useT } from "@/contexts/traduzioni-provider";

/** Sezione "Modifica profilo": pulsante di apertura e form (foto, nome, BBO, ASD). */
export function EditProfileSection({
  edit,
  authProfile,
}: {
  edit: ProfileEdit;
  authProfile: Profile | null;
}) {
  const t = useT();
  return (
    <>
      <Separator className="my-6 bg-border" />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.47 }}
      >
        {!edit.editing ? (
          <button
            onClick={edit.startEditing}
            className="w-full rounded-2xl bg-card p-4 text-left border-2 border-border shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{t("Modifica profilo")}</p>
                <p className="text-[12px] text-muted-foreground">{t("Foto, nome, BBO, associazione")}</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="9,6 15,12 9,18" />
              </svg>
            </div>
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-5 border-2 border-border shadow-sm"
          >
            <h3 className="text-sm font-bold text-foreground mb-4">{t("Modifica profilo")}</h3>

            {/* Avatar upload */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-16 w-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                {edit.editAvatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- anteprima locale (data URL) dal file input: next/image non la ottimizza
                  <img src={edit.editAvatarPreview} alt="Foto profilo" className="h-full w-full object-cover" />
                ) : authProfile?.avatar_url ? (
                  <Image src={authProfile.avatar_url} alt="Foto profilo" width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">{(authProfile?.display_name || "B")[0].toUpperCase()}</span>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                  {t("Cambia foto")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      edit.selectAvatarFile(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="block text-[12px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{t("Nome")}</label>
              <input
                type="text"
                value={edit.editName}
                onChange={(e) => edit.setEditName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* BBO */}
            <div className="mb-3">
              <label className="block text-[12px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{t("Username BBO")}</label>
              <input
                type="text"
                value={edit.editBbo}
                onChange={(e) => edit.setEditBbo(e.target.value)}
                placeholder="Il tuo username su BridgeBase Online"
                aria-invalid={edit.editBboError ? true : undefined}
                aria-describedby={edit.editBboError ? "bbo-error" : undefined}
                className={`w-full h-10 px-3 rounded-xl border bg-card text-foreground text-sm focus:outline-none focus:ring-2 ${
                  edit.editBboError
                    ? "border-destructive focus:ring-destructive"
                    : "border-border focus:ring-primary"
                }`}
              />
              {edit.editBboError && (
                <p id="bbo-error" role="alert" className="mt-1 text-[12px] font-semibold text-destructive">
                  {edit.editBboError}
                </p>
              )}
            </div>

            {/* ASD */}
            <div className="mb-4 relative">
              <label className="block text-[12px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">{t("Associazione (ASD)")}</label>
              <input
                type="text"
                value={edit.editAsdSelectedName || edit.editAsdSearch}
                onChange={(e) => {
                  edit.setEditAsdSearch(e.target.value);
                  edit.setEditAsdCode("");
                  edit.setShowAsdDropdown(true);
                }}
                onFocus={() => edit.setShowAsdDropdown(true)}
                placeholder="Cerca la tua associazione..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {edit.showAsdDropdown && !edit.editAsdCode && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => edit.setShowAsdDropdown(false)} />
                  <div className="absolute z-50 w-full mt-1 bg-card rounded-xl border border-border shadow-xl max-h-40 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    {edit.activeClubsSorted
                      .filter((c) => !edit.editAsdSearch || c.name.toLowerCase().includes(edit.editAsdSearch.toLowerCase()))
                      .slice(0, 15)
                      .map((club) => (
                        <button
                          key={club.code}
                          type="button"
                          onClick={() => { edit.setEditAsdCode(club.code); edit.setEditAsdSearch(""); edit.setShowAsdDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm text-foreground/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          <div>{club.name}</div>
                          {club.city && (
                            <div className="text-[12px] text-muted-foreground">
                              {club.city}{club.province ? ` (${club.province})` : ""}
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => edit.setEditing(false)}
                className="flex-1 h-10 rounded-xl font-semibold text-xs"
              >
                {t("Annulla")}
              </Button>
              <Button
                onClick={edit.save}
                disabled={edit.saving}
                className="flex-1 h-10 rounded-xl bg-figb font-semibold text-xs shadow-md disabled:opacity-50"
              >
                {edit.saving ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
