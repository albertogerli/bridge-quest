"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";
import { resolveNames } from "@/lib/instructors";
import { segnalaSalvoRete } from "@/lib/report-error";
import { sbloccaUtente } from "@/lib/moderazione";
import { useBloccati } from "./azioni-contenuto";

/** Nelle Impostazioni: chi si è bloccato, con il modo di sbloccarlo. */
export function UtentiBloccati() {
  const t = useT();
  const bloccati = useBloccati(true);
  const [nomi, setNomi] = useState<Map<string, string | null>>(new Map());
  const chiave = [...bloccati].sort().join(",");

  useEffect(() => {
    if (!chiave) return;
    let vivo = true;
    resolveNames(chiave.split(","))
      .then((m) => {
        if (vivo) setNomi(m);
      })
      .catch((err) => segnalaSalvoRete("moderazione:nomi-bloccati", err));
    return () => {
      vivo = false;
    };
  }, [chiave]);

  return (
    <div className="card-clean bg-card rounded-2xl p-5 shadow-sm border border-border">
      <h2 className="font-semibold text-foreground text-base">{t("Utenti bloccati")}</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        {t("Non vedi i loro post, commenti e messaggi. Si blocca dal pulsante «Segnala» accanto a un messaggio.")}
      </p>
      {bloccati.size === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Nessuno.")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {[...bloccati].map((id) => (
            <li key={id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>{nomi.get(id) || t("Utente")}</span>
              <Button size="sm" variant="outline" onClick={() => void sbloccaUtente(id)}>
                {t("Sblocca")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
