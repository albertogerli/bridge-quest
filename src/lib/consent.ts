/**
 * Consenso ai cookie di marketing.
 *
 * PERCHÉ ESISTE
 * Fino al 2026-08 il banner diceva «cookie tecnici necessari al funzionamento»
 * con un solo bottone "Accetta", e l'informativa dichiarava «Non utilizziamo
 * cookie di profilazione o pubblicitari». Nel frattempo erano attivi il tag
 * Google Ads (AW-482620196) e GA4: la dichiarazione era già inesatta. Con
 * l'aggiunta del Meta Pixel — un tracciatore di terza parte usato per
 * retargeting e pubblici simili — diventava insostenibile.
 *
 * Qui il consenso di marketing diventa una scelta esplicita e separata.
 *
 * PERCHÉ UNA CHIAVE NUOVA
 * Il vecchio `bq_cookie_consent` è deliberatamente ignorato. Contiene il clic
 * su un banner che parlava di soli cookie tecnici: trattarlo come consenso
 * pubblicitario significherebbe attribuire alle persone una scelta che non
 * hanno mai fatto. Chi aveva già accettato viene semplicemente richiesto una
 * volta sola.
 *
 * Le funzioni di questo file sono pure e testate; l'I/O sta in
 * `consent-client.ts`, che è l'unico a toccare localStorage e window.
 */

export const CONSENT_KEY = "bq_consent_v2";

/** Evento su `window` emesso quando il consenso cambia nella stessa scheda. */
export const CONSENT_EVENT = "bq-consent-change";

export interface Consent {
  /** Cookie pubblicitari e di profilazione (Google Ads, Meta Pixel). */
  marketing: boolean;
  /** Momento della scelta, ISO 8601. Serve a dimostrare quando è stata data. */
  ts: string;
}

/**
 * Legge il valore salvato. Restituisce `null` quando la scelta non è ancora
 * stata fatta — che è diverso da "ha rifiutato" e va trattato diversamente:
 * nel primo caso si chiede, nel secondo no.
 */
export function parseConsent(raw: string | null | undefined): Consent | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { marketing, ts } = parsed as Record<string, unknown>;
    // Un booleano mancante o di tipo sbagliato non vale come consenso: in
    // dubbio si nega e si richiede.
    if (typeof marketing !== "boolean") return null;
    return { marketing, ts: typeof ts === "string" ? ts : "" };
  } catch {
    return null;
  }
}

export function serializeConsent(consent: Consent): string {
  return JSON.stringify({ marketing: consent.marketing, ts: consent.ts });
}

/**
 * Vero solo se l'utente ha detto sì in modo esplicito. Assenza di scelta,
 * valore corrotto e rifiuto danno tutti `false`: il default è non tracciare.
 */
export function hasMarketingConsent(raw: string | null | undefined): boolean {
  return parseConsent(raw)?.marketing === true;
}

/** Vero se va mostrato il banner (nessuna scelta valida registrata). */
export function shouldAskConsent(raw: string | null | undefined): boolean {
  return parseConsent(raw) === null;
}

/**
 * Segnali di Google Consent Mode v2 corrispondenti alla scelta.
 *
 * `analytics_storage` segue il marketing: GA4 alimenta i pubblici di Google
 * Ads, quindi tenerlo attivo dopo un rifiuto vanificherebbe il rifiuto stesso.
 */
export function consentModeSignals(marketing: boolean): Record<string, "granted" | "denied"> {
  const value = marketing ? "granted" : "denied";
  return {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  };
}
