import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addFetchInstrumentationHandler, resetInstrumentationHandlers } from "@sentry/core";
import { assertSyncResult, createProgressWriter, readProgress, writeProgress, SyncAuthError, SyncSessionChangedError, SyncWriteError, type ProgressSnapshot } from "./progress-sync";
import { describeError } from "./describe-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError, createClient } from "@supabase/supabase-js";

const snapshot: ProgressSnapshot = {
  xp: 10, streak: 1, handsPlayed: 1, completedModules: {}, profile: "adulto",
  memoryBest: null, textSize: "medio", animSpeed: "normale", sound: true,
  totalMinutes: 1, badges: [], reviewItems: [],
};
beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
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
    resolve("a2"); await expect(old).resolves.toEqual({ status: "cancelled" });
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
      auth: {
        getSession: async () => ({ data: { session: { access_token: "synthetic-token" } }, error: null }),
        getUser: async () => ({ data: { user: { id: "synthetic" } }, error: null }),
      },
      from: (name: string) => ({ update: () => ({ eq: () => ({ setHeader: async () => response(name) }) }), upsert: () => ({ setHeader: async () => response(name) }) }),
      rpc: () => ({ setHeader: async () => response("reviews") }),
    } as unknown as SupabaseClient;
    await expect(writeProgress(db, "synthetic", { ...snapshot, completedModules: { "7-7-3": true }, badges: ["test"] }, "previous")).rejects.toThrow("42501");
  });
  it("rejects a profile update that affected no row", async () => {
    const db = { auth: {
      getSession: async () => ({ data: { session: { access_token: "synthetic-token" } }, error: null }),
      getUser: async () => ({ data: { user: { id: "a" } }, error: null }),
    }, from: () => ({ update: () => ({ eq: () => ({ setHeader: async () => ({ count: 0, error: null }) }) }) }) } as unknown as SupabaseClient;
    await expect(writeProgress(db, "a", snapshot, "previous")).rejects.toThrow("not updated");
  });
});

it("keeps the verified owner's token if the browser account changes before the review RPC", async () => {
  let token = "synthetic-token-a";
  const headers: Array<{ path: string; authorization: string | null }> = [];
  const db = createClient("https://sync-test.invalid", "synthetic-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, options) => {
      const path = new URL(String(input)).pathname;
      headers.push({ path, authorization: new Headers(options?.headers).get("Authorization") });
      if (path.endsWith("/profiles")) {
        token = "synthetic-token-b";
        return new Response(null, { status: 204, headers: { "content-range": "*/1" } });
      }
      return new Response(JSON.stringify("next"), { status: 200 });
    } },
  });
  vi.spyOn(db.auth, "getSession").mockImplementation(async () => ({ data: { session: { access_token: token } }, error: null }) as Awaited<ReturnType<typeof db.auth.getSession>>);
  vi.spyOn(db.auth, "getUser").mockResolvedValue({ data: { user: { id: "synthetic-a" } }, error: null } as Awaited<ReturnType<typeof db.auth.getUser>>);
  await writeProgress(db, "synthetic-a", { ...snapshot, completedModules: { "1-1": true }, badges: ["synthetic"] }, "previous");
  expect(headers).toEqual([
    { path: "/rest/v1/profiles", authorization: "Bearer synthetic-token-a" },
    { path: "/rest/v1/completed_modules", authorization: "Bearer synthetic-token-a" },
    { path: "/rest/v1/badges", authorization: "Bearer synthetic-token-a" },
    { path: "/rest/v1/rpc/sync_review_items", authorization: "Bearer synthetic-token-a" },
  ]);
  expect(db.auth.getUser).toHaveBeenCalledWith("synthetic-token-a");
  await db.rpc("outside_sync");
  expect(headers.at(-1)?.authorization).toBe("Bearer synthetic-token-b");
});

