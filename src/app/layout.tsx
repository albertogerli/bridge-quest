import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LayoutShell } from "@/components/layout-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BridgeLab - Impara il Bridge giocando",
    template: "%s",
  },
  description:
    "Impara il bridge con BridgeLab, la piattaforma ufficiale della Federazione Italiana Gioco Bridge (FIGB): 4 corsi, 49 lezioni e 168 moduli interattivi con video, quiz e pratica al tavolo.",
  metadataBase: new URL("https://bridgelab.it"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BridgeLab - Impara il Bridge giocando",
    description:
      "Impara il bridge con BridgeLab, la piattaforma ufficiale della Federazione Italiana Gioco Bridge (FIGB): 4 corsi, 49 lezioni e 168 moduli interattivi con video, quiz e pratica al tavolo.",
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
      "Impara il bridge con BridgeLab, la piattaforma ufficiale della Federazione Italiana Gioco Bridge (FIGB): 4 corsi, 49 lezioni e 168 moduli interattivi.",
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
  themeColor: "#003DA5",
};

// Inline script to apply dark mode class before first paint to prevent flash
const themeScript = `
(function(){
  try {
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
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Vai al contenuto</a>
        <LayoutShell>{children}</LayoutShell>
        <Analytics />
      </body>
    </html>
  );
}
