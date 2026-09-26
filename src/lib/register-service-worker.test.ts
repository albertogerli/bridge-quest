// @vitest-environment jsdom
import { createElement, StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { registerServiceWorker, ServiceWorkerRegistrationError } from "./register-service-worker";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { describeError } from "./describe-error";

const report = vi.hoisted(() => vi.fn());
vi.mock("@/lib/report-error", () => ({ reportError: report }));
beforeEach(() => report.mockReset());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("registers successfully once, retaining the client as the method receiver", async () => {
  const client = { register: vi.fn(function (this: unknown) {
    expect(this).toBe(client);
    return Promise.resolve({ scope: "https://synthetic.invalid/" });
  }) };
  const first = registerServiceWorker(client);
  expect(registerServiceWorker(client)).toBe(first);
  await first;
  await registerServiceWorker(client);
  expect(client.register).toHaveBeenCalledTimes(1);
  expect(report).not.toHaveBeenCalled();
});

it.each([
  [new DOMException("Failed to register a ServiceWorker for scope ('https://synthetic.invalid/?private=secret') with script ('https://synthetic.invalid/sw.js'): An SSL certificate error occurred when fetching the script.", "SecurityError"), "tls_certificate"],
  [new DOMException("Content Security Policy blocked private-url", "SecurityError"), "security_policy"],
  [new TypeError("Bad MIME type from private-url"), "registration_type_error"],
  [new DOMException("private cancellation", "AbortError"), "registration_aborted"],
  [new Error("private implementation detail"), "registration_failed"],
  ["private non-Error rejection", "registration_failed"],
])("handles a rejected registration and keeps it observable: %s", async (error, code) => {
  const client = { register: vi.fn().mockRejectedValue(error) };
  await expect(registerServiceWorker(client)).resolves.toBeUndefined();
  await registerServiceWorker(client);
  expect(client.register).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledExactlyOnceWith("pwa:register", expect.objectContaining({ name: "ServiceWorkerRegistrationError", code }));
  const captured = report.mock.calls[0][1];
  expect(captured).toBeInstanceOf(ServiceWorkerRegistrationError);
  expect(JSON.stringify(describeError(captured))).not.toMatch(/private|secret|https:/);
  expect(captured.cause).toBeUndefined();
});

it("handles a synchronous registration throw too", async () => {
  await expect(registerServiceWorker({ register() { throw new TypeError("private"); } })).resolves.toBeUndefined();
  expect(report).toHaveBeenCalledTimes(1);
});

it("mounts once in StrictMode without clearing local progress", async () => {
  const register = vi.fn().mockRejectedValue(new DOMException("denied", "SecurityError"));
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", { serviceWorker: {} });
  vi.stubGlobal("serwist", { register });
  vi.stubGlobal("localStorage", { clear: vi.fn(), removeItem: vi.fn() });
  render(createElement(StrictMode, null, createElement(ServiceWorkerRegistration)));
  await act(async () => {});
  expect(register).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledTimes(1);
  expect(localStorage.clear).not.toHaveBeenCalled();
  expect(localStorage.removeItem).not.toHaveBeenCalled();
});

it.each(["insecure", "unsupported", "development"])("skips registration in an %s context", async (context) => {
  const register = vi.fn();
  vi.stubGlobal("isSecureContext", context !== "insecure");
  vi.stubGlobal("navigator", context === "unsupported" ? {} : { serviceWorker: {} });
  vi.stubGlobal("serwist", context === "development" ? undefined : { register });
  render(createElement(ServiceWorkerRegistration));
  await act(async () => {});
  expect(register).not.toHaveBeenCalled();
  expect(report).not.toHaveBeenCalled();
});

it("disables unhandled auto-registration and mounts the managed registration", () => {
  expect(readFileSync("next.config.ts", "utf8")).toMatch(/register:\s*false/);
  expect(readFileSync("src/app/layout.tsx", "utf8")).toContain("<ServiceWorkerRegistration />");
});

/**
 * Un crawler che fallisce la registrazione non dice niente su di noi: non ha
 * nulla da installare. Il primo caso reale è stato HeadlessChrome su Linux.
 *
 * Il filtro guarda CHI chiede, non che errore è — ed è la differenza che conta:
 * filtrare per codice avrebbe nascosto anche il `registration_type_error` di un
 * utente vero, che invece può voler dire `sw.js` servito con il tipo sbagliato.
 */
function conWebdriver(valore: boolean | undefined) {
  const originale = Object.getOwnPropertyDescriptor(navigator, "webdriver");
  Object.defineProperty(navigator, "webdriver", { value: valore, configurable: true });
  return () => {
    if (originale) Object.defineProperty(navigator, "webdriver", originale);
    else delete (navigator as unknown as Record<string, unknown>).webdriver;
  };
}

it("un browser automatico fallisce e non sveglia nessuno", async () => {
  const ripristina = conWebdriver(true);
  await registerServiceWorker({ register: () => Promise.reject(new TypeError("boom")) });
  expect(report).not.toHaveBeenCalled();
  ripristina();
});

it("UN UTENTE VERO CON LO STESSO ERRORE VIENE SEGNALATO", async () => {
  // È la metà che conta: `registration_type_error` da un browser vero può
  // essere `sw.js` servito male, e quello va visto.
  const ripristina = conWebdriver(undefined);
  await registerServiceWorker({ register: () => Promise.reject(new TypeError("boom")) });
  expect(report).toHaveBeenCalledExactlyOnceWith(
    "pwa:register",
    expect.objectContaining({ code: "registration_type_error" }),
  );
  ripristina();
});
