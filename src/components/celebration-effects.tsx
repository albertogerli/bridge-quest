/**
 * CelebrationEffects - Effetti visivi per celebrazioni
 */

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface ConfettiBurstProps {
  trigger: boolean;
  colors?: string[];
  count?: number;
}

export function ConfettiBurst({
  trigger,
  colors = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'],
  count = 30
}: ConfettiBurstProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {Array.from({ length: count }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
          const velocity = 150 + Math.random() * 150;
          const size = 4 + Math.random() * 6;
          const color = colors[Math.floor(Math.random() * colors.length)];
          const rotation = Math.random() * 360;
          const spinSpeed = (Math.random() - 0.5) * 720;

          return (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 rounded"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
              }}
              initial={{
                x: 0,
                y: 0,
                rotate: rotation,
                opacity: 1,
              }}
              animate={{
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity + 200, // gravity
                rotate: rotation + spinSpeed,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface StarBurstProps {
  trigger: boolean;
}

export function StarBurst({ trigger }: StarBurstProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!show) return null;

  const starCount = 8 + Math.floor(Math.random() * 5);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {Array.from({ length: starCount }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / starCount;
          const velocity = 100 + Math.random() * 80;
          const size = 8 + Math.random() * 8;

          return (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{
                width: size,
                height: size,
              }}
              initial={{
                x: 0,
                y: 0,
                rotate: 0,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                rotate: 360,
                opacity: 0,
                scale: 0.2,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-amber-400"
                style={{ width: '100%', height: '100%' }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface ScreenFlashProps {
  trigger: boolean;
  color?: string;
}

export function ScreenFlash({ trigger, color = 'rgb(251, 191, 36)' }: ScreenFlashProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 400);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[9998]"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  );
}

interface CelebrationComboProps {
  trigger: boolean;
  type: 'small' | 'medium' | 'epic';
}

export function CelebrationCombo({ trigger, type }: CelebrationComboProps) {
  if (type === 'small') {
    return <ScreenFlash trigger={trigger} />;
  }

  if (type === 'medium') {
    return (
      <>
        <ScreenFlash trigger={trigger} />
        <ConfettiBurst trigger={trigger} count={20} />
      </>
    );
  }

  // epic
  return (
    <>
      <ScreenFlash trigger={trigger} />
      <ConfettiBurst trigger={trigger} count={40} />
      <StarBurst trigger={trigger} />
    </>
  );
}
