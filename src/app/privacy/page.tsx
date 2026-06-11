"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pt-8 pb-24 px-5">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-figb dark:text-primary font-semibold mb-6 inline-block">&larr; Torna alla Home</Link>

        <h1 className="text-2xl font-bold text-foreground font-display mb-6">Privacy Policy e Cookie Policy</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-bold text-foreground">Titolare del trattamento</h2>
            <p className="text-muted-foreground">
              <strong>Federazione Italiana Gioco Bridge (FIGB)</strong>, con sede in Via Tuscolana 65, 00182 Roma.
            </p>
            <p className="text-muted-foreground">
              Contatto: <a href="mailto:info@federbridge.it" className="text-figb dark:text-primary underline">info@federbridge.it</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Responsabile del trattamento</h2>
            <p className="text-muted-foreground">
              Lo sviluppo, la gestione tecnica e l&apos;hosting della piattaforma Bridge LAB sono curati
              a titolo gratuito da <strong>Tourbillon Tech S.r.l.</strong> (nella persona di Alberto Giovanni Gerli,
              Vice Presidente FIGB), in qualità di Responsabile del trattamento ai sensi dell&apos;art. 28 GDPR,
              sulla base di apposito accordo con il Titolare.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Dati raccolti</h2>
            <p className="text-muted-foreground">Bridge LAB raccoglie i seguenti dati:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>Dati di registrazione:</strong> email, nome visualizzato, tipo di profilo (fascia d&apos;età), associazione sportiva (ASD) di appartenenza (opzionale), username BBO (opzionale).</li>
              <li><strong>Dati di utilizzo:</strong> progressi nelle lezioni (moduli completati), punti esperienza (XP), risultati di gioco, badge ottenuti, streak giornaliero.</li>
              <li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, sistema operativo, tramite cookie tecnici e analitici.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Finalità del trattamento</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Erogazione del servizio educativo (lezioni, quiz, pratica al tavolo)</li>
              <li>Salvataggio dei progressi e sincronizzazione tra dispositivi</li>
              <li>Classifiche e funzionalità social (forum, sfide)</li>
              <li>Miglioramento del servizio tramite analisi aggregate e anonime</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Base giuridica</h2>
            <p className="text-muted-foreground">
              Il trattamento si basa sul consenso dell&apos;utente (art. 6.1.a GDPR) espresso al momento della registrazione,
              e sull&apos;esecuzione del contratto di servizio (art. 6.1.b GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Conservazione dei dati</h2>
            <p className="text-muted-foreground">
              I dati personali sono conservati per la durata dell&apos;account. L&apos;utente può richiedere la cancellazione
              in qualsiasi momento contattando il Titolare. I dati vengono eliminati entro 30 giorni dalla richiesta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Servizi di terze parti</h2>
            <p className="text-muted-foreground">I dati possono essere trattati dai seguenti sub-responsabili:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>Supabase Inc.</strong> (database e autenticazione) - server UE (Francoforte)</li>
              <li><strong>Vercel Inc.</strong> (hosting applicazione e analytics)</li>
              <li><strong>Google / YouTube</strong> (video didattici embedded)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Cookie</h2>
            <p className="text-muted-foreground">Bridge LAB utilizza:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>Cookie tecnici:</strong> necessari per il funzionamento (autenticazione, preferenze tema). Non richiedono consenso.</li>
              <li><strong>Cookie analitici:</strong> Vercel Analytics per statistiche aggregate e anonime sull&apos;utilizzo.</li>
              <li><strong>Cookie di terze parti:</strong> YouTube può impostare cookie quando si visualizzano i video embedded.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Non utilizziamo cookie di profilazione o pubblicitari.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Consenso alle Comunicazioni Marketing</h2>
            <p className="text-muted-foreground">
              Con il consenso esplicito dell&apos;utente, la FIGB potrà inviare comunicazioni relative a eventi,
              corsi, tornei e iniziative legate al mondo del bridge. Il consenso viene richiesto tramite un banner
              dedicato all&apos;interno dell&apos;applicazione e può essere revocato in qualsiasi momento dalle
              impostazioni del profilo o contattando il Titolare. La mancata prestazione del consenso non pregiudica
              in alcun modo l&apos;accesso e l&apos;utilizzo della piattaforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Diritti dell&apos;utente</h2>
            <p className="text-muted-foreground">
              Ai sensi del GDPR (artt. 15-22), l&apos;utente ha diritto di: accesso, rettifica, cancellazione,
              limitazione del trattamento, portabilità dei dati, opposizione. Per esercitare tali diritti,
              contattare il Titolare: <a href="mailto:info@federbridge.it" className="text-figb dark:text-primary underline">info@federbridge.it</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Termini e Condizioni</h2>
            <p className="text-muted-foreground">
              Per le condizioni complete di utilizzo della piattaforma, consulta i nostri{" "}
              <Link href="/termini" className="text-figb dark:text-primary underline font-medium">
                Termini e Condizioni d&apos;Uso
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Aggiornamenti</h2>
            <p className="text-muted-foreground">
              Questa policy può essere aggiornata periodicamente. L&apos;ultima revisione risale a marzo 2026.
            </p>
          </section>

          {/* Credits */}
          <section className="pt-4 border-t border-border">
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Bridge LAB è un progetto della Federazione Italiana Gioco Bridge (FIGB) - Commissione Insegnamento.
              Sviluppo e hosting a cura di Alberto Giovanni Gerli / Tourbillon Tech S.r.l., a titolo gratuito.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
