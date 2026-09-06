import { describe, expect, it } from "vitest";
import {
  compitoAssegnatoWhatsApp,
  invitoClasse,
  linkWhatsApp,
  materialiLezioneWhatsApp,
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

describe("il link della videoconferenza nel messaggio", () => {
  /**
   * Va nello stesso messaggio del compito e non in uno separato: chi lo incolla
   * a mano in chat prima di ogni lezione lo fa perché non c'è, e due messaggi
   * nel gruppo diventano due cose da cercare.
   */
  it("c'è quando la classe ne ha una", () => {
    const m = compitoAssegnatoWhatsApp("T", "c1", "a1", 4, "https://meet.example/abc");
    expect(m).toContain("https://meet.example/abc");
    expect(m).toContain("/classi/c1/compito/a1");
  });

  it("non lascia una riga vuota quando non c'è", () => {
    const m = compitoAssegnatoWhatsApp("T", "c1", "a1", 4);
    expect(m).not.toContain("Ci vediamo qui");
    expect(m).not.toMatch(/\n\n\n/);
  });
});

describe("il messaggio dei materiali", () => {
  const base = { titoloLezione: "Corso Fiori — Le aperture", classId: "c1" };

  it("la dispensa porta la classe nell'indirizzo", () => {
    // Senza, chi tocca il link atterra su «le dispense del sito» invece che
    // sui materiali del suo corso — e il canale che l'insegnante usa di più
    // scavalcherebbe tutto il lavoro sul percorso guidato.
    expect(materialiLezioneWhatsApp(base)).toContain("/dispense?classe=c1");
  });

  it("l'ordine è quello in cui si usano: si guarda, si legge, si esercita", () => {
    const testo = materialiLezioneWhatsApp({
      ...base, linkVideo: "https://video", assignmentId: "a1", corsoId: "fiori",
    });
    expect(testo.indexOf("videolezione")).toBeLessThan(testo.indexOf("dispensa"));
    expect(testo.indexOf("dispensa")).toBeLessThan(testo.indexOf("esercizi"));
  });

  it("senza video e senza compito non lascia righe vuote né link rotti", () => {
    const testo = materialiLezioneWhatsApp(base);
    expect(testo).not.toContain("videolezione");
    expect(testo).not.toContain("esercizi");
    expect(testo).not.toContain("undefined");
    expect(testo).not.toContain("null");
  });

  it("I LINK SONO ASSOLUTI: reggono se l'insegnante riscrive il testo intorno", () => {
    // Molti aggiungeranno una riga di loro pugno, ed è giusto. Niente qui
    // rilegge il messaggio, quindi non c'è niente che si possa rompere — ma i
    // link devono valere anche da soli, staccati da tutto il resto.
    const testo = materialiLezioneWhatsApp({ ...base, assignmentId: "a1" });
    for (const riga of testo.split("\n").filter((r) => r.includes("http"))) {
      const url = riga.slice(riga.indexOf("http"));
      expect(() => new URL(url)).not.toThrow();
    }
  });
});

describe("il messaggio del compito non promette il falso", () => {
  it("con «lo decide l'insegnante» non dice che si aprono dopo il gioco", () => {
    // La frase era fissa e da quando esiste il quarto valore poteva mentire:
    // un allievo che gioca, non vede le soluzioni e ha in mano un messaggio che
    // gliele prometteva, pensa che il portale sia rotto.
    const testo = compitoAssegnatoWhatsApp("Lezione 4", "c1", "a1", 8, null, "quando-l-insegnante-decide");
    expect(testo).not.toContain("dopo che avete giocato");
    expect(testo).toContain("le apro io");
  });

  it("gli altri tre valori dicono ciascuno la sua", () => {
    expect(compitoAssegnatoWhatsApp("x", "c", "a", 1, null, "subito")).toContain("già disponibili");
    expect(compitoAssegnatoWhatsApp("x", "c", "a", 1, null, "dopo-la-scadenza")).toContain("dopo la scadenza");
    expect(compitoAssegnatoWhatsApp("x", "c", "a", 1, null, "dopo-il-gioco")).toContain("dopo che avete giocato");
  });
});
