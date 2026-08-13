import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Il segreto condiviso con la guardia davanti a BEN.
 *
 * BEN non ha autenticazione propria: ospitato su Railway sarebbe un servizio
 * TensorFlow pubblico e gratuito per chiunque lo trovi. Davanti gli sta
 * `deploy/ben-railway/guard.py`, che pretende questa intestazione.
 *
 * Le due proprietà che contano sono in fondo semplici, e sbagliarne una si
 * paga caro:
 *   - il nome dell'intestazione deve coincidere con quello della guardia,
 *     altrimenti la guardia risponde 404 a tutto e BEN sembra spento;
 *   - senza segreto NON si manda un'intestazione vuota: in locale BEN gira
 *     nudo su 127.0.0.1 e non deve pretenderla.
 *
 * `ben-guard.ts` importa il client Supabase lato server, che a sua volta tira
 * dentro `next/headers`: qui interessa solo `benEndpoint`, quindi il resto
 * viene sostituito.
 */

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

const origUrl = process.env.BEN_API_URL;
const origToken = process.env.BEN_API_TOKEN;

afterEach(() => {
  process.env.BEN_API_URL = origUrl;
  process.env.BEN_API_TOKEN = origToken;
  vi.resetModules();
});

async function endpoint() {
  const { benEndpoint } = await import("./ben-guard");
  return benEndpoint();
}

describe("benEndpoint", () => {
  it("manda il segreto nell'intestazione che la guardia si aspetta", async () => {
    process.env.BEN_API_URL = "https://ben.example.railway.app";
    process.env.BEN_API_TOKEN = "segretissimo-di-almeno-24-caratteri";
    const { url, headers } = await endpoint();
    expect(url).toBe("https://ben.example.railway.app");
    // Il nome deve restare in sincronia con CONSENTITI/INTESTAZIONE in
    // deploy/ben-railway/guard.py: se cambia qui e non lì, BEN «sparisce».
    expect(headers).toEqual({ "X-BEN-Token": "segretissimo-di-almeno-24-caratteri" });
  });

  it("senza segreto non manda alcuna intestazione", async () => {
    // In locale BEN gira nudo su 127.0.0.1: un header vuoto non serve, e
    // spedirlo lascerebbe credere che ci sia una protezione.
    delete process.env.BEN_API_TOKEN;
    delete process.env.BEN_API_URL;
    const { url, headers } = await endpoint();
    expect(headers).toEqual({});
    expect(url).toBe("http://localhost:8085");
  });

  it("in mancanza di indirizzo ripiega sul BEN locale", async () => {
    delete process.env.BEN_API_URL;
    process.env.BEN_API_TOKEN = "x".repeat(30);
    expect((await endpoint()).url).toBe("http://localhost:8085");
  });
});
