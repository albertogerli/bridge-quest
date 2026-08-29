/**
 * Le mani della scorta condivisa, e il confronto col campo.
 *
 * PERCHÉ NON SI GENERA PIÙ NEL BROWSER
 * Una mano generata al volo è tua e basta: nessuno l'ha mai vista, quindi non
 * esiste nessun «il 63% ha dichiarato manche» da metterci accanto. Le mani
 * della scorta invece le fanno tutti, e il confronto col campo — che è la cosa
 * che fa capire un voto molto più di tre stelline — diventa possibile.
 *
 * In più il conto costoso (par, tabella double dummy, valore atteso) è già
 * stato pagato in fase di generazione: qui si legge e basta.
 *
 * Le regole di accesso stanno nel database
 * (`scripts/sql/scenari-e-mani-2026-08.sql`): qui non si decide niente.
 */

import { createClient } from "@/lib/supabase/client";
import type { Card, Position } from "./bridge-engine";
import type { Strain } from "./minibridge";
import type { Vulnerability } from "./catalog";
import { strainOf, type TableStrain } from "./dds-table";
import { evDaDistribuzione, type Distribuzione } from "./valore-atteso";
import { reportError } from "./report-error";

export interface ContrattoAttesoDb {
  level: number;
  strain: Strain;
  declarer: Position;
  ev: number;
  mantenuto: number;
}

export interface ManoCondivisa {
  id: string;
  hands: Record<Position, Card[]>;
  dealer: Position;
  vulnerability: Vulnerability;
  par_contracts: string[] | null;
  par_score: number | null;
  dd_table: Record<string, Record<Position, number>> | null;
  valore_atteso: { ns: ContrattoAttesoDb; ew: ContrattoAttesoDb; prove: number } | null;
  /**
   * Le distribuzioni delle prese sulle rimescolate, per linea. Da qui esce il
   * valore atteso di qualunque contratto senza risolvere niente.
   */
  distribuzioni: {
    ns: Record<TableStrain, Record<string, Distribuzione>>;
    ew: Record<TableStrain, Record<string, Distribuzione>>;
    prove: number;
  } | null;
  scenario: { id: string; nome: string; descrizione: string | null; slug: string | null } | null;
}

export interface ConfrontoCampo {
  totale: number;
  mio: { contratto: string | null; punteggio: number; stelle: number } | null;
  /** Percentuale di chi ha fatto peggio. Null se sei il primo. */
  percentile: number | null;
  contratti: {
    contratto: string;
    quanti: number;
    punteggioMedio: number;
    stelleMedie: number;
  }[];
}

/**
 * Una mano che non hai ancora dichiarato, dallo scenario chiesto o da tutti.
 *
 * Torna `null` anche quando la scorta è finita, non solo in caso di errore: chi
 * chiama deve distinguere «non c'è più niente da fare» da «è andato storto
 * qualcosa», e per questo il caso di errore passa da `reportError`.
 */
export async function manoDaFare(slug?: string): Promise<ManoCondivisa | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("mano_da_fare", { p_slug: slug ?? null });
    if (error) {
      reportError("mani-condivise:pesca", error);
      return null;
    }
    return (data as ManoCondivisa | null) ?? null;
  } catch (err) {
    reportError("mani-condivise:pesca", err);
    return null;
  }
}

/**
 * Registra come è andata. Una mano si dichiara una volta sola: il secondo
 * tentativo viene rifiutato dal database, e va bene così — è la condizione che
 * tiene onesto il confronto col campo.
 */
