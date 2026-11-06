"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Briciole } from "@/components/briciole";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { ProvaDaQui } from "@/components/bridge/prova-da-qui";
import { SalvaEsercizio } from "@/components/istruttori/salva-esercizio";
import { ComandoProiezione } from "@/components/istruttori/comando-proiezione";
import { COMBINAZIONI, problemiDi, siProietta, type Combinazione } from "@/lib/combinazioni";
import { cancellaFigura, elencaFigure, salvaFigura, type FiguraSalvata } from "@/lib/figure-insegnante";
import type { Card, Position, Rank, Suit } from "@/lib/bridge-engine";
import { useT } from "@/contexts/traduzioni-provider";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const RANGHI: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"] as Rank[];
/** In senso orario, come si gioca: Nord, Est, Sud, Ovest. */
const POSTI: { key: Position; nome: string }[] = [
  { key: "north", nome: "Nord" },
  { key: "east", nome: "Est" },
  { key: "south", nome: "Sud" },
  { key: "west", nome: "Ovest" },
];

/**
 * Le mani a croce, come nei diagrammi dei libri: Nord sopra, Sud sotto, Ovest
 * a sinistra, Est a destra. In fila (N, O, E, S) non si vedeva chi sta dietro
 * a chi, che in un impasse è tutto (Trevissoi, 06/11/2026).
 */
