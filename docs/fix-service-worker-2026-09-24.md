# Service worker: rifiuto TLS e registrazione non gestita

## Incidente e riscontri

Notifica Sentry 149159674 fornita dall'utente: 24 settembre 2026,
12:38:15 UTC, release `235f3c73b12bcc5722cc4e0245ac83758adf106e`.
`SecurityError` (DOMException 18) durante la registrazione di `/sw.js`:
il browser segnala un errore del certificato SSL scaricando lo script.
Evento non gestito (`onunhandledrejection`), Chrome su Windows.
Non è il problema di sincronizzazione Supabase corretto in precedenza.

Controlli alle 12:39:33 UTC, da questa macchina e senza bypass TLS:

| Verifica | Esito |
| --- | --- |
| `https://bridgelab.it/sw.js` | HTTP 200, JavaScript, server Vercel |
| Cache-Control del worker | `no-cache, no-store, must-revalidate` |
| `https://www.bridgelab.it/sw.js` | HTTP 308 verso l'apice |
| TLS apice | autorizzato, TLS 1.3, SAN `bridgelab.it`, Let's Encrypt YR2 |
| Validità certificato apice | 5 settembre–4 dicembre 2026 |
| TLS www | autorizzato, TLS 1.3, SAN `www.bridgelab.it`, Let's Encrypt YR1 |
| Validità certificato www | 4 settembre–3 dicembre 2026 |

Comandi di riscontro HTTP:

```sh
curl --max-time 20 --silent --show-error --head https://bridgelab.it/sw.js
curl --max-time 20 --silent --show-error --head https://www.bridgelab.it/sw.js
```

Controllo TLS eseguito con Node `tls.connect`, `servername` impostato sul
dominio richiesto e `rejectUnauthorized: true`, leggendo
`authorized`, `getPeerCertificate()` e `getProtocol()`. Nessun `curl -k`,
nessuna modifica ai certificati o alle impostazioni di sicurezza.

Questi esiti NON ricostruiscono la connessione del browser dell'incidente e
non provano che ogni nodo geografico avesse lo stesso comportamento. Non
abbiamo i dettagli completi dell'evento né accesso al dispositivo interessato.
Proxy/antivirus, rete, orologio locale e anomalie temporanee del servizio sono
ipotesi, non diagnosi dimostrate. Non è giustificato affermare che il certificato
pubblico sia scaduto, né attribuire con certezza il problema al dispositivo.

## Difetto applicativo e intervento

La versione installata `@serwist/next` 9.5.12 chiama
`window.serwist.register()` senza gestirne il rifiuto:
`node_modules/@serwist/next/src/sw-entry.ts:31`.
La libreria `@serwist/window` rilancia l'errore di registrazione. Una richiesta
rifiutata dal browser diventa quindi una promessa non gestita.

