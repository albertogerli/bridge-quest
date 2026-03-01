"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { courses, type CourseId, levelInfo } from "@/data/courses";
import { getInfographicForLesson } from "@/components/maestro-video";
import Link from "next/link";

const courseColors: Record<CourseId, { active: string; inactive: string; border: string }> = {
  fiori: { active: "bg-emerald-500 text-white", inactive: "text-emerald-700", border: "border-emerald-200" },
  quadri: { active: "bg-orange-500 text-white", inactive: "text-orange-700", border: "border-orange-200" },
  "cuori-gioco": { active: "bg-red-500 text-white", inactive: "text-red-700", border: "border-red-200" },
  "cuori-licita": { active: "bg-rose-500 text-white", inactive: "text-rose-700", border: "border-rose-200" },
};

const courseGradients: Record<CourseId, string> = {
  fiori: "from-emerald-500 to-emerald-700",
  quadri: "from-orange-500 to-orange-700",
  "cuori-gioco": "from-red-500 to-red-700",
  "cuori-licita": "from-rose-500 to-rose-700",
};

export default function DispensePage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseId>("fiori");
  const currentCourse = courses.find((c) => c.id === selectedCourse) ?? courses[0];
  const profile = "junior"; // Currently only Junior infographics available

  const infographics = currentCourse.lessons.map((lesson) => ({
    lesson,
    info: getInfographicForLesson(lesson.id, profile),
  }));

  const coursePdf = infographics[0]?.info?.coursePdf;

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Link href="/lezioni" className="hover:text-[#003DA5] transition-colors">
              Lezioni
            </Link>
            <span>/</span>
            <span className="text-[#003DA5] font-semibold">Dispense</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dispense & Infografiche
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Materiale didattico per ogni lezione
          </p>
        </motion.div>

        {/* Course selector tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {courses.map((course) => {
            const isActive = course.id === selectedCourse;
            const colors = courseColors[course.id];
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97] ${
                  isActive
                    ? `${colors.active} shadow-[0_3px_0_rgba(0,0,0,0.15)]`
                    : `bg-white border-2 ${colors.border} ${colors.inactive} shadow-sm`
                }`}
              >
                <span className="text-lg">{course.icon}</span>
                <div className="text-left">
                  <div className="text-[13px] font-semibold leading-tight">
                    {course.name.replace("Corso ", "")}
                  </div>
                  <div className={`text-[10px] leading-tight ${isActive ? "text-white/70" : "text-gray-400"}`}>
                    {course.lessonCount} lezioni
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Course PDF download banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCourse}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Course info + full PDF */}
            <div className={`rounded-2xl bg-gradient-to-r ${courseGradients[selectedCourse]} p-5 mb-5`}>
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-white/20 text-white text-[10px] font-bold border-0 mb-2">
                    {levelInfo[currentCourse.level].label}
                  </Badge>
                  <h2 className="text-lg font-bold text-white">
                    {currentCourse.name}
                  </h2>
                  <p className="text-sm text-white/70 mt-0.5">
                    {currentCourse.lessonCount} dispense disponibili
                  </p>
                </div>
                {coursePdf && (
                  <a
                    href={coursePdf}
                    download
                    className="flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2.5 text-sm font-bold text-white hover:bg-white/30 transition-colors active:scale-95"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7,10 12,15 17,10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Tutte
                  </a>
                )}
              </div>
            </div>

            {/* Infographic grid */}
            <div className="grid grid-cols-2 gap-3">
              {infographics.map(({ lesson, info }, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.04 }}
                >
                  <InfographicCard
                    lessonId={lesson.id}
                    title={lesson.title}
                    icon={lesson.icon}
                    imageSrc={info?.image ?? ""}
                    pdfSrc={info?.pdf ?? ""}
                    courseId={selectedCourse}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function InfographicCard({
  lessonId,
  title,
  icon,
  imageSrc,
  pdfSrc,
  courseId,
}: {
  lessonId: number;
  title: string;
  icon: string;
  imageSrc: string;
  pdfSrc: string;
  courseId: CourseId;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const colors = courseColors[courseId];

  return (
    <div className="card-clean rounded-2xl bg-white overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        {!error ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={`Dispensa Lezione ${lessonId}`}
              className={`w-full h-full object-cover transition-all duration-300 ${
                loaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
              }`}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
            />
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <span className="text-3xl mb-1">{icon}</span>
            <span className="text-[10px] font-medium">Anteprima non disponibile</span>
          </div>
        )}

        {/* Lesson number badge */}
        <div className="absolute top-2 left-2">
          <Badge className={`${colors.active} text-[10px] font-bold border-0 shadow-sm`}>
            Lez. {lessonId}
          </Badge>
        </div>

        {/* PDF download button (overlay) */}
        {pdfSrc && (
          <a
            href={pdfSrc}
            download
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#003DA5] text-white shadow-lg transition-all hover:bg-[#002d7a] active:scale-90 opacity-0 group-hover:opacity-100 lg:opacity-100"
            title="Scarica PDF"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        )}
      </div>

      {/* Title */}
      <div className="p-2.5">
        <h3 className="text-[12px] font-bold text-gray-800 leading-tight line-clamp-2">
          {title}
        </h3>
        <Link
          href={`/lezioni/${lessonId}`}
          className="text-[10px] font-semibold text-[#003DA5] mt-1 inline-block hover:underline"
        >
          Vai alla lezione →
        </Link>
      </div>
    </div>
  );
}
