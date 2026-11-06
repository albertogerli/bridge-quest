"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il collegamento di un compito, da mandare agli allievi su WhatsApp o per
 * email.
 *
 * Il compito compare già nella pagina della classe di ogni allievo; il link
 * serve perché gli insegnanti la classe la tengono su WhatsApp, e lì lo
 * mandano a fine lezione (Trevissoi, 06/11/2026: «non ho capito come possa
 * generare un link da veicolare a mezzo whatsapp o email»). Chi lo apre senza
 * aver fatto l'accesso passa dal login e torna qui.
 */
export function LinkCompito({ classId, assignmentId, titolo }: { classId: string; assignmentId: string; titolo: string }) {
  const t = useT();
  const [copiato, setCopiato] = useState(false);
  // L'indirizzo del sito, non quello della finestra: è lo stesso sul server e
  // nel browser, e da un'anteprima di prova non si manda in giro un link finto.
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(/\/$/, "");
  const url = `${base}/classi/${classId}/compito/${assignmentId}`;
  const messaggio = t("Il compito «{titolo}» è su BridgeLab: {url}", { titolo, url });

  async function copia() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    } catch {
      // Senza permesso agli appunti resta il campo da selezionare a mano.
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-sm font-semibold">{t("Il link per gli allievi")}</p>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={t("Il link per gli allievi")}
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void copia()}>
          {copiato ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copiato ? t("Copiato") : t("Copia il link")}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(messaggio)}`} target="_blank" rel="noopener">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={`mailto:?subject=${encodeURIComponent(titolo)}&body=${encodeURIComponent(messaggio)}`}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            {t("Email")}
          </a>
        </Button>
      </div>
    </div>
  );
}
