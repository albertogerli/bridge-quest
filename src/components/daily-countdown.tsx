"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyCountdownProps {
  variant: "compact" | "full";
  dailyDone: boolean;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

// ---------------------------------------------------------------------------
// Hook: useCountdown — counts down to midnight local time
// ---------------------------------------------------------------------------

function useCountdown(): TimeLeft {
  const calcTimeLeft = useCallback((): TimeLeft => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight.getTime() - now.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalSeconds,
    };
  }, []);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft);

  useEffect(() => {
    // Sync immediately on mount
    setTimeLeft(calcTimeLeft());

    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft());
    }, 1000);

    return () => clearInterval(id);
  }, [calcTimeLeft]);

  return timeLeft;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Returns true when localStorage `bq_last_activity` is >18 h ago */
function useIsInactive(): boolean {
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bq_last_activity");
      if (!raw) {
        setInactive(false);
        return;
      }
      const last = new Date(raw).getTime();
      const hoursAgo = (Date.now() - last) / (1000 * 60 * 60);
      setInactive(hoursAgo > 18);
    } catch {
      setInactive(false);
    }
  }, []);

  return inactive;
}

// ---------------------------------------------------------------------------
// Compact Variant
// ---------------------------------------------------------------------------

function CompactCountdown({
  timeLeft,
  dailyDone,
}: {
  timeLeft: TimeLeft;
  dailyDone: boolean;
}) {
  const timeStr =
    timeLeft.hours > 0
      ? `${timeLeft.hours}h ${pad(timeLeft.minutes)}m`
      : `${timeLeft.minutes}m ${pad(timeLeft.seconds)}s`;

  if (dailyDone) {
    return (
      <span className="text-sm text-emerald-600 dark:text-emerald-400">
        Completata! Nuova sfida tra {timeStr}
      </span>
    );
  }

  return (
    <span className="text-sm text-[#003DA5]/70 dark:text-blue-300/70">
      La sfida scade tra {timeStr}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Full Variant
// ---------------------------------------------------------------------------

function FullCountdown({
  timeLeft,
  dailyDone,
  isInactive,
}: {
  timeLeft: TimeLeft;
  dailyDone: boolean;
  isInactive: boolean;
}) {
  // Urgency when <1 hour remains and challenge not completed
  const urgent = !dailyDone && timeLeft.totalSeconds < 3600;

  const borderColor = dailyDone
    ? "border-emerald-400 dark:border-emerald-500"
    : isInactive
      ? "border-amber-400 dark:border-amber-500"
      : urgent
        ? "border-red-400 dark:border-red-500"
        : "border-[#003DA5]/20 dark:border-blue-400/30";

  const bgColor = dailyDone
    ? "bg-emerald-50 dark:bg-emerald-950/40"
    : "bg-[#F7F5F0] dark:bg-neutral-900";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`
        rounded-xl border-2 ${borderColor} ${bgColor}
        px-4 py-3 w-full max-w-sm mx-auto
        ${isInactive && !dailyDone ? "animate-pulse" : ""}
      `}
    >
      {/* Label */}
      <p
        className={`text-xs font-medium text-center mb-2 ${
          dailyDone
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-[#003DA5]/60 dark:text-blue-300/60"
        }`}
      >
        {dailyDone ? "Completata! Nuova sfida tra" : "La sfida scade tra"}
      </p>

      {/* HH:MM:SS digits */}
      <div className="flex items-center justify-center gap-1.5">
        <TimeDigit value={pad(timeLeft.hours)} label="ore" urgent={urgent} dailyDone={dailyDone} />
        <Separator />
        <TimeDigit value={pad(timeLeft.minutes)} label="min" urgent={urgent} dailyDone={dailyDone} />
        <Separator />
        <TimeDigit value={pad(timeLeft.seconds)} label="sec" urgent={urgent} dailyDone={dailyDone} />
      </div>

      {/* Inactive nudge */}
      <AnimatePresence>
        {isInactive && !dailyDone && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2"
          >
            Non ti vediamo da un po&apos; — torna a giocare!
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Digit box
// ---------------------------------------------------------------------------

function TimeDigit({
  value,
  label,
  urgent,
  dailyDone,
}: {
  value: string;
  label: string;
  urgent: boolean;
  dailyDone: boolean;
}) {
  const textColor = dailyDone
    ? "text-emerald-700 dark:text-emerald-300"
    : urgent
      ? "text-red-600 dark:text-red-400"
      : "text-[#003DA5] dark:text-blue-200";

  return (
    <div className="flex flex-col items-center">
      <motion.span
        key={value}
        initial={{ opacity: 0.6, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`
          text-2xl font-bold tabular-nums leading-none
          ${textColor}
        `}
      >
        {value}
      </motion.span>
      <span className="text-[10px] mt-0.5 text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Colon separator
// ---------------------------------------------------------------------------

function Separator() {
  return (
    <span className="text-lg font-bold text-neutral-300 dark:text-neutral-600 -mt-2 select-none">
      :
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DailyCountdown({ variant, dailyDone }: DailyCountdownProps) {
  const timeLeft = useCountdown();
  const isInactive = useIsInactive();

  if (variant === "compact") {
    return <CompactCountdown timeLeft={timeLeft} dailyDone={dailyDone} />;
  }

  return (
    <FullCountdown
      timeLeft={timeLeft}
      dailyDone={dailyDone}
      isInactive={isInactive}
    />
  );
}

export default DailyCountdown;
