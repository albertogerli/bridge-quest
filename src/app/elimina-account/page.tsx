"use client";

import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";
import { useSharedAuth } from "@/contexts/auth-provider";

/**
 * Come si elimina l'account, leggibile senza account e senza l'app.
 *
 * PERCHÉ UNA PAGINA PUBBLICA. Google Play chiede un indirizzo web dove chi ha
 * installato l'app possa chiedere la cancellazione anche dopo averla tolta dal
 * telefono, o senza ricordare la password (07/11/2026). Dentro l'app la
 * cancellazione c'era già, in Profilo: questa pagina dice dov'è, che cosa
 * porta via e come chiederla per email.
 *
 * Quello che si cancella è quello che cancella `/api/account/delete`: l'utente
 * di autenticazione e, a cascata, tutto ciò che è suo.
 */
export default function EliminaAccountPage() {
  const t = useT();
  const { user } = useSharedAuth();
  return (
    <div className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-6 inline-block text-sm font-semibold text-figb dark:text-primary">
          &larr; {t("Torna alla Home")}
        </Link>

        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">{t("Eliminare l'account BridgeLab")}</h1>
        <p className="mb-6 text-muted-foreground">
          {t("BridgeLab è la piattaforma per imparare il bridge della Federazione Italiana Gioco Bridge (FIGB). Puoi eliminare il tuo account in qualsiasi momento, dall'app, dal sito o per email.")}
        </p>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-lg font-bold text-foreground">{t("Dall'app o dal sito")}</h2>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>{t("Entra con il tuo account.")}</li>
              <li>{t("Apri «Profilo».")}</li>
              <li>{t("In fondo alla pagina tocca «Elimina account e tutti i dati».")}</li>
              <li>{t("Scrivi ELIMINA per confermare. L'account viene eliminato subito.")}</li>
            </ol>
            <Link
              href={user ? "/profilo" : "/login?redirect=%2Fprofilo"}
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {user ? t("Vai al profilo") : t("Entra e vai al profilo")}
            </Link>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-lg font-bold text-foreground">{t("Per email")}</h2>
            <p className="text-muted-foreground">
              {t("Se non riesci più a entrare, scrivi a")}{" "}
              <a href="mailto:info@federbridge.it?subject=Eliminazione%20account%20BridgeLab" className="text-figb underline dark:text-primary">
                info@federbridge.it
              </a>{" "}
              {t("dall'indirizzo con cui ti sei registrato, con oggetto «Eliminazione account BridgeLab». L'account viene eliminato entro 30 giorni dalla richiesta.")}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">{t("Che cosa viene eliminato")}</h2>
            <p className="text-muted-foreground">
              {t("Tutto quello che è legato al tuo account: email, nome e profilo, progressi nelle lezioni, punti, badge, risultati delle partite e delle sfide, messaggi nel forum e nelle chat di classe, amicizie, iscrizioni alle classi e, se sei un insegnante, le tue classi con i loro compiti, le presenze e le chat.")}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-foreground">{t("Che cosa resta, e per quanto")}</h2>
            <p className="text-muted-foreground">
              {t("Nessun dato collegato al tuo account resta nel servizio. Le copie di sicurezza del database si rinnovano da sole: entro 30 giorni non contengono più i tuoi dati. Restano statistiche di utilizzo aggregate e anonime, che non permettono di risalire a te.")}
            </p>
            <p className="mt-2 text-muted-foreground">
              {t("Restano, senza più il collegamento al tuo account: le domande, le mani, i materiali della libreria e i sondaggi che hai preparato come insegnante, perché altri insegnanti possono averli già usati; le tue segnalazioni di errori nei contenuti; il modulo d'adesione a un corso, che appartiene all'insegnante e alla sua associazione. Se vuoi che venga cancellato anche il modulo d'adesione, chiedilo per email all'indirizzo qui sopra.")}
            </p>
          </section>

          <p className="text-sm text-muted-foreground">
            {t("Per gli altri diritti sui tuoi dati vedi la")}{" "}
            <Link href="/privacy" className="font-medium text-figb underline dark:text-primary">
              {t("Privacy Policy")}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
