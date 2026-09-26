import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le tabelle con privilegi di COLONNA: nessuna scrittura può chiedere indietro
 * la riga, e nessuna lettura può chiedere tutte le colonne.
 *
 * SONO TRE, non una: `profiles`, `smazzate` e — da settembre 2026 —
 * `esercizi_posizione`. Il guardiano nasceva per `profiles` e guardava solo
 * lì; una revisione a tappeto ha fatto notare che le altre due passavano
 * sotto il naso. Aggiungerne una quarta vuol dire aggiungerla all'elenco qui
 * sotto, e nient'altro.
 *
 * IL VINCOLO. `scripts/sql/pii-columns-2026-08.sql` ha tolto al ruolo
 * `authenticated` la lettura di `profiles` e gliel'ha restituita su NOVE
 * colonne — quelle che servono a classifica, amici e portale. Le altre
 * (marketing_consent, last_login, platform, total_minutes…) si leggono solo
 * dalla RPC `get_own_profile()`, perché i privilegi di colonna valgono per
 * RUOLO e non per RIGA: revocarli nasconde quei campi anche al proprietario.
 *
 * IL BUCO CHE QUESTO TEST CHIUDE. Il client Supabase traduce `.select()` dopo
 * una scrittura in `RETURNING *`, e Postgres controlla i privilegi quando
 * PIANIFICA l'istruzione, non quando la esegue: la UPDATE viene rifiutata per
 * intero e la riga non si aggiorna affatto. Non è un errore cosmetico sul
 * valore di ritorno — è il salvataggio che non avviene.
 *
 * Era già stato previsto: lo script dice «le UPDATE non richiedono SELECT
 * purché non usino RETURNING (il client Supabase non lo fa senza .select())».
 * Un punto di chiamata su nove lo faceva — `updateProfile` in `use-auth.ts` —
 * e in produzione ogni salvataggio del profilo falliva con «permission denied
 * for table profiles» (Sentry, 20/08/2026, scope `profilo:salva-profilo`).
 *
 * Un tipo non può esprimere questo vincolo, e nemmeno un test di unità: la
 * differenza vive fra il client e i privilegi del database. Resta il sorgente.
 *
 * ECCEZIONE. I file che usano il client service role sono esclusi: quel ruolo
 * la lettura completa ce l'ha, quindi lì il RETURNING è legittimo.
 */

