import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guida a BridgeLab",
  description:
    "Come usare BridgeLab: lezioni, giochi, sfide quotidiane, classifica e progressi. La guida completa alla scuola di bridge online della FIGB.",
  alternates: { canonical: "/guida" },
};

export default function GuidaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
