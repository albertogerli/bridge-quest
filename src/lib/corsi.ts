import { z } from "zod";

/**
 * I corsi di bridge (/corsi): tipi, validazione e ordinamento.
 *
 * Puro: lo usano il modulo (browser), l'API che salva (server) e la pagina
 * pubblica. La validazione è una sola, così il server non accetta niente che
 * il modulo non lascerebbe scrivere, e viceversa.
 */

export type TipoCorso = "bridge-5" | "tradizionale";
export type LivelloCorso = "principianti" | "secondo-anno" | "perfezionamento" | "lezione-di-prova";
export type StatoCorso = "in-attesa" | "pubblicato" | "da-modificare" | "rifiutato" | "sostituito" | "ritirato";

export const TIPI: TipoCorso[] = ["bridge-5", "tradizionale"];
export const LIVELLI: LivelloCorso[] = ["principianti", "secondo-anno", "perfezionamento", "lezione-di-prova"];
export const GIORNI = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"] as const;
export type Giorno = (typeof GIORNI)[number];

/** Etichette in italiano: chi le mostra le passa da `t()`. */
export const ETICHETTA_TIPO: Record<TipoCorso, string> = {
  "bridge-5": "Bridge 5.0",
  tradizionale: "Tradizionale",
};
export const ETICHETTA_LIVELLO: Record<LivelloCorso, string> = {
  principianti: "Principianti",
  "secondo-anno": "Secondo anno",
  perfezionamento: "Perfezionamento",
  "lezione-di-prova": "Lezione di prova",
};
export const ETICHETTA_GIORNO: Record<Giorno, string> = {
  lunedì: "Lunedì",
  martedì: "Martedì",
  mercoledì: "Mercoledì",
  giovedì: "Giovedì",
  venerdì: "Venerdì",
  sabato: "Sabato",
  domenica: "Domenica",
};

/** Un corso come lo vede la pagina pubblica (vedi `corsi-server.ts`). */
export interface CorsoPubblico {
  id: string;
  tipo: TipoCorso;
  livello: LivelloCorso;
  maestro: string;
  primaLezione: string;
  orari: { giorno: Giorno; dalle: string; alle: string }[];
  telefono: string;
  email: string | null;
  whatsapp: boolean;
  programma: string | null;
  costo: string | null;
  note: string | null;
  locandinaUrl: string | null;
  locandinaPdf: boolean;
  programmaUrl: string | null;
  circolo: { code: string; name: string; address: string; city: string; province: string; cap: string; lat: number; lng: number };
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const TIPI_FILE = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

/** Un corso resta in pagina fino a un mese dopo la prima lezione. */
export const GIORNI_VISIBILE_DOPO_INIZIO = 30;

const ora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Orario non valido");

export const schemaOrario = z
  .object({ giorno: z.enum(GIORNI), dalle: ora, alle: ora })
  .refine((o) => o.alle > o.dalle, { message: "L'orario di fine viene prima dell'inizio", path: ["alle"] });

const testoFacoltativo = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/** Un percorso nel bucket deve stare nella cartella di chi carica. */
const percorsoFile = z.string().regex(/^[0-9a-f-]{36}\/[\w.-]{1,120}$/).optional().nullable().transform((v) => v ?? null);

export const schemaCorso = z.object({
  tipo: z.enum(["bridge-5", "tradizionale"]),
  asdCode: z.string().trim().min(1, "Scegli il circolo").max(32),
  livello: z.enum(["principianti", "secondo-anno", "perfezionamento", "lezione-di-prova"]),
  maestro: z.string().trim().min(2, "Scrivi il nome del maestro").max(120),
  primaLezione: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Scegli la data della prima lezione"),
  orari: z.array(schemaOrario).min(1, "Aggiungi almeno un giorno").max(10),
  telefono: z
    .string()
    .trim()
    .min(6, "Scrivi un telefono")
    .max(40)
    .regex(/^[+\d][\d\s./-]{5,}$/, "Il telefono può contenere solo numeri, spazi e +"),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Email non valida"),
  whatsapp: z.boolean().default(false),
  locandinaPath: percorsoFile,
  programma: testoFacoltativo(6000),
  programmaPath: percorsoFile,
  costo: testoFacoltativo(300),
  note: testoFacoltativo(1500),
  consenso: z.literal(true, { message: "Serve la conferma per pubblicare telefono e nome" }),
  sostituisce: z.string().uuid().optional().nullable().transform((v) => v ?? null),
});

export type DatiCorso = z.output<typeof schemaCorso>;
export type BozzaCorso = z.input<typeof schemaCorso>;

/** La data è nel futuro o oggi (in ora italiana basta il giorno). */
export function dataNonPassata(iso: string, oggi: Date = new Date()): boolean {
  return iso >= oggi.toISOString().slice(0, 10);
}

/** Il giorno più vecchio di prima lezione che resta ancora in pagina. */
export function inizioVisibile(oggi: Date = new Date()): string {
  const d = new Date(oggi);
  d.setUTCDate(d.getUTCDate() - GIORNI_VISIBILE_DOPO_INIZIO);
  return d.toISOString().slice(0, 10);
}

export function distanzaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Coordinate valide: l'elenco FIGB ha circoli non ancora geolocalizzati (0, 0). */
export function haCoordinate(p: { lat: number; lng: number }): boolean {
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);
}

