import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const tz = "Europe/Rome";
const fmtDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: tz,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const localParts = (date) => Object.fromEntries(
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
);
const localTimestamp = (date) => fmtDate.format(date).replace(",", "");
const inc = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const refLines = git("for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes")
  .trim().split("\n").filter(Boolean);
const validRefs = [];
const invalidRefs = [];
for (const ref of refLines) {
  if (ref.endsWith("/HEAD")) continue;
  try {
    git("cat-file", "-e", `${ref}^{commit}`);
    validRefs.push(ref);
  } catch {
    invalidRefs.push(ref);
  }
}

if (!validRefs.length) throw new Error("Nessun riferimento Git valido");

function collect(refs, label) {
  const logRaw = git("log", "--reverse", "--format=%H%x1f%aI%x1f%an%x1f%ae", ...refs);
  const commits = logRaw.trim().split("\n").filter(Boolean).map((line) => {
    const [hash, iso, name, email] = line.split("\x1f");
    const identity = (email || name).trim().toLowerCase();
    return { hash, date: new Date(iso), author: createHash("sha256").update(identity).digest("hex").slice(0, 8) };
  });
  const unique = new Map();
  for (const c of commits) unique.set(c.hash, c);
  const uniqCommits = [...unique.values()].sort((a, b) => a.date - b.date);

  const authors = new Map();
  const months = new Map();
  const bands = new Map([["00-05", 0], ["06-11", 0], ["12-17", 0], ["18-23", 0]]);
  const activeDays = new Set();
  for (const commit of uniqCommits) {
    inc(authors, `Autore-${commit.author}`);
    const parts = localParts(commit.date);
    inc(months, `${parts.year}-${parts.month}`);
    activeDays.add(`${parts.year}-${parts.month}-${parts.day}`);
    const h = Number(parts.hour) % 24;
    const band = h < 6 ? "00-05" : h < 12 ? "06-11" : h < 18 ? "12-17" : "18-23";
    inc(bands, band);
  }

  const byAuthor = new Map();
  for (const commit of uniqCommits) {
    if (!byAuthor.has(commit.author)) byAuthor.set(commit.author, []);
    byAuthor.get(commit.author).push(commit);
  }
  let sessions = 0;
  let effortMinutes = 0;
  const sessionsByAuthor = {};
  for (const [author, list] of byAuthor.entries()) {
    list.sort((a, b) => a.date - b.date);
    let start = list[0].date;
    let end = list[0].date;
    let authorSessions = 0;
    let authorMinutes = 0;
    for (let i = 1; i < list.length; i += 1) {
      const gapMinutes = (list[i].date - end) / 60000;
      if (gapMinutes > 90) {
        authorSessions += 1;
        authorMinutes += (end - start) / 60000 + 30;
        start = list[i].date;
      }
      end = list[i].date;
    }
    authorSessions += 1;
    authorMinutes += (end - start) / 60000 + 30;
    sessions += authorSessions;
    effortMinutes += authorMinutes;
    sessionsByAuthor[`Autore-${author}`] = {
      sessioni: authorSessions,
      minuti: Math.round(authorMinutes),
      ore: Number((authorMinutes / 60).toFixed(2)),
    };
  }

  const numstatRaw = git("log", "--reverse", "--no-renames", "--format=@@COMMIT:%H", "--numstat", ...refs);
  const perCommit = new Map(uniqCommits.map((c) => [c.hash, { added: 0, removed: 0, binary: 0 }]));
  const files = new Map();
  let current = null;
  for (const line of numstatRaw.split("\n")) {
    if (line.startsWith("@@COMMIT:")) {
      current = line.slice(9);
      continue;
    }
    if (!current || !line.includes("\t")) continue;
    const [aRaw, dRaw, ...pathParts] = line.split("\t");
    const path = pathParts.join("\t");
    if (!path) continue;
    const rec = perCommit.get(current) ?? { added: 0, removed: 0, binary: 0 };
    if (aRaw === "-" || dRaw === "-") {
      rec.binary += 1;
    } else {
      const added = Number(aRaw);
      const removed = Number(dRaw);
      rec.added += added;
      rec.removed += removed;
      const file = files.get(path) ?? { commits: new Set(), added: 0, removed: 0 };
      file.commits.add(current);
      file.added += added;
      file.removed += removed;
      files.set(path, file);
    }
    perCommit.set(current, rec);
  }
  const churns = [...perCommit.values()].map((x) => x.added + x.removed);
  const totalAdded = [...perCommit.values()].reduce((sum, x) => sum + x.added, 0);
  const totalRemoved = [...perCommit.values()].reduce((sum, x) => sum + x.removed, 0);
  const binaryEntries = [...perCommit.values()].reduce((sum, x) => sum + x.binary, 0);
  const topFiles = [...files.entries()].map(([path, x]) => ({
    path,
    commits: x.commits.size,
    added: x.added,
    removed: x.removed,
    churn: x.added + x.removed,
  })).sort((a, b) => b.commits - a.commits || b.churn - a.churn || a.path.localeCompare(b.path)).slice(0, 15);

  const mergeCount = Number(git("rev-list", "--merges", "--count", ...refs).trim());

  return {
    ambito: label,
    riferimenti: refs,
    commit_totali: uniqCommits.length,
    commit_per_autore_pseudonimizzato: Object.fromEntries([...authors.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
    primo_commit: { hash: uniqCommits[0].hash, timestamp_Europe_Rome: localTimestamp(uniqCommits[0].date) },
    ultimo_commit: { hash: uniqCommits.at(-1).hash, timestamp_Europe_Rome: localTimestamp(uniqCommits.at(-1).date) },
    giorni_calendario_attivi: activeDays.size,
    commit_per_mese: Object.fromEntries([...months.entries()].sort()),
    commit_per_fascia_oraria_Europe_Rome: Object.fromEntries(bands),
    dimensione_commit_mediana_righe_aggiunte_piu_rimosse: median(churns),
    righe_aggiunte_totali: totalAdded,
    righe_rimosse_totali: totalRemoved,
    occorrenze_file_binari_ignorate_nel_conteggio_righe: binaryEntries,
    file_piu_modificati_per_numero_commit: topFiles,
    merge_commit: mergeCount,
    effort_timestamp: {
      regola: "Per autore: nuova sessione se gap > 90 minuti; durata = ultimo-primo commit + 30 minuti; sessione singola = 30 minuti.",
      sessioni: sessions,
      minuti_totali: Math.round(effortMinutes),
      ore_totali: Number((effortMinutes / 60).toFixed(2)),
      per_autore: sessionsByAuthor,
      qualificazione: "Limite inferiore: non cattura progettazione, ricerca, debug, riunioni, produzione dei contenuti e lavoro non committato. Non usabile automaticamente come effort di replica.",
    },
  };
}

const localBranches = validRefs.filter((x) => x.startsWith("refs/heads/"));
const remoteBranches = validRefs.filter((x) => x.startsWith("refs/remotes/"));
const currentBranch = git("branch", "--show-current").trim();
const head = git("rev-parse", "HEAD").trim();
const statusPorcelain = git("status", "--porcelain=v1");
const statusLines = statusPorcelain.split("\n").filter(Boolean);
const statusKinds = {};
for (const line of statusLines) {
  const kind = line.slice(0, 2).trim() || line.slice(0, 2);
  statusKinds[kind] = (statusKinds[kind] ?? 0) + 1;
}

const output = {
  rilevazione: {
    timezone: tz,
    ramo_corrente: currentBranch,
    head,
    working_tree_pulita: statusLines.length === 0,
    working_tree_voci: statusLines.length,
    working_tree_per_stato: statusKinds,
    riferimenti_branch_validi: validRefs,
    riferimenti_non_validi: invalidRefs,
    branch_locali_validi: localBranches.length,
    branch_remoti_validi: remoteBranches.length,
    branch_validi_totali: localBranches.length + remoteBranches.length,
    nota: "Le metriche Git sono calcolate due volte: (A) solo HEAD/branch corrente; (B) unione dei commit raggiungibili dai riferimenti branch validi, con deduplica per hash. I ref non validi sono esclusi.",
  },
  branch_corrente_HEAD: collect(["HEAD"], "solo HEAD / branch corrente"),
  unione_riferimenti_validi: collect(validRefs, "unione riferimenti branch validi, commit unici per hash"),
};

writeFileSync("audit-bridgelab/grok-raw/git-metrics.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
