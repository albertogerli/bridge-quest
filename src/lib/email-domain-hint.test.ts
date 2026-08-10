import { describe, it, expect } from "vitest";
import {
  isOneEditApart,
  suggestEmailDomain,
  suggestEmailCorrection,
} from "./email-domain-hint";

/**
 * I domini di posta realmente presenti fra gli iscritti al 2026-08-10 (1.087
 * account, 69 domini distinti), divisi in legittimi e refusi accertati.
 *
 * È il banco di prova che conta: un suggerimento sbagliato mostrato a chi ha
 * scritto bene il proprio indirizzo è più dannoso di un refuso non
 * intercettato, perché lo vedrebbero in tanti e insinuerebbe il dubbio che il
 * sito non funzioni. La lista contiene apposta i casi peggiori — `tim.it` e
 * `tin.it`, due provider reali a un carattere di distanza.
 */
const DOMINI_LEGITTIMI = [
  "adiacent.com", "albertogerli.it", "alice.it", "alviseferri.it",
  "bridgebase.it", "cisl.it", "cslua.com", "discentis.it", "duck.com",
  "ecologiainformatika.it", "edmforli.it", "ele-project.it", "engim.it",
  "enzostrazzera.it", "famigliacapitani.it", "fastwebnet.it", "federbridge.it",
  "federicaquaglia.com", "galileicostascarambone.edu.it", "gigengineering.it",
  "gmail.com", "gmx.at", "hotmail.com", "hotmail.fr", "hotmail.it",
  "icgpitocco.net", "icloud.com", "inwind.it", "iol.it", "italytwo.com",
  "libero.it", "live.it", "me.com", "mele45.it", "menzietti.it",
  "mgfproject.com", "michelecaradonna.it", "msn.com", "outlook.com",
  "outlook.it", "pebservice.com", "proton.me", "sbbgroup.it",
  "select-trade.com", "sestante.it", "studenti.liceovittorioveneto.edu.it",
  "studenti.unisob.na.it", "studio-ellebi.com", "studioborre.com",
  "studiolegaezancan.it", "studiolegalearavini.it", "tim.it", "tin.it",
  "tiscali.it", "tutamail.com", "vertebra.eu", "virgilio.it", "yahoo.com",
  "yahoo.it",
];

/** Refusi reali, con la correzione che ci si aspetta venga proposta. */
const REFUSI_REALI: Array<[string, string]> = [
  ["yaoo.it", "yahoo.it"],
  ["uahoo.it", "yahoo.it"],
  ["gmal.com", "gmail.com"],
  ["gmaol.com", "gmail.com"],
  ["gmail", "gmail.com"],
  ["aliuce.it", "alice.it"],
  ["l8bero.it", "libero.it"],
  ["outlook.ot", "outlook.it"],
];

describe("isOneEditApart", () => {
  it("riconosce una sostituzione", () => {
    expect(isOneEditApart("uahoo.it", "yahoo.it")).toBe(true);
  });

  it("riconosce una cancellazione e un inserimento", () => {
    expect(isOneEditApart("yaoo.it", "yahoo.it")).toBe(true);
    expect(isOneEditApart("yahooo.it", "yahoo.it")).toBe(true);
  });

  it("riconosce lo scambio di due lettere vicine", () => {
    expect(isOneEditApart("gmial.com", "gmail.com")).toBe(true);
  });

  it("non considera refuso una stringa identica", () => {
    expect(isOneEditApart("gmail.com", "gmail.com")).toBe(false);
  });

  it("rifiuta due o più modifiche", () => {
    expect(isOneEditApart("gmial.con", "gmail.com")).toBe(false);
    expect(isOneEditApart("yhoo.cm", "yahoo.com")).toBe(false);
    expect(isOneEditApart("me.it", "me.com")).toBe(false);
  });

  it("rifiuta lo scambio di lettere non adiacenti", () => {
    // "abcd" -> "dbca" scambia la prima e l'ultima: sono due sostituzioni,
    // non un refuso da tastiera.
    expect(isOneEditApart("dbca", "abcd")).toBe(false);
  });

  it("rifiuta differenze di lunghezza maggiori di uno", () => {
    expect(isOneEditApart("gml.cm", "gmail.com")).toBe(false);
  });
});

describe("suggestEmailDomain — nessun falso allarme sui domini reali", () => {
  it.each(DOMINI_LEGITTIMI)("non segnala %s", (dominio) => {
    expect(suggestEmailDomain(`mario.rossi@${dominio}`)).toBeNull();
  });

  it("non segnala tim.it e tin.it, che distano un carattere fra loro", () => {
    // Il caso che vieta di alzare la soglia: sono due provider reali diversi.
    expect(suggestEmailDomain("mario@tim.it")).toBeNull();
    expect(suggestEmailDomain("mario@tin.it")).toBeNull();
  });

  it("non segnala un dominio insolito ma plausibile", () => {
    // La maggioranza dei domini rari fra gli iscritti sono studi, scuole e
    // domini personali: devono passare senza commenti.
    expect(suggestEmailDomain("avv.bianchi@studiolegalearavini.it")).toBeNull();
    expect(suggestEmailDomain("info@bridgequestazzurro.example")).toBeNull();
  });
});

describe("suggestEmailDomain — intercetta i refusi reali", () => {
  it.each(REFUSI_REALI)("da %s propone %s", (refuso, atteso) => {
    expect(suggestEmailDomain(`mario.rossi@${refuso}`)).toBe(atteso);
  });

  it("completa un indirizzo troncato senza dominio di primo livello", () => {
    expect(suggestEmailDomain("mario@gmail")).toBe("gmail.com");
    expect(suggestEmailDomain("mario@libero")).toBe("libero.it");
  });

  it("non inventa un completamento per un dominio senza punto sconosciuto", () => {
    expect(suggestEmailDomain("mario@intranet")).toBeNull();
  });
});

describe("suggestEmailDomain — input parziale o malformato", () => {
  it("tace finché l'indirizzo non ha una chiocciola", () => {
    // L'utente sta ancora scrivendo: segnalare qui sarebbe solo rumore.
    expect(suggestEmailDomain("")).toBeNull();
    expect(suggestEmailDomain("mario.rossi")).toBeNull();
  });

  it("tace su un indirizzo senza dominio", () => {
    expect(suggestEmailDomain("mario@")).toBeNull();
  });

  it("ignora maiuscole e spazi di troppo", () => {
    expect(suggestEmailDomain("Mario@YAOO.IT ")).toBe("yahoo.it");
  });
});

describe("suggestEmailCorrection", () => {
  it("ricostruisce l'indirizzo completo conservando la parte locale", () => {
    expect(suggestEmailCorrection("pierofranchi43@yaoo.it")).toBe(
      "pierofranchi43@yahoo.it"
    );
    expect(suggestEmailCorrection("pierofranchi43@uahoo.it")).toBe(
      "pierofranchi43@yahoo.it"
    );
  });

  it("conserva una parte locale che contiene una chiocciola", () => {
    // Raro ma legale fra virgolette: si spezza sull'ULTIMA chiocciola.
    expect(suggestEmailCorrection('"a@b"@gmal.com')).toBe('"a@b"@gmail.com');
  });

  it("restituisce null quando non c'è nulla da correggere", () => {
    expect(suggestEmailCorrection("mario@gmail.com")).toBeNull();
  });
});
