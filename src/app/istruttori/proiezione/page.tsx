"use client";

import { useEffect, useRef, useState } from "react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { PannelloDivisioni } from "@/components/bridge/pannello-divisioni";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import {
  apriCanale,
  spedisci,
  type MessaggioProiezione,
  type StatoProiezione,
} from "@/lib/proiezione";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const ORDINE_RANGHI = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const NOME: Record<Position, string> = {
  north: "Nord",
  east: "Est",
  south: "Sud",
  west: "Ovest",
};

/**
 * La vista da proiettare in aula.
 *
 * NON HA COMANDI, ed è il punto: tutto si guida dalla finestra dell'insegnante.
 * Chi sta davanti alla classe non deve toccare quella proiettata, e non deve
 * nemmeno potersi sbagliare toccandola.
 *
 * NON HA NAVIGAZIONE E NON HA LOGIN. Sta fuori dalla struttura del sito — è in
 * `FULL_SCREEN_ROUTES` — perché una barra di menù su un proiettore è spazio
 * rubato e, se qualcuno la sfiora, è anche un modo di uscire dalla lezione.
 * L'autenticazione non serve: qui non arriva niente dal database, arriva solo
 * quello che la finestra accanto ha deciso di mandare.
 *
 * CARATTERI GRANDI E CONTRASTO ALTO. Le carte sono in `text-5xl`: la misura
 * viene dal dover essere leggibili dall'ultima fila di una sala di circolo,
 * non dal design del resto del sito.
 *
 * SE IL COMANDO SPARISCE, RESTA L'ULTIMO STATO BUONO. Non si sbianca mai: una
 * schermata vuota davanti a una classe è peggio di una schermata vecchia. Un
 * puntino discreto in un angolo dice che il collegamento non c'è più, e lo
 * vede l'insegnante che sa cosa vuol dire — non la classe, che continua a
 * guardare la mano.
 */
