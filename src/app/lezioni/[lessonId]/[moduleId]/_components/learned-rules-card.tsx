"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { collectRuleTexts } from "@/lib/lesson-module";
import type { ContentBlock } from "@/lib/catalog";

/**
 * «Cosa hai imparato»: le regole del modulo, le stesse finite negli appunti.
 * Mostrata a tutti i profili, con testo più grande per il senior.
 */
export function LearnedRulesCard({
  content,
  isSenior,
}: {
  content: ContentBlock[];
  isSenior: boolean;
}) {
  const rules = collectRuleTexts(content);
  if (rules.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="rounded-2xl bg-gradient-to-br from-blue-50 dark:from-blue-950/40 via-card to-figb/5 dark:to-primary/10 border border-blue-200 dark:border-blue-900 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📝</span>
        <h4 className="text-base font-semibold text-blue-900 dark:text-blue-200">Cosa hai imparato</h4>
      </div>
      <ul className="space-y-2">
        {rules.map((rule, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className="text-blue-400 mt-0.5 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className={`text-blue-800 dark:text-blue-200 leading-snug ${isSenior ? "text-base" : "text-sm"}`}>
              {rule}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900">
        <Link href="/appunti" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
          Vedi tutti i tuoi appunti →
        </Link>
      </div>
    </motion.div>
  );
}