export async function registraRisultato(r: {
  manoId: string;
  contratto: string | null;
  dichiarante: string | null;
  punteggio: number;
  stelle: number;
  partnerId?: string | null;
}): Promise<boolean> {
  try {
    const supabase = createClient();
    // `getUser()` e non `getSession()`: qui si sta per SCRIVERE, e la domanda
    // non è «ho un token sul disco» ma «quel token vale ancora». Sono due cose
    // diverse per la finestra in cui il token è scaduto ma non ancora scartato.
    const { data: sessione, error: erroreSessione } = await supabase.auth.getUser();
    const uid = sessione.user?.id;
    if (erroreSessione || !uid) return false;
    const { error } = await supabase.from("risultati_mano").insert({
      mano_id: r.manoId,
      user_id: uid,
      partner_id: r.partnerId ?? null,
      contratto: r.contratto,
      dichiarante: r.dichiarante,
      punteggio: r.punteggio,
      stelle: r.stelle,
    });
    if (error) {
      reportError("mani-condivise:registra", error);
      return false;
    }
    return true;
  } catch (err) {
    reportError("mani-condivise:registra", err);
    return false;
  }
}

/**
 * Con chi ci si confronta.
 *
 * `tutti` è il campo; `amici` sono le persone che hai accettato — ed è l'unico
 * filtro in cui escono i nomi, perché l'amicizia è già un consenso reciproco;
 * `classe` sono i compagni di corso, `asd` i soci del tuo circolo.
 */
export type FiltroCampo = "tutti" | "amici" | "classe" | "asd";

export interface PersonaConfronto {
  nome: string | null;
  contratto: string;
  punteggio: number;
  stelle: number;
}

/**
 * Come è andata a un gruppo di persone sulla stessa mano.
 *
 * Il paragone col campo intero mette insieme chi gioca da vent'anni e chi ha
 * cominciato a marzo: per un allievo il numero che significa qualcosa è
 * rispetto ai suoi compagni di classe.
 */
export async function confrontoFiltrato(
  manoId: string,
  filtro: FiltroCampo
): Promise<(ConfrontoCampo & { persone: PersonaConfronto[] | null }) | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("confronto_campo_filtrato", {
      p_mano_id: manoId,
      p_filtro: filtro,
    });
    if (error) {
      reportError("mani-condivise:confronto-filtrato", error);
      return null;
    }
    return (data as (ConfrontoCampo & { persone: PersonaConfronto[] | null }) | null) ?? null;
  } catch (err) {
    reportError("mani-condivise:confronto-filtrato", err);
    return null;
  }
}

/** Come è andata agli altri sulla stessa mano. Mai nomi: solo numeri. */
export async function confrontoCampo(manoId: string): Promise<ConfrontoCampo | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("confronto_campo", { p_mano_id: manoId });
    if (error) {
      reportError("mani-condivise:confronto", error);
      return null;
    }
    return (data as ConfrontoCampo | null) ?? null;
  } catch (err) {
    reportError("mani-condivise:confronto", err);
    return null;
  }
}

/**
 * Il riferimento con cui si danno le stelle, e con che metro.
 *
 * DUE SITUAZIONI DIVERSE, DUE METRI.
 *
 * Se la mano è tua — la tua linea in media rende più della loro — la domanda è
 * «qual era il contratto giusto da scegliere?», e la risposta si misura in
 * valore atteso: il tuo contratto contro il migliore, tutti e due in media.
 * Così una buona dichiarazione resta buona anche quando le carte stanno male.
 *
 * Se la mano è LORO, quel confronto smette di funzionare, e vale la pena
 * spiegare perché invece di lasciarlo passare. Il valore atteso di un tuo
 * contratto presuppone che tu quel contratto lo giochi indisturbato: ma se la
 * mano è loro non te lo lasciano giocare, dichiarano sopra. Prendendo «il
 * meglio che potevi fare» come «lasciarli giocare», qualunque tua
 * dichiarazione che perde meno della loro manche risulterebbe ottima, e
 * pioverebbero tre stelle su tutto — compreso un 3♣ senza capo né coda.
 * In competizione il metro giusto esiste già ed è il PAR: tiene conto anche
 * del sacrificio, ed è l'equilibrio vero della smazzata. Lì si confronta il
 * risultato reale col par reale, che è di nuovo un confronto onesto.
 *
 * In tutti e due i casi numeratore e denominatore sono della stessa specie: è
 * l'unica regola che conta.
 */
