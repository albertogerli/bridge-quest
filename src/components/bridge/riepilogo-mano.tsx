"use client";

import { SuitSymbol } from "@/components/bridge/suit-symbol";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { handHcp } from "@/lib/deal-generator";
import type { ContrattoValutato } from "@/lib/riepilogo-mano";
import { dalVostroLato } from "@/lib/riepilogo-mano";
import { Stelle } from "@/components/bridge/stelle";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

function seme(hand: readonly Card[], suit: Suit): string {
  const carte = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return carte.length ? carte.join(" ") : "—";
}

/**
 * Il riepilogo di fine mano: tutte e quattro le mani, e cosa valeva ogni
 * contratto.
 *
 * PERCHÉ SERVE
 * Durante la licita vedi solo le tue carte, come al tavolo. A mano finita
 * quella regola non ha più senso: il voto da solo dice che hai sbagliato, non
 * cosa dovevi fare. Le quattro mani insieme mostrano perché il contratto
 * reggeva o non reggeva, e l'elenco dei contratti mostra dove si doveva
 * arrivare — che è la lezione della smazzata.
 *
 * LA FORMA È QUELLA DEL TAVOLO: Nord in alto, Ovest ed Est ai lati, Sud in
 * basso. Chi gioca a bridge legge le mani in quella disposizione da sempre, e
 * un elenco in colonna costringe a ricostruirla a mente ogni volta.
 */
