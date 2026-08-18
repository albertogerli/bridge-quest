import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { ToasterLazy } from "@/components/toaster-lazy";
import { LayoutShell } from "@/components/layout-shell";
import { LinguaDelDocumento } from "@/components/lingua-del-documento";
import { TraduzioniProvider } from "@/contexts/traduzioni-provider";
import { PropostaLingua } from "@/components/proposta-lingua";
import { GADS_ID } from "@/lib/gads";
import { GA_ID } from "@/lib/ga";
import { MetaPixelLoader } from "@/components/meta-pixel-loader";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BridgeLab - Impara il Bridge giocando",
    template: "%s · BridgeLab",
  },
  description:
    "Impara il bridge con BridgeLab, la piattaforma ufficiale della Federazione Italiana Gioco Bridge (FIGB): 4 corsi, 49 lezioni e 152 moduli interattivi con video, quiz e pratica al tavolo.",
  metadataBase: new URL("https://bridgelab.it"),
  // Note: no global `canonical` here — a site-wide "/" canonical wrongly points
  // every page at the homepage. Each public route sets its own via a route layout.
  openGraph: {
    title: "BridgeLab - Impara il Bridge giocando",
    description:
      "Impara il bridge con BridgeLab, la piattaforma ufficiale della Federazione Italiana Gioco Bridge (FIGB): 4 corsi, 49 lezioni e 152 moduli interattivi con video, quiz e pratica al tavolo.",
    url: "https://bridgelab.it",
    siteName: "BridgeLab",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BridgeLab - Impara il Bridge giocando",
      },
    ],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BridgeLab - Impara il Bridge giocando",
    description:
      "Impara il bridge con BridgeLab, la piattaforma ufficiale della Federazione Italiana Gioco Bridge (FIGB): 4 corsi, 49 lezioni e 152 moduli interattivi.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BridgeLab",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#003DA5",
};