export function riferimento(
  mano: ManoCondivisa,
  lato: "ns" | "ew"
): { punteggio: number; metro: "atteso" | "esatto" } {
  const va = mano.valore_atteso;
  const par = mano.par_score ?? 0;
  const parPerNoi = lato === "ns" ? par : -par;

  // Il valore atteso serve da riferimento SOLO se la mano porta anche le
  // distribuzioni: senza, il contratto raggiunto si potrebbe valutare solo col
  // punteggio reale, e confrontare un punteggio reale con un valore atteso è
  // il difetto che questo controllo esiste per impedire.
  if (!va || !mano.distribuzioni) return { punteggio: parPerNoi, metro: "esatto" };

  const nostro = va[lato].ev;
  const loro = va[lato === "ns" ? "ew" : "ns"].ev;
  if (nostro < loro) return { punteggio: parPerNoi, metro: "esatto" };

  /**
   * Il riferimento si rimisura sull'istogramma completo, lo stesso da cui
   * vengono i valori della tabella di fine mano.
   *
   * QUALE CONTRATTO: quello scelto alla generazione, che è stato scelto su
   * metà delle rimescolate e misurato sull'altra metà — il modo di non farsi
   * ingannare dal contratto che ha avuto fortuna. Ma quel numero viene da un
   * campione diverso da quello della tabella, e usarlo così com'era produceva
   * una stranezza visibile: nella tabella NESSUN contratto arrivava a tre
   * stelle, nemmeno il migliore. Rimisurandolo sullo stesso istogramma degli
   * altri, il migliore prende tre stelle per costruzione.
   */
  const dalPuntoDiVistaNs = evDelContratto(mano, {
    level: va[lato].level,
    strain: va[lato].strain,
    declarer: va[lato].declarer,
  });
  if (dalPuntoDiVistaNs === null) return { punteggio: nostro, metro: "atteso" };
  // `evDelContratto` risponde sempre come il par, cioè dal punto di vista di
  // Nord-Sud: per Est-Ovest il riferimento va girato.
  return { punteggio: lato === "ns" ? dalPuntoDiVistaNs : -dalPuntoDiVistaNs, metro: "atteso" };
}

/**
 * Il metro con cui si giudicano i contratti di UN lato: il suo contratto
 * migliore, misurato sullo stesso istogramma da cui vengono i valori mostrati.
 *
 * PERCHÉ NON BASTA `riferimento`. Quella funzione risponde alla domanda «come
 * è andata a voi», e quando la mano è degli avversari cambia metro apposta:
 * il vostro obiettivo non è più il vostro contratto migliore ma limitare i
 * danni, quindi il riferimento diventa il par. Giusto per la vostra linea,
 * disastroso per la loro: girato di segno, il par vale per loro qualcosa come
 * −620 su una mano vostra, e `valutaLicita` dà tre stelle a tutto ciò che sta
 * SOPRA il riferimento. Risultato visto in pagina il 16/08/2026: nel riquadro
 * «Cosa potevano fare loro» ogni riga aveva tre stelle piene, compresa quella
 * di un contratto che cadeva.
 *
 * Qui il metro è sempre lo stesso: quanto rendeva il loro contratto migliore.
 * Così le stelle dicono la cosa per cui quel riquadro esiste — se la mano era
 * loro, e quanto vicino al loro meglio era ciascun contratto.
 *
 * Senza valore atteso o senza distribuzioni si torna al par di quel lato, con
 * metro «esatto»: punteggi reali confrontati con un punteggio reale.
 */