function authFixture() {
  const getSession = vi.fn().mockResolvedValue({ data: { session: { access_token: "synthetic-token-a" } }, error: null });
  const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "synthetic-a" } }, error: null });
  const request = vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname;
    return path.endsWith("/profiles")
      ? new Response(null, { status: 204, headers: { "content-range": "*/1" } })
      : new Response(JSON.stringify(path.endsWith("/sync_review_items") ? "next" : []), { status: 200 });
  });
  const db = createClient("https://sync-test.invalid", "synthetic-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: request },
  });
  vi.spyOn(db.auth, "getSession").mockImplementation(getSession);
  vi.spyOn(db.auth, "getUser").mockImplementation(getUser);
  return { db, getSession, getUser, request };
}

it("recognizes errors enhanced by the installed Sentry instrumentation, without retaining the host", async () => {
  const nativeFetch = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", nativeFetch);
  resetInstrumentationHandlers();
  const remove = addFetchInstrumentationHandler(() => {});
  try {
    const db = createClient("https://private-host.invalid", "synthetic-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: globalThis.fetch },
    });
    for (const message of ["Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource."]) {
      nativeFetch.mockRejectedValueOnce(new TypeError(message));
      const response = await db.from("profiles").update({ xp: 10 });
      expect(response.error?.message).toBe(`TypeError: ${message} (private-host.invalid)`);
      let failure: unknown;
      try { assertSyncResult(response, "profile"); } catch (error) { failure = error; }
      expect(failure).toMatchObject({ code: "network_error", status: 0 });
      expect(JSON.stringify(describeError(failure))).not.toContain("private-host");
    }
  } finally { remove(); resetInstrumentationHandlers(); }
});

