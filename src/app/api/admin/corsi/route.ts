import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { avvisaAutoreEsito } from "@/lib/email/corsi";
import { reportError } from "@/lib/report-error";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid(),
  azione: z.enum(["approva", "modifica", "rifiuta", "ritira"]),
  messaggio: z.string().trim().max(2000).optional().nullable(),
});

const STATO = {
  approva: "pubblicato",
  modifica: "da-modificare",
  rifiuta: "rifiutato",
  ritira: "ritirato",
} as const;

/**
 * POST /api/admin/corsi — l'amministratore decide su un corso.
 *
 * Approvare una MODIFICA (`sostituisce` valorizzato) pubblica la versione nuova
 * e solo allora toglie la vecchia: fino a quel momento online resta quella
 * vecchia. «Ritira» toglie un corso già pubblicato (senza mail).
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const { data: admin, error: erroreRuolo } = await supabase.rpc("is_admin");
  if (erroreRuolo) {
    reportError("api:admin:corsi:ruolo", erroreRuolo);
    return NextResponse.json({ error: "Verifica del ruolo non riuscita" }, { status: 500 });
  }
  if (!admin) return NextResponse.json({ error: "Solo amministratori" }, { status: 403 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  const { id, azione } = parsed.data;
  const messaggio = parsed.data.messaggio || null;
  if (azione === "modifica" && !messaggio) {
    return NextResponse.json({ error: "Scrivi cosa va modificato" }, { status: 400 });
  }

  const db = createAdminSupabaseClient();
  const { data: corso, error: erroreLettura } = await db
    .from("corsi")
    .select("id, user_id, stato, asd_code, sostituisce")
    .eq("id", id)
    .maybeSingle();
  if (erroreLettura || !corso) return NextResponse.json({ error: "Corso non trovato" }, { status: 404 });

  const ora = new Date().toISOString();
  const { error } = await db
    .from("corsi")
    .update({
      stato: STATO[azione],
      messaggio_admin: messaggio,
      updated_at: ora,
      ...(azione === "approva" ? { approvato_il: ora } : {}),
    })
    .eq("id", id);
  if (error) {
    reportError("api:admin:corsi:aggiorna", error);
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 500 });
  }

  if (azione === "approva" && corso.sostituisce) {
    const { error: erroreVecchio } = await db
      .from("corsi")
      .update({ stato: "sostituito", updated_at: ora })
      .eq("id", corso.sostituisce)
      .eq("stato", "pubblicato");
    if (erroreVecchio) reportError("api:admin:corsi:sostituito", erroreVecchio);
  }

  // La pagina pubblica si rigenera ogni dieci minuti: un corso appena
  // approvato (o ritirato) deve vedersi subito.
  revalidatePath("/corsi");
  revalidatePath(`/corsi/${id}`);
  if (corso.sostituisce) revalidatePath(`/corsi/${corso.sostituisce}`);

  if (azione !== "ritira" && corso.user_id) {
    try {
      const [{ data: autore }, { data: circolo }] = await Promise.all([
        db.auth.admin.getUserById(corso.user_id),
        db.from("asd_clubs").select("name").eq("code", corso.asd_code).maybeSingle(),
      ]);
      const email = autore?.user?.email;
      if (email) {
        await avvisaAutoreEsito({
          to: email,
          esito: STATO[azione] as "pubblicato" | "da-modificare" | "rifiutato",
          circolo: circolo?.name ?? corso.asd_code,
          idCorso: corso.id,
          messaggio,
        });
      }
    } catch (err) {
      reportError("api:admin:corsi:mail", err);
    }
  }

  return NextResponse.json({ ok: true });
}
