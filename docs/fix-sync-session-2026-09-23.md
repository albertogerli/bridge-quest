# Sincronizzazione: sessione cambiata e identità delle richieste

## Segnalazione e limiti della diagnosi

Sentry 148964137, evento del 23 settembre 2026 alle 16:41:05 UTC,
release `8e8ef783e9d6fa383897f2527a95f8c25e022490`, scope `sync:push`,
messaggio `Sync session changed`. L'evento precede i rilasci auth e lingua
della stessa giornata. L'analisi parte dall'email fornita, non dall'accesso
all'evento completo in Sentry.

La vecchia condizione in `src/lib/progress-sync.ts` era:

```ts
if (auth.error || auth.data.user?.id !== owner) throw new Error("Sync session changed");
```

Essa trasformava indistintamente un errore di rete, un rifiuto del servizio
Auth, una sessione assente e un account diverso nello stesso messaggio.
La causa specifica dell'evento **non è determinabile** dall'email.
Non è corretto liquidarlo come semplice logout, né attribuirlo con certezza
a Supabase o alla rete mobile.

## Secondo difetto riprodotto

Il controllo dell'utente veniva eseguito prima delle scritture, ma ciascuna
richiesta successiva poteva acquisire il token allora corrente dal client
condiviso. Un test con SDK reale e trasporto simulato ha riprodotto questo caso:

1. Verifica e aggiornamento del profilo dell'account sintetico A.
2. Cambio della sessione del client all'account sintetico B.
3. RPC `sync_review_items` inviata con la sessione B, benché il contenuto
   provenisse dalla sincronizzazione iniziata per A.

Il test di regressione è fallito sul codice precedente, mostrando la seconda
identità sulla RPC. La funzione SQL ricava il proprietario da `auth.uid()`;
questo è corretto lato database, ma non basta a impedire che il client invii
contenuto del precedente account con la nuova identità. Il controllo della
revisione non è una prova di identità: due collezioni uguali hanno uguale revisione.

Non è stata verificata né osservata una contaminazione fra account reali.
Il test dimostra una possibilità del codice, non che si sia verificata
nell'evento segnalato.

## Correzione

- Sessione assente o identità verificata diversa: interruzione tipizzata,
  senza allarme Sentry generico e senza conferma del salvataggio.
- Errori di rete, token invalido, permessi e servizio Auth: restano segnalati,
  distinguibili tramite codice/tipo e stato, senza payload, token o dati personali.
- Il token acquisito viene verificato con `getUser(token)`, non viene considerata
  affidabile l'identità contenuta nel solo `getSession()`.
- Lo stesso token verificato viene applicato alle singole richieste di lettura
  e scrittura dei progressi, comprese le RPC con proprietario implicito.
  Nessuna modifica agli header globali del client o alle richieste estranee.
- Cambi account, logout, smontaggio e nuove inizializzazioni invalidano i job
  precedenti. Risposte tardive non avanzano la revisione e non producono
  successi o errori sull'interfaccia di un'altra sessione.
- Se l'interfaccia mostra ancora l'account mentre la sessione non è disponibile,
  resta l'avviso di salvataggio non confermato. Il recupero usa i tentativi
  già previsti e gli stessi progressi locali, non una conferma fittizia.

Nessuna migrazione, modifica di RLS, privilegio, dipendenza o filtro generale
Sentry. Nessun aggiramento dell'autenticazione.

## Evidenze e verifiche

Implementazione: `src/lib/progress-sync.ts` (classificazione, identità delle
richieste e conferma); `src/hooks/use-supabase-sync.ts` (ciclo di vita e messaggi
all'interfaccia). Test: relativi `*.test.ts`.

33 casi mirati superati: 24 nel modulo di sincronizzazione e 9 nell'hook.
Coprono sessione assente, rete, permessi, token invalido, cambi account in volo,
uscita/rientro nello stesso account, mancata conferma, recupero, conflitto di
revisione, isolamento dei backup locali e cleanup. Il test sui token controlla
anche che una richiesta estranea alla sincronizzazione usi normalmente la
nuova sessione: il client condiviso non viene alterato.

Prova aggiuntiva su Supabase locale `127.0.0.1:56321`, schema e privilegi del
progetto, due account sintetici: cambio reale della sessione del client dopo
la PATCH del profilo e prima della RPC. Risultato verificato sul database:
una riga di ripasso nell'account originario, zero nell'altro. Una lettura chiesta
per il precedente account con la nuova sessione viene rifiutata. Account
sintetici eliminati nel blocco `finally`, senza stampare identificativi.

Suite completa: 1.739 test superati, 5 saltati, 118 file superati e 3 saltati.
TypeScript, ESLint dell'intero sorgente, gate traduzioni e build locale superati.
Tutti i controlli RLS locali superati.

Quattro test browser selezionati superati senza retry: recupero di risposta
persa con due schede e isolamento del proprietario, login/home, pagina corsi
e hub di gioco. Non è stata rieseguita l'intera suite browser per questo fix.

Le prime esecuzioni dei nuovi test hook sono fallite per il `localStorage`
parziale esposto da Node 25 nel test runner. La fixture è stata resa isolata
tramite un'implementazione in memoria del contratto Storage; nessun errore
dell'applicazione è stato filtrato e nessuna asserzione è stata disabilitata.

Comandi principali, eseguiti nella copia isolata del repository:

```sh
npx vitest run src/lib/progress-sync.test.ts src/hooks/use-supabase-sync.test.ts
npm test
npx tsc --noEmit
npx eslint src
node scripts/stringhe-da-tradurre.mjs --controlla
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs rls
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs build
BRIDGELAB_SUPABASE_CLI=/Users/albertogiovannigerli/.npm/_npx/6f1b058a4d9555af/node_modules/@supabase/cli-darwin-arm64/bin/supabase node scripts/quality-local.mjs e2e e2e/smoke-auth.spec.ts e2e/result-sync.spec.ts --retries=0
```

## Limiti residui

L'interruzione non annulla una richiesta già elaborata dal server. Essa resta
vincolata all'account originario, mentre le operazioni successive obsolete
vengono fermate. Profilo, moduli, badge e ripasso non costituiscono un'unica
transazione: un fallimento intermedio può lasciare scritture parziali e non
deve produrre una conferma complessiva. Questa modifica non ridisegna la
risoluzione generale dei conflitti fra dispositivi.

Non si può ricostruire dalla sola email se tutti i progressi di quell'utente
fossero già salvati. Non è stata eseguita alcuna correzione retroattiva sui
dati reali e non vengono promesse l'assenza futura di problemi di rete o la
conservazione di dati locali dopo la cancellazione del browser.

## Fonti tecniche

- [Supabase getUser: verifica server-side e JWT esplicito](https://supabase.com/docs/reference/javascript/auth-getuser).
- [Supabase getSession: sessione locale e limiti di attendibilità](https://supabase.com/docs/reference/javascript/auth-getsession).
- SDK installato: `@supabase/supabase-js/src/lib/fetch.ts` e
  `@supabase/postgrest-js/src/PostgrestBuilder.ts`, metodo `setHeader` per
  richieste singole, verificato anche con l'SDK reale nei test.
- `scripts/sql/review-sync-2026-09.sql`: proprietà e revisione del ripasso.
