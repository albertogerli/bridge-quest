/**
 * I contenuti didattici in inglese: lezioni, moduli, smazzate, glossario.
 *
 *   node scripts/traduci-contenuti.mjs                 # cosa manca
 *   node scripts/traduci-contenuti.mjs --tabella lessons --scrivi
 *   node scripts/traduci-contenuti.mjs --tutto --scrivi
 *   node scripts/traduci-contenuti.mjs --invecchiate   # cambiate dopo la traduzione
 *
 * Richiede OPENAI_API_KEY. Le colonne `_en` arrivano da
 * `scripts/sql/contenuti-inglese-2026-08.sql`, da eseguire prima.
 *
 * SI TRADUCE IL CAMPO, NON LA RIGA. I moduli e l'eserciziario hanno il
 * contenuto in `jsonb`: un array di blocchi tipizzati (`text`, `quiz`,
 * `heading`, `rule`, `example`, `true-false`). Qui si scende dentro la
 * struttura e si traducono SOLO le stringhe di testo, lasciando intatti tipi,
 * chiavi, indici delle risposte giuste e ordine dei blocchi. Passare l'intero
 * oggetto a un modello e chiedergli «traducilo» significa riceverne indietro
 * uno con le chiavi tradotte, un quiz con tre risposte invece di quattro, o
 * l'indice della risposta giusta spostato — difetti che compilano e insegnano
 * la cosa sbagliata.
 *
 * SI SALVA DA DOVE SI È PARTITI. Ogni traduzione registra l'impronta del testo
 * italiano in `traduzioni_stato`: `--invecchiate` elenca le righe italiane
 * cambiate dopo, che sono le traduzioni da rifare. Senza, la divergenza è
 * silenziosa come lo era quella dello schema.
 *
 * RIPARTIBILE: quello che ha già una traduzione viene saltato.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { leggiEnv } from "./leggi-env.mjs";

const env = leggiEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SCRIVI = process.argv.includes("--scrivi");
const TUTTO = process.argv.includes("--tutto");
const INVECCHIATE = process.argv.includes("--invecchiate");
/**
 * Il valore di un'opzione, o `undefined` se l'opzione non c'è.
 *
 * `argv[indexOf(x) + 1]` sembra innocuo e non lo è: quando l'opzione manca
 * `indexOf` risponde -1, l'indice diventa 0, e si legge il percorso di node
 * come se fosse il nome di una tabella. Lo script chiedeva la chiave OpenAI
 * per mostrare un semplice riepilogo.
 */
function opzione(nome) {
  const i = process.argv.indexOf(nome);
  return i === -1 ? undefined : process.argv[i + 1];
}

const soloTabella = opzione("--tabella");
const LIMITE = Number(opzione("--quante")) || 0;

/**
 * Cosa tradurre, tabella per tabella.
 *
 * `chiave` è la colonna che identifica la riga; `campi` sono le coppie
 * italiano → inglese. `dentroJson` elenca i campi che sono strutture, non
 * testo piatto.
 */
const TABELLE = [
  { nome: "courses", chiave: "id", campi: { name: "name_en", subtitle: "subtitle_en" } },
  { nome: "course_worlds", chiave: "id", campi: { name: "name_en", subtitle: "subtitle_en" } },
  { nome: "lessons", chiave: "id", campi: { title: "title_en", subtitle: "subtitle_en" } },
  {
    nome: "lesson_modules",
    chiave: "module_id",
    campi: { title: "title_en", content: "content_en" },
    dentroJson: ["content"],
  },
  { nome: "smazzate", chiave: "id", campi: { title: "title_en", commentary: "commentary_en" } },
  {
    nome: "glossary",
    chiave: "id",
    campi: { term: "term_en", definition: "definition_en", example: "example_en" },
  },
  {
    nome: "eserciziario_exercises",
    chiave: "id",
    campi: { title: "title_en", content: "content_en" },
    dentroJson: ["content"],
  },
  {
    nome: "trova_errore_scenarios",
    chiave: "id",
    campi: {
      situation: "situation_en",
      error_description: "error_description_en",
      explanation: "explanation_en",
    },
  },
  {
    nome: "collectible_cards",
    chiave: "id",
    campi: { name: "name_en", description: "description_en" },
  },
];