const CROCE: Record<Position, string> = {
  north: "col-start-2 row-start-1",
  west: "col-start-1 row-start-2",
  east: "col-start-3 row-start-2",
  south: "col-start-2 row-start-3",
};

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
  /** Si gioca e si salva come esercizio: mani pari, niente doppioni. */
  const pronta = problemi.length === 0;
  /** Si proietta e si salva come figura: basta che non ci siano doppioni. */
  const proiettabile = siProietta(problemi);

  const [figure, setFigure] = useState<FiguraSalvata[] | null>(null);
  const [nomeFigura, setNomeFigura] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [esitoFigura, setEsitoFigura] = useState<string | null>(null);
  const ricaricaFigure = useCallback(async () => {
    setFigure(await elencaFigure());
  }, []);
  // Arrivando da «Le mie figure» nei materiali (?figura=…) la figura si apre
  // già composta. Dall'indirizzo e non da useSearchParams, che vorrebbe tutta
  // la pagina dentro Suspense.
  useEffect(() => {
    let vivo = true;
    void elencaFigure().then((elenco) => {
      if (!vivo) return;
      setFigure(elenco);
      const cercata = new URLSearchParams(window.location.search).get("figura");
      const f = cercata ? elenco?.find((x) => x.id === cercata) : undefined;
      if (f) {
        setHands(f.mani);
        setAtout(f.atout);
        setDescrizione(f.nome);
        setNomeFigura(f.nome);
      }
    });
    return () => {
      vivo = false;
    };
  }, []);

  function apriFigura(f: FiguraSalvata) {
    setHands(f.mani);
    setAtout(f.atout);
    setDescrizione(f.nome);
    setNomeFigura(f.nome);
    setGioca(false);
    setEsitoFigura(null);
  }

  async function salvaComeFigura() {
    const nome = nomeFigura.trim();
    if (!nome || !proiettabile) return;
    setSalvando(true);
    setEsitoFigura(null);
    const id = await salvaFigura(nome, hands, atout);
    setSalvando(false);
    if (id) {
      setDescrizione(nome);
      setEsitoFigura(t("Salvata fra «Le mie figure»."));
      await ricaricaFigure();
    } else {
      setEsitoFigura(t("Non salvata. Controlla la connessione e riprova."));
    }
  }

  async function eliminaFigura(f: FiguraSalvata) {
    if (!confirm(t("Eliminare la figura «{nome}»?", { nome: f.nome }))) return;
    if (await cancellaFigura(f.id)) await ricaricaFigure();
  }

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
        {t("Componi una posizione con poche carte per posto. Serve a mostrare una combinazione senza nasconderla dentro una smazzata intera. Anche un seme solo, con un numero di carte diverso per posto: quella è una figura, si proietta e si salva con un nome.")}
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

          {/* Le quattro mani in chiaro: prima la griglia mostrava solo «carta
              presa / libera», e non si capiva a chi fosse andata una carta né
              cosa contenesse un esempio appena caricato. */}
          <div className="mb-4 grid grid-cols-3 grid-rows-3 gap-2">
            {POSTI.map((posto) => (
              <button
                key={posto.key}
                type="button"
                onClick={() => setPostoAttivo(posto.key)}
                className={`${CROCE[posto.key]} min-w-0 rounded-lg border p-2 text-left text-sm ${
                  postoAttivo === posto.key ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(posto.nome)}</p>
                {SEMI.map((seme) => {
                  const carte = hands[posto.key]
                    .filter((c) => c.suit === seme)
                    .sort((a, b) => RANGHI.indexOf(a.rank) - RANGHI.indexOf(b.rank));
                  return (
                    <p key={seme} className="flex items-center gap-1 font-mono text-sm leading-6">
                      <SuitSymbol suit={seme} size="xs" />
                      <span>{carte.length ? carte.map((c) => c.rank).join(" ") : "—"}</span>
                    </p>
                  );
                })}
              </button>
            ))}
          </div>

          <div className="mb-4 space-y-1.5">
            {SEMI.map((s) => (
              <div key={s} className="flex flex-wrap items-center gap-1">
                <SuitSymbol suit={s} size="md" />
                {RANGHI.map((r) => {
                  const carta = { suit: s, rank: r } as Card;
                  const p = dove(carta);
                  const nomeDi = p ? t(POSTI.find((x) => x.key === p)?.nome ?? "") : "";
                  return (
                    <button
                      key={r}
                      onClick={() => tocca(carta)}
                      aria-label={p ? `${r} — ${nomeDi}` : `${r} — ${t("libera")}`}
                      className={`relative h-8 w-8 rounded border text-sm font-bold transition-colors ${
                        p === postoAttivo
                          ? "border-primary bg-primary text-primary-foreground"
                          : p
                            ? "border-border bg-muted text-muted-foreground"
                            : "border-border hover:bg-muted"
                      }`}
                      title={p ? nomeDi : t("libera")}
                    >
                      {r}
                      {p && p !== postoAttivo && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-foreground px-1 text-[12px] leading-4 text-background">
                          {nomeDi.charAt(0)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {problemi.length > 0 && (
            <ul className="mb-4 space-y-1">
              {problemi.map((p, i) =>
                p.campo === "lunghezza" && proiettabile ? (
                  <li key={i} className="text-sm text-muted-foreground">
                    {t("I posti hanno un numero di carte diverso ({l}): è una figura. Si proietta e si salva, ma per giocarla servono mani pari.", {
                      l: POSTI.map((x) => hands[x.key].length).join(", "),
                    })}
                  </li>
                ) : (
                  <li key={i} className="text-sm text-destructive">
                    {p.messaggio}
                  </li>
                ),
              )}
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
            {proiettabile && <ComandoProiezione mani={hands} titolo={descrizione || nomeFigura || "Combinazione"} />}
          </div>

          {proiettabile && (
            <div className="mb-6 rounded-xl border border-border bg-card p-3">
              <label htmlFor="nome-figura" className="mb-1 block text-sm font-semibold">
                {t("Salva come figura")}
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="nome-figura"
                  value={nomeFigura}
                  onChange={(e) => setNomeFigura(e.target.value)}
                  maxLength={120}
                  placeholder={t("Il nome, es. «Impasse al Re con 9 carte»")}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <Button variant="outline" disabled={!nomeFigura.trim() || salvando} onClick={() => void salvaComeFigura()}>
                  {salvando ? t("Salvo…") : t("Salva")}
                </Button>
              </div>
              {esitoFigura && <p className="mt-2 text-sm text-muted-foreground" role="status">{esitoFigura}</p>}
            </div>
          )}

          {figure && figure.length > 0 && (
            <div id="mie-figure" className="mb-6 scroll-mt-20">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Le mie figure")}
              </p>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {figure.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium">{f.nome}</span>
                    <Button size="sm" variant="ghost" onClick={() => apriFigura(f)}>
                      {t("Apri")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void eliminaFigura(f)}>
                      {t("Elimina")}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
