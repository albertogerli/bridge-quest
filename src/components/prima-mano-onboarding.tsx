"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  Play,
  Scissors,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

const STORAGE_KEY = "bq_onboarded";
const DEFAULT_PROFILE = "adulto";
const DEDICATED_VIDEO_PATH = "/videos/prima-mano-intro.mp4";
const FALLBACK_VIDEO_PATH = "/videos/maestro-fiori-intro.mp4";

type StepId = "intro" | "presa" | "ruoli" | "atout" | "video" | "ready";

const STEPS: Array<{
  id: StepId;
  kicker: string;
  title: string;
  body: string;
}> = [
  {
    id: "intro",
    kicker: "Prima Mano",
    title: "Capisci il tavolo, poi giochi.",
    body:
      "Tre minuti, zero gergo inutile. Ti facciamo entrare al tavolo con il minimo indispensabile per provare una mano senza ansia da corso.",
  },
  {
    id: "presa",
    kicker: "Una Presa",
    title: "Qui conta una sola cosa.",
    body:
      "Se puoi, rispondi al seme. Tra le carte dello stesso seme vince quella piu alta. Il resto viene dopo.",
  },
  {
    id: "ruoli",
    kicker: "I Ruoli",
    title: "Al tavolo siete in tre, non in quattro.",
    body:
      "Il giocante decide. Il morto mostra le carte. I difensori provano a battere il contratto. Sapere questo basta gia per orientarsi.",
  },
  {
    id: "atout",
    kicker: "Atout",
    title: "Il taglio non e magia.",
    body:
      "Se non hai il seme giocato, puoi tagliare con l'atout oppure scartare. Se hai ancora il seme, devi rispondere.",
  },
  {
    id: "video",
    kicker: "Benvenuto",
    title: "Un volto, poi la pratica.",
    body:
      "Se vuoi, ascolta un minuto di introduzione. Non sostituisce il gioco: serve solo a farti entrare nell'atmosfera giusta.",
  },
  {
    id: "ready",
    kicker: "Sei Dentro",
    title: "Adesso vai al tavolo.",
    body:
      "Non hai studiato tutto il bridge. Hai studiato abbastanza per iniziare. La prima mano ti insegnera piu di una spiegazione lunga.",
  },
];

function persistOnboarding() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
    if (!localStorage.getItem("bq_profile")) {
      localStorage.setItem("bq_profile", DEFAULT_PROFILE);
    }
  } catch {}
}