const GLOSSARIO = `licita/dichiarazione = bidding, the auction, a bid
smazzata = deal | mano = hand | presa = trick | atout = trump
contro = double | surcontro = redouble | manche = game (MAI "match")
parziale = part score | dichiarante = declarer | morto = dummy
apertore = opener | taglio = ruff | impasse = finesse
affrancare = to establish | attacco = opening lead
punti onori = high card points (HCP) | in zona = vulnerable
Nord/Sud/Est/Ovest = North/South/East/West
Fiori/Quadri/Cuori/Picche = Clubs/Diamonds/Hearts/Spades`;

const ISTRUZIONI = `Sei un traduttore di materiale didattico di bridge. Traduci in inglese americano (terminologia ACBL) il testo che ricevi. Rispondi SOLO con la traduzione.

REGOLE
1. Usa ESATTAMENTE questa terminologia:
${GLOSSARIO}
2. Non aggiungere, non togliere, non "migliorare" il contenuto didattico: una
   regola di bridge riscritta meglio è una regola diversa.
3. Mantieni la formattazione: a capo, elenchi, simboli dei semi (♠♥♦♣),
   maiuscole, numeri e sigle (FIGB, HCP, IMP).
4. Le carte restano com'è: A K Q J 10 9…, e i contratti pure (4♠, 3SA → 3NT).
5. Rispondi con il solo testo tradotto, senza virgolette né commenti.
`;

const impronta = (t) => createHash("md5").update(String(t)).digest("hex");

/**
 * Una traduzione plausibile? Se no, meglio niente.
 *
 * Su un testo brevissimo — «Corso Fiori» — il modello ha risposto ripetendo
 * tutte le istruzioni ricevute, e quella risposta è finita nel database come
 * nome del corso. Con la traduzione dentro le colonne non c'è compilatore che
 * protesti: si scopre leggendo la pagina.
 *
 * Due indizi bastano a riconoscere il caso: la risposta contiene pezzi delle
 * istruzioni, oppure è spropositata rispetto all'originale. L'inglese è più
 * corto dell'italiano, quindi il triplo è già fuori scala.
 */
function rispostaSensata(originale, tradotta) {
  if (!tradotta) return false;
  if (/REGOLE|TESTO:|terminologia:|Rispondi con il solo/i.test(tradotta)) return false;
  // Il quadruplo, e mai sotto i 120 caratteri: l'inglese è più corto
  // dell'italiano, ma una frase di venti caratteri può legittimamente
  // diventarne settanta. Con la soglia al triplo il controllo bocciava
  // traduzioni buone, e siccome un rifiuto fermava tutto il giro, una riga
  // sola bloccava le altre trecento.
  if (tradotta.length > Math.max(120, originale.length * 4)) return false;
  return true;
}

async function traduci(client, testo, extra = "") {
  // Le istruzioni vanno nel ruolo `system`: nel messaggio dell'utente si
  // confondono col testo da tradurre, ed è così che il modello le ha
  // rimandate indietro come se fossero la traduzione.
  const chiedi = async () =>
    (
      await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: ISTRUZIONI + (extra ? `\n\n${extra}` : "") },
          { role: "user", content: testo },
        ],
        temperature: 0,
      })
    ).choices[0].message.content.trim();

  let fuori = await chiedi();
  // Sui blocchi numerati la lunghezza non dice niente (sono molti testi
  // insieme): lì il controllo vero è che i numeri tornino, e lo fa chi chiama.
  const controlla = !extra;
  if (controlla && !rispostaSensata(testo, fuori)) {
    fuori = await chiedi(); // una seconda occasione, poi si rinuncia
    if (!rispostaSensata(testo, fuori)) {
      throw new Error(
        `traduzione non plausibile per «${testo.slice(0, 40)}»: ${fuori.slice(0, 60)}`
      );
    }
  }
  return fuori;
}

