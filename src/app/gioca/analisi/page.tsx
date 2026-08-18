"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Share2, ArrowLeft } from "lucide-react";
import { HandReplay } from "@/components/hand-replay";
import { HandAnalysisPanel } from "@/components/hand-analysis-panel";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { TurningPointPanel } from "@/components/turning-point-panel";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

interface GameData {
  hands: { north: Card[]; east: Card[]; south: Card[]; west: Card[] };
  tricks: { cards: { player: string; card: Card }[]; winner: string }[];
  contract: { level: number; suit: string; declarer: string };
  tricksMade: number;
  tricksNeeded: number;
  result: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
  NT: "SA",
  SA: "SA",
};

export default function AnalisiPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <AnalisiPage />
    </Suspense>
  );
}

function AnalisiPage() {
  const t = useT();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentTrick, setCurrentTrick] = useState(0);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  /** Il browser ha negato la copia: va detto, invece di fingere che sia andata. */
  const [copiaNegata, setCopiaNegata] = useState(false);
  const searchParams = useSearchParams();
  const gameIndex = searchParams.get("game");

  useEffect(() => {
    // Try to load game data
    try {
      let data: GameData | null = null;

      if (gameIndex !== null) {
        // Load from history
        const historyRaw = localStorage.getItem("bq_game_history");
        if (historyRaw) {
          const history = JSON.parse(historyRaw);
          const idx = parseInt(gameIndex);
          if (history[idx]) {
            // Game history doesn't store full trick data, so check last game
            const lastGameRaw = localStorage.getItem("bq_last_game_for_analysis");
            if (lastGameRaw) {
              data = JSON.parse(lastGameRaw);
            }
          }
        }
      } else {
        // Load last game
        const lastGameRaw = localStorage.getItem("bq_last_game_for_analysis");
        if (lastGameRaw) {
          data = JSON.parse(lastGameRaw);
        }
      }

      if (data) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
        setGameData(data);
      }
    } catch (err) {
      console.error("Error loading game data:", err);
    }
  }, [gameIndex]);

  const overallGrade = useMemo(() => {
    if (!gameData) return "N/A";
    const percentage = (gameData.tricksMade / 13) * 100;

    if (gameData.result >= 0) {
      if (percentage >= 70) return "A";
      if (percentage >= 60) return "B";
      return "C";
    } else {
      if (Math.abs(gameData.result) === 1) return "C";
      if (Math.abs(gameData.result) === 2) return "D";
      return "F";
    }
  }, [gameData]);

  const handleShare = () => {
    if (!gameData) return;

    const contractStr = `${gameData.contract.level}${
      SUIT_SYMBOLS[gameData.contract.suit] || gameData.contract.suit
    }`;
    const text = `🃏 Analisi Bridge LAB
Contratto: ${contractStr}
Prese: ${gameData.tricksMade}/${gameData.tricksNeeded}
Voto: ${overallGrade}

Gioca su bridgelab.it`;

    if (navigator.share) {
      navigator
        .share({ title: "Analisi Bridge LAB", text })
        .catch(() => void copiaNegliAppunti(text));
    } else {
      void copiaNegliAppunti(text);
    }
  };

  /**
   * Copia negli appunti, e dice «copiato» solo se ha copiato davvero.
   *
   * `writeText` può essere RIFIUTATA — Safari la concede solo in risposta
   * diretta a un tocco, e certi browser dentro le app la negano sempre. Senza
   * il `catch` quella promessa rifiutata finiva fra gli errori non gestiti
   * (visto in produzione il 15/08/2026: «Write permission denied»), e nel
   * frattempo la schermata mostrava lo stesso «copiato» a chi non aveva
   * niente negli appunti — che è il difetto peggiore dei due, perché lo
   * scopre solo quando prova a incollare.
   */
  async function copiaNegliAppunti(testo: string) {
    try {
      await navigator.clipboard.writeText(testo);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 2000);
    } catch (err) {
      reportError("analisi:copia", err);
      setCopiaNegata(true);
      setTimeout(() => setCopiaNegata(false), 4000);
    }
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="card-clean max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🃏</div>
          <h1 className="text-2xl font-bold text-foreground font-display mb-2">
            {t("Nessuna mano da analizzare")}
          </h1>
          <p className="text-muted-foreground mb-6">
            Completa una mano nel gioco per vedere l&apos;analisi dettagliata.
          </p>
          <Link
            href="/gioca"
            className="inline-flex items-center gap-2 px-6 py-3 bg-figb text-white rounded-xl hover:bg-figb-dark transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("Vai ai Giochi")}
          </Link>
        </div>
      </div>
    );
  }

  const contractStr = `${gameData.contract.level}${
    SUIT_SYMBOLS[gameData.contract.suit] || gameData.contract.suit
  }`;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-display mb-1">
              {t("Analisi della Mano")}
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="text-lg font-semibold">{contractStr}</span>
              <span className="text-sm">
                Dichiarante: {gameData.contract.declarer.toUpperCase()}
              </span>
            </div>
          </div>
          <Link
            href="/gioca"
            className="flex items-center gap-2 px-4 py-2 text-foreground/80 hover:bg-card rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("Torna ai Giochi")}
          </Link>
        </div>

        {/* Overall grade card */}
        <div className="card-clean p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground/80 mb-1">
                {t("Risultato")}
              </h2>
              <p className="text-muted-foreground">
                {gameData.result >= 0 ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    ✅ Contratto mantenuto{" "}
                    {gameData.result > 0 && `+${gameData.result}`}
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    ❌ Contratto caduto di {Math.abs(gameData.result)}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Prese: {gameData.tricksMade}/{gameData.tricksNeeded}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-foreground">
                  {overallGrade}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{t("Voto")}</div>
              </div>
              <button
                onClick={handleShare}
                className="px-4 py-3 bg-card hover:bg-muted/50 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                title={t("Condividi Analisi")}
              >
                <Share2 className="w-5 h-5 text-foreground/80" />
                <span className="text-sm font-medium text-foreground/80">
                  {t("Condividi")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {showShareSuccess && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            ✅ Copiato negli appunti!
          </div>
        )}

        {copiaNegata && (
          <div className="fixed top-4 right-4 bg-amber-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {t("Il browser non ha concesso la copia. Seleziona il testo a mano.")}
          </div>
        )}

        {/* Dove è cambiata la mano (double dummy, su richiesta) */}
        <div className="mb-4">
          <TurningPointPanel
            hands={gameData.hands}
            tricks={gameData.tricks}
            // Il contratto porta "NT"/"SA" per il senza atout; il solver vuole
            // null, non una stringa che non è un seme.
            strain={
              gameData.contract.suit === "NT" || gameData.contract.suit === "SA"
                ? null
                : (gameData.contract.suit as Suit)
            }
            declarer={gameData.contract.declarer as Position}
          />
        </div>

        {/* Main content: Replay + Analysis */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Replay panel */}
          <div className="card-clean p-0 overflow-hidden" style={{ height: "600px" }}>
            <HandReplay
              hands={gameData.hands}
              tricks={gameData.tricks}
              contract={gameData.contract}
              onTrickChange={setCurrentTrick}
            />
          </div>

          {/* Analysis panel */}
          <div className="card-clean p-0 overflow-hidden" style={{ height: "600px" }}>
            <HandAnalysisPanel
              tricks={gameData.tricks}
              hands={gameData.hands}
              contract={gameData.contract}
              currentTrick={currentTrick}
            />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="card-clean p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
          <h3 className="text-xl font-bold mb-2">{t("Vuoi migliorare ancora?")}</h3>
          <p className="text-blue-100 mb-4">
            {t("Rivedi le lezioni e pratica con le smazzate didattiche")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/lezioni"
              className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium"
            >
              {t("Vai alle Lezioni")}
            </Link>
            <Link
              href="/gioca"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 rounded-xl transition-colors font-medium"
            >
              {t("Gioca Ancora")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
