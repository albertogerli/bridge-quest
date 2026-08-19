import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

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
const weekdayFmt = new Intl.DateTimeFormat("it-IT", { timeZone: tz, weekday: "long" });
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
const logRaw = git("log", "--reverse", "--format=%H%x1f%aI%x1f%an%x1f%ae", ...validRefs);
const commits = logRaw.trim().split("\n").filter(Boolean).map((line) => {
  const [hash, iso, name, email] = line.split("\x1f");
  const identity = (email || name).trim().toLowerCase();
  return { hash, date: new Date(iso), author: createHash("sha256").update(identity).digest("hex").slice(0, 8) };
});

const authors = new Map();
const months = new Map();
const bands = new Map([["00-05", 0], ["06-11", 0], ["12-17", 0], ["18-23", 0]]);
const weekdayOrder = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
const weekdays = new Map(weekdayOrder.map((day) => [day, 0]));
const weekdayBands = new Map(weekdayOrder.map((day) => [day, new Map([["00-05", 0], ["06-11", 0], ["12-17", 0], ["18-23", 0]])]));
const activeDays = new Set();
const activeWeekendDays = new Set();
const activeWeekdayDays = new Set();
let weekendCommits = 0;
let outsideTypicalWorkWindow = 0;
for (const commit of commits) {
  inc(authors, `Autore-${commit.author}`);
  const parts = localParts(commit.date);
  inc(months, `${parts.year}-${parts.month}`);
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  activeDays.add(dateKey);
  const h = Number(parts.hour) % 24;
  const band = h < 6 ? "00-05" : h < 12 ? "06-11" : h < 18 ? "12-17" : "18-23";
  inc(bands, band);
  const weekday = weekdayFmt.format(commit.date).toLowerCase();
  inc(weekdays, weekday);
  inc(weekdayBands.get(weekday), band);
  const weekend = weekday === "sabato" || weekday === "domenica";
  if (weekend) {
    weekendCommits += 1;
    activeWeekendDays.add(dateKey);
  } else {
    activeWeekdayDays.add(dateKey);
  }
  if (weekend || h < 9 || h >= 18) outsideTypicalWorkWindow += 1;
}

const byAuthor = new Map();
for (const commit of commits) {
  if (!byAuthor.has(commit.author)) byAuthor.set(commit.author, []);
  byAuthor.get(commit.author).push(commit);
}
let sessions = 0;
let effortMinutes = 0;
for (const list of byAuthor.values()) {
  list.sort((a, b) => a.date - b.date);
  let start = list[0].date;
  let end = list[0].date;
  for (let i = 1; i < list.length; i += 1) {
    const gapMinutes = (list[i].date - end) / 60000;
    if (gapMinutes > 90) {
      sessions += 1;
      effortMinutes += (end - start) / 60000 + 30;
      start = list[i].date;
    }
    end = list[i].date;
  }
  sessions += 1;
  effortMinutes += (end - start) / 60000 + 30;
}

const numstatRaw = git("log", "--reverse", "--no-renames", "--format=@@COMMIT:%H", "--numstat", ...validRefs);
const perCommit = new Map(commits.map((c) => [c.hash, { added: 0, removed: 0, binary: 0 }]));
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

const localBranches = validRefs.filter((x) => x.startsWith("refs/heads/")).length;
const remoteBranches = validRefs.filter((x) => x.startsWith("refs/remotes/")).length;
const mergeCount = Number(git("rev-list", "--merges", "--count", ...validRefs).trim());
const currentBranch = git("branch", "--show-current").trim();
const head = git("rev-parse", "HEAD").trim();

const output = {
  ambito: {
    ramo_corrente: currentBranch,
    head,
    riferimenti_branch_validi: validRefs,
    riferimenti_non_validi: invalidRefs,
    nota: "Metriche calcolate sull'unione dei commit raggiungibili dai riferimenti branch validi; ref non validi esclusi.",
  },
  git: {
    commit_totali: commits.length,
    commit_per_autore_pseudonimizzato: Object.fromEntries([...authors.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
    primo_commit: { hash: commits[0].hash, timestamp_Europe_Rome: localTimestamp(commits[0].date) },
    ultimo_commit: { hash: commits.at(-1).hash, timestamp_Europe_Rome: localTimestamp(commits.at(-1).date) },
    giorni_calendario_attivi: activeDays.size,
    commit_per_mese: Object.fromEntries([...months.entries()].sort()),
    commit_per_fascia_oraria_Europe_Rome: Object.fromEntries(bands),
    commit_per_giorno_settimana_Europe_Rome: Object.fromEntries(weekdays),
    commit_per_giorno_e_fascia_Europe_Rome: Object.fromEntries(
      [...weekdayBands].map(([day, values]) => [day, Object.fromEntries(values)]),
    ),
    lavoro_extra_orario_proxy: {
      definizione: "Commit di sabato/domenica oppure, nei feriali, prima delle 09:00 o dalle 18:00 in poi.",
      commit_weekend: weekendCommits,
      quota_commit_weekend_pct: Number((weekendCommits / commits.length * 100).toFixed(2)),
      commit_fuori_finestra_feriale_09_18: outsideTypicalWorkWindow,
      quota_fuori_finestra_pct: Number((outsideTypicalWorkWindow / commits.length * 100).toFixed(2)),
      giorni_attivi_weekend: activeWeekendDays.size,
      giorni_attivi_feriali: activeWeekdayDays.size,
      commit_serali_o_notturni_18_05: bands.get("18-23") + bands.get("00-05"),
      quota_serali_o_notturni_pct: Number(((bands.get("18-23") + bands.get("00-05")) / commits.length * 100).toFixed(2)),
    },
    dimensione_commit_mediana_righe_aggiunte_piu_rimosse: median(churns),
    righe_aggiunte_totali: totalAdded,
    righe_rimosse_totali: totalRemoved,
    occorrenze_file_binari_ignorate_nel_conteggio_righe: binaryEntries,
    file_piu_modificati_per_numero_commit: topFiles,
    branch_locali_validi: localBranches,
    branch_remoti_validi: remoteBranches,
    branch_validi_totali: localBranches + remoteBranches,
    merge_commit: mergeCount,
  },
  effort_timestamp: {
    regola: "Per autore: nuova sessione se gap > 90 minuti; durata = ultimo-primo commit + 30 minuti; sessione singola = 30 minuti.",
    sessioni: sessions,
    minuti_totali: Math.round(effortMinutes),
    ore_totali: Number((effortMinutes / 60).toFixed(2)),
    qualificazione: "Limite inferiore: non cattura progettazione, debug e lavoro non committato.",
  },
};

console.log(JSON.stringify(output, null, 2));
