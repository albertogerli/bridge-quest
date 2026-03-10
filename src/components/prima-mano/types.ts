import type { Card, Position } from "@/lib/bridge-engine";

export type StepId =
  | "benvenuto"
  | "tavolo"
  | "presa"
  | "obbligo"
  | "ruoli"
  | "atout"
  | "mini-prese"
  | "mano-vera"
  | "vittoria";

export interface StepConfig {
  id: StepId;
  kicker: string;
  title: string;
  body: string;
}

export interface StepProps {
  onComplete: (xpEarned: number) => void;
  playSound: (type: "correct" | "wrong" | "trickWon" | "levelUp" | "cardPlay" | "click") => void;
}

export interface HandResult {
  tricksMade: number;
  tricksNeeded: number;
  made: boolean;
}

export const STEPS: StepConfig[] = [
  {
    id: "benvenuto",
    kicker: "Arrivo al Club",
    title: "Il tuo primo torneo.",
    body: "Quattro sedie, un mazzo, e l'avversario ti sta già guardando. Tra 5 minuti giocherai la tua prima mano vera.",
  },
  {
    id: "tavolo",
    kicker: "Prendi Posto",
    title: "Quattro giocatori, due squadre.",
    body: "Nord-Sud contro Est-Ovest. Tu sei Sud. Il tuo compagno è di fronte a te.",
  },
  {
    id: "presa",
    kicker: "La Prima Regola",
    title: "Qui conta una sola cosa.",
    body: "Ogni giro si giocano 4 carte, una per giocatore. Chi gioca la carta più alta del seme comandato vince la presa.",
  },
  {
    id: "obbligo",
    kicker: "L'Obbligo",
    title: "Devi rispondere al seme.",
    body: "Se hai carte del seme giocato, DEVI giocare una di quelle. Solo se non ne hai, puoi giocare qualsiasi altra carta.",
  },
  {
    id: "ruoli",
    kicker: "I Protagonisti",
    title: "Al tavolo siete in quattro, ma giocano in tre.",
    body: "Il dichiarante decide la strategia e controlla anche le carte del morto. I due difensori cercano di battere il contratto.",
  },
  {
    id: "atout",
    kicker: "L'Arma Segreta",
    title: "Il taglio non è magia.",
    body: "Se non hai il seme giocato, puoi tagliare con l'atout. Ma non sei obbligato: puoi anche scartare.",
  },
  {
    id: "mini-prese",
    kicker: "Riscaldamento",
    title: "Quattro prese di pratica.",
    body: "Scegli la carta giusta e vinci. Poi arriva la mano vera.",
  },
  {
    id: "mano-vera",
    kicker: "La Partita",
    title: "Silenzio al club.",
    body: "È il tuo turno. Gioca la tua prima mano vera di bridge. Contratto: 4 Picche. Devi fare almeno 10 prese.",
  },
  {
    id: "vittoria",
    kicker: "Applauso",
    title: "Hai giocato la tua prima mano.",
    body: "Non hai studiato tutto il bridge. Hai studiato abbastanza per iniziare.",
  },
];
