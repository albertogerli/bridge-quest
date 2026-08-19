"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, Share2, CheckCircle2, ExternalLink } from "lucide-react";
import { useGameStore } from "@/store/use-game-store";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useT } from "@/contexts/traduzioni-provider";

const DIDACTA_END = new Date("2026-03-14T23:59:59+01:00"); // venerdì 14 marzo
const STORAGE_KEY = "bq_didacta_claimed";
const XP_REWARD = 250;

export function DidactaBanner() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, modalOpen, { onEscape: () => setModalOpen(false) });

  useEffect(() => {
    const now = new Date();
    if (now > DIDACTA_END) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "claimed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setClaimed(true);
    }
    if (stored === "dismissed") {
      setDismissed(true);
    }
    setShow(true);
  }, []);

  if (!show || dismissed) return null;

  const handleClaim = () => {
    if (claimed) return;
    useGameStore.getState().addXp(XP_REWARD);
    localStorage.setItem(STORAGE_KEY, "claimed");
    setClaimed(true);
    setJustClaimed(true);
    setTimeout(() => setJustClaimed(false), 3000);
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (!claimed) {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    }
  };

  const hashtag = "#bridgelab";
  const shareText = `Ho scoperto BridgeLab alla fiera DIDACTA! Impara il Bridge giocando gratis su bridgelab.it ${hashtag} #DIDACTA2026 #bridge #FIGB`;

  return (
    <>
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40 dark:border-amber-500/40 p-4 cursor-pointer group"
        onClick={() => setModalOpen(true)}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          aria-label={t("Chiudi il banner DIDACTA")}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
        >
          <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl shadow-lg shadow-amber-400/30">
            <Camera className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-amber-900 dark:text-amber-200">
                {t("DIDACTA 2026")}
              </p>
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/70 mt-0.5">
              {t("Posta una foto con")} <span className="font-black">{hashtag}</span> e guadagna <span className="font-black text-amber-700 dark:text-amber-200">+{XP_REWARD} XP</span>!
            </p>
          </div>
          {claimed ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          ) : (
            <Share2 className="w-5 h-5 text-amber-600 shrink-0" />
          )}
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="didacta-modal-title"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 p-6 text-white text-center">
                <div className="absolute inset-0 opacity-20" aria-hidden="true">
                  <div className="absolute top-2 left-4 text-4xl opacity-30">&#9824;</div>
                  <div className="absolute top-6 right-8 text-3xl opacity-30">&#9829;</div>
                  <div className="absolute bottom-4 left-8 text-3xl opacity-30">&#9830;</div>
                  <div className="absolute bottom-2 right-4 text-4xl opacity-30">&#9827;</div>
                </div>
                <Camera className="w-10 h-10 mx-auto mb-2" aria-hidden="true" />
                <h2 id="didacta-modal-title" className="text-2xl font-black">DIDACTA 2026</h2>
                <p className="text-sm opacity-90 mt-1">{t("Firenze, 12-14 Marzo")}</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Instructions */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-black">1</span>
                    <p className="text-sm text-foreground/80 pt-0.5">
                      {t("Scatta una foto allo stand BridgeLab o mentre giochi sull'app")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-black">2</span>
                    <p className="text-sm text-foreground/80 pt-0.5">
                      {t("Pubblicala su")} <strong>{t("Instagram")}</strong>, <strong>{t("Facebook")}</strong> o <strong>{t("TikTok")}</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-black">3</span>
                    <p className="text-sm text-foreground/80 pt-0.5">
                      Usa l&apos;hashtag <span className="font-black text-amber-600 dark:text-amber-400">{hashtag}</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-black">4</span>
                    <p className="text-sm text-foreground/80 pt-0.5">
                      {t("Torna qui e riscuoti")} <strong className="text-amber-600 dark:text-amber-400">+{XP_REWARD} XP</strong>!
                    </p>
                  </div>
                </div>

                {/* Copy text */}
                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-bold">{t("Testo da copiare:")}</p>
                  <p className="text-sm text-foreground/80 italic">{shareText}</p>
                  <button
                    onClick={() => navigator.clipboard?.writeText(shareText)}
                    className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    {t("Copia testo")}
                  </button>
                </div>

                {/* Social links */}
                <div className="flex gap-2">
                  <a
                    href={`https://www.instagram.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    {t("Instagram")} <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    {t("Facebook")} <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://www.tiktok.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    {t("TikTok")} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Claim button */}
                {claimed ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      +{XP_REWARD} XP riscossi! Grazie per aver condiviso!
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleClaim}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-base shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-transform"
                  >
                    Ho pubblicato! Riscuoti +{XP_REWARD} XP
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP claimed toast */}
      <AnimatePresence>
        {justClaimed && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/30">
              <Camera className="w-5 h-5" />
              <span className="text-sm font-bold">+{XP_REWARD} XP! Grazie per il post!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
