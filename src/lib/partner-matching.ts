/**
 * "Trova un compagno" — logica pura.
 *
 * Nasce dall'offerta Adiacent: «una delle barriere più citate è "non ho
 * nessuno con cui giocare"». I dati interni la confermano: la sfida a un amico
 * ha 144 visitatori in tre mesi contro i 4.400 della sfida al computer.
 *
 * Le decisioni stanno qui, l'I/O sta nella pagina e nella RPC
 * `list_partner_candidates` (vedi scripts/sql/partner-matching-2026-08.sql).
 */

// ─── Livelli ────────────────────────────────────────────────────────────────

/**
 * Livello dichiarato, non dedotto dall'XP: si possono avere molti punti sulla
 * piattaforma e sentirsi comunque principianti al tavolo. È chi cerca a sapere
 * con chi si troverebbe a proprio agio.
 */
export const PARTNER_LEVELS = ["principiante", "intermedio", "avanzato"] as const;
export type PartnerLevel = (typeof PARTNER_LEVELS)[number];

export const LEVEL_LABELS: Record<PartnerLevel, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzato: "Avanzato",
};

export function isPartnerLevel(value: unknown): value is PartnerLevel {
  return typeof value === "string" && (PARTNER_LEVELS as readonly string[]).includes(value);
}

// ─── Disponibilità ──────────────────────────────────────────────────────────

/**
 * Fasce volutamente grossolane. Un calendario preciso sarebbe più difficile da
 * compilare, invecchierebbe subito e direbbe a estranei quando non si è in
 * casa.
 */
export const AVAILABILITY_SLOTS = ["mattina", "pomeriggio", "sera", "weekend"] as const;
export type AvailabilitySlot = (typeof AVAILABILITY_SLOTS)[number];

export const SLOT_LABELS: Record<AvailabilitySlot, string> = {
  mattina: "Mattina",
  pomeriggio: "Pomeriggio",
  sera: "Sera",
  weekend: "Weekend",
};

export function isAvailabilitySlot(value: unknown): value is AvailabilitySlot {
  return typeof value === "string" && (AVAILABILITY_SLOTS as readonly string[]).includes(value);
}

/**
 * Ripulisce quello che arriva dal database o da un form: scarta valori
 * sconosciuti, elimina i doppioni e riordina secondo l'ordine canonico, così
 * due schede identiche si mostrano allo stesso modo.
 */
export function normalizeAvailability(value: unknown): AvailabilitySlot[] {
  if (!Array.isArray(value)) return [];
  const found = new Set<AvailabilitySlot>();
  for (const item of value) {
    if (isAvailabilitySlot(item)) found.add(item);
  }
  return AVAILABILITY_SLOTS.filter((slot) => found.has(slot));
}

/** Fasce in comune, nell'ordine canonico. */
export function availabilityOverlap(
  a: readonly string[],
  b: readonly string[]
): AvailabilitySlot[] {
  const second = new Set(normalizeAvailability(b));
  return normalizeAvailability(a).filter((slot) => second.has(slot));
}

/** Disponibilità in forma leggibile ("Mattina e sera", "Sempre disponibile"). */
export function describeAvailability(value: readonly string[]): string {
  const slots = normalizeAvailability(value);
  if (slots.length === 0) return "Nessuna fascia indicata";
  if (slots.length === AVAILABILITY_SLOTS.length) return "Sempre disponibile";
  const labels = slots.map((s) => SLOT_LABELS[s]);
  const last = labels[labels.length - 1];
  return labels.length === 1
    ? last
    : `${labels.slice(0, -1).join(", ")} e ${last.toLowerCase()}`;
}

// ─── Ordinamento dei candidati ──────────────────────────────────────────────

export interface PartnerCandidate {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  asd_name: string | null;
  level: string;
  province: string | null;
  availability: string[];
}

export interface PartnerSeeker {
  level: string;
  province: string | null;
  availability: string[];
}

/** Distanza fra due livelli: 0 uguali, 1 adiacenti, 2 estremi opposti. */
function levelDistance(a: string, b: string): number {
  const ia = PARTNER_LEVELS.indexOf(a as PartnerLevel);
  const ib = PARTNER_LEVELS.indexOf(b as PartnerLevel);
  if (ia < 0 || ib < 0) return 2;
  return Math.abs(ia - ib);
}

/**
 * Punteggio di affinità, più alto è meglio.
 *
 * I pesi dicono cosa conta davvero per giocare insieme, in quest'ordine:
 * stessa provincia (senza, non ci si incontra), almeno un'ora in comune
 * (senza, non si gioca), livello vicino (comodità, non requisito).
 *
 * Un livello diverso non esclude nessuno: chi è alle prime armi spesso impara
 * meglio con qualcuno più esperto, e l'elenco resta comunque completo.
 */
export function matchScore(seeker: PartnerSeeker, candidate: PartnerCandidate): number {
  let score = 0;

  if (seeker.province && candidate.province && seeker.province === candidate.province) {
    score += 100;
  }

  const shared = availabilityOverlap(seeker.availability, candidate.availability);
  score += Math.min(shared.length, 3) * 20;

  score += (2 - levelDistance(seeker.level, candidate.level)) * 10;

  return score;
}

/**
 * Ordina per affinità decrescente. A parità di punteggio l'ordine di partenza
 * è conservato (`sort` è stabile), così l'ordinamento del database — che mette
 * davanti chi ha fatto accesso di recente — non viene buttato via.
 */
export function sortCandidates(
  seeker: PartnerSeeker,
  candidates: readonly PartnerCandidate[]
): PartnerCandidate[] {
  return [...candidates].sort((a, b) => matchScore(seeker, b) - matchScore(seeker, a));
}

/** Motivo dell'accostamento, da mostrare sotto il nome. */
export function matchReason(seeker: PartnerSeeker, candidate: PartnerCandidate): string {
  const reasons: string[] = [];
  if (seeker.province && candidate.province === seeker.province) {
    reasons.push("stessa provincia");
  }
  const shared = availabilityOverlap(seeker.availability, candidate.availability);
  if (shared.length > 0) {
    reasons.push(
      shared.length === 1
        ? `disponibile ${SLOT_LABELS[shared[0]].toLowerCase()}`
        : `${shared.length} fasce in comune`
    );
  }
  if (candidate.level === seeker.level) reasons.push("stesso livello");
  return reasons.join(" · ");
}
