"use client";

import Link from "next/link";
import { useT } from "@/contexts/traduzioni-provider";

export default function PrivacyPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-background pt-8 pb-24 px-5">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-figb dark:text-primary font-semibold mb-6 inline-block">&larr; Torna alla Home</Link>

        <h1 className="text-2xl font-bold text-foreground font-display mb-6">{t("Privacy Policy e Cookie Policy")}</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Titolare del trattamento")}</h2>
            <p className="text-muted-foreground">
              <strong>{t("Federazione Italiana Gioco Bridge (FIGB)")}</strong>, con sede in Via Tuscolana 65, 00182 Roma.
            </p>
            <p className="text-muted-foreground">
              {t("Contatto:")} <a href="mailto:info@federbridge.it" className="text-figb dark:text-primary underline">info@federbridge.it</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Responsabile del trattamento")}</h2>
            <p className="text-muted-foreground">
              Lo sviluppo, la gestione tecnica e l&apos;hosting della piattaforma Bridge LAB sono curati
              a titolo gratuito da <strong>{t("Tourbillon Tech S.r.l.")}</strong> (nella persona di Alberto Giovanni Gerli,
              Vice Presidente FIGB), in qualità di Responsabile del trattamento ai sensi dell&apos;art. 28 GDPR,
              sulla base di apposito accordo con il Titolare.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Dati raccolti")}</h2>
            <p className="text-muted-foreground">{t("Bridge LAB raccoglie i seguenti dati:")}</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>{t("Dati di registrazione:")}</strong>{t("email, nome visualizzato, tipo di profilo (fascia d'età), associazione sportiva (ASD) di appartenenza (opzionale), username BBO (opzionale).")}</li>
              <li><strong>{t("Dati di utilizzo:")}</strong> progressi nelle lezioni (moduli completati), punti esperienza (XP), risultati di gioco, badge ottenuti, streak giornaliero.</li>
              <li><strong>{t("Dati tecnici:")}</strong> indirizzo IP, tipo di browser, sistema operativo, tramite cookie tecnici e analitici.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Finalità del trattamento")}</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>{t("Erogazione del servizio educativo (lezioni, quiz, pratica al tavolo)")}</li>
              <li>{t("Salvataggio dei progressi e sincronizzazione tra dispositivi")}</li>
              <li>{t("Classifiche e funzionalità social (forum, sfide)")}</li>
              <li>{t("Miglioramento del servizio tramite analisi aggregate e anonime")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Base giuridica")}</h2>
            <p className="text-muted-foreground">
              {t("Il trattamento si basa sul consenso dell'utente (art. 6.1.a GDPR) espresso al momento della registrazione, e sull'esecuzione del contratto di servizio (art. 6.1.b GDPR).")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Conservazione dei dati")}</h2>
            <p className="text-muted-foreground">
              {t("I dati personali sono conservati per la durata dell'account. L'utente può richiedere la cancellazione in qualsiasi momento contattando il Titolare. I dati vengono eliminati entro 30 giorni dalla richiesta.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Servizi di terze parti")}</h2>
            <p className="text-muted-foreground">{t("I dati possono essere trattati dai seguenti sub-responsabili:")}</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>{t("Supabase Inc.")}</strong> (database e autenticazione) - server UE (Francoforte)</li>
              <li><strong>{t("Vercel Inc.")}</strong> (hosting applicazione e analytics)</li>
              <li><strong>{t("Google / YouTube")}</strong> (video didattici embedded)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Cookie")}</h2>
            <p className="text-muted-foreground">{t("Bridge LAB utilizza:")}</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>{t("Cookie tecnici:")}</strong> necessari per il funzionamento (autenticazione, preferenze tema). Non richiedono consenso.</li>
              <li><strong>{t("Cookie analitici:")}</strong>{t("Vercel Analytics per statistiche aggregate e anonime sull'utilizzo.")}</li>
              <li><strong>{t("Cookie di terze parti:")}</strong> {t("YouTube può impostare cookie quando si visualizzano i video embedded.")}</li>
              <li>
                <strong>{t("Cookie statistici e pubblicitari:")}</strong> Google Analytics,
                Google Ads e Meta Pixel, utilizzati per misurare l&apos;efficacia
                delle campagne con cui facciamo conoscere il bridge e per non
                mostrare gli annunci a chi è già iscritto.{" "}
                <strong>{t("Vengono attivati solo con il tuo consenso")}</strong> e
                restano disattivati se scegli &laquo;Solo necessari&raquo;.
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              {t("I cookie statistici e pubblicitari comportano un trasferimento di dati verso Google LLC e Meta Platforms Ireland Ltd. Puoi cambiare idea in qualsiasi momento cancellando i dati del sito dal tuo browser: la scelta ti verrà richiesta di nuovo alla visita successiva.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Consenso alle Comunicazioni Marketing")}</h2>
            <p className="text-muted-foreground">
              {t("Con il consenso esplicito dell'utente, la FIGB potrà inviare comunicazioni relative a eventi, corsi, tornei e iniziative legate al mondo del bridge. Il consenso viene richiesto tramite un banner dedicato all'interno dell'applicazione e può essere revocato in qualsiasi momento dalle impostazioni del profilo o contattando il Titolare. La mancata prestazione del consenso non pregiudica in alcun modo l'accesso e l'utilizzo della piattaforma.")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Diritti dell'utente")}</h2>
            <p className="text-muted-foreground">
              Ai sensi del GDPR (artt. 15-22), l&apos;utente ha diritto di: accesso, rettifica, cancellazione,
              limitazione del trattamento, portabilità dei dati, opposizione. Per esercitare tali diritti,
              contattare il Titolare: <a href="mailto:info@federbridge.it" className="text-figb dark:text-primary underline">info@federbridge.it</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Termini e Condizioni")}</h2>
            <p className="text-muted-foreground">
              Per le condizioni complete di utilizzo della piattaforma, consulta i nostri{" "}
              <Link href="/termini" className="text-figb dark:text-primary underline font-medium">
                {t("Termini e Condizioni d'Uso")}
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">{t("Aggiornamenti")}</h2>
            <p className="text-muted-foreground">
              {t("Questa policy può essere aggiornata periodicamente. L'ultima revisione risale a marzo 2026.")}
            </p>
          </section>

          {/* Credits */}
          <section className="pt-4 border-t border-border">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              {t("Bridge LAB è un progetto della Federazione Italiana Gioco Bridge (FIGB) - Commissione Insegnamento. Sviluppo e hosting a cura di Alberto Giovanni Gerli / Tourbillon Tech S.r.l., a titolo gratuito.")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
