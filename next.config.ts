import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import withBundleAnalyzerInit from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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
   * `scripts/verifica-sw.mjs` controlla dopo ogni build che non tornino.
   */
  exclude: [
    /\.mp4$/,
    /^videos\//,
    // Anche le immagini pesanti: nel precache ci vanno per intero, e nessuna
    // di queste serve prima che l'utente abbia visto qualcosa.
    /\.(?:mov|webm|mp3|wav)$/,
  ],
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
