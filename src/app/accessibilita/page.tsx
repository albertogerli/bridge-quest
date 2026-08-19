import type { Metadata } from "next";
import Link from "next/link";
import { FraseConElementi } from "@/components/frase-con-elementi";
import { tServer } from "@/lib/traduzioni-server";

export const metadata: Metadata = {
  title: "Dichiarazione di Accessibilita - BridgeLab",
  description:
    "Dichiarazione di accessibilita della piattaforma BridgeLab. Conformita WCAG 2.2 livello AA, misure adottate e contatti per segnalazioni.",
  alternates: {
    canonical: "/accessibilita",
  },
};

const CLASSE_LINK = "text-figb dark:text-primary hover:underline font-medium";

/** Un collegamento esterno: si aprono tutti allo stesso modo. */
function Esterno({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={CLASSE_LINK}>
      {children}
    </a>
  );
}

function Codice({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1 rounded text-sm">{children}</code>;
}

/**
 * La dichiarazione di accessibilità.
 *
 * ----------------------------------------------------------------------------
 * PERCHÉ QUESTA PAGINA ERA RIMASTA IN ITALIANO
 * ----------------------------------------------------------------------------
 *
 * È un componente SERVER, e `useT()` è un hook: lì non gira. Le altre pagine
 * legali — privacy, termini — erano state rese client apposta per poter
 * tradurre; questa no, e quarantatré frasi restavano italiane anche sotto
 * `/en` senza che niente lo segnalasse.
 *
 * Renderla client sarebbe stato il gesto più corto e il peggiore: è un
 * documento lungo e statico che deve essere indicizzabile, e chi arriva da una
 * ricerca vedrebbe uno scheletro vuoto. Traduce sul server con `tServer()`, che
 * legge la lingua da un'intestazione messa dal proxy — il server l'indirizzo
 * con `/en` non lo vede, perché è una riscrittura.
 *
 * ----------------------------------------------------------------------------
 * LE FRASI SONO INTERE, I COLLEGAMENTI SONO SEGNAPOSTO
 * ----------------------------------------------------------------------------
 *
 * Il testo era spezzato dai link e dai `<strong>` in frammenti come «e con le»,
 * «accessibile al maggior numero possibile di utenti». Frammenti così non si
 * traducono: l'ordine delle parole cambia da una lingua all'altra, e senza la
 * frase intorno non c'è contesto nemmeno per un umano.
 *
 * Qui ogni frase sta nel dizionario per intero, con `{sito}` e `{eaa}` dove
 * vanno i collegamenti, e `FraseConElementi` li rimette al loro posto — che in
 * inglese può essere un altro.
 *
 * Le entità HTML (`&egrave;`, `&apos;`) sono diventate lettere vere: una chiave
 * di dizionario con dentro `&egrave;` è una chiave che nessuno riesce a cercare.
 */
export default async function AccessibilitaPage() {
  const t = await tServer();

  return (
    <div className="min-h-screen bg-background pt-8 pb-24 px-5">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-block mb-8 text-figb dark:text-primary hover:underline text-sm font-medium"
        >
          &larr; {t("Torna alla Home")}
        </Link>

        <h1 className="text-3xl font-extrabold text-foreground font-display mb-8">
          {t("Dichiarazione di Accessibilità")}
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              <FraseConElementi
                testo={t(
                  "La Federazione Italiana Gioco Bridge (FIGB) si impegna a rendere la piattaforma BridgeLab ({sito}) accessibile al maggior numero possibile di utenti, indipendentemente dalle loro capacità o dai dispositivi utilizzati, in conformità con l'{eaa} e con le {agid}.",
                )}
                elementi={{
                  sito: <Esterno href="https://bridgelab.it">bridgelab.it</Esterno>,
                  eaa: (
                    <Esterno href="https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32019L0882">
                      {t("European Accessibility Act (Direttiva UE 2019/882)")}
                    </Esterno>
                  ),
                  agid: (
                    <Esterno href="https://www.agid.gov.it/it/design-servizi/accessibilita">
                      {t("Linee Guida AGID sull'accessibilità dei contenuti web")}
                    </Esterno>
                  ),
                }}
              />
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {t("Standard di riferimento")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <FraseConElementi
                testo={t(
                  "La piattaforma BridgeLab è progettata con l'obiettivo di raggiungere la conformità al livello AA delle {wcag}, pubblicate dal World Wide Web Consortium (W3C). Le WCAG 2.2 definiscono i requisiti tecnici per rendere i contenuti web percepibili, utilizzabili, comprensibili e robusti per tutti gli utenti, compresi coloro che utilizzano tecnologie assistive.",
                )}
                elementi={{
                  wcag: (
                    <Esterno href="https://www.w3.org/TR/WCAG22/">
                      Web Content Accessibility Guidelines (WCAG) 2.2
                    </Esterno>
                  ),
                }}
              />
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {t("Tecnologie utilizzate")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t("L'accessibilità di BridgeLab si basa sulle seguenti tecnologie:")}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>
                <strong>HTML5</strong>{" "}
                {t(
                  "semantico, con uso appropriato di landmark, intestazioni e struttura del documento",
                )}
              </li>
              <li>
                <strong>CSS3</strong>{" "}
                {t("con layout responsivo e supporto per la modalità scura (dark mode)")}
              </li>
              <li>
                <strong>JavaScript</strong>{" "}
                {t("(React / Next.js) con gestione progressiva delle interazioni")}
              </li>
              <li>
                <strong>WAI-ARIA</strong>{" "}
                {t(
                  "(Accessible Rich Internet Applications) per comunicare ruoli, stati e proprietà dei componenti interattivi alle tecnologie assistive",
                )}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {t("Misure di accessibilità adottate")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t(
                "BridgeLab adotta le seguenti misure per garantire l'accessibilità della piattaforma:",
              )}
            </p>

            <h3 className="text-base font-semibold text-foreground/80 mt-4 mb-2">
              {t("Navigazione e struttura")}
            </h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>
                <strong>{t("Skip link")}</strong>:{" "}
                {t(
                  "un collegamento «Vai al contenuto» è disponibile all'inizio di ogni pagina per consentire agli utenti di saltare direttamente al contenuto principale",
                )}
              </li>
              <li>
                <strong>{t("HTML semantico")}</strong>:{" "}
                <FraseConElementi
                  testo={t(
                    "utilizzo coerente di elementi come {main}, {nav}, {section}, {article} e intestazioni gerarchiche ({h1}–{h6})",
                  )}
                  elementi={{
                    main: <Codice>&lt;main&gt;</Codice>,
                    nav: <Codice>&lt;nav&gt;</Codice>,
                    section: <Codice>&lt;section&gt;</Codice>,
                    article: <Codice>&lt;article&gt;</Codice>,
                    h1: <Codice>h1</Codice>,
                    h6: <Codice>h6</Codice>,
                  }}
                />
              </li>
              <li>
                <strong>{t("Navigazione da tastiera")}</strong>:{" "}
                {t(
                  "tutti i collegamenti, pulsanti e controlli interattivi sono raggiungibili e attivabili tramite tastiera",
                )}
              </li>
              <li>
                <strong>{t("Focus visibile")}</strong>:{" "}
                {t(
                  "gli indicatori di focus sono chiaramente visibili per facilitare la navigazione da tastiera",
                )}
              </li>
            </ul>

            <h3 className="text-base font-semibold text-foreground/80 mt-4 mb-2">
              {t("Contenuti e presentazione")}
            </h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>
                <strong>{t("Attributi ARIA")}</strong>:{" "}
                <FraseConElementi
                  testo={t(
                    "etichette {ariaLabel}, {ariaDescribedby} e ruoli ARIA per i componenti interattivi (quiz, minigiochi, menu)",
                  )}
                  elementi={{
                    ariaLabel: <Codice>aria-label</Codice>,
                    ariaDescribedby: <Codice>aria-describedby</Codice>,
                  }}
                />
              </li>
              <li>
                <strong>{t("Testo alternativo")}</strong>:{" "}
                <FraseConElementi
                  testo={t(
                    "le immagini significative dispongono di attributi {alt} descrittivi; le immagini decorative sono contrassegnate con {altVuoto}",
                  )}
                  elementi={{
                    alt: <Codice>alt</Codice>,
                    altVuoto: <Codice>alt=&quot;&quot;</Codice>,
                  }}
                />
              </li>
              <li>
                <strong>{t("Contrasto cromatico")}</strong>:{" "}
                {t(
                  "i rapporti di contrasto tra testo e sfondo rispettano i requisiti WCAG AA (almeno 4,5:1 per il testo normale, 3:1 per il testo grande)",
                )}
              </li>
              <li>
                <strong>{t("Design responsivo")}</strong>:{" "}
                {t(
                  "la piattaforma si adatta a schermi di ogni dimensione, da smartphone a monitor desktop",
                )}
              </li>
              <li>
                <strong>{t("Modalità scura")}</strong>:{" "}
                {t(
                  "è disponibile una modalità scura (dark mode) per ridurre l'affaticamento visivo",
                )}
              </li>
            </ul>

            <h3 className="text-base font-semibold text-foreground/80 mt-4 mb-2">
              {t("Inclusività e adattamento")}
            </h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>
                <strong>{t("Profili utente per fasce d'età")}</strong>:{" "}
                {t(
                  "la piattaforma offre quattro profili (Junior, Giovane, Adulto, Senior) che adattano l'esperienza didattica, incluse le dimensioni del testo e lo stile comunicativo, per rispondere alle esigenze di utenti di ogni età",
                )}
              </li>
              <li>
                <strong>{t("Video didattici")}</strong>:{" "}
                {t(
                  "i video sono ospitati su YouTube, che fornisce sottotitoli automatici e controlli di riproduzione accessibili",
                )}
              </li>
              <li>
                <strong>{t("Linguaggio chiaro")}</strong>:{" "}
                {t(
                  "i contenuti didattici utilizzano un linguaggio semplice, diretto e accompagnato da spiegazioni per i termini tecnici del bridge",
                )}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {t("Limitazioni note")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t(
                "Nonostante gli sforzi per garantire la piena accessibilità, alcune aree della piattaforma presentano limitazioni note:",
              )}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>
                <strong>{t("Minigiochi interattivi")}</strong>:{" "}
                {t(
                  "alcuni moduli di pratica al tavolo (gioco della carta, dichiarazione interattiva) utilizzano interfacce drag-and-drop e visualizzazioni di carte che potrebbero avere un'accessibilità da tastiera limitata. Stiamo lavorando per aggiungere modalità di interazione alternative",
                )}
              </li>
              <li>
                <strong>{t("Infografiche")}</strong>:{" "}
                {t(
                  "alcune infografiche didattiche sono fornite come immagini e potrebbero non essere completamente fruibili tramite screen reader. I contenuti equivalenti sono disponibili nel testo della lezione",
                )}
              </li>
              <li>
                <strong>{t("Contenuti video di terze parti")}</strong>:{" "}
                {t(
                  "i video incorporati da YouTube dipendono dall'accessibilità del player di YouTube e dalla qualità dei sottotitoli automatici",
                )}
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              {t(
                "Ci impegniamo a risolvere progressivamente queste limitazioni e a migliorare continuamente l'accessibilità della piattaforma.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {t("Compatibilità con browser e tecnologie assistive")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(
                "BridgeLab è progettata per essere compatibile con i principali browser moderni (Chrome, Firefox, Safari, Edge) e con le più diffuse tecnologie assistive, tra cui screen reader (VoiceOver, NVDA, JAWS), navigazione da tastiera e strumenti di ingrandimento.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {t("Feedback e segnalazioni")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(
                "Accogliamo con favore segnalazioni e suggerimenti relativi all'accessibilità della piattaforma. Se riscontrate barriere di accessibilità o difficoltà nell'utilizzo di BridgeLab, vi invitiamo a contattarci:",
              )}
            </p>
            <ul className="list-none pl-0 text-muted-foreground space-y-1 mt-3">
              <li>
                <strong>{t("Email:")}</strong>{" "}
                <a href="mailto:info@bridgelab.it" className={CLASSE_LINK}>
                  info@bridgelab.it
                </a>
              </li>
              <li>
                <strong>{t("Ente di riferimento:")}</strong>{" "}
                <Esterno href="https://www.federbridge.it">
                  {t("Federazione Italiana Gioco Bridge (FIGB)")}
                </Esterno>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              {t(
                "Ci impegniamo a rispondere alle segnalazioni entro 10 giorni lavorativi e a proporre soluzioni adeguate nel più breve tempo possibile.",
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {t("Procedura di attuazione")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <FraseConElementi
                testo={t(
                  "Qualora la risposta alla segnalazione non fosse soddisfacente, è possibile rivolgersi al {difensore} (Agenzia per l'Italia Digitale), ai sensi dell'art. 3-quinquies della Legge 9 gennaio 2004, n. 4.",
                )}
                elementi={{
                  difensore: (
                    <Esterno href="https://www.agid.gov.it/it/design-servizi/accessibilita">
                      {t("Difensore civico per il digitale presso AGID")}
                    </Esterno>
                  ),
                }}
              />
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {t("Riferimenti normativi")}
            </h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>
                <Esterno href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</Esterno>{" "}
                &mdash; Web Content Accessibility Guidelines (W3C)
              </li>
              <li>
                <Esterno href="https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32019L0882">
                  {t("Direttiva UE 2019/882")}
                </Esterno>{" "}
                &mdash; European Accessibility Act
              </li>
              <li>
                <Esterno href="https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32016L2102">
                  {t("Direttiva UE 2016/2102")}
                </Esterno>{" "}
                &mdash;{" "}
                {t(
                  "Accessibilità dei siti web e delle applicazioni mobili degli enti pubblici",
                )}
              </li>
              <li>
                {t(
                  "Legge 9 gennaio 2004, n. 4 (Legge Stanca) — Disposizioni per favorire l'accesso dei soggetti disabili agli strumenti informatici",
                )}
              </li>
              <li>
                <Esterno href="https://www.agid.gov.it/it/design-servizi/accessibilita">
                  {t("Linee Guida AGID sull'accessibilità")}
                </Esterno>
              </li>
            </ul>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <FraseConElementi
                testo={t(
                  "La presente dichiarazione è stata redatta in data {data} e viene aggiornata periodicamente in funzione delle evoluzioni della piattaforma e della normativa di riferimento.",
                )}
                elementi={{ data: <strong>{t("marzo 2026")}</strong> }}
              />
            </p>
          </section>

          <section className="pt-2">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              {t("Sviluppo: Tourbillon Tech S.r.l. per FIGB")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
