"use client";

import { UserRound } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { RigaLink } from "@/components/home/riga-link";

export function GuestLoginReminder() {
  const t = useT();
  return (
    <RigaLink
      href="/login"
      Icona={UserRound}
      titolo={t("Crea un account gratuito")}
      testo={t("Salva i progressi e sincronizza su tutti i dispositivi. Gratis, senza carta di credito.")}
    />
  );
}
