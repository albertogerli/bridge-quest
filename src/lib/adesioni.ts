/**
 * Le adesioni alla Lezione Zero, e i doppioni che l'insegnante deve vedere.
 *
 * IL CASO VERO NON È IL BUONTEMPONE. Chi riempie una lista di nomi finti esiste
 * ma è raro; quello che capita ogni sera è la stessa persona che aderisce due
 * volte perché non ricorda di averlo già fatto, oppure la moglie che aderisce e
 * poi iscrive anche il marito con il PROPRIO numero.
 *
 * I DOPPIONI SI MOSTRANO, NON SI RIFIUTANO. Bloccare due adesioni con lo stesso
 * recapito sembra la difesa ovvia e romperebbe il caso legittimo più comune —
 * quello del marito. Chi sa se sono due persone o due volte la stessa è
 * l'insegnante, che le conosce; il portale gli mette le righe sotto gli occhi e
 * lui decide.
 */

/**
 * Chi si può collegare a un'adesione, ordinato per somiglianza del nome.
 *
 * L'ORDINE È UN SUGGERIMENTO, NON UNA DECISIONE. In una classe ci sono due
 * Maria Rossi e chi le distingue è l'insegnante: il portale gli mette in cima
 * quella che probabilmente cerca, e sceglie lui. Un algoritmo che collegasse da
 * solo sbaglierebbe proprio nel caso per cui abbiamo scelto lui.
 */
export function candidatiPerAdesione<T extends { student_id: string; display_name?: string | null }>(
  adesione: { nome: string },
  membri: readonly T[],
  giaCollegati: ReadonlySet<string>,
): T[] {
  const cercato = nomeNormalizzato(adesione.nome);
  const parole = new Set(cercato.split(" ").filter(Boolean));
  return membri
    .filter((m) => !giaCollegati.has(m.student_id))
    .map((m) => {
      const suo = nomeNormalizzato(m.display_name ?? "");
      const comuni = suo.split(" ").filter((p) => p && parole.has(p)).length;
      return { m, esatto: suo === cercato && suo !== "", comuni };
    })
    .sort((a, b) =>
      Number(b.esatto) - Number(a.esatto) || b.comuni - a.comuni ||
      (a.m.display_name ?? "").localeCompare(b.m.display_name ?? ""),
    )
    .map((x) => x.m);
}

export interface Adesione {
  id: string;
  class_id: string;
  nome: string;
  contatto: string;
  note: string | null;
  fonte: string;
  user_id: string | null;
  creata_il: string;
  archiviata_il: string | null;
}

/**
 * Come si confrontano due recapiti.
 *
 * Un numero di telefono lo si scrive in cinque modi — con lo zero davanti, con
 * il prefisso, con gli spazi, con i punti — e sono lo stesso numero. Per le
 * email conta il testo, minuscolo. Si distinguono guardando se ci sono cifre e
 * nessuna chiocciola.
 */
export function contattoNormalizzato(contatto: string): string {
  const pulito = contatto.trim().toLowerCase();
  if (pulito.includes("@")) return pulito;
  const cifre = pulito.replace(/\D/g, "");
  // Il prefisso internazionale italiano e lo zero interurbano non distinguono
  // due numeri: +39 080 1234567 e 0801234567 sono lo stesso telefono.
  return cifre.replace(/^(0039|39)/, "");
}

/**
 * Come si confrontano due nomi.
 *
 * «Maria Rossi», «maria  rossi» e «Rossi Maria» sono la stessa persona scritta
 * in tre modi: si ordinano le parole, così l'ordine non conta. Gli accenti no:
 * «Nicolò» e «Nicolo» restano distinti, perché toglierli farebbe somigliare
 * cognomi diversi e un falso allarme costa più di un doppione non visto.
 */
export function nomeNormalizzato(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export type MotivoSomiglianza = "stesso-recapito" | "stesso-nome";

export interface GruppoSimili {
  motivo: MotivoSomiglianza;
  adesioni: Adesione[];
}

/**
 * Le righe che si somigliano, raggruppate col motivo.
 *
 * Il motivo si mostra perché cambia la decisione: due righe con lo stesso nome
 * sono quasi sempre la stessa persona due volte; due righe con lo stesso
 * recapito e nomi diversi sono quasi sempre due persone della stessa famiglia.
 * Dire solo «attenzione, si somigliano» lascerebbe all'insegnante il lavoro di
 * capire in che modo.
 */
export function gruppiSimili(adesioni: readonly Adesione[]): GruppoSimili[] {
  const vive = adesioni.filter((a) => !a.archiviata_il);
  const gruppi: GruppoSimili[] = [];

  const raggruppa = (chiave: (a: Adesione) => string, motivo: MotivoSomiglianza) => {
    const per = new Map<string, Adesione[]>();
    for (const a of vive) {
      const k = chiave(a);
      if (!k) continue;
      per.set(k, [...(per.get(k) ?? []), a]);
    }
    for (const insieme of per.values()) {
      if (insieme.length > 1) gruppi.push({ motivo, adesioni: insieme });
    }
  };

  // Il nome prima: è il caso in cui è quasi certamente la stessa persona.
  raggruppa((a) => nomeNormalizzato(a.nome), "stesso-nome");
  raggruppa((a) => contattoNormalizzato(a.contatto), "stesso-recapito");

  // Una coppia già segnalata per il nome non si ripete per il recapito: due
  // avvisi sulla stessa riga fanno sembrare due problemi dove ce n'è uno.
  const visti = new Set<string>();
  return gruppi.filter((g) => {
    const firma = g.adesioni.map((a) => a.id).sort().join("|");
    if (visti.has(firma)) return false;
    visti.add(firma);
    return true;
  });
}

/** Nome e cognome (l'ultima parola), o `null` se la parola è una sola. */
function nomeECognome(completo: string | null | undefined): { nome: string; cognome: string } | null {
  const parole = (completo ?? "").trim().split(/\s+/).filter(Boolean);
  if (parole.length < 2) return null;
  return { nome: parole.slice(0, -1).join(" "), cognome: parole[parole.length - 1] };
}

/**
 * Il nome da proporre quando in classe due allievi si chiamano uguale: nome e
 * cognome per esteso, «Giuseppe Rossi».
 *
 * Prima era l'iniziale del cognome, «Giuseppe R.» (Trevissoi, 02/11/2026), poi
 * con tutte le lettere che servivano a distinguerli, «Giuseppe Ro.» e
 * «Giuseppe Ru.» (03/11). Il 06/11 ha chiesto il cognome intero: a lezione
 * serve a chiamare la persona giusta, e i compagni si conoscono già.
 *
 * Gli spazi si ripuliscono, le maiuscole restano come le ha scritte l'allievo.
 * `null` quando la parola è una sola, o quando un omonimo ha lo stesso nome e
 * cognome: lì il cognome non basta e decide l'insegnante. `altri` sono i nomi
 * completi degli omonimi.
 */
export function nomePerEsteso(
  nomeCompleto: string | null | undefined,
  altri: readonly (string | null | undefined)[] = [],
): string | null {
  const mio = nomeECognome(nomeCompleto);
  if (!mio) return null;
  const pieno = `${mio.nome} ${mio.cognome}`;
  const minuscolo = (x: string) => x.toLocaleLowerCase("it-IT");
  const uguale = altri.some((x) => {
    const r = nomeECognome(x);
    return !!r && minuscolo(`${r.nome} ${r.cognome}`) === minuscolo(pieno);
  });
  return uguale ? null : pieno;
}
