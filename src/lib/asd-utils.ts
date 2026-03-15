import { ASD_LIST } from "@/data/asd-list";

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

/**
 * Reverse lookup: find the original ASD name from a slug.
 * "baveno-bridge-club" -> "BAVENO BRIDGE CLUB"
 */
export function slugToAsdName(slug: string): string | undefined {
  return ASD_LIST.find((name) => asdNameToSlug(name) === slug);
}

/**
 * Returns the 1-indexed position of an ASD in ASD_LIST (matching profiles.asd_id).
 * Throws if the name is not found.
 */
export function getAsdId(name: string): number {
  const index = ASD_LIST.indexOf(name as (typeof ASD_LIST)[number]);
  if (index === -1) {
    throw new Error(`ASD not found: ${name}`);
  }
  return index + 1;
}

/**
 * Returns the ASD name at the given 1-indexed id, or undefined if out of range.
 */
export function getAsdNameById(id: number): string | undefined {
  if (id < 1 || id > ASD_LIST.length) return undefined;
  return ASD_LIST[id - 1];
}

/**
 * Returns all clubs with their slugs and ids, useful for generating static routes.
 */
export function getAllClubSlugs(): { slug: string; name: string; id: number }[] {
  return ASD_LIST.map((name, index) => ({
    slug: asdNameToSlug(name),
    name,
    id: index + 1,
  }));
}
