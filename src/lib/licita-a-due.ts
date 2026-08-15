/**
 * Licita con un amico, avversari BEN.
 *
 * Asincrona: ognuno dichiara quando può. Chiedere a due persone di trovarsi
 * online insieme è già metà della rinuncia.
 *
 * NESSUN FILTRO QUI DENTRO. Durante la licita il database restituisce solo la
 * mano di chi chiede — nemmeno quella del compagno, perché vederla
 * annullerebbe l'esercizio. Sulla tabella non esiste alcuna policy di lettura:
 * tutto passa dalle funzioni, che filtrano prima di rispondere.
 */

import { createClient } from "@/lib/supabase/client";
import type { Card, Position } from "./bridge-engine";
import { reportError } from "./report-error";

export interface SessioneLicita {
  id: string;
  seat: Position;
  /** Solo la propria mano; tutte e quattro a licita chiusa. */
  hands: Partial<Record<Position, Card[]>>;
  bids: string[];
  dealer: Position;
  turno: Position;
  chiusa: boolean;
  createdAt: string;
}

export interface RigaElenco {
  id: string;
  seat: Position;
  bids: string[];
  dealer: Position;
  chiusa: boolean;
  compagno: string | null;
  createdAt: string;
}

/** L'ordine in cui si dichiara, a partire dal mazziere. */
const ORDINE: Position[] = ["north", "east", "south", "west"];

/** Di chi è il turno, viste le dichiarazioni fatte finora. */
export function turnoDi(dealer: Position, bids: readonly string[]): Position {
  const i = ORDINE.indexOf(dealer);
  return ORDINE[(i + bids.length) % 4];
}

/** Vero se la licita è finita: tre passi dopo un contratto, o quattro passi. */
export function licitaFinita(bids: readonly string[]): boolean {
  const ultimoContratto = bids.map((b) => b !== "P").lastIndexOf(true);
  if (ultimoContratto < 0) return bids.length >= 4;
  return bids.length - ultimoContratto - 1 >= 3;
}

/** Il contratto raggiunto, o `null` se sono passati tutti. */
/**
 * Il contratto finale, contro compreso.
 *
 * IL CONTRO NON È UN CONTRATTO. Questa funzione prendeva l'ultima
 * dichiarazione diversa da «passo», che dopo un contro è il contro stesso: la
 * schermata mostrava «Contratto: X» invece di «1♠ contrato». È la terza copia
 * dello stesso conto trovata nel progetto — le altre due, la pagina di
 * allenamento e la funzione del database, sono già state corrette a distanza
 * di mesi l'una dall'altra. Qui si delega a `licita-mano.ts`, dove il conto
 * vive una volta sola.
 */
export function contrattoFinale(bids: readonly string[]): string | null {
  const i = bids.map((b) => /^[1-7]/.test(b)).lastIndexOf(true);
  if (i < 0) return null;
  const doppio = bids.slice(i).includes("XX") ? "XX" : bids.slice(i).includes("X") ? "X" : "";
  return bids[i] + doppio;
}

export async function apriLicita(input: {
  partnerId: string;
  hands: Record<Position, Card[]>;
  dealer?: Position;
}): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("bidding_session_create", {
      p_partner: input.partnerId,
      p_hands: input.hands,
      p_dealer: input.dealer ?? "south",
    });
    if (error) {
      reportError("licita-due:apri", error);
      return null;
    }
    return (data as string | null) ?? null;
  } catch (err) {
    reportError("licita-due:apri", err);
    return null;
  }
}

export async function leggiLicita(id: string): Promise<SessioneLicita | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("bidding_session_view", { p_id: id });
    if (error || !data) return null;
    return data as SessioneLicita;
  } catch (err) {
    reportError("licita-due:leggi", err);
    return null;
  }
}

export async function dichiara(id: string, bid: string): Promise<{ ok: boolean; errore?: string }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("bidding_session_bid", { p_id: id, p_bid: bid });
    if (error) {
      reportError("licita-due:dichiara", error);
      return { ok: false, errore: "Non è stato possibile dichiarare." };
    }
    const r = data as { ok: boolean; errore?: string };
    return r?.ok ? { ok: true } : { ok: false, errore: r?.errore };
  } catch (err) {
    reportError("licita-due:dichiara", err);
    return { ok: false, errore: "Non è stato possibile dichiarare." };
  }
}

export async function mieLicite(): Promise<RigaElenco[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("my_bidding_sessions");
    if (error || !data) return [];
    return data as RigaElenco[];
  } catch (err) {
    reportError("licita-due:elenco", err);
    return [];
  }
}
