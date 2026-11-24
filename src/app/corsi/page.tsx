import type { Metadata } from "next";
import { corsiPubblicati } from "@/lib/corsi-server";
import { CorsiClient } from "./corsi-client";

// Pubblica e indicizzabile: i corsi arrivano nell'HTML. Si rigenera ogni dieci
// minuti, così un corso approvato compare in fretta (gli indirizzi firmati
// delle locandine durano due giorni).
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Corsi di bridge vicino a te",
  description:
    "I corsi di bridge dei circoli FIGB: Bridge 5.0 e tradizionali, con date, orari, maestro e telefono. Trova il corso più vicino e chiama per iscriverti.",
  alternates: { canonical: "/corsi" },
};

export default async function CorsiPage() {
  const corsi = await corsiPubblicati();
  return <CorsiClient corsi={corsi} />;
}
