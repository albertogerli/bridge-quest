import { describe, expect, it } from "vitest";
import { activateProgressOwner } from "./progress-owner";
describe("local account boundaries", () => {
  it("archives and restores each owner, including guest progress", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } } as Storage;
    storage.setItem("reviews", "[1]");
    expect(activateProgressOwner(storage, "a", { xp: 10 }, { xp: 0 }, ["reviews"])).toBeNull();
    expect(activateProgressOwner(storage, "b", { xp: 10 }, { xp: 0 }, ["reviews"])).toEqual({ xp: 0 });
    expect(storage.getItem("reviews")).toBeNull();
    storage.setItem("reviews", "[2]");
    expect(activateProgressOwner(storage, "a", { xp: 20 }, { xp: 0 }, ["reviews"])).toEqual({ xp: 10 });
    expect(storage.getItem("reviews")).toBe("[1]");
    expect(activateProgressOwner(storage, null, { xp: 10 }, { xp: 0 }, ["reviews"])).toEqual({ xp: 0 });
    expect(storage.getItem("bq_progress_legacy_backup")).not.toBeNull();
  });
});
