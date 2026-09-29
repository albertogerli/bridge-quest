import { aiSelectCard, createGame, playCard, type Card, type Position } from "@/lib/bridge-engine";

/**
 * La carta che il computer gioca per un posto del tavolo condiviso.
 *
 * Il tavolo conserva le mani RIMASTE e la sequenza delle carte giocate; il
 * motore vuole una partita. Qui si ricostruisce la smazzata di partenza
 * (rimaste + giocate), la si rigioca carta per carta e si chiede al motore,
 * lo stesso dei giochi contro il computer. `null` se non tocca a quel posto o
 * se la ricostruzione non torna: meglio non muovere che muovere a caso.
 */
export function sceltaDelComputer(
  rimaste: Partial<Record<Position, Card[]>>,
  giocate: readonly { seat: Position; card: Card }[],
  contratto: string,
  dichiarante: Position,
  posto: Position,
): Card | null {
  const posti: Position[] = ["north", "east", "south", "west"];
  const iniziali = {} as Record<Position, Card[]>;
  for (const p of posti) {
    iniziali[p] = [...(rimaste[p] ?? []), ...giocate.filter((g) => g.seat === p).map((g) => g.card)];
    if (iniziali[p].length !== 13) return null;
  }
  try {
    let stato = createGame(iniziali, contratto, dichiarante);
    for (const g of giocate) stato = playCard(stato, g.seat, g.card);
    if (stato.phase === "finished" || stato.currentPlayer !== posto) return null;
    return aiSelectCard(stato, posto);
  } catch {
    return null;
  }
}
