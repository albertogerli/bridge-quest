"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSharedAuth } from "@/contexts/auth-provider";
import {
  cercaPerCodice, linkInvito, mioCodice, messaggioInvito, normalizzaCodice,
} from "@/lib/codice-amico";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Invitare un amico senza cercarlo per nome.
 *
 * PERCHÉ TRE STRADE
 * Il codice si detta al telefono, il link si manda su WhatsApp, e chi il
 * codice l'ha ricevuto lo incolla nel campo. Sono modi diversi perché sono
 * situazioni diverse, e la nostra è la generazione che al circolo ci va
 * davvero.
 *
 * NIENTE QR, per ora. Il piano lo chiede e ha senso — al circolo due persone
 * sono nella stessa stanza e inquadrare è più veloce che trascrivere — ma
 * serve un encoder vero, e non abbiamo la libreria. Un pulsante «QR» che
 * mostra un rettangolo di testo è peggio di un pulsante che non c'è: promette
 * e non mantiene. Si aggiunge quando si aggiunge la dipendenza.
 */
export function InvitoAmico({ onTrovato }: { onTrovato?: (id: string, nome: string | null) => void }) {
  const t = useT();
  const { user, profile } = useSharedAuth();
  const [codice, setCodice] = useState<string | null>(null);
  const [copiato, setCopiato] = useState(false);
  const [inserito, setInserito] = useState("");
  const [trovato, setTrovato] = useState<{ id: string; nome: string | null } | null>(null);
  const [cercando, setCercando] = useState(false);
  const [nonTrovato, setNonTrovato] = useState(false);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    mioCodice().then((c) => { if (vivo) setCodice(c); });
    return () => { vivo = false; };
  }, [user]);

  if (!user) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = codice ? linkInvito(origin, codice) : "";
  const messaggio = messaggioInvito(profile?.display_name ?? null, link);

  const copia = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    } catch (err) {
      reportError("invito:copia", err);
    }
  };

  const cerca = async () => {
    const c = normalizzaCodice(inserito);
    if (c.length < 6) return;
    setCercando(true);
    setNonTrovato(false);
    const r = await cercaPerCodice(c);
    setCercando(false);
    if (r) {
      setTrovato(r);
      onTrovato?.(r.id, r.nome);
    } else {
      setNonTrovato(true);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="invito-amico">
      <h2 id="invito-amico" className="font-semibold mb-1 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-figb" aria-hidden="true" />
        {t("Aggiungi un amico")}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t("Serve per licitare in due, sfidarsi e allenarsi insieme.")}
      </p>

      {/* Il mio codice */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {t("Il tuo codice")}
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-mono text-2xl font-bold tracking-[0.2em] bg-muted rounded-xl px-4 py-2">
          {codice ?? "······"}
        </span>
        <Button variant="outline" onClick={copia} disabled={!codice}>
          {copiato ? <Check className="w-4 h-4 mr-1" aria-hidden="true" /> : <Copy className="w-4 h-4 mr-1" aria-hidden="true" />}
          {copiato ? "Copiato" : "Copia link"}
        </Button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(messaggio)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" disabled={!codice}>
            <Share2 className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("WhatsApp")}
          </Button>
        </a>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {t("Dettalo al telefono o mandalo: chi ce l'ha può aggiungerti.")}
      </p>

      {/* Ho un codice */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 mt-5">
        {t("Hai il codice di un amico?")}
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={inserito}
          onChange={(e) => { setInserito(normalizzaCodice(e.target.value)); setNonTrovato(false); }}
          placeholder="ABC234"
          inputMode="text"
          autoCapitalize="characters"
          aria-label={t("Codice dell'amico")}
          className="h-12 w-40 px-3 rounded-xl border border-border bg-card font-mono text-lg tracking-widest uppercase"
        />
        <Button onClick={cerca} disabled={normalizzaCodice(inserito).length < 6 || cercando}>
          {cercando ? "Cerco…" : "Cerca"}
        </Button>
      </div>

      {nonTrovato && (
        <p className="text-sm text-muted-foreground mt-2">
          {t("Nessuno con questo codice. Controlla che sia scritto giusto — le lettere che si confondono (O, I, L, S) non ci sono mai.")}
        </p>
      )}

      {trovato && (
        <p className="text-sm mt-2">
          {t("Trovato:")} <strong>{trovato.nome ?? "un giocatore"}</strong>. Mandagli
          la richiesta dall&apos;elenco qui sotto.
        </p>
      )}
    </section>
  );
}
