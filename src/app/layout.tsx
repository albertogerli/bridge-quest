import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { BottomNav } from "@/components/bottom-nav";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BridgeQuest",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <div className="flex min-h-svh flex-col bg-[#fafbfc]">
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
