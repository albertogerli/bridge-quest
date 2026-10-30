const CLASSE: Record<string, string> = {
  "♠": "suit-spade",
  "♥": "suit-heart",
  "♦": "suit-diamond",
  "♣": "suit-club",
};

/** Un testo con i simboli dei semi colorati come al tavolo. */
export function TestoConSemi({ testo }: { testo: string }) {
  return (
    <>
      {testo.split(/([♠♥♦♣])/).map((pezzo, i) =>
        CLASSE[pezzo] ? (
          <span key={i} className={`${CLASSE[pezzo]} font-bold`}>
            {pezzo}
          </span>
        ) : (
          pezzo
        ),
      )}
    </>
  );
}
