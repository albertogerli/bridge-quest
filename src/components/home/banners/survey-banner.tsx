import { motion } from "motion/react";
import Link from "next/link";

export function SurveyBanner() {
  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Link href="/forum/6">
            <div className="btn-squishy btn-squishy-green relative overflow-hidden rounded-2xl p-4 cursor-pointer" style={{ background: "linear-gradient(135deg, #1B5E3B, #14472D)" }}>
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/8 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shrink-0 text-lg">
                  📊
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Tu che bridgista sei?</p>
                  <p className="text-[11px] text-white/60">Partecipa al sondaggio della community!</p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-white bg-white/15 px-2.5 py-1 rounded-full">
                  VOTA
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
