import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server-side gate for the instructor portal.
 *
 * Runs on the server before render, reading the session + profile.role from
 * cookies. This avoids the flash you'd get gating client-side (where useAuth
 * loads the profile in the background). Non-instructors are redirected to the
 * application page (/diventa-istruttore); unauthenticated users to /login.
 */
export default async function IstruttoriLayout({
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
    redirect(`${prefisso}/login`);
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

  if (!profile || (profile.role !== "instructor" && profile.role !== "admin")) {
    redirect(`${prefisso}/diventa-istruttore`);
  }

  return <>{children}</>;
}
