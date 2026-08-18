"use client";

import { use } from "react";
import Link from "next/link";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import {
  computeProgressPercent,
  findNextLesson,
  findNextModule,
} from "@/lib/lesson-module";
import { useModuleSession } from "./_use-module-session";
import { BridgeTableIllustration } from "./_components/bridge-table-illustration";
import { GamificationBar } from "./_components/gamification-bar";
import { MaestroVideoInline } from "./_components/maestro-video-inline";
import { ModuleCompletion } from "./_components/module-completion";
import { ModuleContent } from "./_components/module-content";
import { ModuleHeader } from "./_components/module-header";
import { ModuleNav } from "./_components/module-nav";
import { ModuleEffects, ModuleToasts } from "./_components/module-overlays";
import { useT } from "@/contexts/traduzioni-provider";

export default function ModulePage({
  params,
}: {
  params: Promise<{ lessonId: string; moduleId: string }>;
}) {
  const t = useT();
  const { lessonId, moduleId } = use(params);
  const session = useModuleSession(lessonId, moduleId);
  const { lesson, mod, profile } = session;

  if (!session.catalogLoaded) {
    return (
      <div className="pt-10 text-center text-muted-foreground text-sm" role="status" aria-label={t("Caricamento modulo")}>
        {t("Caricamento modulo…")}
      </div>
    );
  }

  if (!lesson || !mod) {
    return (
      <div className="pt-10 px-5 text-center">
        <p className="text-muted-foreground">{t("Modulo non trovato")}</p>
        <Link href="/lezioni" className="text-emerald font-bold text-sm mt-2 inline-block">
          {t("Torna alle lezioni")}
        </Link>
      </div>
    );
  }

  const { currentStep } = session;
  const totalSteps = mod.content.length;
  const isLastStep = currentStep >= totalSteps - 1;
  const progress = computeProgressPercent(currentStep, totalSteps);
  const lessonNumber = getLessonDisplayNumber(lesson.id);

  const moduleIndex = lesson.modules.findIndex((m) => m.id === moduleId);
  const nextModule = findNextModule(lesson, moduleId);

  // Find the next lesson if all modules in this lesson are done
  const nextLesson = findNextLesson(
    session.courses.flatMap((c) => c.worlds),
    lesson.id,
    !!nextModule
  );

  const isLessonComplete = !nextModule;

  return (
    <div className="pt-6 px-5 pb-32">
      <div className="mx-auto max-w-6xl">
        <ModuleEffects
          floatingXp={session.floatingXp}
          xpLabel={profile.xpLabel}
          showLevelUp={session.showLevelUp}
          closeLevelUp={session.closeLevelUp}
          levelUpRef={session.levelUpRef}
          levelUpTitle={profile.levelUpTitle}
          levelUpLevel={session.levelUpLevel}
          particles={session.particles}
        />

        <ModuleHeader
          lessonId={lessonId}
          progress={progress}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLastStep={isLastStep}
          correctStreak={session.blockContext.correctStreak}
          xpEarned={session.xpEarned}
          lessonNumber={lessonNumber}
          moduleTitle={mod.title}
          profile={profile}
        />

        <GamificationBar
          totalQuizzes={session.totalQuizzes}
          lives={session.lives}
          livesLost={session.livesLost}
          xpMultiplier={session.xpMultiplier}
          powerups={session.powerups}
          showTimer={profile.showTimer}
        />

        <ModuleToasts
          showXpPop={session.showXpPop}
          xpPopAmount={session.xpPopAmount}
          xpLabel={profile.xpLabel}
          saveToast={session.saveToast}
          achievement={session.achievement}
        />

        {/* Maestro video - first module of each lesson, shown at start */}
        <MaestroVideoInline
          lessonId={lesson.id}
          moduleIndex={moduleIndex}
          currentStep={currentStep}
          profile={profile.profile}
          onDismiss={() => {
            // Auto-advance to next step when video is dismissed
            if (currentStep === 0 && totalSteps > 1) {
              session.handleStepAdvance(1);
            }
          }}
        />

        <ModuleContent
          content={mod.content}
          currentStep={currentStep}
          ctx={session.blockContext}
        />

        {currentStep === 0 && <BridgeTableIllustration />}

        <ModuleNav
          lessonId={lessonId}
          currentStep={currentStep}
          isLastStep={isLastStep}
          canAdvance={session.canAdvance}
          nextModule={nextModule}
          profile={profile}
          onStepAdvance={session.handleStepAdvance}
          onSaveAndExit={session.handleSaveAndExit}
        />

        {/* Completion card at the end */}
        {isLastStep && currentStep === totalSteps - 1 && (
          <ModuleCompletion
            lessonId={lessonId}
            lesson={lesson}
            mod={mod}
            moduleIndex={moduleIndex}
            lessonNumber={lessonNumber}
            nextModule={nextModule}
            nextLesson={nextLesson}
            isLessonComplete={isLessonComplete}
            totalQuizzes={session.totalQuizzes}
            correctAnswers={session.correctAnswers}
            bestStreak={session.bestStreak}
            lives={session.lives}
            xpEarned={session.xpEarned}
            profile={profile}
            showComprehension={session.showComprehension}
            onComprehensionComplete={session.onComprehensionComplete}
            onComprehensionSkip={session.dismissComprehension}
          />
        )}
      </div>
    </div>
  );
}
