"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/store/use-game-store";

const REFERRED_KEY = "bq_referred_by";
const REFERRAL_XP_AMOUNT = 50;

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
        useGameStore.getState().addXp(REFERRAL_XP_AMOUNT);
        onReferralBonus();
      }
    } catch {}
  }, [searchParams, onReferralBonus]);

  return null;
}
