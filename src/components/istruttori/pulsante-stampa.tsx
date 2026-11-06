"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";

/** «Stampa o salva in PDF», per le pagine fatte per la carta. Su carta non si vede. */
export function PulsanteStampa() {
  const t = useT();
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4" aria-hidden="true" />
      {t("Stampa o salva in PDF")}
    </Button>
  );
}