La [documentazione ufficiale Serwist](https://serwist.pages.dev/docs/next/configuring/register)
prevede di disabilitare l'auto-registrazione e invocarla dal componente client.
Questa è la strada usata, senza patch a dipendenze o intercettazioni globali:

- `next.config.ts`: `register: false`; worker, scope e politiche di cache
  rimangono invariati;
- `ServiceWorkerRegistration`, nel layout principale: avvia la registrazione
  dopo il montaggio, solo in un contesto supportato e sicuro;
- `registerServiceWorker`: registra una sola volta per istanza, anche in
  StrictMode, e gestisce sia eccezioni sincrone sia promesse rifiutate;
- gli errori continuano ad arrivare a `reportError`, scope `pwa:register`,
  con categoria tecnica (`tls_certificate`, `security_policy`,
  `registration_type_error`, `registration_aborted`, `registration_failed`);
- nessun URL, query string, causa grezza o dato personale copiato nel nuovo
  errore diagnostico; nessun nuovo filtro Sentry;
- non vengono introdotti retry infiniti, downgrade HTTP, reload forzati o
  cancellazioni di localStorage, cache, progressi o worker già installati.
  Il comportamento preesistente `reloadOnOnline` non è stato modificato.

L'intervento corregge la gestione del fallimento, **non ripara un certificato
rifiutato dal dispositivo**. Una nuova registrazione rifiutata resta una
segnalazione da esaminare, ora gestita e identificabile. Le funzioni offline
possono non essere disponibili quando manca un worker valido; l'uso online
non deve dipendere dal successo di questa registrazione.

## Verifiche automatiche

Nella copia integra `/tmp/bridgelab-auth-clean.d7Kyam`:

```sh
npx vitest run src/lib/register-service-worker.test.ts src/lib/sentry-shared.test.ts --reporter=dot
# 47 passati
npx tsc --noEmit
npx eslint src
node scripts/stringhe-da-tradurre.mjs --controlla
# exit 0, nessun errore/warning ESLint e nessuna traduzione mancante nel gate
npm test -- --reporter=dot
# 1788 passati, 5 saltati; 119 file passati, 3 saltati
```

I 13 nuovi test coprono successo, deduplicazione, errore TLS, CSP/sicurezza,
TypeError, annullamento, errore generico, rifiuto non-Error, eccezione sincrona,
StrictMode, ambienti non supportati e collegamento nel layout/configurazione.
I test preesistenti dei filtri Sentry rimangono verdi: nessun silenziamento
generale delle registrazioni fallite.

Build e controllo del worker:

```sh
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs build
# exit 0, build production contro il solo banco Supabase locale
node scripts/verifica-sw.mjs
# service worker pulito: niente video, audio o infografiche; precache da public 2.0 MB
```

## Prove browser su build production locale

Playwright CLI, sessione dedicata, server `http://localhost:3137`, Supabase
locale, Sentry disabilitato e analytics isolati. Non è stato simulato alcun
errore sul dominio di produzione.

La prova di guasto sostituisce soltanto `navigator.serviceWorker.register`
nel contesto di test, facendolo rifiutare con la DOMException della notifica.
Usa realmente la registrazione Serwist inclusa nel bundle dell'applicazione
e il nuovo gestore. Un secondo caso rifiuta con TypeError relativo allo script.

| Scenario | Chiamate register | Promesse non gestite | Eccezioni pagina | Segnalazioni gestite | Dato locale di prova conservato | Login visibile |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Rifiuto certificato simulato | 1 | 0 | 0 | 1, `tls_certificate` | sì | sì |
| Errore script simulato | 1 | 0 | 0 | 1, `registration_type_error` | sì | sì |

Risposte pagina HTTP 200. Il primo campionamento del caso normale non
confermava ancora un worker attivo: non è stato usato per dichiarare superata
l'installazione. Verifica aggiuntiva esplicita dell'API del browser nella
sessione normale:

```json
{"secure":true,"serwist":true,"registrations":[{"scope":"http://localhost:3137/","active":"activated"}],"controller":"activated"}
```

Un ulteriore contesto pulito ha risolto `navigator.serviceWorker.ready`,
con una registrazione presente in stato `activating` e nessuna eccezione
pagina. I test verificano il funzionamento della registrazione e la gestione
del guasto simulato, non la causa del rifiuto TLS sul dispositivo originale.

## Regressione del test sui risultati: esecuzione fallita e diagnosi

La prima esecuzione dei quattro E2E ha dato 3 passati e 1 fallito: il test
`result-sync.spec.ts` attendeva il banner di salvataggio non confermato entro
5 secondi dall'avvio, prima ancora che la simulazione di risposta persa fosse
arrivata alla scrittura. La traccia mostra una richiesta locale Auth di
5770.918 ms e il primo POST a `game_results` alle 12:48:08.152 UTC, dopo il
termine dell'attesa del banner. Non è stato dichiarato superato quel run.

La fixture ora verifica prima, con limite di 20 secondi, che il server abbia
eseguito la scrittura prevista e che l'intercettore sia entrato nel ramo che
perde la risposta. Solo dopo verifica il banner. Questa è una condizione
aggiuntiva, non la rimozione di un'asserzione: una simulazione mai attivata
fallisce esplicitamente. Invariate tutte le verifiche su persistenza,
duplicati, isolamento del proprietario e recupero nelle due schede.
Nessuna modifica al codice applicativo dei salvataggi per far passare il test.

Ripetizione completa dopo la correzione della fixture:

```sh
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs e2e e2e/smoke-auth.spec.ts e2e/result-sync.spec.ts --retries=0
# 4 passati in 48.3 secondi; retry del runner disabilitati
npx tsc --noEmit
npx eslint e2e/result-sync.spec.ts
git diff --check
# exit 0
```

Conteggio finale `auth.users` nel solo database locale: 0; account sintetico
del test eliminato dal teardown. Nessun account reale usato o modificato.
