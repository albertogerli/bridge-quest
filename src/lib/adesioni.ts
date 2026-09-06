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
