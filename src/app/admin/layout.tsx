import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server-side gate for the admin area (stesso pattern di istruttori/layout).
 * Prima il controllo era solo client-side; le RLS/RPC con is_admin() restano
 * la protezione dei dati, questo blocca il render della UI ai non-admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La riscrittura `/en/...` è invisibile qui (il percorso arriva senza
  // prefisso), ma il proxy segna la lingua nell'intestazione: senza questo un
  // utente inglese rimbalzava sulla pagina italiana.
  const prefisso = (await headers()).get("x-bridgelab-lingua") === "en" ? "/en" : "";
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${prefisso}/login?redirect=${prefisso}/admin`);
  }

  const { data: profile, error: erroreProfilo } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Un errore di lettura non è «non sei autorizzato»: rimandare a casa (o alla
  // pagina «diventa istruttore») un insegnante vero perché il database ha
  // balbettato lo fa credere escluso. Si lascia decidere al riquadro d'errore
  // della pagina, che offre di riprovare.
  if (erroreProfilo) throw erroreProfilo;

  if (!profile || profile.role !== "admin") {
    redirect(prefisso || "/");
  }

  return <>{children}</>;
}
