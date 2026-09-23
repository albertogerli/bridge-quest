/** Local backups only. No payload or account identifiers are logged or sent. */
export function activateProgressOwner<T>(
  storage: Storage, owner: string | null, current: T, empty: T, keys: readonly string[],
): T | null {
  const next = owner ?? "guest";
  const previous = storage.getItem("bq_progress_owner");
  if (previous === next) return null;
  // Existing installations have no owner marker. Preserve, don't erase, that history.
  if (previous === null) {
    storage.setItem("bq_progress_legacy_backup", JSON.stringify({ current, local: Object.fromEntries(keys.map((k) => [k, storage.getItem(k)])) }));
    storage.setItem("bq_progress_owner", next);
    return null;
  }
  storage.setItem(`bq_progress_account:${previous}`, JSON.stringify({
    current, local: Object.fromEntries(keys.map((k) => [k, storage.getItem(k)])),
  }));
  // Validate the backup before changing the visible account.
  const raw = storage.getItem(`bq_progress_account:${next}`);
  const saved = raw ? JSON.parse(raw) as { current: T; local: Record<string, string | null> } : null;
  for (const key of keys) {
    const value = saved?.local[key];
    if (typeof value === "string") storage.setItem(key, value);
    else storage.removeItem(key);
  }
  storage.setItem("bq_progress_owner", next);
  return saved?.current ?? empty;
}
