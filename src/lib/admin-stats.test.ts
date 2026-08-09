import { describe, it, expect } from "vitest";
import {
  asdMediansAreApproximate,
  bucketPlatform,
  buildAsdRows,
  dropOne,
  buildUserActivity,
  buildUsersCsv,
  computeStats,
  countInstructors,
  daysSince,
  defaultSortDir,
  emptyPlatformBreakdown,
  filterAsdRows,
  filterUsers,
  formatLastLogin,
  formatMinutes,
  isDidactaPeriod,
  isFullTimestamp,
  last30Days,
  mapProfilesToUsers,
  median,
  medianRaw,
  parseLogin,
  rankBy,
  resolveDayUsers,
  sortUsers,
} from "./admin-stats";
import type { AsdDistributionRow, LoginRecord, ProfileRecord, UserRow } from "@/app/admin/_types";

// ── Fixtures ───────────────────────────────────────────────────────────────

const NOW = new Date("2026-08-09T12:00:00Z");

function profile(over: Partial<ProfileRecord> & { id: string }): ProfileRecord {
  return {
    display_name: null,
    bbo_username: null,
    profile_type: "adulto",
    xp: 0,
    streak: 0,
    hands_played: 0,
    asd_code: null,
    asd_name: null,
    marketing_consent: null,
    total_minutes: 0,
    created_at: "2026-01-01T10:00:00Z",
    last_login: null,
    platform: null,
    ...over,
  };
}

const PROFILES: ProfileRecord[] = [
  profile({
    id: "u1", display_name: "Ada", bbo_username: "ada_bbo", profile_type: "adulto",
    xp: 100, streak: 3, hands_played: 7, asd_code: "F1", asd_name: "ASD Roma",
    marketing_consent: true, total_minutes: 42,
    created_at: "2026-08-09T10:00:00Z", last_login: "2026-08-09T11:00:00Z",
    platform: "ios", role: "instructor",
  }),
  profile({
    id: "u2", profile_type: "junior", xp: 10, marketing_consent: false,
    created_at: "2026-07-01T10:00:00Z",
  }),
  profile({
    id: "u3", display_name: "Carlo", profile_type: "senior", xp: 500, streak: 10,
    hands_played: 100, asd_code: "F2", asd_name: "ASD Milano", total_minutes: 130,
    created_at: "2026-08-01T10:00:00Z", last_login: "2026-08-08T09:00:00Z",
    platform: "web",
  }),
];

const LOGINS: LoginRecord[] = [
  { id: "l1", user_id: "u1", logged_in_at: "2026-08-09T09:00:00Z", platform: "ios" },
  { id: "l2", user_id: "u3", logged_in_at: "2026-08-08T09:00:00Z", platform: "android" },
  // login di un utente non presente fra i profili (cancellato o filtrato)
  { id: "l3", user_id: "ghost", logged_in_at: "2026-08-09T08:00:00Z", platform: null },
];

const ASD_CLUBS = [{ name: "ASD Milano", province: "MI" }];

function baseStats() {
  return computeStats({
    profiles: PROFILES,
    users: mapProfilesToUsers(PROFILES),
    logins: LOGINS,
    asdClubs: ASD_CLUBS,
    now: NOW,
    instructors: 1,
    classes: 4,
    students: 12,
  });
}

// ── Helper puri ────────────────────────────────────────────────────────────

describe("bucketPlatform / emptyPlatformBreakdown", () => {
  it("riconosce le piattaforme note", () => {
    expect(bucketPlatform("ios")).toBe("ios");
    expect(bucketPlatform("android")).toBe("android");
    expect(bucketPlatform("pwa")).toBe("pwa");
    expect(bucketPlatform("web")).toBe("web");
  });

  it("mappa null, undefined e valori sconosciuti su 'unknown'", () => {
    expect(bucketPlatform(null)).toBe("unknown");
    expect(bucketPlatform(undefined)).toBe("unknown");
    expect(bucketPlatform("windows-phone")).toBe("unknown");
    expect(bucketPlatform("")).toBe("unknown");
  });

  it("parte da un conteggio azzerato per ogni piattaforma", () => {
    expect(emptyPlatformBreakdown()).toEqual({ ios: 0, android: 0, pwa: 0, web: 0, unknown: 0 });
  });
});