export default function ProiezionePage() {
  const [stato, setStato] = useState<StatoProiezione | null>(null);
  const [vivo, setVivo] = useState(true);
  const ultimoBattito = useRef<number>(0);

  useEffect(() => {
    const canale = apriCanale();
    if (!canale) return;

    canale.onmessage = (e: MessageEvent<MessaggioProiezione>) => {
      if (e.data?.tipo === "stato") {
        setStato(e.data.stato);
        setVivo(true);
        ultimoBattito.current = Date.now();
      }
      if (e.data?.tipo === "chiudi") window.close();
    };

    // Alla prima apertura — e a ogni ricarica — si chiede lo stato invece di
    // aspettare il prossimo cambiamento: altrimenti la finestra resterebbe
    // vuota finché l'insegnante non tocca qualcosa.
    spedisci(canale, { tipo: "chiedi-stato" });

    const controllo = setInterval(() => {
      // Tre secondi senza battito: il comando non c'è più. Non si cancella
      // niente, si accende solo l'avviso.
      if (ultimoBattito.current > 0 && Date.now() - ultimoBattito.current > 3000) {
        setVivo(false);
        spedisci(canale, { tipo: "chiedi-stato" });
      }
    }, 1500);

    return () => {
      clearInterval(controllo);
      canale.close();
    };
  }, []);

  if (!stato) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1219] px-8 text-center">
        <p className="text-2xl text-white/60">
          In attesa del tavolo dell&rsquo;insegnante&hellip;
        </p>
      </div>
    );
  }

  const ordine: Position[] = ["north", "west", "east", "south"];
  const presenti = ordine.filter((p) => stato.posizioni.includes(p));

  /**
   * In condivisione schermo cambia la MISURA, non il contenuto.
   *
   * La compressione video butta via per prime le differenze sottili: bordi
   * tenui, grigi vicini fra loro, spaziature strette. Su un proiettore quella
   * roba si legge, dentro un flusso Zoom diventa una macchia. Qui il fondo va
   * nero pieno, i bordi spariscono e le carte crescono ancora.
   */
  const condivisa = stato.finestraCondivisa;

  return (
    <div
      className={`relative min-h-screen text-white ${
        condivisa ? "bg-black px-12 py-8" : "bg-[#0f1219] px-8 py-6"
      }`}
    >
      {!vivo && (
        <span
          className="absolute right-4 top-4 flex items-center gap-2 text-sm text-amber-300/70"
          role="status"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          riconnessione
        </span>
      )}

      {stato.titolo && (
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight">{stato.titolo}</h1>
      )}

      <div className={`mx-auto grid grid-cols-3 ${condivisa ? "max-w-5xl gap-10" : "max-w-6xl gap-6"}`}>
        <div />
        <ManoProiettata posizione="north" carte={stato.mani.north} presente={presenti.includes("north")} condivisa={condivisa} />
        <div />
        <ManoProiettata posizione="west" carte={stato.mani.west} presente={presenti.includes("west")} condivisa={condivisa} />
        <div className="flex flex-col items-center justify-center gap-4">
          {stato.contratto && (
            <p className="text-center text-4xl font-bold">
              {stato.contratto}
              {stato.dichiarante && (
                <span className="block text-xl font-normal text-white/60">
                  dichiara {NOME[stato.dichiarante]}
                </span>
              )}
            </p>
          )}
          {stato.doppioMorto && (
            <p className="rounded-lg bg-white/10 px-4 py-2 text-center text-xl">
              {stato.doppioMorto}
            </p>
          )}
          {stato.giocate.length > 0 && (
            <p className="text-center text-lg text-white/70">
              {stato.giocate.length} {stato.giocate.length === 1 ? "carta giocata" : "carte giocate"}
            </p>
          )}
        </div>
        <ManoProiettata posizione="east" carte={stato.mani.east} presente={presenti.includes("east")} condivisa={condivisa} />
        <div />
        <ManoProiettata posizione="south" carte={stato.mani.south} presente={presenti.includes("south")} condivisa={condivisa} />
        <div />
      </div>

      {stato.dichiarazione && stato.dichiarazione.bids.length > 0 && (
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/50">Dichiarazione</p>
          <p className="text-2xl font-mono tracking-wide">{stato.dichiarazione.bids.join("  ")}</p>
        </div>
      )}

      {stato.mostraDivisioni && (
        <div className="mx-auto mt-8 max-w-3xl [&_*]:!text-white">
          <PannelloDivisioni
            noti={stato.mani}
            giocate={stato.giocate}
            avversari={["west", "east"]}
            grande
          />
        </div>
      )}
    </div>
  );
}

/**
 * Una mano sul proiettore, oppure il suo riquadro coperto.
 *
 * Il riquadro coperto c'è di proposito: la classe deve vedere che quella mano
 * esiste e non la sta guardando. Uno spazio vuoto sembrerebbe un errore.
 */
function ManoProiettata({
  posizione,
  carte,
  presente,
  condivisa = false,
}: {
  posizione: Position;
  carte: Card[] | undefined;
  presente: boolean;
  condivisa?: boolean;
}) {
  if (!presente) return <div />;

  return (
    <div
      className={
        condivisa
          ? "rounded-2xl bg-neutral-900 p-6"
          : "rounded-2xl border border-white/15 bg-white/5 p-5"
      }
    >
      <p className="mb-3 text-center text-lg font-bold uppercase tracking-[0.2em] text-white/50">
        {NOME[posizione]}
      </p>
      {!carte ? (
        <p className="py-6 text-center text-2xl text-white/25">coperta</p>
      ) : (
        <div className="space-y-1.5">
          {SEMI.map((seme) => {
            const ranghi = carte
              .filter((c) => c.suit === seme)
              .map((c) => c.rank)
              .sort((a, b) => ORDINE_RANGHI.indexOf(a) - ORDINE_RANGHI.indexOf(b));
            return (
              <p key={seme} className="flex items-center gap-3">
                <SuitSymbol suit={seme} size="xl" />
                <span className={`font-mono font-bold tracking-wider ${condivisa ? "text-6xl" : "text-5xl"}`}>
                  {ranghi.length > 0 ? ranghi.join(" ") : "—"}
                </span>
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
