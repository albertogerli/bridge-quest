/**
 * Quanto ci mette BEN a dichiarare, e chi risponde.
 *
 *   BEN_API_URL=… BEN_API_TOKEN=… node scripts/misura-ben-licita.mjs
 *   … node scripts/misura-ben-licita.mjs --soglia 5      (secondi, default 5)
 *
 * Le due variabili si prendono dalla produzione con:
 *   npx vercel env pull /tmp/env.prod --environment=production --yes
 * e il file va cancellato subito dopo: contiene tutti i segreti.
 *
 * PERCHÉ ESISTE. BEN ha due velocità e lo dichiara nel campo `who` della
 * risposta: `NN` quando la rete neurale risponde da sola (~0,35 s) e
 * `Simulation` quando non è sicura e simula a doppio morto. Il 25/08/2026 le
 * simulazioni stavano fra 6,4 e 10,6 secondi e la guardia le uccideva a 12:
 * l'utente vedeva «il compagno non ha risposto», e il calcolo veniva buttato
 * via un attimo prima di essere pronto.
 *
 * `sample_hands_auction` è sceso da 200 a 100 per rientrare entro cinque
 * secondi. Quel numero è una PREVISIONE, ricavata dal costo osservato: questo
 * programma serve a verificarla sul servizio vero, e a riverificarla quando
 * BEN o la macchina cambiano. Esce con 1 se una simulazione sfora la soglia.
 *
 * Non misura la qualità delle dichiarazioni: quella si guarda con
 * `robot-quality-harness.ts`. Qui si guarda solo il tempo.
 */

const url = (process.env.BEN_API_URL || "").replace(/\/$/, "");
const token = process.env.BEN_API_TOKEN || "";
const i = process.argv.indexOf("--soglia");
const SOGLIA = i > -1 ? Number(process.argv[i + 1]) : 5;
/**
 * `--determinismo` chiede due volte ogni asta e segnala se la risposta cambia.
 *
 * Serve a tenere sotto controllo una proprietà su cui poggia una decisione di
 * architettura. Il 29/08/2026 è stato misurato che BEN risponde SEMPRE allo
 * stesso modo alla stessa domanda, simulazioni comprese: usa un seme fisso.
 * Per questo la cache delle dichiarazioni può restare in memoria, per istanza,
 * senza compromettere la parità di trattamento fra i concorrenti di un torneo.
 *
 * Se questo controllo iniziasse a fallire, quella decisione andrebbe rifatta:
 * servirebbe una risposta canonica condivisa, scritta nel database.
 */
const DETERMINISMO = process.argv.includes("--determinismo");

if (!url) {
  console.error("Manca BEN_API_URL. Vedi l'intestazione di questo file.");
  process.exit(2);
}

/**
 * Aste scelte per coprire ENTRAMBE le velocità: se si misurassero solo le
 * aperture si concluderebbe che BEN risponde sempre in mezzo secondo, che è
 * vero e inutile. Le tre righe con `1N`, `1H--1N--` e `1C--1D--` sono quelle
 * che il 25/08/2026 hanno prodotto una `Simulation`.
 *
 * Il posto DEVE essere quello di turno: BEN rifiuta con 400 se il numero di
 * dichiarazioni non corrisponde al posto («auction and seat do not match»).
 */
const MANI = {
  N: "AKQ82.KJ4.A3.965",
  E: "J54.A9873.Q7.KJ4",
  S: "T93.QT.KJT952.Q8",
  W: "76.652.864.AT732",
};
const PROVE = [
  ["N", ""],
  ["E", "1N"],
  ["S", "1N--"],
  ["W", "1N----"],
  ["N", "1H--1N--"],
  ["E", "1D"],
  ["S", "1D--"],
  ["W", "1D--1H"],
  ["N", "1C--1D--"],
  ["E", "2N"],
];

