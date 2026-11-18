"use client";

import { BookOpen } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { RigaLink } from "@/components/home/riga-link";

export function PrimaManoBanner() {
  const t = useT();
  return (
    <RigaLink
      href="/prima-mano"
      Icona={BookOpen}
      titolo={t("Hai 3 minuti? Prova Prima Mano")}
      testo={t("Impara le basi del bridge e guadagna +50 XP")}
    />
  );
}
