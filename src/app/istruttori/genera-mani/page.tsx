"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, Wand2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import {
  DEAL_TEMPLATES,
  generateDeals,
  handHcp,
  handShape,
  type DealConstraints,
} from "@/lib/deal-generator";
import { dealsToPbn } from "@/lib/pbn";
import { fileLin } from "@/lib/lin";
import { dealsToSmazzate } from "@/lib/deals-to-smazzate";
import { calcTableAndPar, fitFor, FIT_MINIMO, type DdsTable, type ParResult } from "@/lib/dds-table";
import { describePar, parAssignmentFromContracts, type ParContract } from "@/lib/par-contract";
import { createAssignment, getMyClasses, type ClassRoom } from "@/lib/instructors";
import { pubblicaScenario } from "@/lib/mani-condivise";
import { reportError } from "@/lib/report-error";
import { CompositoreVincoli } from "@/components/istruttori/compositore-vincoli";
import {
  condividiModello,
  duplicaModello,
  elencaModelli,
  salvaModello,
  type ModelloMani,
} from "@/lib/modelli-mani";
import { proponi } from "@/lib/libreria";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const SEATS: { key: Position; label: string }[] = [
  { key: "north", label: "Nord" },
  { key: "east", label: "Est" },
  { key: "south", label: "Sud" },
  { key: "west", label: "Ovest" },
];

/**
 * Tutti i contratti dichiarabili, in ordine di licitazione: il par può essere
 * qualunque di questi, quindi un elenco ridotto lascerebbe mani senza la voce
 * giusta.
 */
const CONTRATTI = [1, 2, 3, 4, 5, 6, 7].flatMap((l) =>
  ["♣", "♦", "♥", "♠", "SA"].map((s) => `${l}${s}`)
);

/**
 * Generatore di mani con vincoli, per insegnanti.
 *
 * Risolve il limite che oggi hanno i compiti: tutte le mani sono curate a mano
 * nel catalogo, quindi un esercizio su un argomento specifico dipende dal fatto
 * che qualcuno abbia già preparato le mani giuste. Qui si dichiara cosa deve
 * avere la mano e si ottengono tutte le distribuzioni coerenti che servono.
 *
 * Tutto gira nel browser: nessuna chiamata al server, nessuna mano salvata
 * finché non si decide di scaricarla.
 */
