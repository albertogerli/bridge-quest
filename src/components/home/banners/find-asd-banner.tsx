import { motion } from "motion/react";
import Link from "next/link";
import { MapPin } from "lucide-react";

export function FindAsdBanner() {
  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/trova-circolo">
            <div className="rounded-2xl bg-gradient-to-r from-[#003DA5] to-[#0052CC] p-4 cursor-pointer hover:translate-y-[-1px] hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Non hai ancora un&apos;associazione?</p>
                  <p className="text-xs text-white/70">Trova la tua ASD tra le 146 affiliate FIGB</p>
                </div>
                <svg className="w-5 h-5 text-white/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
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
