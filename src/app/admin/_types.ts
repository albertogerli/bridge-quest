/**
 * Tipi e costanti della dashboard admin.
 *
 * Estratti da `src/app/admin/page.tsx` (refactoring a comportamento
 * invariato): la cartella `_types`/`_components` con underscore non produce
 * rotte in App Router, quindi resta colocata alla pagina che la usa.
 */

export const PROVINCE_TO_REGION: Record<string, string> = {
  TO:"Piemonte",VC:"Piemonte",NO:"Piemonte",CN:"Piemonte",AT:"Piemonte",AL:"Piemonte",BI:"Piemonte",VB:"Piemonte",
  AO:"Valle d'Aosta",
  VA:"Lombardia",CO:"Lombardia",SO:"Lombardia",MI:"Lombardia",BG:"Lombardia",BS:"Lombardia",PV:"Lombardia",CR:"Lombardia",MN:"Lombardia",LC:"Lombardia",LO:"Lombardia",MB:"Lombardia",
  BZ:"Trentino-Alto Adige",TN:"Trentino-Alto Adige",
  VR:"Veneto",VI:"Veneto",BL:"Veneto",TV:"Veneto",VE:"Veneto",PD:"Veneto",RO:"Veneto",
  UD:"Friuli Venezia Giulia",GO:"Friuli Venezia Giulia",TS:"Friuli Venezia Giulia",PN:"Friuli Venezia Giulia",
  IM:"Liguria",SV:"Liguria",GE:"Liguria",SP:"Liguria",
  PC:"Emilia-Romagna",PR:"Emilia-Romagna",RE:"Emilia-Romagna",MO:"Emilia-Romagna",BO:"Emilia-Romagna",FE:"Emilia-Romagna",RA:"Emilia-Romagna",FC:"Emilia-Romagna",RN:"Emilia-Romagna",
  MS:"Toscana",LU:"Toscana",PT:"Toscana",FI:"Toscana",LI:"Toscana",PI:"Toscana",AR:"Toscana",SI:"Toscana",GR:"Toscana",PO:"Toscana",
  PG:"Umbria",TR:"Umbria",
  PU:"Marche",AN:"Marche",MC:"Marche",AP:"Marche",FM:"Marche",
  VT:"Lazio",RI:"Lazio",RM:"Lazio",LT:"Lazio",FR:"Lazio",
  AQ:"Abruzzo",TE:"Abruzzo",PE:"Abruzzo",CH:"Abruzzo",
  CB:"Molise",IS:"Molise",
  CE:"Campania",BN:"Campania",NA:"Campania",AV:"Campania",SA:"Campania",
  FG:"Puglia",BA:"Puglia",TA:"Puglia",BR:"Puglia",LE:"Puglia",BT:"Puglia",
  PZ:"Basilicata",MT:"Basilicata",
  CS:"Calabria",CZ:"Calabria",KR:"Calabria",VV:"Calabria",RC:"Calabria",
  TP:"Sicilia",PA:"Sicilia",ME:"Sicilia",AG:"Sicilia",CL:"Sicilia",EN:"Sicilia",CT:"Sicilia",RG:"Sicilia",SR:"Sicilia",
  SS:"Sardegna",NU:"Sardegna",CA:"Sardegna",OR:"Sardegna",SU:"Sardegna",
};

export interface UserRow {
  id: string;
  display_name: string | null;
  bbo_username: string | null;
  profile_type: "junior" | "giovane" | "adulto" | "senior";
  xp: number;
  streak: number;
  hands_played: number;
  asd_code: string | null;
  asd_name: string | null;
  marketing_consent: boolean | null;
  total_minutes: number;
  created_at: string;
  last_login: string | null;
  platform: string | null;
  /**
   * Da `auth.users`, servita solo dalla RPC `admin_list_users`, che rifiuta
   * chi non è amministratore. Può essere null: il LEFT JOIN tiene in elenco
   * anche un profilo senza riga di autenticazione, invece di farlo sparire.
   */
  email: string | null;
}

export type ProfileRecord = UserRow & { role?: string | null };

export interface LoginRecord {
  /** Assente quando gli accessi arrivano da `admin_login_history()`, che non
   *  restituisce la chiave: al pannello serve chi e quando, non l'id di riga. */
  id?: string;
  user_id: string;
  logged_in_at: string;
  platform: string | null;
}

