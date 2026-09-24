# Sincronizzazione: rete, diagnostica e tentativi sicuri — 24 settembre 2026

## Segnalazioni e limiti

Notifiche Sentry fornite dall'utente, tutte sulla release `8bddc4628c59e063d84db64d825940efd1c5462e`:

| Issue | Ora UTC | Operazione | Errore |
| --- | --- | --- | --- |
| 149043675 | 04:12:22 | moduli, `/login` | `client_error; status 0` |
| 149099583 | 08:46:10 | profilo, `/gioca/sfida` | `client_error; status 0` |
| 149009958 | 09:20:08 | autenticazione iniziale, `/en` | `AuthRetryableFetchError` |

Sono eventi successivi alla correzione precedente, non vecchie notifiche.
Non è stato acquisito l'evento completo Sentry: non si può attribuire con
certezza ogni singolo incidente a connessione, DNS, CORS, sospensione del browser
o disservizio del fornitore. Lo stato 0 è prodotto dal client: non è uno stato
HTTP restituito dal database. Non dimostra neppure un errore di permessi.

## Difetto riprodotto

Il classificatore introdotto nella release precedente riconosceva le firme
esatte `TypeError: Failed to fetch`, `TypeError: Load failed` e la variante
Firefox. La versione installata di Sentry aggiunge invece ` (hostname)` al
messaggio (`node_modules/@sentry/core/build/esm/instrument/fetch.js:69–76`).
Supabase conserva quel messaggio e restituisce codice vuoto e stato 0.
Il suffisso impediva quindi il riconoscimento della categoria `network_error`.

Riproduzione con il vero SDK e trasporto simulato sul codice precedente:
`Failed to fetch (synthetic.supabase.co)` e `Load failed (synthetic.supabase.co)`
finivano entrambe in `client_error; status 0`. Un nuovo test usa anche
l'instrumentazione reale della versione Sentry installata per verificare la
trasformazione, senza dipendere soltanto da una stringa ricostruita a mano.
Questo prova il difetto del classificatore, non la causa fisica delle tre
interruzioni notificate.

## Correzione

In `src/lib/progress-sync.ts`:

- riconosciute le firme note anche con il suffisso host aggiunto da Sentry;
  messaggi arbitrari, URL completi e altre eccezioni non sono classificati
  indiscriminatamente come problemi di rete;
- massimo tre tentativi per operazione sicura, con attese di un secondo e poi
  tre secondi; sono esclusi i tentativi brevi quando il browser dichiara di
  essere offline;
- autenticazione: ripetizione solo di `AuthRetryableFetchError` con stato 0,
  502, 503 o 504;
- profilo, moduli e badge: ripetizione della sola operazione fallita in caso
  di `network_error`, oppure `http_error` 502, 503 o 504;
- stessa fotografia dei valori, stessi timestamp e stesso token verificato
  durante la ripetizione. La titolarità del lavoro è ricontrollata prima di
  ogni richiesta e dopo la risposta;
- nessuna ripetizione cieca di `sync_review_items`: una risposta persa può
  seguire una revisione già aggiornata. Rimane la gestione esistente di
  rilettura e conflitto;
- nessun nuovo filtro globale Sentry. Se i tentativi si esauriscono, il
  fallimento resta segnalato e il salvataggio non viene confermato. Rimangono
  disponibili il successivo tentativo periodico, il ritorno online e il retry
  manuale. Permessi negati, conflitti e token invalidi restano diagnosticabili.

La versione PostgREST installata ripete automaticamente solo GET, HEAD e
OPTIONS (`node_modules/@supabase/postgrest-js/src/fetchWithRetry.ts:45`), non
le scritture qui interessate. Nessuna dipendenza, schema, RLS o impostazione
di produzione è stata modificata. Nessun nuovo dato personale in telemetria.

Il trigger `public.log_user_login` inserisce una riga soltanto quando cambia
`last_login` (`scripts/sql/000-schema-baseline.sql:3186`). Mantenere il timestamp
identico evita duplicazioni anche quando il primo PATCH è stato eseguito ma
la sua risposta non raggiunge il browser. Moduli e badge usano già upsert con
chiave univoca e `ignoreDuplicates: true`.

