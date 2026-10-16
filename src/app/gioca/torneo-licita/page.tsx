"use client";

import { useEffect, useState } from "react";
import Link from "@/components/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { Asta } from "@/components/bridge/asta";
import { AttesaDichiarazione } from "@/components/bridge/attesa-dichiarazione";
import { Stelle } from "@/components/bridge/stelle";
import { RiepilogoMano } from "@/components/bridge/riepilogo-mano";
import { RisultatoDoppioMorto } from "@/components/bridge/risultato-doppio-morto";
import { AsteTorneoConcluso } from "@/components/bridge/aste-torneo-concluso";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { handHcp } from "@/lib/deal-generator";
import type { DdsTable } from "@/lib/dds-table";
import { riprovareServe, type MotivoBen } from "@/lib/ben-client";
import { tabelleFineMano } from "@/lib/riepilogo-mano";
import type { EsitoLicita } from "@/lib/stelle-licita";
import type { Strain } from "@/lib/minibridge";
import {
  classificaTorneo, contatoreCresce, evDelContratto, manoArchiviata,
  riferimento, torneoCorrente,
  type ClassificaTorneo, type EsitoRegistrazione, type ManoCondivisa, type TorneoCorrente, riferimentoUnico } from "@/lib/mani-condivise";
import { useT } from "@/contexts/traduzioni-provider";
import { CondizioniAsta } from "@/components/bridge/condizioni-asta";
import { chiamaTorneo, manoParziale, type RispostaTorneo } from "@/lib/torneo-licita-client";
import { votoMano, type ManoTorneo } from "@/lib/torneo-licita-server";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
type Tipo = "giornaliero" | "settimanale";

/**
 * Che cosa dire quando il compagno non ha dichiarato.
 *
 * PRIMA ERA UNA FRASE SOLA — «non ha risposto in tempo» — per otto cause
 * diverse: sessione scaduta, limite di richieste, BEN spento, parametri
 * rifiutati. Spesso quella frase era semplicemente falsa, e in più nascondeva
 * l'unica cosa che serve a chi legge: se riprovare possa funzionare. Con il
 * limite di richieste era anche un consiglio dannoso, perché è proprio il
 * riprovare a farlo scattare di nuovo.
 */
function spiegazioneMuto(motivo: MotivoBen | null, t: (frase: string) => string): string {
  switch (motivo) {
    case "limite":
      return t("Hai chiesto troppe dichiarazioni in poco tempo ed è scattato il limite. Aspetta un minuto: la mano resta dov'è.");
    case "sessione":
      return t("La tua sessione è scaduta. Rientra e l'asta riprende da dove si è fermata.");
    case "server":
    case "risposta":
    case "richiesta":
    case "autorizzazione":
      return t("Il motore che dichiara per lui ha risposto male: è un problema nostro, ed è già stato segnalato. La mano non è persa.");
    case "irraggiungibile":
      return t("Il motore che dichiara per lui non risponde. La mano non è persa: l'asta riprende da dove si è fermata.");
    case "edge":
      return t("Un intoppo di rete fra il tuo dispositivo e noi: la richiesta non è nemmeno arrivata al motore. La mano non è persa, riprova.");
    case "rete":
      return t("La connessione si è interrotta. La mano non è persa: l'asta riprende da dove si è fermata.");
    default:
      return t("Il motore che dichiara per lui non ha risposto in tempo. La mano non è persa: l'asta riprende da dove si è fermata.");
  }
}