// ── Game stats (RPC admin_game_stats, see scripts/sql/admin_game_stats.sql) ──
export interface GameStatRow {
  game: string;
  plays: number;
  plays7d: number;
  players: number;
  avgScore: number | null;
  lastPlayed: string | null;
}
export interface GameStats {
  totals: { plays: number; playsToday: number; plays7d: number; players: number; players7d: number };
  byGame: GameStatRow[];
  daily: { date: string; plays: number; players: number }[];
}

export const GAME_LABELS: Record<string, string> = {
  "mano-del-giorno": "Mano del Giorno",
  "sfida": "Sfida amici",
  "smazzata": "Smazzate",
  "torneo": "Torneo",
  "quiz-lampo": "Quiz Lampo",
  "conta-veloce": "Conta Veloce",
  "impasse": "Impasse o Drop",
  "memory": "Memory Bridge",
  "trova-errore": "Trova l'Errore",
  "mano-guidata": "Mano Guidata",
  "dichiara": "Dichiara!",
  "pratica-licita": "Pratica Licita",
  "sfida-settimanale": "Sfida Settimanale",
  "segnali": "Segnali in Difesa",
  "compito": "Compiti classe",
};

export type PlatformKey = "ios" | "android" | "pwa" | "web" | "unknown";
export type PlatformBreakdown = Record<PlatformKey, number>;

export const PLATFORM_KEYS = ["ios", "android", "pwa", "web", "unknown"] as const;

export interface DailyActivity {
  date: string;
  activeUsers: { id: string; display_name: string | null; last_login: string }[];
}

export interface AsdDistributionRow {
  name: string; count: number; province?: string; region?: string;
  medianXp: number; medianMinutes: number;
  topUser: string; topUserXp: number;
  restMedianXp: number; restMedianMinutes: number;
  firstSignup: string;
  lastActive: string;
  lowEngagement: boolean;
}

export interface Stats {
  total: number;
  today: number;
  week: number;
  month: number;
  activeToday: number;
  activeWeek: number;
  byType: Record<string, number>;
  totalXp: number;
  totalHands: number;
  avgXp: number;
  avgHands: number;
  retention7d: number;
  hourlySignups: number[];
  dailySignups: { date: string; count: number }[];
  dailyActive: DailyActivity[];
  topUsers: UserRow[];
  asdDistribution: AsdDistributionRow[];
  maxStreak: number;
  marketingAccepted: number;
  marketingDeclined: number;
  marketingPending: number;
  totalMinutesAll: number;
  avgMinutes: number;
  bboWithAsd: number;
  bboWithoutAsd: number;
  asdWithoutBbo: number;
  noBboNoAsd: number;
  platformSignups: PlatformBreakdown;
  platformLogins30d: PlatformBreakdown;
  instructors: number;
  classes: number;
  students: number;
}

export type SortKey = "display_name" | "profile_type" | "xp" | "streak" | "hands_played" | "asd" | "total_minutes" | "created_at" | "last_login";
export type SortDir = "asc" | "desc";

export type AsdTab = "asd" | "province" | "regione";

export interface AsdRow {
  label: string; count: number; detail?: string;
  medianXp: number; medianMinutes: number;
  topUser: string; topUserXp: number;
  restMedianXp: number; restMedianMinutes: number;
  lowEngagement: boolean; firstSignup?: string; lastActive?: string;
}

/** Utente attivo in un giorno, arricchito con l'orario dell'accesso. */
export type DayUserRow = UserRow & { login_time: string };

export const PROFILE_EMOJI: Record<string, string> = {
  junior: "🧒",
  giovane: "🎮",
  adulto: "🃏",
  senior: "🏆",
};

export const PLATFORM_LABEL: Record<PlatformKey, string> = {
  ios: "iOS",
  android: "Android",
  pwa: "PWA",
  web: "Web",
  unknown: "Non tracciato",
};

export const PLATFORM_COLOR: Record<PlatformKey, string> = {
  ios: "#0f172a",
  android: "#34a853",
  pwa: "#c8a44e",
  web: "#003DA5",
  unknown: "#9ca3af",
};
