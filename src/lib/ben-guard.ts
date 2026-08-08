import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Guardie condivise per le route /api/ben/* (proxy verso il server BEN).
 * Le route erano aperte e inoltravano input non validato all'upstream.
 */

/** True se la richiesta arriva da un utente autenticato. */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

// PBN/BEN: mani ("AQ3.KJ2.T987.Q54"), deal ("N:... ... ... ..."), seat/dealer
// ("N"|"E"|"S"|"W"), vul ("None"|"NS"|"EW"|"Both"), ctx (licita "1N-P-3N..."),
// played (lista carte "SA HK ..."). Charset ristretto + tetto di lunghezza.
const SAFE_PARAM = /^[A-Za-z0-9 .:\-_,|/*+]*$/;
const MAX_LEN = 600;

/**
 * Restituisce il valore se è una stringa non vuota, entro il tetto di
 * lunghezza e nel charset atteso; altrimenti null.
 */
export function sanitizeBenParam(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (value.length > MAX_LEN || !SAFE_PARAM.test(value)) return null;
  return value;
}
