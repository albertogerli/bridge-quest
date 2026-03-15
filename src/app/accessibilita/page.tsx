import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dichiarazione di Accessibilita - BridgeLab",
  description:
    "Dichiarazione di accessibilita della piattaforma BridgeLab. Conformita WCAG 2.2 livello AA, misure adottate e contatti per segnalazioni.",
  alternates: {
    canonical: "/accessibilita",
  },
};

export default function AccessibilitaPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0f1219] pt-8 pb-24 px-5">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-block mb-8 text-[#003DA5] hover:underline text-sm font-medium"
        >
          &larr; Torna alla Home
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
          Dichiarazione di Accessibilit&agrave;
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          {/* Introduzione */}
          <section>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              La{" "}
              <strong>
                Federazione Italiana Gioco Bridge (FIGB)
              </strong>{" "}
              si impegna a rendere la piattaforma{" "}
              <strong>BridgeLab</strong> (
              <a
                href="https://bridgelab.it"
                className="text-[#003DA5] hover:underline font-medium"
              >
                bridgelab.it
              </a>
              ) accessibile al maggior numero possibile di utenti, indipendentemente
              dalle loro capacit&agrave; o dai dispositivi utilizzati, in conformit&agrave;
              con il{" "}
              <a
                href="https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32019L0882"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#003DA5] hover:underline font-medium"
              >
                European Accessibility Act (Direttiva UE 2019/882)
              </a>{" "}
              e con le{" "}
              <a
                href="https://www.agid.gov.it/it/design-servizi/accessibilita"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#003DA5] hover:underline font-medium"
              >
                Linee Guida AGID sull&apos;accessibilit&agrave; dei contenuti web
              </a>
              .
            </p>
          </section>

          {/* Standard di riferimento */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Standard di riferimento
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              La piattaforma BridgeLab &egrave; progettata con l&apos;obiettivo di
              raggiungere la conformit&agrave; al livello{" "}
              <strong>AA</strong> delle{" "}
              <a
                href="https://www.w3.org/TR/WCAG22/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#003DA5] hover:underline font-medium"
              >
                Web Content Accessibility Guidelines (WCAG) 2.2
              </a>
              , pubblicate dal World Wide Web Consortium (W3C). Le WCAG 2.2
              definiscono i requisiti tecnici per rendere i contenuti web percepibili,
              utilizzabili, comprensibili e robusti per tutti gli utenti, compresi
              coloro che utilizzano tecnologie assistive.
            </p>
          </section>

          {/* Tecnologie utilizzate */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Tecnologie utilizzate
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              L&apos;accessibilit&agrave; di BridgeLab si basa sulle seguenti
              tecnologie:
            </p>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <strong>HTML5</strong> semantico, con uso appropriato di landmark,
                intestazioni e struttura del documento
              </li>
              <li>
                <strong>CSS3</strong> con layout responsivo e supporto per la
                modalit&agrave; scura (dark mode)
              </li>
              <li>
                <strong>JavaScript</strong> (React / Next.js) con gestione
                progressiva delle interazioni
              </li>
              <li>
                <strong>WAI-ARIA</strong> (Accessible Rich Internet Applications)
                per comunicare ruoli, stati e propriet&agrave; dei componenti
                interattivi alle tecnologie assistive
              </li>
            </ul>
          </section>

          {/* Misure adottate */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Misure di accessibilit&agrave; adottate
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              BridgeLab adotta le seguenti misure per garantire
              l&apos;accessibilit&agrave; della piattaforma:
            </p>

            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">
              Navigazione e struttura
            </h3>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <strong>Skip link</strong>: un collegamento &ldquo;Vai al
                contenuto&rdquo; &egrave; disponibile all&apos;inizio di ogni pagina
                per consentire agli utenti di saltare direttamente al contenuto
                principale
              </li>
              <li>
                <strong>HTML semantico</strong>: utilizzo coerente di elementi come{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  &lt;main&gt;
                </code>
                ,{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  &lt;nav&gt;
                </code>
                ,{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  &lt;section&gt;
                </code>
                ,{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  &lt;article&gt;
                </code>{" "}
                e intestazioni gerarchiche (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  h1
                </code>
                &ndash;
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  h6
                </code>
                )
              </li>
              <li>
                <strong>Navigazione da tastiera</strong>: tutti i collegamenti,
                pulsanti e controlli interattivi sono raggiungibili e attivabili
                tramite tastiera
              </li>
              <li>
                <strong>Focus visibile</strong>: gli indicatori di focus sono
                chiaramente visibili per facilitare la navigazione da tastiera
              </li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">
              Contenuti e presentazione
            </h3>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <strong>Attributi ARIA</strong>: etichette{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  aria-label
                </code>
                ,{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  aria-describedby
                </code>{" "}
                e ruoli ARIA per i componenti interattivi (quiz, minigiochi, menu)
              </li>
              <li>
                <strong>Testo alternativo</strong>: le immagini significative
                dispongono di attributi{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  alt
                </code>{" "}
                descrittivi; le immagini decorative sono contrassegnate con{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">
                  alt=&quot;&quot;
                </code>
              </li>
              <li>
                <strong>Contrasto cromatico</strong>: i rapporti di contrasto tra
                testo e sfondo rispettano i requisiti WCAG AA (almeno 4,5:1 per il
                testo normale, 3:1 per il testo grande)
              </li>
              <li>
                <strong>Design responsivo</strong>: la piattaforma si adatta a
                schermi di ogni dimensione, da smartphone a monitor desktop
              </li>
              <li>
                <strong>Modalit&agrave; scura</strong>: &egrave; disponibile una
                modalit&agrave; scura (dark mode) per ridurre l&apos;affaticamento
                visivo
              </li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">
              Inclusivit&agrave; e adattamento
            </h3>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <strong>Profili utente per fasce d&apos;et&agrave;</strong>: la
                piattaforma offre quattro profili (Junior, Giovane, Adulto, Senior)
                che adattano l&apos;esperienza didattica, incluse le dimensioni del
                testo e lo stile comunicativo, per rispondere alle esigenze di utenti
                di ogni et&agrave;
              </li>
              <li>
                <strong>Video didattici</strong>: i video sono ospitati su YouTube,
                che fornisce sottotitoli automatici e controlli di riproduzione
                accessibili
              </li>
              <li>
                <strong>Linguaggio chiaro</strong>: i contenuti didattici utilizzano
                un linguaggio semplice, diretto e accompagnato da spiegazioni per i
                termini tecnici del bridge
              </li>
            </ul>
          </section>

          {/* Limitazioni note */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Limitazioni note
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              Nonostante gli sforzi per garantire la piena accessibilit&agrave;,
              alcune aree della piattaforma presentano limitazioni note:
            </p>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <strong>Minigiochi interattivi</strong>: alcuni moduli di pratica al
                tavolo (gioco della carta, dichiarazione interattiva) utilizzano
                interfacce drag-and-drop e visualizzazioni di carte che potrebbero
                avere un&apos;accessibilit&agrave; da tastiera limitata. Stiamo
                lavorando per aggiungere modalit&agrave; di interazione alternative
              </li>
              <li>
                <strong>Infografiche</strong>: alcune infografiche didattiche sono
                fornite come immagini e potrebbero non essere completamente fruibili
                tramite screen reader. I contenuti equivalenti sono disponibili nel
                testo della lezione
              </li>
              <li>
                <strong>Contenuti video di terze parti</strong>: i video incorporati
                da YouTube dipendono dall&apos;accessibilit&agrave; del player di
                YouTube e dalla qualit&agrave; dei sottotitoli automatici
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
              Ci impegniamo a risolvere progressivamente queste limitazioni e a
              migliorare continuamente l&apos;accessibilit&agrave; della piattaforma.
            </p>
          </section>

          {/* Compatibilita */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Compatibilit&agrave; con browser e tecnologie assistive
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              BridgeLab &egrave; progettata per essere compatibile con i principali
              browser moderni (Chrome, Firefox, Safari, Edge) e con le pi&ugrave;
              diffuse tecnologie assistive, tra cui screen reader (VoiceOver, NVDA,
              JAWS), navigazione da tastiera e strumenti di ingrandimento.
            </p>
          </section>

          {/* Feedback e contatti */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Feedback e segnalazioni
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Accogliamo con favore segnalazioni e suggerimenti relativi
              all&apos;accessibilit&agrave; della piattaforma. Se riscontrate
              barriere di accessibilit&agrave; o difficolt&agrave;
              nell&apos;utilizzo di BridgeLab, vi invitiamo a contattarci:
            </p>
            <ul className="list-none pl-0 text-gray-600 dark:text-gray-400 space-y-1 mt-3">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:info@bridgelab.it"
                  className="text-[#003DA5] hover:underline font-medium"
                >
                  info@bridgelab.it
                </a>
              </li>
              <li>
                <strong>Ente di riferimento:</strong>{" "}
                <a
                  href="https://www.federbridge.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#003DA5] hover:underline font-medium"
                >
                  Federazione Italiana Gioco Bridge (FIGB)
                </a>
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
              Ci impegniamo a rispondere alle segnalazioni entro 10 giorni lavorativi
              e a proporre soluzioni adeguate nel pi&ugrave; breve tempo possibile.
            </p>
          </section>

          {/* Procedura di attuazione */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Procedura di attuazione
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Qualora la risposta alla segnalazione non fosse soddisfacente, &egrave;
              possibile rivolgersi al{" "}
              <a
                href="https://www.agid.gov.it/it/design-servizi/accessibilita"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#003DA5] hover:underline font-medium"
              >
                Difensore civico per il digitale presso AGID
              </a>{" "}
              (Agenzia per l&apos;Italia Digitale), ai sensi dell&apos;art. 3-quinquies
              della Legge 9 gennaio 2004, n. 4.
            </p>
          </section>

          {/* Riferimenti normativi */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Riferimenti normativi
            </h2>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <a
                  href="https://www.w3.org/TR/WCAG22/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#003DA5] hover:underline"
                >
                  WCAG 2.2
                </a>{" "}
                &mdash; Web Content Accessibility Guidelines (W3C)
              </li>
              <li>
                <a
                  href="https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32019L0882"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#003DA5] hover:underline"
                >
                  Direttiva UE 2019/882
                </a>{" "}
                &mdash; European Accessibility Act
              </li>
              <li>
                <a
                  href="https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32016L2102"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#003DA5] hover:underline"
                >
                  Direttiva UE 2016/2102
                </a>{" "}
                &mdash; Accessibilit&agrave; dei siti web e delle applicazioni
                mobili degli enti pubblici
              </li>
              <li>
                Legge 9 gennaio 2004, n. 4 (Legge Stanca) &mdash; Disposizioni per
                favorire l&apos;accesso dei soggetti disabili agli strumenti
                informatici
              </li>
              <li>
                <a
                  href="https://www.agid.gov.it/it/design-servizi/accessibilita"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#003DA5] hover:underline"
                >
                  Linee Guida AGID sull&apos;accessibilit&agrave;
                </a>
              </li>
            </ul>
          </section>

          {/* Data dichiarazione */}
          <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              La presente dichiarazione &egrave; stata redatta in data{" "}
              <strong>marzo 2026</strong> e viene aggiornata periodicamente in
              funzione delle evoluzioni della piattaforma e della normativa di
              riferimento.
            </p>
          </section>

          {/* Credits */}
          <section className="pt-2">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
              Sviluppo: Tourbillon Tech S.r.l. per FIGB
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
