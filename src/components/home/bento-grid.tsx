import { motion } from "motion/react";
import Link from "next/link";
import { Flame, Trophy, MapPin } from "lucide-react";

interface BentoGridProps {
  dailyDone: boolean;
}

export function BentoGrid({ dailyDone }: BentoGridProps) {
  return (
    <section className="px-4 sm:px-5 -mt-10 relative z-10 lg:hidden">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-12 gap-3"
        >
          {/* Main CTA — Gioca (large, spans 8 cols) */}
          <Link href="/gioca/smazzata?random=1" className="col-span-8 btn-squishy btn-squishy-green rounded-2xl p-5 text-white flex flex-col justify-between min-h-[170px]" style={{ background: "linear-gradient(135deg, #1B5E3B, #14472D)" }}>
            <div>
              <span className="text-3xl mb-2 block">♠</span>
              <h3 className="font-bold text-xl leading-tight font-display">Gioca una mano</h3>
              <p className="text-sm text-white/70 mt-1">Carte, licita e gioco con AI</p>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-[10px] font-bold text-white/50 bg-white/10 rounded-full px-2.5 py-1 uppercase tracking-wider">+20 XP</span>
            </div>
          </Link>

          {/* Sfida del giorno (4 cols) */}
          <Link href="/gioca/sfida" className="col-span-4 btn-squishy btn-squishy-gold rounded-2xl p-4 flex flex-col justify-between min-h-[170px]" style={{ background: "linear-gradient(135deg, #c8a44e, #a88a3a)" }}>
            <div>
              <Flame className="w-7 h-7 text-white/90 mb-2" />
              <h3 className="font-bold text-sm leading-tight text-white">Sfida<br/>del giorno</h3>
            </div>
            {dailyDone ? (
              <span className="text-[10px] font-bold text-white/80 bg-white/20 rounded-full px-2 py-0.5">Fatta!</span>
            ) : (
              <span className="text-[10px] font-bold text-white/80 bg-white/15 rounded-full px-2 py-0.5">+40 XP</span>
            )}
          </Link>

          {/* Lezioni (5 cols) */}
          <Link href="/lezioni" className="col-span-5 btn-squishy btn-squishy-white rounded-2xl p-4 bg-card border border-border flex flex-col justify-between min-h-[130px]">
            <div>
              <span className="text-2xl mb-1.5 block">🎓</span>
              <h3 className="font-bold text-[15px] leading-tight text-foreground">Lezioni</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">49 lezioni · 4 corsi</p>
          </Link>

          {/* Torneo (7 cols) */}
          <Link href="/gioca/torneo" className="col-span-7 btn-squishy btn-squishy-blue rounded-2xl p-4 text-white flex flex-col justify-between min-h-[130px]" style={{ background: "linear-gradient(135deg, #003DA5, #0052CC)" }}>
            <div>
              <Trophy className="w-6 h-6 text-white/90 mb-1.5" />
              <h3 className="font-bold text-[15px] leading-tight">Tornei & Sfide</h3>
            </div>
            <p className="text-[11px] text-white/70 leading-snug">Settimanale, amici, classifica</p>
          </Link>

          {/* Quiz (6 cols) */}
          <Link href="/gioca" className="col-span-6 btn-squishy btn-squishy-white rounded-2xl p-4 bg-card border border-border flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-xl mb-1 block">🧠</span>
              <h3 className="font-bold text-sm leading-tight text-foreground">Quiz & Minigiochi</h3>
            </div>
            <p className="text-[10px] text-muted-foreground/70">6 quiz · 9 giochi</p>
          </Link>

          {/* Dispense (6 cols) */}
          <Link href="/dispense" className="col-span-6 btn-squishy btn-squishy-white rounded-2xl p-4 bg-card border border-border flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-xl mb-1 block">📄</span>
              <h3 className="font-bold text-sm leading-tight text-foreground">Dispense FIGB</h3>
            </div>
            <p className="text-[10px] text-muted-foreground/70">Materiale PDF</p>
          </Link>

          {/* Trova ASD (full width) */}
          <Link href="/trova-circolo" className="col-span-12 btn-squishy btn-squishy-blue rounded-2xl p-4 text-white flex items-center gap-4" style={{ background: "linear-gradient(135deg, #003DA5, #0052CC)" }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-tight">Trova la tua ASD</h3>
              <p className="text-[11px] text-white/60">146 associazioni FIGB in Italia</p>
            </div>
            <svg className="w-4 h-4 text-white/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
