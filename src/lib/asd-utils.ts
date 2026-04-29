import { ASD_CLUBS, type AsdClub } from "@/data/asd-clubs";

/**
 * Convert an ASD name to a URL-friendly slug.
 * "BAVENO BRIDGE CLUB" -> "baveno-bridge-club"
 */
export function asdNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Lookup a club by F-code (e.g. "F0681"). Returns undefined if not found. */
export function getAsdClubByCode(code: string | null | undefined): AsdClub | undefined {
  if (!code) return undefined;
  return ASD_CLUBS.find((c) => c.code === code);
}

/** Display name for a given F-code, or undefined. */
export function getAsdNameByCode(code: string | null | undefined): string | undefined {
  return getAsdClubByCode(code)?.name;
}

/** Reverse-lookup: slug -> F-code. Searches active clubs first, then inactive as fallback. */
export function slugToAsdCode(slug: string): string | undefined {
  const active = ASD_CLUBS.find((c) => c.active && asdNameToSlug(c.name) === slug);
  if (active) return active.code;
  const any = ASD_CLUBS.find((c) => asdNameToSlug(c.name) === slug);
  return any?.code;
}

/** All active clubs with their slugs and codes — used for static route generation. */
export function getAllClubSlugs(): { slug: string; code: string; name: string }[] {
  return ASD_CLUBS.filter((c) => c.active).map((c) => ({
    slug: asdNameToSlug(c.name),
    code: c.code,
    name: c.name,
  }));
}
