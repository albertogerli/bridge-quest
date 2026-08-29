"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { Asta } from "@/components/bridge/asta";
import { AttesaDichiarazione } from "@/components/bridge/attesa-dichiarazione";
import { Stelle } from "@/components/bridge/stelle";
import { RiepilogoMano } from "@/components/bridge/riepilogo-mano";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { handHcp } from "@/lib/deal-generator";
import type { DdsTable } from "@/lib/dds-table";
import { benBid, riprovareServe, type MotivoBen } from "@/lib/ben-client";
import { astaChiusa, esitoAsta, ordineDa } from "@/lib/licita-mano";
import { contrattiDaRivedere } from "@/lib/riepilogo-mano";
import { valutaLicita, type EsitoLicita } from "@/lib/stelle-licita";
import type { Strain } from "@/lib/minibridge";
import {
  classificaTorneo, contatoreCresce, evDelContratto, manoArchiviata,
  registraRisultatoTorneo, riferimento,
  torneoCorrente, torneoMano,
  type ClassificaTorneo, type EsitoRegistrazione, type ManoCondivisa, type TorneoCorrente, riferimentoUnico } from "@/lib/mani-condivise";
import { useT } from "@/contexts/traduzioni-provider";

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
 * UNA MANO PER VOLTA, e arriva dal server. Consegnarle tutte insieme
 * vorrebbe dire mandare al browser le carte degli avversari di tutto il
 * torneo: chiunque guardi la risposta di rete vincerebbe.
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

  /**
   * Una dichiarazione dal motore.
   *
   * `benBid` NON LANCIA MAI: cattura tutto e restituisce `fallback: true`.
   * Qui c'era un `try/catch` con dentro l'unica segnalazione a Sentry di
   * questa schermata, e quel ramo non è mai stato eseguito: quando l'esercizio
   * si bloccava, in Sentry non arrivava niente e la causa restava invisibile.
   * Adesso si segnala sul valore di ritorno, che è dove l'errore arriva
   * davvero.
   */
  /**
   * Una dichiarazione dal motore.
   *
   * NON SEGNALA NIENTE, ed è deliberato. Qui c'era un `reportError` su ogni
   * fallimento, compreso quello che il ritentativo subito dopo rimediava: chi
   * giocava non si accorgeva di nulla e a noi arrivava un avviso lo stesso.
   * Un allarme deve voler dire «qualcuno è rimasto bloccato», altrimenti si
   * impara a ignorarlo — ed è il modo in cui gli allarmi smettono di servire.
   * La segnalazione si fa quando si rinuncia davvero, più sotto.
   *
   * I guasti veri di BEN li riferisce comunque il server (`api:ben-bid`), che
   * li vede tutti, ritentati o no.
   */
  const chiediABen = async (m: ManoCondivisa, chi: Position, fatte: string[]) => {
    // QUANTO CI HA MESSO fa parte della risposta. Sul ritentativo dei guasti
    // `edge` avevo dato per scontato che arrivassero subito — plausibile, mai
    // misurato. Se invece arrivassero dopo dieci secondi, ritentare due volte
    // terrebbe fermo lo schermo mezzo minuto: la decisione va presa sul fatto,
    // non sull'ipotesi. Il tempo finisce anche nella segnalazione, così la
    // prossima volta non ci sarà da indovinare.
    const avvio = Date.now();
    const r = await benBid({
      hand: m.hands[chi],
      seat: chi,
      dealer: m.dealer,
      vulnerability: m.vulnerability,
      bidding: { dealer: m.dealer, bids: fatte },
    });
    return { ...r, durata: Date.now() - avvio };
  };

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

  const chiudi = async (m: ManoCondivisa, t: DdsTable, finali: string[]) => {
    const e = esitoAsta(finali, m.dealer, t, m.vulnerability);
    const rif = riferimento(m, "ns");
    const perStelle =
      e && rif.metro === "atteso"
        ? (evDelContratto(m, { level: e.level, strain: e.strain, declarer: e.declarer }) ??
           e.punteggio)
        : (e?.punteggio ?? 0);

    const voto = valutaLicita(perStelle, rif.punteggio, rif.metro);
    setEsito(voto);
    setGiocato(e ? { level: e.level, strain: e.strain, declarer: e.declarer, doppio: e.doppio } : null);

    if (torneo) {
      const esitoScrittura = await registraRisultatoTorneo({
        torneoId: torneo.id,
        manoId: m.id,
        contratto: e?.contratto ?? null,
        dichiarante: e?.declarer ?? null,
        punteggio: e?.punteggio ?? 0,
        stelle: voto.stelle,
      });
      setRegistrazione(esitoScrittura);

      // SI AVANZA SOLO SE IL DATABASE HA DAVVERO LA RIGA. Prima il contatore
      // cresceva comunque: con la sessione scaduta o un errore di scrittura la
      // mano risultava fatta a schermo e non esisteva da nessuna parte — il
      // guasto peggiore, perché non si vede.
      //
      // `gia-presente` avanza ma NON incrementa: la riga c'è (l'ha scritta il
      // primo tocco) e contarla due volte farebbe saltare una mano.
      if (manoArchiviata(esitoScrittura)) {
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
        else if (contatoreCresce(esitoScrittura)) {
          // Non è arrivata la rilettura: si ripiega sul conteggio locale, che
          // è meglio di lasciare il numero fermo.
          setTorneo({ ...torneo, fatte: torneo.fatte + 1 });
        }
        setClassifica(await classificaTorneo(torneo.id));
      }
    }
  };

  /**
   * Fa dichiarare gli altri finché non tocca di nuovo a te.
   *
   * Se a tacere è un avversario passa d'ufficio e la schermata lo dice; se
   * tace il compagno non si può fare altro che fermarsi, perché l'esercizio è
   * proprio intendersi con lui. In torneo però la mano NON si annulla: la
   * classifica è la stessa per tutti e una mano saltata resterebbe un buco.
   * Si dice cosa è successo e si lascia riprovare.
   */
  const avanza = async (m: ManoCondivisa, t: DdsTable, iniziali: string[]) => {
    let correnti = iniziali;
    setBids(correnti);
    setCompagnoMuto(false);
    setMotivoMuto(null);
    if (astaChiusa(correnti)) {
      // L'ATTESA SI ACCENDE ANCHE QUI. Quando è la dichiarazione dell'utente a
      // chiudere l'asta si andava dritti a `chiudi` senza accenderla, e per
      // tutto il tempo della scrittura i pulsanti restavano premibili: due
      // tocchi rapidi su un telefono facevano registrare due volte la stessa
      // mano. Il database lo rifiuta — è la sua chiave primaria — e l'utente
      // vedeva un errore per aver premuto due volte.
      setAttesa(true);
      // `finally`: se `chiudi` sollevasse un'eccezione, senza questo la
      // schermata resterebbe in attesa per sempre e l'unica via d'uscita
      // sarebbe ricaricare la pagina.
      try {
        await chiudi(m, t, correnti);
      } finally {
        setAttesa(false);
      }
      return;
    }

    setAttesa(true);
    const ordine = ordineDa(m.dealer);
    while (!astaChiusa(correnti)) {
      const chi = ordine[correnti.length % 4];
      if (chi === "south") break;

      setAttesaDi(chi);
      // SI RITENTA SOLO SUI GUASTI ISTANTANEI, e fino a due volte.
      //
      // Il ritentativo automatico su tutto era stato tolto per un buon motivo:
      // quando la rinuncia arriva dopo venti secondi di attesa, rifarla in
      // silenzio porta l'utente a quaranta secondi di schermo fermo prima di
      // sapere qualcosa.
      //
      // `edge` è l'eccezione, ed è diversa in natura. Lì a rispondere non è la
      // nostra rotta ma qualcosa che le sta davanti, con una pagina d'errore
      // invece del JSON: la richiesta non è mai arrivata al motore, e torna
      // indietro SUBITO. Due tentativi in più costano meno di un secondo in
      // tutto, e un intoppo di connessione raramente si ripete tre volte.
      //
      // Fino al 28/08/2026 davanti c'era anche Cloudflare, ed era lui a
      // restituire quei «502 Bad gateway». Ora il proxy non c'è più: se questi
      // eventi continuano, la causa è un'altra e va cercata altrove — non
      // dare per scontato il colpevole di ieri.
      //
      // La pausa fra i tentativi non è cerimoniale: rifare la richiesta
      // nell'identico istante rischia di ripassare per la stessa connessione
      // guasta. Un attimo basta perché ne venga aperta un'altra.
      let r = await chiediABen(m, chi, correnti);
      for (const pausa of [300, 800]) {
        if (!r.fallback || r.motivo !== "edge") break;
        // Si ritenta solo se il guasto è arrivato SUBITO. Un `edge` lento
        // sarebbe una cosa diversa — qualcosa che scade invece che rompersi —
        // e insistere raddoppierebbe un'attesa già lunga.
        if (r.durata > 3000) break;
        await new Promise((ok) => setTimeout(ok, pausa));
        r = await chiediABen(m, chi, correnti);
      }
      // La dichiarazione da mettere nell'asta: quella di BEN, oppure il passo
      // d'ufficio dell'avversario che non ha risposto. Si tiene separata da `r`
      // perché il suo `motivo` serve ancora dopo, per dire cosa è successo.
      let dichiarazione = r.bid;
      if (r.fallback) {
        segnalaRinuncia(chi, r);
        if (chi === "north") {
          setMotivoMuto(r.motivo ?? null);
          // Senza il compagno l'esercizio non esiste, e in torneo la mano non
          // si può annullare: la classifica è la stessa per tutti e un buco
          // resterebbe. Si dice cosa è successo e si lascia riprovare da dove
          // l'asta si è fermata.
          setCompagnoMuto(true);
          setAttesa(false);
          setAttesaDi(null);
          return;
        }
        setAvversarioMuto(true);
        dichiarazione = "P";
      }
      correnti = [...correnti, dichiarazione];
      setBids(correnti);
    }
    setAttesa(false);
    setAttesaDi(null);
    if (astaChiusa(correnti)) {
      setAttesa(true);
      try {
        await chiudi(m, t, correnti);
      } finally {
        setAttesa(false);
      }
    }
  };

  const prossima = async () => {
    if (!torneo) return;
    const m = await torneoMano(torneo.id);
    const t = m?.dd_table ? ({ tricks: m.dd_table } as DdsTable) : null;
    setMano(m);
    setTabella(t);
    setBids([]);
    setEsito(null);
    setGiocato(null);
    setAvversarioMuto(false);
    setCompagnoMuto(false);
    setMotivoMuto(null);
    setRegistrazione(null);
    if (m && t && m.dealer !== "south") void avanza(m, t, []);
  };

  useEffect(() => {
    if (loading || !user) return;
    let vivo = true;
    torneoCorrente(tipo)
      .then(async (t) => {
        if (!vivo) return;
        setTorneo(t);
        if (!t) return;
        const [m, cl] = await Promise.all([torneoMano(t.id), classificaTorneo(t.id)]);
        if (!vivo) return;
        const tav = m?.dd_table ? ({ tricks: m.dd_table } as DdsTable) : null;
        setMano(m);
        setTabella(tav);
        setBids([]);
        setEsito(null);
        setGiocato(null);
        setAvversarioMuto(false);
        setClassifica(cl);
        // Se non apri tu, devono parlare gli altri: senza questa riga, con
        // mazziere diverso da Sud — cioè tre mani su quattro — il cassetto
        // delle dichiarazioni non compare (non è il tuo turno) e nessuno fa
        // parlare i robot. Il torneo resta fermo alla prima mano, senza
        // nemmeno un pulsante per uscirne.
        if (m && tav && m.dealer !== "south") void avanza(m, tav, []);
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
          {torneo.fatte >= torneo.quante && " — finito"}
        </p>
      )}

      {/* ── La mano ─────────────────────────────────────────────────────── */}
      {torneo && !mano && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <p className="text-sm">
            {torneo.fatte >= torneo.quante
              ? "Hai finito questo torneo. La classifica qui sotto continua ad aggiornarsi finché non chiude."
              : "Non ci sono altre mani da dichiarare: il torneo è chiuso."}
          </p>
        </div>
      )}

      {mano && tabella && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">
                Mano {mano.numero} · sei Sud
              </Badge>
              <span className="text-xs text-muted-foreground">
                {handHcp(mano.hands.south)} PO
              </span>
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
              onDichiara={(b) => { void avanza(mano, tabella, [...bids, b]); }}
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
                <Button onClick={() => { void avanza(mano, tabella, bids); }}>
                  {t("Riprova")}
                </Button>
              ) : (
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                  {t("Riprovare adesso darebbe lo stesso errore. La mano resta dov'è: puoi tornare più tardi e l'asta riparte da qui.")}
                </p>
              )}
            </div>
          )}

          {esito && (
            <div className="rounded-2xl border border-border bg-card p-4 mb-6">
              <div className="flex justify-center mb-2">
                <Stelle quante={esito.stelle} className="[&_svg]:w-8 [&_svg]:h-8" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{esito.commento}</p>
              <RiepilogoMano
                deal={mano.hands}
                vulnerability={mano.vulnerability}
                avversari={contrattiDaRivedere({
                  table: tabella,
                  lato: "ew",
                  ancheSenzaContratto: true,
                  vulnerability: mano.vulnerability,
                  // Un metro solo per tutta la tabella: il miglior contratto
                  // della smazzata, chiunque lo dichiari. Vedi
                  // `riferimentoUnico` — sul meglio della loro linea il loro
                  // contratto migliore prendeva tre stelle anche cadendo.
                  riferimento: riferimentoUnico(mano).punteggio,
                  metro: riferimentoUnico(mano).metro,
                  giocato,
                  ev: (c) => evDelContratto(mano, c),
                }).slice(0, 2)}
                contratti={contrattiDaRivedere({
                  table: tabella,
                  lato: "ns",
                  vulnerability: mano.vulnerability,
                  // Lo stesso metro della sezione avversari: è una tabella
                  // sola, e due riferimenti diversi renderebbero le stelle
                  // incomparabili proprio dove servono per confrontare.
                  riferimento: riferimentoUnico(mano).punteggio,
                  metro: riferimentoUnico(mano).metro,
                  giocato,
                  ev:
                    riferimentoUnico(mano).metro === "atteso"
                      ? (c) => evDelContratto(mano, c)
                      : undefined,
                })}
              />
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
                    onClick={() => {
                      if (!mano || !tabella) return;
                      // L'ATTESA VA ACCESA QUI. `disabled={attesa}` da solo non
                      // proteggeva niente: `chiudi` non la accende, quindi il
                      // pulsante restava premibile e due tocchi avviavano due
                      // salvataggi in parallelo. L'idempotenza salva il
                      // database, non l'interfaccia.
                      setAttesa(true);
                      void chiudi(mano, tabella, bids).finally(() => setAttesa(false));
                    }}
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
