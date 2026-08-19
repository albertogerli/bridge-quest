"use client";

import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { espandiSemi, mieNote, salvaNota } from "@/lib/note-smazzate";

/**
 * La nota dell'insegnante su una mano.
 *
 * SEGUE LA MANO, NON IL COMPITO: quella scritta l'anno scorso ricompare
 * quest'anno, in un'altra classe, senza cercarla. Legarla al compito vorrebbe
 * dire riscriverla a ogni corso, cioè non scriverla.
 *
 * I SIMBOLI DEI SEMI SI DIGITANO CON DUE CARATTERI. Sulla tastiera italiana
 * ♠♥♦♣ non ci sono, e chi deve scrivere «picche» dieci volte per riga smette di
 * scrivere note: `!s` diventa ♠ mentre si scrive. Sono due caratteri e si
 * imparano alla prima nota.
 */
export function NotaSmazzata({ smazzataId }: { smazzataId: string }) {
  const [aperta, setAperta] = useState(false);
  const [testo, setTesto] = useState("");
  const [caricata, setCaricata] = useState(false);
  const [salvata, setSalvata] = useState(false);

  useEffect(() => {
    let vivo = true;
    void mieNote([smazzataId]).then((m) => {
      if (!vivo) return;
      setTesto(m.get(smazzataId) ?? "");
      setCaricata(true);
    });
    return () => {
      vivo = false;
    };
  }, [smazzataId]);

  async function salva() {
    await salvaNota(smazzataId, testo);
    setSalvata(true);
    setTimeout(() => setSalvata(false), 1600);
  }

  if (!caricata) return null;

  if (!aperta) {
    return (
      <button
        onClick={() => setAperta(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
      >
        <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
        {testo ? "La tua nota" : "Aggiungi una nota"}
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border p-2">
      <textarea
        value={testo}
        // L'espansione avviene mentre si scrive, non al salvataggio: vedere il
        // simbolo comparire è quello che insegna la scorciatoia.
        onChange={(e) => setTesto(espandiSemi(e.target.value))}
        rows={3}
        placeholder="Come la spieghi tu. Scrivi !s per ♠, !h per ♥, !d per ♦, !c per ♣."
        className="w-full rounded-md border border-border bg-background p-2 text-sm"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <Button size="sm" onClick={() => void salva()}>
          Salva
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setAperta(false)}>
          Chiudi
        </Button>
        {salvata && <span className="text-xs text-primary">salvata ✓</span>}
      </div>
    </div>
  );
}
