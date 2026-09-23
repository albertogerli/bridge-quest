# Correzione AbortError all'avvio della sessione — 23 settembre 2026

## Segnalazione e diagnosi

Issue Sentry `148959116`, release `8e8ef783e9d6fa383897f2527a95f8c25e022490`:
`AbortError: signal is aborted without reason`, Promise non gestita.
Transazione indicata `/login`, URL effettivo `/gioca`.

Il bundle pubblicato `7716-ef51ff951ddf4645.js`, riga 24, colonna 50702,
contiene il timer di `navigatorLock` di `@supabase/auth-js` 2.95.3:
il timer chiama `AbortController.abort()` senza motivo esplicito quando non
riesce ad acquisire il lock della sessione. Il secondo frame del messaggio,
`6601-c8a2a3186456376b.js:8:57023`, è il wrapper Sentry del callback del timer.

Nel vecchio SDK il rifiuto può propagarsi dall'inizializzazione alla Promise
interna di `onAuthStateChange`, senza un gestore. È stato riprodotto in un test
con la libreria effettivamente installata: il test fallisce con lo stesso
`AbortError` e Vitest rileva anche una unhandled rejection.

La provenienza del frame è verificata; non è determinabile dalla sola email
quale altra operazione/scheda trattenesse il lock. Non è un errore BEN, né la
prova di un problema DNS. Non viene attribuito al browser o alla navigazione
senza evidenza.

## Intervento

- Aggiornamento mirato e versione fissata di `@supabase/supabase-js`: 2.95.3 →
  2.117.1, con lockfile. I pacchetti core Supabase sono aggiornati insieme dal
  loro manifest; nessun'altra dipendenza preesistente cambia versione.
- Nessun aggiornamento SSR aggiuntivo: resta 0.8.0, verificato nei test con
  cookie reali della libreria.
- Nessun lock fittizio, nessun `steal` applicativo, nessun filtro Sentry per
  `AbortError`. Il singleton e le opzioni dei cookie non cambiano.
- Nessuna modifica a schema, RLS, ruoli, segreti o autorizzazioni. Il client
  pubblico continua a usare soltanto la chiave pubblica, non la service role.
- L'SDK richiede Node >=22; CI usa Node 22 e Vercel Node 24.

La gestione ufficiale, introdotta in Supabase 2.107, non acquisisce più Web
Locks per impostazione predefinita: rinnovi nella stessa scheda sono riuniti
in una sola operazione; tra schede intervengono il controllo dello stato nei
cookie e la gestione server dei token. La patch 2.117.1 conserva inoltre la
sessione valida scritta da un'altra scheda quando perde una corsa di rinnovo.

### Difetto applicativo emerso durante la verifica browser

Il primo passaggio E2E dopo il solo aggiornamento SDK ha fallito sulla landing
prima dell'audit axe: il browser non riusciva a completare il caricamento del
banner cookie. Il secondo test è stato interrotto; gli altri non sono stati
eseguiti in quel passaggio. Il deploy è stato fermato per indagare.

La navigazione chiamava `useEnrolledClasses()` anche per gli anonimi. Il DAL
rifiuta correttamente `getMyEnrolledClasses()` senza utente. Lo store, però,
in caso di errore rimetteva `isLoading=false` lasciando `isLoaded=false`: la
dipendenza dell'effetto scatenava immediatamente un nuovo tentativo. Con le
attese più brevi del nuovo SDK il ciclo monopolizzava il rendering.

Correzioni correlate necessarie prima del rilascio:

- `use-permessi.ts`: caricare le iscrizioni dal menu solo dopo l'autenticazione;
- `use-classes-store.ts`: interrompere i tentativi automatici al primo errore,
  conservare l'errore visibile e condividere il caricamento automatico tra i
  menu; i refresh espliciti dopo una modifica non vengono scartati;
- pagine classi e istruttori: pulsante esplicito «Riprova», con traduzione
  inglese già esistente e componente Button già in uso;
- test per errore, nuovo tentativo, richieste concorrenti e visitatore anonimo.

Le regole Baseline UI/React hanno guidato il riuso del pulsante esistente e
la gestione esplicita dell'errore, senza introdurre nuove animazioni o librerie.

Fonti ufficiali consultate:

