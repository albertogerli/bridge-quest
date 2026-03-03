import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
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
  ];

  // Corso Fiori lessons (IDs 0-12)
  const fioriLessons: MetadataRoute.Sitemap = Array.from({ length: 13 }, (_, i) => ({
    url: `${baseUrl}/lezioni/${i}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Corso Quadri lessons (IDs 1-12)
  const quadriLessons: MetadataRoute.Sitemap = Array.from({ length: 12 }, (_, i) => ({
    url: `${baseUrl}/lezioni/${i + 1}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Corso Cuori Gioco lessons (IDs 100-109)
  const cuoriGiocoLessons: MetadataRoute.Sitemap = Array.from({ length: 10 }, (_, i) => ({
    url: `${baseUrl}/lezioni/${100 + i}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Corso Cuori Licita lessons (IDs 200-213)
  const cuoriLicitaLessons: MetadataRoute.Sitemap = Array.from({ length: 14 }, (_, i) => ({
    url: `${baseUrl}/lezioni/${200 + i}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...fioriLessons,
    ...cuoriGiocoLessons,
    ...cuoriLicitaLessons,
    ...quadriLessons,
  ];
}