function StepShell({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-[#d8d0c0] bg-[#fffaf0] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      <div className="mb-4 inline-flex rounded-full border border-[#c8a44e]/30 bg-[#c8a44e]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6b16]">
        {kicker}
      </div>
      <h1 className="max-w-[14ch] text-3xl font-bold leading-[1.05] text-[#12305f] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#44536d]">
        {body}
      </p>
      {children}
    </div>
  );
}

function ChoiceCard({
  label,
  description,
  selected,
  correct,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  correct?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[24px] border p-4 text-left transition-all ${
        selected
          ? correct
            ? "border-emerald-300 bg-emerald-50 shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
            : "border-rose-300 bg-rose-50 shadow-[0_10px_30px_rgba(244,63,94,0.12)]"
          : "border-[#d8d0c0] bg-white hover:border-[#003DA5]/30 hover:bg-[#f7f9ff]"
      }`}
    >
      <p className="text-sm font-bold text-[#12305f]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#5c677d]">{description}</p>
    </button>
  );
}

export function PrimaManoOnboarding({
  onDismiss,
  returnHref,
}: {
  onDismiss?: () => void;
  returnHref?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [trickChoice, setTrickChoice] = useState<string | null>(null);
  const [trumpChoice, setTrumpChoice] = useState<string | null>(null);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoSrc, setVideoSrc] = useState(DEDICATED_VIDEO_PATH);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const canContinue = useMemo(() => {
    if (current.id === "presa") return trickChoice !== null;
    if (current.id === "atout") return trumpChoice !== null;
    return true;
  }, [current.id, trickChoice, trumpChoice]);

  const close = () => {
    persistOnboarding();
    onDismiss?.();
  };

  const handleNext = () => {
    if (!canContinue) return;
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleStartPlaying = () => {
    close();
    router.push("/gioca/sfida");
  };

  const handleReturn = () => {
    close();
    if (returnHref) {
      router.push(returnHref);
    }
  };

  const toggleVideoAudio = () => {
    const nextMuted = !videoMuted;
    setVideoMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.currentTime = 0;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f7f1e5_42%,_#eee2c8_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { suit: "club", top: "12%", left: "8%" },
          { suit: "diamond", top: "22%", right: "10%" },
          { suit: "heart", bottom: "22%", left: "9%" },
          { suit: "spade", bottom: "14%", right: "12%" },
        ].map((item, index) => {
          const { suit, ...position } = item;

          return (
            <motion.div
              key={`${suit}-${index}`}
              className="absolute opacity-[0.08]"
              style={position}
              animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
            >
              <SuitSymbol suit={suit as "club" | "diamond" | "heart" | "spade"} size="xl" />
            </motion.div>
          );
        })}
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[36px] border border-[#d7d0bf] bg-[#0f2f5f] p-6 text-white shadow-[0_30px_80px_rgba(15,47,95,0.28)] sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/55">
                  FIGB Bridge LAB
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Un ingresso morbido al tavolo, ispirato alla logica della lezione introduttiva FIGB.
                </p>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white/80">
                {step + 1}/{STEPS.length}
              </div>
            </div>

            <div className="mt-8 h-2 rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#c8a44e] to-[#f0d37a]"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <div className="mt-8 grid gap-3">
              {STEPS.map((item, index) => {
                const active = index === step;
                const done = index < step;
                return (
                  <div
                    key={item.id}
                    className={`rounded-[24px] border px-4 py-3 transition-all ${
                      active
                        ? "border-white/15 bg-white/10"
                        : done
                          ? "border-[#c8a44e]/25 bg-[#c8a44e]/10"
                          : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                      active ? "text-white/70" : done ? "text-[#f0d37a]" : "text-white/35"
                    }`}>
                      {item.kicker}
                    </p>
                    <p className={`mt-1 text-sm font-semibold ${
                      active ? "text-white" : done ? "text-white/90" : "text-white/45"
                    }`}>
                      {item.title}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Obiettivo
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                Portarti alla prima mano senza trasformare l&apos;ingresso in una lezione.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Questo flusso non ti spiega tutto. Ti spiega solo quello che serve per non sentirti perso al primo tavolo.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <StepShell kicker={current.kicker} title={current.title} body={current.body}>
                  {current.id === "intro" && (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-[#d8d0c0] bg-white p-4">
                        <p className="text-sm font-bold text-[#12305f]">Cosa NON facciamo</p>
                        <p className="mt-2 text-sm leading-6 text-[#5c677d]">
                          Niente punti onori, niente convenzioni, niente teoria pesante.
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-[#d8d0c0] bg-white p-4">
                        <p className="text-sm font-bold text-[#12305f]">Cosa facciamo</p>
                        <p className="mt-2 text-sm leading-6 text-[#5c677d]">
                          Una presa, i ruoli, l&apos;idea di atout e poi una mano vera.
                        </p>
                      </div>
                    </div>
                  )}

                  {current.id === "presa" && (
                    <div className="mt-6 space-y-4">
                      <div className="rounded-[28px] border border-[#d8d0c0] bg-white p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8]">
                          Picche comandano
                        </p>
                        <div className="mt-4 grid grid-cols-4 gap-3">
                          {[
                            { label: "Q", suit: "spade" },
                            { label: "A", suit: "spade" },
                            { label: "7", suit: "spade" },
                            { label: "10", suit: "spade" },
                          ].map((card) => (
                            <div
                              key={`${card.label}-${card.suit}`}
                              className="rounded-[22px] border border-[#d8d0c0] bg-[#fffaf0] px-3 py-4 text-center shadow-sm"
                            >
                              <p className="text-2xl font-black text-[#12305f]">{card.label}</p>
                              <div className="mt-2 flex justify-center">
                                <SuitSymbol suit={card.suit as "spade"} size="md" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <ChoiceCard
                          label="Asso di picche"
                          description="E la carta piu alta del seme giocato."
                          selected={trickChoice === "ace"}
                          correct
                          onClick={() => setTrickChoice("ace")}
                        />
                        <ChoiceCard
                          label="Donna di picche"
                          description="E alta, ma non abbastanza."
                          selected={trickChoice === "queen"}
                          correct={false}
                          onClick={() => setTrickChoice("queen")}
                        />
                      </div>

                      {trickChoice && (
                        <div className={`rounded-[24px] border px-4 py-3 text-sm leading-6 ${
                          trickChoice === "ace"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-rose-300 bg-rose-50 text-rose-800"
                        }`}>
                          {trickChoice === "ace"
                            ? "Giusto. La presa la vince la carta piu alta del seme giocato."
                            : "Quasi. Qui vince l'Asso di picche, perche nel seme giocato e la carta piu alta."}
                        </div>
                      )}
                    </div>
                  )}

                  {current.id === "ruoli" && (
                    <div className="mt-6 grid gap-3">
                      {[
                        {
                          icon: <Play className="h-5 w-5 text-[#003DA5]" />,
                          title: "Giocante",
                          text: "Decide il piano e chiama anche le carte del morto.",
                        },
                        {
                          icon: <Shield className="h-5 w-5 text-[#8f6b16]" />,
                          title: "Morto",
                          text: "Mostra le carte sul tavolo. Non decide al posto del compagno.",
                        },
                        {
                          icon: <Scissors className="h-5 w-5 text-[#0f766e]" />,
                          title: "Difensori",
                          text: "Provano a battere il contratto giocando insieme.",
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[24px] border border-[#d8d0c0] bg-white p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f7fb]">
                              {item.icon}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#12305f]">{item.title}</p>
                              <p className="mt-1 text-sm leading-6 text-[#5c677d]">{item.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {current.id === "atout" && (
                    <div className="mt-6 space-y-4">
                      <div className="rounded-[28px] border border-[#d8d0c0] bg-white p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8]">
                          Scenario rapido
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[#44536d]">
                          Cuori e il seme giocato. Tu non hai cuori, ma hai due picche e un atout di quadri. Cosa puoi fare?
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <ChoiceCard
                          label="Devo per forza tagliare"
                          description="No: il taglio e una possibilita, non un obbligo."
                          selected={trumpChoice === "force"}
                          correct={false}
                          onClick={() => setTrumpChoice("force")}
                        />
                        <ChoiceCard
                          label="Posso tagliare con quadri oppure scartare"
                          description="Si: se non hai il seme giocato, puoi usare l'atout o buttare una carta."
                          selected={trumpChoice === "optional"}
                          correct
                          onClick={() => setTrumpChoice("optional")}
                        />
                      </div>

                      {trumpChoice && (
                        <div className={`rounded-[24px] border px-4 py-3 text-sm leading-6 ${
                          trumpChoice === "optional"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-rose-300 bg-rose-50 text-rose-800"
                        }`}>
                          {trumpChoice === "optional"
                            ? "Esatto. L'atout serve per tagliare solo quando non puoi rispondere al seme."
                            : "No. Se non hai il seme giocato puoi scegliere: tagliare con l'atout oppure scartare."}
                        </div>
                      )}
                    </div>
                  )}

                  {current.id === "video" && (
                    <div className="mt-6 rounded-[28px] border border-[#d8d0c0] bg-[#12305f] p-4 text-white shadow-[0_18px_40px_rgba(18,48,95,0.18)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
                          <Clapperboard className="h-4 w-4" />
                          Introduzione video
                        </div>
                        <button
                          onClick={toggleVideoAudio}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15"
                          aria-label={videoMuted ? "Attiva audio" : "Disattiva audio"}
                        >
                          {videoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
                        <video
                          ref={videoRef}
                          src={videoSrc}
                          autoPlay
                          loop
                          playsInline
                          muted={videoMuted}
                          onError={() => {
                            if (videoSrc !== FALLBACK_VIDEO_PATH) {
                              setVideoSrc(FALLBACK_VIDEO_PATH);
                            }
                          }}
                          className="aspect-[16/10] w-full object-cover"
                        />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/70">
                        Slot pronto anche per un clip HeyGen dedicato a `Prima Mano`.
                      </p>
                    </div>
                  )}

                  {current.id === "ready" && (
                    <div className="mt-6 space-y-3">
                      {[
                        "Sai come si vince una presa.",
                        "Sai chi decide tra giocante, morto e difensori.",
                        "Sai quando l'atout puo tagliare.",
                      ].map((line) => (
                        <div
                          key={line}
                          className="flex items-center gap-3 rounded-[22px] border border-[#d8d0c0] bg-white px-4 py-3"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f0f6ff]">
                            <Sparkles className="h-4 w-4 text-[#003DA5]" />
                          </div>
                          <p className="text-sm font-medium text-[#12305f]">{line}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </StepShell>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              {isLast ? (
                <>
                  <Button
                    onClick={handleStartPlaying}
                    size="lg"
                    className="h-14 flex-1 rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a]"
                  >
                    Gioca la prima mano
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleReturn}
                    size="lg"
                    variant="outline"
                    className="h-14 rounded-[22px] border-[#d8d0c0] bg-white px-6 text-base font-semibold text-[#12305f]"
                  >
                    Torna alla home
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleNext}
                    size="lg"
                    disabled={!canContinue}
                    className="h-14 flex-1 rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a] disabled:bg-[#9eb8e5]"
                  >
                    Continua
                  </Button>
                  <button
                    onClick={handleReturn}
                    className="h-14 rounded-[22px] border border-[#d8d0c0] bg-white px-5 text-sm font-semibold text-[#5c677d] transition-colors hover:text-[#12305f]"
                  >
                    Salta
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[#6b7280]">
              <BookOpen className="h-4 w-4 text-[#8f6b16]" />
              Ispirato alla logica FIGB dell&apos;ingresso morbido al tavolo, senza presentarlo come lezione.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
