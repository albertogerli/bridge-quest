/**
 * FIGB Bridge LAB - Multi-Course Architecture
 * Combines Corso Fiori, Corso Quadri, Corso Cuori Licita, Corso Cuori Gioco
 * into a unified course system with shared types.
 */

import { worlds as fioriWorlds, allLessons as fioriLessons, type World, type Lesson, type LessonModule, type ContentBlock } from "./lessons";
import { quadriWorldsAdapted, quadriLessons } from "./quadri-lessons";
import { cuoriGiocoWorlds, cuoriGiocoLessons } from "./cuori-gioco-lessons";
import { cuoriLicitaWorlds, cuoriLicitaLessons } from "./cuori-licita-lessons";

// Re-export types used by course data files
export type { World, Lesson, LessonModule, ContentBlock };

// ===== Course Definition =====

export type CourseId = "fiori" | "quadri" | "cuori-gioco" | "cuori-licita";

export interface Course {
  id: CourseId;
  name: string;
  subtitle: string;
  icon: string;         // suit symbol or emoji
  color: string;        // tailwind color name
  gradient: string;     // tailwind gradient classes
  level: "base" | "intermedio" | "avanzato";
  lessonCount: number;
  worlds: World[];
  lessons: Lesson[];
}

// ===== Corso Fiori (Base) =====

const corsoFiori: Course = {
  id: "fiori",
  name: "Corso Fiori",
  subtitle: "Le basi del Bridge",
  icon: "♣",
  color: "emerald",
  gradient: "from-emerald to-emerald-dark",
  level: "base",
  lessonCount: 13,
  worlds: fioriWorlds,
  lessons: fioriLessons,
};

// ===== Corso Quadri (Intermedio) =====

const corsoQuadri: Course = {
  id: "quadri",
  name: "Corso Quadri",
  subtitle: "Gioco e dichiarazione intermedia",
  icon: "♦",
  color: "orange",
  gradient: "from-orange-500 to-orange-700",
  level: "intermedio",
  lessonCount: quadriLessons.length,
  worlds: quadriWorldsAdapted,
  lessons: quadriLessons,
};

// ===== Corso Cuori Gioco (Avanzato - Gioco della Carta) =====

const corsoCuoriGioco: Course = {
  id: "cuori-gioco",
  name: "Corso Cuori Gioco",
  subtitle: "Tecniche avanzate di gioco della carta",
  icon: "♥",
  color: "red",
  gradient: "from-red-500 to-red-700",
  level: "avanzato",
  lessonCount: cuoriGiocoLessons.length,
  worlds: cuoriGiocoWorlds,
  lessons: cuoriGiocoLessons,
};

// ===== Corso Cuori Licita (Avanzato - Dichiarazione) =====

const corsoCuoriLicita: Course = {
  id: "cuori-licita",
  name: "Corso Cuori Licita",
  subtitle: "Dichiarazione avanzata e convenzioni",
  icon: "♥",
  color: "rose",
  gradient: "from-rose-500 to-rose-700",
  level: "avanzato",
  lessonCount: cuoriLicitaLessons.length,
  worlds: cuoriLicitaWorlds,
  lessons: cuoriLicitaLessons,
};

// ===== All Courses =====

export const courses: Course[] = [
  corsoFiori,
  corsoQuadri,
  corsoCuoriGioco,
  corsoCuoriLicita,
];

// ===== Helper Functions =====

export function getCourseById(id: CourseId): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getAvailableCourses(): Course[] {
  return courses.filter((c) => c.lessons.length > 0);
}

export function getLessonById(id: number): Lesson | undefined {
  for (const course of courses) {
    const lesson = course.lessons.find((l) => l.id === id);
    if (lesson) return lesson;
  }
  return undefined;
}

export function getCourseForLesson(lessonId: number): Course | undefined {
  return courses.find((c) => c.lessons.some((l) => l.id === lessonId));
}

export function getModuleById(lessonId: number, moduleId: string): LessonModule | undefined {
  const lesson = getLessonById(lessonId);
  return lesson?.modules.find((m) => m.id === moduleId);
}

/** Get total stats across all courses */
export function getGlobalStats(completedMap: Record<string, boolean>) {
  let totalModules = 0;
  let totalCompleted = 0;

  for (const course of courses) {
    for (const lesson of course.lessons) {
      totalModules += lesson.modules.length;
      totalCompleted += lesson.modules.filter(
        (m) => completedMap[`${lesson.id}-${m.id}`]
      ).length;
    }
  }

  return { totalModules, totalCompleted };
}

/** Get stats for a specific course */
export function getCourseStats(courseId: CourseId, completedMap: Record<string, boolean>) {
  const course = getCourseById(courseId);
  if (!course) return { totalModules: 0, totalCompleted: 0, progress: 0 };

  let totalModules = 0;
  let totalCompleted = 0;

  for (const lesson of course.lessons) {
    totalModules += lesson.modules.length;
    totalCompleted += lesson.modules.filter(
      (m) => completedMap[`${lesson.id}-${m.id}`]
    ).length;
  }

  const progress = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;
  return { totalModules, totalCompleted, progress };
}

/** Level badge info for courses */
export const levelInfo: Record<string, { label: string; color: string; bg: string }> = {
  base: { label: "Base", color: "text-emerald-700", bg: "bg-emerald-50" },
  intermedio: { label: "Intermedio", color: "text-orange-700", bg: "bg-orange-50" },
  avanzato: { label: "Avanzato", color: "text-red-700", bg: "bg-red-50" },
};
