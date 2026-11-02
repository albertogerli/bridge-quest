"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { BenStatus } from "@/components/bridge/ben-status";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { FoglioMano, PannelloMano } from "@/components/bridge/pannello-mano";
import { ArrowLeft } from "lucide-react";
import { GameActions } from "@/components/bridge/game-actions";
import type { CardData } from "@/components/bridge/playing-card";
import type { ProfileConfig } from "@/hooks/use-profile";
import type { GameResult } from "@/hooks/use-game-results";
import { parseContract, partnershipOf, toGamePosition } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import { useDailyPlay } from "../_use-daily-play";
import { DailyGameResult } from "./daily-game-result";
import { useT } from "@/contexts/traduzioni-provider";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";

// Overlay del tutorial: compare solo a partita avviata e resta chiuso finché
// l'utente non lo apre → fuori dal first load della pagina di gioco.
const GameTutorial = dynamic(
  () => import("@/components/bridge/game-tutorial").then((m) => m.GameTutorial),
  { ssr: false },
);

/** Playing View — tavolo di gioco della mano del giorno (o di ieri). */
export function PlayingView({
  smazzata,
  isDaily,
  alreadyPlayed,
  onFinish,
  onBack,
  isMobile,
  profile,
  saveGameResult,
}: {
  smazzata: Smazzata;
  isDaily: boolean;
  alreadyPlayed: boolean;
  onFinish: (tricks: number, result: number, made: boolean) => void;
  onBack: () => void;
  isMobile: boolean;
  profile: ProfileConfig;
  saveGameResult: (result: GameResult) => void;
}) {
  const t = useT();
  const {
    game,
    tricksNeeded,
    declarer,
    hands,
    displayTrick,
    activeDisplayPos,
    showCelebration,
    handlePlayCard,
    replay,
  } = useDailyPlay({ smazzata, isDaily, onFinish, saveGameResult });

  const preseDich = partnershipOf(declarer) === "ew"
    ? `${game.gameState?.trickCount.ew ?? 0} / ${game.gameState?.trickCount.ns ?? 0}`
    : `${game.gameState?.trickCount.ns ?? 0} / ${game.gameState?.trickCount.ew ?? 0}`;
  const pannello = (
    <PannelloMano
      prese={game.gameState?.tricks ?? []}
      presaInCorso={game.gameState?.currentTrick ?? []}
      licita={smazzata.bidding ?? null}
      intestazione={
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Contratto")}</p>
            <p className="font-display text-2xl font-extrabold text-primary">{contrattoLeggibile(smazzata.contract)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Obiettivo")}</p>
            <p className="text-lg font-bold">{t("{n} prese", { n: tricksNeeded })}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Dich. / Dif.")}</p>
            <p className="text-lg font-bold tabular-nums">{preseDich}</p>
          </div>
        </div>
      }
    />
  );

  return (
    <div className={`pt-4 ${isMobile ? "px-2" : "px-4"}`}>
      <div className="mx-auto max-w-6xl">
        {/*
          DIREZIONE «IBRIDO» (02/11/2026), come nel compito: in alto una riga
          sola con la pillola del contratto, che apre prese e licita.
        */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
            aria-label={t("Torna alla Mano del Giorno")}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {isDaily ? t("Mano del Giorno") : t("Mano di Ieri")}
            </p>
            <h1 className="truncate font-display text-base font-bold sm:text-lg">{smazzata.title}</h1>
          </div>
          <span className="hidden sm:block">
            <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
          </span>
          <FoglioMano
            daSchermo="2xl"
            etichetta={
              <span className="tabular-nums">
                {contrattoLeggibile(smazzata.contract)}
                <span className="font-normal text-muted-foreground"> · {preseDich}</span>
              </span>
            }
          >
            {pannello}
          </FoglioMano>
        </motion.div>

        {/* Daily bonus badge (before play) */}
        {isDaily && !alreadyPlayed && game.phase === "ready" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-3 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full px-4 py-1.5">
              <span className="text-xs font-bold text-amber-700">
                +50 {profile.xpLabel} Bonus Giornaliero
              </span>
            </div>
          </motion.div>
        )}

        {/* Start button on mobile */}
        {isMobile && game.phase === "ready" && (
          <div className="mb-3 flex justify-center">
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-11 px-8 shadow-lg shadow-emerald/25"
            >
              {t("Inizia a giocare")}
            </Button>
          </div>
        )}

        {/*
          Il tavolo e il pannello con prese e licita. Come nelle smazzate, la
          pagina ha anche la colonna destra del portale: a lato del tavolo il
          pannello ci sta solo sugli schermi larghi; prima lo apre la pillola.
        */}
        <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_18rem]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-full min-w-0"
          >
            {hands ? (
              <BridgeTable ancora={declarer}
                north={hands.north}
                south={hands.south}
                east={hands.east}
                west={hands.west}
                northFaceDown={false}
                southFaceDown={false}
                eastFaceDown={true}
                westFaceDown={true}
                currentTrick={displayTrick}
                contract={smazzata.contract}
                declarer="S"
                vulnerability={smazzata.vulnerability}
                trickCount={partnershipOf(declarer) === "ew" ? { ns: game.gameState!.trickCount.ew, ew: game.gameState!.trickCount.ns } : game.gameState!.trickCount}
                onPlayCard={handlePlayCard}
                highlightedCards={game.validCards as CardData[]}
                activePosition={activeDisplayPos}
                disabled={!game.isPlayerTurn}
                compact={isMobile}
                trumpSuit={game.gameState?.trumpSuit}
              />
            ) : (
              <BridgeTable ancora={declarer}
                north={
                  smazzata.hands[
                    toGamePosition("north", declarer)
                  ] as CardData[]
                }
                south={
                  smazzata.hands[
                    toGamePosition("south", declarer)
                  ] as CardData[]
                }
                east={
                  smazzata.hands[
                    toGamePosition("east", declarer)
                  ] as CardData[]
                }
                west={
                  smazzata.hands[
                    toGamePosition("west", declarer)
                  ] as CardData[]
                }
                northFaceDown={false}
                southFaceDown={false}
                eastFaceDown={true}
                westFaceDown={true}
                contract={smazzata.contract}
                declarer="S"
                vulnerability={smazzata.vulnerability}
                trickCount={{ ns: 0, ew: 0 }}
                disabled={true}
                compact={isMobile}
                trumpSuit={parseContract(smazzata.contract).trumpSuit}
              />
            )}
            {game.phase === "playing" && <GameTutorial />}
          </motion.div>

          <aside className="grid gap-4 2xl:sticky 2xl:top-4">
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card 2xl:block">{pannello}</div>
            {/* Prima di cominciare, finché il pannello non è affiancato (sotto 2xl), la licita si legge senza aprire il foglio. */}
            {smazzata.bidding && game.phase === "ready" && (
              <div className="2xl:hidden">
                <BiddingPanel bidding={smazzata.bidding} />
              </div>
            )}
          </aside>
        </div>

        {/* Message */}
        <div
          className={`mt-3 text-center ${isMobile ? "sticky bottom-16 z-20 bg-card/90 backdrop-blur-sm rounded-xl py-2 mx-auto max-w-xs shadow-sm" : ""}`}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={game.message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`text-sm font-semibold ${
                game.phase === "finished"
                  ? game.result && game.result.result >= 0
                    ? "text-emerald"
                    : "text-red-500"
                  : game.isPlayerTurn
                    ? "text-amber-600"
                    : "text-muted-foreground"
              }`}
            >
              {game.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* In-game actions: claim */}
        {(game.phase === "playing" || game.phase === "trick-complete") && (
          <GameActions
            canClaim={game.canClaim}
            claimStatus={game.claimStatus}
            messaggioRifiuto={game.message}
            onClaim={game.requestClaim}
            canUndo={game.canUndo}
            onUndo={game.undoLastPlay}
          />
        )}

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-3">
          {game.phase === "ready" && !isMobile && (
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-8 shadow-lg shadow-emerald/25"
            >
              {t("Inizia a giocare")}
            </Button>
          )}
          {game.phase === "finished" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="rounded-xl h-12 px-6 font-bold"
              >
                {t("Torna alla Mano del Giorno")}
              </Button>
              <Button
                onClick={replay}
                className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-6 shadow-lg shadow-emerald/25"
              >
                {t("Rigioca")}
              </Button>
            </div>
          )}
        </div>

        {/* Post-game result card */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <DailyGameResult
              smazzata={smazzata}
              result={game.result}
              isDaily={isDaily}
              alreadyPlayed={alreadyPlayed}
              showCelebration={showCelebration}
              xpLabel={profile.xpLabel}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
