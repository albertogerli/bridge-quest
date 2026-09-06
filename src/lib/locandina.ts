import type { ClassRoom } from "@/lib/instructors";

/**
 * I campi della locandina.
 *
 * PERCHÉ UN ELENCO DI DATI E NON UN MODULO SCRITTO A MANO. L'elenco dei campi
 * è quello che Trevissoi ha mandato oggi, e cambierà: aggiungere o togliere una
 * voce deve costare una riga qui, non una riscrittura della pagina. Il modulo
 * si disegna scorrendo questo elenco, e il template legge gli stessi nomi.
 *
 * I TRE FACOLTATIVI SI SPENGONO DAVVERO. «Alcuni non lo vogliono, perché
 * vogliono gestire loro le iscrizioni col telefono»: quando sono spenti la
 * locandina non deve avere un buco dove c'era qualcosa, e nessuna frase deve
 * riferirsi a quello che non c'è più.
 */

export interface CampoLocandina {
  chiave: keyof TestiLocandina;
  etichetta: string;
  /** Un suggerimento nel campo vuoto, non un valore già scritto. */
  esempio?: string;
  /** Testo lungo: il modulo gli dà più righe. */
  lungo?: boolean;
}

export interface TestiLocandina {
  titolo: string;
  sottotitolo: string;
  evento: string;
  corso: string;
  insegnante: string;
  associazione: string;
  quando: string;
  dove: string;
  note: string;
  /** Compare al posto del QR quando il QR è spento, se l'ASD la scrive. */
  contatti: string;
}

export interface Facoltativi {
  logoAsd: boolean;
  note: boolean;
  qr: boolean;
}

export const CAMPI: CampoLocandina[] = [
  { chiave: "titolo", etichetta: "Titolo" },
  { chiave: "sottotitolo", etichetta: "Sottotitolo", lungo: true },
  { chiave: "evento", etichetta: "Tipo di evento", esempio: "Lezione Zero, Corso…" },
  { chiave: "quando", etichetta: "Data e ora", esempio: "Giovedì 8 ottobre 2026, ore 21:00" },
  { chiave: "dove", etichetta: "Indirizzo completo", lungo: true, esempio: "Via, numero, CAP, città" },
  { chiave: "corso", etichetta: "Tipo di corso", esempio: "Primo livello" },
  { chiave: "insegnante", etichetta: "Insegnante" },
  { chiave: "associazione", etichetta: "Associazione organizzatrice" },
];

/** I due campi che compaiono solo se il rispettivo interruttore è acceso. */
export const CAMPI_FACOLTATIVI: CampoLocandina[] = [
  { chiave: "note", etichetta: "Vincoli o limitazioni", lungo: true, esempio: "Riservato a…, numero massimo…" },
  { chiave: "contatti", etichetta: "Come iscriversi senza QR", esempio: "Per informazioni: 080 1234567" },
];

/**
 * I predefiniti, che l'ASD può riscrivere.
 *
 * NESSUNO DI QUESTI PROMETTE QUALCOSA DI CONFIGURABILE. Il sottotitolo non dice
 * «iscriviti online», perché l'ASD che spegne il QR le iscrizioni le prende al
 * telefono e quella frase le mentirebbe addosso — è lo stesso errore del
 * messaggio WhatsApp che prometteva soluzioni che non si aprivano.
 *
 * Quello che si sa già dalla classe si riempie: chi apre la pagina trova il
 * modulo quasi pieno e cambia quello che serve, invece di ricominciare.
 */
export function testiPredefiniti(classe: ClassRoom | null, insegnante: string): TestiLocandina {
  return {
    titolo: "Scopri il bridge in una sera",
    sottotitolo:
      "Una partita vera, spiegata passo passo. Non serve saperne niente: " +
      "si comincia da zero, in gruppo, e si gioca subito.",
    evento: "Lezione Zero",
    corso: classe?.livello ?? "",
    insegnante,
    associazione: classe?.asd_code ?? "",
    quando: "",
    dove: "",
    note: "",
    contatti: "",
  };
}

/**
 * Se manca qualcosa di obbligatorio, si dice PRIMA di generare l'immagine.
 *
 * Una locandina appesa in bacheca senza l'indirizzo è carta sprecata, e chi la
 * scarica non ricontrolla: la guarda, la manda in stampa e la appende.
 */
export function campiMancanti(testi: TestiLocandina): string[] {
  const obbligatori: (keyof TestiLocandina)[] = [
    "titolo", "evento", "quando", "dove", "insegnante", "associazione",
  ];
  return obbligatori
    .filter((c) => !testi[c].trim())
    .map((c) => CAMPI.find((x) => x.chiave === c)?.etichetta ?? c);
}
