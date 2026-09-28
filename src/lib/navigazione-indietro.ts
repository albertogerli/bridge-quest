/**
 * Dove porta il «torna indietro», pagina per pagina.
 *
 * PERCHÉ UNA REGOLA E NON VENTI PULSANTI. Le pagine sotto le classi sono
 * ventidue e ognuna avrebbe potuto mettere il suo collegamento dove capitava.
 * È già successo in piccolo, con esiti che si vedono: nella pagina della classe
 * il ritorno compariva SOLO quando la classe non si trovava, e nel tavolo di
 * studio la parola «Indietro» significa annulla l'ultima carta. Una regola sola,
 * applicata da chi disegna la cornice, rende impossibile sia dimenticarlo sia
 * metterlo in un posto diverso.
 *
 * COME SI DISTINGUE UNA CLASSE DA UNO STRUMENTO. Sotto `/istruttori` convivono
 * due cose che si somigliano nell'indirizzo: `/istruttori/<uuid>` è una classe,
 * `/istruttori/studio` è uno strumento. Si riconoscono dalla forma — le classi
 * hanno un identificativo, gli strumenti un nome — e l'elenco dei nomi sta qui
 * sotto: se domani ne nasce uno nuovo e ci si dimentica di aggiungerlo, finisce
 * fra le classi e il ritorno porta al posto sbagliato. Il test lo prende.
 */

/** Gli strumenti che vivono sotto `/istruttori/<nome>` e non sono classi. */
const STRUMENTI = [
  "archivio",
  "combinazione",
  "dispensa",
  "genera-mani",
  "lavagna",
  "libreria",
  "proiezione",
  "studio",
  "tavolo",
] as const;

/**
 * Le pagine che si guardano e basta: la proiezione va sul videoproiettore e la
 * lavagna sta davanti alla classe. Un pulsante lì è solo qualcosa che qualcuno
 * può premere per sbaglio mentre spiega.
 */
const SENZA_RITORNO = ["/istruttori/proiezione"];

/**
 * Le pagine che il ritorno lo decidono da sé, perché dipende da DA DOVE si è
 * arrivati e la cornice vede solo il percorso, non i parametri. Il tavolo
 * condiviso aperto da un tavolo dell'aula deve riportare all'aula: con la
 * regola comune diceva «Torna al portale» (controllo esterno, 28/09/2026).
 */
const RITORNO_NELLA_PAGINA = ["/istruttori/tavolo"];

export interface Ritorno {
  href: string;
  /** Detto per esteso: «Torna alla classe», mai un «Indietro» che non dice dove. */
  etichetta: string;
}

export function destinazioneIndietro(percorso: string): Ritorno | null {
  const pulito = percorso.split("?")[0].replace(/\/+$/, "");
  if (SENZA_RITORNO.some((p) => pulito.startsWith(p))) return null;
  if (RITORNO_NELLA_PAGINA.includes(pulito)) return null;

  const parti = pulito.split("/").filter(Boolean);
  if (parti.length === 0) return null;

  // ── Area allievo ──────────────────────────────────────────────────────────
  if (parti[0] === "classi") {
    // `/classi` è l'elenco: da lì si esce con la navigazione principale.
    if (parti.length === 1) return null;
    // `/classi/<id>` → l'elenco. Più sotto → la classe.
    if (parti.length === 2) return { href: "/classi", etichetta: "Torna alle mie classi" };
    return { href: `/classi/${parti[1]}`, etichetta: "Torna alla classe" };
  }

  // ── Area insegnante ───────────────────────────────────────────────────────
  if (parti[0] === "istruttori") {
    if (parti.length === 1) return null; // il portale è la radice dell'area
    const secondo = parti[1];
    if ((STRUMENTI as readonly string[]).includes(secondo)) {
      return { href: "/istruttori", etichetta: "Torna al portale" };
    }
    // È una classe: `/istruttori/<id>` torna al portale, più sotto alla classe.
    if (parti.length === 2) return { href: "/istruttori", etichetta: "Torna alle classi" };
    return { href: `/istruttori/${secondo}`, etichetta: "Torna alla classe" };
  }

  return null;
}
