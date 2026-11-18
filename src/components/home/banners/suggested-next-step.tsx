"use client";

import { motion } from "motion/react";
import Link from "@/components/link";
import { Gamepad2, GraduationCap } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { useCatalog } from "@/store/use-catalog-store";
import { usePlayableSmazzate } from "@/store/use-smazzate-store";
import { useGameStore } from "@/store/use-game-store";
import { ultimaLezioneToccata } from "@/lib/prossimo-modulo";

interface NextModule {
  lessonId: number;
  moduleId: string;
  moduleTitle: string;
  lessonIcon: string;
}

interface SuggestedNextStepProps {
  nextModule: NextModule | null;
}

export function SuggestedNextStep({ nextModule }: SuggestedNextStepProps) {
  const t = useT();
  /**
   * LA MANO DEVE ESSERE PERTINENTE, o non si propone.
   *
   * Prima il suggerimento «metti in pratica» mandava a
   * `/gioca/smazzata?random=1`: una mano A CASO, presa fra le 272 del
   * catalogo. Detto «per consolidare la teoria», mentre la teoria che
   * consolidava era quella di un'altra lezione — spesso una che l'allievo
   * non ha ancora fatto. Non è un dettaglio: sbagliare una mano perché
   * nessuno ti ha ancora spiegato quella cosa insegna che sei tu a non
   * capire.
   *
   * Adesso la mano viene dall'ULTIMA LEZIONE TOCCATA, e se quella lezione
   * non ha mani non si propone niente di finto: si propone di studiare.
   * Meglio un invito in meno che un invito che non c'entra.
   */
  const { courses } = useCatalog();
  const smazzate = usePlayableSmazzate();
  const completati = useGameStore((st) => st.completedModules);
  const lezione = ultimaLezioneToccata(courses, completati);
  const quanteMani = lezione ? smazzate.filter((sm) => sm.lesson === lezione.lessonId).length : 0;
  const manoPertinente = lezione && quanteMani > 0 ? lezione : null;
  return (
    <section className="px-4 sm:px-5 mt-2 lg:hidden">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          {(() => {
            // Alternate between lesson and play based on last activity
            const lastLesson = localStorage.getItem("bq_last_lesson_ts");
            const lastHand = localStorage.getItem("bq_last_hand_ts");
            const lastLessonTs = lastLesson ? parseInt(lastLesson) : 0;
            const lastHandTs = lastHand ? parseInt(lastHand) : 0;
            // Si propone di giocare solo se c'è una mano PERTINENTE da
            // proporre. Senza, si resta sullo studio.
            const suggestPlay = lastLessonTs > lastHandTs && manoPertinente !== null;

            if (suggestPlay && manoPertinente) {
              return (
                <Link href={`/gioca/smazzata?lesson=${manoPertinente.lessonId}`}>
                  <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 dark:bg-primary/15 dark:border-primary/20">
                        <Gamepad2 className="w-5 h-5 text-primary dark:text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-primary dark:text-primary uppercase tracking-wider">{t("Prossimo passo")}</p>
                        <p className="text-sm font-bold text-foreground truncate">{manoPertinente.lessonTitle}</p>
                        <p className="text-xs text-muted-foreground">{t("Gioca una mano su quello che hai appena studiato")}</p>
                      </div>
                      <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                  </div>
                </Link>
              );
            }

            if (nextModule) {
              return (
                <Link href={`/lezioni/${nextModule.lessonId}/${nextModule.moduleId}`}>
                  <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800">
                        <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">{t("Prossimo passo")}</p>
                        <p className="text-sm font-bold text-foreground truncate">{nextModule.moduleTitle}</p>
                        <p className="text-xs text-muted-foreground">{t("Continua il percorso di apprendimento")}</p>
                      </div>
                      <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                  </div>
                </Link>
              );
            }

            return null;
          })()}
        </motion.div>
      </div>
    </section>
  );
}
