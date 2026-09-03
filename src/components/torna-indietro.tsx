"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Il modo di tornare indietro, uguale in tutte le pagine.
 *
 * PERCHÉ SERVIVA. Delle ventidue pagine sotto le classi, DUE avevano un
 * ritorno vero. Le altre si lasciavano solo con il tasto del browser — che
 * sull'app non c'è — oppure ricominciando dalla home. E dove qualcosa
 * c'era, non era la stessa cosa: nella pagina della classe il collegamento
 * «Torna alle classi» compariva soltanto quando la classe non si trovava, e
 * nel tavolo di studio la parola «Indietro» significa tutt'altro — annulla
 * l'ultima carta giocata. Lo stesso vocabolo per due gesti diversi è peggio
 * di un vocabolo mancante.
 *
 * UNA DESTINAZIONE, NON LA CRONOLOGIA. `router.back()` sembrava la scelta
 * ovvia e non lo è: gli insegnanti arrivano su queste pagine da un link di
 * WhatsApp o inquadrando un QR, e lì la cronologia è vuota — il pulsante non
 * farebbe niente proprio a chi ne ha più bisogno. Con una destinazione
 * esplicita il ritorno funziona sempre e porta dove ci si aspetta: dalla
 * pagina di un compito alla sua classe, non alla schermata da cui si è capitati.
 *
 * È UN COLLEGAMENTO VERO, non un bottone con un `onClick`: si apre in una
 * scheda nuova col tasto centrale, si raggiunge col tabulatore, e i motori di
 * ricerca ci passano. Un `<button>` che naviga butta via tutto questo.
 *
 * IL GESTO DI SISTEMA continua a funzionare da sé. Senza un ascoltatore
 * registrato, il tasto fisico di Android usa la cronologia del WebView: questo
 * componente non se ne impossessa e non lo disturba.
 */
export function TornaIndietro({
  href,
  etichetta,
  className = "",
}: {
  href: string;
  /** Dove si torna, detto per esteso: «Torna alla classe», non «Indietro». */
  etichetta: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      // `min-h-11`: quarantaquattro pixel di area toccabile. Il pubblico ha
      // oltre sessant'anni e spesso è sul telefono, e un bersaglio piccolo in
      // alto a sinistra è quello che si manca più facilmente.
      className={`-ml-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {etichetta}
    </Link>
  );
}
