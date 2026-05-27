"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const REFERRED_KEY = "bq_referred_by";
const REFERRAL_XP_AMOUNT = 50;
const XP_KEY = "bq_xp";

interface ReferralHandlerProps {
  onReferralBonus: () => void;
}

export function ReferralHandler({ onReferralBonus }: ReferralHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const ref = searchParams.get("ref");
      if (ref && !localStorage.getItem(REFERRED_KEY)) {
        localStorage.setItem(REFERRED_KEY, ref);
        // Award 50 XP bonus to the new referred user
        const prev = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
        localStorage.setItem(XP_KEY, String(prev + REFERRAL_XP_AMOUNT));
        onReferralBonus();
      }
    } catch {}
  }, [searchParams, onReferralBonus]);

  return null;
}
