import { motion } from "motion/react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export function PrimaManoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg px-4 mb-4"
    >
      <Link
        href="/prima-mano"
        className="relative block overflow-hidden rounded-2xl border border-[#c8a44e]/25 bg-[linear-gradient(135deg,#fffaf0_0%,#f4ead5_100%)] p-4 hover:shadow-lg transition-all"
      >
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#c8a44e]/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-figb text-white shadow-lg shadow-figb/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#12305f]">Hai 3 minuti? Prova Prima Mano</p>
            <p className="text-[11px] text-[#51627f]">Impara le basi del bridge e guadagna +50 XP</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#c8a44e]/15 px-2.5 py-1 text-[10px] font-bold text-[#8f6b16]">+50 XP</span>
        </div>
      </Link>
    </motion.div>
  );
}
