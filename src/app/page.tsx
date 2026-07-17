import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HomeClient } from "./home-client";

// Decide auth from the session cookie on the server so logged-out visitors get
// the landing rendered into the initial HTML (fast LCP + SEO) instead of a
// client-side auth spinner. The client reconciles once its own auth resolves.
export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return <HomeClient serverAuthed={!!session} />;
}
