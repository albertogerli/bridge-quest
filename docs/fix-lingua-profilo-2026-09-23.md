# Preferenza lingua: errore di rete e conferma prematura

## Evidenza disponibile

Segnalazione Sentry 148963520, fornita dall'utente: 23 settembre 2026,
16:37:39 UTC, release `8e8ef783e9d6fa383897f2527a95f8c25e022490`,
pagina `/gioca/mano-del-giorno`, scope `lingua:profilo`, eccezione gestita
`TypeError: Failed to fetch` verso Supabase.

Lo scope corrisponde a `src/components/ricorda-lingua.tsx`, montato nel layout:
salva la lingua preferita per le email. Non è una scrittura del risultato
della mano. Il riferimento al chunk `global-error` nello stack non prova
che sia comparsa una schermata di errore: la segnalazione passa dal wrapper
condiviso `reportError`.

La segnalazione precede il rilascio auth `6ba0100` (READY alle 17:12 UTC).
Non è evidenza di una regressione introdotta da quel rilascio. L'aggiornamento
SDK non bastava a correggere questo flusso: i retry automatici di PostgREST
riguardano GET/HEAD, mentre questo salvataggio usa PATCH.

Non sono disponibili l'evento completo, i breadcrumb o i log del dispositivo.
La causa iniziale del fallimento di rete è quindi **non determinabile**:
non si può attribuirla con certezza a connessione mobile, Supabase, DNS,
CORS o cancellazione della pagina.

## Difetti verificati nel codice

- La lingua era marcata come già scritta **prima** della risposta: una richiesta
  fallita non veniva recuperata nello stesso mount.
- La deduplicazione considerava solo la lingua, non l'account.
- Mancava la gestione delle rejection inattese della promise.
- Un aggiornamento senza errori ma con zero righe modificate era indistinguibile
  da un salvataggio riuscito.
- La vecchia eccezione per `PGRST204` nascondeva una colonna mancante anche dopo
  la fase di migrazione.

## Correzione

La conferma viene registrata solo con risposta senza errori e conteggio esatto
di una riga modificata. Si richiede solo il conteggio: non si leggono campi
personali del profilo. Il filtro per proprietario e le policy esistenti restano
invariati; nessuna modifica a schema, privilegi, dipendenze o filtri Sentry.

Per gli errori di trasporto riconosciuti e HTTP 502/503/504: massimo tre richieste,
con attese di 1 e 3 secondi. Se il browser dichiara di essere offline, si aspetta
il ritorno della connessione senza consumare richieste. Permessi, autenticazione,
schema, errori inattesi e zero righe modificate vengono segnalati subito.
Un errore temporaneo recuperato non genera un allarme; uno persistente viene
segnalato una volta dopo l'esaurimento dei tentativi.

Le scritture sono serializzate nello stesso componente. Cambi di lingua/account,
logout e smontaggio invalidano i tentativi obsoleti e liberano timer e listener.
Le richieste già inviate possono terminare: non sono promesse cancellabili né
una garanzia di ordinamento fra dispositivi o schede diverse.

## Verifiche

- 30 test mirati sul componente con React e SDK Supabase reale, trasporto simulato
  verso un dominio `.invalid`: nessun collegamento a database remoti.
- Prova aggiuntiva sul database isolato `127.0.0.1:56321`, schema/ACL del progetto:
  account sintetico autenticato, PATCH lingua inglese, HTTP 204 e `count: 1`;
  lettura di conferma della sola lingua; filtro su profilo inesistente,
  HTTP 204 e `count: 0`. Account sintetico eliminato nel blocco `finally`.
- Coperti: errori Chrome/Firefox/Safari, rete assente, recupero, esaurimento retry,
  permessi negati, colonna assente, AbortError inatteso, zero righe, cambio account,
  logout/login, React StrictMode, cambi rapidi di lingua, cleanup e rejection.
- Suite completa: **1.715 test superati, 5 saltati**, 117 file superati e 3 saltati.
  TypeScript, ESLint e gate traduzioni superati. Build di produzione locale riuscito.
- Browser, suite lingua senza retry: **14 superati, 1 fallito**. Il fallimento è
  a `e2e/lingua.spec.ts:213`, `browserContext.close: Target page, context or browser
  has been closed`, dopo il superamento delle asserzioni sulla pagina. Lo stesso
  errore di chiusura era documentato prima della modifica nel referto auth.
  Il caso ripetuto separatamente tre volte, senza retry, ha superato tutte e tre
  le prove. Il primo esito resta registrato come fallito, non come suite verde.

Comandi di verifica (nella copia isolata del repository):

```sh
npx vitest run src/components/ricorda-lingua.test.ts
npm test
npx tsc --noEmit
npx eslint src
node scripts/stringhe-da-tradurre.mjs --controlla
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs build
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs e2e e2e/lingua.spec.ts --retries=0
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs e2e e2e/lingua.spec.ts --grep 'a chi ha il browser in inglese' --repeat-each=3 --retries=0
```

## Limiti

La correzione migliora il recupero della preferenza, non ripara la rete di chi
sta navigando e non dimostra che altri salvataggi siano riusciti durante lo stesso
evento. Dopo tre errori persistenti il componente si ferma: una nuova lingua,
sessione o rimontaggio può avviare un nuovo ciclo. Non viene aggiunta una coda
persistente offline. La lingua della pagina continua a dipendere dall'indirizzo,
quindi non viene alterata da un errore del salvataggio in background.

I test non dimostrano l'assenza futura di errori di rete in produzione.
Non sono stati creati utenti di test, modificati profili o eseguiti carichi BEN
in produzione per questa correzione.

## Riferimenti

- [Supabase: aggiornamenti filtrati](https://supabase.com/docs/reference/javascript/update).
- [Supabase: retry automatici delle letture](https://supabase.com/changelog/45071-automatic-postgrest-retries-for-transient-errors).
- `node_modules/@supabase/postgrest-js/src/PostgrestBuilder.ts`: conversione degli
  errori di fetch in risultati con status zero.
- `src/components/ricorda-lingua.tsx` e relativo file di test: implementazione e
  casi di regressione.
