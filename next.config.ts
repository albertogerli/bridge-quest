import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import withBundleAnalyzerInit from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Le voci di `public/` per il precache del service worker, SENZA i filmati.
 *
 * Serwist, se non gli si passa `additionalPrecacheEntries`, scansiona `public/`
 * da solo e ci mette dentro tutto: comprese le 49 lezioni del maestro, 169 MB
 * che il worker si scaricava durante l'installazione — cioè mentre l'utente
 * aspettava la prima pagina dopo il login. Misurato in produzione il
 * 17/08/2026: primo contenuto dopo 256 secondi col worker attivo, 1,5 secondi
 * col worker bloccato.
 *
 * PERCHÉ LA SCANSIONE LA FACCIAMO NOI. Le altre tre strade non funzionano, e
 * l'ho verificato una per una: `exclude` filtra gli asset del bundle e non
 * tocca `public/` (provato in produzione, i 49 video restavano);
 * `globPublicPatterns` li filtrerebbe, ma la libreria che li cerca è `glob`,
 * che i pattern negativi non li interpreta; `manifestTransforms` gira sul
 * manifest degli asset del compilation, e le voci di `public/` vengono
 * aggiunte dopo (verificato: il transform vedeva 213 voci e nessun video).
 * Passando noi l'elenco, Serwist salta la propria scansione e usa questo.
 *
 * I file esclusi non vengono nemmeno LETTI: calcolare l'impronta di quindici
 * gigabyte di video a ogni build sarebbe il secondo modo di far aspettare
 * qualcuno.
 */
/**
 * NON SI PRECARICA IL CONTENUTO, SOLO LA SCORZA DELL'APP.
 *
 * `public/` contiene due cose diverse: quel poco che serve perché l'app si
 * apra (icone, manifest, logo — meno di due megabyte) e il materiale delle
 * lezioni, che pesa quindici gigabyte fra i filmati del maestro e le
 * infografiche. Il precache si prendeva tutto, e il service worker se lo
 * scaricava durante l'INSTALLAZIONE, mentre l'utente aspettava la prima
 * pagina: 256 secondi misurati in produzione il 17/08/2026, contro 1,5 secondi
 * col worker disattivato.
 *
 * Le due cartelle sono escluse per nome, ma la protezione vera è il limite di
 * peso: qualunque cosa venga aggiunta in `public/` domani, se supera il
 * megabyte non entra. Una lista di estensioni copre solo i formati a cui si è
 * pensato — e questo difetto è nato proprio così, da una regola che parlava di
 * video mentre il problema erano anche le immagini.
 */
const CARTELLE_DI_CONTENUTO = /^(?:videos|infografiche)\//;
/** Il worker stesso e i suoi satelliti: precaricarsi da soli non ha senso. */
const NON_E_UN_ASSET = /^(?:sw\.js(?:\.map)?|swe-worker-[^/]*\.js)$/;
/** Oltre questo, non è roba che serve prima che l'utente veda qualcosa. */
const PESO_MASSIMO = 1024 * 1024;

function vociDiPublic(): { url: string; revision: string }[] {
  const radice = path.join(projectRoot, "public");
  const voci: { url: string; revision: string }[] = [];
  const cammina = (cartella: string, prefisso: string) => {
    for (const voce of fs.readdirSync(cartella, { withFileTypes: true })) {
      const relativo = prefisso ? `${prefisso}/${voce.name}` : voce.name;
      const completo = path.join(cartella, voce.name);
      if (voce.isDirectory()) {
        // Le cartelle di contenuto non si aprono nemmeno: leggerle per
        // calcolare impronte che poi si buttano è il secondo modo di far
        // aspettare qualcuno.
        if (!CARTELLE_DI_CONTENUTO.test(`${relativo}/`)) cammina(completo, relativo);
        continue;
      }
      if (NON_E_UN_ASSET.test(relativo)) continue;
      if (fs.statSync(completo).size > PESO_MASSIMO) continue;
      voci.push({
        url: `/${relativo}`,
        revision: crypto.createHash("md5").update(fs.readFileSync(completo)).digest("hex"),
      });
    }
  };
  if (fs.existsSync(radice)) cammina(radice, "");
  return voci;
}

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  /**
   * I VIDEO FUORI DAL PRECACHE, che è la cosa che li scarica davvero.
   *
   * `sw.ts` ha una regola `NetworkOnly` con scritto «never cache video files»,
   * e non bastava: quella governa il traffico a RUNTIME, mentre il manifest del
   * precache è un'altra lista, costruita al build su tutto ciò che sta in
   * `public/`. Ci finivano dentro 49 lezioni del maestro, 169 MB, che il
   * service worker si scaricava durante l'INSTALLAZIONE — cioè mentre l'utente
   * stava aspettando la prima pagina.
   *
   * L'effetto misurato in produzione il 17/08/2026: primo contenuto a schermo
   * dopo 256 secondi con il worker attivo, 1,5 secondi con il worker bloccato.
   * Non era lentezza del database (16 chiamate, 3 secondi in tutto) né del
   * server (gli stessi file, chiesti fuori dal browser, arrivavano in 200
   * millisecondi): erano le richieste della pagina affamate dal precache.
   *
   * PERCHÉ NON `exclude` E NON `globPublicPatterns`. Il primo filtra gli asset
   * del bundle, non i file di `public/` — provato in produzione, i 49 video
   * restavano. Il secondo li filtrerebbe, ma la libreria che li cerca è `glob`,
   * che i pattern negativi non li interpreta. `manifestTransforms` invece
   * lavora sul manifest FINITO, qualunque strada abbiano preso le voci per
   * arrivarci, ed è l'unico punto in cui la regola vale una volta sola.
   *
   * `scripts/verifica-sw.mjs` controlla dopo ogni build che non tornino.
   */
  additionalPrecacheEntries: vociDiPublic(),
});

