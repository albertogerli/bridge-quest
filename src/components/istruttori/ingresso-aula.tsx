"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DoorOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  creaInvito,
  indirizzoAula,
  invitoAttivo,
  revocaInvito,
  type InvitoAula,
} from "@/lib/inviti-aula";
import { qrSvg } from "@/lib/qr";
import { linkWhatsApp } from "@/lib/whatsapp";
import { getClassDetail, type ClassMember } from "@/lib/instructors";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il pannello dell'ingresso senza registrazione.
 *
 * IL QR È IL PUNTO. In aula l'insegnante proietta questo riquadro o lo mostra
 * dal telefono, e gli allievi inquadrano: da lì a carte in mano ci sono un
 * campo e un tocco. Copiare un link a mano su venti telefoni non è una
 * procedura, è la fine della lezione.
 *
 * CHI È ENTRATO SI VEDE, e si aggiorna da solo ogni pochi secondi: l'insegnante
 * deve poter dire «manca ancora qualcuno?» guardando lo schermo invece di
 * chiedendolo alla sala.
 */
export function IngressoAula({ classId }: { classId: string }) {
  const t = useT();
  const [invito, setInvito] = useState<InvitoAula | null>(null);
  const [ospiti, setOspiti] = useState<ClassMember[]>([]);
  const [caricando, setCaricando] = useState(true);
  const [occupato, setOccupato] = useState(false);

  const ricarica = useCallback(async () => {
    try {
      const [i, d] = await Promise.all([invitoAttivo(classId), getClassDetail(classId)]);
      setInvito(i);
      setOspiti(d.members);
    } catch (err) {
      reportError("ingresso-aula:carica", err);
    } finally {
      setCaricando(false);
    }
  }, [classId]);

  useEffect(() => {
    void ricarica();
    // Ogni sei secondi: durante l'ingresso di una classe è il ritmo in cui le
    // cose cambiano, e fuori da quel momento sono due letture al minuto.
    const t = setInterval(() => void ricarica(), 6000);
    return () => clearInterval(t);
  }, [ricarica]);

  const indirizzo = invito ? indirizzoAula(invito.token) : "";
  const svg = useMemo(() => (indirizzo ? qrSvg(indirizzo) : ""), [indirizzo]);

  if (caricando) return <div className="h-24 animate-pulse rounded-xl bg-muted" />;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <DoorOpen className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-bold">{t("Ingresso senza registrazione")}</span>
        {invito && (
          <Badge variant="secondary">
            scade alle{" "}
            {new Date(invito.scade_il).toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Badge>
        )}
      </div>

      {!invito ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("Genera un link valido fino a stasera: chi lo inquadra entra scrivendo solo il proprio nome, senza email e senza password.")}
          </p>
          <Button
            disabled={occupato}
            onClick={async () => {
              setOccupato(true);
              await creaInvito(classId);
              await ricarica();
              setOccupato(false);
            }}
          >
            {t("Genera il link d’ingresso")}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-4">
            <div
              className="w-40 shrink-0"
              // Generato in casa: i codici delle classi non escono da qui.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Da proiettare o da mostrare")}
              </p>
              <p className="mb-3 break-all font-mono text-xs text-muted-foreground">{indirizzo}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={linkWhatsApp(
                    `Ci vediamo in aula su BridgeLab. Apri questo link e scrivi il tuo nome:\n\n${indirizzo}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline">
                    {t("Manda su WhatsApp")}
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={occupato}
                  onClick={async () => {
                    setOccupato(true);
                    await revocaInvito(invito.id);
                    await creaInvito(classId);
                    await ricarica();
                    setOccupato(false);
                  }}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  {t("Nuovo link")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={occupato}
                  onClick={async () => {
                    setOccupato(true);
                    await revocaInvito(invito.id);
                    await ricarica();
                    setOccupato(false);
                  }}
                >
                  {t("Chiudi l’ingresso")}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              In aula adesso ({ospiti.length})
            </p>
            {ospiti.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Nessuno ancora. Il codice è lì.")}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {ospiti.map((o) => (
                  <span
                    key={o.student_id}
                    className="rounded-full bg-muted px-2.5 py-1 text-sm font-medium"
                  >
                    {o.display_name ?? "Senza nome"}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