describe("parseLogin / isFullTimestamp", () => {
  it("restituisce null su valore assente o non parsabile", () => {
    expect(parseLogin(null)).toBeNull();
    expect(parseLogin("")).toBeNull();
    expect(parseLogin("non-una-data")).toBeNull();
  });

  it("accetta sia la data secca sia il timestamp ISO", () => {
    expect(parseLogin("2026-03-11")?.toISOString()).toBe("2026-03-11T00:00:00.000Z");
    expect(parseLogin("2026-03-11T14:32:00Z")?.toISOString()).toBe("2026-03-11T14:32:00.000Z");
  });

  it("distingue il timestamp completo dalla data secca", () => {
    expect(isFullTimestamp("2026-03-11")).toBe(false);
    expect(isFullTimestamp("2026-03-11T14:32:00Z")).toBe(true);
  });
});

describe("median / medianRaw", () => {
  it("median: 0 su lista vuota", () => {
    expect(median([])).toBe(0);
  });

  it("median: valore centrale su lista dispari, media arrotondata su pari", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(3); // round(2.5) = 3
    expect(median([10])).toBe(10);
  });

  it("median non muta l'array in ingresso", () => {
    const arr = [3, 1, 2];
    median(arr);
    expect(arr).toEqual([3, 1, 2]);
  });

  it("REGRESSIONE: medianRaw ha la stessa guardia di median sulla lista vuota (niente NaN in UI)", () => {
    expect(medianRaw([])).toBe(0);
    expect(Number.isNaN(medianRaw([]))).toBe(false);
  });

  it("medianRaw: stessi risultati di median sulle liste non vuote", () => {
    expect(medianRaw([3, 1, 2])).toBe(2);
    expect(medianRaw([1, 2, 3, 4])).toBe(3);
  });
});

describe("mapProfilesToUsers / countInstructors", () => {
  it("normalizza asd_name vuoto e platform mancante", () => {
    const [u] = mapProfilesToUsers([profile({ id: "x", asd_name: "", platform: undefined })]);
    expect(u.asd_name).toBeNull();
    expect(u.platform).toBeNull();
  });

  it("non propaga il campo role nella riga utente", () => {
    const [u] = mapProfilesToUsers([profile({ id: "x", role: "admin" })]);
    expect("role" in u).toBe(false);
  });

  it("conta solo i profili con role instructor", () => {
    expect(countInstructors(PROFILES)).toBe(1);
    expect(countInstructors([])).toBe(0);
  });
});

// ── Aggregazione principale ────────────────────────────────────────────────

