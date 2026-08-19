import { describe, expect, it } from "vitest";
import {
  componiAllievi,
  indovinaSeparatore,
  leggiCsv,
  nomeCompleto,
  proponiCampo,
  type Campo,
} from "./import-allievi";

describe("il separatore", () => {
  /**
   * Excel italiano esporta col PUNTO E VIRGOLA, perché la virgola è il
   * separatore decimale. Un insegnante non sa quale dei due ha in mano e non
   * deve saperlo.
   */
  it("riconosce il punto e virgola di Excel italiano", () => {
    expect(indovinaSeparatore("Nome;Cognome;Email\nAnna;Rossi;a@b.it")).toBe(";");
  });

  it("riconosce la virgola di Excel inglese", () => {
    expect(indovinaSeparatore("Name,Surname,Email\nAnna,Rossi,a@b.it")).toBe(",");
  });

  it("riconosce la tabulazione di un copia-incolla", () => {
    expect(indovinaSeparatore("Nome\tCognome\nAnna\tRossi")).toBe("\t");
  });

  /**
   * Si conta sulla PRIMA riga: le successive possono avere virgole dentro i
   * campi, e contarle falserebbe proprio i file più sporchi.
   */
  it("le virgole dentro i campi non lo confondono", () => {
    const csv = 'Nome;Cognome;Nota\nAnna;Rossi;"grande, davvero"\nLuca;Bianchi;"altra, nota, lunga"';
    expect(indovinaSeparatore(csv)).toBe(";");
  });
});

describe("la lettura del foglio", () => {
  it("separa intestazioni e righe", () => {
    const f = leggiCsv("Nome;Cognome\nAnna;Rossi\nLuca;Bianchi");
    expect(f.intestazioni).toEqual(["Nome", "Cognome"]);
    expect(f.righe).toHaveLength(2);
  });

  it("le virgolette tengono insieme un campo con il separatore dentro", () => {
    const f = leggiCsv('Nome;Nota\nAnna;"Rossi; detta Anna"');
    expect(f.righe[0]).toEqual(["Anna", "Rossi; detta Anna"]);
  });

  it("due virgolette dentro un campo valgono una virgoletta", () => {
    const f = leggiCsv('Nome;Nota\nAnna;"detta ""la prof"""');
    expect(f.righe[0][1]).toBe('detta "la prof"');
  });

  it("le righe vuote spariscono", () => {
    const f = leggiCsv("Nome;Cognome\nAnna;Rossi\n\n\n");
    expect(f.righe).toHaveLength(1);
  });
});

describe("il riconoscimento delle colonne", () => {
  it("riconosce le intestazioni italiane", () => {
    expect(proponiCampo("Nome")).toBe("nome");
    expect(proponiCampo("Cognome")).toBe("cognome");
    expect(proponiCampo("E-mail")).toBe("email");
    expect(proponiCampo("Cellulare")).toBe("telefono");
  });

  it("riconosce quelle inglesi", () => {
    expect(proponiCampo("First Name")).toBe("nome");
    expect(proponiCampo("Last Name")).toBe("cognome");
    expect(proponiCampo("Phone")).toBe("telefono");
  });

  /**
   * Una proposta sbagliata che l'insegnante conferma distrattamente è peggio
   * di nessuna proposta: nel dubbio non si indovina.
   */
  it("quando non è chiaro non tira a indovinare", () => {
    expect(proponiCampo("Colonna 3")).toBe("ignora");
    expect(proponiCampo("")).toBe("ignora");
  });

  it("«cognome» non viene scambiato per «nome»", () => {
    // «cognome» contiene «nome»: l'ordine dei controlli conta.
    expect(proponiCampo("cognome")).toBe("cognome");
  });
});

describe("la composizione dell'elenco", () => {
  const mappa: Campo[] = ["nome", "cognome", "email"];

  it("mette ogni colonna al suo posto", () => {
    const f = leggiCsv("Nome;Cognome;Email\nAnna;Rossi;a@b.it");
    expect(componiAllievi(f, mappa)[0]).toEqual({
      nome: "Anna",
      cognome: "Rossi",
      email: "a@b.it",
      telefono: "",
    });
  });

  /**
   * In fondo a un foglio esportato c'è quasi sempre una riga vuota: senza
   * questo controllo diventerebbe un allievo senza nome nell'elenco.
   */
  it("scarta le righe senza nome né cognome", () => {
    const f = leggiCsv("Nome;Cognome;Email\nAnna;Rossi;a@b.it\n;;x@y.it");
    expect(componiAllievi(f, mappa)).toHaveLength(1);
  });

  it("le colonne da ignorare non finiscono da nessuna parte", () => {
    const f = leggiCsv("Nome;Interno;Cognome\nAnna;42;Rossi");
    const a = componiAllievi(f, ["nome", "ignora", "cognome"]);
    expect(a[0]).toEqual({ nome: "Anna", cognome: "Rossi", email: "", telefono: "" });
  });

  it("il nome completo regge anche con un campo solo", () => {
    expect(nomeCompleto({ nome: "Anna", cognome: "", email: "", telefono: "" })).toBe("Anna");
    expect(nomeCompleto({ nome: "", cognome: "Rossi", email: "", telefono: "" })).toBe("Rossi");
  });
});
