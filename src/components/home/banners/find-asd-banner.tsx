"use client";

import { MapPin } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { RigaLink } from "@/components/home/riga-link";

export function FindAsdBanner() {
  const t = useT();
  return (
    <RigaLink
      href="/trova-circolo"
      Icona={MapPin}
      titolo={t("Non hai ancora un'associazione?")}
      testo={t("Trova la tua ASD tra le 146 affiliate FIGB")}
    />
  );
}