export function migliorContrattoDi(
  mano: ManoCondivisa,
  lato: "ns" | "ew"
): { punteggio: number; metro: "atteso" | "esatto" } {
  const va = mano.valore_atteso;
  const par = mano.par_score ?? 0;
  if (!va || !mano.distribuzioni) {
    return { punteggio: lato === "ns" ? par : -par, metro: "esatto" };
  }

  const suNs = evDelContratto(mano, {
    level: va[lato].level,
    strain: va[lato].strain,
    declarer: va[lato].declarer,
  });
  // `evDelContratto` risponde sempre dal punto di vista di Nord-Sud, come il
  // par: per Est-Ovest il riferimento va girato.
  if (suNs === null) return { punteggio: va[lato].ev, metro: "atteso" };
  return { punteggio: lato === "ns" ? suNs : -suNs, metro: "atteso" };
}

/**
 * UN METRO SOLO PER TUTTA LA TABELLA: il miglior contratto della smazzata,
 * chiunque lo dichiari.
 *
 * PERCHÉ. Misurare i contratti di ogni linea sul meglio della PROPRIA linea
 * sembra giusto e non lo è: il migliore di una linea prende tre stelle per
 * costruzione, anche quando è un disastro. Nel riquadro «cosa potevano fare
 * loro» si vedeva `1♥ di Est` — che cade di due — con tre stelle piene, e chi
 * legge capisce «avevano una bella mano», che è l'opposto della verità
 * (16/08/2026).
 *
 * Con un riferimento solo le stelle mantengono un significato unico in tutta
 * la tabella: quanto vale questo contratto rispetto al meglio ottenibile su
 * questa smazzata. Se la mano è vostra le loro righe scendono da sole; se è
 * loro, salgono le loro e scendono le vostre — ed è esattamente la cosa che il
 * riquadro deve far vedere.
 *
 * OGNI VALORE È VISTO DALLA LINEA CHE DICHIARA, riferimento compreso: si
 * confronta «quanto rende a chi lo gioca» con «quanto rendeva il meglio a chi
 * lo giocava», che sono grandezze della stessa specie.
 *
 * NON È IL METRO DEL VOTO. Il voto in cima giudica la TUA scelta fra quelle
 * che avevi, e quando la mano è degli avversari il suo riferimento resta il
 * par: non si può chiedere all'allievo di raggiungere una manche che non
 * aveva le carte per fare. Qui invece la domanda è un'altra — quanto valeva
 * ogni contratto — e la risposta non dipende da chi la fa.
 */
export function riferimentoUnico(
  mano: ManoCondivisa
): { punteggio: number; metro: "atteso" | "esatto" } {
  const nostro = migliorContrattoDi(mano, "ns");
  const loro = migliorContrattoDi(mano, "ew");
  return nostro.punteggio >= loro.punteggio ? nostro : loro;
}

/**
 * Pubblica uno scenario e le sue mani nella scorta condivisa.
 *
 * Serve agli insegnanti: le mani generate per una lezione diventano un
 * esercizio che tutta la classe incontra, e su cui ci si può confrontare. Una
 * mano che vede una persona sola non ha percentuale di campo.
 *
 * SENZA VALORE ATTESO. Il calcolo costa una quarantina di risoluzioni double
 * dummy a mano: mezzo minuto per mano in un browser, cioè dieci minuti per
 * venti mani con la pagina bloccata. Qui si salvano par e tabella double
 * dummy, che sono già stati calcolati per l'anteprima; le stelle useranno il
 * par, come prima delle mani condivise. `scripts/genera-scorta.ts` può
 * completarle dopo, senza fretta e senza far aspettare nessuno.
 *
 * Chi non insegna non passa: il controllo è nelle policy, non qui.
 */
