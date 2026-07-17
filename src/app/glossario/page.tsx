import { GlossarioClient } from "./glossario-client";
import { getGlossaryServer } from "@/lib/glossary-server";

// The glossary is public, static content (49 rows, same for everyone): render
// it into the initial HTML on the server and revalidate hourly (ISR). This
// removes the ~5.5s client-fetch LCP and makes the terms indexable.
// Metadata/canonical live in ./layout.tsx.
export const revalidate = 3600;

export default async function GlossarioPage() {
  const initialEntries = await getGlossaryServer();
  return <GlossarioClient initialEntries={initialEntries} />;
}
