// Maestro video - YouTube video IDs for all courses (per-profile)
// Channel: https://www.youtube.com/@FIGBBridgeLab
import { getCourseForLesson } from "@/data/courses";
import { getLessonAssetNumber, getLessonDisplayNumber } from "@/data/lesson-meta";

// ===== Profile Metadata =====

const MAESTRO_NAMES: Record<string, string> = {
  junior: "Maestro Franci",
  giovane: "Maestra Georgia",
  adulto: "Maestra Giulia",
  senior: "Maestro Marco",
};

const PROFILE_AGE_LABELS: Record<string, string> = {
  junior: "8-17 anni",
  giovane: "18-35 anni",
  adulto: "36-55 anni",
  senior: "55+ anni",
};

export function getMaestroName(profile: string): string {
  return MAESTRO_NAMES[profile] || "Maestro Andrea";
}

export function getProfileAgeLabel(profile: string): string {
  return PROFILE_AGE_LABELS[profile] || "";
}

// ===== YouTube Video IDs by lesson ID (per-profile) =====
// Each profile has its own set of YouTube video IDs.
// "junior" = current single-profile videos (already uploaded).
// Other profiles: IDs will be added once videos are uploaded to YouTube.

type ProfileYouTubeMap = Record<number, string>;
type CourseYouTubeMap = Record<string, ProfileYouTubeMap>;

// Corso Fiori (Base) - App IDs 0-12
const FIORI_YOUTUBE: CourseYouTubeMap = {
  junior: {
    0: "RBH2cAE6Pk8",   // Lezione 0: Il Bridge - Un Gioco di Prese
    1: "qmUGm6I_BpE",   // Lezione 1: Le Carte Vincenti
    2: "mbjV43fl1uI",   // Lezione 2: L'Attacco e la Difesa
    3: "H5stQyLwAcs",   // Lezione 3: Sviluppo del Gioco
    4: "g2qnXphmcgQ",   // Lezione 4: Il Piano di Gioco
    5: "t0QTS_ulR6Y",   // Lezione 5: La Dichiarazione - Le Basi
    6: "otFDie72PcY",   // Lezione 6: Risposte all'Apertura
    7: "e3YYPyetRXk",   // Lezione 7: Il Rientro del Dichiarante
    8: "jAGhKMLywAQ",   // Lezione 8: La Seconda Dichiarazione
    9: "enqWv8gZDsg",   // Lezione 9: Aperture di 1 a colore. Le risposte
    10: "vj1tobTPKdo",  // Lezione 10: L'apertore descrive
    11: "6RDfZoFDV74",  // Lezione 11: L'intervento
    12: "88pWri0SoqY",  // Lezione 12: Sviluppi dopo l'intervento avversario
  },
  giovane: {},
  adulto: {},
  senior: {},
};

// Corso Quadri (Intermedio) - Display IDs 1-12
const QUADRI_YOUTUBE: CourseYouTubeMap = {
  junior: {
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
  },
  giovane: {},
  adulto: {},
  senior: {},
};

// Corso Cuori Gioco (Avanzato - Gioco della Carta) - App IDs 100-109
const CUORI_GIOCO_YOUTUBE: CourseYouTubeMap = {
  junior: {
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
  },
  giovane: {},
  adulto: {},
  senior: {},
};

// Corso Cuori Licita (Avanzato - Dichiarazione) - App IDs 200-213
const CUORI_LICITA_YOUTUBE: CourseYouTubeMap = {
  junior: {
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
  },
  giovane: {},
  adulto: {},
  senior: {},
};

// ===== Infographic/Dispensa Paths =====

const SUPPORTED_INFOGRAPHIC_PROFILES = new Set(["junior"]);

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

// ===== Video Lookup Functions =====

function lookupVideoId(
  lessonId: number,
  profile: string,
  courseMap: CourseYouTubeMap,
  key: number
): string | null {
  // Try requested profile first, fallback to junior
  const profileMap = courseMap[profile];
  if (profileMap && profileMap[key] !== undefined) return profileMap[key];
  const juniorMap = courseMap.junior;
  if (juniorMap && juniorMap[key] !== undefined) return juniorMap[key];
  return null;
}

/** Get YouTube video ID for any lesson ID across all courses, with profile fallback */
export function getVideoForLesson(lessonId: number, profile?: string): string | null {
  const p = profile || "junior";
  const course = getCourseForLesson(lessonId);

  // Fiori: lessons 0-12
  if (course?.id === "fiori" || FIORI_YOUTUBE.junior[lessonId] !== undefined) {
    return lookupVideoId(lessonId, p, FIORI_YOUTUBE, lessonId);
  }
  // Quadri: lessons use display number 1-12
  if (course?.id === "quadri") {
    return lookupVideoId(lessonId, p, QUADRI_YOUTUBE, getLessonDisplayNumber(lessonId));
  }
  // Cuori Gioco: lessons 100-109
  if (course?.id === "cuori-gioco") {
    return lookupVideoId(lessonId, p, CUORI_GIOCO_YOUTUBE, lessonId);
  }
  // Cuori Licita: lessons 200-213
  if (course?.id === "cuori-licita") {
    return lookupVideoId(lessonId, p, CUORI_LICITA_YOUTUBE, lessonId);
  }
  return null;
}

/** Get YouTube embed URL for a lesson (profile-aware) */
export function getYouTubeEmbedUrl(lessonId: number, profile?: string): string | null {
  const videoId = getVideoForLesson(lessonId, profile);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/** Get YouTube watch URL for a lesson (profile-aware) */
export function getYouTubeWatchUrl(lessonId: number, profile?: string): string | null {
  const videoId = getVideoForLesson(lessonId, profile);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}
