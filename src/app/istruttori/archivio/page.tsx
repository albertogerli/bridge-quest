"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/link";
import { Archive, Folder, FolderPlus, Pencil, Printer, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals, handHcp } from "@/lib/deal-generator";
import { parsePbn } from "@/lib/pbn";
import {
  aggiornaMano,
  deleteSavedHand,
  getSavedHands,
  raggruppaArchivio,
  rinominaCartella,
  saveHands,
  type SavedHand,
} from "@/lib/saved-hands";
import { apriStampaMano } from "@/lib/stampa-mano";
import { useT } from "@/contexts/traduzioni-provider";
import { Briciole } from "@/components/briciole";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};
const MASSIMO_SET = 20;

/**
 * L'archivio delle mani salvate, a cartelle.
 *
 * Ogni voce non è una smazzata ma un MOMENTO: la mano nella posizione in cui
 * è stata salvata, carte già giocate comprese. Si riapre nel tavolo di studio
 * esattamente lì — che è il punto: alla lezione dopo non si vuole rigiocare
 * tutto, si vuole ripartire dalla scelta da discutere.
 *
 * LE CARTELLE vengono dall'archivio di BridgeChamp (28/09/2026): dopo un corso
 * le mani sono decine, e «le mani sulle transfer» si cercano per nome, non a
 * occhio. Una cartella nasce con un «Nuovo set» — dieci mani casuali o
 * sull'argomento — o importando un PBN, per esempio il pacchetto delle
 * smazzate di un simultaneo o le mani del Corso Fiori dell'area riservata.
 * Le preferite stanno in cima, e restano anche nella loro cartella.
 */