export function RiepilogoMano({
  deal,
  contratti,
  avversari = [],
}: {
  deal: Record<Position, Card[]>;
  contratti: ContrattoValutato[];
  /**
   * I contratti migliori degli AVVERSARI, dal loro punto di vista.
   *
   * Senza, non si capisce se la mano era tua: un 2♥ che rende 110 sembra un
   * risultato mediocre finché non si vede che loro avrebbero fatto 620 a
   * picche, e allora diventa un buon lavoro di difesa.
   *
   * LE STELLE CI SONO, e sono le LORO: misurate sul loro contratto migliore,
   * non sul tuo. Dicono quanto era buona la mano per loro — che è esattamente
   * il metro per capire se il tuo parziale li ha tenuti fuori da qualcosa di
   * grosso o se non avevano comunque niente.
   */
  avversari?: ContrattoValutato[];
}) {
  const t = useT();
  // La colonna del valore atteso compare solo se la mano lo porta: le mani
  // generate prima delle distribuzioni hanno solo il punteggio reale, e una
  // colonna di trattini non spiega niente a nessuno.
  const mostraAtteso = contratti.some((c) => c.ev !== null);

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {t("Tutta la smazzata")}
      </p>

      {/* Le quattro mani, a forma di tavolo. */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div />
        <ManoPosto hand={deal.north} posto="north" />
        <div />
        <ManoPosto hand={deal.west} posto="west" />
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          N<br />O · E<br />S
        </div>
        <ManoPosto hand={deal.east} posto="east" />
        <div />
        <ManoPosto hand={deal.south} posto="south" evidenzia />
        <div />
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {t("Cosa valeva ogni contratto")}
      </p>
      {contratti.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Su questa smazzata la tua linea non aveva nessun contratto che
          reggesse: era mano loro, e passare era la scelta giusta.
        </p>
      )}

      {/* UNA TABELLA SOLA, anche per i contratti avversari.
          Erano due tabelle affiancate: ognuna calcolava le larghezze sui
          propri contenuti, e siccome i numeri sotto sono più corti (o più
          lunghi, da quando portano il segno) le colonne non cadevano mai sotto
          le stesse intestazioni. Nessuna riga di CSS può allineare due griglie
          indipendenti: o si fissano le larghezze a mano — e si sbagliano al
          primo numero a quattro cifre — o la griglia diventa una. */}
      {(contratti.length > 0 || avversari.length > 0) && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="font-normal py-1">{t("Contratto")}</th>
                <th className="font-normal py-1 text-right">{t("Prese")}</th>
                <th className="font-normal py-1 text-right">Qui</th>
                {mostraAtteso && <th className="font-normal py-1 text-right">{t("In media")}</th>}
                <th className="font-normal py-1 text-right">{t("Stelle")}</th>
              </tr>
            </thead>
            <tbody>
              {contratti.map((c) => (
                <tr
                  key={`${c.etichetta}-${c.declarer}`}
                  className={`border-t border-border ${c.tuo ? "font-bold text-figb" : ""}`}
                >
                  <td className="py-2">
                    {c.etichetta} di {ETICHETTA[c.declarer]}
                    {c.tuo && <span className="ml-1 font-normal">← il vostro</span>}
                  </td>
                  <td className="py-2 text-right tabular-nums">{c.prese}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{c.punteggio}</td>
                  {mostraAtteso && (
                    <td className="py-2 text-right font-mono tabular-nums">{c.ev ?? "—"}</td>
                  )}
                  <td className="py-2">
                    <span className="flex justify-end">
                      <Stelle quante={c.stelle} />
                    </span>
                  </td>
                </tr>
              ))}

              {avversari.length > 0 && (
                <>
                  <tr>
                    <th
                      colSpan={mostraAtteso ? 5 : 4}
                      className="border-t border-border pt-4 pb-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t("Cosa potevano fare loro")}
                    </th>
                  </tr>
                  {avversari.map((c) => (
                    <tr
                      key={`avv-${c.etichetta}-${c.declarer}`}
                      className="border-t border-border"
                    >
                      <td className="py-2">
                        {c.etichetta} di {ETICHETTA[c.declarer]}
                      </td>
                      <td className="py-2 text-right tabular-nums">{c.prese}</td>
                      {/* Col segno di chi legge: l'allievo siede in Nord-Sud e
                          quei punti li subisce. Vedi `dalVostroLato`. */}
                      <td className="py-2 text-right font-mono tabular-nums">
                        {dalVostroLato(c.punteggio)}
                      </td>
                      {mostraAtteso && (
                        <td className="py-2 text-right font-mono tabular-nums">
                          {dalVostroLato(c.ev)}
                        </td>
                      )}
                      <td className="py-2">
                        <span className="flex justify-end">
                          <Stelle quante={c.stelle} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
      {contratti.some((c) => contratti.filter((x) => x.etichetta === c.etichetta).length > 1) && (
        <p className="text-xs text-muted-foreground mt-2">
          {t("Lo stesso contratto compare due volte perché")} <strong>cambia chi
          dichiara</strong>: l&apos;attacco arriva dalla sinistra del
          dichiarante, e una carta in meno da girare può valere due prese.
        </p>
      )}

      {avversari.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          Nei contratti loro i punti sono scritti dal vostro lato — col meno
          quando il contratto lo mantengono, col più quando cade. Le stelle
          invece sono le <strong>loro</strong>, misurate sul loro contratto
          migliore: servono a sapere se la mano era vostra, perché tenerli
          fuori da una manche vale più di un vostro parziale in più.
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        <strong>Qui</strong> è quanto vale su questa smazzata, a carte scoperte.
        {mostraAtteso ? (
          <>
            {" "}
            <strong>{t("In media")}</strong> è quanto rende rimescolando le carte
            avversarie: è da lì che vengono le stelle, perché una buona
            dichiarazione resta buona anche quando le carte stanno male.
          </>
        ) : (
          " Le stelle sono quelle che avreste preso arrivando lì."
        )}
      </p>
    </div>
  );
}

function ManoPosto({
  hand, posto, evidenzia,
}: {
  hand: readonly Card[];
  posto: Position;
  evidenzia?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-2 ${
        evidenzia ? "border-figb bg-figb/5" : "border-border bg-card"
      }`}
    >
      <p className="text-xs font-semibold mb-1 flex items-center justify-between gap-1">
        <span>{ETICHETTA[posto]}</span>
        <span className="font-normal text-muted-foreground">{handHcp(hand)} PO</span>
      </p>
      {SUITS.map((s) => (
        <p key={s} className="text-sm font-mono flex items-center gap-1 leading-tight">
          <SuitSymbol suit={s} size="sm" />
          {seme(hand, s)}
        </p>
      ))}
    </div>
  );
}