## Riscontro aggregato in produzione, sola lettura

Interrogato il connettore Supabase `query_logs`, progetto
`mjojjktuhhnycdsikcla`, con finestra esplicita
`2026-09-24T04:00:00Z`–`2026-09-24T09:30:00Z`:

```sql
select multiIf(
 log_attributes['request.path']='/rest/v1/profiles','profiles',
 log_attributes['request.path']='/rest/v1/completed_modules','modules',
 startsWith(log_attributes['request.path'],'/auth/v1/'),'auth','other'
) as endpoint_group,
log_attributes['response.status_code'] as status,
count(*) as requests
from logs where source='edge_logs'
group by endpoint_group,status order by endpoint_group,status
```

Risultati relativi agli endpoint interessati:

| Gruppo | Stato | Richieste |
| --- | --- | ---: |
| auth | 200 | 11341 |
| auth | 204 | 1 |
| auth | 400 | 5 |
| auth | 403 | 2 |
| modules | 200 | 768 |
| modules | 201 | 817 |
| profiles | 200 | 107 |
| profiles | 204 | 1669 |
| profiles | 403 | 5 |

Controllo più ristretto dell'autenticazione, finestra
`2026-09-24T09:18:00Z`–`2026-09-24T09:23:00Z`:

```sql
select log_attributes['response.status_code'] as status,count(*) as requests
from logs where source='edge_logs'
and startsWith(log_attributes['request.path'],'/auth/v1/')
group by status order by status
```

Output: stato 200, 232 richieste; stato 400, 3 richieste.
Nessun 5xx nei risultati acquisiti per queste finestre, ma le richieste che
non arrivano al servizio possono non comparire nei log. I 403 non sono stati
correlati a persone o agli eventi Sentry. Non è una prova dell'assenza di
disservizi. Estratti soltanto aggregati, senza nomi, email o identificativi
degli utenti.

## Verifiche eseguite

Comandi nella copia di lavoro integra `/tmp/bridgelab-auth-clean.d7Kyam`:

```bash
npx vitest run src/lib/progress-sync.test.ts src/hooks/use-supabase-sync.test.ts --reporter=dot
# 69 passati
npm test -- --reporter=dot
# 1775 passati, 5 saltati; 118 file passati, 3 saltati
npx tsc --noEmit
npx eslint src
node scripts/stringhe-da-tradurre.mjs --controlla
# tutti exit 0; ESLint senza errori o warning
git diff --check
# exit 0

BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs build
# exit 0; build production contro il solo Supabase locale
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs e2e e2e/smoke-auth.spec.ts e2e/result-sync.spec.ts --retries=0
# 4 passati in 24.6 secondi, senza retry del test runner
```

Sedici casi unitari aggiuntivi: firma Sentry, recupero dell'operazione
singola, autenticazione, gateway temporaneamente indisponibile, conservazione
del payload/token, mancata ripetizione del cambio revisione, cambio account
durante l'attesa e browser offline. I test preesistenti continuano a coprire
gli errori persistenti senza falsa conferma e il successivo recupero.

Prova aggiuntiva con Node, vero SDK, vera autenticazione e database **locale**
`127.0.0.1:56321`: account sintetico temporaneo; prima richiesta di verifica
utente interrotta; primo aggiornamento profilo e primo inserimento modulo
eseguiti dal server, poi risposta deliberatamente persa. Verificate le righe
persistite, il registro accessi e la mancata riscrittura di uno stato già
confermato. Output:

```json
{"target":"local-only","recoveredFaults":{"auth":1,"profile":1,"modules":1},"profileSaved":true,"moduleRows":1,"newLoginHistoryRows":1,"unchangedNotRewritten":true}
{"localUsersRemaining":0}
```

Il primo avvio di questa prova aveva incontrato un timeout 504 dell'Auth
locale; non era una prova superata. Controllati successivamente salute dei
servizi e assenza di utenti residui, il test completo è riuscito. Nessuna
prova di carico, login o scrittura di test in produzione.

Questi risultati verificano i casi riprodotti. Non dimostrano l'assenza di
futuri guasti di rete e non sostituiscono una verifica degli eventi successivi
al rilascio. Il rilascio va verificato separatamente dal superamento dei test.
