type Suit = "spade" | "heart" | "diamond" | "club";

const suitConfig: Record<Suit, { symbol: string; className: string }> = {
  spade: { symbol: "\u2660", className: "suit-spade" },
  heart: { symbol: "\u2665", className: "suit-heart" },
  diamond: { symbol: "\u2666", className: "suit-diamond" },
  club: { symbol: "\u2663", className: "suit-club" },
};

const sizes = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-4xl",
};

export function SuitSymbol({
  suit,
  size = "md",
}: {
  suit: Suit;
  size?: keyof typeof sizes;
}) {
  const config = suitConfig[suit];
  return (
    <span className={`${config.className} ${sizes[size]} leading-none font-bold`}>
      {config.symbol}
    </span>
  );
}
