"use client";

import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { useCatalog } from "@/store/use-catalog-store";
import { usePlayableSmazzate } from "@/store/use-smazzate-store";
import { useGameStore } from "@/store/use-game-store";
import { ultimaLezioneToccata } from "@/lib/prossimo-modulo";
import { RigaLink } from "@/components/home/riga-link";

/**
 * Dopo una lezione, una mano su quello che si è appena studiato.
 *
 * Il ramo «continua col prossimo modulo» non c'è più: lo dice già il riquadro
 * Riprendi in cima alla home, e due inviti alla stessa cosa sono uno di troppo
 * (18/11/2026).
 */
export function SuggestedNextStep() {
  const t = useT();
  const { courses } = useCatalog();
  const smazzate = usePlayableSmazzate();
  const completati = useGameStore((st) => st.completedModules);
  const lezione = ultimaLezioneToccata(courses, completati);
  const quanteMani = lezione ? smazzate.filter((sm) => sm.lesson === lezione.lessonId).length : 0;
  const [dopoLaLezione, setDopoLaLezione] = useState(false);
  useEffect(() => {
    let ts = { lezione: 0, mano: 0 };
    try {
      ts = {
        lezione: Number(localStorage.getItem("bq_last_lesson_ts")) || 0,
        mano: Number(localStorage.getItem("bq_last_hand_ts")) || 0,
      };
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage si legge solo dopo il mount, sul server non c'è
    setDopoLaLezione(ts.lezione > ts.mano);
  }, []);
  if (!lezione || quanteMani === 0 || !dopoLaLezione) return null;
  return (
    <RigaLink
      href={`/gioca/smazzata?lesson=${lezione.lessonId}`}
      Icona={Gamepad2}
      titolo={t("Prossimo passo: {lezione}", { lezione: lezione.lessonTitle })}
      testo={t("Gioca una mano su quello che hai appena studiato")}
    />
  );
}