describe("bounded retries of safe requests", () => {
  it.each(["profiles", "completed_modules", "badges"])("recovers %s alone without repeating completed writes", async (table) => {
    const f = authFixture();
    const success = f.request.getMockImplementation()!;
    let failed = false;
    f.request.mockImplementation(async (input) => {
      if (String(input).includes(`/${table}?`) || String(input).endsWith(`/${table}`)) {
        if (!failed) { failed = true; throw new TypeError("Failed to fetch (sync-test.invalid)"); }
      }
      return success(input);
    });
    const pending = writeProgress(f.db, "synthetic-a", { ...snapshot, completedModules: { "1-1": true }, badges: ["test"] }, "previous");
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("next");
    const counts = (name: string) => f.request.mock.calls.filter(([url]) => new URL(String(url)).pathname.endsWith(`/${name}`)).length;
    expect(counts(table)).toBe(2);
    for (const other of ["profiles", "completed_modules", "badges"].filter(name => name !== table)) expect(counts(other)).toBe(1);
    expect(counts("sync_review_items")).toBe(1);
  });
  it.each(["getSession", "getUser"] as const)("recovers transient %s failures before writing", async (step) => {
    const f = authFixture();
    f[step].mockResolvedValueOnce({ data: { session: null, user: null }, error: new AuthRetryableFetchError("private detail", 0) });
    const pending = writeProgress(f.db, "synthetic-a", snapshot, "previous");
    await vi.advanceTimersByTimeAsync(999);
    expect(f.request).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toBe("next");
    expect(f.getUser).toHaveBeenLastCalledWith("synthetic-token-a");
  });
  it.each([502, 503, 504])("recovers a transient HTTP %s", async (status) => {
    const f = authFixture();
    f.request.mockResolvedValueOnce(new Response("gateway failure", { status }));
    const pending = writeProgress(f.db, "synthetic-a", snapshot, "previous");
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("next");
    expect(f.request).toHaveBeenCalledTimes(3);
  });
  it("keeps the exact profile payload and verified token across a retry", async () => {
    const f = authFixture();
    const success = f.request.getMockImplementation()!;
    const attempts: RequestInit[] = [];
    f.request.mockImplementation(async (input, ...args: unknown[]) => {
      if (String(input).includes("/profiles?")) {
        attempts.push(args[0] as RequestInit);
        if (attempts.length === 1) {
          f.getSession.mockResolvedValue({ data: { session: { access_token: "synthetic-token-b" } }, error: null });
          throw new TypeError("Load failed");
        }
      }
      return success(input);
    });
    const pending = writeProgress(f.db, "synthetic-a", snapshot, "previous");
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("next");
    expect(attempts[1].body).toBe(attempts[0].body);
    expect(new Headers(attempts[1].headers).get("Authorization")).toBe("Bearer synthetic-token-a");
  });
  it("does not retry a revision-changing RPC after a possibly committed response is lost", async () => {
    const f = authFixture();
    const success = f.request.getMockImplementation()!;
    f.request.mockImplementation(async input => {
      if (String(input).endsWith("/sync_review_items")) throw new TypeError("Failed to fetch");
      return success(input);
    });
    await expect(writeProgress(f.db, "synthetic-a", snapshot, "previous")).rejects.toMatchObject({ code: "network_error" });
    expect(f.request).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels a retry if ownership changes during the wait", async () => {
    const f = authFixture();
    f.request.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    let current = true;
    const pending = writeProgress(f.db, "synthetic-a", snapshot, "previous", () => current).catch(error => error);
    await vi.advanceTimersByTimeAsync(500);
    current = false;
    await vi.advanceTimersByTimeAsync(500);
    expect(await pending).toBeInstanceOf(SyncSessionChangedError);
    expect(f.request).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not burn short retries when the browser reports offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const f = authFixture();
    f.request.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(writeProgress(f.db, "synthetic-a", snapshot, "previous")).rejects.toMatchObject({ code: "network_error" });
    expect(f.request).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("code-less profile failures through the real Supabase SDK", () => {
  const privatePayload = "private-account-data-not-for-telemetry";
  it.each([
    { label: "Chrome network failure", failure: () => { throw new TypeError("Failed to fetch"); }, code: "network_error", status: 0 },
    { label: "Firefox network failure", failure: () => { throw new TypeError("NetworkError when attempting to fetch resource."); }, code: "network_error", status: 0 },
    { label: "Safari network failure", failure: () => { throw new TypeError("Load failed"); }, code: "network_error", status: 0 },
    { label: "Sentry-enhanced Edge failure", failure: () => { throw new TypeError("Failed to fetch (sync-test.invalid)"); }, code: "network_error", status: 0 },
    { label: "Sentry-enhanced Safari failure", failure: () => { throw new TypeError("Load failed (sync-test.invalid)"); }, code: "network_error", status: 0 },
    { label: "Sentry-enhanced Firefox failure", failure: () => { throw new TypeError("NetworkError when attempting to fetch resource. (sync-test.invalid:56321)"); }, code: "network_error", status: 0 },
    { label: "aborted request", failure: () => { throw new DOMException(privatePayload, "AbortError"); }, code: "request_aborted", status: 0 },
    { label: "unknown client exception", failure: () => { throw new TypeError(privatePayload); }, code: "client_error", status: 0 },
    { label: "HTML gateway failure", failure: () => new Response(`<html>${privatePayload}</html>`, { status: 502 }), code: "http_error", status: 502 },
    { label: "code-less HTTP refusal", failure: () => new Response(JSON.stringify({ message: privatePayload }), { status: 403 }), code: "http_error", status: 403 },
    { label: "non-JSON successful HTTP response", failure: () => new Response(`<html>${privatePayload}</html>`, { status: 200 }), code: "invalid_response", status: 200 },
    ...[
      { label: "permissions", code: "42501", status: 403 },
      { label: "revision conflict", code: "40001", status: 409 },
      { label: "PostgREST auth error", code: "PGRST301", status: 401 },
    ].map(item => ({ ...item, failure: () => new Response(JSON.stringify({
      code: item.code, message: privatePayload, details: privatePayload, hint: privatePayload,
    }), { status: item.status }) })),
    { label: "unsafe code", failure: () => new Response(JSON.stringify({ code: privatePayload, message: privatePayload }), { status: 400 }), code: "http_error", status: 400 },
    { label: "blank server code", failure: () => new Response(JSON.stringify({ code: "", message: privatePayload }), { status: 500 }), code: "http_error", status: 500 },
  ])("preserves safe diagnostics and retries unacknowledged state: $label", async ({ failure, code, status }) => {
    const f = authFixture();
    const successfulRequest = f.request.getMockImplementation()!;
    f.request.mockImplementation(async () => failure());
    const writer = createProgressWriter((owner, state, revision, current) => writeProgress(f.db, owner, state, revision, current));
    writer.initialize("synthetic-a", "previous");

    const pending = writer.push("synthetic-a", snapshot).catch(e => e);
    await vi.advanceTimersByTimeAsync(4_000);
    const error = await pending;
    expect(error).toBeInstanceOf(SyncWriteError);
    expect(error).not.toBeInstanceOf(SyncSessionChangedError);
    expect(error).toMatchObject({ name: "SyncWriteError", code, status });
    expect(error.message).toBe(`Sync profile failed (${code}; status ${status})`);
    expect(describeError(error).context).toEqual({ code, status });
    expect(JSON.stringify(error)).not.toContain(privatePayload);
    expect(error.message).not.toContain(privatePayload);
    expect(error.cause).toBeUndefined();
    const attempts = code === "network_error" || status === 502 ? 3 : 1;
    expect(f.request).toHaveBeenCalledTimes(attempts); // No later writes after a failed profile.

    f.request.mockImplementation(successfulRequest);
    await expect(writer.push("synthetic-a", snapshot)).resolves.toEqual({ status: "saved", reviewRevision: "next" });
    expect(f.request).toHaveBeenCalledTimes(attempts + 2);
    await expect(writer.push("synthetic-a", snapshot)).resolves.toEqual({ status: "unchanged" });
  });

  it.each([undefined, NaN, -1, 600])("keeps unknown status/code explicit, not guessed as network: %s", (status) => {
    let error: unknown;
    try { assertSyncResult({ error: { code: " ", message: privatePayload }, status }, "profile"); } catch (e) { error = e; }
    expect(error).toMatchObject({ code: "unknown_error", status: undefined, message: "Sync profile failed (unknown_error; status unknown)" });
    expect(describeError(error).context).toEqual({ code: "unknown_error" });
  });
});

describe("session interruption versus real authentication errors", () => {
  it.each(["getSession", "getUser"] as const)("keeps a network error from %s visible and does not write", async (step) => {
    const f = authFixture();
    f[step].mockResolvedValue({ data: { session: null, user: null }, error: new AuthRetryableFetchError("private diagnostic not for telemetry", 0) });
    const pending = writeProgress(f.db, "synthetic-a", snapshot, "previous").catch(e => e);
    await vi.advanceTimersByTimeAsync(4_000);
    const error = await pending;
    expect(error).toBeInstanceOf(SyncAuthError);
    expect(error).toMatchObject({ code: "AuthRetryableFetchError", status: 0 });
    expect(error.message).not.toContain("private diagnostic");
    expect(f.request).not.toHaveBeenCalled();
    expect(f[step]).toHaveBeenCalledTimes(3);
  });
  it.each([
    new AuthApiError("private response", 403, "unexpected_failure"),
    new AuthApiError("private response", 500, "unexpected_failure"),
    new AuthApiError("private response", 401, "bad_jwt"),
  ])("does not hide permissions, server failures or invalid tokens", async (error) => {
    const f = authFixture();
    f.getUser.mockResolvedValueOnce({ data: { user: null }, error });
    await expect(writeProgress(f.db, "synthetic-a", snapshot, "previous")).rejects.toBeInstanceOf(SyncAuthError);
    expect(f.request).not.toHaveBeenCalled();
  });
  it.each([new AuthSessionMissingError(), new AuthApiError("signed out", 403, "session_not_found")])(
    "classifies a confirmed missing session as cancellation, without writing", async (error) => {
      const f = authFixture();
      f.getUser.mockResolvedValueOnce({ data: { user: null }, error });
      await expect(writeProgress(f.db, "synthetic-a", snapshot, "previous")).rejects.toBeInstanceOf(SyncSessionChangedError);
      expect(f.request).not.toHaveBeenCalled();
    },
  );
  it("does not infer identity from the unverified stored session", async () => {
    const f = authFixture();
    f.getSession.mockResolvedValue({ data: { session: { access_token: "synthetic-token-b", user: { id: "synthetic-a" } } }, error: null });
    f.getUser.mockResolvedValue({ data: { user: { id: "synthetic-b" } }, error: null });
    await expect(writeProgress(f.db, "synthetic-a", snapshot, "previous")).rejects.toBeInstanceOf(SyncSessionChangedError);
    expect(f.getUser).toHaveBeenCalledWith("synthetic-token-b");
    expect(f.request).not.toHaveBeenCalled();
  });
  it("does not query auth or data without a stored session", async () => {
    const f = authFixture();
    f.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(writeProgress(f.db, "synthetic-a", snapshot, "previous")).rejects.toBeInstanceOf(SyncSessionChangedError);
    expect(f.getUser).not.toHaveBeenCalled();
    expect(f.request).not.toHaveBeenCalled();
  });
  it("a cancelled save is not acknowledged and the same progress is retried", async () => {
    const write = vi.fn().mockRejectedValueOnce(new SyncSessionChangedError()).mockResolvedValue("next");
    const writer = createProgressWriter(write);
    writer.initialize("a", "previous");
    await expect(writer.push("a", snapshot)).resolves.toEqual({ status: "cancelled" });
    await expect(writer.push("a", snapshot)).resolves.toEqual({ status: "saved", reviewRevision: "next" });
    expect(write).toHaveBeenCalledTimes(2);
    expect(write.mock.calls[1][2]).toBe("previous");
  });
  it("cancels an old account's late rejection without touching a new account", async () => {
    let reject!: (error: Error) => void;
    const write = vi.fn().mockReturnValueOnce(new Promise<string>((_, r) => { reject = r; })).mockResolvedValue("b2");
    const writer = createProgressWriter(write);
    writer.initialize("a", "a1");
    const old = writer.push("a", snapshot);
    const isCurrent = write.mock.calls[0][3];
    writer.initialize("b", "b1");
    expect(isCurrent()).toBe(false);
    await writer.push("b", snapshot);
    reject(new Error("old request failed"));
    await expect(old).resolves.toEqual({ status: "cancelled" });
    await expect(writer.push("b", snapshot)).resolves.toEqual({ status: "unchanged" });
  });
  it("stops before the next write when the local owner changes during a request", async () => {
    const f = authFixture();
    let current = true;
    f.request.mockImplementationOnce(async () => {
      current = false;
      return new Response(null, { status: 204, headers: { "content-range": "*/1" } });
    });
    await expect(writeProgress(f.db, "synthetic-a", { ...snapshot, badges: ["synthetic"] }, "previous", () => current)).rejects.toBeInstanceOf(SyncSessionChangedError);
    expect(f.request).toHaveBeenCalledTimes(1);
  });
  it("binds all initial reads, including the implicit-owner RPC, to the verified token", async () => {
    const f = authFixture();
    f.getUser.mockImplementationOnce(async () => {
      f.getSession.mockResolvedValue({ data: { session: { access_token: "synthetic-token-b" } }, error: null });
      return { data: { user: { id: "synthetic-a" } }, error: null };
    });
    const authorizations: Array<string | null> = [];
    f.request.mockImplementation(async (_input, ...args: unknown[]) => {
      authorizations.push(new Headers((args[0] as RequestInit)?.headers).get("Authorization"));
      return new Response("[]", { status: 200 });
    });
    await readProgress(f.db, "synthetic-a");
    expect(authorizations).toEqual(Array(3).fill("Bearer synthetic-token-a"));
  });
  it("does not read or write after cancellation before auth starts", async () => {
    const f = authFixture();
    await expect(readProgress(f.db, "synthetic-a", () => false)).rejects.toBeInstanceOf(SyncSessionChangedError);
    await expect(writeProgress(f.db, "synthetic-a", snapshot, "previous", () => false)).rejects.toBeInstanceOf(SyncSessionChangedError);
    expect(f.getSession).not.toHaveBeenCalled();
    expect(f.request).not.toHaveBeenCalled();
  });
});
