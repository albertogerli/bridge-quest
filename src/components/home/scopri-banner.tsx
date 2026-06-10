import { motion } from "motion/react";
import Link from "next/link";
import { Globe } from "lucide-react";

export function ScopriBanner() {
  return (
    <section className="px-4 sm:px-5 pt-2 pb-4">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Link href="/scopri">
            <div className="btn-squishy rounded-2xl bg-gradient-to-r from-[#1B5E3B]/5 to-[#1B5E3B]/10 dark:from-[#1B5E3B]/10 dark:to-emerald-950/30 border border-[#1B5E3B]/15 dark:border-emerald-900 p-4 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B5E3B] to-[#14472D]">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    Scopri il Bridge
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Storia, la FIGB, curiosità e link utili
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-[#1B5E3B]/30 dark:text-emerald-400/40 group-hover:text-[#1B5E3B] dark:group-hover:text-emerald-400 transition-colors shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
