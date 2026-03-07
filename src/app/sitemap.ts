import type { MetadataRoute } from "next";
import { courses } from "@/data/courses";

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

  const lessonPages: MetadataRoute.Sitemap = courses.flatMap((course) =>
    course.lessons.map((lesson) => ({
      url: `${baseUrl}/lezioni/${lesson.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  );

  return [
    ...staticPages,
    ...lessonPages,
  ];
}
