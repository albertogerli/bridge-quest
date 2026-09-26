"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { creaMaglia, MASSIMO_AL_TAVOLO, type Riquadro, type Segnale } from "@/lib/video-tavolo";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * La telecamera al tavolo.
 *
 * SI ACCENDE, NON SI TROVA ACCESA. Finché non si tocca il pulsante non viene
 * chiesto niente al browser e la telecamera non si apre: è la differenza fra
 * offrire una cosa e imporla, e con dei principianti over 60 — e nei corsi
 * giovani dei minorenni — è la differenza che conta.
 *
 * SI SPEGNE DA SÉ QUANDO SI ESCE. Chiudendo la pagina i flussi si fermano e le
 * connessioni si chiudono: nessuna spia che resta accesa dopo, che è la cosa
 * che fa disinstallare un'applicazione.
 *
 * QUELLO CHE NON RIESCE SI DICE. Senza un server TURN certe reti non lasciano
 * passare la connessione diretta. Succede, e quando succede si legge «non
 * riesco a collegarmi» con il nome: un riquadro nero e basta sembra un difetto
 * nostro, e chi lo vede smette di fidarsi anche del resto.
 */
export function VideoTavolo({
  tavoloId,
  io,
  nomi,
}: {
  tavoloId: string;
  io: string;
  nomi: Map<string, string>;
}) {
  const t = useT();
  const [acceso, setAcceso] = useState(false);
  const [microfono, setMicrofono] = useState(true);
  const [telecamera, setTelecamera] = useState(true);
  const [riquadri, setRiquadri] = useState<Riquadro[]>([]);
  const [problema, setProblema] = useState<string | null>(null);
  const mioVideo = useRef<HTMLVideoElement>(null);
  const mioFlusso = useRef<MediaStream | null>(null);
  const maglia = useRef<ReturnType<typeof creaMaglia> | null>(null);

  const spegni = useCallback(() => {
    maglia.current?.chiudi();
    maglia.current = null;
    mioFlusso.current = null;
    setRiquadri([]);
    setAcceso(false);
  }, []);

  // Uscendo dalla pagina non resta niente acceso, nemmeno se si chiude la
  // scheda di colpo: è il `return` dell'effetto a garantirlo.
  useEffect(() => () => { maglia.current?.chiudi(); }, []);

  async function accendi() {
    setProblema(null);
    let flusso: MediaStream;
    try {
      flusso = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      // Il permesso negato NON è un difetto: è una persona che ha detto no.
      const nome = (err as { name?: string })?.name;
      if (nome === "NotAllowedError") setProblema(t("Hai negato l'accesso alla telecamera. Puoi cambiarlo dalle impostazioni del browser."));
      else if (nome === "NotFoundError") setProblema(t("Non trovo una telecamera su questo dispositivo."));
      else { setProblema(t("Non riesco ad accendere la telecamera.")); reportError("video-tavolo:accendi", err); }
      return;
    }

    mioFlusso.current = flusso;
    if (mioVideo.current) mioVideo.current.srcObject = flusso;
    setAcceso(true);

    const supabase = createClient();
    const canale = supabase.channel(`video-tavolo-${tavoloId}`, {
      config: { presence: { key: io } },
    });

    const m = creaMaglia({ io, canale, mioFlusso: flusso, onRiquadri: setRiquadri });
    maglia.current = m;

    canale
      .on("broadcast", { event: "video" }, ({ payload }) => {
        void m.ricevi(payload as Segnale);
      })
      .on("presence", { event: "sync" }, () => {
        m.presenti(Object.keys(canale.presenceState()));
      })
      .subscribe((stato) => {
        if (stato === "SUBSCRIBED") void canale.track({ da: io });
      });
  }

  function commuta(quale: "video" | "audio") {
    const f = mioFlusso.current;
    if (!f) return;
    const tracce = quale === "video" ? f.getVideoTracks() : f.getAudioTracks();
    const nuovo = !tracce[0]?.enabled;
    for (const tr of tracce) tr.enabled = nuovo;
    if (quale === "video") setTelecamera(nuovo); else setMicrofono(nuovo);
  }

  if (!acceso) {
    return (
      <div className="mb-4 rounded-xl border border-border bg-card p-4 text-center">
        <button
          onClick={() => void accendi()}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
        >
          <Video className="h-5 w-5" aria-hidden="true" />
          {t("Accendi la telecamera")}
        </button>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Ti vedono solo le persone sedute a questo tavolo. Niente viene registrato.")}
        </p>
        {problema && <p className="mt-2 text-sm text-destructive">{problema}</p>}
      </div>
    );
  }

  const nonRiescono = riquadri.filter((r) => r.stato === "non-riesco");

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Riquadrino
          titolo={t("Tu")}
          flusso={null}
          rif={mioVideo}
          spento={!telecamera}
          t={t}
        />
        {riquadri
          .filter((r) => r.stato !== "uscito")
          .slice(0, MASSIMO_AL_TAVOLO - 1)
          .map((r) => (
            <Riquadrino
              key={r.id}
              titolo={nomi.get(r.id) ?? t("Un compagno")}
              flusso={r.flusso}
              spento={false}
              inCorso={r.stato === "in-corso"}
              nonRiesce={r.stato === "non-riesco"}
              t={t}
            />
          ))}
      </div>

      {nonRiescono.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Non riesco a collegarmi con")}{" "}
          {nonRiescono.map((r) => nomi.get(r.id) ?? t("un compagno")).join(", ")}.{" "}
          {t("Di solito è la rete di uno dei due.")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => commuta("video")}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm"
        >
          {telecamera ? <Video className="h-4 w-4" aria-hidden="true" /> : <VideoOff className="h-4 w-4" aria-hidden="true" />}
          {telecamera ? t("Spegni il video") : t("Riaccendi il video")}
        </button>
        <button
          onClick={() => commuta("audio")}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm"
        >
          {microfono ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}
          {microfono ? t("Chiudi il microfono") : t("Riapri il microfono")}
        </button>
        <button
          onClick={spegni}
          className="min-h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground"
        >
          {t("Esci dal video")}
        </button>
      </div>
    </div>
  );
}

function Riquadrino({
  titolo, flusso, rif, spento, inCorso, nonRiesce, t,
}: {
  titolo: string;
  flusso: MediaStream | null;
  rif?: React.RefObject<HTMLVideoElement | null>;
  spento: boolean;
  inCorso?: boolean;
  nonRiesce?: boolean;
  t: (s: string) => string;
}) {
  const mio = useRef<HTMLVideoElement>(null);
  const video = rif ?? mio;
  useEffect(() => {
    if (flusso && video.current) video.current.srcObject = flusso;
  }, [flusso, video]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: "4 / 3" }}>
      <video
        ref={video}
        autoPlay
        playsInline
        muted={!!rif}
        className={`h-full w-full object-cover ${spento ? "invisible" : ""}`}
      />
      {(spento || inCorso || nonRiesce) && (
        <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-muted-foreground">
          {nonRiesce ? t("non collegato") : inCorso ? t("mi collego…") : t("video spento")}
        </div>
      )}
      <span className="absolute bottom-0 left-0 right-0 truncate bg-black/55 px-2 py-1 text-xs font-medium text-white">
        {titolo}
      </span>
    </div>
  );
}
