import type { Course } from "@/lib/catalog";

/**
 * Dove riprendere: il primo modulo non ancora completato.
 *
 * PERCHÉ È UNA FUNZIONE E NON QUATTRO CICLI ANNIDATI DENTRO UN HOOK. La
 * stessa domanda la fanno due posti — l'eroe della home e, dal 27/09/2026,
 * la testa del Percorso — e la seconda volta stavo per copiarla. Due copie
 * della stessa regola sono due regole: il giorno che una cambia, l'eroe e il
 * percorso mandano l'allievo in due punti diversi e nessuno se ne accorge,
 * perché sono due schermate che non si guardano mai insieme.
 *
 * L'ORDINE È QUELLO DEL CATALOGO, non quello cronologico. Chi salta la
 * lezione 4 e fa la 5 viene rimandato alla 4: il percorso ha un ordine ed è
 * quello l'informazione. Se un giorno si volesse «l'ultimo toccato» sarebbe
 * un'altra funzione con un altro nome, non un parametro di questa.
 */
export interface ProssimoModulo {
  lessonId: number;
  moduleId: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonIcon: string;
}

export function primoModuloIncompleto(
  courses: readonly Course[],
  completati: Readonly<Record<string, boolean>>,
): ProssimoModulo | null {
  for (const course of courses) {
    for (const mondo of course.worlds) {
      for (const lezione of mondo.lessons) {
        for (const modulo of lezione.modules) {
          if (completati[`${lezione.id}-${modulo.id}`]) continue;
          return {
            lessonId: lezione.id,
            moduleId: modulo.id,
            moduleTitle: modulo.title,
            lessonTitle: lezione.title,
            lessonIcon: lezione.icon,
          };
        }
      }
    }
  }
  return null;
}

/**
 * L'ultima lezione TOCCATA: quella su cui si sta lavorando, o appena finita.
 *
 * PERCHÉ NON `primoModuloIncompleto`. Quella dice dove ANDARE; questa dice
 * dove SI È STATI. Servono a due cose diverse: per proporre una mano da
 * giocare ci vuole la seconda, perché una mano sulla lezione che non hai
 * ancora aperto non è un ripasso, è un anticipo — e ti fa sbagliare per una
 * cosa che nessuno ti ha ancora spiegato.
 *
 * «Toccata» vuol dire con almeno un modulo completato. Si prende l'ULTIMA
 * nell'ordine del catalogo e non la più recente nel tempo, perché il tempo
 * non ce l'abbiamo: `completedModules` è una mappa di booleani, senza date.
 * Nell'uso normale — si va avanti in ordine — le due cose coincidono.
 */
export function ultimaLezioneToccata(
  courses: readonly Course[],
  completati: Readonly<Record<string, boolean>>,
): { lessonId: number; lessonTitle: string; lessonIcon: string } | null {
  let ultima: { lessonId: number; lessonTitle: string; lessonIcon: string } | null = null;
  for (const course of courses) {
    for (const mondo of course.worlds) {
      for (const lezione of mondo.lessons) {
        const toccata = lezione.modules.some((m) => completati[`${lezione.id}-${m.id}`]);
        if (toccata) {
          ultima = {
            lessonId: lezione.id,
            lessonTitle: lezione.title,
            lessonIcon: lezione.icon,
          };
        }
      }
    }
  }
  return ultima;
}