/**
 * Tornei di licita: le stesse smazzate per tutti, con una classifica.
 *
 * PERCHÉ LE STELLE E NON I PUNTI. I punti di bridge dipendono dalla forza
 * delle carte — otto mani da slam valgono più di otto parziali — mentre le
 * stelle misurano quanto bene hai dichiarato QUELLA mano. In un torneo dove
 * tutti hanno le stesse carte le due cose ordinerebbero quasi allo stesso
 * modo, ma le stelle restano leggibili anche quando la classifica si guarda a
 * distanza di giorni.
 *
 * L'ASTA LA TIENE IL SERVER (`/api/licita/torneo`). Finché è aperta il
 * browser ha solo la mano di Sud; le dichiarazioni dei robot e il voto li
 * fa il server, che scrive anche il risultato. Prima le quattro mani, la
 * tabella double dummy e le stelle passavano dal browser: chiunque guardasse
 * la rete vedeva le carte degli avversari, o si scriveva tre stelle.
 *
 * SI PUÒ INTERROMPERE: le mani già dichiarate restano, e riaprendo la pagina
 * si riprende da dove si era. Otto mani sono un quarto d'ora, ventiquattro
 * sono tre sere: pretendere che si facciano in una volta vorrebbe dire non
 * farle fare a nessuno.
 */
