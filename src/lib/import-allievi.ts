/**
 * L'elenco degli allievi, da un foglio di calcolo.
 *
 * PERCHÉ NON SI PUÒ CHIEDERE DI RIDIGITARLO. L'insegnante l'elenco ce l'ha già:
 * è in Excel, o su un foglio di iscrizione trascritto in Excel. Chiedergli di
 * riscrivere venti nomi in un modulo è chiedergli di non usare il portale.
 *
 * IL SEPARATORE SI INDOVINA, NON SI CHIEDE. Excel italiano esporta il CSV con
 * il PUNTO E VIRGOLA, perché la virgola è il separatore decimale; quello
 * inglese usa la virgola. Un insegnante non sa quale dei due ha in mano e non
 * deve saperlo: si guarda la prima riga e si conta.
 *
 * LE COLONNE NON SI INDOVINANO, SI PROPONGONO. Il riconoscimento automatico
 * («la colonna che si chiama nome è il nome») funziona quasi sempre, e quando
 * sbaglia lo fa in silenzio: qui propone e l'insegnante conferma guardando
 * un'anteprima. Confermare tre menù costa dieci secondi; scoprire a lezione
 * cominciata che i cognomi sono finiti nei numeri di telefono costa la lezione.
 */

export type Campo = "nome" | "cognome" | "email" | "telefono" | "ignora";

export const ETICHETTE_CAMPO: Record<Campo, string> = {
  nome: "Nome",
  cognome: "Cognome",
  email: "Email",
  telefono: "Telefono",
  ignora: "Non importare",
};

export interface FoglioLetto {
  intestazioni: string[];
  righe: string[][];
  separatore: string;
}

/**
 * Il separatore più probabile.
 *
 * Si conta sulla PRIMA riga e non su tutto il file: le righe successive
 * possono contenere virgole dentro i campi (un indirizzo, una nota), e
 * contarle falserebbe il conto proprio nei file più sporchi.
 */
export function indovinaSeparatore(testo: string): string {
  const prima = testo.split(/\r?\n/)[0] ?? "";
  const candidati = [";", ",", "\t"];
  let migliore = ";";
  let max = -1;
  for (const c of candidati) {
    const n = prima.split(c).length - 1;
    if (n > max) {
      max = n;
      migliore = c;
    }
  }
  return max > 0 ? migliore : ";";
}

/**
 * Una riga di CSV, virgolette comprese.
 *
 * Le virgolette servono davvero: un cognome come «De Rossi, Anna» dentro un
 * campo spezzerebbe la riga, e i fogli esportati da Excel le mettono da soli.
 * Due virgolette di fila dentro un campo virgolettato valgono una virgoletta.
 */
function leggiRiga(riga: string, sep: string): string[] {
  const campi: string[] = [];
  let corrente = "";
  let dentroVirgolette = false;

  for (let i = 0; i < riga.length; i++) {
    const c = riga[i];
    if (dentroVirgolette) {
      if (c === '"') {
        if (riga[i + 1] === '"') {
          corrente += '"';
          i++;
        } else {
          dentroVirgolette = false;
        }
      } else {
        corrente += c;
      }
    } else if (c === '"') {
      dentroVirgolette = true;
    } else if (c === sep) {
      campi.push(corrente.trim());
      corrente = "";
    } else {
      corrente += c;
    }
  }
  campi.push(corrente.trim());
  return campi;
}

export function leggiCsv(testo: string): FoglioLetto {
  const separatore = indovinaSeparatore(testo);
  const righe = testo
    .split(/\r?\n/)
    .filter((r) => r.trim() !== "")
    .map((r) => leggiRiga(r, separatore));

  if (righe.length === 0) return { intestazioni: [], righe: [], separatore };
  return { intestazioni: righe[0], righe: righe.slice(1), separatore };
}

/**
 * Che colonna è, a occhio.
 *
 * Torna `ignora` quando non è chiaro, invece di tirare a indovinare: una
 * proposta sbagliata che l'insegnante conferma distrattamente è peggio di
 * nessuna proposta.
 */
export function proponiCampo(intestazione: string): Campo {
  const t = intestazione.toLowerCase().trim();
  if (/^(e-?mail|posta|indirizzo e-?mail)$/.test(t) || t.includes("mail")) return "email";
  if (/(telefono|cellulare|cell|tel|phone|mobile)/.test(t)) return "telefono";
  if (/^(cognome|surname|last ?name)$/.test(t) || t.includes("cognome")) return "cognome";
  if (/^(nome|name|first ?name|nominativo)$/.test(t) || t.includes("nome")) return "nome";
  return "ignora";
}

export interface Allievo {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
}

/**
 * Le righe diventano allievi, secondo la mappatura confermata.
 *
 * Scarta chi non ha né nome né cognome: una riga vuota in fondo al foglio —
 * ce n'è quasi sempre una — diventerebbe un allievo senza nome nell'elenco
 * della classe.
 */
export function componiAllievi(foglio: FoglioLetto, mappa: Campo[]): Allievo[] {
  const fuori: Allievo[] = [];
  for (const riga of foglio.righe) {
    const a: Allievo = { nome: "", cognome: "", email: "", telefono: "" };
    mappa.forEach((campo, i) => {
      if (campo === "ignora") return;
      a[campo] = (riga[i] ?? "").trim();
    });
    if (!a.nome && !a.cognome) continue;
    fuori.push(a);
  }
  return fuori;
}

/** Come si chiama, per l'elenco e per il tagliando. */
export function nomeCompleto(a: Allievo): string {
  return [a.nome, a.cognome].filter(Boolean).join(" ").trim();
}
