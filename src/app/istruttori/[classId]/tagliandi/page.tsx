"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Briciole } from "@/components/briciole";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import { invitoAttivo, indirizzoAula } from "@/lib/inviti-aula";
import { qrSvg } from "@/lib/qr";
import { useT } from "@/contexts/traduzioni-provider";

interface Riga {
  id: string;
  nome: string;
  presente: boolean;
  tavolo: number | null;
  posto: string | null;
}

/**
 * I tagliandi da ritagliare e distribuire in aula.
 *
 * A COSA SERVONO. In sala non si detta un indirizzo a venti persone e non si
 * gira col telefono a far inquadrare lo stesso codice: si posa un cartoncino su
 * ogni posto. Sopra c'è il nome, il tavolo, il posto e un QR che porta dentro.
 *
 * IL NOME È GIÀ SCRITTO NEL COLLEGAMENTO, così chi inquadra trova il campo
 * riempito e deve solo premere. Sono i dieci secondi che separano una classe
 * che comincia da una classe che scrive.
 *
 * IL CODICE È QUELLO DELLA CLASSE, uguale per tutti: non ce n'è uno per
 * persona. Chi prende il cartoncino di un altro entra col nome di un altro —
 * al bridge, in una lezione di prova, non è una minaccia, ed è comunque
 * l'insegnante ad assegnare i posti. Un gettone per allievo sarebbe venti
 * gettoni da gestire e revocare per un problema che non c'è.
 */
export default function TagliandiPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = useT();
  const { classId } = use(params);
  const [righe, setRighe] = useState<Riga[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(true);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const supabase = createClient();
        const [{ data }, invito] = await Promise.all([
          supabase
            .from("elenco_allievi")
            .select("id, nome, presente, tavolo, posto")
            .eq("class_id", classId)
            .eq("presente", true)
            .order("tavolo", { ascending: true, nullsFirst: false })
            .order("nome", { ascending: true }),
          invitoAttivo(classId),
        ]);
        if (!vivo) return;
        setRighe((data ?? []) as Riga[]);
        setToken(invito?.token ?? null);
      } catch (err) {
        reportError("tagliandi:carica", err);
      } finally {
        if (vivo) setCaricando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [classId]);

  const qrPerNome = useMemo(() => {
    const m = new Map<string, string>();
    if (!token) return m;
    for (const r of righe) {
      m.set(r.id, qrSvg(`${indirizzoAula(token)}?nome=${encodeURIComponent(r.nome)}`));
    }
    return m;
  }, [righe, token]);

  if (caricando) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="print:hidden">
        <Briciole
          percorso={[
            { etichetta: "Le tue classi", href: "/istruttori" },
            { etichetta: "La classe", href: `/istruttori/${classId}` },
            { etichetta: "Tagliandi" },
          ]}
        />
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("Stampa")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("Uno per allievo, da posare sul tavolo.")}
          </p>
        </div>
        {!token && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Non c&rsquo;è un link d&rsquo;ingresso attivo: generalo dalla pagina della classe, o i
            tagliandi non portano da nessuna parte.
          </p>
        )}
        {righe.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nessun allievo presente nell&rsquo;elenco.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:text-black">
        {righe.map((r) => (
          <div
            key={r.id}
            className="flex break-inside-avoid items-center gap-3 rounded-xl border border-border p-3 print:border-black"
          >
            {token && (
              <div
                className="w-24 shrink-0"
                dangerouslySetInnerHTML={{ __html: qrPerNome.get(r.id) ?? "" }}
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">{r.nome}</p>
              {r.tavolo !== null && (
                <p className="text-sm text-muted-foreground print:text-black">
                  Tavolo {r.tavolo}
                  {r.posto && ` · ${r.posto}`}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground print:text-black">
                {t("Inquadra il codice: il tuo nome è già scritto.")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
