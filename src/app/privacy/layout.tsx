import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy e Cookie Policy",
  description:
    "Informativa sulla privacy e cookie policy di BridgeLab, la piattaforma di apprendimento del bridge della Federazione Italiana Gioco Bridge (FIGB).",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
