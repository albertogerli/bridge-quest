import { createHash } from "node:crypto";

/**
 * Costruzione del payload per la Conversions API di Meta (lato server).
 *
 * PERCHÉ IL DOPPIO INVIO
 * Lo stesso evento parte due volte: dal browser (Meta Pixel) e dal nostro
 * server. Serve perché i blocchi dei browser e le restrizioni di iOS fanno
 * sparire una quota consistente degli eventi lato client. Meta unisce le due
 * copie usando `event_id`: se manca, la conversione viene contata DUE volte e
 * ogni numero di campagna diventa falso. Per questo `event_id` è obbligatorio
 * in `buildCapiEvent` e viene generato una sola volta dal browser, che poi lo
 * passa al server.
 *
 * DATI PERSONALI — scelta conservativa
 * L'email NON viene inviata per impostazione predefinita, nemmeno cifrata.
 * Il valore aggiunto è una migliore corrispondenza degli utenti; il costo è un
 * trasferimento di dati personali verso gli Stati Uniti, su una piattaforma di
 * una federazione sportiva con un accordo art. 28 già in essere. Restano
 * l'indirizzo IP, lo user agent e i cookie `_fbp`/`_fbc`, che il browser manda
 * comunque a Meta quando il Pixel è attivo: il server non aggiunge nulla di
 * nuovo. Per abilitare l'email serve una decisione esplicita:
 * META_CAPI_HASH_EMAIL=true, e va aggiornata l'informativa.
 */

/** Eventi ammessi. Elenco chiuso: un nome libero finirebbe nei dati di Meta. */
export const CAPI_EVENTS = ["CompleteRegistration", "Lead", "ViewContent"] as const;
export type CapiEvent = (typeof CAPI_EVENTS)[number];

export function isCapiEvent(value: unknown): value is CapiEvent {
  return typeof value === "string" && (CAPI_EVENTS as readonly string[]).includes(value);
}

/**
 * SHA-256 esadecimale minuscolo, come richiesto da Meta.
 * La normalizzazione (spazi, maiuscole) è parte della specifica: senza, lo
 * stesso indirizzo scritto in due modi produce due hash diversi e non combacia
 * con nulla.
 */
export function hashPii(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface CapiInput {
  event: CapiEvent;
  /** Generato dal browser e condiviso con il Pixel: senza, doppio conteggio. */
  eventId: string;
  /** Secondi Unix. Meta scarta gli eventi più vecchi di 7 giorni. */
  eventTime: number;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  /** Cookie `_fbp` / `_fbc` letti dalla richiesta. */
  fbp?: string;
  fbc?: string;
  /** Inviata solo se il chiamante l'ha già decisa: qui non si legge l'env. */
  email?: string;
}

/** Evento singolo nel formato atteso da `/{pixel-id}/events`. */
export function buildCapiEvent(input: CapiInput): Record<string, unknown> {
  const userData: Record<string, unknown> = {};
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  // Meta vuole gli identificatori personali come array di hash.
  if (input.email) userData.em = [hashPii(input.email)];

  const event: Record<string, unknown> = {
    event_name: input.event,
    event_time: input.eventTime,
    event_id: input.eventId,
    action_source: "website",
    user_data: userData,
  };
  if (input.sourceUrl) event.event_source_url = input.sourceUrl;
  return event;
}

/**
 * Estrae `_fbp` e `_fbc` dall'header Cookie.
 *
 * `_fbc` porta il click id della campagna ed è l'unico segnale che collega
 * davvero una conversione all'annuncio che l'ha generata: senza, l'attribuzione
 * resta probabilistica.
 */
export function readFbCookies(cookieHeader: string | null): { fbp?: string; fbc?: string } {
  if (!cookieHeader) return {};
  const out: { fbp?: string; fbc?: string } = {};
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!value) continue;
    if (name === "_fbp") out.fbp = value;
    else if (name === "_fbc") out.fbc = value;
  }
  return out;
}

/**
 * Primo IP della catena `x-forwarded-for`.
 *
 * Dietro un proxy l'header contiene "client, proxy1, proxy2": prendere l'ultimo
 * darebbe l'IP di Vercel per ogni utente, cioè un unico identificatore per
 * tutti. Si prende il primo.
 */
export function clientIpFrom(forwardedFor: string | null): string | undefined {
  if (!forwardedFor) return undefined;
  const first = forwardedFor.split(",")[0]?.trim();
  return first || undefined;
}
