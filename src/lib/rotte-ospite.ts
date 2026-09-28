/**
 * Dove può andare chi ha premuto «Prova senza account».
 *
 * IL BUCO. La modalità ospite esisteva solo nella home: il cancello del sito
 * (`layout-shell.tsx`) non la conosceva. Chi provava senza account faceva
 * l'avvio guidato, arrivava sulla bacheca, e OGNI riquadro — Gioca, Percorso,
 * la prima mano — lo rimandava al login. È l'errore che CLAUDE.md chiama «la
 * prima schermata chiede invece di dare», ed è stato trovato il 28/09/2026
 * nel controllo fatto da un browser senza account, non dalla console.
 *
 * UNA LISTA E NON «TUTTO». Qui stanno solo le pagine che funzionano senza un
 * utente: studiare e giocare contro il computer, con i progressi nel browser.
 * Restano fuori quelle che hanno bisogno di un account vero — sfidare un
 * amico, i tornei con la classifica, la licita con BEN (le sue rotte
 * rispondono 401 a chi non è collegato), il profilo. Lì il login è la
 * risposta giusta, perché è quello che chiedono.
 */

const PAGINE_OSPITE = [
  "/prima-mano",
  "/impara",
  "/lezioni",
  "/scopri",
  "/trova-circolo",
  "/guida",
  "/dispense",
  "/ripasso",
] as const;

/** I giochi contro il computer: il resto di `/gioca` resta per chi ha un account. */
const GIOCHI_OSPITE = [
  "minibridge",
  "mano-guidata",
  "smazzata",
  "mano-del-giorno",
  "sfida",
  "quiz-lampo",
  "memory",
  "conta-veloce",
  "cosa-apri",
  "dichiara",
  "impasse",
  "segnali",
  "trova-errore",
  "quale-contratto",
  "quiz-prese",
  "pratica",
  "pratica-licita",
  "analisi",
] as const;

/** `percorso` senza prefisso di lingua (vedi `usePercorso`). */
export function apertaAgliOspiti(percorso: string): boolean {
  const p = percorso.split("?")[0].replace(/\/+$/, "") || "/";
  if (PAGINE_OSPITE.some((r) => p === r || p.startsWith(`${r}/`))) return true;
  if (p === "/gioca") return true;
  const gioco = /^\/gioca\/([^/]+)$/.exec(p)?.[1];
  return !!gioco && (GIOCHI_OSPITE as readonly string[]).includes(gioco);
}