describe("computeStats", () => {
  it("conta iscrizioni per finestra temporale", () => {
    const s = baseStats();
    expect(s.total).toBe(3);
    expect(s.today).toBe(1);
    expect(s.week).toBe(1);
    expect(s.month).toBe(2);
  });

  it("conta gli utenti attivi da last_login", () => {
    const s = baseStats();
    expect(s.activeToday).toBe(1);
    expect(s.activeWeek).toBe(2);
  });

  it("aggrega XP, mani, tempo e streak", () => {
    const s = baseStats();
    expect(s.byType).toEqual({ adulto: 1, junior: 1, senior: 1 });
    expect(s.totalXp).toBe(610);
    expect(s.avgXp).toBe(203);
    expect(s.totalHands).toBe(107);
    expect(s.avgHands).toBe(36);
    expect(s.maxStreak).toBe(10);
    expect(s.totalMinutesAll).toBe(172);
    expect(s.avgMinutes).toBe(57);
  });

  it("classifica il consenso marketing su tre stati", () => {
    const s = baseStats();
    expect(s.marketingAccepted).toBe(1);
    expect(s.marketingDeclined).toBe(1);
    expect(s.marketingPending).toBe(1);
  });

  it("segmenta per presenza di BBO e ASD", () => {
    const s = baseStats();
    expect(s.bboWithAsd).toBe(1);
    expect(s.bboWithoutAsd).toBe(0);
    expect(s.asdWithoutBbo).toBe(1);
    expect(s.noBboNoAsd).toBe(1);
  });

  it("calcola la retention a 7 giorni sui soli iscritti più vecchi di 7 giorni", () => {
    const s = baseStats();
    expect(s.retention7d).toBe(50);
  });

  it("ordina la top 10 per XP decrescente", () => {
    const s = baseStats();
    expect(s.topUsers.map((u) => u.id)).toEqual(["u3", "u1", "u2"]);
  });

  it("costruisce 30 giorni di iscrizioni e 14 di attivi", () => {
    const s = baseStats();
    expect(s.dailySignups).toHaveLength(30);
    expect(s.dailySignups[29]).toEqual({ date: "2026-08-09", count: 1 });
    expect(s.dailySignups.find((d) => d.date === "2026-08-01")?.count).toBe(1);
    expect(s.dailyActive).toHaveLength(14);
    expect(s.dailyActive[0].date).toBe("2026-08-09");
    expect(s.hourlySignups).toHaveLength(24);
    expect(s.hourlySignups.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("include nei giorni attivi anche i login di utenti non più nei profili", () => {
    const s = baseStats();
    const oggi = s.dailyActive[0].activeUsers;
    expect(oggi.map((u) => u.id).sort()).toEqual(["ghost", "u1"]);
    expect(oggi.find((u) => u.id === "ghost")?.display_name).toBeNull();
  });

  it("arricchisce la distribuzione ASD con provincia e regione dal catalogo", () => {
    const s = baseStats();
    const milano = s.asdDistribution.find((a) => a.name === "ASD Milano")!;
    const roma = s.asdDistribution.find((a) => a.name === "ASD Roma")!;
    expect(milano.province).toBe("MI");
    expect(milano.region).toBe("Lombardia");
    // ASD non presente nel catalogo: nessuna provincia, nessuna regione
    expect(roma.province).toBeUndefined();
    expect(roma.region).toBeUndefined();
    expect(roma.topUser).toBe("Ada");
    expect(roma.topUserXp).toBe(100);
    expect(roma.restMedianXp).toBe(0);
    expect(roma.lowEngagement).toBe(false);
  });

  it("segnala lowEngagement solo con 3+ utenti fiacchi e nessuna iscrizione recente", () => {
    const vecchi: ProfileRecord[] = [1, 2, 3].map((n) =>
      profile({
        id: `old${n}`, display_name: `Old ${n}`, asd_name: "ASD Dormiente",
        xp: n === 1 ? 900 : 10, created_at: "2026-06-01T10:00:00Z",
      }),
    );
    const s = computeStats({
      profiles: vecchi, users: mapProfilesToUsers(vecchi), logins: [], asdClubs: [],
      now: NOW, instructors: 0, classes: 0, students: 0,
    });
    const asd = s.asdDistribution[0];
    expect(asd.count).toBe(3);
    expect(asd.topUser).toBe("Old 1");
    expect(asd.lowEngagement).toBe(true);
    expect(asd.firstSignup).toBe("2026-06-01");
  });

  it("ripartisce iscrizioni e accessi per piattaforma", () => {
    const s = baseStats();
    expect(s.platformSignups).toEqual({ ios: 1, android: 0, pwa: 0, web: 1, unknown: 1 });
    expect(s.platformLogins30d).toEqual({ ios: 1, android: 1, pwa: 0, web: 0, unknown: 1 });
  });

  it("riporta i conteggi del portale istruttori così come ricevuti", () => {
    const s = baseStats();
    expect(s.instructors).toBe(1);
    expect(s.classes).toBe(4);
    expect(s.students).toBe(12);
  });

  it("non divide per zero con nessun profilo", () => {
    const s = computeStats({
      profiles: [], users: [], logins: [], asdClubs: [], now: NOW,
      instructors: 0, classes: 0, students: 0,
    });
    expect(s.total).toBe(0);
    expect(s.avgXp).toBe(0);
    expect(s.avgHands).toBe(0);
    expect(s.avgMinutes).toBe(0);
    expect(s.retention7d).toBe(0);
    expect(s.topUsers).toEqual([]);
    expect(s.asdDistribution).toEqual([]);
    expect(s.byType).toEqual({});
    expect(s.dailySignups.every((d) => d.count === 0)).toBe(true);
    expect(s.dailyActive.every((d) => d.activeUsers.length === 0)).toBe(true);
  });

  it("ignora last_login non parsabile senza contarlo fra gli attivi", () => {
    const rotti = [profile({ id: "b1", last_login: "mai" })];
    const s = computeStats({
      profiles: rotti, users: mapProfilesToUsers(rotti), logins: [], asdClubs: [],
      now: NOW, instructors: 0, classes: 0, students: 0,
    });
    expect(s.activeToday).toBe(0);
    expect(s.activeWeek).toBe(0);
  });
});

// ── Distribuzione ASD per tab ──────────────────────────────────────────────

const DIST: AsdDistributionRow[] = [
  {
    name: "ASD Roma", count: 2, province: "RM", region: "Lazio",
    medianXp: 100, medianMinutes: 30, topUser: "Ada", topUserXp: 200,
    restMedianXp: 100, restMedianMinutes: 30,
    firstSignup: "2026-01-01", lastActive: "2026-02-01", lowEngagement: true,
  },
  {
    name: "ASD Milano", count: 1, province: "MI", region: "Lombardia",
    medianXp: 50, medianMinutes: 10, topUser: "Bob", topUserXp: 50,
    restMedianXp: 0, restMedianMinutes: 0,
    firstSignup: "2026-03-01", lastActive: "2026-03-02", lowEngagement: false,
  },
  {
    name: "ASD Ignota", count: 3,
    medianXp: 10, medianMinutes: 5, topUser: "Cle", topUserXp: 10,
    restMedianXp: 0, restMedianMinutes: 0,
    firstSignup: "2026-04-01", lastActive: "2026-04-02", lowEngagement: false,
  },
];

describe("buildAsdRows", () => {
  it("tab ASD: mantiene ordine e compone il dettaglio provincia · regione", () => {
    const rows = buildAsdRows(DIST, "asd");
    expect(rows.map((r) => r.label)).toEqual(["ASD Roma", "ASD Milano", "ASD Ignota"]);
    expect(rows[0].detail).toBe("RM · Lazio");
    expect(rows[2].detail).toBeUndefined();
    expect(rows[0].lowEngagement).toBe(true);
    expect(rows[0].firstSignup).toBe("2026-01-01");
  });

  it("tab province: aggrega per provincia, ordina per numerosità e usa N/D se manca", () => {
    const rows = buildAsdRows(DIST, "province");
    expect(rows.map((r) => r.label)).toEqual(["N/D", "RM", "MI"]);
    expect(rows.map((r) => r.count)).toEqual([3, 2, 1]);
    expect(rows.find((r) => r.label === "RM")?.detail).toBe("Lazio");
    expect(rows.find((r) => r.label === "N/D")?.detail).toBe("");
    expect(rows.find((r) => r.label === "RM")?.topUser).toBe("Ada");
    expect(rows.find((r) => r.label === "RM")?.medianXp).toBe(100);
    expect(rows.every((r) => r.lowEngagement === false)).toBe(true);
  });

  it("tab regione: aggrega per regione, senza dettaglio", () => {
    const rows = buildAsdRows(DIST, "regione");
    expect(rows.map((r) => r.label)).toEqual(["N/D", "Lazio", "Lombardia"]);
    expect(rows.map((r) => r.count)).toEqual([3, 2, 1]);
    expect(rows[0].detail).toBeUndefined();
    expect(rows.find((r) => r.label === "Lazio")?.medianMinutes).toBe(30);
  });

  it("lista vuota su distribuzione vuota, in tutti i tab", () => {
    expect(buildAsdRows([], "asd")).toEqual([]);
    expect(buildAsdRows([], "province")).toEqual([]);
    expect(buildAsdRows([], "regione")).toEqual([]);
  });

  // ── A2: il "resto" deve escludere davvero il top user ────────────────────

  /**
   * Due ASD nella stessa provincia. Nel pool aggregato il top user (Ada, ASD
   * Grande) è rappresentato dalla mediana della sua ASD: 500 XP / 100 minuti.
   * Il "resto" è quindi la sola ASD Piccola: 10 XP / 2 minuti.
   */
  const DIST_TOP: AsdDistributionRow[] = [
    {
      name: "ASD Grande", count: 1, province: "TO", region: "Piemonte",
      medianXp: 500, medianMinutes: 100, topUser: "Ada", topUserXp: 900,
      restMedianXp: 0, restMedianMinutes: 0,
      firstSignup: "2026-01-01", lastActive: "2026-02-01", lowEngagement: false,
    },
    {
      name: "ASD Piccola", count: 1, province: "TO", region: "Piemonte",
      medianXp: 10, medianMinutes: 2, topUser: "Bea", topUserXp: 20,
      restMedianXp: 0, restMedianMinutes: 0,
      firstSignup: "2026-01-01", lastActive: "2026-02-01", lowEngagement: false,
    },
  ];

  it("REGRESSIONE: il resto esclude il top user su XP e minuti (non ripete le mediane di gruppo)", () => {
    const row = buildAsdRows(DIST_TOP, "province")[0];
    expect(row.topUser).toBe("Ada");
    // Mediane di gruppo: tutti e due gli utenti rappresentati.
    expect(row.medianXp).toBe(255); // round((10 + 500) / 2)
    expect(row.medianMinutes).toBe(51); // round((2 + 100) / 2)
    // Resto: solo l'ASD senza il top user.
    expect(row.restMedianXp).toBe(10);
    expect(row.restMedianMinutes).toBe(2);
    // Il bug: i minuti del resto erano identici a quelli di gruppo.
    expect(row.restMedianMinutes).not.toBe(row.medianMinutes);
  });

  it("REGRESSIONE: toglie UNA sola occorrenza, non tutti i duplicati del valore", () => {
    const dueUguali: AsdDistributionRow[] = [
      { ...DIST_TOP[0], name: "A", count: 3, medianXp: 500, medianMinutes: 100 },
    ];
    const row = buildAsdRows(dueUguali, "province")[0];
    // 3 utenti a 500 XP: tolto il top, restano due 500 (non zero).
    expect(row.restMedianXp).toBe(500);
    expect(row.restMedianMinutes).toBe(100);
  });

  it("gruppo con un solo utente: dopo l'esclusione del top non resta nessuno → 0", () => {
    const row = buildAsdRows([DIST_TOP[0]], "regione")[0];
    expect(row.count).toBe(1);
    expect(row.restMedianXp).toBe(0);
    expect(row.restMedianMinutes).toBe(0);
  });
});

describe("dropOne", () => {
  it("toglie solo la prima occorrenza", () => {
    expect(dropOne([1, 2, 2, 3], 2)).toEqual([1, 2, 3]);
  });

  it("lascia l'array invariato se il valore non c'è", () => {
    expect(dropOne([1, 2], 9)).toEqual([1, 2]);
    expect(dropOne([], 1)).toEqual([]);
  });

  it("non muta l'array in ingresso", () => {
    const arr = [1, 2, 3];
    dropOne(arr, 2);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe("asdMediansAreApproximate", () => {
  it("REGRESSIONE: dichiara stimate solo le mediane aggregate per provincia/regione", () => {
    // Per ASD le mediane sono calcolate sugli utenti veri; per
    // provincia/regione sono ricostruite dalle mediane per ASD.
    expect(asdMediansAreApproximate("asd")).toBe(false);
    expect(asdMediansAreApproximate("province")).toBe(true);
    expect(asdMediansAreApproximate("regione")).toBe(true);
  });
});

describe("filterAsdRows", () => {
  const rows = buildAsdRows(DIST, "asd");

  it("query vuota: nessun filtro", () => {
    expect(filterAsdRows(rows, "")).toHaveLength(3);
  });

  it("filtra per etichetta", () => {
    expect(filterAsdRows(rows, "milano").map((r) => r.label)).toEqual(["ASD Milano"]);
  });

  it("filtra anche per dettaglio (provincia/regione)", () => {
    expect(filterAsdRows(rows, "lazio").map((r) => r.label)).toEqual(["ASD Roma"]);
  });

  it("nessun risultato su query senza corrispondenze", () => {
    expect(filterAsdRows(rows, "zzz")).toEqual([]);
  });
});

// ── Tabella utenti ─────────────────────────────────────────────────────────

const USERS: UserRow[] = mapProfilesToUsers([
  profile({ id: "a", display_name: "Bianca", bbo_username: "bibi", xp: 50, hands_played: 3, asd_name: "ASD Zeta" }),
  profile({ id: "b", display_name: "anna", bbo_username: null, xp: 500, hands_played: 1, asd_name: null }),
  profile({ id: "c", display_name: null, bbo_username: "CARLO99", xp: 5, hands_played: 9, asd_name: "ASD Alfa" }),
]);

describe("filterUsers", () => {
  it("ricerca vuota: lista invariata", () => {
    expect(filterUsers(USERS, "")).toHaveLength(3);
    expect(filterUsers(USERS, "   ")).toHaveLength(3);
  });

  it("cerca su nome e username BBO senza distinzione di maiuscole", () => {
    expect(filterUsers(USERS, "ANN").map((u) => u.id)).toEqual(["b"]);
    expect(filterUsers(USERS, "carlo").map((u) => u.id)).toEqual(["c"]);
  });

  it("non esplode sui campi nulli", () => {
    expect(filterUsers(USERS, "xyz")).toEqual([]);
  });
});

describe("sortUsers / defaultSortDir", () => {
  it("ordina numericamente rispettando la direzione", () => {
    expect(sortUsers(USERS, "xp", "desc").map((u) => u.id)).toEqual(["b", "a", "c"]);
    expect(sortUsers(USERS, "xp", "asc").map((u) => u.id)).toEqual(["c", "a", "b"]);
  });

  it("ordina le stringhe con localeCompare e manda i null in fondo", () => {
    expect(sortUsers(USERS, "display_name", "asc").map((u) => u.id)).toEqual(["b", "a", "c"]);
    expect(sortUsers(USERS, "display_name", "desc").map((u) => u.id)).toEqual(["a", "b", "c"]);
  });

  it("colonna ASD: i valori nulli restano in fondo in entrambe le direzioni", () => {
    expect(sortUsers(USERS, "asd", "asc").map((u) => u.id)).toEqual(["c", "a", "b"]);
    expect(sortUsers(USERS, "asd", "desc").map((u) => u.id)).toEqual(["a", "c", "b"]);
  });

  it("non muta l'array originale", () => {
    const before = USERS.map((u) => u.id);
    sortUsers(USERS, "xp", "asc");
    expect(USERS.map((u) => u.id)).toEqual(before);
  });

  // ── A3: "Ultimo accesso" mescola date secche e timestamp ISO ─────────────

  const BY_LOGIN: UserRow[] = mapProfilesToUsers([
    // Ordine cronologico reale: primo (04:00Z) < secondo (08:00Z) < terzo.
    profile({ id: "terzo", last_login: "2026-03-12" }),
    profile({ id: "secondo", last_login: "2026-03-11T08:00:00Z" }),
    profile({ id: "mai", last_login: null }),
    profile({ id: "primo", last_login: "2026-03-11T09:00:00+05:00" }),
  ]);

  it("REGRESSIONE: ordina «Ultimo accesso» cronologicamente, non per stringa", () => {
    // Confrontate come stringhe, "…T08:00:00Z" viene prima di
    // "…T09:00:00+05:00" pur essendo QUATTRO ore dopo: il fuso e le date
    // secche rendono l'ordine lessicografico non cronologico.
    expect(sortUsers(BY_LOGIN, "last_login", "asc").map((u) => u.id)).toEqual([
      "primo", "secondo", "terzo", "mai",
    ]);
    expect(sortUsers(BY_LOGIN, "last_login", "desc").map((u) => u.id)).toEqual([
      "terzo", "secondo", "primo", "mai",
    ]);
  });

  it("REGRESSIONE: mai acceduti e date non parsabili restano in fondo in entrambe le direzioni", () => {
    const conRotti = mapProfilesToUsers([
      profile({ id: "rotto", last_login: "mai-acceduto" }),
      profile({ id: "buono", last_login: "2026-03-11T14:32:00Z" }),
    ]);
    expect(sortUsers(conRotti, "last_login", "asc").map((u) => u.id)).toEqual(["buono", "rotto"]);
    expect(sortUsers(conRotti, "last_login", "desc").map((u) => u.id)).toEqual(["buono", "rotto"]);
  });

  it("lista vuota", () => {
    expect(sortUsers([], "xp", "asc")).toEqual([]);
  });

  it("direzione iniziale: decrescente sulle metriche, crescente sul resto", () => {
    expect(defaultSortDir("xp")).toBe("desc");
    expect(defaultSortDir("hands_played")).toBe("desc");
    expect(defaultSortDir("streak")).toBe("desc");
    expect(defaultSortDir("total_minutes")).toBe("desc");
    expect(defaultSortDir("display_name")).toBe("asc");
    expect(defaultSortDir("created_at")).toBe("asc");
    expect(defaultSortDir("asd")).toBe("asc");
  });
});

describe("daysSince / last30Days", () => {
  const now = Date.parse("2026-08-09T12:00:00Z");

  it("giorni interi trascorsi dalla registrazione", () => {
    expect(daysSince("2026-08-09T10:00:00Z", now)).toBe(0);
    expect(daysSince("2026-08-06T12:00:00Z", now)).toBe(3);
  });

  it("30 giorni consecutivi, l'ultimo è oggi", () => {
    const days = last30Days(now);
    expect(days).toHaveLength(30);
    expect(days[29].toISOString()).toBe("2026-08-09T12:00:00.000Z");
    expect(days[0].toISOString()).toBe("2026-07-11T12:00:00.000Z");
  });
});

describe("rankBy", () => {
  it("posizione 1-based per XP e mani giocate", () => {
    expect(rankBy(USERS, "b", "xp")).toBe(1);
    expect(rankBy(USERS, "c", "xp")).toBe(3);
    expect(rankBy(USERS, "c", "hands_played")).toBe(1);
  });

  it("0 se l'utente non è in lista", () => {
    expect(rankBy(USERS, "inesistente", "xp")).toBe(0);
  });
});

// ── Formattazioni ──────────────────────────────────────────────────────────

describe("formatMinutes", () => {
  it("minuti sotto l'ora", () => {
    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(59)).toBe("59m");
  });

  it("ore e minuti da 60 in su", () => {
    expect(formatMinutes(60)).toBe("1h 0m");
    expect(formatMinutes(125)).toBe("2h 5m");
  });
});

describe("formatLastLogin", () => {
  const now = Date.parse("2026-08-09T12:00:00Z");

  it("'Mai' se non c'è mai stato un accesso", () => {
    expect(formatLastLogin(null, now)).toBe("Mai");
  });

  it("trattino se il valore non è parsabile", () => {
    expect(formatLastLogin("boh", now)).toBe("—");
  });

  it("data secca: mostra solo la data locale", () => {
    expect(formatLastLogin("2026-03-11", now)).toBe(new Date("2026-03-11").toLocaleDateString("it-IT"));
  });

  it("timestamp: tempo relativo con orario", () => {
    expect(formatLastLogin("2026-08-09T11:59:30Z", now)).toMatch(/^Ora \(\d{2}:\d{2}\)$/);
    expect(formatLastLogin("2026-08-09T11:30:00Z", now)).toMatch(/^30m fa \(\d{2}:\d{2}\)$/);
    expect(formatLastLogin("2026-08-09T09:00:00Z", now)).toMatch(/^3h fa \(\d{2}:\d{2}\)$/);
    expect(formatLastLogin("2026-08-06T12:00:00Z", now)).toMatch(/^3g fa \(\d{2}:\d{2}\)$/);
  });
});

describe("buildUsersCsv", () => {
  it("intestazione fissa e una riga per utente", () => {
    const csv = buildUsersCsv(mapProfilesToUsers(PROFILES));
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Nome,BBO,Tipo,XP,Streak,Mani,Tempo(min),ASD,Marketing,Registrato,Ultimo accesso");
    expect(lines).toHaveLength(4);
    expect(lines[1].startsWith("Ada,ada_bbo,adulto,100,3,7,42,ASD Roma,Sì,")).toBe(true);
  });

  it("normalizza i campi nulli e i tre stati del consenso", () => {
    const csv = buildUsersCsv(mapProfilesToUsers(PROFILES));
    const lines = csv.split("\n");
    expect(lines[2].startsWith(",,junior,10,0,0,0,,No,")).toBe(true);
    expect(lines[2].endsWith(",Mai")).toBe(true);
    expect(lines[3]).toContain(",—,");
  });

  it("solo intestazione se non ci sono utenti", () => {
    expect(buildUsersCsv([])).toBe("Nome,BBO,Tipo,XP,Streak,Mani,Tempo(min),ASD,Marketing,Registrato,Ultimo accesso\n");
  });
});

describe("isDidactaPeriod", () => {
  it("vero solo nei tre giorni della fiera", () => {
    expect(isDidactaPeriod(new Date("2026-03-13T10:00:00+01:00"))).toBe(true);
    expect(isDidactaPeriod(new Date("2026-03-12T00:00:00+01:00"))).toBe(true);
    expect(isDidactaPeriod(new Date("2026-03-11T23:59:00+01:00"))).toBe(false);
    expect(isDidactaPeriod(new Date("2026-03-15T00:00:00+01:00"))).toBe(false);
    expect(isDidactaPeriod(NOW)).toBe(false);
  });
});

// ── Dettaglio giorno / utente ──────────────────────────────────────────────

describe("resolveDayUsers", () => {
  const users = mapProfilesToUsers(PROFILES);

  it("risolve l'anagrafica e ordina dal login più recente", () => {
    const day = [
      { id: "u3", display_name: "Carlo", last_login: "2026-08-09T08:00:00Z" },
      { id: "u1", display_name: "Ada", last_login: "2026-08-09T10:00:00Z" },
    ];
    const rows = resolveDayUsers(day, users);
    expect(rows.map((r) => r.id)).toEqual(["u1", "u3"]);
    expect(rows[0].login_time).toBe("2026-08-09T10:00:00Z");
    expect(rows[0].xp).toBe(100);
  });

  it("scarta gli utenti non presenti nell'anagrafica", () => {
    const rows = resolveDayUsers(
      [{ id: "ghost", display_name: null, last_login: "2026-08-09T08:00:00Z" }],
      users,
    );
    expect(rows).toEqual([]);
  });

  it("giorno senza accessi", () => {
    expect(resolveDayUsers([], users)).toEqual([]);
  });
});

describe("buildUserActivity", () => {
  const [ada] = mapProfilesToUsers([PROFILES[0]]);

  it("raggruppa gli accessi per giorno locale, dal più recente", () => {
    const history: LoginRecord[] = [
      { id: "1", user_id: "u1", logged_in_at: "2026-08-09T09:00:00Z", platform: null },
      { id: "2", user_id: "u1", logged_in_at: "2026-08-09T07:00:00Z", platform: null },
      { id: "3", user_id: "u2", logged_in_at: "2026-08-09T07:00:00Z", platform: null },
    ];
    const { activeDaysLog, activeDaySet, createdDay } = buildUserActivity(ada, history);
    // accessi altrui esclusi; il giorno di registrazione coincide con l'unico giorno
    expect(activeDaysLog).toHaveLength(1);
    expect(activeDaysLog[0].logins).toEqual([
      "2026-08-09T07:00:00Z",
      "2026-08-09T09:00:00Z",
    ]);
    expect(activeDaySet.size).toBe(1);
    expect(activeDaySet.has(createdDay)).toBe(true);
  });

  it("senza login_history usa last_login e created_at come giorni attivi", () => {
    const vecchio = mapProfilesToUsers([
      profile({ id: "z", created_at: "2026-05-01T10:00:00Z", last_login: "2026-06-02T10:00:00Z" }),
    ])[0];
    const { activeDaysLog, activeDaySet } = buildUserActivity(vecchio, []);
    expect(activeDaysLog.map((d) => d.date)).toEqual(["2026-06-02", "2026-05-01"]);
    expect(activeDaySet.size).toBe(2);
  });

  it("last_login non parsabile: resta solo il giorno di registrazione", () => {
    const rotto = mapProfilesToUsers([
      profile({ id: "z", created_at: "2026-05-01T10:00:00Z", last_login: "boh" }),
    ])[0];
    const { activeDaysLog } = buildUserActivity(rotto, []);
    expect(activeDaysLog).toHaveLength(1);
    expect(activeDaysLog[0].date).toBe("2026-05-01");
  });
});
