// Maestro video paths for all courses
// Videos are stored in public/videos/ and served statically

// ===== Corso Fiori (Base) =====
export const MAESTRO_VIDEOS = {
  intro: "/videos/maestro-fiori-intro.mp4",
  lesson1: "/videos/maestro-fiori-lezione1.mp4",
  lesson2: "/videos/maestro-fiori-lezione2.mp4",
  lesson3: "/videos/maestro-fiori-lezione3.mp4",
  lesson4: "/videos/maestro-fiori-lezione4.mp4",
  lesson5: "/videos/maestro-fiori-lezione5.mp4",
  lesson6: "/videos/maestro-fiori-lezione6.mp4",
  lesson7: "/videos/maestro-fiori-lezione7.mp4",
  lesson8: "/videos/maestro-fiori-lezione8.mp4",
  lesson9: "/videos/maestro-fiori-lezione9.mp4",
  lesson10: "/videos/maestro-fiori-lezione10.mp4",
  lesson11: "/videos/maestro-fiori-lezione11.mp4",
  lesson12: "/videos/maestro-fiori-lezione12.mp4",
} as const;

// ===== Corso Quadri (Intermedio) =====
export const QUADRI_VIDEOS: Record<number, string> = {
  1: "/videos/maestro-quadri-lezione1.mp4",
  2: "/videos/maestro-quadri-lezione2.mp4",
  3: "/videos/maestro-quadri-lezione3.mp4",
  4: "/videos/maestro-quadri-lezione4.mp4",
  5: "/videos/maestro-quadri-lezione5.mp4",
  6: "/videos/maestro-quadri-lezione6.mp4",
  7: "/videos/maestro-quadri-lezione7.mp4",
  8: "/videos/maestro-quadri-lezione8.mp4",
  9: "/videos/maestro-quadri-lezione9.mp4",
  10: "/videos/maestro-quadri-lezione10.mp4",
  11: "/videos/maestro-quadri-lezione11.mp4",
  12: "/videos/maestro-quadri-lezione12.mp4",
};

// ===== Corso Cuori Gioco (Avanzato - Gioco della Carta) =====
export const CUORI_GIOCO_VIDEOS: Record<number, string> = {
  100: "/videos/maestro-cuori-gioco-lezione100.mp4",
  101: "/videos/maestro-cuori-gioco-lezione101.mp4",
  102: "/videos/maestro-cuori-gioco-lezione102.mp4",
  103: "/videos/maestro-cuori-gioco-lezione103.mp4",
  104: "/videos/maestro-cuori-gioco-lezione104.mp4",
  105: "/videos/maestro-cuori-gioco-lezione105.mp4",
  106: "/videos/maestro-cuori-gioco-lezione106.mp4",
  107: "/videos/maestro-cuori-gioco-lezione107.mp4",
  108: "/videos/maestro-cuori-gioco-lezione108.mp4",
  109: "/videos/maestro-cuori-gioco-lezione109.mp4",
};

// ===== Corso Cuori Licita (Avanzato - Dichiarazione) =====
export const CUORI_LICITA_VIDEOS: Record<number, string> = {
  200: "/videos/maestro-cuori-licita-lezione200.mp4",
  201: "/videos/maestro-cuori-licita-lezione201.mp4",
  202: "/videos/maestro-cuori-licita-lezione202.mp4",
  203: "/videos/maestro-cuori-licita-lezione203.mp4",
  204: "/videos/maestro-cuori-licita-lezione204.mp4",
  205: "/videos/maestro-cuori-licita-lezione205.mp4",
  206: "/videos/maestro-cuori-licita-lezione206.mp4",
  207: "/videos/maestro-cuori-licita-lezione207.mp4",
  208: "/videos/maestro-cuori-licita-lezione208.mp4",
  209: "/videos/maestro-cuori-licita-lezione209.mp4",
  210: "/videos/maestro-cuori-licita-lezione210.mp4",
  211: "/videos/maestro-cuori-licita-lezione211.mp4",
  212: "/videos/maestro-cuori-licita-lezione212.mp4",
  213: "/videos/maestro-cuori-licita-lezione213.mp4",
};

// Get video path for a Fiori lesson (0-12)
export function getLessonVideo(lessonNum: number): string | null {
  if (lessonNum === 0) return MAESTRO_VIDEOS.intro;
  const key = `lesson${lessonNum}` as keyof typeof MAESTRO_VIDEOS;
  return MAESTRO_VIDEOS[key] ?? null;
}

// Universal: get video for any lesson ID across all courses
export function getVideoForLesson(lessonId: number): string | null {
  // Fiori: lessons 0-12
  if (lessonId >= 0 && lessonId <= 12) {
    return getLessonVideo(lessonId);
  }
  // Quadri: lessons 1-12 (numeric IDs match)
  if (QUADRI_VIDEOS[lessonId]) return QUADRI_VIDEOS[lessonId];
  // Cuori Gioco: lessons 100-109
  if (CUORI_GIOCO_VIDEOS[lessonId]) return CUORI_GIOCO_VIDEOS[lessonId];
  // Cuori Licita: lessons 200-213
  if (CUORI_LICITA_VIDEOS[lessonId]) return CUORI_LICITA_VIDEOS[lessonId];
  return null;
}
