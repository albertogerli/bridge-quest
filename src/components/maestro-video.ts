// Maestro video - YouTube video IDs for all courses
// Channel: https://www.youtube.com/@FIGBBridgeLab
import { getCourseForLesson } from "@/data/courses";
import { getLessonAssetNumber, getLessonDisplayNumber } from "@/data/lesson-meta";

// ===== YouTube Video IDs by lesson ID =====

// Corso Fiori (Base) - App IDs 0-12
const FIORI_YOUTUBE: Record<number, string> = {
  0: "VwgC44w5QQI",   // Lezione 1: Il Bridge: un gioco di prese
  1: "rnKU1ofQAZw",   // Lezione 2: Vincenti e affrancabili
  2: "FBxpmzUwhhs",   // Lezione 3: Il punto di vista dei difensori
  3: "Bs3UtObjqHI",   // Lezione 4: Affrancamenti di lunga e di posizione
  4: "xU0FgJw0S18",   // Lezione 5: Il piano di gioco a senz'atout
  5: "fJ7rOJRbdmI",   // Lezione 6: Il gioco con l'atout
  6: "tL_e79sMUFA",   // Lezione 7: Il piano di gioco con l'atout
  7: "d4w1RW4O2v0",   // Lezione 8: La valutazione della mano
  8: "xzg-KoqdC2Y",   // Lezione 9: L'apertura e la risposta
  9: "enqWv8gZDsg",   // Lezione 10: Aperture di 1 a colore. Le risposte
  10: "vj1tobTPKdo",  // Lezione 11: L'apertore descrive
  11: "6RDfZoFDV74",  // Lezione 12: L'intervento
  12: "88pWri0SoqY",  // Lezione 13: Sviluppi dopo l'intervento avversario
};

// Corso Quadri (Intermedio) - App IDs 1-12 (matched by title)
const QUADRI_YOUTUBE: Record<number, string> = {
  1: "1uXF-moavk4",   // Tempi e comunicazioni nel gioco a Senza
  2: "z5ARHxRlssk",   // Valutazioni sull'apertura
  3: "bUutL78Uj6k",   // Contratti ad atout: tempo e controllo
  4: "szpKZ6rN5-Q",   // Il capitanato e la replica dell'apertore
  5: "tG7gJfJrcss",   // I colori bucati: come muovere le figure
  6: "oh8wQtG5n44",   // Le aperture oltre il livello 1
  7: "quSCOSB5mlE",   // Attacchi e segnali di controgioco
  8: "PEfMpjnOCzY",   // L'accostamento a manche
  9: "HGmg29oMhU4",   // Ricevere l'attacco
  10: "yV3BOMD41Wo",  // Il Contro e la Surlicita
  11: "4MtH_hBqlCg",  // Controgioco: ragionare e dedurre
  12: "df1MjWBURGc",  // Interventi e riaperture
};

// Corso Cuori Gioco (Avanzato - Gioco della Carta) - App IDs 100-109
const CUORI_GIOCO_YOUTUBE: Record<number, string> = {
  100: "KLuPozpP_fY",  // Lezione 1: La Prima Presa
  101: "-MRZooo6VyQ",  // Lezione 2: Fit 5-3 e Fit 4-4
  102: "jjE6CEkJfbk",  // Lezione 3: Conto e Preferenziali
  103: "oM2QQjk-pgo",  // Lezione 4: I Colori da Muovere in Difesa
  104: "w-FgUAtt9WE",  // Lezione 5: I Giochi di Sicurezza
  105: "naxJwzAbkzw",  // Lezione 6: Probabilità e Percentuali
  106: "F9za8KHhfVg",  // Lezione 7: Coprire o Non Coprire
  107: "aecrF3yp0XY",  // Lezione 8: I Giochi di Eliminazione
  108: "dUdOmf_asTY",  // Lezione 9: Giocare Come Se
  109: "0yaxHTsPC-E",  // Lezione 10: Le Deduzioni del Giocante
};