- [Migrazione della coordinazione Auth](https://github.com/supabase/supabase-js/blob/v2.117.1/packages/core/auth-js/migrations/lockless-coordination.md)
- [Release 2.117.1](https://github.com/supabase/supabase-js/releases/tag/v2.117.1)
- [Correzione dei rinnovi concorrenti #2698](https://github.com/supabase/supabase-js/pull/2698)

## Verifiche ripetibili

`src/lib/supabase/auth-lock.test.ts` usa l'SDK e la gestione cookie SSR reali;
simula soltanto HTTP e la scrittura concorrente dell'altra scheda:

- inizializzazione e subscriber funzionano anche quando il vecchio lock
  restituirebbe l'AbortError della segnalazione;
- se un'altra scheda rinnova prima, la richiesta successiva al DB porta il
  token vincente e non diventa anonima;
- se un'altra scheda esce durante il rinnovo, la risposta tardiva non ricrea
  la sessione.

Comandi e risultati:

```text
# Prima dell'aggiornamento, SDK 2.95.3
npx vitest run src/lib/supabase/auth-lock.test.ts
1 failed; 1 unhandled rejection: AbortError: signal is aborted without reason

# Dopo l'aggiornamento, SDK 2.117.1
npx vitest run src/lib/supabase/auth-lock.test.ts src/lib/supabase/client.test.ts src/lib/sentry-shared.test.ts
38 passed

npm test
1685 passed, 5 skipped; 116 test files passed, 3 skipped

npx tsc --noEmit
exit 0

npx eslint src
exit 0, nessun errore o warning

node scripts/stringhe-da-tradurre.mjs --controlla
exit 0, ogni frase passata da t() ha la traduzione

npm audit signatures
1005 pacchetti con firma del registro verificata;
197 pacchetti con attestazione verificata

node scripts/quality-local.mjs rls
exit 0: tutte le verifiche RLS passate, solo database locale

node scripts/quality-local.mjs realtime
exit 0: eventi consegnati ai destinatari e non agli estranei

node scripts/quality-local.mjs build
exit 0 (anche dopo la correzione del ciclo classi)

node scripts/quality-local.mjs e2e --retries=0
Primo passaggio completo: 56 passed.
Build definitiva: 55 passed, 1 failed in browserContext.close.
La traccia dell'unico fallimento finale conferma che le verifiche della
pagina e del reload erano tutte passate; il fallimento è alla riga 213
di e2e/lingua.spec.ts, durante la chiusura del contesto browser.

node scripts/quality-local.mjs e2e e2e/lingua.spec.ts --grep 'a chi ha il browser in inglese' --repeat-each=3 --retries=0
3 passed: verifica isolata ripetuta, senza modificare il test o ignorare errori.
```

Prova aggiuntiva con Playwright CLI e due schede su localhost: la prima
mantiene realmente occupato il Web Lock `lock:sb-127-auth-token`; la seconda
apre `/gioca` senza autenticazione e raggiunge correttamente
`/login?redirect=%2Fgioca` in 463 ms. Il lock risulta ancora occupato e non
si rilevano `pageerror`. Il lock di prova viene rilasciato al termine.
È un controllo funzionale isolato, non un benchmark prestazionale.

La versione correttiva è stata pubblicata il giorno dell'intervento: scelta
esplicita per includere la correzione dei rinnovi concorrenti, dopo lettura
del codice upstream. Installazione con `--ignore-scripts`, versione esatta,
lockfile e verifica delle firme. Non è una garanzia assoluta sulla filiera.

Le verifiche si svolgono in una copia isolata: alcuni file della copia Desktop
sono placeholder iCloud e bloccano la lettura. Database di prova esclusivamente
locale, con utenti sintetici; nessun carico di prova su BEN o utenti reali.

## Limiti

La riproduzione identifica il percorso difettoso, non ricostruisce tutte le
azioni dell'utente segnalante. La simulazione dei cookie concorrenti non
certifica ogni possibile interleaving tra browser. Test superati e deploy
riuscito non dimostrano da soli l'assenza futura di altri AbortError: quelli
non correlati restano visibili in Sentry. Una scheda rimasta aperta può ancora
eseguire i vecchi script fino al successivo caricamento.
