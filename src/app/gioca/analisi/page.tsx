"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Share2, ArrowLeft } from "lucide-react";
import { HandReplay } from "@/components/hand-replay";
import { HandAnalysisPanel } from "@/components/hand-analysis-panel";
import type { Card, Position } from "@/lib/bridge-engine";

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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" /></div>}>
      <AnalisiPage />
    </Suspense>
  );
}

function AnalisiPage() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentTrick, setCurrentTrick] = useState(0);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
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
        .share({
          title: "Analisi Bridge LAB",
          text,
        })
        .catch(() => {
          // Fallback to clipboard
          navigator.clipboard.writeText(text);
          setShowShareSuccess(true);
          setTimeout(() => setShowShareSuccess(false), 2000);
        });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(text);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 2000);
    }
  };

  if (!gameData) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] p-4 flex items-center justify-center">
        <div className="card-clean max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🃏</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Nessuna mano da analizzare
          </h1>
          <p className="text-gray-600 mb-6">
            Completa una mano nel gioco per vedere l'analisi dettagliata.
          </p>
          <Link
            href="/gioca"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#003DA5] text-white rounded-xl hover:bg-[#002d7a] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Vai ai Giochi
          </Link>
        </div>
      </div>
    );
  }

  const contractStr = `${gameData.contract.level}${
    SUIT_SYMBOLS[gameData.contract.suit] || gameData.contract.suit
  }`;

  return (
    <div className="min-h-screen bg-[#F7F5F0] p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Analisi della Mano
            </h1>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-lg font-semibold">{contractStr}</span>
              <span className="text-sm">
                Dichiarante: {gameData.contract.declarer.toUpperCase()}
              </span>
            </div>
          </div>
          <Link
            href="/gioca"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Torna ai Giochi
          </Link>
        </div>

        {/* Overall grade card */}
        <div className="card-clean p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">
                Risultato
              </h2>
              <p className="text-gray-600">
                {gameData.result >= 0 ? (
                  <span className="text-green-600 font-semibold">
                    ✅ Contratto mantenuto{" "}
                    {gameData.result > 0 && `+${gameData.result}`}
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    ❌ Contratto caduto di {Math.abs(gameData.result)}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Prese: {gameData.tricksMade}/{gameData.tricksNeeded}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900">
                  {overallGrade}
                </div>
                <div className="text-sm text-gray-600 mt-1">Voto</div>
              </div>
              <button
                onClick={handleShare}
                className="px-4 py-3 bg-white hover:bg-gray-50 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                title="Condividi Analisi"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">
                  Condividi
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
          <h3 className="text-xl font-bold mb-2">Vuoi migliorare ancora?</h3>
          <p className="text-blue-100 mb-4">
            Rivedi le lezioni e pratica con le smazzate didattiche
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/lezioni"
              className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium"
            >
              Vai alle Lezioni
            </Link>
            <Link
              href="/gioca"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 rounded-xl transition-colors font-medium"
            >
              Gioca Ancora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
