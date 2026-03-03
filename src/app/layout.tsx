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
    default: "FIGB Bridge LAB - Impara il Bridge giocando",
    template: "%s",
  },
  description:
    "La piattaforma ufficiale della Federazione Italiana Gioco Bridge (FIGB) per imparare il bridge. 4 corsi completi: Fiori, Quadri, Cuori Gioco e Cuori Licita. 49 lezioni interattive con gamification, AI e video didattici.",
  keywords: [
    "bridge",
    "FIGB",
    "federazione italiana gioco bridge",
    "corso bridge",
    "corso fiori",
    "corso quadri",
    "corso cuori",
    "impara bridge",
    "gioco carte",
    "bridge lab",
    "bridge online",
    "lezioni bridge",
    "dichiarazione bridge",
    "gioco della carta",
  ],
  metadataBase: new URL("https://bridgelab.figb.it"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FIGB Bridge LAB - Impara il Bridge giocando",
    description:
      "La piattaforma ufficiale FIGB per imparare il bridge. 4 corsi, 49 lezioni interattive, gamification e AI. Il tuo viaggio nel bridge inizia qui.",
    url: "https://bridgelab.figb.it",
    siteName: "FIGB Bridge LAB",
    images: [
      {
        url: "/youtube-banner.png",
        width: 1280,
        height: 720,
        alt: "FIGB Bridge LAB - Impara il Bridge giocando",
      },
    ],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FIGB Bridge LAB - Impara il Bridge giocando",
    description:
      "La piattaforma ufficiale FIGB per imparare il bridge. 4 corsi, 49 lezioni interattive, gamification e AI.",
    images: ["/youtube-banner.png"],
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
    title: "Bridge LAB",
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
  maximumScale: 1,
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
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Vai al contenuto</a>
        <LayoutShell>{children}</LayoutShell>
        <Analytics />
      </body>
    </html>
  );
}
