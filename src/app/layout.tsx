import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
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
        <div className="flex min-h-svh bg-[#F7F5F0]">
          {/* Left nav - desktop only */}
          <DesktopNav />

          {/* Center: main content */}
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 pb-20 lg:pb-6">{children}</main>
            <BottomNav />
          </div>

          {/* Right sidebar - desktop only */}
          <div className="hidden lg:block px-6 pt-6">
            <DesktopSidebar />
          </div>
        </div>
      </body>
    </html>
  );
}