const RADICE = join(__dirname, "..");
const SCRITTURE = /\.(update|upsert|insert|delete)\(/;

/**
 * Le tabelle a cui `authenticated` NON ha la lettura completa.
 *
 *  - `profiles`      — pii-columns-2026-08.sql
 *  - `smazzate`      — il commento dell'insegnante non va agli allievi
 *  - `esercizi_posizione` — esercizio-senza-soluzione-2026-09.sql: le mani
 *    altrui, le risposte attese e la soluzione
 */
const TABELLE = ["profiles", "smazzate", "esercizi_posizione"] as const;

/** `.select()`, `.select("*")`, `.select('*')` — cioè «dammi tutte le colonne». */
const TUTTE_LE_COLONNE = /\.select\(\s*("\*"|'\*'|)\s*[,)]/;

function fileSorgente(dir: string): string[] {
  const trovati: string[] = [];
  for (const voce of readdirSync(dir, { withFileTypes: true })) {
    const percorso = join(dir, voce.name);
    if (voce.isDirectory()) trovati.push(...fileSorgente(percorso));
    else if (/\.tsx?$/.test(voce.name)) trovati.push(percorso);
  }
  return trovati;
}

/** Le catene che partono da `.from("<tabella>")`, fino al `;` che le chiude. */
function catenePro(sorgente: string, tabella: string): { catena: string; riga: number }[] {
  const catene: { catena: string; riga: number }[] = [];
  const avvio = new RegExp(`\\.from\\("${tabella}"\\)`, "g");
  let m: RegExpExecArray | null;
  while ((m = avvio.exec(sorgente)) !== null) {
    const coda = sorgente.slice(m.index, m.index + 600).split(";")[0];
    catene.push({ catena: coda, riga: sorgente.slice(0, m.index).split("\n").length });
  }
  return catene;
}

describe("tabelle con privilegi di colonna", () => {
  const file = fileSorgente(RADICE).filter(
    (f) => !readFileSync(f, "utf8").includes("@/lib/supabase/admin"),
  );

  // `profiles` è più stretta delle altre due: NIENTE `.select()` dopo una
  // scrittura, nemmeno su una colonna concessa. È la regola che ci siamo
  // portati a casa dal 20/08/2026, e vale la pena tenerla assoluta perché il
  // punto di chiamata che ci era inciampato non sembrava affatto sospetto.
  it("profiles: nessun .select() dopo una scrittura, di nessun tipo", () => {
    const colpevoli: string[] = [];
    for (const f of file) {
      const sorgente = readFileSync(f, "utf8");
      if (!sorgente.includes('.from("profiles")')) continue;
      for (const { catena, riga } of catenePro(sorgente, "profiles")) {
        if (!SCRITTURE.test(catena)) continue;
        if (!catena.includes(".select(")) continue;
        colpevoli.push(`${f.slice(RADICE.length + 1)}:${riga}`);
      }
    }
    expect(
      colpevoli,
      "Con .select() la scrittura diventa RETURNING e authenticated non ha la lettura " +
        "di tutte le colonne: la UPDATE viene RIFIUTATA e la riga non si aggiorna. " +
        "Scrivi senza .select() e rileggi con la RPC get_own_profile().",
    ).toEqual([]);
  });

  it.each(TABELLE)("%s: nessuna scrittura chiede indietro tutte le colonne", (tabella) => {
    const colpevoli: string[] = [];
    for (const f of file) {
      const sorgente = readFileSync(f, "utf8");
      if (!sorgente.includes(`.from("${tabella}")`)) continue;
      for (const { catena, riga } of catenePro(sorgente, tabella)) {
        if (!SCRITTURE.test(catena)) continue;
        if (!TUTTE_LE_COLONNE.test(catena)) continue;
        colpevoli.push(`${f.slice(RADICE.length + 1)}:${riga}`);
      }
    }
    expect(
      colpevoli,
      `Un .select() senza colonne diventa RETURNING * e authenticated non ha la ` +
        `lettura completa di ${tabella}: l'istruzione viene RIFIUTATA per intero e la ` +
        `riga non cambia. Elenca le colonne concesse, o non chiederla indietro.`,
    ).toEqual([]);
  });

  // Il secondo modo di inciampare nello stesso privilegio: una LETTURA che
  // chiede tutto. `select("*")` e `select()` nudo diventano `select *`, e
  // Postgres rifiuta l'istruzione intera per una sola colonna mancante — non
  // restituisce le altre. In produzione si vede come una pagina vuota.
  it.each(TABELLE)("%s: nessuna lettura chiede tutte le colonne", (tabella) => {
    const colpevoli: string[] = [];
    for (const f of file) {
      const sorgente = readFileSync(f, "utf8");
      if (!sorgente.includes(`.from("${tabella}")`)) continue;
      for (const { catena, riga } of catenePro(sorgente, tabella)) {
        if (SCRITTURE.test(catena)) continue;
        if (!TUTTE_LE_COLONNE.test(catena)) continue;
        colpevoli.push(`${f.slice(RADICE.length + 1)}:${riga}`);
      }
    }
    expect(
      colpevoli,
      `authenticated non legge tutte le colonne di ${tabella}: elenca quelle che ` +
        `servono, o passa dalla RPC che le restituisce a chi ne ha diritto.`,
    ).toEqual([]);
  });

  it("chi legge il proprio profilo passa da get_own_profile()", () => {
    const auth = readFileSync(join(RADICE, "hooks", "use-auth.ts"), "utf8");
    expect(auth).toContain("get_own_profile");
  });
});
