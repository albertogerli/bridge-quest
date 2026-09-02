import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Le chiamate al database NON si mettono in cache. Mai.
 *
 * IL PROBLEMA, trovato il 02/09/2026 dietro un errore che sembrava innocuo
 * (`no-response` su una richiesta di amicizie, da un iPhone).
 *
 * L'ultima regola di `defaultCache` è `({ sameOrigin }) => !sameOrigin`: prende
 * TUTTO quello che non è il nostro dominio, quindi ogni chiamata a Supabase, e
 * la serve con `NetworkFirst` conservandola un'ora.
 *
 * Sembra innocuo e non lo è, perché le nostre richieste NON portano l'utente
 * nell'indirizzo: è il database a decidere chi vede cosa, con centonovanta
 * policy che guardano `auth.uid()`. `GET /rest/v1/classes?select=*` è la stessa
 * identica URL per l'insegnante A e per l'insegnante B, e restituisce righe
 * diverse. Una risposta memorizzata sotto quella chiave è la risposta di CHI HA
 * CHIESTO PER PRIMO.
 *
 * Su un portatile di casa non succede quasi mai. Su un tablet condiviso in
 * sede — che è esattamente come si usa l'aula — bastano due insegnanti di
 * seguito e una rete lenta: `NetworkFirst` aspetta dieci secondi, rinuncia, e
 * pesca dalla cache la classe di qualcun altro.
 *
 * Qui le chiamate a Supabase passano da `NetworkOnly` PRIMA che
 * `defaultCache` possa vederle. Restano fuori le immagini pubbliche
 * (`/storage/v1/object/public/…`, gli avatar): quelle non sono di nessuno in
 * particolare e conviene tenerle.
 */
const CHIAMATE_AL_DATABASE = ({ url }: { url: URL }) =>
  url.hostname.endsWith(".supabase.co") &&
  (url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/functions/") ||
    url.pathname.startsWith("/realtime/"));

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Never cache video files (169MB+)
    {
      matcher: ({ request, url }) =>
        url.pathname.startsWith("/videos/") ||
        request.destination === "video" ||
        url.pathname.endsWith(".mp4"),
      handler: new NetworkOnly(),
    },
    // Never cache API routes
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    // Mai in cache i dati del database: vedi la nota sopra. Deve stare PRIMA di
    // `defaultCache`, che altrimenti li prende con la sua regola finale.
    {
      matcher: CHIAMATE_AL_DATABASE,
      handler: new NetworkOnly(),
    },
    // Default strategies for everything else
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

/**
 * Butta via quello che è già stato memorizzato prima di questa correzione.
 *
 * Cambiare la regola vale da adesso in poi: le risposte del database già finite
 * nella cache `cross-origin` resterebbero lì fino a un'ora, e sono proprio
 * quelle da cui nasce il problema. Si svuota all'attivazione, una volta.
 *
 * Si cancellano solo le cache che nominano `cross-origin`: il precache e le
 * cache degli asset statici non c'entrano e devono restare, altrimenti al primo
 * aggiornamento tutti si riscaricherebbero l'applicazione intera.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nomi = await caches.keys();
      await Promise.all(
        nomi.filter((n) => n.includes("cross-origin")).map((n) => caches.delete(n)),
      );
    })(),
  );
});

serwist.addEventListeners();