// Inline script to apply dark mode class before first paint to prevent flash
const themeScript = `
(function(){
  try {
    // Dimensione del testo: applicata PRIMA del primo disegno, come il tema.
    // Applicarla dopo il montaggio farebbe vedere per un istante la pagina
    // alla dimensione sbagliata — fastidioso soprattutto per chi l'ha
    // ingrandita apposta perché fatica a leggere.
    var s = localStorage.getItem('bq_text_size');
    var scale = s === 'grande' ? '112.5%' : s === 'piccolo' ? '93.75%' : null;
    if (scale) document.documentElement.style.fontSize = scale;

    var t = localStorage.getItem('bq_theme') || 'light';
    var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "BridgeLab",
              "description": "Piattaforma didattica ufficiale della Federazione Italiana Gioco Bridge (FIGB) per imparare il bridge.",
              "url": "https://bridgelab.it",
              "logo": "https://bridgelab.it/icons/icon-512x512.png",
              "parentOrganization": {
                "@type": "Organization",
                "name": "Federazione Italiana Gioco Bridge",
                "alternateName": "FIGB",
                "url": "https://www.federbridge.it"
              },
              "hasCourse": [
                {
                  "@type": "Course",
                  "name": "Corso Fiori - Le Basi",
                  "description": "13 lezioni per imparare le basi del bridge: prese, atout, piano di gioco, dichiarazione.",
                  "provider": { "@type": "Organization", "name": "FIGB" },
                  "educationalLevel": "Principiante",
                  "inLanguage": "it",
                  "numberOfLessons": 13
                },
                {
                  "@type": "Course",
                  "name": "Corso Quadri - Intermedio",
                  "description": "12 lezioni su gioco avanzato, controgioco, interventi e dichiarazione competitiva.",
                  "provider": { "@type": "Organization", "name": "FIGB" },
                  "educationalLevel": "Intermedio",
                  "inLanguage": "it",
                  "numberOfLessons": 12
                },
                {
                  "@type": "Course",
                  "name": "Corso Cuori - Il Gioco della Carta",
                  "description": "10 lezioni avanzate su tecniche di gioco: sicurezza, eliminazione, percentuali, deduzioni.",
                  "provider": { "@type": "Organization", "name": "FIGB" },
                  "educationalLevel": "Avanzato",
                  "inLanguage": "it",
                  "numberOfLessons": 10
                },
                {
                  "@type": "Course",
                  "name": "Corso Cuori - La Dichiarazione",
                  "description": "14 lezioni avanzate sulla dichiarazione: Texas, Slam, sottoaperture, competitivo.",
                  "provider": { "@type": "Organization", "name": "FIGB" },
                  "educationalLevel": "Avanzato",
                  "inLanguage": "it",
                  "numberOfLessons": 14
                }
              ]
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "BridgeLab",
              "url": "https://bridgelab.it",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              },
              "description": "Piattaforma interattiva per imparare il bridge con corsi, quiz, video e pratica al tavolo.",
              "inLanguage": "it",
              "author": {
                "@type": "Organization",
                "name": "Federazione Italiana Gioco Bridge",
                "url": "https://www.federbridge.it"
              }
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${bricolage.variable} font-sans antialiased`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Vai al contenuto</a>
        {/* Allinea `lang` all'indirizzo: il layout è statico e da solo non
            saprebbe se la pagina è italiana o inglese. Non disegna niente. */}
        <LinguaDelDocumento />
        {/* Il dizionario avvolge tutto: `useT()` deve funzionare in qualunque
            componente, e in italiano non carica niente. */}
        <TraduzioniProvider>
          <LayoutShell>{children}</LayoutShell>
          {/* Propone l'altra lingua a chi ha il browser configurato così. Non
              reindirizza: decide chi legge, e la scelta viene ricordata. */}
          <PropostaLingua />
        </TraduzioniProvider>
        <ToasterLazy />
        <Analytics />
        {/* Google tag (gtag.js) — caricato una sola volta, serve sia GA4 che Google Ads */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        {/*
          Google Consent Mode v2. Il default è "denied" per TUTTI i segnali
          pubblicitari e statistici: gtag si carica ma non scrive cookie né
          invia identificatori finché non arriva un consenso esplicito. Il
          valore salvato viene riletto qui in modo sincrono, prima del config,
          così chi ha già acconsentito non perde la prima pagina vista.
          La scelta si aggiorna da consent-client.ts (`gtag('consent','update')`).
        */}
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            /* Vanno impostati PRIMA del consenso di default, altrimenti la
               prima richiesta parte senza. Servono a chi rifiuta:
               - ads_data_redaction: con ad_storage negato, gli identificatori
                 di clic vengono oscurati nelle chiamate a Google. Si continua
                 a contare la conversione in forma modellata senza inviare
                 dati che l'utente non ha autorizzato.
               - url_passthrough: senza cookie, il gclid viaggia
                 nell'indirizzo fra una pagina e l'altra. Senza, una
                 registrazione arrivata da un annuncio non è attribuibile a
                 quell'annuncio. */
            gtag('set', 'ads_data_redaction', true);
            gtag('set', 'url_passthrough', true);
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              /* Trattiene i tag per mezzo secondo in attesa di un eventuale
                 aggiornamento del consenso. Serve a chi ha già acconsentito in
                 una visita precedente: senza, la prima pagina vista partirebbe
                 come negata e andrebbe persa nella misurazione. */
              wait_for_update: 500
            });
            try {
              var c = JSON.parse(localStorage.getItem('bq_consent_v2') || 'null');
              if (c && c.marketing === true) {
                gtag('consent', 'update', {
                  ad_storage: 'granted',
                  ad_user_data: 'granted',
                  ad_personalization: 'granted',
                  analytics_storage: 'granted'
                });
              }
            } catch (e) {}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
            gtag('config', '${GADS_ID}');`}
        </Script>
        <MetaPixelLoader />
      </body>
    </html>
  );
}
