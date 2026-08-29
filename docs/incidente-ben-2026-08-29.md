# 29/08/2026 — BEN vivo ma rotto per quaranta minuti

Il motore di intelligenza artificiale (BEN) ha smesso di rispondere a
qualunque richiesta — licita e gioco della carta — restando però in piedi.
Nessun controllo automatico se n'è accorto.

## Che cosa ha visto chi stava giocando

Ogni richiesta al motore tornava con un errore. Nell'applicazione questo si
traduce in «il compagno non ha risposto» durante la licita, e nel ripiego
silenzioso sul solutore durante il gioco della carta. Nei log del container si
vedono richieste di partite vere, con le carte già giocate: non era un momento
morto.

Durata: dalle 18:05 circa alle 18:45 (ora italiana), fra il momento in cui il
motore è entrato nello stato di guasto e il deploy pulito che l'ha rimesso in
sesto.

## La causa tecnica

BEN ha risposto `400` a ogni richiesta con:

```
Attempting to capture an EagerTensor without building a function.
```

È un errore interno di TensorFlow, sollevato nel percorso di campionamento
(`sample.py` → `bid_info_tf2.py`). Una volta entrato in quello stato **non ne
esce**: ogni richiesta successiva fallisce allo stesso modo, indefinitamente.
La memoria non c'entrava — il container ne aveva 125 GB liberi.

## Che cosa l'ha innescato

Un banco di prova sulla qualità delle dichiarazioni, che ho lanciato **contro
il servizio di produzione**: trenta smazzate, asta completa su tutti e quattro
i posti, circa duecentoquaranta richieste una dopo l'altra.

Due precisazioni che contano:

- **non è colpa della configurazione ridotta.** È successo con il
  campionamento ORIGINALE di BEN (200 mani), rimesso apposta per un confronto.
  Con 75 il banco era passato poco prima senza un errore;
- **non è un carico irrealistico.** Duecentoquaranta richieste in sequenza sono
  quello che producono pochi utenti che giocano insieme. È una fragilità del
  motore che prima o poi si sarebbe manifestata da sola.

## Il difetto vero: nessuno se n'è accorto

La sonda di salute (`/healthz`) ha risposto `200` per tutto il tempo, perché
guardava una cosa sola: che il processo rispondesse su `/`. E rispondeva.

Railway non aveva quindi motivo di riavviare, e il guasto è finito soltanto
perché stavo guardando. Senza, sarebbe durato finché qualcuno non avesse
segnalato che il compagno non dichiarava mai.

**Una sonda che verifica di essere viva, e non di funzionare, dà una garanzia
che non ha.** È il punto da ricordare di questo incidente.

## Ripristino

Il riavvio ottenuto cambiando una variabile d'ambiente **non è bastato**: il
guasto è rimasto. È servito un deploy pulito (`railway redeploy`), dopo il
quale il motore ha ripreso a rispondere normalmente (simulazioni a 4,1 s).

## Che cosa è cambiato perché non si ripeta

1. **La guardia riconosce lo stato e reagisce** (`deploy/ben-railway/guard.py`).
   Conta le risposte che portano quella firma: a **tre** consecutive la sonda
   di salute passa a `503`, a **cinque** il processo esce e Railway riavvia —
   la stessa strada già usata quando BEN muore.

   Due soglie diverse e non una sola: nella prima stesura coincidevano, e il
   risultato era che il ramo `503` non poteva mai essere raggiunto. Sembrava
   una rete di sicurezza e non lo era.

   La firma è stretta apposta: un `400` legittimo — BEN lo restituisce quando
   il posto non corrisponde all'asta — non conta, e una risposta buona azzera.

2. **Il banco non punta più alla produzione.**
   `scripts/qualita-licita-ben.mjs` si rifiuta di partire se non gli si dice
   esplicitamente `--anche-in-produzione`. Va usato contro un servizio BEN
   dedicato, con la stessa immagine e lo stesso commit, acceso per il confronto
   e spento dopo.

## Che cosa resta da fare

- **Il servizio BEN di prova non esiste ancora.** Finché non c'è, il confronto
  fra 75 e 200 campioni resta parziale: dieci aste, con contratto finale
  identico in tutte e dieci. Serve una decisione su un secondo container,
  perché costa.
- **La sonda non è ancora funzionale.** Riconosce la corruzione *dopo* che una
  richiesta vera l'ha incontrata. Una sonda che ogni tot minuti chiede una
  dichiarazione nota se ne accorgerebbe prima che la incontri un utente.
- **Non si sa se accada anche senza carico anomalo.** Vale la pena guardare, in
  Sentry, se lo stesso errore compare fuori dalle finestre in cui il banco
  girava.

## Perché è scritto qui

Perché è un limite reale del sistema, trovato e chiuso. Nasconderlo
lascerebbe in piedi la convinzione che una sonda di vitalità basti — che è
esattamente la convinzione che ha permesso al guasto di durare.
