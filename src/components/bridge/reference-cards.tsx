"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DECISION_TABLE } from "@/lib/minibridge";
import { SCORE_TABLE_MADE, DEFEATED_NON_VUL } from "@/lib/scoring";

/**
 * The two WBF reference cards (Decision Table + Score Table) that beginners
 * consult during MiniBridge. Rendered as a button that opens a dialog.
 */
export function ReferenceCardsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        📋 Tabelle
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Tabelle di riferimento</DialogTitle>
            <DialogDescription>
              Gli strumenti del MiniBridge: quante prese puntare e quanto vale il contratto.
            </DialogDescription>
          </DialogHeader>
          <ReferenceCardsContent />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReferenceCardsContent() {
  return (
    <div className="space-y-6">
      {/* Decision table */}
      <section>
        <h3 className="mb-1 font-display text-lg font-semibold">Decision Table</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Somma i punti onori della coppia (A=4, K=3, Q=2, J=1) → prese che puoi puntare.
        </p>
        <table className="w-full overflow-hidden rounded-lg border border-border text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-3 py-2 font-semibold">Punti della coppia</th>
              <th className="px-3 py-2 text-right font-semibold">Prese possibili</th>
            </tr>
          </thead>
          <tbody>
            {DECISION_TABLE.map((r) => (
              <tr key={r.points} className="border-t border-border">
                <td className="px-3 py-1.5">{r.points}</td>
                <td className="px-3 py-1.5 text-right font-mono font-semibold">{r.tricks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Score table */}
      <section>
        <h3 className="mb-1 font-display text-lg font-semibold">Score Table</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Punti per contratto mantenuto esatto (non in zona). In verde i contratti di manche/slam.
        </p>
        <table className="w-full overflow-hidden rounded-lg border border-border text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left font-semibold">Livello</th>
              <th className="px-3 py-2 text-right font-semibold">♣ / ♦</th>
              <th className="px-3 py-2 text-right font-semibold">♥ / ♠</th>
              <th className="px-3 py-2 text-right font-semibold">SA</th>
            </tr>
          </thead>
          <tbody>
            {SCORE_TABLE_MADE.map((r) => (
              <tr key={r.level} className="border-t border-border">
                <td className="px-3 py-1.5 font-semibold">{r.level}</td>
                <ScoreCell v={r.minor} />
                <ScoreCell v={r.major} />
                <ScoreCell v={r.nt} />
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted-foreground">
          Contratto caduto (non in zona): l&apos;avversario segna {DEFEATED_NON_VUL.slice(0, 4).join(", ")}… punti
          per ogni presa in meno.
        </p>
      </section>
    </div>
  );
}

function ScoreCell({ v }: { v: number }) {
  const isGameOrBetter = v >= 400;
  return (
    <td
      className={`px-3 py-1.5 text-right font-mono ${
        isGameOrBetter ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""
      }`}
    >
      {v}
    </td>
  );
}