export default function ArchivioPage() {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const [mani, setMani] = useState<SavedHand[] | null>(null);
  const [pannello, setPannello] = useState<"nessuno" | "set" | "importa">("nessuno");
  const [messaggio, setMessaggio] = useState<string | null>(null);

  const ricarica = useCallback(async () => setMani(await getSavedHands()), []);

  useEffect(() => {
    if (loading || !user) return;
    let vivo = true;
    getSavedHands().then((m) => { if (vivo) setMani(m); });
    return () => { vivo = false; };
  }, [user, loading]);

  const gruppi = useMemo(() => raggruppaArchivio(mani ?? []), [mani]);
  const cartelle = useMemo(
    () => gruppi.filter((g) => g.tipo === "cartella").map((g) => g.nome as string),
    [gruppi],
  );

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Riservato agli insegnanti.{" "}
          <Link href="/login?redirect=/istruttori/archivio" className="underline">{t("Accedi")}</Link>.
        </p>
      </div>
    );
  }

  const elimina = async (m: SavedHand) => {
    if (!confirm(t("Eliminare «{titolo}»?", { titolo: m.titolo }))) return;
    if (await deleteSavedHand(m.id)) await ricarica();
  };

  const stella = async (m: SavedHand) => {
    if (await aggiornaMano(m.id, { preferita: !m.preferita })) await ricarica();
  };

  const sposta = async (m: SavedHand, valore: string) => {
    let destinazione: string | null = valore === "" ? null : valore;
    if (valore === "*nuova") {
      destinazione = prompt(t("Nome della nuova cartella"));
      if (!destinazione) return;
    }
    if (await aggiornaMano(m.id, { cartella: destinazione })) await ricarica();
  };

  const rinomina = async (vecchio: string) => {
    const nuovo = prompt(t("Nuovo nome della cartella"), vecchio);
    if (!nuovo || nuovo === vecchio) return;
    if (await rinominaCartella(vecchio, nuovo)) await ricarica();
  };

  const stampaTutte = (lista: SavedHand[], titolo: string) => {
    apriStampaMano(
      lista.map((m) => ({
        titolo: `${titolo} — ${m.titolo}`,
        mani: m.hands,
        prese: [],
        contratto: m.contract ?? "—",
        dichiarante: m.declarer ?? "south",
      })),
    );
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-3xl mx-auto">
      <Briciole percorso={[{ etichetta: "Le tue classi", href: "/istruttori" }, { etichetta: "Le tue mani" }]} />
      <header className="mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Archive className="w-6 h-6 text-figb" aria-hidden="true" />
          {t("Le tue mani")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Ogni voce si riapre nel tavolo di studio esattamente dov'era, carte già giocate comprese.")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={pannello === "set" ? "default" : "outline"} onClick={() => setPannello((p) => (p === "set" ? "nessuno" : "set"))}>
            <FolderPlus className="mr-1 h-4 w-4" aria-hidden="true" />
            {t("Nuovo set")}
          </Button>
          <Button variant={pannello === "importa" ? "default" : "outline"} onClick={() => setPannello((p) => (p === "importa" ? "nessuno" : "importa"))}>
            <Upload className="mr-1 h-4 w-4" aria-hidden="true" />
            {t("Importa PBN")}
          </Button>
          <Link href="/istruttori/studio">
            <Button variant="outline">{t("Tavolo di studio")}</Button>
          </Link>
        </div>
      </header>

      {pannello === "set" && (
        <NuovoSet
          cartelle={cartelle}
          onFatto={async (msg) => { setMessaggio(msg); setPannello("nessuno"); await ricarica(); }}
        />
      )}
      {pannello === "importa" && (
        <ImportaPbn
          onFatto={async (msg) => { setMessaggio(msg); setPannello("nessuno"); await ricarica(); }}
        />
      )}
      {messaggio && <p role="status" className="mb-4 rounded-xl bg-figb/5 px-4 py-3 text-sm">{messaggio}</p>}

      {mani === null && <p className="text-sm text-muted-foreground">{t("Carico…")}</p>}

      {mani && mani.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold mb-1">{t("Nessuna mano salvata")}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {t("Crea un set di mani, importa un PBN, oppure salva una posizione dal tavolo di studio.")}
          </p>
        </div>
      )}

      <datalist id="cartelle-archivio">
        {cartelle.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div className="space-y-3">
        {gruppi.map((g, i) => {
          const titolo = g.tipo === "preferite" ? t("Preferite") : g.tipo === "senza" ? t("Senza cartella") : (g.nome as string);
          return (
            <details key={g.chiave} open={i === 0} className="group rounded-2xl border border-border bg-card">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3">
                {g.tipo === "preferite"
                  ? <Star className="h-4 w-4 fill-[#c8a44e] text-[#c8a44e]" aria-hidden="true" />
                  : <Folder className="h-4 w-4 text-[#c8a44e]" aria-hidden="true" />}
                <span className="font-semibold">{titolo}</span>
                <span className="text-sm text-muted-foreground">({g.mani.length})</span>
                <span className="ml-auto flex gap-1" onClick={(e) => e.preventDefault()}>
                  <Button variant="ghost" size="sm" onClick={() => stampaTutte(g.mani, titolo)} aria-label={t("Stampa tutte le mani di {nome}", { nome: titolo })}>
                    <Printer className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  {g.tipo === "cartella" && (
                    <Button variant="ghost" size="sm" onClick={() => void rinomina(g.nome as string)} aria-label={t("Rinomina la cartella {nome}", { nome: titolo })}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </span>
              </summary>
              <ul className="space-y-3 border-t border-border p-3">
                {g.mani.map((m) => (
                  <VoceMano
                    key={m.id}
                    m={m}
                    cartelle={cartelle}
                    onStella={() => void stella(m)}
                    onSposta={(v) => void sposta(m, v)}
                    onElimina={() => void elimina(m)}
                  />
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function VoceMano({
  m, cartelle, onStella, onSposta, onElimina,
}: {
  m: SavedHand;
  cartelle: string[];
  onStella: () => void;
  onSposta: (valore: string) => void;
  onElimina: () => void;
}) {
  const t = useT();
  return (
    <li className="rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h2 className="font-semibold">{m.titolo}</h2>
          <p className="text-xs text-muted-foreground">
            {m.contract ?? t("contratto dal par")}
            {m.declarer ? ` — dichiara ${ETICHETTA[m.declarer]}` : ""}
            {" · "}
            {m.played.length === 0
              ? "dall'inizio"
              : `dopo ${m.played.length} cart${m.played.length === 1 ? "a" : "e"}`}
            {" · "}
            {new Date(m.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onStella}
            aria-pressed={m.preferita}
            aria-label={m.preferita ? t("Togli dalle preferite") : t("Aggiungi alle preferite")}
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
          >
            <Star className={`h-4 w-4 ${m.preferita ? "fill-[#c8a44e] text-[#c8a44e]" : "text-muted-foreground"}`} aria-hidden="true" />
          </button>
          <Link href={`/istruttori/studio?mano=${m.id}`}>
            <Button variant="outline">{t("Riapri")}</Button>
          </Link>
          <button
            onClick={onElimina}
            aria-label={`Elimina ${m.titolo}`}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(["north", "east", "south", "west"] as Position[]).map((p) => (
          <div key={p} className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">
              {ETICHETTA[p]}{" "}
              <span className="font-normal">{handHcp(m.hands[p] ?? [])} PO</span>
            </p>
            {SUITS.map((suit) => (
              <p key={suit} className="text-xs font-mono flex items-center gap-1 whitespace-nowrap">
                <SuitSymbol suit={suit} size="xs" />
                {formatSuit(m.hands[p] ?? [], suit)}
              </p>
            ))}
          </div>
        ))}
      </div>

      {m.nota && <p className="text-sm text-muted-foreground mt-2">{m.nota}</p>}

      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {t("Cartella")}
        <select
          value={m.cartella ?? ""}
          onChange={(e) => onSposta(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
        >
          <option value="">{t("Senza cartella")}</option>
          {cartelle.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="*nuova">{t("Nuova cartella…")}</option>
        </select>
      </label>
    </li>
  );
}

/**
 * «Quante mani vuoi creare?»: N mani in una cartella, casuali o
 * sull'argomento. Senza contratto: il tavolo di studio calcola il par
 * quando le si apre, e il contratto si può sempre cambiare lì.
 */
function NuovoSet({ cartelle, onFatto }: { cartelle: string[]; onFatto: (msg: string) => void }) {
  const t = useT();
  const [nome, setNome] = useState("");
  const [quante, setQuante] = useState(10);
  const [argomento, setArgomento] = useState<string>("");
  const [prefisso, setPrefisso] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const crea = async () => {
    setInCorso(true);
    setErrore(null);
    const modello = DEAL_TEMPLATES.find((m) => m.id === argomento);
    const n = Math.min(MASSIMO_SET, Math.max(1, quante));
    const { deals } = generateDeals(modello?.constraints ?? {}, { count: n, seed: Date.now() % 2147483647 });
    if (deals.length === 0) {
      setErrore(t("Non sono riuscito a generare mani con questo argomento. Riprova."));
      setInCorso(false);
      return;
    }
    const base = prefisso.trim() || modello?.label || t("Mano");
    const esito = await saveHands(
      deals.map((hands, i) => ({ titolo: `${base} ${i + 1}`, hands })),
      nome,
    );
    setInCorso(false);
    if (!esito.ok) {
      setErrore(esito.errore ?? t("Non è stato possibile salvare le mani."));
      return;
    }
    onFatto(t("{n} mani create in «{cartella}».", { n: deals.length, cartella: nome.trim() || t("Senza cartella") }));
  };

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4 space-y-3">
      <label className="block text-sm">
        <span className="font-medium">{t("Nome della cartella")}</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          list="cartelle-archivio"
          maxLength={80}
          placeholder={t("Mani sulle transfer")}
          className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium">{t("Quante mani")}</span>
          <input
            type="number" min={1} max={MASSIMO_SET} value={quante}
            onChange={(e) => setQuante(Number(e.target.value))}
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">{t("Come")}</span>
          <select
            value={argomento}
            onChange={(e) => setArgomento(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
          >
            <option value="">{t("Casuali")}</option>
            {DEAL_TEMPLATES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium">{t("Prefisso del nome (facoltativo)")}</span>
        <input
          value={prefisso}
          onChange={(e) => setPrefisso(e.target.value)}
          maxLength={60}
          className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
        />
      </label>
      {cartelle.length > 0 && (
        <p className="text-xs text-muted-foreground">{t("Scrivi il nome di una cartella esistente per aggiungere le mani lì.")}</p>
      )}
      {errore && <p className="text-sm text-destructive">{errore}</p>}
      <Button onClick={() => void crea()} disabled={inCorso || !nome.trim()}>
        {inCorso ? t("Creo…") : t("Crea")}
      </Button>
    </div>
  );
}

/**
 * Un file PBN dentro una cartella: il pacchetto delle smazzate di un
 * simultaneo (dal sito della Federazione, «pacchetto completo smazzate»), le
 * mani del Corso Fiori dall'area riservata, o un'esportazione da BBO.
 */
function ImportaPbn({ onFatto }: { onFatto: (msg: string) => void }) {
  const t = useT();
  const [nome, setNome] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const importa = async () => {
    if (!file) return;
    setInCorso(true);
    setErrore(null);
    const testo = await file.text();
    const { deals, errors } = parsePbn(testo, `imp-${Date.now()}`);
    if (deals.length === 0) {
      setErrore(errors[0] ?? t("Nel file non ho trovato nessuna smazzata."));
      setInCorso(false);
      return;
    }
    const esito = await saveHands(
      deals.map((d) => ({
        titolo: d.title || `${t("Board")} ${d.board}`,
        hands: d.hands,
        contract: d.contract || null,
        declarer: d.contract ? d.declarer : null,
      })),
      nome || file.name.replace(/\.pbn$/i, ""),
    );
    setInCorso(false);
    if (!esito.ok) {
      setErrore(esito.errore ?? t("Non è stato possibile salvare le mani."));
      return;
    }
    onFatto(
      errors.length
        ? t("{n} mani importate, {e} saltate perché illeggibili.", { n: deals.length, e: errors.length })
        : t("{n} mani importate.", { n: deals.length }),
    );
  };

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4 space-y-3">
      <label className="block text-sm">
        <span className="font-medium">{t("File PBN")}</span>
        <input
          type="file"
          accept=".pbn,text/plain"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">{t("Nome della cartella")}</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          list="cartelle-archivio"
          maxLength={80}
          placeholder={file ? file.name.replace(/\.pbn$/i, "") : t("Simultaneo di martedì")}
          className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        {t("Va bene il pacchetto delle smazzate di un simultaneo, o le mani del Corso Fiori dall'area riservata.")}
      </p>
      {errore && <p className="text-sm text-destructive">{errore}</p>}
      <Button onClick={() => void importa()} disabled={inCorso || !file}>
        {inCorso ? t("Importo…") : t("Importa")}
      </Button>
    </div>
  );
}

function formatSuit(hand: readonly Card[], suit: Suit): string {
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join("") : "—";
}
