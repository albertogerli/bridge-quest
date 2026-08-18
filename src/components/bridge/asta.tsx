"use client";

import { SuitSymbol } from "@/components/bridge/suit-symbol";
import type { Suit } from "@/lib/bridge-engine";
import {
  CONTRO, DENOMINAZIONI, PASSO, SURCONTRO,
  dichiarazioniLecite, righeAsta, turno,
  type Posto,
} from "@/lib/asta";
import { useT } from "@/contexts/traduzioni-provider";

const ETICHETTA: Record<Posto, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};
const COLONNE: Posto[] = ["north", "east", "south", "west"];

const SEME_DI: Record<string, Suit | null> = {
  "♣": "club", "♦": "diamond", "♥": "heart", "♠": "spade", SA: null,
};

/**
 * La griglia d'asta e il cassetto delle dichiarazioni.
 *
 * PERCHÉ UN COMPONENTE SOLO
 * Prima ogni schermata disegnava una griglia piatta 5×7 e mandava al server
 * qualunque cosa venisse premuta. Il server rifiutava, e l'utente si vedeva
 * negare una dichiarazione che l'interfaccia gli aveva appena offerto: non
 * capiva se aveva sbagliato lui o se era rotto qualcosa.
 *
 * Qui le dichiarazioni illecite non si possono premere — le decide
 * `dichiarazioniLecite`, che è testata — e l'asta si legge come su carta:
 * quattro colonne fisse, le caselle prima del dealer vuote.
 *
 * «DEALER» e non «mazziere» né «apertore»: è la parola dei diagrammi, la stessa
 * che si legge su qualunque bollettino di gara. «Apertore» direbbe un'altra
 * cosa — chi fa l'APERTURA, cioè la prima dichiarazione diversa da passo — che
 * quando il dealer passa è un altro giocatore.
 *
 * Il contro e il surcontro compaiono solo quando sono davvero possibili: sono
 * le due regole che si sbagliano più spesso, e mostrarle sempre insegnerebbe
 * che si può contrare il proprio compagno.
 */
