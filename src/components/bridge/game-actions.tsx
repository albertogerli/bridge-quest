"use client";

/**
 * In-game action bar: claim ("Reclama le prese") and didactic undo
 * ("Ritira la carta"). Rendered by game pages during the playing phase;
 * each button only appears when the corresponding hook flag allows it.
 */

import { Button } from "@/components/ui/button";
import { Flag, Undo2, Loader2, CircleAlert, CircleHelp } from "lucide-react";
import { riapriTutorial } from "@/components/bridge/game-tutorial";
import type { ClaimStatus } from "@/hooks/use-bridge-game";
import { useT } from "@/contexts/traduzioni-provider";

export interface GameActionsProps {
  canClaim: boolean;
  claimStatus: ClaimStatus;
  onClaim: () => void;
  canUndo: boolean;
  onUndo: () => void;
  /**
   * Il perché del reclamo rifiutato, in un riquadro ben visibile sopra i
   * pulsanti: la riga di stato sotto il tavolo si notava appena (Trevissoi,
   * 29/10/2026).
   */
  messaggioRifiuto?: string;
  /** La pagina mostra la spiegazione del tavolo (`GameTutorial`): si può riaprire. */
  spiegazione?: boolean;
}

export function GameActions({
  canClaim,
  claimStatus,
  onClaim,
  canUndo,
  onUndo,
  messaggioRifiuto,
  spiegazione = true,
}: GameActionsProps) {
  const t = useT();
  const rifiutato = claimStatus === "rejected" && !!messaggioRifiuto;

  return (
    <>
      {rifiutato && (
        <p
          role="alert"
          className="mx-auto mt-3 flex max-w-md items-start gap-2 rounded-xl border-2 border-amber-500 bg-amber-50 px-4 py-3 text-left text-base font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-100"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {messaggioRifiuto}
        </p>
      )}
      <div className="mt-3 flex justify-center gap-2">
        {canUndo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            className="rounded-xl h-9 px-4 text-xs font-bold gap-1.5"
          >
            <Undo2 className="h-3.5 w-3.5" />
            {t("Ritira la carta")}
          </Button>
        )}
        {(canClaim || claimStatus === "checking") && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClaim}
            disabled={claimStatus === "checking"}
            className="rounded-xl h-9 px-4 text-xs font-bold gap-1.5"
          >
            {claimStatus === "checking" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Flag className="h-3.5 w-3.5" />
            )}
            {t("Reclama le prese")}
          </Button>
        )}
        {spiegazione && (
          <Button
            variant="ghost"
            size="sm"
            onClick={riapriTutorial}
            className="rounded-xl h-9 px-3 text-xs gap-1.5 text-muted-foreground"
          >
            <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
            {t("Come si gioca")}
          </Button>
        )}
      </div>
    </>
  );
}