export async function pubblicaScenario(
  scenario: { nome: string; descrizione?: string; vincoli: unknown; pubblico?: boolean },
  mani: {
    hands: Record<Position, Card[]>;
    dealer: Position;
    vulnerability: Vulnerability;
    parScore: number;
    parContracts: string[];
    ddTable: Record<string, Record<Position, number>>;
  }[]
): Promise<{ id: string; quante: number } | { errore: string }> {
  try {
    const supabase = createClient();
    const { data: sessione } = await supabase.auth.getUser();
    const uid = sessione.user?.id;
    if (!uid) return { errore: "Serve l'accesso." };

    const { data: sc, error: eSc } = await supabase
      .from("scenari")
      .insert({
        nome: scenario.nome,
        descrizione: scenario.descrizione ?? null,
        vincoli: scenario.vincoli,
        autore_id: uid,
        pubblico: scenario.pubblico ?? true,
      })
      .select("id")
      .single();
    if (eSc || !sc) {
      reportError("mani-condivise:pubblica-scenario", eSc);
      return { errore: "Solo chi insegna può pubblicare uno scenario." };
    }

    const { error: eM } = await supabase.from("mani_generate").insert(
      mani.map((m) => ({
        scenario_id: sc.id,
        hands: m.hands,
        dealer: m.dealer,
        vulnerability: m.vulnerability,
        par_contracts: m.parContracts,
        par_score: m.parScore,
        dd_table: m.ddTable,
      }))
    );
    if (eM) {
      // Uno scenario senza mani è peggio di nessuno scenario: si ritira.
      await supabase.from("scenari").delete().eq("id", sc.id);
      reportError("mani-condivise:pubblica-mani", eM);
      return { errore: "Le mani non sono state salvate: scenario annullato." };
    }

    return { id: sc.id, quante: mani.length };
  } catch (err) {
    reportError("mani-condivise:pubblica", err);
    return { errore: "Non è stato possibile pubblicare." };
  }
}

/**
 * Il valore atteso di un contratto su questa mano, visto da Nord-Sud.
 *
 * È il numero con cui si danno le stelle: va confrontato con `riferimento`,
 * che è anche lui un valore atteso. Prima si confrontava il punteggio REALE
 * del contratto raggiunto con il valore ATTESO del migliore — due metri
 * diversi — e sulle smazzate dove le carte stavano bene pioveva tre stelle su
 * tutto, mentre su quelle storte puniva per il mescolamento.
 *
 * Torna `null` per le mani generate prima delle distribuzioni: lì il metro
 * resta il par, e `riferimento` lo sa.
 */
export function evDelContratto(
  mano: ManoCondivisa,
  contratto: { level: number; strain: Strain; declarer: Position; doppio?: 1 | 2 | 4 }
): number | null {
  const lato: "ns" | "ew" =
    contratto.declarer === "north" || contratto.declarer === "south" ? "ns" : "ew";
  const dist = mano.distribuzioni?.[lato]?.[chiaveDenominazione(contratto.strain)]?.[
    contratto.declarer
  ];
  if (!dist) return null;

  const inZona = mano.vulnerability === "both" || mano.vulnerability === lato;
  const { ev } = evDaDistribuzione(dist, {
    level: contratto.level,
    strain: contratto.strain,
    vulnerable: inZona,
    doppio: contratto.doppio,
  });
  // Sempre dal punto di vista di Nord-Sud, come il par: un contratto
  // avversario conta col segno meno.
  return lato === "ns" ? ev : -ev;
}

function chiaveDenominazione(strain: Strain): TableStrain {
  return strainOf(strain === "nt" ? null : strain);
}

// ─── Tornei di licita ───────────────────────────────────────────────────────

export interface TorneoCorrente {
  id: string;
  tipo: "giornaliero" | "settimanale";
  periodo: number;
  chiudeAt: string;
  quante: number;
  fatte: number;
}

export interface RigaClassifica {
  posizione: number;
  nome: string | null;
  asd: string | null;
  stelle: number;
  mani: number;
  sonoIo: boolean;
}

export interface ClassificaTorneo {
  totale: number;
  mia: { posizione: number; stelle: number; mani: number } | null;
  righe: RigaClassifica[];
}