/**
 * Traduce le stringhe dentro una struttura, lasciandola identica.
 *
 * IN UNA CHIAMATA SOLA, e non è un'ottimizzazione da poco: un modulo di
 * lezione contiene decine di stringhe fra blocchi, domande e risposte, e
 * chiamare il modello per ognuna vorrebbe dire ventimila richieste per i soli
 * moduli — ore di attesa e un conto sproporzionato. Si raccolgono le stringhe,
 * si traducono numerate in un colpo, si rimettono al loro posto.
 *
 * LE CHIAVI NON SI TOCCANO: `question` resta `question`, o il codice che legge
 * quel blocco smette di trovarlo. E non si toccano i valori che non sono prosa
 * — `type`, l'indice della risposta giusta, le carte — perché un quiz con la
 * risposta spostata è un difetto che compila e insegna la cosa sbagliata.
 */
const CHIAVI_DA_NON_TRADURRE = new Set([
  // `correctAnswer` è il nome vero nei quiz: è un numero, quindi non verrebbe
  // tradotto comunque, ma se un domani diventasse una lettera («A», «B») la
  // traduzione la sposterebbe e la risposta giusta cambierebbe in silenzio.
  "type", "id", "correct", "correctAnswer", "answer", "position", "icon",
  "image", "suit", "rank", "cards", "deal", "contract", "declarer", "level",
  "strain",
]);

const daTradurre = (v, chiave) =>
  typeof v === "string" &&
  !CHIAVI_DA_NON_TRADURRE.has(chiave) &&
  v.trim().length >= 3 &&
  /[a-zà-ù]{3}/i.test(v);

/** Percorre la struttura applicando `f` a ogni stringa traducibile. */
function percorri(valore, chiave, f) {
  if (daTradurre(valore, chiave)) return f(valore);
  if (Array.isArray(valore)) return valore.map((v) => percorri(v, chiave, f));
  if (valore && typeof valore === "object") {
    const fuori = {};
    for (const [k, v] of Object.entries(valore)) {
      fuori[k] = CHIAVI_DA_NON_TRADURRE.has(k) ? v : percorri(v, k, f);
    }
    return fuori;
  }
  return valore;
}

async function traduciStruttura(client, struttura) {
  const stringhe = [];
  percorri(struttura, "", (s) => {
    stringhe.push(s);
    return s;
  });
  if (!stringhe.length) return struttura;

  // Numerate con un separatore che non compare nei testi di bridge.
  const numerate = stringhe.map((s, i) => `[${i + 1}]§ ${s}`).join("\n");
  const risposta = await traduci(
    client,
    numerate,
    "Traduci ogni riga numerata mantenendo ESATTAMENTE la stessa numerazione e lo stesso separatore «[n]§ ». Una riga per ogni riga in ingresso, nello stesso ordine. Non unire, non dividere, non aggiungere righe."
  );

  const tradotte = new Map();
  for (const riga of risposta.split(/\n(?=\[\d+\]§)/)) {
    const m = riga.match(/^\[(\d+)\]§\s?([\s\S]*)$/);
    if (m) tradotte.set(Number(m[1]), m[2].trim());
  }

  // Se il conto non torna, non si indovina: si lascia l'italiano, che è
  // leggibile, invece di un testo mescolato che sembra inglese e non lo è.
  if (tradotte.size !== stringhe.length) {
    throw new Error(
      `la struttura ha ${stringhe.length} testi ma ne sono tornati ${tradotte.size}`
    );
  }

  let i = 0;
  return percorri(struttura, "", () => tradotte.get(++i) ?? stringhe[i - 1]);
}

async function stato() {
  console.log("tabella                    righe   tradotte   da fare");
  console.log("────────────────────────────────────────────────────────");
  let mancano = 0;
  for (const t of TABELLE) {
    const primoEn = Object.values(t.campi)[0];
    const { count: totale } = await db.from(t.nome).select("*", { count: "exact", head: true });
    const { count: fatte } = await db
      .from(t.nome)
      .select("*", { count: "exact", head: true })
      .not(primoEn, "is", null);
    const resta = (totale ?? 0) - (fatte ?? 0);
    mancano += resta;
    console.log(
      `${t.nome.padEnd(24)} ${String(totale ?? 0).padStart(6)} ${String(fatte ?? 0).padStart(10)} ${String(resta).padStart(9)}`
    );
  }
  console.log("────────────────────────────────────────────────────────");
  console.log(`da tradurre in tutto: ${mancano} righe`);
}

