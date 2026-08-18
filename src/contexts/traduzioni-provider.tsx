"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { caricaDizionario, traduci, type Dizionario } from "@/lib/traduzioni";
import { useLingua } from "@/hooks/use-lingua";

/**
 * Il dizionario della pagina, caricato una volta sola e solo se serve.
 *
 * IN ITALIANO NON CARICA NIENTE: `caricaDizionario` risponde `null` e non parte
 * nessuna richiesta. Chi legge in italiano — cioè quasi tutti — non paga un
 * byte per una funzione che non usa.
 *
 * IL RIPIEGO È SEMPRE L'ITALIANO, anche mentre il dizionario sta arrivando.
 * Per una frazione di secondo un lettore inglese vede l'italiano, poi la
 * pagina si assesta. È la scelta giusta fra le tre possibili: mostrare le
 * chiavi (illeggibile), non mostrare niente (una pagina che sfarfalla), o
 * mostrare una lingua vera. L'alternativa — bloccare la pagina finché il
 * dizionario non c'è — costerebbe a tutti l'attesa che abbiamo appena tolto al
 * service worker.
 */
const Contesto = createContext<Dizionario | null>(null);

export function TraduzioniProvider({ children }: { children: React.ReactNode }) {
  const { lingua } = useLingua();
  const [dizionario, setDizionario] = useState<Dizionario | null>(null);

  useEffect(() => {
    let vivo = true;
    // Cambiando lingua si svuota subito: tenere il dizionario vecchio mentre
    // arriva il nuovo mostrerebbe l'inglese su una pagina tornata italiana.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- il dizionario è una risorsa esterna caricata a richiesta: non esiste al primo render e non può essere calcolato, quindi arriva per forza dopo il mount
    setDizionario(null);
    void caricaDizionario(lingua).then((d) => {
      if (vivo) setDizionario(d);
    });
    return () => {
      vivo = false;
    };
  }, [lingua]);

  return <Contesto.Provider value={dizionario}>{children}</Contesto.Provider>;
}

/**
 * La funzione di traduzione, da usare in ogni testo rivolto all'utente.
 *
 *   const t = useT();
 *   <p>{t("Tocca a te")}</p>
 *   <p>{t("Mancano {n} punti", { n: 12 })}</p>
 *
 * La chiave è la frase italiana: vedi `src/lib/traduzioni.ts` per il perché.
 */
export function useT() {
  const dizionario = useContext(Contesto);
  return useCallback(
    (frase: string, valori?: Record<string, string | number>) =>
      traduci(frase, dizionario, valori),
    [dizionario]
  );
}
