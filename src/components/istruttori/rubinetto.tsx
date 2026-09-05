"use client";

import { useState } from "react";
import type { AccessoLibero, Gruppo } from "@/lib/permessi-allievo";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Quanto del portale l'insegnante ha aperto alla sua classe.
 *
 * TRE POSIZIONI E NON DIECI INTERRUTTORI. Un elenco di dieci funzioni da
 * spuntare, davanti a un insegnante con quaranta iscritti da approvare, non lo
 * tocca nessuno — e il valore iniziale diventa l'unica cosa che esiste.
 * Il cursore è la forma che Trevissoi descrive: qualcosa che si apre man mano
 * che il corso procede.
 *
 * SI DICE COSA SUCCEDE, NON SI FA DEDURRE. Sotto ogni posizione c'è l'elenco
 * di cosa vedrà l'allievo. Un insegnante che deve indovinare l'effetto di un
 * comando non lo usa, o peggio lo usa e poi si stupisce.
 *
 * SI CAMBIA IN DIECI SECONDI DA TELEFONO. Lo farà a fine lezione mentre chiude
 * la sala, non seduto al computer: tre bersagli grandi, nessun modulo da
 * confermare, il salvataggio parte al tocco.
 *
 * CHIUDERLO NON INTERROMPE NIENTE. Le funzioni ludiche non sono mai vietate —
 * il server non rifiuta — quindi chi sta giocando in quel momento continua, e
 * il cambiamento si vede dalla visita successiva. È scritto anche
 * nell'interfaccia, perché è la prima cosa che un insegnante teme di combinare.
 */

const POSIZIONI: { valore: AccessoLibero; titolo: string; spiega: string }[] = [
  {
    valore: "solo-il-corso",
    titolo: "Solo il corso",
    spiega: "Compiti, percorso e materiali del corso. Niente giochi, tornei o classifica.",
  },
  {
    valore: "con-pratica-libera",
    titolo: "Corso e pratica libera",
    spiega: "Si aggiungono esercizi liberi e mini-giochi. Ancora niente tornei né classifica.",
  },
  {
    valore: "tutto-aperto",
    titolo: "Tutto aperto",
    spiega: "Tornei, sfide, forum, classifica e negozio. Il portale intero.",
  },
];

const GRUPPI: { valore: Gruppo; nome: string }[] = [
  { valore: "pratica", nome: "Esercizi liberi" },
  { valore: "minigiochi", nome: "Mini-giochi" },
  { valore: "sfide", nome: "Tornei e sfide" },
  { valore: "sociale", nome: "Forum, classifica, negozio" },
];

export function Rubinetto({
  accessoLibero,
  permessi,
  busy,
  onCambia,
}: {
  accessoLibero: AccessoLibero;
  permessi: Partial<Record<Gruppo, boolean>>;
  busy: boolean;
  onCambia: (campi: {
    accesso_libero?: AccessoLibero;
    permessi?: Partial<Record<Gruppo, boolean>>;
  }) => void;
}) {
  const t = useT();
  const [avanzateAperte, setAvanzateAperte] = useState(false);

  return (
    <div className="space-y-3">
      {POSIZIONI.map((p) => {
        const scelta = accessoLibero === p.valore;
        return (
          <button
            key={p.valore}
            disabled={busy}
            // Muovere il cursore azzera le eccezioni: altrimenti l'insegnante
            // sposta la leva e non cambia niente, perché una regola di ieri —
            // che non ricorda di aver messo — continua a comandare.
            onClick={() => onCambia({ accesso_libero: p.valore, permessi: {} })}
            className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
              scelta ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  scelta ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                }`}
              >
                {scelta ? "✓" : ""}
              </span>
              <span className="font-semibold">{t(p.titolo)}</span>
            </span>
            <span className="mt-1.5 block pl-9 text-sm text-muted-foreground">
              {t(p.spiega)}
            </span>
          </button>
        );
      })}

      {accessoLibero === "personalizzato" && (
        <p className="rounded-lg bg-muted/60 p-3 text-sm">
          {t("Stai usando una combinazione tua. Tocca una delle tre righe qui sopra per tornare a una scelta semplice.")}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {t("Chiudere non interrompe chi sta giocando in questo momento: il cambiamento si vede dalla volta dopo.")}
      </p>

      <button
        onClick={() => setAvanzateAperte((v) => !v)}
        className="min-h-11 text-sm text-muted-foreground underline underline-offset-4"
      >
        {avanzateAperte ? t("Nascondi le voci una per una") : t("Scegli voce per voce")}
      </button>

      {avanzateAperte && (
        <div className="space-y-1 rounded-xl border border-border p-3">
          {GRUPPI.map((g) => {
            // Con `personalizzato` comanda solo l'eccezione; con una posizione
            // del cursore, l'eccezione mancante segue il cursore.
            const daCursore =
              accessoLibero === "tutto-aperto" ||
              (accessoLibero === "con-pratica-libera" &&
                (g.valore === "pratica" || g.valore === "minigiochi"));
            const aperto = permessi[g.valore] ?? daCursore;
            return (
              <label key={g.valore} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary"
                  checked={aperto}
                  disabled={busy}
                  onChange={(e) =>
                    onCambia({
                      accesso_libero: "personalizzato",
                      permessi: { ...permessi, [g.valore]: e.target.checked },
                    })
                  }
                />
                {t(g.nome)}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
