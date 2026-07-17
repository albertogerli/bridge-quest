import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini di Servizio",
  description:
    "Termini di servizio di BridgeLab, la piattaforma di apprendimento del bridge della Federazione Italiana Gioco Bridge (FIGB).",
  alternates: { canonical: "/termini" },
};

export default function TerminiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
