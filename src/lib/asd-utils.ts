/**
 * ASD club utilities (Phase 4.2.3).
 *
 * Pure helpers stay synchronous (`asdNameToSlug`) — no data dependency,
 * just a string transform. Lookup helpers are now async and pull from the
 * `asd_clubs` table via the cached catalog fetcher in `@/lib/catalog`.
 *
 * Client components that need reactive data should prefer the hooks in
 * `@/store/use-asd-store` (subscribe to the Zustand cache instead of
 * awaiting on every render).
 */

import { getActiveAsdClubs, getAsdClubByCode, type AsdClub } from "@/lib/catalog";

export type { AsdClub };

/**
 * Convert an ASD name to a URL-friendly slug.
 * "BAVENO BRIDGE CLUB" -> "baveno-bridge-club"
 *
 * Pure function, sync, safe to call from anywhere.
 */
export function asdNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Display name for a given F-code, or undefined. */
export async function getAsdNameByCode(
  code: string | null | undefined,
): Promise<string | undefined> {
  const club = await getAsdClubByCode(code);
  return club?.name;
}

/**
 * Reverse-lookup: slug → F-code. Searches active clubs first, then
 * inactive as fallback (keeps deep links to retired clubs alive).
 */
export async function slugToAsdCode(
  slug: string,
): Promise<string | undefined> {
  const all = await import("@/lib/catalog").then((m) => m.getAsdClubs());
  const active = all.find((c) => c.active && asdNameToSlug(c.name) === slug);
  if (active) return active.code;
  return all.find((c) => asdNameToSlug(c.name) === slug)?.code;
}

/** All active clubs with their slugs and codes — used for static route generation. */
export async function getAllClubSlugs(): Promise<
  { slug: string; code: string; name: string }[]
> {
  const active = await getActiveAsdClubs();
  return active.map((c) => ({
    slug: asdNameToSlug(c.name),
    code: c.code,
    name: c.name,
  }));
}

// Re-export the async lookup-by-code helper for callers that want the
// full club row (not just the name).
export { getAsdClubByCode };
