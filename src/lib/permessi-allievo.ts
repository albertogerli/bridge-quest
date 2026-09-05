/**
 * Che cosa può vedere un allievo, e con quale severità.
 *
 * LA PROMESSA CHE QUESTA FUNZIONE DEVE MANTENERE. All'insegnante è stato detto
 * «il percorso lo gestisci tu al 100%». Se il controllo vivesse solo
 * nell'interfaccia, basterebbe un indirizzo passato nel gruppo WhatsApp della
 * classe — e i gruppi WhatsApp di classe esistono sempre — perché quella
 * promessa fosse falsa. Una promessa falsa su questo punto costa l'adozione,
 * che è la cosa per cui tutto il resto esiste.
 *
 * DUE ELENCHI, DUE MECCANISMI. Tenerli in uno solo è l'errore che rende il
 * sistema o troppo severo o bugiardo:
 *
 *   · `vietati`  — contenuti didattici. Il server rifiuta. L'indirizzo diretto
 *                  non funziona. Sono le cose che CONSUMANO il percorso: una
 *                  lezione letta prima che l'insegnante la spieghi non si può
 *                  più spiegare.
 *   · `nascosti` — funzioni ludiche. Non sono proposte, ma restano
 *                  raggiungibili. Vietarle creerebbe un paradosso: le vede già
 *                  chiunque si registri senza essere in una classe, quindi
 *                  iscriversi a un corso TOGLIEREBBE qualcosa.
 *
 * CHI NON HA INSEGNANTE NON HA CANCELLO. Un utente esterno non ha niente in
 * `vietati`. Non è una dimenticanza: la famiglia dei divieti esiste perché
 * qualcuno governi il ritmo del corso, e senza un insegnante non c'è ritmo da
 * governare. È anche l'unico modo di non togliere a millecento persone già
 * registrate cose che oggi vedono.
 *
 * PIÙ CLASSI: VINCE CHI APRE. Se un insegnante ha aperto i tornei e l'altro no,
 * si vedono. L'intersezione farebbe sparire una cosa già concessa nel momento
 * in cui ci si iscrive a un secondo corso, e sarebbe incomprensibile per chi la
 * subisce.
 */

/** Il cursore sulla classe. `personalizzato` non si sceglie: ci si finisce. */
export type AccessoLibero =
  | "solo-il-corso"
  | "con-pratica-libera"
  | "tutto-aperto"
  | "personalizzato";

/** I gruppi che il cursore muove, e che le avanzate muovono uno per uno. */
export type Gruppo = "pratica" | "minigiochi" | "sfide" | "sociale";

export interface ImpostazioniClasse {
  accessoLibero: AccessoLibero;
  /** Eccezioni per gruppo. Vuoto = vale il cursore. */
  permessi?: Partial<Record<Gruppo, boolean>>;
}

export interface Permessi {
  /** Il server rifiuta: l'indirizzo diretto non funziona. */
  vietati: string[];
  /** Non proposti dalla navigazione, ma raggiungibili. */
  nascosti: string[];
}

/**
 * I contenuti didattici: si aprono con l'avanzamento del corso, non col
 * cursore. Il cursore governa le funzioni, non il programma.
 */
const DIDATTICI = [
  "/lezioni",
  "/impara",
  "/dispense",
  "/ripasso",
  "/prima-mano",
  "/scuola",
] as const;

/** Le funzioni ludiche, per gruppo. */
const LUDICI: Record<Gruppo, string[]> = {
  pratica: [
    "/gioca/pratica", "/gioca/pratica-licita", "/gioca/dichiara",
    "/gioca/quale-contratto", "/gioca/quiz-prese", "/gioca/impasse",
    "/gioca/segnali", "/gioca/cosa-apri", "/gioca/trova-errore",
    "/gioca/smazzata", "/gioca/analisi",
  ],
  minigiochi: ["/gioca/memory", "/gioca/conta-veloce", "/gioca/quiz-lampo", "/gioca/minibridge"],
  sfide: [
    "/gioca/torneo", "/gioca/torneo-licita", "/gioca/sfida", "/gioca/sfida-amico",
    "/gioca/sfida-coppie", "/gioca/sfida-imp", "/gioca/sfida-link",
    "/gioca/sfida-settimanale", "/gioca/mano-del-giorno", "/gioca/licita",
    "/gioca/licita-amico", "/gioca/mano-guidata",
  ],
  sociale: [
    "/amici", "/classifica", "/forum", "/negozio", "/collezione",
    "/obiettivi", "/profilo/wrapped",
  ],
};

/**
 * Fuori dal rubinetto, e non negoziabile.
 *
 * `/trova-circolo` e `/trova-compagno` sono l'unica parte del portale che porta
 * la persona DENTRO il circolo — che è l'obiettivo dichiarato del progetto, e
 * la metrica di riferimento è il tempo dal primo contatto al primo torneo in
 * ASD. Nasconderle a un allievo contraddirebbe il fine per cui esiste tutto il
 * resto, quindi non sono nemmeno disattivabili dall'insegnante.
 */
export const SEMPRE_VISIBILI = [
  "/trova-circolo", "/trova-compagno",
  "/profilo", "/impostazioni", "/accessibilita",
  "/glossario", "/guida", "/classi", "/privacy", "/termini",
] as const;

/** Quali gruppi apre ciascuna posizione del cursore. */
const APERTI_DAL_CURSORE: Record<AccessoLibero, Gruppo[]> = {
  "solo-il-corso": [],
  "con-pratica-libera": ["pratica", "minigiochi"],
  "tutto-aperto": ["pratica", "minigiochi", "sfide", "sociale"],
  // Il cursore non dice niente: comandano le eccezioni, una per una.
  personalizzato: [],
};

/** Un gruppo è aperto per questa classe? L'eccezione batte il cursore. */
function gruppoAperto(classe: ImpostazioniClasse, gruppo: Gruppo): boolean {
  const eccezione = classe.permessi?.[gruppo];
  if (eccezione !== undefined) return eccezione;
  return APERTI_DAL_CURSORE[classe.accessoLibero].includes(gruppo);
}

/**
 * I permessi di chi è iscritto a queste classi (l'elenco vuoto = utente
 * esterno).
 *
 * `didatticiSbloccati` sono i contenuti che l'insegnante ha già aperto, per
 * prefisso: chi ha assegnato la lezione 4 passa `["/lezioni/4"]`. Quello che
 * non è sbloccato resta vietato — ma solo per chi ha un insegnante.
 */
export function permessiAllievo(
  classi: readonly ImpostazioniClasse[],
  didatticiSbloccati: readonly string[] = [],
): Permessi {
  // Nessuna classe, nessun insegnante, nessun cancello. Vale anche per le
  // millecento persone registrate che oggi vedono tutto.
  if (classi.length === 0) return { vietati: [], nascosti: [] };

  const vietati = DIDATTICI.filter(
    (rotta) => !didatticiSbloccati.some((aperto) => aperto.startsWith(rotta)),
  );

  // Vince chi apre: basta una classe che abbia il gruppo aperto.
  const nascosti = (Object.keys(LUDICI) as Gruppo[])
    .filter((gruppo) => !classi.some((c) => gruppoAperto(c, gruppo)))
    .flatMap((gruppo) => LUDICI[gruppo]);

  return { vietati, nascosti };
}

/** Tutte le rotte governate dal rubinetto, per i test e per la navigazione. */
export function rotteGovernate(): string[] {
  return [...DIDATTICI, ...Object.values(LUDICI).flat()];
}