export default function TorneoLicitaPage() {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const [tipo, setTipo] = useState<Tipo>("giornaliero");
  const [torneo, setTorneo] = useState<TorneoCorrente | null>(null);
  const [mano, setMano] = useState<(ManoCondivisa & { numero: number }) | null>(null);
  const [tabella, setTabella] = useState<DdsTable | null>(null);
  const [bids, setBids] = useState<string[]>([]);
  const [attesa, setAttesa] = useState(false);
  /** Il posto da cui si aspetta una dichiarazione: serve a dirlo in schermata. */
  const [attesaDi, setAttesaDi] = useState<Position | null>(null);
  const [esito, setEsito] = useState<EsitoLicita | null>(null);
  const [giocato, setGiocato] = useState<
    // `doppio`: la tabella di fine mano deve poter contare il contro, altrimenti
    // la riga «← il vostro» mostra la penalità liscia mentre il voto conta
    // quella contrata.
    { level: number; strain: Strain; declarer: Position; doppio: 1 | 2 | 4 } | null
  >(null);
  const [classifica, setClassifica] = useState<ClassificaTorneo | null>(null);
  const [avversarioMuto, setAvversarioMuto] = useState(false);
  /** Il compagno non ha risposto: l'asta è ferma e va detto. */
  const [compagnoMuto, setCompagnoMuto] = useState(false);
  /** PERCHÉ non ha risposto: decide che cosa dire e se offrire di riprovare. */
  const [motivoMuto, setMotivoMuto] = useState<MotivoBen | null>(null);
  /** Esito dell'ultima scrittura del risultato: governa se la mano è archiviata. */
  const [registrazione, setRegistrazione] = useState<EsitoRegistrazione | null>(null);
  /** Il server non ha risposto: la mano non è persa, si può riprendere. */
  const [erroreServer, setErroreServer] = useState(false);

  /** Si è rinunciato: adesso sì che vale la pena dirlo. */
  const segnalaRinuncia = (
    chi: Position,
    r: { motivo?: MotivoBen; dettaglio?: string; durata?: number },
  ) => {
    const tempo = r.durata !== undefined ? ` dopo ${(r.durata / 1000).toFixed(1)}s` : "";
    reportError(
      "torneo-licita:ben",
      new Error(
        `BEN non ha dichiarato per ${chi}${tempo}: ${r.motivo ?? "motivo ignoto"}` +
          (r.dettaglio ? ` (${r.dettaglio})` : ""),
      ),
    );
  };

  /**
   * Dopo la scrittura del risultato, da chiunque sia stata fatta (browser nel
   * flusso di prima, server in quello nuovo): contatore e classifica.
   */
  const dopoRegistrazione = async (esito: EsitoRegistrazione) => {
    setRegistrazione(esito);
    if (!torneo) return;

    // SI AVANZA SOLO SE IL DATABASE HA DAVVERO LA RIGA. Prima il contatore
    // cresceva comunque: con la sessione scaduta o un errore di scrittura la
    // mano risultava fatta a schermo e non esisteva da nessuna parte — il
    // guasto peggiore, perché non si vede.
    //
    // `gia-presente` avanza ma NON incrementa: la riga c'è (l'ha scritta il
    // primo tocco) e contarla due volte farebbe saltare una mano.
    if (manoArchiviata(esito)) {
      // IL CONTATORE LO DICE IL DATABASE. Incrementarlo qui sembrava
      // equivalente e non lo è: se la scrittura riesce ma la risposta si
      // perde per strada, al tentativo successivo torna `gia-presente` — la
      // riga c'è, ma NOI non l'abbiamo mai contata, e la mano resterebbe
      // scoperta per sempre.
      //
      // `torneoCorrente` calcola `fatte` contando le righe vere
      // (`scripts/sql/tornei-licita-2026-08.sql`). Costa una richiesta in
      // più a fine mano — una ogni paio di minuti — e in cambio il numero a
      // schermo è quello che il torneo userà per la classifica.
      const aggiornato = await torneoCorrente(tipo);
      if (aggiornato) setTorneo(aggiornato);
      else if (contatoreCresce(esito)) {
        // Non è arrivata la rilettura: si ripiega sul conteggio locale, che
        // è meglio di lasciare il numero fermo.
        setTorneo({ ...torneo, fatte: torneo.fatte + 1 });
      }
      setClassifica(await classificaTorneo(torneo.id));
    }
  };

  // ── Asta sul server (`/api/licita/torneo`) ─────────────────────────────

  /** A asta chiusa il server manda la mano intera: il voto si mostra come prima. */
  const mostraChiusa = async (m: ManoTorneo, finali: string[], esito: EsitoRegistrazione) => {
    // Lo stesso calcolo che il server ha usato per le stelle registrate: qui
    // serve per il commento, nella lingua di chi gioca.
    const v = votoMano(m, finali, t);
    setMano(m);
    setTabella(m.dd_table ? ({ tricks: m.dd_table } as DdsTable) : null);
    setBids(finali);
    if (v) {
      setEsito(v.voto);
      const e = v.esito;
      setGiocato(e ? { level: e.level, strain: e.strain, declarer: e.declarer, doppio: e.doppio } : null);
    }
    await dopoRegistrazione(esito);
  };

  /**
   * Applica una risposta del server e, finché non tocca a Sud, chiede la
   * dichiarazione successiva: una per richiesta, perché la schermata possa
   * dire chi sta pensando.
   */
  const avanzaServer = async (torneoId: string, primo: RispostaTorneo) => {
    let r = primo;
    setAttesa(true);
    setCompagnoMuto(false);
    setMotivoMuto(null);
    setErroreServer(false);
    try {
      // Un tetto per sicurezza: un'asta ha al massimo qualche decina di giri.
      for (let giro = 0; giro < 400; giro++) {
        switch (r.tipo) {
          case "finito":
            setMano(null);
            setTabella(null);
            return;
          case "errore":
            if (r.registrazione === "sessione-scaduta") setRegistrazione("sessione-scaduta");
            setErroreServer(true);
            return;
          case "chiusa":
            if (r.avversarioMuto) setAvversarioMuto(true);
            await mostraChiusa(r.mano, r.bids, r.registrazione);
            return;
          case "aperta":
            setMano(manoParziale(r.vista));
            setTabella(null);
            setBids(r.vista.bids);
            if (r.avversarioMuto) setAvversarioMuto(true);
            if (r.compagnoMuto) {
              segnalaRinuncia("north", { motivo: r.compagnoMuto });
              setMotivoMuto(r.compagnoMuto);
              setCompagnoMuto(true);
              return;
            }
            if (r.vista.turno === "south") return;
            setAttesaDi(r.vista.turno);
            r = await chiamaTorneo(torneoId, "robot");
        }
      }
    } finally {
      setAttesa(false);
      setAttesaDi(null);
    }
  };

  const dichiaraServer = async (b: string) => {
    if (!torneo) return;
    setBids([...bids, b]);
    setAttesa(true);
    await avanzaServer(torneo.id, await chiamaTorneo(torneo.id, "dichiara", b));
  };

  /** Riprende da dove l'asta si è fermata: `stato` rifà anche la chiusura mancata. */
  const riprendiServer = async (azione: "stato" | "robot") => {
    if (!torneo) return;
    setAttesa(true);
    await avanzaServer(torneo.id, await chiamaTorneo(torneo.id, azione));
  };

  /** Azzera la schermata per una mano nuova. */
  const azzera = () => {
    setBids([]);
    setEsito(null);
    setGiocato(null);
    setAvversarioMuto(false);
    setCompagnoMuto(false);
    setMotivoMuto(null);
    setRegistrazione(null);
    setErroreServer(false);
  };

  /**
   * La mano da dichiarare, all'apertura e per «Prossima mano». Se non apre
   * Sud, `avanzaServer` fa parlare subito i robot: senza, tre mani su quattro
   * resterebbero ferme senza nemmeno il cassetto delle dichiarazioni.
   */
  const carica = async (t: TorneoCorrente, vivo: () => boolean = () => true) => {
    azzera();
    const r = await chiamaTorneo(t.id, "stato");
    if (!vivo()) return;
    await avanzaServer(t.id, r);
  };

  const prossima = async () => {
    if (!torneo) return;
    await carica(torneo);
  };

  useEffect(() => {
    if (loading || !user) return;
    let vivo = true;
    torneoCorrente(tipo)
      .then(async (t) => {
        if (!vivo) return;
        setTorneo(t);
        if (!t) return;
        const [, cl] = await Promise.all([carica(t, () => vivo), classificaTorneo(t.id)]);
        if (!vivo) return;
        setClassifica(cl);
      })
      .catch((err) => reportError("torneo-licita:carica", err));
    return () => { vivo = false; };
    // `avanza` cambia a ogni render ma non cambia comportamento: metterlo fra
    // le dipendenze ricaricherebbe la mano a ogni dichiarazione.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ricaricherebbe la mano a ogni render
  }, [tipo, user, loading]);


  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold font-display mb-3">{t("Tornei di licita")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("Serve l'accesso: un torneo ha una classifica, e una classifica ha bisogno di sapere chi sei.")}
        </p>
        <Link href="/login?redirect=/gioca/torneo-licita"><Button>{t("Entra")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold font-display mb-1 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-gold" aria-hidden="true" />
        {t("Tornei di licita")}
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        {t("Le stesse smazzate per tutti. Si dichiara, si prendono le stelle, si finisce in classifica.")}
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        {t("Qui i robot usano BEN: le loro scelte possono differire dagli accordi del corso Fiori 2022. Il voto valuta il contratto, non l'aderenza al sistema del corso.")}
      </p>

      <div className="flex gap-2 mb-5" role="group" aria-label={t("Quale torneo")}>
        {([["giornaliero", "Oggi · 8 mani"], ["settimanale", "Settimana · 24 mani"]] as [Tipo, string][])
          .map(([t, etichetta]) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              aria-pressed={tipo === t}
              className={`text-sm rounded-full px-4 py-2 border transition-colors ${
                tipo === t
                  ? "bg-figb text-white border-figb"
                  : "border-border text-muted-foreground hover:border-figb"
              }`}
            >
              {etichetta}
            </button>
          ))}
      </div>

      {torneo && (
        <p className="text-sm mb-4">
          <strong>{torneo.fatte}</strong> mani su {torneo.quante}
          {torneo.quante > 0 && torneo.fatte >= torneo.quante && t(" — finito")}
        </p>
      )}

      {/* ── La mano ─────────────────────────────────────────────────────── */}
      {torneo && !mano && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <p className="text-sm">
            {torneo.quante === 0
              ? t("Le mani di questo torneo non sono ancora disponibili. Riprova più tardi: non hai completato né perso alcuna mano.")
              : torneo.fatte >= torneo.quante
                ? t("Hai finito questo torneo. La classifica qui sotto continua ad aggiornarsi finché non chiude.")
                : t("Non ci sono altre mani da dichiarare: il torneo è chiuso.")}
          </p>
        </div>
      )}

      {erroreServer && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
            {registrazione === "sessione-scaduta" ? t("Il tuo accesso è scaduto") : t("Il server non ha risposto")}
          </p>
          <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mb-3">
            {registrazione === "sessione-scaduta"
              ? t("Rientra e riapri il torneo: l'asta riprende da dove si è fermata.")
              : t("La mano non è persa: l'asta è salvata sul server e riprende da dove si è fermata.")}
          </p>
          <Button onClick={() => { void riprendiServer("stato"); }} disabled={attesa}>
            {t("Riprova")}
          </Button>
        </div>
      )}

      {mano && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">
                {t("Mano {n} · sei Sud", { n: mano.numero })}
              </Badge>
              {/* La zona e la posizione: senza, la mano non si può
                  dichiarare. Vedi `CondizioniAsta`. */}
              <CondizioniAsta
                io="south"
                dealer={mano.dealer}
                vulnerability={mano.vulnerability}
                punti={handHcp(mano.hands.south)}
              />
            </div>
            {SUITS.map((s) => (
              <p key={s} className="text-lg font-mono flex items-center gap-2">
                <SuitSymbol suit={s} size="sm" />
                {formatta(mano.hands.south, s)}
              </p>
            ))}
          </div>

          <div className="mb-4">
            <Asta
              dealer={mano.dealer}
              bids={bids}
              ioSono="south"
              onDichiara={(b) => { void dichiaraServer(b); }}
              disabilitato={attesa || !!esito}
            />
            <AttesaDichiarazione chi={attesaDi} />
          </div>

          {avversarioMuto && (
            <p className="text-xs text-muted-foreground mb-3">
              {t("Un avversario non ha dichiarato e ha passato d'ufficio: non è che abbia scelto di passare.")}
            </p>
          )}

          {compagnoMuto && !esito && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 mb-4">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                {t("Il compagno non ha risposto")}
              </p>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mb-3">
                {spiegazioneMuto(motivoMuto, t)}
              </p>
              {riprovareServe(motivoMuto ?? "attesa") ? (
                <Button onClick={() => { void riprendiServer("robot"); }}>
                  {t("Riprova")}
                </Button>
              ) : (
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                  {t("Riprovare adesso darebbe lo stesso errore. La mano resta dov'è: puoi tornare più tardi e l'asta riparte da qui.")}
                </p>
              )}
            </div>
          )}

          {esito && tabella && (
            <div className="rounded-2xl border border-border bg-card p-4 mb-6">
              <div className="flex justify-center mb-2">
                <Stelle quante={esito.stelle} className="[&_svg]:w-8 [&_svg]:h-8" />
              </div>
              {riferimento(mano, "ns").metro === "atteso" && (
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("Le stelle giudicano la scelta del contratto — quanto rende in media — non il risultato di questa smazzata.")}
                </p>
              )}
              <p className="text-sm text-muted-foreground mb-3">{esito.commento}</p>
              <RiepilogoMano
                deal={mano.hands}
                vulnerability={mano.vulnerability}
                {...tabelleFineMano({
                  table: tabella,
                  vulnerability: mano.vulnerability,
                  giocato,
                  // Il vostro contratto porta il voto in cima: vedi
                  // `tabelleFineMano`, che lo mette sulla riga giusta.
                  stelleDelVoto: esito.stelle,
                  // Un metro solo per tutta la tabella: il miglior contratto
                  // della smazzata, chiunque lo dichiari. Vedi
                  // `riferimentoUnico` — sul meglio della loro linea il loro
                  // contratto migliore prendeva tre stelle anche cadendo.
                  noi: {
                    riferimento: riferimentoUnico(mano).punteggio,
                    metro: riferimentoUnico(mano).metro,
                    ev:
                      riferimentoUnico(mano).metro === "atteso"
                        ? (c) => evDelContratto(mano, c)
                        : undefined,
                  },
                  loro: {
                    riferimento: riferimentoUnico(mano).punteggio,
                    metro: riferimentoUnico(mano).metro,
                    ev: (c) => evDelContratto(mano, c),
                  },
                })}
              />
                {riferimento(mano, "ns").metro !== riferimentoUnico(mano).metro && giocato && (giocato.declarer === "north" || giocato.declarer === "south") && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("Sulla riga del vostro contratto c'è il voto in cima. Le altre righe si misurano sul miglior contratto in media della smazzata; il vostro voto invece sul par, perché in media il contratto migliore era degli avversari.")}
                  </p>
                )}
                <div className="mt-4">
                  <RisultatoDoppioMorto
                    mani={mano.hands}
                    dealer={mano.dealer}
                    vulnerability={mano.vulnerability}
                    bids={bids}
                  />
                </div>
              {/* IL RISULTATO NON È ARRIVATO AL DATABASE. Non si passa avanti:
                  la mano sembrerebbe fatta e non esisterebbe da nessuna parte.
                  Il voto resta a schermo, l'asta non si ridichiara, e si offre
                  di risalvare — che è l'unica cosa che manca. */}
              {registrazione && !manoArchiviata(registrazione) ? (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    {t("Il risultato non è stato salvato")}
                  </p>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mb-3">
                    {registrazione === "sessione-scaduta"
                      ? t("Il tuo accesso è scaduto mentre giocavi. Rientra e premi Salva: la mano non va rigiocata, il voto è già calcolato.")
                      : t("Non siamo riusciti a scrivere il risultato. Il voto è già calcolato: premi Salva per riprovare, la mano non va rigiocata.")}
                  </p>
                  <Button
                    // `stato` su un'asta chiusa e non ancora registrata la
                    // fa registrare dal server: il voto non si ricalcola.
                    onClick={() => { void riprendiServer("stato"); }}
                    disabled={attesa}
                  >
                    {t("Salva il risultato")}
                  </Button>
                </div>
              ) : (
                <Button className="mt-4" onClick={prossima}>
                  {torneo && torneo.fatte >= torneo.quante ? "Vedi la classifica" : "Prossima mano"}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* ── La classifica ───────────────────────────────────────────────── */}
      <section>
        <h2 className="font-semibold mb-3">{t("Classifica")}</h2>
        {!classifica || classifica.totale === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("Ancora nessuno ha dichiarato. Il primo che finisce una mano compare qui.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="font-normal py-1 w-8">#</th>
                  <th className="font-normal py-1">{t("Giocatore")}</th>
                  <th className="font-normal py-1 text-right">{t("Mani")}</th>
                  <th className="font-normal py-1 text-right">{t("Stelle")}</th>
                </tr>
              </thead>
              <tbody>
                {classifica.righe.map((r, i) => (
                  <tr
                    key={`${r.posizione}-${i}`}
                    className={`border-t border-border ${r.sonoIo ? "font-bold text-figb" : ""}`}
                  >
                    <td className="py-2">{r.posizione}</td>
                    <td className="py-2">
                      {r.nome ?? "Un giocatore"}
                      {r.asd && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {r.asd}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">{r.mani}</td>
                    <td className="py-2 text-right font-mono">{r.stelle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {torneo && torneo.quante > 0 && torneo.fatte >= torneo.quante && Date.parse(torneo.chiudeAt) > Date.now() && (
        <p className="mt-4 text-pretty text-xs text-muted-foreground">
          {t("Hai finito le tue mani. Le aste degli altri si apriranno quando il torneo sarà chiuso per tutti.")}
        </p>
      )}

      {/* La chiave rimonta lo storico al cambio scheda: il componente riparte
          dal proprio stato iniziale senza una batteria di setState sincroni
          nell'effect di caricamento. */}
      <AsteTorneoConcluso key={tipo} tipo={tipo} />

      <p className="text-xs text-muted-foreground mt-6">
        {t("Le mani del torneo non compaiono in allenamento finché è aperto: chi si allena molto le incontrerebbe prima, e la classifica non direbbe più niente.")}
      </p>
    </div>
  );
}

function formatta(hand: readonly Card[], suit: Suit): string {
  const carte = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return carte.length ? carte.join(" ") : "—";
}
