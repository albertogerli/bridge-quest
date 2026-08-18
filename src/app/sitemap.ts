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

  const italiano = [...staticPages, ...lessonPages, ...clubPages];

  /**
   * Ogni pagina compare due volte, una per lingua, e ciascuna dichiara
   * l'altra.
   *
   * `alternates.languages` è il modo in cui si dice a un motore di ricerca
   * «questa pagina esiste anche in inglese, ed è la stessa pagina»: senza,
   * le due versioni si fanno concorrenza fra loro e chi cerca in inglese
   * trova la pagina italiana. `x-default` indica dove mandare chi non ha una
   * preferenza — l'italiano, che è la lingua di casa.
   *
   * Fase 1: gli indirizzi inglesi esistono e rispondono, il contenuto è ancora
   * italiano. È voluto — si costruisce la strada prima di asfaltarla — ma
   * finché la traduzione non c'è NON si sottomette questa mappa ai motori di
   * ricerca, o si offre a Google un sito inglese scritto in italiano.
   */
  const conAlternative = (voci: MetadataRoute.Sitemap): MetadataRoute.Sitemap =>
    voci.flatMap((v) => {
      const percorso = v.url.replace(baseUrl, "");
      const inglese = `${baseUrl}/en${percorso}`;
      const languages = { it: v.url, en: inglese, "x-default": v.url };
      return [
        { ...v, alternates: { languages } },
        { ...v, url: inglese, alternates: { languages } },
      ];
    });

  return conAlternative(italiano);
}
