import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TestiLocandina } from "@/lib/locandina";

/**
 * Dove atterra chi inquadra la locandina.
 *
 * PERCHÉ NON PORTAVA QUI PRIMA. Il QR mandava a `/classi?codice=`, dove si
 * legge «Iscriviti con il codice del tuo istruttore»: ogni parola presuppone
 * che tu abbia già un insegnante, sappia cosa sia una classe e abbia un codice.
 * Chi ha inquadrato un cartello in una sala d'attesa non ha nessuna delle tre
 * cose — e `/classi` non è nemmeno pubblica, quindi finiva prima al login.
 * Quella persona non si lamenta: se ne va, e nessuno lo viene a sapere.
 *
 * SI LEGGE SENZA ACCOUNT. Prima si racconta la serata — cos'è, quando, dove,
 * chi la fa — e solo dopo si propone di venire. L'iscrizione è la conseguenza
 * di aver capito, non la premessa per capire.
 *
 * RESA DAL SERVER, e non è un dettaglio: il contesto reale è un telefono in
 * sala d'attesa, con due minuti prima che chiamino e la rete del posto. Una
 * pagina che arriva già scritta nell'HTML si legge subito; una che deve
 * scaricare l'applicazione, autenticarsi e poi chiedere i dati, no.
 *
 * NON ESPONE LA CLASSE. La funzione `evento_da_codice` restituisce i soli campi
 * della locandina — cioè quello che è già scritto su un cartello appeso in
 * bacheca. Chi ha il codice ha un volantino, non una chiave.
 */

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ codice: string }> }) {
  const evento = await leggiEvento((await params).codice);
  if (!evento) return { title: "Evento non trovato" };
  return {
    title: `${evento.titolo} — ${evento.associazione}`,
    description: [evento.quando, evento.dove].filter(Boolean).join(" · "),
  };
}

async function leggiEvento(codice: string): Promise<TestiLocandina | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("evento_da_codice", { p_codice: codice });
  if (error || !data) return null;
  return data as TestiLocandina;
}

export default async function EventoPage({ params }: { params: Promise<{ codice: string }> }) {
  const { codice } = await params;
  const evento = await leggiEvento(codice);
  if (!evento) notFound();

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-8">
      {evento.evento && (
        <span className="inline-block rounded-lg bg-[#003DA5] px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-white">
          {evento.evento}
        </span>
      )}

      <h1 className="mt-4 font-display text-4xl font-bold leading-tight">{evento.titolo}</h1>
      {evento.sottotitolo && (
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{evento.sottotitolo}</p>
      )}

      <div className="mt-7 space-y-3 rounded-2xl border border-border bg-card p-5">
        {evento.quando && (
          <p className="text-xl font-bold text-[#003DA5] dark:text-primary">{evento.quando}</p>
        )}
        {evento.dove && <p className="whitespace-pre-line text-base">{evento.dove}</p>}
        <div className="border-t border-border pt-3 text-sm text-muted-foreground">
          {evento.associazione && <p className="text-base font-semibold text-foreground">{evento.associazione}</p>}
          {evento.insegnante && <p>Con {evento.insegnante}</p>}
          {evento.corso && <p>{evento.corso}</p>}
        </div>
      </div>

      {evento.note && (
        <p className="mt-4 whitespace-pre-line rounded-xl border-l-4 border-[#c8a44e] bg-muted/50 p-4 text-sm">
          {evento.note}
        </p>
      )}

      {/*
        «Vengo» viene DOPO aver letto di cosa si tratta, e porta al posto dove
        ci si iscrive con il codice già in mano — chi arriva di qui non deve
        digitarlo né sapere di averlo.
      */}
      <div className="mt-8">
        <Link
          href={`/classi?codice=${encodeURIComponent(codice)}`}
          className="flex min-h-14 w-full items-center justify-center rounded-xl bg-[#003DA5] px-6 text-lg font-bold text-white"
        >
          Voglio venire
        </Link>
        {evento.contatti && (
          <p className="mt-3 text-center text-sm text-muted-foreground">{evento.contatti}</p>
        )}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        bridgelab.it — Federazione Italiana Gioco Bridge
      </p>
    </main>
  );
}