export function Asta({
  dealer,
  bids,
  ioSono,
  onDichiara,
  disabilitato = false,
  vulnerabilita,
}: {
  dealer: Posto;
  bids: string[];
  /** Il posto di chi guarda: la sua colonna viene evidenziata. */
  ioSono?: Posto;
  /** Assente = sola lettura (asta finita, o tocca a un altro). */
  onDichiara?: (bid: string) => void;
  disabilitato?: boolean;
  vulnerabilita?: string;
}) {
  const t = useT();
  const righe = righeAsta(dealer, bids);
  const chiParla = turno(dealer, bids);
  const lecite = dichiarazioniLecite(dealer, bids);

  /**
   * NON SI DICHIARA FUORI TURNO, e il controllo sta qui.
   *
   * Prima i pulsanti guardavano solo se la dichiarazione fosse LECITA, non se
   * toccasse a chi guarda. Se l'asta si fermava con la parola a un altro — il
   * compagno che non risponde, una chiamata ancora in volo — i pulsanti
   * restavano premibili, e la dichiarazione finiva scritta nella casella di
   * quell'altro: si dichiarava con le carte di un posto e il conto lo faceva
   * un altro posto. Chi lo subiva vedeva la propria mano che non c'entrava
   * niente con l'asta.
   *
   * Il componente sa già dealer, dichiarazioni e chi guarda: ha tutto per
   * saperlo, e metterlo qui vale per ogni schermata invece che ricordarsene
   * ogni volta.
   */
  const mioTurno = ioSono === undefined || chiParla === ioSono;
  const posso = Boolean(onDichiara) && !disabilitato && mioTurno && lecite.passo;

  return (
    <div>
      {/* ── La griglia ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-3">
        <div className="grid grid-cols-4 text-center text-xs font-bold bg-muted/60">
          {COLONNE.map((p) => (
            <div
              key={p}
              className={`py-1.5 ${p === ioSono ? "text-figb" : "text-muted-foreground"}`}
            >
              {ETICHETTA[p]}
              {p === dealer && (
                <span className="block text-[12px] font-normal">dealer</span>
              )}
            </div>
          ))}
        </div>

        {righe.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            L&apos;asta comincia da {ETICHETTA[dealer]}.
          </p>
        )}

        {righe.map((r, i) => (
          <div key={i} className="grid grid-cols-4 text-center border-t border-border">
            {COLONNE.map((p) => {
              const bid = r[p];
              const ultimo =
                i === righe.length - 1 &&
                bid !== null &&
                COLONNE.indexOf(p) === COLONNE.indexOf(chiParla) - 1;
              return (
                <div
                  key={p}
                  className={`py-2 text-base font-mono ${
                    p === ioSono ? "bg-figb/5" : ""
                  } ${ultimo ? "font-bold" : ""}`}
                >
                  {bid === null ? (
                    <span className="text-muted-foreground/40">·</span>
                  ) : (
                    <Dichiarazione bid={bid} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {vulnerabilita && (
        <p className="text-xs text-muted-foreground mb-3 text-center">
          Vulnerabilità: {vulnerabilita}
        </p>
      )}

      {/* Fuori turno il cassetto sparisce, e sparire senza dire perché è la
          metà sbagliata del rimedio: chi guarda deve sapere che sta aspettando
          qualcuno, non credere che la pagina si sia rotta. */}
      {Boolean(onDichiara) && !mioTurno && lecite.passo && (
        <p className="text-sm text-muted-foreground mb-3 text-center">
          Tocca a {ETICHETTA[chiParla]}.
        </p>
      )}

      {/* ── Il cassetto ───────────────────────────────────────────────── */}
      {posso && (
        <div>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((lvl) =>
              DENOMINAZIONI.map((d) => {
                const bid = `${lvl}${d}`;
                const ok = lecite.contratti.includes(bid);
                return (
                  <button
                    key={bid}
                    disabled={!ok || !posso}
                    onClick={() => onDichiara?.(bid)}
                    aria-label={`Dichiara ${bid}`}
                    className={`h-10 rounded-lg border text-sm font-bold transition-colors ${
                      ok && posso
                        ? "border-border bg-card hover:bg-muted"
                        : "border-transparent bg-muted/30 text-muted-foreground/30"
                    }`}
                  >
                    {lvl}
                    {d === "SA" ? "SA" : <SemeInline d={d} />}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex gap-1">
            <button
              disabled={!posso}
              onClick={() => onDichiara?.(PASSO)}
              className={`flex-1 h-11 rounded-lg border text-sm font-bold ${
                posso
                  ? "border-border bg-card hover:bg-muted"
                  : "border-transparent bg-muted/30 text-muted-foreground/30"
              }`}
            >
              {t("Passo")}
            </button>
            <button
              disabled={!lecite.contro || !posso}
              onClick={() => onDichiara?.(CONTRO)}
              aria-label="Contro"
              className={`w-20 h-11 rounded-lg border text-sm font-bold ${
                lecite.contro && posso
                  ? "border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  : "border-transparent bg-muted/30 text-muted-foreground/30"
              }`}
            >
              {t("Contro")}
            </button>
            <button
              disabled={!lecite.surcontro || !posso}
              onClick={() => onDichiara?.(SURCONTRO)}
              aria-label="Surcontro"
              className={`w-20 h-11 rounded-lg border text-sm font-bold ${
                lecite.surcontro && posso
                  ? "border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  : "border-transparent bg-muted/30 text-muted-foreground/30"
              }`}
            >
              {t("Surcontro")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Una dichiarazione con il simbolo del seme al posto della lettera. */
function Dichiarazione({ bid }: { bid: string }) {
  const t = useT();
  if (bid === PASSO) return <span className="text-muted-foreground">{t("Passo")}</span>;
  if (bid === CONTRO) return <span className="text-red-600 font-bold">X</span>;
  if (bid === SURCONTRO) return <span className="text-blue-600 font-bold">XX</span>;
  const d = bid.slice(1);
  return (
    <span className="inline-flex items-center gap-0.5">
      {bid[0]}
      {d === "SA" ? "SA" : <SemeInline d={d} />}
    </span>
  );
}

function SemeInline({ d }: { d: string }) {
  const suit = SEME_DI[d];
  return suit ? <SuitSymbol suit={suit} size="xs" /> : <span>SA</span>;
}