// Corso Cuori Licita (Avanzato - Dichiarazione) - App IDs 200-213
const CUORI_LICITA_YOUTUBE: Record<number, string> = {
  200: "fWEjcQA2RAw",  // Lezione 1: La Legge delle Prese Totali
  201: "_2qMRoPGeQo",  // Lezione 2: Valutazioni: le lunghe e le corte
  202: "UzyWdW4nqac",  // Lezione 3: Le Texas su apertura 1NT e 2NT
  203: "5_LgfN-frb4",  // Lezione 4: Sviluppi dopo le risposte 2 su 1
  204: "xBlnA6yKG70",  // Lezione 5: Accostamento a Slam: fissare l'atout
  205: "C84eFojY6LI",  // Lezione 6: Accostamento a Slam: le Cue Bid
  206: "h8onsYLn_m4",  // Lezione 7: Le Sottoaperture
  207: "D9-QEqztkx0",  // Lezione 8: L'apertura di 2♣ forte indeterminata
  208: "sn11DyOH6EM",  // Lezione 9: Competitivo, costruttivo, interdittivo
  209: "W-DHuyJ413c",  // Lezione 10: Mani di fit nel nobile: standard
  210: "jbR1bgSk8h8",  // Lezione 11: Mani di fit nel nobile: Bergen
  211: "x9GfL4dk_xw",  // Lezione 12: Mani di fit nel nobile: appoggi costruttivi
  212: "zjsKTtD9qI4",  // Lezione 13: Interventi speciali e difese
  213: "kADR6dXdUJU",  // Lezione 14: Casi particolari dopo le risposte 1 su 1
};

// ===== Infographic/Dispensa Paths =====

const MAESTRO_NAMES: Record<string, string> = {
  junior: "Maestro Franci",
  giovane: "Maestra Carla",
  adulto: "Maestro Andrea",
  senior: "Maestro Claudio",
};

const SUPPORTED_INFOGRAPHIC_PROFILES = new Set(["junior"]);

export function getMaestroName(profile: string): string {
  return MAESTRO_NAMES[profile] || "Maestro Andrea";
}

/** Get infographic image path for a lesson + profile */
export function getInfographicForLesson(
  lessonId: number,
  profile: string
): { image: string; pdf: string; coursePdf: string } | null {
  const course = getCourseForLesson(lessonId);
  if (!course) return null;

  const courseFolder = course.id; // "fiori" | "quadri" | "cuori-gioco" | "cuori-licita"
  const formattedId = String(getLessonAssetNumber(lessonId)).padStart(2, "0");
  const requestedProfile = profile || "junior";
  const p = SUPPORTED_INFOGRAPHIC_PROFILES.has(requestedProfile)
    ? requestedProfile
    : "junior";

  return {
    image: `/infografiche/${courseFolder}/lezione-${formattedId}-${p}.jpg`,
    pdf: `/infografiche/${courseFolder}/lezione-${formattedId}-${p}.pdf`,
    coursePdf: `/infografiche/${courseFolder}/corso-${courseFolder}-${p}.pdf`,
  };
}

// Universal: get YouTube video ID for any lesson ID across all courses
export function getVideoForLesson(lessonId: number): string | null {
  const course = getCourseForLesson(lessonId);
  // Fiori: lessons 0-12
  if (FIORI_YOUTUBE[lessonId] !== undefined) return FIORI_YOUTUBE[lessonId];
  // Quadri: lessons 1-12
  if (course?.id === "quadri") {
    return QUADRI_YOUTUBE[getLessonDisplayNumber(lessonId)] ?? null;
  }
  // Cuori Gioco: lessons 100-109
  if (CUORI_GIOCO_YOUTUBE[lessonId]) return CUORI_GIOCO_YOUTUBE[lessonId];
  // Cuori Licita: lessons 200-213
  if (CUORI_LICITA_YOUTUBE[lessonId]) return CUORI_LICITA_YOUTUBE[lessonId];
  return null;
}

/** Get YouTube embed URL for a lesson */
export function getYouTubeEmbedUrl(lessonId: number): string | null {
  const videoId = getVideoForLesson(lessonId);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/** Get YouTube watch URL for a lesson */
export function getYouTubeWatchUrl(lessonId: number): string | null {
  const videoId = getVideoForLesson(lessonId);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}
