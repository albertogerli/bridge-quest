import type { Metadata } from "next";
import { getLessonById, getCourseForLesson } from "@/data/courses";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lessonId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const id = parseInt(lessonId);
  const lesson = getLessonById(id);
  const course = getCourseForLesson(id);

  if (!lesson || !course) {
    return {
      title: "Lezione non trovata | FIGB Bridge LAB",
      description: "La lezione richiesta non esiste.",
    };
  }

  const totalModules = lesson.modules.length;
  const totalXp = lesson.modules.reduce((sum, m) => sum + m.xpReward, 0);
  const title = `${lesson.title} | ${course.name} | FIGB Bridge LAB`;
  const description = `${lesson.subtitle}. ${totalModules} moduli, ${totalXp} XP disponibili. ${course.name} - ${course.subtitle}. Impara il bridge con la piattaforma ufficiale FIGB.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://bridgelab.it/lezioni/${lessonId}`,
      siteName: "FIGB Bridge LAB",
      images: [
        {
          url: "https://bridgelab.it/youtube-banner.png",
          width: 1280,
          height: 720,
          alt: `${lesson.title} - FIGB Bridge LAB`,
        },
      ],
      locale: "it_IT",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://bridgelab.it/youtube-banner.png"],
    },
  };
}

export default async function LessonLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
