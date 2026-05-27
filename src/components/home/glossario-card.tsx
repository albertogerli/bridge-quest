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
            <div className="btn-squishy rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#E8E4DC] dark:border-[#2a3040] p-4 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B5E3B]/8 border border-[#1B5E3B]/12">
                  <BookOpen className="w-5 h-5 text-[#1B5E3B]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Glossario del Bridge
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    49 termini con quiz interattivi
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
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
