import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { corsoPubblicato } from "@/lib/corsi-server";
import { CorsoDettaglio } from "./corso-dettaglio";

export const revalidate = 600;

/**
 * La pagina di un corso: quella da mettere nel QR della locandina o mandare
 * su WhatsApp. Resa dal server e senza account, come /evento.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const corso = await corsoPubblicato(id);
  if (!corso) return { title: "Corso di bridge" };
  const tipo = corso.tipo === "bridge-5" ? "Bridge 5.0" : "corso di bridge";
  return {
    title: `${corso.circolo.name}: ${tipo}`,
    description: `Corso di bridge a ${corso.circolo.city} con ${corso.maestro}, dal ${corso.primaLezione}. Telefono e orari.`,
    alternates: { canonical: `/corsi/${corso.id}` },
  };
}

export default async function CorsoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const corso = await corsoPubblicato(id);
  if (!corso) notFound();
  return <CorsoDettaglio corso={corso} />;
}
