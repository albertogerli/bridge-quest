"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { Users, MapPin, Clock, UserPlus, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useFriends } from "@/hooks/use-friends";
import { useActiveAsdClubs } from "@/store/use-asd-store";
import {
  usePartnerMatching,
  type MyPartnerProfile,
  type PartnerFilters,
} from "@/hooks/use-partner-matching";
import {
  AVAILABILITY_SLOTS,
  LEVEL_LABELS,
  PARTNER_LEVELS,
  SLOT_LABELS,
  describeAvailability,
  matchReason,
  type AvailabilitySlot,
  type PartnerLevel,
} from "@/lib/partner-matching";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * "Trova un compagno".
 *
 * Risponde alla barriera più citata dalla ricerca dell'agenzia — «non ho
 * nessuno con cui giocare» — e a un dato interno: la sfida a un amico ha 144
 * visitatori in tre mesi contro i 4.400 della sfida al computer.
 *
 * Regola che governa tutta la pagina: si entra nell'elenco solo dichiarandolo,
 * e si esce quando si vuole. Chi non ha compilato la scheda non compare fra i
 * risultati di nessuno.
 */
export default function TrovaCompagnoPage() {
  const t = useT();
  const { user, loading: authLoading } = useSharedAuth();
  const router = useRouter();
  const { myProfile, candidates, loading, saving, refresh, saveProfile, stopLooking } =
    usePartnerMatching();
  const { addFriend } = useFriends();
  const clubs = useActiveAsdClubs();

  const [filters, setFilters] = useState<PartnerFilters>({
    level: "",
    province: "",
    availability: [],
  });
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);

  /** Province realmente esistenti nel catalogo circoli, senza elenchi inventati. */
  const provinces = useMemo(
    () => Array.from(new Set(clubs.map((c) => c.province).filter(Boolean))).sort(),
    [clubs]
  );

  const applyFilters = useCallback(
    (next: PartnerFilters) => {
      setFilters(next);
      void refresh(next);
    },
    [refresh]
  );

  const handleContact = useCallback(
    async (userId: string) => {
      // Ottimistico: la richiesta di amicizia è idempotente lato database e un
      // fallimento non lascia stato incoerente, solo un bottone da ripremere.
      setContacted((prev) => new Set(prev).add(userId));
      await addFriend(userId);
    },
    [addFriend]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          <h1 className="text-xl font-bold font-display mb-2">{t("Trova un compagno")}</h1>
          <p className="text-sm text-muted-foreground mb-5">
            {t("Per cercare un compagno di gioco serve un account: è gratuito e ci vuole un minuto.")}
          </p>
          <Button onClick={() => router.push("/login?mode=signup&redirect=/trova-compagno")}>
            {t("Registrati")}
          </Button>
        </div>
      </div>
    );
  }

  const inDirectory = myProfile?.looking === true;

  return (
    <div className="min-h-screen px-4 py-6 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-display">{t("Trova un compagno")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Il bridge si gioca in due. Qui trovi altri iscritti che stanno cercando qualcuno con cui giocare.")}
        </p>
      </header>

      {/* ─── Scheda personale ─────────────────────────────────────────────── */}
      {!inDirectory && !editing && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <h2 className="font-bold mb-1">{t("Mettiti in cerca")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("Comparirai nell'elenco con il tuo nome, il livello, la provincia e le fasce in cui sei disponibile. Niente altro: né la tua email, né un recapito. Puoi toglierti quando vuoi.")}
          </p>
          <Button onClick={() => setEditing(true)}>{t("Compila la scheda")}</Button>
        </div>
      )}

      {editing && (
        <PartnerForm
          initial={myProfile}
          provinces={provinces}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={async (profile) => {
            const ok = await saveProfile(profile);
            if (ok) {
              setEditing(false);
              void refresh(filters);
            }
          }}
        />
      )}

      {inDirectory && !editing && myProfile && (
        <div className="rounded-2xl border border-border bg-card p-4 mb-6 flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{t("Sei nell'elenco")}</Badge>
          <span className="text-sm text-muted-foreground">
            {LEVEL_LABELS[myProfile.level]}
            {myProfile.province ? ` · ${myProfile.province}` : ""} ·{" "}
            {describeAvailability(myProfile.availability)}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              {t("Modifica")}
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await stopLooking();
                void refresh(filters);
              }}
            >
              {t("Esci dall'elenco")}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Filtri e risultati ───────────────────────────────────────────── */}
      {inDirectory && (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            <select
              aria-label={t("Filtra per livello")}
              value={filters.level}
              onChange={(e) =>
                applyFilters({ ...filters, level: e.target.value as PartnerLevel | "" })
              }
              className="h-10 px-3 rounded-xl border border-border bg-card text-sm"
            >
              <option value="">{t("Tutti i livelli")}</option>
              {PARTNER_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>

            <select
              aria-label={t("Filtra per provincia")}
              value={filters.province}
              onChange={(e) => applyFilters({ ...filters, province: e.target.value })}
              className="h-10 px-3 rounded-xl border border-border bg-card text-sm"
            >
              <option value="">{t("Tutte le province")}</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {AVAILABILITY_SLOTS.map((slot) => {
              const active = filters.availability.includes(slot);
              return (
                <button
                  key={slot}
                  aria-pressed={active}
                  onClick={() =>
                    applyFilters({
                      ...filters,
                      availability: active
                        ? filters.availability.filter((s) => s !== slot)
                        : [...filters.availability, slot],
                    })
                  }
                  className={`h-10 px-3 rounded-xl border text-sm font-medium transition-colors ${
                    active
                      ? "bg-figb text-white border-figb"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  {SLOT_LABELS[slot]}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {t("Nessuno corrisponde a questi filtri. Prova ad allargarli — la funzione è appena nata e l'elenco si riempirà col tempo.")}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {candidates.map((c) => {
                  const reason = myProfile
                    ? matchReason(
                        {
                          level: myProfile.level,
                          province: myProfile.province,
                          availability: myProfile.availability,
                        },
                        c
                      )
                    : "";
                  const done = contacted.has(c.user_id);
                  return (
                    <motion.li
                      key={c.user_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4"
                    >
                      {c.avatar_url ? (
                        <Image
                          src={c.avatar_url}
                          alt=""
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-figb/10 text-figb flex items-center justify-center font-bold shrink-0">
                          {(c.display_name || "?")[0].toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{c.display_name || "Anonimo"}</p>
                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          <span>{LEVEL_LABELS[c.level as PartnerLevel] ?? c.level}</span>
                          {c.province && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" aria-hidden="true" />
                              {c.province}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {describeAvailability(c.availability)}
                          </span>
                        </p>
                        {reason && <p className="text-xs text-figb mt-1">{reason}</p>}
                      </div>

                      <Button
                        variant={done ? "outline" : "default"}
                        disabled={done}
                        onClick={() => handleContact(c.user_id)}
                        className="shrink-0"
                      >
                        {done ? (
                          <>
                            <Check className="w-4 h-4 mr-1" aria-hidden="true" /> {t("Inviata")}
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" aria-hidden="true" /> {t("Contatta")}
                          </>
                        )}
                      </Button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}

          <p className="text-xs text-muted-foreground mt-6 text-center">
            Contattare qualcuno gli invia una richiesta di amicizia. Se accetta,
            potrete sfidarvi. Le richieste si gestiscono da{" "}
            <Link href="/amici" className="underline">
              {t("Amici")}
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}

/** Scheda personale: livello, provincia e fasce di disponibilità. */
function PartnerForm({
  initial,
  provinces,
  saving,
  onSave,
  onCancel,
}: {
  initial: MyPartnerProfile | null;
  provinces: string[];
  saving: boolean;
  onSave: (profile: MyPartnerProfile) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [level, setLevel] = useState<PartnerLevel>(initial?.level ?? "principiante");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    initial?.availability ?? []
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-6">
      <h2 className="font-bold mb-4">{t("La tua scheda")}</h2>

      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
        {t("Livello")}
      </label>
      <div className="flex flex-wrap gap-2 mb-4">
        {PARTNER_LEVELS.map((l) => (
          <button
            key={l}
            aria-pressed={level === l}
            onClick={() => setLevel(l)}
            className={`h-10 px-4 rounded-xl border text-sm font-medium transition-colors ${
              level === l ? "bg-figb text-white border-figb" : "bg-card border-border hover:bg-muted"
            }`}
          >
            {LEVEL_LABELS[l]}
          </button>
        ))}
      </div>

      <label
        htmlFor="partner-province"
        className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider"
      >
        {t("Provincia")}
      </label>
      <select
        id="partner-province"
        value={province}
        onChange={(e) => setProvince(e.target.value)}
        className="w-full h-12 px-4 rounded-xl border border-border bg-card text-sm mb-1"
      >
        <option value="">{t("Non indicare")}</option>
        {provinces.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground mb-4">
        {t("Serve solo a farti trovare da chi ti sta vicino. Non chiediamo la città né l'indirizzo.")}
      </p>

      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
        {t("Quando puoi giocare")}
      </label>
      <div className="flex flex-wrap gap-2 mb-5">
        {AVAILABILITY_SLOTS.map((slot) => {
          const active = availability.includes(slot);
          return (
            <button
              key={slot}
              aria-pressed={active}
              onClick={() =>
                setAvailability(
                  active ? availability.filter((s) => s !== slot) : [...availability, slot]
                )
              }
              className={`h-10 px-4 rounded-xl border text-sm font-medium transition-colors ${
                active ? "bg-figb text-white border-figb" : "bg-card border-border hover:bg-muted"
              }`}
            >
              {SLOT_LABELS[slot]}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          disabled={saving}
          onClick={() => onSave({ looking: true, level, province: province || null, availability })}
        >
          {saving ? "Salvataggio…" : "Entra nell'elenco"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          {t("Annulla")}
        </Button>
      </div>
    </div>
  );
}
