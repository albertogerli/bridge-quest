"use client";

/**
 * In-game action bar: claim ("Reclama le prese") and didactic undo
 * ("Ritira la carta"). Rendered by game pages during the playing phase;
 * each button only appears when the corresponding hook flag allows it.
 */

import { Button } from "@/components/ui/button";
import { Flag, Undo2, Loader2 } from "lucide-react";
import type { ClaimStatus } from "@/hooks/use-bridge-game";

export interface GameActionsProps {
  canClaim: boolean;
  claimStatus: ClaimStatus;
  onClaim: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

export function GameActions({
  canClaim,
  claimStatus,
  onClaim,
  canUndo,
  onUndo,
}: GameActionsProps) {
  if (!canClaim && !canUndo && claimStatus !== "checking") return null;

  return (
    <div className="mt-3 flex justify-center gap-2">
      {canUndo && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          className="rounded-xl h-9 px-4 text-xs font-bold gap-1.5"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Ritira la carta
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
          Reclama le prese
        </Button>
      )}
    </div>
  );
}