// No-op unless ANALYZE=true. Generate a prod bundle report with:
//   ANALYZE=true npm run build
const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Allow pointing the build dir outside iCloud-synced folders during local dev
  // (e.g. NEXT_DIST_DIR=.next.nosync). Defaults to ".next" so Vercel/prod is unchanged.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: projectRoot,
  turbopack: {},
  webpack: (config) => {
    // `bridge-dds` incorpora il double dummy solver C++ compilato con
    // Emscripten. Il suo codice di aggancio è scritto per girare sia in Node
    // sia nel browser e nomina `module`, `fs` e `path`: nel bundle del browser
    // quei moduli non esistono e la compilazione si ferma. Dichiararli come
    // assenti fa prendere all'Emscripten il ramo browser, che è quello giusto.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      module: false,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
  images: {
    // Allow next/image optimization of user avatars served from Supabase storage.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async headers() {
    // 'unsafe-eval' serve solo in dev (React Fast Refresh); in produzione la
    // CSP lo esclude (rilievo perizia sicurezza 2026-08). googletagmanager.com
    // è necessario per il tag Google Ads caricato in src/app/layout.tsx.
    //
    // ─────────────────────────────────────────────────────────────────────────
    // Perché script-src ha ancora 'unsafe-inline' (decisione 2026-08)
    //
    // Il rilievo della perizia chiede di toglierlo passando a una CSP con
    // nonce per-richiesta. È stato implementato e verificato: funziona (0
    // violazioni CSP su 5 pagine in build di produzione, gtag e Vercel
    // Analytics caricati, script del tema anti-flash eseguito). NON è stato
    // adottato per il costo, che è strutturale e non aggirabile:
    //
    // Il nonce cambia a ogni richiesta, quindi il layout deve leggerlo da
    // headers() → il root layout diventa dinamico → TUTTE le pagine perdono
    // il prerendering. Misurato: 58 → 5 rotte prerenderizzate (restano solo
    // robots.txt, sitemap.xml, manifest.webmanifest). Non è un difetto di
    // implementazione: ogni pagina prerenderizzata contiene ~11 <script>
    // inline di Next (flight data RSC) generati a build time, quindi privi di
    // nonce; con una CSP a nonce verrebbero bloccati e la pagina resterebbe
    // un guscio non idratato. Nemmeno gli hash sono praticabili (contenuto
    // diverso per pagina e rigenerato a ogni revalidate ISR).
    //
    // Costo concreto misurato in locale: /glossario (ISR 1h, ottimizzazione
    // SEO/LCP del 2026-07) passa da 4ms a 93ms di TTFB perché perde la cache.
    // In produzione su Vercel l'impatto è maggiore: l'HTML non è più servito
    // dalla CDN edge ma da una function a ogni richiesta.
    //
    // La patch funzionante è conservata in tmp/csp-nonce.patch (non tracciata).
    // Riaprire la decisione ha senso solo se si accetta il render dinamico.
    //
    // style-src mantiene 'unsafe-inline' in ogni caso: React inietta stili
    // inline (style={{...}}, motion) e Tailwind 4 emette <style> a runtime;
    // toglierlo romperebbe il rendering. Il rischio non è equiparabile a
    // quello di script-src.
    // ─────────────────────────────────────────────────────────────────────────
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      // Il double dummy solver è WebAssembly. Senza questa direttiva la CSP
      // ne blocca la compilazione: in sviluppo non si notava perché lì
      // `'unsafe-eval'` la copre, in produzione il quiz "Quante prese?"
      // moriva con un errore fuorviante («startsWith is not a function»,
      // sollevato dal ripiego di Emscripten dopo il rifiuto).
      // `wasm-unsafe-eval` autorizza SOLO WebAssembly, non `eval` di
      // JavaScript: è la direttiva nata apposta per questo caso.
      "'wasm-unsafe-eval'",
      ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
      "https://va.vercel-scripts.com",
      "https://www.googletagmanager.com",
      // Meta Pixel. Lo script viene scaricato solo dopo il consenso
      // pubblicitario (src/components/meta-pixel-loader.tsx): la CSP lo
      // consente, il consenso decide se caricarlo.
      "https://connect.facebook.net",
    ].join(" ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "frame-src https://www.youtube.com https://youtube.com https://td.doubleclick.net",
              "connect-src 'self' https: wss://*.supabase.co",
              "media-src 'self' blob: https:",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
      {
        // Static assets: aggressive caching
        source: "/:path*.(jpg|jpeg|png|gif|webp|svg|ico|mp4|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400, immutable",
          },
        ],
      },
      {
        // PDF and infographic files: moderate caching
        source: "/:path*.(pdf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

const baseConfig = withBundleAnalyzer(withSerwist(nextConfig));

// Sentry: il wrapper si applica solo quando il DSN è configurato, così build
// locali e preview restano identiche a prima. L'upload delle source map
// avviene solo se SENTRY_AUTH_TOKEN è presente (altrimenti la build fallirebbe).
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(baseConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      // Proxy same-origin per gli eventi: gli adblocker bloccano le chiamate
      // dirette a ingest.sentry.io e perderemmo gli errori dei browser reali.
      tunnelRoute: "/monitoring",
      widenClientFileUpload: true,
      webpack: { treeshake: { removeDebugLogging: true } },
    })
  : baseConfig;