export default function GeneraManiPage() {
  const t = useT();
  const { user, loading: authLoading } = useSharedAuth();

  const [templateId, setTemplateId] = useState(DEAL_TEMPLATES[0].id);
  /**
   * I modelli salvati: ufficiali (uno per lezione del Corso Fiori), i propri,
   * e quelli che altri insegnanti hanno condiviso.
   *
   * Gli ufficiali sono il motivo per cui questa pagina è utile al PRIMO
   * accesso, prima che l'insegnante impari a comporre un vincolo: apre, trova
   * «la lezione di stasera», genera.
   */
  const [modelli, setModelli] = useState<ModelloMani[]>([]);
  const [modelloId, setModelloId] = useState<string>("");
  /** I vincoli in modifica: partono dal modello scelto e si possono ritoccare. */
  const [vincoli, setVincoli] = useState<DealConstraints | null>(null);
  const [nomeModello, setNomeModello] = useState("");
  const [messaggioModello, setMessaggioModello] = useState("");
  const [count, setCount] = useState(8);
  // Il seme è esplicito e modificabile: è ciò che rende una serie
  // riproducibile. Stesso seme e stesso modello = stesse mani, anche fra un
  // anno e su un altro computer.
  const [seed, setSeed] = useState(2026);
  const [result, setResult] = useState<ReturnType<typeof generateDeals> | null>(null);
  const [working, setWorking] = useState(false);

  // Assegnazione a una classe
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState("");
  const [contract, setContract] = useState("3SA");
  const [declarer, setDeclarer] = useState<Position>("south");
  const [assigning, setAssigning] = useState(false);
  // Compito di solo gioco della carta: la dichiarazione è già fatta.
  const [conLicita, setConLicita] = useState(false);
  const [assigned, setAssigned] = useState("");
  // Pubblicazione nella scorta condivisa
  const [nomeScenario, setNomeScenario] = useState("");
  const [pubblicando, setPubblicando] = useState(false);
  const [pubblicato, setPubblicato] = useState("");

  // Analisi double dummy, una voce per mano nello stesso ordine dei risultati.
  // Non parte da sola: e' un calcolo, e chi genera venti mani per scorrerle
  // non deve pagarlo se non gli serve.
  const [analisi, setAnalisi] = useState<
    {
      par: ParResult;
      /** La tabella delle prese: serve a pubblicare la mano nella scorta. */
      table: DdsTable;
      /** Il par letto in forma strutturata, quando è interpretabile. */
      letto: ParContract | null;
      /** Carte d'atout della linea, se sono meno del minimo dichiarabile. */
      fitCorto: number | null;
      /** Contratto e dichiarante che questa mano porterà nel compito. */
      scelta: { contract: string; declarer: Position } | null;
    }[] | null
  >(null);
  const [analizzando, setAnalizzando] = useState(false);

  /** Cambia il contratto di una singola mano, lasciando intatte le altre. */
  const cambiaScelta = (i: number, patch: Partial<{ contract: string; declarer: Position }>) =>
    setAnalisi((prev) =>
      prev?.map((a, j) =>
        j === i && a.scelta ? { ...a, scelta: { ...a.scelta, ...patch } } : a
      ) ?? prev
    );

  useEffect(() => {
    // Se non insegna in nessuna classe, il riquadro di assegnazione non
    // compare affatto: meglio di un elenco vuoto che sembra un guasto.
    getMyClasses()
      .then(setClasses)
      .catch((err) => reportError("genera-mani:classi", err));
  }, []);

  useEffect(() => {
    void elencaModelli().then(setModelli);
  }, []);

  const modelloScelto = modelli.find((m) => m.id === modelloId) ?? null;

  /**
   * Il modello in uso: uno salvato, oppure quelli fissi nel codice.
   *
   * I sette `DEAL_TEMPLATES` restano perché sono il ripiego quando il database
   * non risponde — e perché due o tre non hanno un corrispondente fra gli
   * ufficiali. Il vincolo effettivo è `vincoli` se l'insegnante l'ha toccato,
   * altrimenti quello del modello.
   */
  const template = useMemo(() => {
    if (modelloScelto) {
      return {
        id: modelloScelto.id,
        label: modelloScelto.nome,
        description: modelloScelto.descrizione ?? "",
        constraints: modelloScelto.vincoli,
      };
    }
    return DEAL_TEMPLATES.find((t) => t.id === templateId) ?? DEAL_TEMPLATES[0];
  }, [modelloScelto, templateId]);

  const vincoliInUso = vincoli ?? template.constraints;

  const run = useCallback(
    (constraints: DealConstraints, useSeed: number) => {
      setWorking(true);
      // Un frame di respiro prima di un ciclo che può durare qualche decimo di
      // secondo, così il pulsante mostra lo stato invece di bloccarsi muto.
      requestAnimationFrame(() => {
        setResult(generateDeals(constraints, { count, seed: useSeed }));
        // L'analisi vale per le mani precedenti: tenerla mostrerebbe il par
        // di una mano accanto alle carte di un'altra.
        setAnalisi(null);
        setWorking(false);
      });
    },
    [count]
  );

  const download = useCallback(() => {
    if (!result?.deals.length) return;
    const blob = new Blob([dealsToPbn(result.deals, `BridgeLab - ${template.label}`)], {
      type: "application/x-pbn",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bridgelab-${template.id}-${seed}.pbn`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, template, seed]);

  /**
   * Lo stesso set in LIN, per aprirlo su BBO.
   *
   * Il PBN è lo standard fra programmi; il LIN è quello che capisce Bridge Base
   * Online, dove gli allievi giocano quando escono da qui. Una mano preparata a
   * lezione che si apre su BBO è una mano che si rigioca la sera con il proprio
   * compagno.
   */
  const scaricaLin = useCallback(() => {
    if (!result?.deals.length) return;
    const testo = fileLin(
      result.deals.map((hands, i) => ({
        hands,
        // La stessa rotazione dell'analisi e della pubblicazione: il mazziere e
        // la zona devono essere gli stessi ovunque esca questa mano.
        dealer: (["north", "east", "south", "west"] as const)[i % 4],
        vulnerability: (["none", "ns", "ew", "both"] as const)[i % 4],
      })),
    );
    const blob = new Blob([testo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bridgelab-${template.id}-${seed}.lin`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, template, seed]);

  /** Calcola il par di ogni mano e lo propone come contratto da assegnare. */
  const analizza = async () => {
    if (!result?.deals.length) return;
    setAnalizzando(true);
    setAnalisi([]);
    try {
      const out: NonNullable<typeof analisi> = [];
      for (const [i, deal] of result.deals.entries()) {
        // Dichiarante e vulnerabilità seguono la rotazione dei board, la
        // stessa che finisce nelle smazzate assegnate: il par mostrato qui è
        // quello del compito, non di una mano astratta.
        const dealer = SEATS[i % 4].key;
        const vuln = (["none", "ns", "ew", "both"] as const)[i % 4];
        const { table, par } = await calcTableAndPar(deal, dealer, vuln);
        // Il contratto proposto è il PAR, non il massimo mantenibile: su una
        // mano il cui par è 4♠ il double dummy vede spesso undici prese, ma
        // 5♠ nessuno lo dichiarerebbe e assegnarlo insegnerebbe il contrario.
        // Il par tiene già conto di punteggio, vulnerabilità e del fatto che
        // a volte la mano è degli avversari.
        const scelta = parAssignmentFromContracts(par.contracts, table, deal);
        // Il par è corretto per definizione, ma su distribuzioni estreme può
        // essere un contratto a colore con pochissime carte: si segnala, non
        // si corregge — correggere il par significherebbe non mostrarlo.
        const fit = scelta ? fitFor(deal, scelta.par.side, scelta.par.strain) : null;
        out.push({
          par,
          table,
          letto: scelta?.par ?? null,
          fitCorto: fit !== null && fit < FIT_MINIMO ? fit : null,
          scelta: scelta ? { contract: scelta.contract, declarer: scelta.declarer } : null,
        });
        // Si mostra man mano e si cede il controllo al browser: venti mani a
        // qualche centinaio di millisecondi ciascuna congelerebbero la pagina
        // per secondi, e l'insegnante non saprebbe se sta lavorando.
        setAnalisi([...out]);
        await new Promise((r) => setTimeout(r, 0));
      }
    } catch (err) {
      reportError("genera-mani:dds", err);
    } finally {
      setAnalizzando(false);
    }
  };

  const assign = async () => {
    if (!result?.deals.length || !classId) return;
    setAssigning(true);
    setAssigned("");
    try {
      const smazzate = dealsToSmazzate(result.deals, {
        // Ogni mano porta il proprio contratto — il suo par, o quello che
        // l'insegnante ha scelto al posto del par. Un contratto unico per
        // tutte è impossibile su alcune mani e troppo timido su altre.
        perHand: analisi?.map((a) => a.scelta) ?? undefined,
        conLicita,
        // Il seme entra nell'id: due compiti generati con semi diversi non si
        // sovrappongono, e lo stesso seme resta riconoscibile.
        idPrefix: `gen-${template.id}-${seed}`,
        contract,
        declarer,
        title: template.label,
        commentary: template.description,
      });
      await createAssignment({
        classId,
        title: `${template.label} (${smazzate.length} mani)`,
        smazzataIds: smazzate.map((s) => s.id),
        customHands: smazzate,
        instructorNote: template.description,
      });
      setAssigned(`Compito creato con ${smazzate.length} mani.`);
    } catch (err) {
      reportError("genera-mani:assegna", err);
      setAssigned("Non è stato possibile creare il compito. Riprova.");
    } finally {
      setAssigning(false);
    }
  };

  /**
   * Mette le mani generate nella scorta condivisa, come scenario.
   *
   * DIFFERENZA DAL COMPITO: il compito è per la tua classe e ha un contratto
   * già scelto; lo scenario è un esercizio di dichiarazione che incontrano
   * tutti, e proprio perché lo incontrano in molti accanto al voto compare «hai
   * fatto meglio del 74%». Una mano che vede una persona sola non ha campo con
   * cui confrontarsi.
   *
   * Richiede l'analisi: senza par e tabella delle prese la mano non si può né
   * votare né confrontare, e salvarla monca vorrebbe dire ricalcolare tutto
   * addosso al primo allievo che la trova.
   */
  const pubblica = async () => {
    if (!result?.deals.length || !analisi || analisi.length !== result.deals.length) return;
    setPubblicando(true);
    setPubblicato("");
    const esito = await pubblicaScenario(
      {
        nome: nomeScenario.trim() || template.label,
        descrizione: template.description,
        vincoli: template.constraints,
        pubblico: true,
      },
      result.deals.map((deal, i) => ({
        hands: deal,
        // La stessa rotazione dell'analisi: il par mostrato è quello di
        // questo mazziere e di questa zona, e deve restare quello.
        dealer: SEATS[i % 4].key,
        vulnerability: (["none", "ns", "ew", "both"] as const)[i % 4],
        parScore: analisi[i].par.score,
        parContracts: analisi[i].par.contracts,
        ddTable: analisi[i].table.tricks,
      }))
    );
    setPubblicando(false);
    setPubblicato(
      "errore" in esito
        ? esito.errore
        : `Scenario pubblicato con ${esito.quante} mani: da ora arrivano in «Licita e vediamo».`
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Questa pagina è riservata agli insegnanti.{" "}
          <Link href="/login?redirect=/istruttori/genera-mani" className="underline">
            {t("Accedi")}
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-figb" aria-hidden="true" />
          {t("Genera mani")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Scegli cosa deve avere la mano e ottieni tutte le distribuzioni che servono, senza aspettare che esca quella giusta per caso.")}
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <label
          htmlFor="modello"
          className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider"
        >
          {t("Argomento")}
        </label>
        <select
          id="modello"
          value={modelloId || `fisso:${templateId}`}
          onChange={(e) => {
            const v = e.target.value;
            setVincoli(null);
            if (v.startsWith("fisso:")) {
              setModelloId("");
              setTemplateId(v.slice(6));
            } else {
              setModelloId(v);
            }
          }}
          className="w-full h-12 px-4 rounded-xl border border-border bg-card text-sm mb-1"
        >
          {modelli.some((m) => m.ufficiale) && (
            <optgroup label="Corso Fiori — modelli ufficiali">
              {modelli
                .filter((m) => m.ufficiale)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.lesson_id !== null ? `Lezione ${m.lesson_id} — ` : ""}
                    {m.nome}
                  </option>
                ))}
            </optgroup>
          )}
          {modelli.some((m) => !m.ufficiale) && (
            <optgroup label="I tuoi modelli e quelli condivisi">
              {modelli
                .filter((m) => !m.ufficiale)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
            </optgroup>
          )}
          <optgroup label="Modelli di base">
            {DEAL_TEMPLATES.map((t) => (
              <option key={t.id} value={`fisso:${t.id}`}>
                {t.label}
              </option>
            ))}
          </optgroup>
        </select>
        <p className="text-xs text-muted-foreground mb-4">{template.description}</p>

        {/* Il vincolo si compone qui, e si salva come modello nuovo. */}
        <details className="mb-4 rounded-xl border border-border p-3">
          <summary className="cursor-pointer text-sm font-semibold">
            {t("Cambia i vincoli")}
          </summary>
          <div className="mt-3">
            <CompositoreVincoli vincoli={vincoliInUso} onCambia={setVincoli} />
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <input
                value={nomeModello}
                onChange={(e) => setNomeModello(e.target.value)}
                placeholder={t("Nome del modello")}
                className="h-10 flex-1 min-w-[12rem] rounded-lg border border-border bg-background px-3 text-sm"
              />
              <Button
                variant="outline"
                disabled={!nomeModello.trim()}
                onClick={async () => {
                  const salvato = await salvaModello({
                    nome: nomeModello,
                    descrizione: template.description,
                    vincoli: vincoliInUso,
                  });
                  if (salvato) {
                    setModelli(await elencaModelli());
                    setModelloId(salvato.id);
                    setVincoli(null);
                    setNomeModello("");
                    setMessaggioModello("Modello salvato: lo ritrovi nell'elenco.");
                  } else {
                    setMessaggioModello("Non sono riuscito a salvarlo.");
                  }
                }}
              >
                {t("Salva come modello")}
              </Button>
              {modelloScelto && !modelloScelto.ufficiale && modelloScelto.autore_id && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await condividiModello(modelloScelto.id, !modelloScelto.condiviso);
                    setModelli(await elencaModelli());
                  }}
                >
                  {modelloScelto.condiviso ? t("Non condividere") : t("Condividi con gli insegnanti")}
                </Button>
              )}
              {modelloScelto && !modelloScelto.ufficiale && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const v = await proponi({
                      tipo: "modello",
                      titolo: modelloScelto.nome,
                      descrizione: modelloScelto.descrizione,
                      lessonId: modelloScelto.lesson_id,
                      contenuto: modelloScelto.vincoli,
                    });
                    setMessaggioModello(
                      v
                        ? "Proposto alla libreria: lo vedrà un curatore prima che compaia."
                        : "Non sono riuscito a proporlo.",
                    );
                  }}
                >
                  {t("Proponi alla libreria")}
                </Button>
              )}
              {modelloScelto && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const copia = await duplicaModello(modelloScelto);
                    if (copia) {
                      setModelli(await elencaModelli());
                      setModelloId(copia.id);
                      setMessaggioModello("Copiato nella tua libreria: modificalo pure.");
                    }
                  }}
                >
                  {t("Duplica")}
                </Button>
              )}
            </div>
            {messaggioModello && (
              <p className="mt-2 text-sm text-muted-foreground">{messaggioModello}</p>
            )}
          </div>
        </details>

        <div className="flex flex-wrap gap-4 mb-5">
          <div>
            <label
              htmlFor="quante"
              className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider"
            >
              {t("Quante mani")}
            </label>
            <input
              id="quante"
              type="number"
              min={1}
              max={32}
              value={count}
              onChange={(e) =>
                setCount(Math.min(32, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-28 h-12 px-4 rounded-xl border border-border bg-card text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="seme"
              className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider"
            >
              {t("Seme")}
            </label>
            <input
              id="seme"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="w-32 h-12 px-4 rounded-xl border border-border bg-card text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t("Lo stesso seme, con lo stesso argomento, produce sempre le stesse mani: annotalo e potrai ridistribuire alla classe esattamente la stessa serie, anche fra un anno.")}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button disabled={working} onClick={() => run(vincoliInUso, seed)}>
            {working ? t("Genero…") : t("Genera")}
          </Button>
          <Button
            variant="outline"
            disabled={working}
            onClick={() => {
              const next = seed + 1;
              setSeed(next);
              run(vincoliInUso, next);
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("Altre mani")}
          </Button>
          {result?.deals.length ? (
            <Button variant="outline" disabled={analizzando} onClick={analizza}>
              {analizzando
              ? `Calcolo il par… ${analisi?.length ?? 0}/${result?.deals.length ?? 0}`
              : "Calcola par"}
            </Button>
          ) : null}
          {result?.deals.length ? (
            <Button variant="outline" onClick={scaricaLin}>
              {t("Scarica LIN (per BBO)")}
            </Button>
          ) : null}
          {result?.deals.length ? (
            <Button variant="outline" onClick={download}>
              <Download className="w-4 h-4 mr-1" aria-hidden="true" />
              {t("Scarica PBN")}
            </Button>
          ) : null}
        </div>
      </div>

      {result?.exhausted && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 mb-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Trovate {result.deals.length} mani su {count} richieste dopo{" "}
            {result.attempts.toLocaleString("it-IT")} tentativi. Il vincolo è
            molto stretto: distribuzioni così sono rare anche al tavolo.
          </p>
        </div>
      )}

      {result && result.deals.length > 0 && classes.length > 0 && (
        <div className="rounded-2xl border border-figb/30 bg-figb/5 p-5 mb-6">
          <h2 className="font-bold mb-1">{t("Assegna alla classe")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("Le mani diventano un compito che gli allievi trovano nella loro classe.")}
          </p>
          {analisi?.length === result.deals.length ? (
            <p className="text-sm text-figb font-medium mb-4">
              {t("Ogni mano porta il proprio contratto: lo trovi sotto le carte, qui sotto, e puoi cambiarlo mano per mano. Contratto e dichiarante di riserva servono solo alle mani il cui par non è interpretabile.")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              Senza il par, tutte le mani prenderebbero lo stesso contratto — un
              contratto unico è impossibile su alcune e troppo timido su altre.
              Premi <strong>{t("Calcola par")}</strong> e ognuna riceverà il suo,
              modificabile.
            </p>
          )}

          <div className="flex flex-wrap gap-3 mb-4">
            <div>
              <label htmlFor="classe" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                {t("Classe")}
              </label>
              <select
                id="classe"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="h-12 px-4 rounded-xl border border-border bg-card text-sm min-w-[12rem]"
              >
                <option value="">{t("Scegli…")}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contratto" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                {t("Contratto di riserva")}
              </label>
              <select
                id="contratto"
                value={contract}
                onChange={(e) => setContract(e.target.value)}
                className="h-12 px-4 rounded-xl border border-border bg-card text-sm"
              >
                {CONTRATTI.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dichiarante" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                {t("Dichiarante di riserva")}
              </label>
              <select
                id="dichiarante"
                value={declarer}
                onChange={(e) => setDeclarer(e.target.value as typeof declarer)}
                className="h-12 px-4 rounded-xl border border-border bg-card text-sm"
              >
                {SEATS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-start gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={conLicita}
              onChange={(e) => setConLicita(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              <strong>{t("Solo gioco della carta")}</strong>
              <span className="block text-xs text-muted-foreground">
                {t("Ogni mano arriva con la dichiarazione già fatta: l'allievo si concentra sul gioco. Senza, vedrebbe un contratto piovuto dal nulla senza sapere cosa la sua linea ha promesso.")}
              </span>
            </span>
          </label>

          <Button disabled={assigning || !classId} onClick={assign}>
            {assigning ? "Creo il compito…" : `Assegna ${result.deals.length} mani`}
          </Button>
          {assigned && <p className="text-sm mt-3 font-medium">{assigned}</p>}
        </div>
      )}

      {result && result.deals.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <h2 className="font-bold mb-1">{t("Pubblica come esercizio di licita")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("Le mani finiscono nella scorta condivisa: chiunque apra «Licita e vediamo» può incontrarle, e accanto al voto vede come è andata agli altri sulla stessa smazzata. Un compito invece resta alla tua classe e ha già il contratto scelto.")}
          </p>

          <label className="block mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("Nome dell'esercizio")}
            </span>
            <input
              value={nomeScenario}
              onChange={(e) => setNomeScenario(e.target.value)}
              placeholder={template.label}
              className="mt-1 w-full h-12 px-3 rounded-xl border border-border bg-card"
            />
          </label>

          {!analisi || analisi.length !== result.deals.length ? (
            <p className="text-sm text-muted-foreground">
              {t("Prima serve l'analisi double dummy: senza par e prese la mano non si può né votare né confrontare.")}
            </p>
          ) : (
            <Button disabled={pubblicando} onClick={pubblica}>
              {pubblicando ? "Pubblico…" : `Pubblica ${result.deals.length} mani`}
            </Button>
          )}
          {pubblicato && <p className="text-sm mt-3 font-medium">{pubblicato}</p>}
        </div>
      )}

      {result && result.deals.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {result.deals.length} mani ·{" "}
            {result.attempts.toLocaleString("it-IT")} distribuzioni esaminate
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {result.deals.map((deal, i) => (
              <li key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">Mano {i + 1}</span>
                  <Badge variant="secondary">
                    N-S {handHcp(deal.north) + handHcp(deal.south)} PO
                  </Badge>
                </div>
                {analisi?.[i] && (
                  <div className="mb-3 rounded-xl bg-figb/5 border border-figb/20 px-3 py-2">
                    <p className="text-xs">
                      <span className="font-bold text-figb">{t("Par:")}</span>{" "}
                      {analisi[i].letto
                        ? describePar(analisi[i].letto, analisi[i].par.score)
                        : analisi[i].par.contracts.join(", ")}
                    </p>
                    {analisi[i].scelta ? (
                      // Il contratto di QUESTA mano, modificabile qui: è il par
                      // per definizione giusto, ma l'insegnante può volere una
                      // manche da provare al posto di un parziale.
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        <div>
                          <label
                            htmlFor={`contratto-${i}`}
                            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            {t("Contratto")}
                          </label>
                          <select
                            id={`contratto-${i}`}
                            value={analisi[i].scelta.contract}
                            onChange={(e) => cambiaScelta(i, { contract: e.target.value })}
                            className="h-9 px-2 rounded-lg border border-border bg-card text-xs"
                          >
                            {CONTRATTI.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={`dichiarante-${i}`}
                            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            {t("Dichiarante")}
                          </label>
                          <select
                            id={`dichiarante-${i}`}
                            value={analisi[i].scelta.declarer}
                            onChange={(e) =>
                              cambiaScelta(i, { declarer: e.target.value as Position })
                            }
                            className="h-9 px-2 rounded-lg border border-border bg-card text-xs"
                          >
                            {SEATS.map((s) => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("Par non interpretabile: questa mano userà il contratto di riserva.")}
                      </p>
                    )}
                    {analisi[i].fitCorto !== null && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
                        Attenzione: solo {analisi[i].fitCorto} carte d&apos;atout in
                        due. A carte scoperte regge, ma al tavolo un contratto
                        così non si dichiara.
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {SEATS.map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-xs font-bold text-muted-foreground mb-1">
                        {label}{" "}
                        <span className="font-normal">
                          {handHcp(deal[key])} PO · {handShape(deal[key])}
                        </span>
                      </p>
                      {SUITS.map((suit) => (
                        <p key={suit} className="text-xs font-mono flex items-center gap-1">
                          <SuitSymbol suit={suit} size="xs" />
                          {formatSuit(deal[key], suit)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Carte di un seme in ordine decrescente, o un trattino se il seme è vuoto. */
function formatSuit(hand: readonly Card[], suit: Suit): string {
  const order = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => order.indexOf(a.rank) - order.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join(" ") : "—";
}
