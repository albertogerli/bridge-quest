"use client";

import { useState } from "react";
import { BookmarkPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Card, Position } from "@/lib/bridge-engine";
import type { Vulnerability } from "@/lib/catalog";
import {
  ETICHETTE_CONSEGNA,
  salvaEsercizio,
  type Consegna,
  type NuovoEsercizio,
} from "@/lib/esercizi-posizione";

const POSTI: { key: Position; nome: string }[] = [
  { key: "south", nome: "Sud" },
  { key: "north", nome: "Nord" },
  { key: "east", nome: "Est" },
  { key: "west", nome: "Ovest" },
];

/**
 * «Salva come esercizio»: da qualsiasi punto di una mano.
 *
 * IL GESTO DEVE COSTARE MENO DI UN MINUTO, o non lo farà nessuno a lezione. Il
 * titolo si propone da solo, la consegna è a tre bottoni, la risposta attesa è
 * un campo — e tutto il resto (mani, dichiarazione fin lì, carte giocate,
 * zona) viene preso dalla posizione senza chiedere niente.
 *
 * LA RISPOSTA ATTESA AMMETTE PIÙ VALORI, separati da virgola: al bridge quasi
 * sempre ce n'è più d'una difendibile, e un esercizio che ne accetta una sola
 * insegna una regola che non esiste.
 *
 * «Come pianifichi il gioco?» non ha risposta confrontabile: il campo sparisce,
 * e la correzione la fa l'insegnante leggendo. Fingere di saperla correggere
 * sarebbe peggio che ammettere che non si può.
 */
export function SalvaEsercizio({
  hands,
  dealer = "south",
  vulnerability = "none",
  bids = [],
  played = [],
  contract,
  declarer,
  classId,
  titoloProposto,
}: {
  hands: Record<Position, Card[]>;
  dealer?: Position;
  vulnerability?: Vulnerability;
  bids?: string[];
  played?: { seat: Position; card: Card }[];
  contract?: string | null;
  declarer?: Position | null;
  classId?: string | null;
  titoloProposto?: string;
}) {
  const [aperto, setAperto] = useState(false);
  const [titolo, setTitolo] = useState(titoloProposto ?? "");
  const [consegna, setConsegna] = useState<Consegna>(played.length > 0 ? "carta" : "dichiara");
  const [domanda, setDomanda] = useState("");
  const [risposte, setRisposte] = useState("");
  const [soluzione, setSoluzione] = useState("");
  const [gruppo, setGruppo] = useState("");
  const [posizione, setPosizione] = useState<Position>("south");
  const [inCorso, setInCorso] = useState(false);
  const [esito, setEsito] = useState<string | null>(null);

  async function salva() {
    setInCorso(true);
    setEsito(null);
    const nuovo: NuovoEsercizio = {
      titolo: titolo.trim() || titoloProposto || "Esercizio",
      consegna,
      domanda: domanda.trim() || null,
      hands,
      dealer,
      vulnerability,
      bids,
      played,
      posizione,
      contract: contract ?? null,
      declarer: declarer ?? null,
      risposte:
        consegna === "piano"
          ? []
          : risposte
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean),
      soluzione: soluzione.trim() || null,
      gruppo: gruppo.trim() || null,
      class_id: classId ?? null,
    };
    const salvato = await salvaEsercizio(nuovo);
    setInCorso(false);
    if (salvato) {
      setEsito("Salvato. Lo trovi fra i tuoi esercizi quando componi un compito.");
      setTimeout(() => {
        setAperto(false);
        setEsito(null);
      }, 2200);
    } else {
      setEsito("Non sono riuscito a salvarlo.");
    }
  }

  if (!aperto) {
    return (
      <Button variant="outline" size="sm" onClick={() => setAperto(true)}>
        <BookmarkPlus className="mr-2 h-4 w-4" aria-hidden="true" />
        Salva come esercizio
      </Button>
    );
  }

  return (
    <div
      data-senza-foto="1"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-xl sm:inset-x-auto sm:right-4 sm:w-96"
    >
      <div className="mb-3 flex items-center gap-2">
        <BookmarkPlus className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-bold">Salva questa posizione</span>
        <button
          onClick={() => setAperto(false)}
          aria-label="Chiudi"
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {esito ? (
        <p className="py-3 text-sm text-primary">{esito}</p>
      ) : (
        <div className="space-y-3">
          <input
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder={titoloProposto ?? "Titolo"}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ETICHETTE_CONSEGNA) as Consegna[]).map((c) => (
              <button
                key={c}
                onClick={() => setConsegna(c)}
                aria-pressed={consegna === c}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  consegna === c ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
                }`}
              >
                {ETICHETTE_CONSEGNA[c]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="posto-esercizio" className="text-sm text-muted-foreground">
              Guarda da
            </label>
            <select
              id="posto-esercizio"
              value={posizione}
              onChange={(e) => setPosizione(e.target.value as Position)}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            >
              {POSTI.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <input
            value={domanda}
            onChange={(e) => setDomanda(e.target.value)}
            placeholder="Domanda (facoltativa)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />

          {consegna !== "piano" && (
            <input
              value={risposte}
              onChange={(e) => setRisposte(e.target.value)}
              placeholder={consegna === "dichiara" ? "Risposte giuste: 3SA, 4♠" : "Carte giuste: ♠A, ♠K"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          )}

          <textarea
            value={soluzione}
            onChange={(e) => setSoluzione(e.target.value)}
            rows={2}
            placeholder="Perché — si apre dopo, con le stesse regole delle soluzioni"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />

          <input
            value={gruppo}
            onChange={(e) => setGruppo(e.target.value)}
            placeholder="Gruppo (es. «Impasse»)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />

          <Button onClick={() => void salva()} disabled={inCorso} className="w-full" size="sm">
            {inCorso ? "Salvo…" : "Salva"}
          </Button>
        </div>
      )}
    </div>
  );
}
