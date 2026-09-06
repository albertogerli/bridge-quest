/**
 * Centosessanta abbonamenti Realtime insieme.
 *
 * È L'ALTRA METÀ, ed è la meno grave: il tavolo ha già un polling di riserva
 * ogni cinque secondi, quindi se Realtime cede la lezione continua — più lenta,
 * non rotta. Vale comunque saperlo prima.
 */
import { createClient } from "@supabase/supabase-js";
const [, , URL_BASE, KEY, TAVOLO] = process.argv;

const quanti = Number(process.argv[6] ?? 160);
const clients = [];
let connessi = 0, falliti = 0;

const t0 = performance.now();
await Promise.all(
  Array.from({ length: quanti }, () =>
    new Promise((risolvi) => {
      const c = createClient(URL_BASE, KEY, { realtime: { params: { eventsPerSecond: 10 } } });
      clients.push(c);
      const scaduto = setTimeout(() => { falliti++; risolvi(); }, 25000);
      c.channel(`live-table-${TAVOLO}-${Math.random()}`)
        .on("postgres_changes",
            { event: "UPDATE", schema: "public", table: "live_tables", filter: `id=eq.${TAVOLO}` },
            () => {})
        .subscribe((stato) => {
          if (stato === "SUBSCRIBED") { connessi++; clearTimeout(scaduto); risolvi(); }
          else if (stato === "CHANNEL_ERROR" || stato === "TIMED_OUT") { falliti++; clearTimeout(scaduto); risolvi(); }
        });
    }),
  ),
);
console.log(`${quanti} abbonamenti · connessi ${connessi} · falliti ${falliti} · in ${Math.round(performance.now() - t0)} ms`);
for (const c of clients) await c.removeAllChannels();
process.exit(0);
