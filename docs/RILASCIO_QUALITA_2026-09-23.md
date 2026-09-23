# Consolidamento qualità — 23 settembre 2026

## Perimetro

Riferimento didattico: manuale FIGB Fiori 2022, autorizzato dal responsabile del progetto. Correzioni di aperture, risposte numeriche, caricamenti, traduzioni, salvataggi e sincronizzazione; recupero degli aggiornamenti amici/sfide dopo la conferma PostgreSQL; diagnostica BEN a schema chiuso senza dati personali.

Le correzioni editoriali al database sono state applicate separatamente mediante aggiornamenti puntuali con confronti prima/dopo, senza reseed e senza modificare risultati storici degli utenti. I nuovi script SQL documentano modifiche già applicate: il deploy Git non le riesegue.

Incluse le dispense Fiori 7/8 riviste e i PDF inglesi ricavati dalle immagini esistenti. La conversione in PDF non costituisce una revisione semantica integrale di tutte le immagini o dei video.

## Collaudi pre-rilascio

- 1.674 test unitari/componenti passati; 5 saltati.
- 56 prove browser passate senza retry, contro un database locale con soli dati editoriali e account sintetici.
- TypeScript, lint senza warning, traduzioni, terminologia, build e controllo service worker passati.
- RLS, ripasso atomico, ricostruzione dello schema e Realtime verificati sul database isolato.
- Confronto BEN su 30 aste: 22 identiche, 3 con percorso diverso ma stesso esito, 5 con esito diverso. Nessun benchmark né cambio di configurazione del motore in produzione.

I referti completi e gli snapshot dell'audit restano nell'archivio locale dell'analisi, non sono pubblicati in questo repository. Sono incluse soltanto le fixture editoriali necessarie ai test e i relativi piani di revisione. Non contengono account o attività di utenti reali.

## Riproduzione

```sh
npm ci
npm test
npx tsc --noEmit
npx eslint src --max-warnings 0
node scripts/stringhe-da-tradurre.mjs --controlla
node scripts/verifica-terminologia.mjs
```

Il workflow `verifiche-notturne.yml` avvia Supabase locale, ripristina schema e fixture, esegue RLS/Realtime e prove browser. Rifiuta l'uso del database produttivo come destinazione dei test. L'esecuzione remota del workflow resta una verifica distinta dal collaudo locale.

## Limiti e rilascio

Pubblicazione tramite push selettivo su `main` e integrazione Git di Vercel. Esclusi perizie, bozze, video promozionali, modifiche della home estranee e intermedi PNG preesistenti. Nessun caricamento indiscriminato della cartella di lavoro.

Restano necessarie la revisione semantica integrale del materiale, prove su dispositivi reali/screen reader e osservazione post-rilascio. I test non sono una certificazione di assenza di errori o di conformità WCAG.
