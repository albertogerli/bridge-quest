import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scopri BridgeLab",
  description:
    "Cos'è BridgeLab: la piattaforma ufficiale della Federazione Italiana Gioco Bridge (FIGB) per imparare il bridge online — 4 corsi, 49 lezioni, giochi e sfide. Inizia gratis.",
  alternates: { canonical: "/scopri" },
};

export default function ScopriLayout({ children }: { children: React.ReactNode }) {
  return children;
}
