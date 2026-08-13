import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Guardie condivise per le route /api/ben/* (proxy verso il server BEN):
 * autenticazione, validazione input (zod) e rate limiting.
 */

/** Id dell'utente autenticato, o null. */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// PBN/BEN: mani ("AQ3.KJ2.T987.Q54"), deal ("N:... ... ... ..."), seat/dealer
// ("N"|"E"|"S"|"W"), vul, ctx (licita "1N-P-3N-..."), played (lista carte).
const SAFE_PARAM = /^[A-Za-z0-9 .:\-_,|/*+]*$/;

/** Campo obbligatorio non vuoto. */
export const benParam = z.string().min(1).max(600).regex(SAFE_PARAM);
/** Campo facoltativo (stringa vuota ammessa e poi scartata dalle route). */
export const benParamOpt = z.string().max(600).regex(SAFE_PARAM).optional();

/**
 * Rate limiter in-memory a finestra fissa, per chiave (user id).
 * Limite per-istanza serverless: non è una difesa assoluta, ma taglia
 * l'abuso da sessione singola. Per un limite globale usare il WAF Vercel.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) buckets.clear(); // bound di memoria
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/**
 * Indirizzo del server BEN e intestazioni con cui parlargli.
 *
 * BEN non ha autenticazione propria: è nato per stare su localhost. Ospitato
 * (Railway) diventa un indirizzo pubblico, e senza un segreto condiviso
 * chiunque lo trovasse potrebbe far girare inferenze TensorFlow sulla macchina
 * che paghiamo noi. Davanti a BEN sta una guardia che pretende questa
 * intestazione: vedi `deploy/ben-railway/guard.py`.
 *
 * In locale il segreto non serve e non si mette: `start-ben.sh` avvia BEN nudo
 * su 127.0.0.1, dove non è raggiungibile da fuori.
 */
export function benEndpoint(): { url: string; headers: HeadersInit } {
  const token = process.env.BEN_API_TOKEN;
  return {
    url: process.env.BEN_API_URL || "http://localhost:8085",
    headers: token ? { "X-BEN-Token": token } : {},
  };
}
