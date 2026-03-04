"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface SecretAchievement {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface SecretAchievementPopupProps {
  achievement: SecretAchievement | null;
  onClose: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

const PARTICLE_COLORS = ["#FFC107", "#FFB300", "#FFA000", "#FF6F00", "#FFEB3B"];

export default function SecretAchievementPopup({
  achievement,
  onClose,
}: SecretAchievementPopupProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (achievement) {
      // Generate random particles
      const newParticles: Particle[] = [];
      const particleCount = 18;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 120 + Math.random() * 80;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        newParticles.push({
          id: i,
          x,
          y,
          size: 8 + Math.random() * 12,
          color:
            PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          delay: Math.random() * 0.1,
        });
      }

      setParticles(newParticles);

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}
          onClick={onClose}
        >
          <div className="relative">
            {/* Particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: particle.x,
                  y: particle.y,
                  opacity: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 1.2,
                  delay: particle.delay,
                  ease: "easeOut",
                }}
                className="absolute top-1/2 left-1/2 rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                }}
              />
            ))}

            {/* Achievement Card */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="card-clean rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                background:
                  "linear-gradient(135deg, rgba(0, 61, 165, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
                border: "2px solid rgba(255, 193, 7, 0.5)",
              }}
            >
              {/* Pulsing glow background */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-2xl"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(255, 193, 7, 0.3) 0%, transparent 70%)",
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Content */}
              <div className="relative z-10 space-y-6">
                {/* Header */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-bold tracking-wider uppercase"
                  style={{
                    background:
                      "linear-gradient(90deg, #FFC107 0%, #FFB300 50%, #FFC107 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Achievement Segreto!
                </motion.div>

                {/* Icon with glow */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="relative mx-auto w-32 h-32 flex items-center justify-center"
                >
                  {/* Pulsing ring */}
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #FFC107 0%, #FF6F00 100%)",
                      filter: "blur(8px)",
                    }}
                  />

                  {/* Icon container */}
                  <div
                    className="relative w-24 h-24 rounded-full flex items-center justify-center text-6xl"
                    style={{
                      background:
                        "linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)",
                      boxShadow: "0 0 30px rgba(255, 193, 7, 0.6)",
                    }}
                  >
                    {achievement.icon}
                  </div>
                </motion.div>

                {/* Achievement name */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold text-white"
                >
                  {achievement.name}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/70 text-lg"
                >
                  {achievement.description}
                </motion.p>

                {/* Dismiss hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-white/50 text-sm"
                >
                  Clicca ovunque per chiudere
                </motion.p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
