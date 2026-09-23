import { describe, expect, it, vi } from "vitest";
import { assertSyncResult, createProgressWriter, writeProgress, type ProgressSnapshot } from "./progress-sync";
import type { SupabaseClient } from "@supabase/supabase-js";

const snapshot: ProgressSnapshot = {
  xp: 10, streak: 1, handsPlayed: 1, completedModules: {}, profile: "adulto",
  memoryBest: null, textSize: "medio", animSpeed: "normale", sound: true,
  totalMinutes: 1, badges: [], reviewItems: [],
};
describe("progress acknowledgement", () => {
  it("does not acknowledge a refused write and retries the same state", async () => {
    const write = vi.fn().mockRejectedValueOnce(new Error("denied")).mockResolvedValue("revision2");
    const writer = createProgressWriter(write);
    writer.initialize("a", "revision1");
    await expect(writer.push("a", snapshot)).rejects.toThrow("denied");
    await expect(writer.push("a", snapshot)).resolves.toEqual({ status: "saved", reviewRevision: "revision2" });
    expect(write).toHaveBeenCalledTimes(2);
    await expect(writer.push("a", snapshot)).resolves.toEqual({ status: "unchanged" });
  });
  it("detects changes only to review items", async () => {
    const write = vi.fn().mockResolvedValue("next");
    const writer = createProgressWriter(write);
    writer.initialize("a", "initial");
    await writer.push("a", snapshot);
    await writer.push("a", { ...snapshot, reviewItems: [{ lessonId: "7", moduleId: "7-3", wrongCount: 1 }] });
    expect(write).toHaveBeenCalledTimes(2);
  });
  it("does not acknowledge an old account's response in a new session", async () => {
    let resolve!: (s: string) => void;
    const write = vi.fn().mockReturnValueOnce(new Promise<string>((r) => { resolve = r; })).mockResolvedValue("b2");
    const writer = createProgressWriter(write);
    writer.initialize("a", "a1");
    const old = writer.push("a", snapshot);
    writer.initialize("b", "b1");
    resolve("a2"); await old;
    await writer.push("b", snapshot);
    expect(write.mock.calls[1][2]).toBe("b1");
    await expect(writer.push("a", snapshot)).rejects.toThrow("account");
  });
  it("treats Supabase error values as failures without leaking row details", () => {
    expect(() => assertSyncResult({ error: { code: "42501" } }, "reviews")).toThrow("42501");
  });
});

describe("every database refusal prevents acknowledgement", () => {
  it.each(["profiles", "completed_modules", "badges", "reviews"])("checks error returned by %s", async (failure) => {
    const response = (name: string) => ({ data: name === "reviews" ? "next" : null, count: 1, error: name === failure ? { code: "42501" } : null });
    const db = {
      auth: { getUser: async () => ({ data: { user: { id: "synthetic" } }, error: null }) },
      from: (name: string) => ({ update: () => ({ eq: async () => response(name) }), upsert: async () => response(name) }),
      rpc: async () => response("reviews"),
    } as unknown as SupabaseClient;
    await expect(writeProgress(db, "synthetic", { ...snapshot, completedModules: { "7-7-3": true }, badges: ["test"] }, "previous")).rejects.toThrow("42501");
  });
  it("rejects a profile update that affected no row", async () => {
    const db = { auth: { getUser: async () => ({ data: { user: { id: "a" } }, error: null }) }, from: () => ({ update: () => ({ eq: async () => ({ count: 0, error: null }) }) }) } as unknown as SupabaseClient;
    await expect(writeProgress(db, "a", snapshot, "previous")).rejects.toThrow("not updated");
  });
});