/**
 * Segnala un errore dei tornei, TRANNE quando è solo la sessione finita.
 *
 * Le funzioni dei tornei sono concesse al solo ruolo `authenticated`: chi non
 * ha (più) l'accesso riceve «permission denied for function torneo_corrente»,
 * ed è il comportamento voluto, non un guasto. Capita davvero — la sessione
 * scade mentre la pagina è aperta — e finiva in Sentry come errore.
 *
 * NON SI ZITTISCONO I «permission denied» IN BLOCCO. Il 20/08/2026 uno di
 * quelli era un difetto vero, e nasconderlo sarebbe costato giorni: il profilo
 * non si salvava perché mancava un privilegio. La differenza la fa la
 * sessione, e qui la si guarda: senza sessione il rifiuto è atteso e si tace;
 * CON una sessione valida un rifiuto è un problema di configurazione e deve
 * arrivare.
 *
 * `getSession()` legge quello che c'è in locale e non fa richieste: non
 * aggiunge attesa e non fallisce a sua volta.
 */
export function vaSegnalato(errore: unknown, haSessione: boolean): boolean {
  const messaggio =
    typeof errore === "object" && errore !== null && "message" in errore
      ? String((errore as { message?: unknown }).message ?? "")
      : String(errore ?? "");
  if (/permission denied/i.test(messaggio) && !haSessione) return false;
  return true;
}

async function segnalaSeNonEScaduta(
  supabase: ReturnType<typeof createClient>,
  scope: string,
  errore: unknown,
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!vaSegnalato(errore, !!data.session)) return;
  reportError(scope, errore);
}

/** Il torneo del periodo, creandolo se è il primo ad arrivare. */
export async function torneoCorrente(
  tipo: "giornaliero" | "settimanale"
): Promise<TorneoCorrente | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("torneo_corrente", { p_tipo: tipo });
    if (error) {
      await segnalaSeNonEScaduta(supabase, "tornei:corrente", error);
      return null;
    }
    return (data as TorneoCorrente | null) ?? null;
  } catch (err) {
    reportError("tornei:corrente", err);
    return null;
  }
}

/**
 * La prossima mano del torneo. `null` quando sono finite o il torneo è chiuso.
 *
 * Una per volta: consegnarle tutte insieme vorrebbe dire mandare al browser le
 * carte degli avversari di tutto il torneo.
 */
export async function torneoMano(
  torneoId: string
): Promise<(ManoCondivisa & { numero: number }) | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("torneo_mano", { p_torneo: torneoId });
    if (error) {
      await segnalaSeNonEScaduta(supabase, "tornei:mano", error);
      return null;
    }
    return (data as (ManoCondivisa & { numero: number }) | null) ?? null;
  } catch (err) {
    reportError("tornei:mano", err);
    return null;
  }
}

/**
 * Come è andata la registrazione. NON è un dettaglio diagnostico: da questo
 * dipende se la schermata può considerare la mano archiviata.
 *
 *   `salvato`         la riga è stata scritta adesso.
 *   `gia-presente`    c'era già (doppio tocco): il risultato È nel database,
 *                     ma il contatore delle mani fatte NON va incrementato di
 *                     nuovo — altrimenti chi tocca due volte «avanza» di due.
 *   `sessione-scaduta` l'accesso non è più valido: niente è stato scritto, e
 *                     l'unica cosa che serve è rientrare.
 *   `errore`          qualsiasi altro fallimento. Niente è stato scritto.
 */
export type EsitoRegistrazione =
  | "salvato"
  | "gia-presente"
  | "sessione-scaduta"
  | "errore";

/**
 * Si può passare alla mano successiva: il risultato è al sicuro nel database.
 * `gia-presente` conta come archiviata — la riga c'è, l'ha scritta il primo
 * tocco.
 */
export function manoArchiviata(esito: EsitoRegistrazione): boolean {
  return esito === "salvato" || esito === "gia-presente";
}

/**
 * Il contatore delle mani fatte cresce SOLO per una scrittura nuova.
 * Incrementarlo anche su `gia-presente` farebbe saltare una mano del torneo a
 * chi tocca due volte.
 */
export function contatoreCresce(esito: EsitoRegistrazione): boolean {
  return esito === "salvato";
}

