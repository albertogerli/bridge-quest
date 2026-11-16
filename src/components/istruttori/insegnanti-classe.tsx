"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  aggiungiInsegnante,
  insegnantiDellaClasse,
  InsegnanteNonAggiunto,
  togliInsegnante,
  type InsegnanteClasse,
} from "@/lib/insegnanti-classe";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Chi insegna in questa classe. Il titolare (chi l'ha creata) aggiunge i
 * colleghi con la loro email; un collega vede tutto e può solo andarsene.
 * Nato da un corso di primo livello tenuto da tre istruttori (16/11/2026).
 */
export function InsegnantiClasse({
  classId,
  onRuolo,
  onUscito,
}: {
  classId: string;
  /** Chi guarda è il titolare? La pagina ci decide se mostrare «Elimina la classe». */
  onRuolo?: (titolare: boolean) => void;
  /** Un collega ha lasciato la classe: non la vede più. */
  onUscito?: () => void;
}) {
  const t = useT();
  const [elenco, setElenco] = useState<InsegnanteClasse[] | null>(null);
  const [mioId, setMioId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [avviso, setAvviso] = useState<string | null>(null);
  const [daTogliere, setDaTogliere] = useState<InsegnanteClasse | null>(null);

  const carica = useCallback(async () => {
    try {
      const [{ data }, righe] = await Promise.all([createClient().auth.getUser(), insegnantiDellaClasse(classId)]);
      setMioId(data.user?.id ?? null);
      setElenco(righe);
    } catch (err) {
      segnalaSalvoRete("classe:insegnanti", err);
      setElenco([]);
    }
  }, [classId]);

  useEffect(() => {
    void carica();
  }, [carica]);

  const titolare = elenco?.find((i) => i.titolare) ?? null;
  const sonoTitolare = !!titolare && titolare.id === mioId;

  useEffect(() => {
    if (elenco && mioId) onRuolo?.(sonoTitolare);
  }, [elenco, mioId, sonoTitolare, onRuolo]);

  async function aggiungi(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setAvviso(null);
    try {
      await aggiungiInsegnante(classId, email);
      setEmail("");
      await carica();
    } catch (err) {
      const motivo = err instanceof InsegnanteNonAggiunto ? err.motivo : "rete";
      if (motivo === "rete") segnalaSalvoRete("classe:aggiungi-insegnante", err);
      setAvviso(
        motivo === "non-trovato"
          ? t("Non trovo un insegnante approvato con questa email. Il collega deve registrarsi su BridgeLab e chiedere di diventare insegnante; quando la FIGB l'ha approvato, lo aggiungi da qui.")
          : motivo === "e-il-titolare"
            ? t("È l'email di chi ha creato la classe: insegna già qui.")
            : motivo === "non-titolare"
              ? t("Solo chi ha creato la classe può aggiungere insegnanti.")
              : t("Non sono riuscito a salvare. Controlla la connessione e riprova."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function togli(chi: InsegnanteClasse) {
    setBusy(true);
    setAvviso(null);
    try {
      await togliInsegnante(classId, chi.id);
      setDaTogliere(null);
      if (chi.id === mioId) {
        onUscito?.();
        return;
      }
      await carica();
    } catch (err) {
      segnalaSalvoRete("classe:togli-insegnante", err);
      setAvviso(t("Non sono riuscito a salvare. Controlla la connessione e riprova."));
    } finally {
      setBusy(false);
    }
  }

  if (!elenco) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{t("Insegnanti della classe")}</CardTitle>
        <CardDescription>
          {sonoTitolare
            ? t("Se il corso lo tenete in più d'uno, aggiungi i colleghi: vedono e gestiscono la classe come te. Solo tu puoi eliminarla e scegliere chi insegna.")
            : t("Insegnate insieme: vedi e gestisci la classe come chi l'ha creata. Solo lui o lei può eliminarla e scegliere chi insegna.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y divide-border rounded-lg border border-border">
          {elenco.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {i.nome || i.email}
                  {i.id === mioId && <span className="font-normal text-muted-foreground"> · {t("tu")}</span>}
                </p>
                {i.nome && i.email && <p className="truncate text-xs text-muted-foreground">{i.email}</p>}
              </div>
              {i.titolare ? (
                <Badge variant="secondary">{t("Ha creato la classe")}</Badge>
              ) : sonoTitolare || i.id === mioId ? (
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => setDaTogliere(i)}>
                  {i.id === mioId ? t("Lascia la classe") : t("Togli")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>

        {sonoTitolare && (
          <form onSubmit={aggiungi} className="space-y-2">
            <label htmlFor="email-collega" className="text-sm font-medium">
              {t("Aggiungi un insegnante")}
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="email-collega"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder={t("email del collega")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              <Button type="submit" disabled={busy || !email.trim()}>
                <UserPlus className="size-4" aria-hidden />
                {t("Aggiungi")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("L'email con cui il collega entra in BridgeLab. Deve essere già approvato come insegnante.")}
            </p>
          </form>
        )}

        {avviso && (
          <p role="alert" className="text-sm text-destructive">
            {avviso}
          </p>
        )}
      </CardContent>

      <Dialog open={daTogliere !== null} onOpenChange={(aperta) => !aperta && setDaTogliere(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {daTogliere?.id === mioId
                ? t("Lasciare la classe?")
                : t("Togliere {nome} dagli insegnanti?", { nome: daTogliere?.nome || daTogliere?.email || "" })}
            </DialogTitle>
            <DialogDescription>
              {daTogliere?.id === mioId
                ? t("Non la vedrai più tra le tue classi. Compiti, risultati e allievi restano come sono; per tornare, chiedi a chi l'ha creata di aggiungerti di nuovo.")
                : t("Non vedrà più la classe. Compiti, risultati e allievi restano come sono; puoi aggiungerlo di nuovo quando vuoi.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDaTogliere(null)}>
              {t("Annulla")}
            </Button>
            <Button disabled={busy} onClick={() => daTogliere && void togli(daTogliere)}>
              {daTogliere?.id === mioId ? t("Lascia la classe") : t("Togli")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
