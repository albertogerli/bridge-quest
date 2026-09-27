import { describe, expect, it } from "vitest";
import { primoModuloIncompleto, ultimaLezioneToccata } from "./prossimo-modulo";
import type { Course } from "@/lib/catalog";

function corso(id: string, lezioni: [number, string[]][]): Course {
  return {
    id, title: id, description: "", icon: "♣", color: "",
    worlds: [{
      id: `${id}-w1`, title: "Mondo", description: "", icon: "", order: 1,
      lessons: lezioni.map(([n, moduli]) => ({
        id: n, title: `Lezione ${n}`, description: "", icon: "📘", order: n,
        modules: moduli.map((m) => ({ id: m, title: `Modulo ${m}`, type: "theory", order: 1 })),
      })),
    }],
    lessons: [],
  } as unknown as Course;
}

const catalogo = [corso("fiori", [[1, ["a", "b"]], [2, ["c"]]]), corso("quadri", [[3, ["d"]]])];

describe("dove riprendere", () => {
  it("senza niente fatto, si riparte dal primo modulo del primo corso", () => {
    const p = primoModuloIncompleto(catalogo, {});
    expect(p).toMatchObject({ lessonId: 1, moduleId: "a", lessonTitle: "Lezione 1" });
  });

  it("salta quelli completati e si ferma al primo buco", () => {
    expect(primoModuloIncompleto(catalogo, { "1-a": true })).toMatchObject({ moduleId: "b" });
    expect(primoModuloIncompleto(catalogo, { "1-a": true, "1-b": true }))
      .toMatchObject({ lessonId: 2, moduleId: "c" });
  });

  it("attraversa i corsi: finito il primo, si passa al secondo", () => {
    const p = primoModuloIncompleto(catalogo, { "1-a": true, "1-b": true, "2-c": true });
    expect(p).toMatchObject({ lessonId: 3, moduleId: "d" });
  });

  it("finito tutto, non c'è niente da riprendere", () => {
    const tutto = { "1-a": true, "1-b": true, "2-c": true, "3-d": true };
    expect(primoModuloIncompleto(catalogo, tutto)).toBeNull();
  });

  /**
   * L'ORDINE È QUELLO DEL CATALOGO, non quello in cui si è giocato: chi
   * salta la lezione 1 e fa la 2 viene rimandato alla 1. Il percorso ha un
   * ordine, ed è quello l'informazione — se un giorno servisse «l'ultimo
   * toccato» sarebbe un'altra funzione, non un parametro di questa.
   */
  it("chi salta avanti viene rimandato indietro al buco", () => {
    expect(primoModuloIncompleto(catalogo, { "2-c": true, "3-d": true }))
      .toMatchObject({ lessonId: 1, moduleId: "a" });
  });

  it("un catalogo vuoto non è un errore", () => {
    expect(primoModuloIncompleto([], {})).toBeNull();
  });
});

describe("l'ultima lezione toccata", () => {
  /**
   * Serve a proporre una mano PERTINENTE. Non è la stessa domanda di
   * `primoModuloIncompleto`: quella dice dove andare, questa dove si è
   * stati. Una mano sulla lezione non ancora aperta non è un ripasso, è un
   * anticipo — e ti fa sbagliare per una cosa che nessuno ti ha spiegato.
   */
  it("senza niente fatto non c'è nessuna lezione toccata", () => {
    expect(ultimaLezioneToccata(catalogo, {})).toBeNull();
  });

  it("un modulo solo basta a toccare la lezione", () => {
    expect(ultimaLezioneToccata(catalogo, { "1-a": true })).toMatchObject({ lessonId: 1 });
  });

  it("con la prima finita e la seconda iniziata, vale la seconda", () => {
    const p = ultimaLezioneToccata(catalogo, { "1-a": true, "1-b": true, "2-c": true });
    expect(p).toMatchObject({ lessonId: 2, lessonTitle: "Lezione 2" });
  });

  it("attraversa i corsi", () => {
    const tutto = { "1-a": true, "1-b": true, "2-c": true, "3-d": true };
    expect(ultimaLezioneToccata(catalogo, tutto)).toMatchObject({ lessonId: 3 });
  });

  // È l'ULTIMA nell'ordine del catalogo, non la più recente nel tempo: le
  // date non ce le abbiamo. Chi salta avanti viene seguito dove è arrivato,
  // che per proporre una mano è la risposta giusta.
  it("chi salta avanti viene seguito avanti", () => {
    expect(ultimaLezioneToccata(catalogo, { "3-d": true })).toMatchObject({ lessonId: 3 });
  });
});
