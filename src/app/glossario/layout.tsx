import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glossario del Bridge",
  description:
    "Tutti i termini del bridge spiegati in modo semplice: licita, presa, atout, contratto, slam, impasse e altro. Il glossario di BridgeLab, la scuola di bridge della FIGB.",
  alternates: { canonical: "/glossario" },
};

export default function GlossarioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
