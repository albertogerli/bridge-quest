import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { LayoutShell } from "@/components/layout-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BridgeQuest - Impara il Bridge giocando",
  description:
    "La piattaforma interattiva della FIGB per imparare il bridge. Gamification, AI e divertimento. Il tuo viaggio nel bridge inizia qui.",
  keywords: ["bridge", "FIGB", "corso fiori", "impara bridge", "gioco carte"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BridgeQuest",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Vai al contenuto</a>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
