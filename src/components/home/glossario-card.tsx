import { motion } from "motion/react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export function GlossarioCard() {
  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
        >
          <Link href="/glossario">
            <div className="btn-squishy rounded-2xl bg-card border border-border p-4 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B5E3B]/8 dark:bg-emerald-900/40 border border-[#1B5E3B]/12 dark:border-emerald-800">
                  <BookOpen className="w-5 h-5 text-[#1B5E3B] dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Glossario del Bridge
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    49 termini con quiz interattivi
                  </p>
                </div>
                <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
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
