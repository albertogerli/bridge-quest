"use client";

/**
 * Classes store (Instructor Portal).
 *
 * Unlike the catalog stores (read-only session caches), class data is per-user
 * and mutates, so this store exposes an explicit `refresh()` instead of a
 * fetch-once guard. It tracks two lists:
 *   - myClasses:       classes the current user OWNS (instructor view)
 *   - enrolledClasses: classes the current user is a MEMBER of (student view)
 *
 * Pages call the matching `useMyClasses()` / `useEnrolledClasses()` hook which
 * auto-loads on first mount; mutations (create/join/leave) live in the DAL
 * (src/lib/instructors.ts) and callers invoke `refresh*()` afterwards.
 */

import { create } from "zustand";
import { useEffect } from "react";
import { getMyClasses, getMyEnrolledClasses, type ClassRoom } from "@/lib/instructors";
import { useSharedAuth } from "@/contexts/auth-provider";

interface ClassesState {
  myClasses: ClassRoom[];
  myLoading: boolean;
  myLoaded: boolean;
  myError: string | null;

  enrolledClasses: ClassRoom[];
  enrolledLoading: boolean;
  enrolledLoaded: boolean;
  enrolledError: string | null;

  /**
   * Di chi sono gli elenchi. Senza, cambiare account nello stesso browser
   * lasciava le classi del precedente: vedi `useAllineaUtente`.
   */
  utenteId: string | null;

  refreshMyClasses: () => Promise<void>;
  refreshEnrolledClasses: () => Promise<void>;
  /** Dimentica tutto: un altro account, o nessuno. */
  azzera: (utenteId: string | null) => void;
}

export const useClassesStore = create<ClassesState>((set, get) => ({
  myClasses: [],
  myLoading: false,
  myLoaded: false,
  myError: null,

  enrolledClasses: [],
  enrolledLoading: false,
  enrolledLoaded: false,
  enrolledError: null,

  utenteId: null,

  azzera: (utenteId) =>
    set({
      utenteId,
      myClasses: [], myLoading: false, myLoaded: false, myError: null,
      enrolledClasses: [], enrolledLoading: false, enrolledLoaded: false, enrolledError: null,
    }),

  refreshMyClasses: async () => {
    // Una risposta arrivata dopo un cambio di account è dell'account di
    // prima: si butta, l'azzeramento ha già fatto partire quella giusta.
    const di = get().utenteId;
    set({ myLoading: true, myError: null });
    try {
      const myClasses = await getMyClasses();
      if (get().utenteId !== di) return;
      set({ myClasses, myLoading: false, myLoaded: true });
    } catch (err) {
      if (get().utenteId !== di) return;
      set({
        myLoading: false,
        myError: err instanceof Error ? err.message : "Errore nel caricamento delle classi",
      });
    }
  },

  refreshEnrolledClasses: async () => {
    const di = get().utenteId;
    set({ enrolledLoading: true, enrolledError: null });
    try {
      const enrolledClasses = await getMyEnrolledClasses();
      if (get().utenteId !== di) return;
      set({ enrolledClasses, enrolledLoading: false, enrolledLoaded: true });
    } catch (err) {
      if (get().utenteId !== di) return;
      set({
        enrolledLoading: false,
        enrolledError: err instanceof Error ? err.message : "Errore nel caricamento delle classi",
      });
    }
  },
}));

/**
 * GLI ELENCHI SONO DI UNA PERSONA, e la pagina può cambiare persona senza
 * ricaricarsi: si esce come insegnante e si rientra come allievo, oppure il
 * primo caricamento parte un attimo prima che la sessione sia pronta e
 * finisce in «Non autenticato» — un errore che poi non si ritentava più.
 * In tutti questi casi l'allievo restava senza classi fino a un ricaricamento
 * manuale, e con lui la home del corso (Trevissoi, 14/10/2026).
 *
 * Quando cambia l'utente gli elenchi si azzerano, e i hook qui sotto li
 * ricaricano per conto loro.
 */
function useAllineaUtente() {
  const { user } = useSharedAuth();
  const id = user?.id ?? null;
  useEffect(() => {
    if (useClassesStore.getState().utenteId !== id) useClassesStore.getState().azzera(id);
  }, [id]);
  return id;
}

/**
 * L'iscrizione cambia mentre la pagina è aperta: l'insegnante approva da un
 * altro dispositivo, e l'allievo che aspettava resta a guardare una pagina
 * che lo crede ancora senza classe. Quando la scheda torna in primo piano si
 * rilegge — al massimo una volta al minuto, la richiesta è piccola ma la
 * scheda può tornare in primo piano di continuo.
 */
const RILETTURA_MS = 60_000;
let ultimaRilettura = 0;
function useRileggiAlRitorno(abilitato: boolean) {
  useEffect(() => {
    if (!abilitato) return;
    const alRitorno = () => {
      if (document.visibilityState !== "visible") return;
      const ora = Date.now();
      if (ora - ultimaRilettura < RILETTURA_MS) return;
      ultimaRilettura = ora;
      const s = useClassesStore.getState();
      if (s.utenteId && !s.enrolledLoading) void s.refreshEnrolledClasses();
    };
    document.addEventListener("visibilitychange", alRitorno);
    return () => document.removeEventListener("visibilitychange", alRitorno);
  }, [abilitato]);
}

export function useMyClasses() {
  const utente = useAllineaUtente();
  const myClasses = useClassesStore((s) => s.myClasses);
  const isLoading = useClassesStore((s) => s.myLoading);
  const isLoaded = useClassesStore((s) => s.myLoaded);
  const error = useClassesStore((s) => s.myError);
  const refresh = useClassesStore((s) => s.refreshMyClasses);

  useEffect(() => {
    // An error must settle the attempt. Retrying on every loading=false
    // transition creates a render/request loop; callers can refresh explicitly.
    // Read current state: several menus can mount in the same React commit.
    // Only automatic loads are deduplicated; explicit refresh after a mutation
    // must still load fresh data even if an older request is in progress.
    const current = useClassesStore.getState();
    if (utente && current.utenteId === utente && !current.myLoaded && !current.myLoading && current.myError === null) void refresh();
  }, [utente, isLoaded, isLoading, error, refresh]);

  return { classes: myClasses, isLoading, isLoaded, error, refresh };
}

/**
 * `abilitato` esiste per la pagina di ingresso: quella è resa dal server per
 * chi non ha fatto l'accesso, e partire lo stesso vorrebbe dire una query
 * autenticata — che fallisce — a ogni visitatore anonimo, sulla schermata in
 * cui il tempo di caricamento conta più che altrove.
 */
export function useEnrolledClasses(abilitato = true) {
  const utente = useAllineaUtente();
  useRileggiAlRitorno(abilitato && Boolean(utente));
  const enrolledClasses = useClassesStore((s) => s.enrolledClasses);
  const isLoading = useClassesStore((s) => s.enrolledLoading);
  const isLoaded = useClassesStore((s) => s.enrolledLoaded);
  const error = useClassesStore((s) => s.enrolledError);
  const refresh = useClassesStore((s) => s.refreshEnrolledClasses);

  useEffect(() => {
    const current = useClassesStore.getState();
    if (abilitato && utente && current.utenteId === utente && !current.enrolledLoaded && !current.enrolledLoading && current.enrolledError === null) void refresh();
  }, [abilitato, utente, isLoaded, isLoading, error, refresh]);

  return { classes: enrolledClasses, isLoading, isLoaded, error, refresh };
}
