"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ShareResultProps {
  contract: string;
  tricksMade: number;
  tricksNeeded: number;
  result: number; // +N or -N relative to contract
  stars: number;  // 1-5 (or 1-3 depending on context)
}

function buildShareText({
  contract,
  tricksMade,
  tricksNeeded,
  result,
  stars,
}: ShareResultProps): string {
  const maxStars = Math.max(stars, 1);
  const starString = Array.from({ length: maxStars }, () => "\u2B50").join("");
  const emptyStars = Math.max(0, 3 - maxStars);
  const grayStars = emptyStars > 0 ? Array.from({ length: emptyStars }, () => "\u2606").join("") : "";

  const made = result >= 0;
  const resultEmoji = made ? "\u2705" : "\u274C";
  const verdict = result > 0
    ? `Fatto +${result}!`
    : result === 0
      ? "Contratto fatto!"
      : `Caduto di ${Math.abs(result)}`;

  const lines = [
    "\uD83C\uDCCF FIGB Bridge LAB - Sfida del Bridge!",
    `Contratto: ${contract} \u00B7 Risultato: ${tricksMade}/${tricksNeeded} prese ${resultEmoji}`,
    `${starString}${grayStars} ${verdict}`,
    "Riesci a fare meglio? \uD83D\uDC49 bridge-quest.vercel.app",
  ];

  return lines.join("\n");
}

export function ShareResult(props: ShareResultProps) {
  const { contract, tricksMade, tricksNeeded, result, stars } = props;
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText(props);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareText]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "FIGB Bridge LAB - Il mio risultato",
          text: shareText,
        });
      } catch (err: unknown) {
        // User cancelled share - not an error
        if (err instanceof Error && err.name === "AbortError") return;
        // Fallback to copy
        handleCopy();
      }
    } else {
      // No Web Share API - fall back to copy
      handleCopy();
    }
  }, [shareText, handleCopy]);

  const made = result >= 0;
  const maxStars = Math.max(stars, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="w-full"
    >
      {/* Card Preview */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-[#003DA5] to-[#002E7A] px-5 py-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{"\uD83C\uDCCF"}</span>
            <span className="text-sm font-bold tracking-wide">FIGB Bridge LAB</span>
          </div>
          <p className="text-[11px] text-white/70 font-medium">Sfida del Bridge</p>
        </div>

        {/* Result body */}
        <div className="bg-white px-5 py-4 space-y-3">
          {/* Contract + Tricks */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contratto</p>
              <p className="text-xl font-black text-gray-900">{contract}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prese</p>
              <p className={`text-xl font-black ${made ? "text-emerald-600" : "text-red-500"}`}>
                {tricksMade}/{tricksNeeded}
              </p>
            </div>
          </div>

          {/* Stars + Verdict */}
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`text-lg ${s <= maxStars ? "" : "grayscale opacity-30"}`}
                >
                  {"\u2B50"}
                </span>
              ))}
            </div>
            <span className={`text-sm font-bold ${made ? "text-emerald-700" : "text-red-600"}`}>
              {result > 0
                ? `Fatto +${result}!`
                : result === 0
                  ? "Contratto fatto!"
                  : `Caduto di ${Math.abs(result)}`}
            </span>
          </div>

          {/* URL hint */}
          <p className="text-[11px] text-gray-400">bridge-quest.vercel.app</p>
        </div>
      </div>

      {/* Share + Copy buttons */}
      <div className="flex gap-3 mt-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#003DA5] hover:bg-[#002E7A] text-white text-sm font-bold transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Condividi
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors"
        >
          {copied ? (
            <>
              <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-emerald-600">Copiato!</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copia
            </>
          )}
        </button>
      </div>

      {/* Toast feedback */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-2 text-center"
          >
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full px-3 py-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Testo copiato negli appunti!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
