"use client";

import { useT } from "@/contexts/traduzioni-provider";
import type { Position } from "@/lib/bridge-engine";
import type { Vulnerability } from "@/lib/catalog";

const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

const ORDINE: Position[] = ["north", "east", "south", "west"];

/**
 * La zona, detta come la si dice al tavolo e non come sta nel database.
 *
 * «ns» e «ew» non vogliono dire niente a un allievo: quello che conta è se
 * la zona è SUA o LORO, perché è da lì che dipende quanto può rischiare.
 */
const ZONA: Record<Vulnerability, string> = {
  none: "nessuno in zona",
  ns: "siamo in zona",
  ew: "loro in zona",
  both: "tutti in zona",
};

/** Prima, seconda, terza o quarta: la posizione rispetto a chi ha aperto. */
const POSIZIONE = ["prima", "seconda", "terza", "quarta"];

export function posizioneRispettoAlDealer(io: Position, dealer: Position): string {
  const d = (ORDINE.indexOf(io) - ORDINE.indexOf(dealer) + 4) % 4;
  return POSIZIONE[d];
}

/**
 * Le due cose che servono PRIMA di dichiarare, e che mancavano.
 *
 * PERCHÉ NON È UN DETTAGLIO. La stessa mano si dichiara in modo diverso a
 * seconda della zona e della posizione: un barrage in terza con loro in zona
 * è normale, lo stesso barrage in prima con noi in zona è un regalo. Chi
 * dichiara senza queste due informazioni non sta sbagliando — sta tirando a
 * indovinare, e poi si vede dare un punteggio come se avesse sbagliato.
 *
 * Nel torneo di licita la zona non compariva DA NESSUNA PARTE finché l'asta
 * non era finita: esisteva nei dati, entrava nel calcolo delle stelle, e
 * all'allievo non veniva detta. La posizione c'era, ma andava contata
 * guardando quale colonna dell'asta è marcata «dealer».
 *
 * Sta in un componente condiviso perché la stessa dimenticanza si può
 * rifare in ogni gioco di licita, e ce ne sono sei.
 */
export function CondizioniAsta({
  io,
  dealer,
  vulnerability,
  punti,
}: {
  io: Position;
  dealer: Position;
  vulnerability: Vulnerability;
  /** Punti onori della propria mano, se il gioco li mostra. */
  punti?: number;
}) {
  const t = useT();
  const posizione = posizioneRispettoAlDealer(io, dealer);
  return (
    <p className="text-xs text-muted-foreground">
      {t("Sei in {posizione}", { posizione: t(posizione) })}
      {" · "}
      {t(ZONA[vulnerability])}
      {punti !== undefined && ` · ${punti} PO`}
      <span className="block text-[12px]">
        {t("Apre {posto}", { posto: t(ETICHETTA[dealer]) })}
      </span>
    </p>
  );
}
