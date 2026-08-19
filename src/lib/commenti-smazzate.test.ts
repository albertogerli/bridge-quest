import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Il finto database. `chiamate` registra gli elenchi di id davvero richiesti:
 * è lì che si vede se la cache funziona e, soprattutto, se sta memorizzando
 * cose che non deve.
 */
const chiamate: string[][] = [];
let risposta: { id: string; commentary: string | null; commentary_en: string | null }[] = [];
let errore: { message: string } | null = null;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: (_nome: string, args: { p_ids: string[] }) => {
      chiamate.push(args.p_ids);
      return Promise.resolve({ data: risposta, error: errore });
    },
  }),
}));

vi.mock("@/lib/report-error", () => ({ reportError: () => {} }));

const { caricaCommenti, svuotaCacheCommenti, commentoGiaPresente } = await import("./commenti-smazzate");

describe("i commenti delle smazzate", () => {
  beforeEach(() => {
    chiamate.length = 0;
    risposta = [];
    errore = null;
    svuotaCacheCommenti();
  });

  it("chiede solo gli id che non ha già", async () => {
    risposta = [{ id: "1-1", commentary: "Taglia in mano", commentary_en: null }];
    await caricaCommenti(["1-1"]);
    await caricaCommenti(["1-1"]);
    expect(chiamate).toEqual([["1-1"]]);
  });

  it("non richiede due volte lo stesso id nella stessa chiamata", async () => {
    risposta = [{ id: "1-1", commentary: "Taglia in mano", commentary_en: null }];
    await caricaCommenti(["1-1", "1-1", "1-1"]);
    expect(chiamate).toEqual([["1-1"]]);
  });

  it("non parte nessuna chiamata se è tutto in cache", async () => {
    risposta = [{ id: "1-1", commentary: "Taglia in mano", commentary_en: null }];
    await caricaCommenti(["1-1"]);
    chiamate.length = 0;
    const m = await caricaCommenti(["1-1"]);
    expect(chiamate).toEqual([]);
    expect(m.get("1-1")).toBe("Taglia in mano");
  });

  /**
   * IL CASO CHE CONTA. Un commento negato oggi va concesso appena l'allievo
   * gioca la mano. Se il rifiuto finisse in cache resterebbe nascosto per tutta
   * la sessione, e la soluzione non comparirebbe mai — che è esattamente il
   * difetto che questa funzione esiste per non avere.
   */
  it("non ricorda i rifiuti: dopo il gioco il commento arriva", async () => {
    risposta = [];
    const primo = await caricaCommenti(["1-1"]);
    expect(primo.has("1-1")).toBe(false);

    risposta = [{ id: "1-1", commentary: "Taglia in mano", commentary_en: null }];
    const secondo = await caricaCommenti(["1-1"]);
    expect(secondo.get("1-1")).toBe("Taglia in mano");
    // Due chiamate, non una: il rifiuto non è stato messo in cache.
    expect(chiamate).toEqual([["1-1"], ["1-1"]]);
  });

  it("in inglese ripiega sull'italiano quando la traduzione manca", async () => {
    risposta = [{ id: "1-1", commentary: "Taglia in mano", commentary_en: null }];
    const m = await caricaCommenti(["1-1"], "en");
    expect(m.get("1-1")).toBe("Taglia in mano");
  });

  it("in inglese usa la traduzione quando c'è", async () => {
    risposta = [{ id: "1-1", commentary: "Taglia in mano", commentary_en: "Ruff in hand" }];
    expect((await caricaCommenti(["1-1"], "en")).get("1-1")).toBe("Ruff in hand");
    expect((await caricaCommenti(["1-1"], "it")).get("1-1")).toBe("Taglia in mano");
  });

  it("un errore non fa cadere la pagina: semplicemente non c'è commento", async () => {
    errore = { message: "boom" };
    const m = await caricaCommenti(["1-1"]);
    expect(m.size).toBe(0);
  });

  it("le mani importate portano il commento con sé", () => {
    const conCommento = { id: "x", commentary: "Da PBN" } as never;
    const senza = { id: "y", commentary: "   " } as never;
    expect(commentoGiaPresente(conCommento)).toBe("Da PBN");
    expect(commentoGiaPresente(senza)).toBeUndefined();
    expect(commentoGiaPresente(undefined)).toBeUndefined();
  });
});
