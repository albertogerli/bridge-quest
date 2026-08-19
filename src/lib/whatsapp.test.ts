import { describe, expect, it } from "vitest";
import {
  compitoAssegnatoWhatsApp,
  invitoClasse,
  linkWhatsApp,
  promemoriaScadenzaWhatsApp,
} from "./whatsapp";

describe("i messaggi WhatsApp", () => {
  it("il testo finisce codificato nell'indirizzo", () => {
    const l = linkWhatsApp("a capo\ne «virgolette» & simboli");
    expect(l.startsWith("https://wa.me/?text=")).toBe(true);
    // Un a capo non codificato spezzerebbe l'indirizzo a metà messaggio.
    expect(l).not.toContain("\n");
    expect(decodeURIComponent(l.slice("https://wa.me/?text=".length))).toContain("«virgolette»");
  });

  it("non manda a un numero: apre il selettore dei contatti", () => {
    // Mettere il numero vorrebbe dire conservare i numeri degli allievi.
    expect(linkWhatsApp("x")).toContain("wa.me/?text=");
    expect(linkWhatsApp("x")).not.toMatch(/wa\.me\/\d/);
  });

  it("l'invito porta il codice sia da leggere sia da toccare", () => {
    const m = invitoClasse("Corso base martedì", "A7B9XZ");
    expect(m).toContain("A7B9XZ");
    expect(m).toContain("Corso base martedì");
    expect(m).toContain("/classi");
  });

  it("il compito porta al compito, non alla home", () => {
    const m = compitoAssegnatoWhatsApp("Vincenti e affrancabili", "c1", "a1", 8);
    expect(m).toContain("/classi/c1/compito/a1");
    expect(m).toContain("8 mani");
  });

  it("con una mano sola non dice «1 mani»", () => {
    expect(compitoAssegnatoWhatsApp("T", "c", "a", 1)).toContain("(1 mano)");
    expect(compitoAssegnatoWhatsApp("T", "c", "a", 0)).not.toContain("(");
  });

  it("la scadenza si legge in italiano", () => {
    expect(promemoriaScadenzaWhatsApp("T", "c", "a", 0)).toContain("scade oggi");
    expect(promemoriaScadenzaWhatsApp("T", "c", "a", 1)).toContain("scade domani");
    expect(promemoriaScadenzaWhatsApp("T", "c", "a", 4)).toContain("fra 4 giorni");
  });
});
