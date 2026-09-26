import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * La telecamera al tavolo: quattro persone che si vedono mentre giocano.
 *
 * ----------------------------------------------------------------------------
 * COME FUNZIONA, E PERCHÉ COSÌ
 * ----------------------------------------------------------------------------
 *
 * I FLUSSI NON PASSANO DA NOI. Le connessioni sono dirette fra i browser
 * (WebRTC): il video di un allievo va agli altri tre e basta. Non tocca i
 * nostri server, non finisce su Supabase, non viene registrato da nessuna
 * parte. È la ragione per cui questa funzione si può avere senza aprire un
 * capitolo sulla conservazione di immagini di minorenni.
 *
 * L'APPUNTAMENTO SI DÀ SU SUPABASE. Due browser che non si conoscono devono
 * scambiarsi un paio di messaggi per trovarsi — offerta, risposta, indirizzi.
 * Quei messaggi passano dal canale Realtime che il tavolo ha già: nessun
 * servizio nuovo, nessuna dipendenza nuova, nessuna chiave da custodire.
 *
 * QUATTRO PERSONE, NON VENTI. Ognuno si collega a ognuno: con quattro sono tre
 * connessioni a testa, dodici in tutto, che un telefono regge. Con venti
 * sarebbero centonovanta e non si reggerebbe — per quello questa cosa vive al
 * TAVOLO e non nella classe. Il limite è scritto in `MASSIMO_AL_TAVOLO` e
 * rifiutato, non sperato.
 *
 * SENZA TURN, E DETTO. Si usano solo server STUN pubblici, che bastano quasi
 * sempre ma non dietro certe reti aziendali o mobili severe. In quel caso la
 * connessione non si stabilisce: `onStato` lo dice, e chi guarda legge «non
 * riesco a collegarmi con Maria» invece di fissare un riquadro nero. Aggiungere
 * un TURN vuol dire pagare la banda di ogni flusso, e si decide se serve
 * davvero dopo aver visto quante volte fallisce.
 */

/** Oltre questo non si va: la maglia completa cresce col quadrato delle persone. */
export const MASSIMO_AL_TAVOLO = 6;

const STUN = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export type Segnale =
  | { tipo: "offerta"; da: string; a: string; sdp: string }
  | { tipo: "risposta"; da: string; a: string; sdp: string }
  | { tipo: "ghiaccio"; da: string; a: string; candidato: string };

export type StatoPeer = "in-corso" | "collegato" | "non-riesco" | "uscito";

/**
 * Chi dei due fa la prima mossa.
 *
 * SERVE UNA REGOLA, non una convenzione. Se entrambi mandano un'offerta nello
 * stesso istante le due si annullano a vicenda — è il classico «glare», e non
 * si vede in prova perché in prova non si entra mai davvero insieme. Confrontare
 * gli identificativi dà la stessa risposta ai due lati senza doversi accordare.
 */
export function offreLui(mio: string, altro: string): boolean {
  return mio < altro;
}

export interface Riquadro {
  id: string;
  flusso: MediaStream | null;
  stato: StatoPeer;
}

/**
 * Tiene i collegamenti con gli altri al tavolo.
 *
 * Non è un componente React apposta: la logica di chi-è-collegato-con-chi è
 * indipendente dal disegno, e messa qui si può leggere e correggere senza
 * aprire una pagina.
 */
export function creaMaglia(opzioni: {
  io: string;
  canale: RealtimeChannel;
  mioFlusso: MediaStream;
  onRiquadri: (riquadri: Riquadro[]) => void;
}) {
  const { io, canale, mioFlusso, onRiquadri } = opzioni;
  const peer = new Map<string, RTCPeerConnection>();
  const flussi = new Map<string, MediaStream>();
  const stati = new Map<string, StatoPeer>();
  let chiuso = false;

  const avvisa = () =>
    onRiquadri(
      [...stati.keys()].sort().map((id) => ({
        id,
        flusso: flussi.get(id) ?? null,
        stato: stati.get(id) ?? "in-corso",
      })),
    );

  const manda = (s: Segnale) => {
    void canale.send({ type: "broadcast", event: "video", payload: s });
  };

  function collega(altro: string): RTCPeerConnection {
    const esistente = peer.get(altro);
    if (esistente) return esistente;

    const pc = new RTCPeerConnection({ iceServers: STUN });
    peer.set(altro, pc);
    stati.set(altro, "in-corso");

    for (const t of mioFlusso.getTracks()) pc.addTrack(t, mioFlusso);

    pc.ontrack = (e) => {
      flussi.set(altro, e.streams[0]);
      avvisa();
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) manda({ tipo: "ghiaccio", da: io, a: altro, candidato: JSON.stringify(e.candidate) });
    };
    pc.onconnectionstatechange = () => {
      // `failed` è la fine della strada: senza un TURN non c'è un'altra via, e
      // dirlo è meglio che lasciare un riquadro nero che sembra un difetto.
      if (pc.connectionState === "connected") stati.set(altro, "collegato");
      else if (pc.connectionState === "failed") stati.set(altro, "non-riesco");
      else if (pc.connectionState === "closed") stati.set(altro, "uscito");
      avvisa();
    };
    avvisa();
    return pc;
  }

  async function offri(altro: string) {
    const pc = collega(altro);
    const offerta = await pc.createOffer();
    await pc.setLocalDescription(offerta);
    manda({ tipo: "offerta", da: io, a: altro, sdp: JSON.stringify(pc.localDescription) });
  }

  async function ricevi(s: Segnale) {
    if (s.a !== io || s.da === io) return;
    const pc = collega(s.da);
    if (s.tipo === "offerta") {
      await pc.setRemoteDescription(JSON.parse(s.sdp) as RTCSessionDescriptionInit);
      const risposta = await pc.createAnswer();
      await pc.setLocalDescription(risposta);
      manda({ tipo: "risposta", da: io, a: s.da, sdp: JSON.stringify(pc.localDescription) });
    } else if (s.tipo === "risposta") {
      await pc.setRemoteDescription(JSON.parse(s.sdp) as RTCSessionDescriptionInit);
    } else {
      // Un candidato che arriva prima della descrizione remota va scartato, non
      // fatto esplodere: ne arrivano altri, e la connessione si fa lo stesso.
      try { await pc.addIceCandidate(JSON.parse(s.candidato) as RTCIceCandidateInit); } catch { /* ignorato */ }
    }
  }

  function presenti(ids: string[]) {
    if (chiuso) return;
    const altri = ids.filter((x) => x !== io).slice(0, MASSIMO_AL_TAVOLO - 1);
    for (const a of altri) if (!peer.has(a) && offreLui(io, a)) void offri(a);
    for (const [id, pc] of peer) {
      if (!altri.includes(id)) { pc.close(); peer.delete(id); flussi.delete(id); stati.delete(id); }
    }
    avvisa();
  }

  function chiudi() {
    chiuso = true;
    for (const pc of peer.values()) pc.close();
    peer.clear(); flussi.clear(); stati.clear();
    for (const t of mioFlusso.getTracks()) t.stop();
    avvisa();
  }

  return { presenti, ricevi, chiudi };
}
