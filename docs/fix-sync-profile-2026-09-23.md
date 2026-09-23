# Sincronizzazione profilo: errore senza codice — 23 settembre 2026

## Riscontro e limiti della diagnosi

Segnalazione Sentry 148971659, `Sync profile rejected ()`, scope `sync:push`,
23 settembre 2026, 17:20:07 UTC, release `6ba0100`.
Fonte dell'incidente: notifica fornita dall'utente, non evento completo scaricato
da Sentry. Nessun dato personale necessario all'indagine.

L'evento precede `b9be383`, che lega le richieste alla sessione verificata e
annulla i job obsoleti. Quel fix NON correggeva però il messaggio senza codice:
`assertSyncResult` conservava soltanto `error.code ?? "database"`.
Una stringa vuota non attiva il ripiego `??`; `message` e lo stato HTTP esterno
all'oggetto `error` andavano persi.

Riproduzione sul codice precedente, usando realmente `@supabase/supabase-js`
2.117.1 con un trasporto simulato, senza raggiungere la produzione:

```text
TypeError (Failed to fetch): SDK code="", status=0 → Sync profile rejected ()
AbortError:                  SDK code="", status=0 → Sync profile rejected ()
```

Non è quindi dimostrato che l'incidente fosse un problema di permessi, una
sessione scaduta o un disservizio Supabase. Non è nemmeno dimostrata una perdita
definitiva di progressi. Il titolo originario non consente di distinguerli.

## Intervento

`src/lib/progress-sync.ts` conserva nell'errore solo operazione prestabilita,
codice diagnostico e stato numerico validato. Non copia messaggi grezzi,
risposte HTML, dettagli delle righe, URL, stack remoti, token o cause originali.

| Evidenza disponibile | Diagnosi trasmessa |
| --- | --- |
| Codice SQLSTATE / PostgREST | Codice originale, per esempio `42501`, `40001`, `PGRST301` |
| Stato 0 e firma di rete riconosciuta | `network_error`, stato 0 |
| Stato 0 e firma `AbortError` | `request_aborted`, stato 0 |
| Stato 0 e altra eccezione | `client_error`, senza attribuirla automaticamente alla rete |
| Risposta HTTP di errore senza codice riconosciuto | `http_error` e stato HTTP |
| Risposta HTTP 2xx non decodificabile dal client | `invalid_response` e stato HTTP |
| Informazioni assenti o non valide | `unknown_error`, stato sconosciuto |

Esempio del nuovo messaggio: `Sync profile failed (network_error; status 0)`.
Stato 0 è la rappresentazione SDK del fallimento lato client, non una risposta
HTTP del server. La categoria rete non distingue connessione, DNS, CORS o blocchi
del browser. Un annullamento non dimostra da solo che sia avvenuto un logout.

Nessun filtro globale Sentry aggiunto. Il fallimento resta segnalato e il
salvataggio resta non confermato. Invariati i nuovi tentativi già presenti:
intervallo di 30 secondi, ritorno online, richiesta manuale. Nessun retry
aggiuntivo indiscriminato sulle scritture multiple; nessuna modifica a database,
RLS, autorizzazioni, dipendenze o testi dell'interfaccia.

## Verifiche

Nuovi test inizialmente eseguiti sul codice precedente: **17 falliti e 24
passati**, a conferma della regressione diagnostica. Dopo la correzione:

```bash
npx vitest run src/lib/progress-sync.test.ts src/hooks/use-supabase-sync.test.ts --reporter=dot
# 53 passati; include 20 nuovi casi

npx tsc --noEmit
npx eslint src
node scripts/stringhe-da-tradurre.mjs --controlla
# tutti conclusi con exit 0; ESLint senza errori o warning

npm test -- --reporter=dot
# 1759 passati, 5 saltati; 118 file passati, 3 saltati

BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs build
# build production Next.js riuscita, configurata SOLO su Supabase locale

BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs e2e e2e/smoke-auth.spec.ts e2e/result-sync.spec.ts --retries=0
# 4 passati in 40.4 secondi, nessun retry del test runner
```

I test passano dal vero SDK con risposte controllate: firme di rete Chrome,
Firefox e Safari, annullamento, eccezione client sconosciuta, HTTP 502 HTML,
HTTP 403 senza codice, HTTP 200 non JSON, permessi, conflitto, JWT, codice
vuoto o non sicuro. Controllano anche il contesto diagnostico destinato a
Sentry, l'assenza di payload privati e il recupero dello stesso stato non
confermato. I test dell'hook verificano il nuovo tentativo al successivo
intervallo, senza falso successo prima del recupero.

In aggiunta, prova contro Supabase **locale** `127.0.0.1:56321`, con account
sintetico temporaneo e autenticazione reale: guasto simulato prima del PATCH
del profilo; query del profilo per verificare il mancato aggiornamento;
nuovo tentativo e query di riscontro per verificare la persistenza; terza
richiesta invariata non riscritta. Esito:

```json
{"target":"local-only","faultCorrectlyClassified":true,"failedAttemptNotAcknowledged":true,"retryPersisted":true,"unchangedSnapshotNotRewritten":true}
{"remainingLocalTestUsers":0}
```

L'account sintetico è stato disconnesso ed eliminato. Nessuna prova di carico,
scrittura o accesso utente sulla produzione. Queste verifiche dimostrano la
correzione della diagnosi e il recupero nel caso riprodotto, non ricostruiscono
la causa originaria della notifica e non garantiscono l'assenza di futuri
problemi di connettività.

Riferimenti controllati: codice della versione SDK installata
`node_modules/@supabase/postgrest-js/src/PostgrestBuilder.ts`,
[documentazione update](https://supabase.com/docs/reference/javascript/update),
[changelog Supabase](https://supabase.com/changelog).
