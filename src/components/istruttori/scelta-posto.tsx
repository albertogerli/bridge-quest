"use client";

import { useState } from "react";
import type { Position } from "@/lib/bridge-engine";
import { siediti, type EsitoPosto } from "@/lib/aula";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * I quattro posti del tavolo, con chi c'è già.
 *
 * SI VEDE CHI È SEDUTO, e non è cortesia: il metodo cura gli accoppiamenti per
 * età e affinità, e una parte del lavoro la fanno gli allievi stessi sedendosi
 * vicino a chi conoscono. Con i posti anonimi l'insegnante ricomporrebbe i
 * tavoli a mano ogni sera.
 *
 * UN POSTO OCCUPATO NON SI PUÒ PRENDERE PER SBAGLIO. In una sala dove venti
 * persone entrano insieme, due che toccano lo stesso posto nello stesso istante
 * è la sera normale: decide il database, e chi arriva secondo legge «quel posto
 * l'ha appena preso Maria». Un'informazione, non un errore — l'errore fa alzare
 * la mano e chiamare l'insegnante.
 *
 * La disposizione segue il tavolo vero: Nord in alto, Sud in basso, Ovest a
 * sinistra, Est a destra. Chi ha giocato una volta sa dov'è seduto senza
 * leggere l'etichetta.
 */

const NOME: Record<Position, string> = {
  north: "Nord", south: "Sud", east: "Est", west: "Ovest",
};

function PostoTavolo({
  posto, nome, mio, disabilitato, onPrendi, t,
}: {
  posto: Position;
  nome: string | null;
  mio: boolean;
  disabilitato: boolean;
  onPrendi: (p: Position) => void;
  t: (s: string) => string;
}) {
  const libero = nome === null;
  return (
    <button
      disabled={!libero || disabilitato}
      onClick={() => onPrendi(posto)}
      className={`flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-3 py-2 text-center transition-colors ${
        mio
          ? "border-primary bg-primary/10"
          : libero
            ? "border-dashed border-border hover:border-primary hover:bg-muted/40"
            : "border-border bg-muted/60"
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {t(NOME[posto])}
      </span>
      <span className={`mt-0.5 text-sm ${mio ? "font-bold text-primary" : libero ? "text-muted-foreground" : "font-medium"}`}>
        {mio ? t("Tu") : (nome ?? t("libero"))}
      </span>
    </button>
  );
}

export function SceltaPosto({
  tavoloId,
  postiOccupati,
  nomi,
  ioSono,
  onCambiato,
}: {
  tavoloId: string;
  /** Da `seat_of`: chi siede dove. */
  postiOccupati: Record<string, Position>;
  nomi: Map<string, string>;
  ioSono: string | null;
  onCambiato: () => void;
}) {
  const t = useT();
  const [inCorso, setInCorso] = useState<Position | null>(null);
  const [messaggio, setMessaggio] = useState<string | null>(null);

  const chiSiede = (posto: Position): string | null => {
    const id = Object.keys(postiOccupati).find((k) => postiOccupati[k] === posto);
    return id ? (nomi.get(id) ?? "Un compagno") : null;
  };
  const mioPosto = ioSono ? postiOccupati[ioSono] : undefined;

  async function prendi(posto: Position) {
    setInCorso(posto);
    setMessaggio(null);
    const esito: EsitoPosto = await siediti(tavoloId, posto);
    setInCorso(null);
    switch (esito.esito) {
      case "seduto":
        onCambiato();
        break;
      case "occupato":
        // Il nome, non un codice: chi legge capisce e sceglie un altro posto.
        setMessaggio(`${t("Quel posto l'ha appena preso")} ${esito.da}.`);
        onCambiato();
        break;
      case "tavolo-chiuso":
        setMessaggio(t("Questo tavolo è stato chiuso."));
        break;
      case "non-della-classe":
        setMessaggio(t("Non risulti iscritto a questa classe."));
        break;
      default:
        setMessaggio(t("Non sono riuscito a farti sedere. Riprova."));
    }
  }

  return (
    <div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        <div />
        <PostoTavolo
          posto="north" nome={chiSiede("north")} mio={mioPosto === "north"}
          disabilitato={inCorso !== null} onPrendi={(p) => void prendi(p)} t={t}
        />
        <div />
        <PostoTavolo
          posto="west" nome={chiSiede("west")} mio={mioPosto === "west"}
          disabilitato={inCorso !== null} onPrendi={(p) => void prendi(p)} t={t}
        />
        <div className="flex items-center justify-center rounded-xl bg-[#1B5E3B]/10 text-xs text-muted-foreground">
          {t("tavolo")}
        </div>
        <PostoTavolo
          posto="east" nome={chiSiede("east")} mio={mioPosto === "east"}
          disabilitato={inCorso !== null} onPrendi={(p) => void prendi(p)} t={t}
        />
        <div />
        <PostoTavolo
          posto="south" nome={chiSiede("south")} mio={mioPosto === "south"}
          disabilitato={inCorso !== null} onPrendi={(p) => void prendi(p)} t={t}
        />
        <div />
      </div>
      {messaggio && (
        <p className="mt-3 text-center text-sm text-muted-foreground">{messaggio}</p>
      )}
      {!mioPosto && !messaggio && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {t("Tocca un posto libero per sederti.")}
        </p>
      )}
    </div>
  );
}