async function chiedi(seat, ctx) {
  const q = new URLSearchParams({
    hand: MANI[seat], seat, dealer: "N", vul: "None", ctx,
  });
  const avvio = Date.now();
  try {
    const res = await fetch(`${url}/bid?${q}`, {
      headers: token ? { "X-BEN-Token": token } : {},
      signal: AbortSignal.timeout(60000),
    });
    const secondi = (Date.now() - avvio) / 1000;
    if (!res.ok) return { chi: `HTTP ${res.status}`, bid: "-", secondi };
    const d = await res.json();
    return { chi: d.who ?? "?", bid: d.bid ?? "?", secondi };
  } catch (e) {
    return { chi: e.name, bid: "-", secondi: (Date.now() - avvio) / 1000 };
  }
}

console.log(`soglia: ${SOGLIA}s sulle simulazioni\n`);
console.log(`  ${"asta".padEnd(20)} ${"chi risponde".padEnd(14)} ${"bid".padEnd(6)} tempo`);

const simulazioni = [];
let errori = 0;
for (const [seat, ctx] of PROVE) {
  const { chi, bid, secondi } = await chiedi(seat, ctx);
  if (chi === "Simulation") simulazioni.push(secondi);
  if (chi.startsWith("HTTP") || chi.endsWith("Error")) errori++;
  const segno = chi === "Simulation" && secondi > SOGLIA ? "  <<< SOPRA SOGLIA" : "";
  console.log(
    `  ${`${seat}/${ctx || "vuota"}`.padEnd(20)} ${chi.padEnd(14)} ${String(bid).padEnd(6)} ${secondi.toFixed(2)}s${segno}`,
  );
}

if (DETERMINISMO) {
  console.log("\n── stessa domanda, seconda volta ──");
  let diverse = 0;
  for (const [seat, ctx] of PROVE) {
    const primo = await chiedi(seat, ctx);
    const secondo = await chiedi(seat, ctx);
    // DUE ERRORI NON SONO UN ACCORDO. Una richiesta fallita restituisce
    // `bid: "-"`, quindi due fallimenti si somigliavano abbastanza da essere
    // contati come «stessa risposta»: il controllo avrebbe dichiarato
    // deterministico un motore che non risponde affatto.
    const valida = (r) => r.bid !== "-" && !r.chi.startsWith("HTTP") && !r.chi.endsWith("Error");
    const entrambeValide = valida(primo) && valida(secondo);
    const uguali = entrambeValide && primo.bid === secondo.bid;
    if (!uguali) diverse++;
    const nota = !entrambeValide
      ? "   <<< RISPOSTA NON VALIDA"
      : uguali
        ? ""
        : "   <<< RISPOSTA DIVERSA";
    console.log(
      `  ${`${seat}/${ctx || "vuota"}`.padEnd(20)} ${primo.bid} / ${secondo.bid}${nota}`,
    );
  }
  console.log(
    diverse
      ? `\n${diverse} aste non hanno confermato il determinismo (risposte diverse o non valide).\n` +
          "La cache in memoria non basta più a garantire la parità nei tornei —\n" +
          "vedi la nota in src/lib/cache-licita.ts."
      : "\nDeterministico: ogni asta ha risposto allo stesso modo.",
  );
  if (diverse) process.exitCode = 1;
}

const sopra = simulazioni.filter((s) => s > SOGLIA);
console.log();
if (!simulazioni.length) {
  console.log("Nessuna simulazione fra le prove: il tempo non è stato messo alla prova.");
  console.log("Non è un buon esito, è un esito vuoto — servono aste che facciano simulare BEN.");
  process.exit(errori ? 1 : 0);
}
const max = Math.max(...simulazioni);
console.log(
  `simulazioni: ${simulazioni.length} | massimo ${max.toFixed(2)}s | sopra soglia ${sopra.length}`,
);
if (errori) console.log(`richieste fallite: ${errori}`);
process.exit(sopra.length || errori ? 1 : 0);
