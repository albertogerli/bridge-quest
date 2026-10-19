# Feedback Trevissoi 5 (19 ottobre 2026): piano di implementazione

Il documento («Feedback BridgeLab 5.docx») ha due parti:

- **la prima** (schermate dal 14 al 18/10) è nuova;
- **la parte «BACKUP»** (schermate del 2 e 12/10) ripete il Feedback 4, già
  affrontato in `trevissoi-4.md`, e le liste finali (registrazione, home
  allievo, «da verificare») che vengono dal Feedback 3.

Ogni punto è stato confrontato con il codice prima di finire qui: i «difetti»
hanno una causa trovata, non supposta. Taglia: **S** = meno di mezza giornata,
**M** = una giornata circa, **L** = più giorni o serve uno script SQL.

---

## Ondata 1 — Difetti veri (si fanno subito, nessuna decisione)

| # | Cosa vede l'insegnante | Causa trovata | Intervento | Taglia |
|---|---|---|---|---|
| D1 | «Rivedi la mano»: la presa mostra le carte ai posti sbagliati (♠A a Sud, ma è di Nord) e le quattro mani sono capovolte (Sud in alto); i semi si mescolano sulla stessa riga | `hand-replay.tsx`: il tavolo è ruotato per mettere il dichiarante in basso (vista dell'allievo), ma le lettere N/S/E/O sono fisse → con dichiarante Nord è un capovolgimento di 180°. `MiniHand` è una riga unica che va a capo dove capita | Nella pagina dell'insegnante Nord sempre in alto (diagramma standard); lettere ricavate dal posto reale in ogni caso; una riga per seme | S |
| D2 | L'allievo prende posto al tavolo e **non vede la sua mano** | `classi/[classId]/tavolo`: la mano propria è disegnata solo dentro il blocco del contratto, e il contratto all'allievo arriva solo dopo «Mostra il contratto» (che si azzera a ogni mano nuova) | La propria mano si vede sempre, contratto o no. In più: «SeiNord» senza spazio; con più tavoli aperti l'allievo può finire su un tavolo a caso (stesso istante di creazione) → scegliere il tavolo dove è seduto | S |
| D3 | «Apri vista proiezione»: finestra nera con solo «Tavolo 1» | Il tavolo d'aula appena aperto è vuoto nel database; l'insegnante vede una mano generata in locale, ma alla proiezione arrivano le mani vuote → nessun posto da disegnare. Lo sfondo nero è l'opzione «Condivido lo schermo» | Alla proiezione mandare le stesse mani che vede l'insegnante (o dire «Manda prima la mano ai tavoli»); collegare anche «Analisi doppio morto» e «Dichiarazione e contratto», che dal tavolo condiviso oggi non fanno nulla | S |
| D4 | La dispensa rilasciata non si apre; si vedono tutti i corsi (Quadri, Cuori…) e i lucchetti | `/dispense` ignora la classe e il rilascio (`materiali_lezione.pubblica_dal`): blocca ogni lezione finché l'allievo non ha completato i moduli del percorso personale. Il link del rilascio non dice nemmeno quale lezione | Con `?classe=` la pagina mostra **solo** le lezioni rilasciate a quella classe, aperte, senza le schede degli altri corsi; il link porta alla lezione; layout «modalità corso» (niente colonne) | M |
| D5 | Al primo accesso l'insegnante vede la home generale dell'allievo | La home decide «insegnante o no» prima che arrivi il profilo (che si carica dopo); se la lettura del profilo fallisce resta la home generale | Attendere il profilo prima di scegliere la home; ripiego esplicito se la lettura fallisce | S |
| D6 | L'allievo sceglie «vai al resto del portale» e non torna più alla pagina del corso | La scelta si salva nella sessione del browser; il pulsante per tornare esiste solo per gli insegnanti | Pulsante «Torna al tuo corso» anche per l'allievo (e vedi F3 per l'interruttore dell'insegnante) | S |
| D7 | «Le mani generate non sono del tema» | I modelli del gioco della carta (14) ci sono in produzione, ma la pagina parte su «Apertura di 1NT» (tema di licita) — lo screenshot è proprio quello. In più il vincolo «onori» non ha un tetto: per «Vincenti e affrancabili» passa anche un AKQJx che non ha niente da affrancare | Pagina che parte dal modello della lezione della classe; temi di licita separati e in fondo; vincoli più stretti per le lezioni 1–6 del Fiori, con un test che controlla che ogni mano generata abbia davvero vincenti e affrancabili | M |

---

## Ondata 2 — Ritocchi di interfaccia (piccoli, nessuna decisione)

| # | Richiesta | Intervento | Taglia |
|---|---|---|---|
| U1 | «Inizia gratis» non fa capire dove cliccare | «Registrati» nella pagina d'ingresso (testata e pulsante grande) | S |
| U2 | «Crea la prima classe» e «+ Nuova classe» insieme confondono | Resta solo «+ Nuova classe» | S |
| U3 | Copiare il codice invito senza entrare nella classe; caselle più piccole | Pulsante «Copia» sul codice in ogni scheda; schede più basse (o elenco compatto) | S |
| U4 | «Contratto mantenuto / Caduto» → «Esito positivo / negativo» | Nelle lezioni del gioco della carta (Fiori 1–6, c'è già `senzaLicita`) tutti i testi di contratto diventano esito/obiettivo in prese — tabella dei risultati, legenda, «Cadute / classe» | S |
| U5 | Esercizio dell'allievo: tavolo piccolo, troppo spazio vuoto, scorrimento su e giù; contratti ancora presenti | Il tavolo oggi si limita sull'**altezza** dello schermo e sotto i 500 px passa a carte piccolissime: ricalcolare togliendo la barra sopra, carte più grandi su schermo da PC. Nelle lezioni del gioco della carta: solo «Obiettivo: 9 prese», niente contratto né «Dichiarante/Difesa» né «Contratto mantenuto!» | M |
| U6 | Home allievo: «Riprendi» anche se non ha mai iniziato; il percorso con tutte le lezioni future spaventa | «Inizia» / «Riprendi 3/8» secondo l'avanzamento; tolto l'elenco delle lezioni non assegnate: restano solo i compiti fatti e quelli da fare | S |
| U7 | «Allievi e tavoli»: non si vede l'elenco degli allievi della classe | In cima l'elenco degli iscritti alla classe; l'elenco per i tavoli si riempie da solo con gli iscritti (il CSV resta per chi non ha account) | S |
| U8 | Manca il percorso dei menù nella pagina «Le tue classi» | Briciole anche lì, e controllo di tutte le pagine del portale insegnanti | S |
| U9 | Al tavolo l'insegnante non vede che sta seguendo più tavoli | Barra «Tavolo 1 · 2 · 3» per passare da un tavolo all'altro dell'aula, con chi è seduto. Attenzione: «Apri per la classe» oggi chiude tutti i tavoli della classe — va escluso quando si arriva dall'aula | M |
| U10 | Il pannello «Divisioni dei semi» e le tendine del contratto sotto il tavolo non si capiscono | Pannello chiuso di partenza, con una riga che spiega cosa mostra («come possono essere divise le carte che mancano»); «Si gioca 3SA giocato da Sud» spiegato come cambio di contratto per rigiocare la stessa mano | S |
| U11 | Pagina dell'allievo entrato con il codice: un «benvenuto» con le informazioni del corso | Intestazione «Benvenuto al Corso di Primo Livello — sede, giorno e ora, insegnante»; servono i campi sede/giorno/ora nella classe (script SQL) | M |

---

## Ondata 3 — Funzioni nuove (servono un via libera, non materiale)

| # | Richiesta | Proposta | Taglia |
|---|---|---|---|
| F1 | Allievi senza lettore QR: un codice da digitare per entrare in aula, senza WhatsApp | Codice di 6 cifre valido fino a mezzanotte, mostrato grande accanto al QR; casella «Hai un codice dell'aula?» su bridgelab.it/aula. Script SQL per la colonna e l'indice | M |
| F2 | Avviso automatico agli allievi quando si assegna un compito (WhatsApp e/o email) | **Email**: sì, l'invio c'è già (Resend) — interruttore «avvisa gli allievi» nell'assegnazione. **WhatsApp automatico**: richiede WhatsApp Business API (account aziendale FIGB approvato da Meta, costo per messaggio): resta il pulsante «Manda su WhatsApp» che c'è | M |
| F3 | «Vai al resto del portale» deve deciderlo l'insegnante (verso fine corso) | Interruttore per classe «gli allievi vedono il resto del portale», spento di partenza; finché è spento l'allievo vede solo il suo corso. Script SQL | M |
| F4 | Esercizi con domande, non solo mani da giocare: «quante vincenti e affrancabili per seme», «che affrancamento», test di teoria a scelta multipla | Nuovo tipo di compito «domande», anche legato a una mano (si risponde prima di giocarla). Le risposte su vincenti/affrancabili si possono **verificare in automatico** dalla mano; le domande di teoria le scrive l'insegnante o vengono dai moduli che ha già preparato | L |

---

## Da decidere o in attesa di materiale (già aperti nel Feedback 4)

1. **Lezione Zero → iscrizione al corso → validazione dopo il pagamento**, con i dati per il tesseramento. Da qui dipendono anche: l'esportazione con tutti i dati (ordinata per Classe, Cognome, Nome, Cellulare…), la stampa per corso o per tutti i corsi, la registrazione con codice che chiede subito i dati. Serve l'elenco dei campi (inviato da Trevissoi: da riprendere) e la riunione privacy con Carnicelli (minori). Oggi di proposito si conserva solo il nome.
2. **Contenuti ufficiali** (videolezioni, dispense, commenti alle smazzate coerenti con la lezione): aspettiamo il materiale validato dalla Commissione e il tavolo con Carla.
3. **Libreria come area di scambio fra insegnanti** (file, mani, materiali, a due o a tutti): idea da approfondire — chi può pubblicare, chi modera.
4. **Locandina sul format delle ASD**: serve il file del format.
5. **Ingresso di esterni a una lezione con approvazione dell'insegnante**: oggi l'ingresso senza registrazione c'è e l'insegnante vede chi è in aula, ma non approva uno per uno.

---

## Risposte da dare (funzioni che ci sono già)

- **Rivedere carta per carta la mano dell'allievo**: tabella del compito → clic sulla casella → «Rivedi la mano», presa per presa (con il difetto D1 corretto).
- **Vedere, aggiungere, modificare, togliere allievi**: classe → scheda «Allievi»; «Allievi e tavoli» è l'elenco per comporre i tavoli (con U7 diventa una cosa sola).
- **Entrare in un'aula aperta senza WhatsApp**: chi ha l'account la trova nella pagina della sua classe; chi non lo ha userà il codice F1.
- **Combinazioni di carte** (BACKUP, schermata del 2/10): corretto il 2 ottobre — esempi con le quattro mani, la griglia segue il posto scelto, una carta non può stare in due mani.
- **«Falle entrare», ordine delle classi, nome della classe nelle sottopagine, «carta non giocabile», cambio di posto dell'allievo** (BACKUP): fatti nel Feedback 4.

---

## Ordine proposto

1. **Ondata 1** (D1–D7) in un giro solo: sono i difetti che si vedono in aula.
2. **Ondata 2**: U1–U8 e U10 subito dopo; U9 e U11 a seguire (U11 con uno script SQL).
3. **Ondata 3**: F1 e F3 (piccoli script SQL) appena c'è il via libera; F2 solo email; F4 dopo aver fissato il formato delle domande con Trevissoi.
4. Il resto quando arrivano decisioni e materiale.
