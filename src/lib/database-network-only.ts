/** Authenticated database traffic must not enter an origin-agnostic cache. */
export function isDatabaseRequest(url: URL, configuredUrl?: string): boolean {
  let configuredOrigin: string | null = null;
  try { configuredOrigin = new URL(configuredUrl ?? "").origin; } catch { /* unset in a build fixture */ }
  return (url.hostname.endsWith(".supabase.co") || url.origin === configuredOrigin) &&
    ["/rest/", "/auth/", "/functions/", "/realtime/"].some(prefix => url.pathname.startsWith(prefix));
}
