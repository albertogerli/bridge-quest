"use client";

import Link from "next/link";

export default function TerminiPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0f1219] pt-8 pb-24 px-5">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-block mb-8 text-[#003DA5] hover:underline text-sm font-medium"
        >
          &larr; Torna alla Home
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
          Termini e Condizioni d&apos;Uso
        </h1>

        {/* Premessa */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Premessa
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            BridgeLab è una piattaforma educativa digitale sviluppata dalla
            Federazione Italiana Gioco Bridge (FIGB) con l&apos;obiettivo di
            promuovere e insegnare il gioco del bridge a un pubblico ampio e
            diversificato. La piattaforma offre corsi interattivi, lezioni
            video, esercizi pratici e strumenti di gamification per rendere
            l&apos;apprendimento del bridge accessibile, coinvolgente e
            divertente. I presenti Termini e Condizioni regolano l&apos;accesso e
            l&apos;utilizzo della piattaforma BridgeLab, accessibile
            all&apos;indirizzo{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              bridgelab.it
            </span>{" "}
            e tramite eventuali applicazioni mobili ad essa collegate.
          </p>
        </section>

        {/* Titolare */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Titolare del Servizio
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Il titolare della piattaforma BridgeLab è la{" "}
            <strong>Federazione Italiana Gioco Bridge (FIGB)</strong>, con sede
            legale in Via Tuscolana 65, 00182 Roma (RM), Italia. Lo sviluppo
            tecnico della piattaforma è curato da{" "}
            <strong>Tourbillon Tech S.r.l.</strong> su incarico della FIGB. Ogni
            riferimento alla &quot;FIGB&quot; nei presenti termini si intende
            comprensivo dei soggetti da essa incaricati per lo sviluppo e la
            gestione tecnica della piattaforma.
          </p>
        </section>

        {/* Accettazione */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Accettazione dei Termini
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            L&apos;accesso e l&apos;utilizzo della piattaforma BridgeLab
            implicano la piena e incondizionata accettazione dei presenti
            Termini e Condizioni d&apos;Uso. Se l&apos;utente non concorda con
            uno o più punti dei presenti termini, è tenuto a non utilizzare la
            piattaforma. La FIGB si riserva il diritto di modificare i presenti
            termini in qualsiasi momento; l&apos;uso continuato della
            piattaforma successivamente alla pubblicazione delle modifiche
            costituisce accettazione delle stesse.
          </p>
        </section>

        {/* Account */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Account e Registrazione
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Per accedere a determinate funzionalità della piattaforma potrebbe
            essere necessaria la creazione di un account personale.
            L&apos;utente è responsabile della veridicità e
            dell&apos;aggiornamento dei dati forniti in fase di registrazione.
            L&apos;utente è altresì responsabile della custodia e della
            riservatezza delle proprie credenziali di accesso (nome utente e
            password) e di tutte le attività che si svolgono tramite il proprio
            account. In caso di accesso non autorizzato o di qualsiasi
            violazione della sicurezza del proprio account, l&apos;utente è
            tenuto a informare tempestivamente la FIGB. La FIGB si riserva il
            diritto di sospendere o eliminare account che risultino inattivi,
            fraudolenti o in violazione dei presenti termini.
          </p>
        </section>

        {/* Contenuti */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Proprietà Intellettuale e Contenuti
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Tutti i contenuti presenti sulla piattaforma BridgeLab — inclusi, a
            titolo esemplificativo e non esaustivo, testi didattici, video
            lezioni, immagini, grafiche, infografiche, esercizi, quiz, software,
            loghi e marchi — sono di proprietà esclusiva della FIGB o dei
            rispettivi titolari dei diritti e sono protetti dalla normativa
            italiana e internazionale in materia di diritto d&apos;autore e
            proprietà intellettuale. È severamente vietata la riproduzione,
            distribuzione, modifica, pubblicazione, trasmissione o qualsiasi
            altro utilizzo dei contenuti della piattaforma senza la preventiva
            autorizzazione scritta della FIGB. L&apos;utente può fruire dei
            contenuti esclusivamente per uso personale e non commerciale,
            nell&apos;ambito delle funzionalità offerte dalla piattaforma.
          </p>
        </section>

        {/* Uso consentito */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Uso Consentito della Piattaforma
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            La piattaforma BridgeLab è destinata esclusivamente
            all&apos;apprendimento e alla pratica del gioco del bridge.
            L&apos;utente si impegna a utilizzare la piattaforma in modo lecito,
            corretto e conforme ai presenti termini. In particolare, è vietato:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-3 space-y-1 leading-relaxed">
            <li>
              Utilizzare la piattaforma per scopi commerciali non autorizzati
              dalla FIGB;
            </li>
            <li>
              Copiare, rivendere o ridistribuire i contenuti della piattaforma;
            </li>
            <li>
              Tentare di accedere in modo non autorizzato ai sistemi, ai server
              o alle reti collegati alla piattaforma;
            </li>
            <li>
              Caricare o trasmettere materiale illecito, offensivo, diffamatorio
              o che violi i diritti di terzi;
            </li>
            <li>
              Utilizzare bot, scraper o altri strumenti automatizzati per
              accedere alla piattaforma;
            </li>
            <li>
              Compiere qualsiasi azione che possa compromettere il funzionamento
              o la sicurezza della piattaforma.
            </li>
          </ul>
        </section>

        {/* Dati e privacy */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Trattamento dei Dati Personali
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Il trattamento dei dati personali degli utenti è disciplinato dalla
            nostra{" "}
            <Link
              href="/privacy"
              className="text-[#003DA5] hover:underline font-medium"
            >
              Informativa sulla Privacy
            </Link>
            , alla quale si rimanda per ogni dettaglio in merito alle modalità di
            raccolta, utilizzo, conservazione e protezione dei dati. Utilizzando
            la piattaforma, l&apos;utente dichiara di aver preso visione
            dell&apos;informativa e di acconsentire al trattamento dei propri
            dati secondo quanto ivi previsto.
          </p>
        </section>

        {/* Comunicazioni */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Comunicazioni e Newsletter
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Con il consenso esplicito dell&apos;utente, la FIGB potrà inviare
            comunicazioni relative a eventi, corsi, tornei, novità e iniziative
            legate al mondo del bridge. Tali comunicazioni potranno essere
            inviate tramite e-mail, notifiche in-app o altri canali indicati
            dall&apos;utente. L&apos;utente può revocare il proprio consenso
            alla ricezione di tali comunicazioni in qualsiasi momento,
            utilizzando l&apos;apposita funzione disponibile nelle impostazioni
            del proprio profilo oppure tramite il link di cancellazione presente
            in ogni comunicazione ricevuta. La revoca del consenso non pregiudica
            la liceità del trattamento basato sul consenso prestato prima della
            revoca.
          </p>
        </section>

        {/* Limitazione responsabilità */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Limitazione di Responsabilità
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            La piattaforma BridgeLab è fornita &quot;così com&apos;è&quot; (as
            is) e &quot;come disponibile&quot; (as available), senza garanzie di
            alcun tipo, esplicite o implicite. La FIGB si impegna a garantire il
            miglior funzionamento possibile della piattaforma, ma non garantisce
            che il servizio sia privo di errori, ininterrotto o completamente
            sicuro. In nessun caso la FIGB, i suoi collaboratori, partner o
            fornitori saranno responsabili per danni diretti, indiretti,
            incidentali, speciali o consequenziali derivanti dall&apos;utilizzo o
            dall&apos;impossibilità di utilizzare la piattaforma, inclusi, a
            titolo esemplificativo, la perdita di dati, l&apos;interruzione
            dell&apos;attività o il mancato raggiungimento di risultati di
            apprendimento attesi. L&apos;utente utilizza la piattaforma a
            proprio rischio e pericolo.
          </p>
        </section>

        {/* Modifiche */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Modifiche ai Termini
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            La FIGB si riserva il diritto di modificare, integrare o aggiornare
            i presenti Termini e Condizioni in qualsiasi momento, pubblicando la
            versione aggiornata sulla piattaforma. Le modifiche saranno
            efficaci dal momento della loro pubblicazione. È responsabilità
            dell&apos;utente consultare periodicamente i presenti termini per
            verificare eventuali aggiornamenti. L&apos;uso continuato della
            piattaforma successivamente alla pubblicazione di modifiche
            costituisce piena accettazione dei termini aggiornati.
          </p>
        </section>

        {/* Legge applicabile */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Legge Applicabile e Foro Competente
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            I presenti Termini e Condizioni sono regolati dalla legge italiana.
            Per qualsiasi controversia derivante dall&apos;interpretazione,
            validità o esecuzione dei presenti termini, sarà competente in via
            esclusiva il Foro di Roma, salvo il caso in cui l&apos;utente rivesta
            la qualifica di consumatore ai sensi del D.Lgs. 206/2005 (Codice del
            Consumo), nel qual caso sarà competente il foro del luogo di
            residenza o domicilio del consumatore.
          </p>
        </section>

        {/* Contatti */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Contatti
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Per qualsiasi domanda, segnalazione o richiesta relativa ai presenti
            Termini e Condizioni, è possibile contattare la FIGB al seguente
            indirizzo e-mail:{" "}
            <a
              href="mailto:info@federbridge.it"
              className="text-[#003DA5] hover:underline font-medium"
            >
              info@federbridge.it
            </a>
            .
          </p>
        </section>

        {/* Data aggiornamento */}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-12 border-t border-gray-200 dark:border-gray-700 pt-6">
          Ultimo aggiornamento: Marzo 2026
        </p>
      </div>
    </div>
  );
}
