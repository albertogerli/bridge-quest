"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Smazzata } from "@/lib/catalog";
import { formatDate } from "@/lib/daily-hand";
import { getDailyResult } from "../_storage";

/** Mano di ieri: esito già registrato (con rigioco) oppure invito a giocarla. */
export function YesterdayHandCard({
  mounted,
  yesterday,
  yesterdayHand,
  onPlay,
}: {
  mounted: boolean;
  yesterday: string;
  yesterdayHand: Smazzata;
  onPlay: () => void;
}) {
  const yResult = mounted ? getDailyResult(yesterday) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-4"
    >
      <div className="card-elevated rounded-2xl bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <svg
                className="h-5 w-5 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Mano di Ieri
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {mounted ? formatDate(yesterday) : ""}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-bold text-muted-foreground border-border"
          >
            {yesterdayHand.contract}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {yesterdayHand.title}
        </p>
        {yResult ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`text-sm ${
                      s <= yResult.stars
                        ? ""
                        : "grayscale opacity-30"
                    }`}
                  >
                    {"⭐"}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {yResult.tricks} prese
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPlay}
              className="text-xs font-bold text-emerald hover:text-emerald-dark"
            >
              Rigioca
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onPlay}
            className="w-full rounded-xl h-10 text-xs font-bold border-border text-muted-foreground hover:text-emerald hover:border-emerald/30"
          >
            Gioca la mano di ieri
          </Button>
        )}
      </div>
    </motion.div>
  );
}