async function invecchiate() {
  const { data } = await db.from("traduzioni_stato").select("*");
  if (!data?.length) {
    console.log("nessuna traduzione registrata: niente da confrontare.");
    return;
  }
  let vecchie = 0;
  for (const t of TABELLE) {
    const righe = data.filter((r) => r.tabella === t.nome);
    if (!righe.length) continue;
    const { data: attuali } = await db
      .from(t.nome)
      .select([t.chiave, ...Object.keys(t.campi)].join(","));
    for (const r of righe) {
      const riga = attuali?.find((x) => String(x[t.chiave]) === r.riga_id);
      if (!riga) continue;
      const ora = impronta(
        typeof riga[r.campo] === "object" ? JSON.stringify(riga[r.campo]) : riga[r.campo] ?? ""
      );
      if (ora !== r.impronta_it) {
        vecchie++;
        console.log(`  ${t.nome} · ${r.riga_id} · ${r.campo}: l'italiano è cambiato dopo la traduzione`);
      }
    }
  }
  console.log(vecchie ? `\n${vecchie} traduzioni da rifare.` : "\nnessuna traduzione invecchiata.");
}

async function main() {
  if (INVECCHIATE) return invecchiate();
  if (!SCRIVI && !TUTTO && !soloTabella) return stato();

  const chiave = process.env.OPENAI_API_KEY;
  if (!chiave) {
    console.error("Serve OPENAI_API_KEY.");
    process.exit(1);
  }
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: chiave });

  let fatte = 0;
  let saltateTotali = 0;
  for (const t of TABELLE) {
    if (soloTabella && t.nome !== soloTabella) continue;
    const primoEn = Object.values(t.campi)[0];
    const colonne = [t.chiave, ...Object.keys(t.campi), ...Object.values(t.campi)];
    const { data, error } = await db
      .from(t.nome)
      .select(colonne.join(","))
      .is(primoEn, null)
      .limit(LIMITE || 1000);
    if (error) {
      console.error(`${t.nome}: ${error.message}`);
      continue;
    }
    if (!data?.length) continue;
    console.log(`\n${t.nome}: ${data.length} righe da tradurre`);

    for (const riga of data) {
      const aggiornamento = {};
      const impronte = [];
      try {
      for (const [it, en] of Object.entries(t.campi)) {
        const originale = riga[it];
        if (originale === null || originale === undefined || originale === "") continue;
        const struttura = t.dentroJson?.includes(it);
        aggiornamento[en] = struttura
          ? await traduciStruttura(client, originale)
          : await traduci(client, String(originale));
        impronte.push({
          tabella: t.nome,
          riga_id: String(riga[t.chiave]),
          campo: it,
          impronta_it: impronta(struttura ? JSON.stringify(originale) : originale),
        });
      }
      } catch (errore) {
        // Una riga che non si riesce a tradurre non deve fermare le altre
        // trecento: si salta, si dice quale, e la si ritenta al giro dopo —
        // lo script riparte da ciò che è ancora senza traduzione.
        saltateTotali++;
        console.error(`  ! ${riga[t.chiave]}: ${String(errore.message ?? errore).slice(0, 90)}`);
        continue;
      }
      if (!Object.keys(aggiornamento).length) continue;

      if (SCRIVI) {
        const { error: e1 } = await db
          .from(t.nome)
          .update(aggiornamento)
          .eq(t.chiave, riga[t.chiave]);
        if (e1) {
          console.error(`  ! ${riga[t.chiave]}: ${e1.message}`);
          continue;
        }
        await db.from("traduzioni_stato").upsert(impronte);
      }
      fatte++;
      console.log(`  ${riga[t.chiave]}${SCRIVI ? "" : " (prova)"}`);
      if (LIMITE && fatte >= LIMITE) {
        console.log(`\nfermato dopo ${fatte}: guarda il risultato prima di continuare.`);
        return;
      }
    }
  }
  console.log(`\n${fatte} righe tradotte${SCRIVI ? "" : " (prova: niente scritto)"}.`);
  if (saltateTotali) {
    console.log(`${saltateTotali} righe saltate: rilancia lo script per ritentarle.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