export async function registraRisultatoTorneo(r: {
  torneoId: string;
  manoId: string;
  contratto: string | null;
  dichiarante: string | null;
  punteggio: number;
  stelle: number;
}): Promise<EsitoRegistrazione> {
  try {
    const supabase = createClient();
    // `getUser()` e non `getSession()`: qui si sta per SCRIVERE, e la domanda
    // non è «ho un token sul disco» ma «quel token vale ancora». Sono due cose
    // diverse per la finestra in cui il token è scaduto ma non ancora scartato.
    const { data: sessione, error: erroreSessione } = await supabase.auth.getUser();
    const uid = sessione.user?.id;
    if (erroreSessione || !uid) return "sessione-scaduta";
    // SCRIVERE DUE VOLTE LA STESSA MANO NON È UN ERRORE, è un doppio tocco.
    //
    // La chiave primaria è (torneo_id, mano_id, user_id), e con una `insert`
    // il secondo tentativo faceva fallire tutto con «duplicate key value
    // violates unique constraint» — visto in produzione il 28/08/2026 da un
    // telefono. Non serviva un caso strano: quando la dichiarazione dell'utente
    // chiude l'asta, la registrazione parte subito e per il tempo della
    // scrittura i pulsanti restano premibili.
    //
    // `ignoreDuplicates` fa sì che il secondo arrivo non scriva niente, e non è
    // solo comodo: nel torneo VALE IL PRIMO RISULTATO. Sovrascriverlo darebbe a
    // chi tocca due volte un secondo tentativo che gli altri non hanno.
    // Il `.select()` serve a SAPERE se la riga è stata scritta adesso: con
    // `ON CONFLICT DO NOTHING` un conflitto non è un errore, e senza rileggere
    // non si distingue «salvato» da «c'era già». La differenza conta, perché
    // il contatore delle mani fatte non deve crescere due volte per un doppio
    // tocco.
    const { data: scritte, error } = await supabase
      .from("risultati_torneo")
      .upsert(
        {
          torneo_id: r.torneoId,
          mano_id: r.manoId,
          user_id: uid,
          contratto: r.contratto,
          dichiarante: r.dichiarante,
          punteggio: r.punteggio,
          stelle: r.stelle,
        },
        { onConflict: "torneo_id,mano_id,user_id", ignoreDuplicates: true },
      )
      .select("mano_id");
    if (error) {
      await segnalaSeNonEScaduta(supabase, "tornei:registra", error);
      // «permission denied» NON basta a dire «sessione scaduta». L'identità era
      // stata appena verificata con `getUser()`: se il rifiuto arriva subito
      // dopo, la spiegazione più probabile è un privilegio configurato male —
      // e mostrare «rientra» manderebbe l'utente a rifare l'accesso per un
      // problema nostro, che il nuovo accesso non risolve.
      //
      // Si richiede l'identità UNA VOLTA, solo su questo ramo: se adesso non
      // c'è più, la sessione è davvero caduta nel frattempo (finestra stretta
      // ma reale); se c'è ancora, è un errore e va detto come tale.
      if (/permission denied/i.test(error.message ?? "")) {
        const { data: ancora, error: erroreAncora } = await supabase.auth.getUser();
        return erroreAncora || !ancora.user ? "sessione-scaduta" : "errore";
      }
      return "errore";
    }
    return (scritte?.length ?? 0) > 0 ? "salvato" : "gia-presente";
  } catch (err) {
    reportError("tornei:registra", err);
    return "errore";
  }
}

export async function classificaTorneo(torneoId: string): Promise<ClassificaTorneo | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("classifica_torneo", { p_torneo: torneoId });
    if (error) {
      await segnalaSeNonEScaduta(supabase, "tornei:classifica", error);
      return null;
    }
    return (data as ClassificaTorneo | null) ?? null;
  } catch (err) {
    reportError("tornei:classifica", err);
    return null;
  }
}
