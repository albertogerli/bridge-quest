// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

const clients: SupabaseClient[] = [];

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth-regression.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-anon-key");
  vi.stubGlobal("BroadcastChannel", undefined);
  vi.stubGlobal("fetch", vi.fn(() => {
    throw new Error("Unexpected network request in isolated auth test");
  }));
});

afterEach(async () => {
  for (const client of clients.splice(0)) {
    await client.auth.stopAutoRefresh();
    // Optional only so the regression can also run against the broken SDK.
    (client.auth as { dispose?: () => void }).dispose?.();
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("browser auth — regressione AbortError del lock Supabase", () => {
  it("inizializza sessione e subscriber anche se il vecchio Web Lock scade", async () => {
    // Another tab has left the legacy lock unavailable. This is precisely
    // the DOMException from the lock timer in production, not a fetch abort.
    const lockRequest = vi.fn(() => Promise.reject(
      new DOMException("signal is aborted without reason", "AbortError"),
    ));
    vi.stubGlobal("navigator", { userAgent: navigator.userAgent, locks: { request: lockRequest } });
    const { createClient } = await import("./client");
    const client = createClient();
    clients.push(client);

    const sessions = await Promise.all([client.auth.getSession(), client.auth.getSession()]);
    expect(sessions).toEqual([
      { data: { session: null }, error: null },
      { data: { session: null }, error: null },
    ]);
    const subscriber = vi.fn();
    const { data: { subscription } } = client.auth.onAuthStateChange(subscriber);
    await vi.waitFor(() => expect(subscriber).toHaveBeenCalledWith("INITIAL_SESSION", null));
    subscription.unsubscribe();
    expect(createClient()).toBe(client);
    expect(lockRequest).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});

// Real SSR cookie storage and real auth SDK; only HTTP and the other tab's
// writes are simulated. No production credentials or users are involved.
const STORAGE_KEY = "sb-auth-regression-auth-token";
const fixtureSession = (label: string, seconds: number): Session => ({
  access_token: `synthetic-access-${label}`,
  refresh_token: `synthetic-refresh-${label}`,
  token_type: "bearer",
  expires_in: seconds,
  expires_at: Math.floor(Date.now() / 1000) + seconds,
  user: {
    id: "synthetic-user",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
  },
});

async function cookieClient() {
  const jar = new Map<string, string>();
  const writeSession = (session: Session | null) => {
    jar.clear();
    if (session) jar.set(STORAGE_KEY, `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`);
  };
  writeSession(fixtureSession("initial", 3600));
  const { createBrowserClient } = await import("@supabase/ssr");
  const client = createBrowserClient("https://auth-regression.supabase.co", "synthetic-anon-key", {
    isSingleton: false,
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) {
          if (value) jar.set(name, value);
          else jar.delete(name);
        }
      },
    },
  });
  clients.push(client);
  expect((await client.auth.getSession()).data.session?.access_token).toBe("synthetic-access-initial");
  await client.auth.stopAutoRefresh();
  return { client, writeSession };
}

describe("browser auth — rinnovi concorrenti nei cookie SSR", () => {
  it("usa la sessione vincente dell'altra scheda anche per la successiva richiesta al DB", async () => {
    let finishRefresh!: (response: Response) => void;
    const refreshed = new Promise<Response>((resolve) => { finishRefresh = resolve; });
    const http = vi.fn<typeof fetch>().mockImplementation((input, init) => {
      const url = String(input);
      if (url.includes("/token?grant_type=refresh_token")) return refreshed;
      if (url.includes("/rest/v1/profiles")) {
        expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer synthetic-access-winner");
        return Promise.resolve(Response.json([]));
      }
      throw new Error("Unexpected request in auth regression test");
    });
    vi.stubGlobal("fetch", http);
    const { client, writeSession } = await cookieClient();
    writeSession(fixtureSession("expired", -60));
    const pending = client.auth.getSession();
    await vi.waitFor(() => expect(http).toHaveBeenCalledTimes(1));

    // The other tab rotates first; our later response must not overwrite it
    // or momentarily make the DB request anonymous under RLS.
    writeSession(fixtureSession("winner", 3600));
    finishRefresh(Response.json(fixtureSession("loser", 3600)));
    const result = await pending;
    expect(result.error).toBeNull();
    expect(result.data.session?.access_token).toBe("synthetic-access-winner");
    expect((await client.from("profiles").select("role")).error).toBeNull();
    expect(http).toHaveBeenCalledTimes(2);
  });

  it("non ripristina la sessione se un'altra scheda esce durante il rinnovo", async () => {
    let finishRefresh!: (response: Response) => void;
    const refreshed = new Promise<Response>((resolve) => { finishRefresh = resolve; });
    const http = vi.fn<typeof fetch>().mockReturnValue(refreshed);
    vi.stubGlobal("fetch", http);
    const { client, writeSession } = await cookieClient();
    writeSession(fixtureSession("expired", -60));
    const pending = client.auth.getSession();
    await vi.waitFor(() => expect(http).toHaveBeenCalledTimes(1));
    writeSession(null);
    finishRefresh(Response.json(fixtureSession("late", 3600)));
    expect((await pending).data.session).toBeNull();
    expect((await client.auth.getSession()).data.session).toBeNull();
    expect(http).toHaveBeenCalledTimes(1);
  });
});
