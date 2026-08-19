"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/contexts/traduzioni-provider";

interface MarketingConsentBannerProps {
  user: { id: string } | null;
  marketingConsent: boolean | null;
}

export function MarketingConsentBanner({
  user,
  marketingConsent,
}: MarketingConsentBannerProps) {
  const t = useT();
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Show only when user is logged in and has never been asked
    if (!user || marketingConsent !== null) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, marketingConsent]);

  const handleChoice = async (consent: boolean) => {
    if (!user) return;

    setExiting(true);

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        marketing_consent: consent,
        marketing_consent_date: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Let exit animation play, then hide
    setTimeout(() => setShow(false), 400);
  };

  return (
    <AnimatePresence>
      {show && !exiting && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-0 right-0 z-[55] flex justify-center"
        >
          <div className="w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-xl p-6">
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full text-white bg-figb">
                <Bell className="w-5 h-5" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-center text-base font-bold text-foreground mb-2">
              {t("Resta aggiornato sul mondo del Bridge")}
            </h3>

            {/* Description */}
            <p className="text-center text-sm text-muted-foreground leading-relaxed mb-5">
              {t("Vuoi ricevere aggiornamenti su eventi, corsi e tornei di bridge dalla FIGB? Solo informazioni utili per la tua crescita nel bridge, niente spam.")}
            </p>

            {/* Accept button */}
            <button
              onClick={() => handleChoice(true)}
              className="w-full py-3 rounded-xl bg-figb hover:bg-figb-dark text-white text-sm font-bold transition-colors active:scale-[0.98]"
            >
              {t("Sì, tienimi aggiornato")}
            </button>

            {/* Decline button */}
            <button
              onClick={() => handleChoice(false)}
              className="w-full py-2.5 mt-2 text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              {t("No grazie")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
