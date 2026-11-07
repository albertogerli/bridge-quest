import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eliminare l'account",
  description:
    "Come eliminare il proprio account BridgeLab e tutti i dati collegati, dall'app, dal sito o per email.",
  alternates: { canonical: "/elimina-account" },
};

export default function EliminaAccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
