"use client";

import { useEffect, useState } from "react";
import type { Card, Position } from "@/lib/bridge-engine";
import { getAllSmazzate, getLessonTitle, type Smazzata } from "@/lib/catalog";
import { getSavedHands, raggruppaArchivio, type SavedHand } from "@/lib/saved-hands";
import { segnalaSalvoRete } from "@/lib/report-error";
import { CONTRATTI } from "@/lib/live-table";

/** Il contratto nella notazione del tavolo (`SA`, senza contri), o `null` se non si riconosce. */
function perIlTavolo(contratto: string | null | undefined): string | null {
  if (!contratto) return null;
  const c = contratto.trim().replace(/NT$/i, "SA").replace(/X+$/i, "");
  return CONTRATTI.includes(c) ? c : null;
}
import { useT } from "@/contexts/traduzioni-provider";

export interface SetDiMani {
  etichetta: string;
  mani: { hands: Record<Position, Card[]>; titolo: string; contract: string | null; declarer: Position | null }[];
}

/**
 * Carica al tavolo un set già pronto: le smazzate di una lezione del corso o
 * una cartella dell'archivio. Le liste si leggono quando si apre il menu, non
 * all'apertura della pagina: chi non lo usa non paga niente.
 */
export function CaricaSet({ attuale, onCarica }: { attuale: string | null; onCarica: (set: SetDiMani) => void }) {
  const t = useT();
  const [aperto, setAperto] = useState(false);
  const [lezioni, setLezioni] = useState<{ id: number; titolo: string; mani: Smazzata[] }[] | null>(null);
  const [cartelle, setCartelle] = useState<{ nome: string; mani: SavedHand[] }[] | null>(null);

  useEffect(() => {
    if (!aperto || lezioni) return;
    let attivo = true;
    (async () => {
      try {
        const tutte = await getAllSmazzate();
        const perLezione = new Map<number, Smazzata[]>();
        for (const s of tutte) perLezione.set(s.lesson, [...(perLezione.get(s.lesson) ?? []), s]);
        const elenco = await Promise.all(
          [...perLezione.entries()]
            .sort(([a], [b]) => a - b)
            .map(async ([id, mani]) => ({ id, titolo: await getLessonTitle(id), mani: mani.sort((a, b) => a.board - b.board) })),
        );
        if (attivo) setLezioni(elenco);
      } catch (err) {
        segnalaSalvoRete("carica-set:lezioni", err);
        if (attivo) setLezioni([]);
      }
      try {
        const archivio = await getSavedHands();
        const gruppi = raggruppaArchivio(archivio).filter((g) => g.tipo === "cartella" && g.nome);
        if (attivo) setCartelle(gruppi.map((g) => ({ nome: g.nome!, mani: g.mani })));
      } catch (err) {
        segnalaSalvoRete("carica-set:archivio", err);
        if (attivo) setCartelle([]);
      }
    })();
    return () => {
      attivo = false;
    };
  }, [aperto, lezioni]);

  function scegli(valore: string) {
    if (valore.startsWith("l:")) {
      const l = lezioni?.find((x) => String(x.id) === valore.slice(2));
      if (!l) return;
      onCarica({
        etichetta: l.titolo,
        mani: l.mani.map((s) => ({
          hands: s.hands as Record<Position, Card[]>,
          titolo: `${l.titolo} — ${t("mano {n}", { n: s.board })}`,
          contract: perIlTavolo(s.contract),
          declarer: perIlTavolo(s.contract) ? s.declarer : null,
        })),
      });
    } else if (valore.startsWith("c:")) {
      const c = cartelle?.find((x) => x.nome === valore.slice(2));
      if (!c) return;
      onCarica({
        etichetta: c.nome,
        mani: c.mani.map((m) => ({ hands: m.hands, titolo: m.titolo, contract: perIlTavolo(m.contract), declarer: perIlTavolo(m.contract) ? m.declarer : null })),
      });
    }
  }

  return (
    <div>
      <label htmlFor="carica-set" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("Oppure carica un set")}
      </label>
      <select
        id="carica-set"
        value=""
        onFocus={() => setAperto(true)}
        onPointerDown={() => setAperto(true)}
        onChange={(e) => scegli(e.target.value)}
        className="h-11 max-w-xs rounded-xl border border-border bg-card px-3 text-sm"
      >
        <option value="">{attuale ? t("In uso: {nome}", { nome: attuale }) : t("Lezione o cartella…")}</option>
        {!lezioni && aperto && <option disabled>{t("Carico…")}</option>}
        {lezioni && lezioni.length > 0 && (
          <optgroup label={t("Smazzate delle lezioni")}>
            {lezioni.map((l) => (
              <option key={l.id} value={`l:${l.id}`}>
                {l.titolo} ({l.mani.length})
              </option>
            ))}
          </optgroup>
        )}
        {cartelle && cartelle.length > 0 && (
          <optgroup label={t("Le tue cartelle")}>
            {cartelle.map((c) => (
              <option key={c.nome} value={`c:${c.nome}`}>
                {c.nome} ({c.mani.length})
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
