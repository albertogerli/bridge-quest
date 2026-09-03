import { gruppiDiRanghi } from "@/lib/ranghi-seme";

/**
 * I ranghi di un seme in una riga sola, con il dieci staccato.
 *
 * UN SOLO POSTO PER TUTTI. Prima ogni schermata scriveva i ranghi a modo suo:
 * il tavolo li metteva in scatolette, la lavagna e la dispensa li univano in
 * una stringa. Tre resa diverse della stessa cosa, e il difetto del dieci
 * attaccato era in due di esse — quindi allinearsi a una qualsiasi non bastava.
 *
 * LO STACCO È UN MARGINE, NON UNO SPAZIO. In un carattere a spaziatura fissa
 * uno spazio occupa una cella intera: sulla mano lunga costava ventisei pixel,
 * cioè un quarto di quello che avevamo appena guadagnato. Il margine ne costa
 * sei e ottiene la stessa cosa — il dieci si vede come una carta sola e il
 * conteggio a occhio torna.
 *
 * IL VUOTO SI VEDE, non si deduce. Un seme senza carte mostra un trattino: la
 * riga c'è sempre, così le quattro righe si confrontano fra mani diverse e una
 * chicane si nota subito.
 */
export function RanghiSeme({
  ranghi,
  className = "",
}: {
  /** Già ordinati da chi chiama: qui non si riordina. */
  ranghi: readonly string[];
  className?: string;
}) {
  if (ranghi.length === 0) {
    return <span className={`text-gray-300 ${className}`}>—</span>;
  }
  return (
    <span className={className}>
      {gruppiDiRanghi(ranghi).map((g, i) => (
        <span key={i} className={g.staccato ? "mx-[0.14em]" : undefined}>
          {g.testo}
        </span>
      ))}
    </span>
  );
}
