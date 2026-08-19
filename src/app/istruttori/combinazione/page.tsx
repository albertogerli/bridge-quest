"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Briciole } from "@/components/briciole";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { ProvaDaQui } from "@/components/bridge/prova-da-qui";
import { SalvaEsercizio } from "@/components/istruttori/salva-esercizio";
import { ComandoProiezione } from "@/components/istruttori/comando-proiezione";
import { COMBINAZIONI, problemiDi, type Combinazione } from "@/lib/combinazioni";
import type { Card, Position, Rank, Suit } from "@/lib/bridge-engine";
import { useT } from "@/contexts/traduzioni-provider";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const RANGHI: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"] as Rank[];
const POSTI: { key: Position; nome: string }[] = [
  { key: "north", nome: "Nord" },
  { key: "west", nome: "Ovest" },
  { key: "east", nome: "Est" },
  { key: "south", nome: "Sud" },
];

const VUOTE: Record<Position, Card[]> = { north: [], east: [], south: [], west: [] };

/**
 * L'editor delle posizioni parziali.
 *
 * PERCHÉ SERVE. Metà della didattica del gioco della carta si fa su quattro
 * carte, non su tredici: «AQ in mano e 32 al morto, come fai due prese» è una
 * lezione intera, e darla dentro una smazzata completa vuol dire nasconderla
 * fra dodici prese che non c'entrano.
 *
 * SI COMPONE TOCCANDO LE CARTE, non scrivendo una notazione. L'insegnante di
 * primo livello non impara una sintassi per mettere tre carte su un tavolo, e
 * ogni riga di notazione è un modo di sbagliare in silenzio.
 *
 * I CONTROLLI SONO PRIMA, NON DOPO. Una carta ripetuta in due mani non dà
 * nessun errore al motore: produce un gioco impossibile, e chi lo scopre è
 * l'allievo davanti a una combinazione che non torna.
 *
 * LE COMBINAZIONI CLASSICHE SONO GIÀ LÌ. Il primo gesto di chi apre questa
 * pagina non deve essere comporre: deve essere scegliere l'impasse e
 * proiettarlo.
 */
export default function CombinazionePage() {
  const t = useT();
  const [hands, setHands] = useState<Record<Position, Card[]>>(VUOTE);
  const [atout, setAtout] = useState<Suit | null>(null);
  const [postoAttivo, setPostoAttivo] = useState<Position>("south");
  const [descrizione, setDescrizione] = useState("");
  const [gioca, setGioca] = useState(false);

  const problemi = useMemo(() => problemiDi(hands), [hands]);
  const pronta = problemi.length === 0;

  /** Dove sta questa carta adesso, se sta da qualche parte. */
  function dove(carta: Card): Position | null {
    for (const p of POSTI) {
      if ((hands[p.key] ?? []).some((c) => c.suit === carta.suit && c.rank === carta.rank)) {
        return p.key;
      }
    }
    return null;
  }

  /**
   * Un tocco assegna la carta al posto attivo; un secondo tocco la toglie.
   *
   * Una carta che sta già altrove si SPOSTA invece di duplicarsi: è quello che
   * ci si aspetta muovendo carte su un tavolo, ed è anche l'unico modo di non
   * creare doppioni per distrazione.
   */
  function tocca(carta: Card) {
    const attuale = dove(carta);
    setHands((prev) => {
      const nuovo: Record<Position, Card[]> = {
        north: [...prev.north],
        east: [...prev.east],
        south: [...prev.south],
        west: [...prev.west],
      };
      if (attuale) {
        nuovo[attuale] = nuovo[attuale].filter(
          (c) => !(c.suit === carta.suit && c.rank === carta.rank),
        );
      }
      if (attuale !== postoAttivo) nuovo[postoAttivo] = [...nuovo[postoAttivo], carta];
      return nuovo;
    });
  }

  function carica(c: Combinazione) {
    setHands(c.hands);
    setAtout(c.atout);
    setDescrizione(`${c.nome} — ${c.obiettivo}`);
    setGioca(false);
  }

  const contratto = atout
    ? `1${{ spade: "♠", heart: "♥", diamond: "♦", club: "♣" }[atout]}`
    : "1SA";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: "Le tue classi", href: "/istruttori" },
          { etichetta: "Combinazioni" },
        ]}
      />
      <h1 className="mb-1 flex items-center gap-2 font-display text-3xl font-bold">
        <Layers className="h-6 w-6 text-primary" aria-hidden="true" />
        {t("Combinazioni di carte")}
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {t("Componi una posizione con poche carte per posto. Serve a mostrare una combinazione senza nasconderla dentro una smazzata intera.")}
      </p>

      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("Le classiche, già pronte")}
        </p>
        <div className="flex flex-wrap gap-2">
          {COMBINAZIONI.map((c) => (
            <button
              key={c.id}
              onClick={() => carica(c)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted/60"
              title={c.descrizione}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      {!gioca && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("Sto riempiendo:")}</span>
            {POSTI.map((p) => (
              <button
                key={p.key}
                onClick={() => setPostoAttivo(p.key)}
                aria-pressed={postoAttivo === p.key}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                  postoAttivo === p.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/70"
                }`}
              >
                {p.nome} ({hands[p.key].length})
              </button>
            ))}
            <span className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("Atout:")}</span>
              <select
                value={atout ?? ""}
                onChange={(e) => setAtout((e.target.value || null) as Suit | null)}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
              >
                <option value="">senza</option>
                {SEMI.map((s) => (
                  <option key={s} value={s}>
                    {{ spade: "picche", heart: "cuori", diamond: "quadri", club: "fiori" }[s]}
                  </option>
                ))}
              </select>
            </span>
          </div>

          <div className="mb-4 space-y-1.5">
            {SEMI.map((s) => (
              <div key={s} className="flex flex-wrap items-center gap-1">
                <SuitSymbol suit={s} size="md" />
                {RANGHI.map((r) => {
                  const carta = { suit: s, rank: r } as Card;
                  const p = dove(carta);
                  return (
                    <button
                      key={r}
                      onClick={() => tocca(carta)}
                      className={`h-8 w-8 rounded border text-sm font-bold transition-colors ${
                        p
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                      title={p ? POSTI.find((x) => x.key === p)?.nome : "libera"}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {problemi.length > 0 && (
            <ul className="mb-4 space-y-1">
              {problemi.map((p, i) => (
                <li key={i} className="text-sm text-destructive">
                  {p.messaggio}
                </li>
              ))}
            </ul>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            <Button disabled={!pronta} onClick={() => setGioca(true)}>
              {t("Prova la posizione")}
            </Button>
            <Button variant="outline" onClick={() => setHands(VUOTE)}>
              {t("Svuota")}
            </Button>
            {pronta && (
              <SalvaEsercizio
                hands={hands}
                contract={contratto}
                declarer="south"
                titoloProposto={descrizione || "Combinazione"}
              />
            )}
            {pronta && <ComandoProiezione mani={hands} titolo={descrizione || "Combinazione"} />}
          </div>
        </>
      )}

      {gioca && pronta && (
        <ProvaDaQui
          hands={hands}
          contract={contratto}
          declarer="south"
          onChiudi={() => setGioca(false)}
        />
      )}
    </div>
  );
}