/**
 * I più vicini per primi; a parità (o senza posizione) quelli che iniziano
 * prima. I corsi di circoli senza coordinate vanno in fondo, non spariscono.
 */
export function ordinaCorsi<C extends { primaLezione: string; lat: number; lng: number }>(
  corsi: C[],
  da: { lat: number; lng: number } | null,
): (C & { km: number | null })[] {
  const conKm = corsi.map((c) => ({
    ...c,
    km: da && haCoordinate(c) ? distanzaKm(da, c) : null,
  }));
  return conKm.sort((a, b) => {
    if (da) {
      if (a.km === null && b.km !== null) return 1;
      if (b.km === null && a.km !== null) return -1;
      if (a.km !== null && b.km !== null && Math.round(a.km) !== Math.round(b.km)) return a.km - b.km;
    }
    return a.primaLezione.localeCompare(b.primaLezione);
  });
}

/** Normalizza per cercare una città: minuscole, senza accenti né spazi doppi. */
export function normalizzaCitta(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * La posizione di una città scritta a mano, presa dai circoli FIGB che ci
 * stanno (media delle coordinate). Un CAP di cinque cifre cerca il CAP.
 * Niente servizi esterni: l'elenco dei circoli copre le città dove si gioca.
 */
export function posizioneDaCitta(
  testo: string,
  circoli: { city: string; cap: string; province: string; lat: number; lng: number }[],
): { lat: number; lng: number } | null {
  const q = normalizzaCitta(testo);
  if (q.length < 2) return null;
  const perCap = /^\d{5}$/.test(q);
  let trovati = circoli.filter((c) => haCoordinate(c) && (perCap ? c.cap === q : normalizzaCitta(c.city) === q));
  if (!trovati.length && !perCap) {
    trovati = circoli.filter((c) => haCoordinate(c) && normalizzaCitta(c.city).startsWith(q));
  }
  if (!trovati.length && perCap) {
    // Stesso inizio di CAP: stessa provincia, all'incirca.
    trovati = circoli.filter((c) => haCoordinate(c) && c.cap.slice(0, 3) === q.slice(0, 3));
  }
  if (!trovati.length) return null;
  const lat = trovati.reduce((s, c) => s + c.lat, 0) / trovati.length;
  const lng = trovati.reduce((s, c) => s + c.lng, 0) / trovati.length;
  return { lat, lng };
}

/** «Lunedì e giovedì 18:00–20:00» o «Lunedì 18–20, sabato 10–12». */
export function orariLeggibili(orari: { giorno: Giorno; dalle: string; alle: string }[], t: (s: string) => string = (s) => s): string {
  const gruppi = new Map<string, Giorno[]>();
  for (const o of orari) {
    const k = `${o.dalle}–${o.alle}`;
    gruppi.set(k, [...(gruppi.get(k) ?? []), o.giorno]);
  }
  return [...gruppi.entries()]
    .map(([fascia, giorni]) => {
      const nomi = giorni.map((g, i) => (i ? t(ETICHETTA_GIORNO[g]).toLowerCase() : t(ETICHETTA_GIORNO[g])));
      const elenco = nomi.length > 1 ? `${nomi.slice(0, -1).join(", ")} ${t("e")} ${nomi[nomi.length - 1]}` : nomi[0];
      return `${elenco} ${fascia}`;
    })
    .join(" · ");
}

/** Il nome del file nel bucket: cartella dell'utente, niente caratteri strani. */
export function nomeFileCorso(userId: string, tipo: "locandina" | "programma", file: { name: string; type: string }): string {
  const est = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  return `${userId}/${tipo}-${Date.now()}.${est}`;
}

/** Link per WhatsApp: solo cifre, prefisso italiano se manca. */
export function linkWhatsapp(telefono: string): string {
  let n = telefono.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else n = `39${n}`;
  return `https://wa.me/${n}`;
}

export function linkTelefono(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, "")}`;
}
