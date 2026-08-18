"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { getYouTubeEmbedUrl } from "@/components/maestro-video";
import { useT } from "@/contexts/traduzioni-provider";

/** Maestro video inline: shows on the first module of each lesson, at step 0 */
export function MaestroVideoInline({ lessonId, moduleIndex, currentStep, profile, onDismiss }: {
  lessonId: number; moduleIndex: number; currentStep: number; profile?: string;
  onDismiss?: () => void;
}) {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);

  const youtubeEmbed = getYouTubeEmbedUrl(lessonId, profile);

  // Only show on first module, at beginning
  if (moduleIndex !== 0 || currentStep > 1 || !youtubeEmbed || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6 rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
    >
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={youtubeEmbed}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Maestro Franci introduce la lezione"
        />
        <button
          onClick={() => {
            setDismissed(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
            onDismiss?.();
          }}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70 active:scale-90"
          aria-label="Chiudi video"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-3 flex items-center gap-2">
        <span className="text-lg">🎓</span>
        <p className="text-sm font-bold text-foreground/80">
          {t("Maestro Franci introduce la lezione")}
        </p>
      </div>
    </motion.div>
  );
}
