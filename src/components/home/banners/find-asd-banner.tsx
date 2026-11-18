"use client";

import { motion } from "motion/react";
import { useT } from "@/contexts/traduzioni-provider";
import Link from "@/components/link";
import { MapPin } from "lucide-react";

export function FindAsdBanner() {
  const t = useT();
  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/trova-circolo">
            <div className="cursor-pointer rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <MapPin className="size-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{t("Non hai ancora un'associazione?")}</p>
                  <p className="text-sm text-muted-foreground">{t("Trova la tua ASD tra le 146 affiliate FIGB")}</p>
                </div>
                <svg className="size-5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
