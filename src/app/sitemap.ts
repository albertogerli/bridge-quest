import type { MetadataRoute } from "next";
import { getCourses } from "@/lib/catalog";
import { getAllClubSlugs } from "@/lib/asd-utils";

/**
 * La mappa del sito non deve poter far fallire un deploy.
 *
 * Corsi e circoli si leggono dal database durante il build: se il database non
 * risponde — rete, chiave assente in un ambiente di prova, manutenzione di
 * Supabase — l'errore non restava confinato alla mappa, faceva cadere l'intero
 * `next build` e quindi il deploy. Succede raramente e nel momento peggiore.
 *
 * Ora un guasto costa le sole rotte dinamiche nella mappa: le pagine statiche
 * ci sono comunque, il sito va in produzione, e Google se ne accorge alla
 * prossima scansione. Il contrario — nessun sito perché manca un elenco di URL
 * — non ha senso.
 */
async function elencoCorsi() {
  try {
    return await getCourses();
  } catch {
    return [];
  }
}

async function elencoCircoli() {
  try {
    return await getAllClubSlugs();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await elencoCorsi();
  const baseUrl = "https://bridgelab.it";
  const lastModified = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/lezioni`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gioca`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/prima-mano`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/classifica`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/profilo`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/dispense`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/glossario`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/scopri`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/guida`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/termini`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/accessibilita`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/amici`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.6,
    },
  ];

  const lessonPages: MetadataRoute.Sitemap = courses.flatMap((course) =>
    course.lessons.map((lesson) => ({
      url: `${baseUrl}/lezioni/${lesson.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  );

  // Club pages
  const clubSlugs = await elencoCircoli();
  const clubPages: MetadataRoute.Sitemap = clubSlugs.map(({ slug }) => ({
    url: `${baseUrl}/circolo/${slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...lessonPages,
    ...clubPages,
  ];
}
