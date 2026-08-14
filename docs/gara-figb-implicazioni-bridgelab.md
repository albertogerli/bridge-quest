# Gara agenzia FIGB — cosa chiedono a BridgeLab e cosa dobbiamo fare

Analisi delle due offerte tecniche presentate alla procedura comparativa FIGB
per il Piano Biennale di Comunicazione 2027-2028, limitata a ciò che riguarda
BridgeLab. Redatta il 2026-08-10.

**Fonti** (offerte depositate il 2026-07-20):
- `FIGB_Gara_Agenzia/Offerte/Adiacent/Busta Tecnica.zip` → `Documento tecnico gara .pdf`
  — 105 occorrenze di "BridgeLab", capitolo C interamente dedicato.
- `FIGB_Gara_Agenzia/Offerte/Dunters/PDF_estratti/Dunters_Offerta_Tecnica.pdf`
  — 36 occorrenze, capitolo C "Piano di lancio e promozione BridgeLab".

I dati di utilizzo citati sono misurati sul database di produzione e su Vercel
Analytics (3 mesi), non stimati.

---

## 1. Il punto su cui le due agenzie concordano

Le due offerte sono state scritte in modo indipendente e arrivano alla stessa
conclusione: **BridgeLab è l'asset centrale del piano biennale**, non un canale
fra gli altri.

> «La piattaforma web gratuita di autoapprendimento BridgeLab (www.bridgelab.it)
> costituisce l'asset tecnologico e strategico centrale dell'intero Piano
> Biennale FIGB 2027-2028» — Dunters, cap. C

> «Sarà necessario costruire un ecosistema integrato: BridgeLab al centro del
> funnel di acquisizione» — Adiacent, cap. A

Concordano anche su tre cose più concrete:

1. **La registrazione su BridgeLab è il KPI primario del paid media.** Entrambe
   costruiscono le campagne Meta e Google con obiettivo "iscrizione alla
   piattaforma", non traffico generico.
2. **Il collo di bottiglia è il passaggio online → territorio.** Entrambe
   dedicano una sezione al problema di portare l'utente digitale dentro un
   circolo fisico.
3. **Serve infrastruttura di tracciamento prima di spendere in advertising.**
   Dunters mette l'audit tecnico e il setup del tracciamento nella Fase 1
   (mesi 1-2), prima di qualunque campagna.

## 2. Dove divergono, e perché conta per la valutazione

**Gli obiettivi numerici sono incomparabili fra loro.**

| | Obiettivo dichiarato | In valore assoluto |
|---|---|---|
| Dunters | 3.214 lead Meta (CPL € 2,80) + 1.212 lead Google (CPL € 3,30) | **~4.400 nuove registrazioni** |
| Adiacent | +20% registrati (conservativo) / +40% (target) | **~220-435 nuove registrazioni** |

Su una base attuale di **1.087 account**, Dunters promette una crescita di
cinque volte, Adiacent di un quinto. Non è una differenza di prezzo: è una
differenza di un ordine di grandezza su ciò che si impegnano a consegnare.

Questa è una domanda da porre in sede di valutazione, perché una delle due cifre
è quasi certamente sbagliata — o Dunters sta promettendo un volume che il CPL
dichiarato non regge, o Adiacent si sta cautelando molto. Entrambe le ipotesi
sono legittime, ma vanno chiarite prima dell'aggiudicazione, non dopo.

**Approccio diverso alla natura del prodotto.** Adiacent propone un
riposizionamento di marca (BridgeLab «da piattaforma a brand», mascotte
"Assodino", tono da videogioco, chess.com e Duolingo come benchmark). Dunters
resta su un impianto di performance marketing e SEO, con BridgeLab come
"directory" e hub di atterraggio. La prima comporta lavoro di prodotto, la
seconda soprattutto lavoro di traffico.

## 3. L'audit di Adiacent: cosa è vero e cosa non lo è più

Adiacent è l'unica delle due ad aver fatto un audit puntuale della piattaforma.
Il giudizio d'insieme è positivo — «base tecnica e visiva eccellente»,
«interfaccia innovativa», «fortemente user-friendly» — ma elenca quattro
criticità. Vanno separate:

| Criticità rilevata | Stato reale al 2026-08-10 |
|---|---|
| «Nessuna comunicazione post-registrazione. Nessuna mail di avvenuta registrazione o di invito a completare i percorsi» | ❌ **Non più vero.** L'automazione email (benvenuto + drip + riattivazione, Resend + cron) è in produzione dal 2026-07-17, tre giorni prima del deposito delle offerte. |
| «Assenza di contatto diretto con i circoli territoriali» | ✅ **Vero e confermato.** La tabella `asd_clubs` non ha alcuna colonna email o telefono: solo indirizzo, città, provincia, CAP e coordinate. |
| «Mancanza di ganci alla conversione per utenti non registrati» | ✅ **Vero.** |
| «Barriera d'ingresso cognitiva: tone of voice sbilanciato verso chi conosce già il gioco» | ⚠️ **Da verificare.** È un giudizio qualitativo, non misurabile con i dati che abbiamo. |

Adiacent registra anche un dato che conferma la nostra analisi interna: **«il
sondaggio rileva che gli utenti già tesserati non conoscono l'esistenza di
questa piattaforma»**. Il problema di BridgeLab non è la qualità del prodotto,
è che quasi nessuno sa che esiste.

## 4. Il dato che dovrebbe cambiare l'ordine dei lavori

Dalle misure sul database di produzione (1.087 account):

- **353 iscritti (32%) non hanno mai fatto nulla**: né una mano, né un modulo.
  231 di loro non sono mai tornati dopo il giorno dell'iscrizione.
- **403 hanno completato almeno un modulo, e chi inizia va a fondo**: media di
  45 moduli su 199, il 69% ne completa almeno dieci. Il contenuto didattico
  funziona.
- **331 giocano ma non hanno mai aperto una lezione.**

Da qui discende l'osservazione più importante di tutto questo documento:

> Con il tasso di attivazione attuale, su 4.400 registrazioni acquistate da
> Dunters a € 2,80 di CPL, circa **1.400 evaporerebbero entro il primo giorno**,
> bruciando **~ € 4.000 di budget media** senza produrre nulla.

Sistemare l'attivazione **prima** di comprare traffico non è una preferenza
tecnica: è la differenza fra spendere bene e spendere male il budget federale.
Va detto in sede di negoziazione e va messo a cronoprogramma.

Nota di metodo: il 32% è calcolato su tutti gli iscritti storici, comprensivi di
chi si è registrato in periodi senza alcuna campagna di richiamo. Il tasso su
traffico a pagamento potrebbe essere migliore (utenti auto-selezionati da un
annuncio) o peggiore (traffico più freddo). L'ordine di grandezza regge in
entrambi i casi.

---

## 5. Piano di implementazione

Ordinato per dipendenza, non per desiderabilità. Le fasi 0 e 1 vanno chiuse
prima che parta il paid media, altrimenti si paga per riempire un secchio
bucato.

### Fase 0 — Rendere la piattaforma misurabile (prima dell'avvio campagne)

Senza questi, nessuna delle due agenzie può lavorare: entrambe costruiscono
retargeting e pubblici simili sui dati di conversione.

| Intervento | Perché | Stato |
|---|---|---|
| **Meta Pixel + Conversions API server-side** | Assente. Blocca retargeting, lookalike e ottimizzazione automatica delle campagne Meta, che valgono il 30% del budget Adiacent e € 9.000 di Dunters. | da fare |
| **Tassonomia eventi di conversione** | Serve un evento per: registrazione, prima mano giocata, terza sessione (soglia di abitudine citata da Adiacent), modulo completato, click verso un circolo. Oggi tracciamo solo la registrazione (Google Ads). | da fare |
| **Cattura e persistenza UTM sul profilo** | Adiacent chiede attribuzione per singolo creator («parametri UTM dedicati per creator»). Senza persistenza sul profilo non si può collegare una registrazione alla fonte. | da fare |
| **GA4** | Già attivo (`G-38HB5NQGG1`). | ✅ fatto |
| **Cruscotto funnel + DAU/MAU** | Entrambe le agenzie chiedono DAU/MAU come KPI di abitudine. Il pannello admin ha già i dati grezzi, manca la vista. | parziale |

### Fase 1 — Non perdere chi arriva (in parallelo alla Fase 0)

Questo è il punto §4. È anche il lavoro con il ritorno più alto per unità di
sforzo, perché agisce su un problema già misurato.

1. **Portare il nuovo iscritto dentro una mano, non su una home.** Oggi la
   registrazione termina sulla pagina principale, che è una vetrina.
   `/prima-mano` esiste ed è fatta apposta, ma in tre mesi l'hanno vista 230
   persone: nessuno ci viene indirizzato. Attacca direttamente i 231 che non
   sono mai tornati.
2. **Ganci alla conversione per l'utente anonimo** (criticità Adiacent
   confermata). L'accesso senza registrazione è un punto di forza riconosciuto
   da entrambe le agenzie — va conservato, ma accompagnato: dopo N mani
   anonime, mostrare cosa si sblocca registrandosi (salvataggio progressi,
   classifica, sfide).
3. **Ponte gioco → lezione.** 331 persone giocano e non hanno mai aperto una
   lezione. Il momento utile è la fine di una mano persa: la pagina di analisi
   post-partita esiste già (858 visitatori in 3 mesi) ed è il posto naturale
   per "questa mano è spiegata qui".

### Fase 2 — Il ponte verso il territorio (mesi 3-6)

È l'obiettivo dichiarato di entrambe le offerte e il punto in cui il piano
federale si gioca davvero, perché è lì che un utente diventa un tesserato.

1. **Contatti dei circoli** (email e telefono) in `asd_clubs`, esposti nella
   mappa. Criticità Adiacent confermata sul campo: oggi la colonna non esiste.
   Richiede una raccolta dati lato FIGB, quindi va avviata **subito** perché ha
   il tempo di attraversamento più lungo di tutto il piano.
2. **CTA "contatta il circolo" tracciata**, così il passaggio online → offline
   diventa un evento misurabile invece che un salto nel buio. Senza questo,
   nessuna delle due agenzie può rendicontare la conversione finale che
   entrambe promettono.
3. **Sblocco premio a traguardo** — «Hai le basi per giocare dal vivo, riscatta
   la prima lezione nel club più vicino» (proposta Adiacent C.3). Da valutare
   con la FIGB: implica un impegno dei circoli, non solo software.
4. **Handoff WhatsApp**: nella versione economica è un link con messaggio
   precompilato, non il bot conversazionale completo. Copre il 90% del
   beneficio a una frazione del costo, e può precedere la scelta se attivare la
   WhatsApp Business API.

### Fase 3 — La leva sociale (mesi 6-12)

Adiacent fonda l'intera strategia su un insight della sua ricerca:
«l'interesse per un apprendimento online puramente autonomo e gratuito, se
proposto da solo, risulta tiepido: le persone si attivano con un compagno, un
contesto sociale o un evento».

I nostri dati lo confermano in modo brutale: la sfida a un amico ha **144**
visitatori in tre mesi contro i **4.400** della sfida al computer. Trenta volte
meno.

1. **Rilanciare la sfida fra amici.** La ricerca per nome BBO era rotta fino
   all'agosto 2026 — le richieste di amicizia arrivavano alla persona
   sbagliata — ed è esattamente il meccanismo che alimenta quel numero. È stata
   corretta: **prima di riprogettare, rimisurare.**
2. **Partner matching** (proposta Adiacent C.1): filtri per età, livello, città
   e disponibilità. Risponde alla barriera più citata nella loro ricerca, «non
   ho nessuno con cui giocare». È la funzione nuova più sostanziosa richiesta
   dalle offerte.
3. **Card di condivisione** con punti, livello, precisione e mani giocate,
   pronta per Instagram (specifica Adiacent). Una versione esiste già: va
   allineata alla specifica.

### Fase 4 — "BridgeLab v2" (mesi 12-18)

Adiacent mette esplicitamente "BridgeLab v2" nel trimestre T5. Il contenuto
dipende da chi vince:

- **Se vince Adiacent**: integrazione della mascotte "Assodino" negli stati
  emotivi dell'app (passaggio di livello, streak, vittoria, sconfitta),
  riposizionamento del tono di voce, allineamento visivo al toolkit Canva degli
  Enti Affiliati.
- **Se vince Dunters**: landing page verticali ottimizzate SEO, interlinking da
  `bridgeditalia.it`, ottimizzazione dell'onboarding mobile sul format
  MiniBridge.

Da non pianificare in dettaglio prima dell'aggiudicazione.

---

## 6. Due questioni da chiudere prima della firma

### 6.1 Accesso dell'agenzia ai dati personali

Dunters prevede di collegare a un cruscotto «i dataset di Google Analytics 4,
Meta Ads Manager, Google Ads, TikTok Ads, Mailchimp **e il database interno
delle registrazioni di BridgeLab**».

Quel database contiene nome, email e comportamento di apprendimento di persone
fisiche. Collegarlo a uno strumento dell'agenzia significa che l'agenzia diventa
**sub-responsabile del trattamento**, con tutto ciò che ne consegue: catena
art. 28 GDPR a valle dell'accordo già in essere fra FIGB e Tourbillon Tech,
istruzioni documentate, misure di sicurezza verificabili, e una posizione
esplicita sul trasferimento extra-UE (Dunters non specifica dove risiede il
cruscotto).

**Raccomandazione**: concedere all'agenzia dati **aggregati** (conteggi, tassi,
serie storiche), non l'anagrafica. Tutte le metriche che entrambe le offerte
dichiarano di voler misurare — registrazioni, DAU/MAU, tasso di conversione,
CPL — sono calcolabili su dati aggregati. L'accesso nominativo non serve a
nessuno degli obiettivi dichiarati, e va negato salvo motivazione puntuale.

### 6.2 Capacità tecnica al volume promesso

Se l'obiettivo Dunters fosse centrato, la piattaforma passerebbe da 1.087 a
~5.500 account in ventiquattro mesi. Da verificare prima, non dopo:

- limiti del piano Supabase (righe, banda, connessioni concorrenti);
- tenuta delle query del pannello admin, che oggi caricano l'anagrafica intera
  in memoria — la paginazione a 1.000 righe è già stata sistemata, ma il
  disegno resta "carica tutto";
- costi Vercel su un traffico moltiplicato, soprattutto per i ~15 GB di video
  in `public/`;
- carico di assistenza: oggi le segnalazioni degli utenti arrivano via canali
  informali e vengono gestite a mano.

---

## 7. Sintesi operativa

**Da avviare subito, indipendentemente da chi vince** — sono prerequisiti di
entrambe le offerte e hanno tempi di attraversamento lunghi:

1. Meta Pixel + Conversions API e tassonomia degli eventi di conversione.
2. Raccolta dei contatti dei circoli (dipende dalla FIGB: è il vincolo più
   lento del piano).
3. Instradamento del nuovo iscritto dentro `/prima-mano`.

**Da decidere in sede di valutazione delle offerte:**

4. Chiarire la discrepanza sugli obiettivi di registrazione (4.400 contro 435).
5. Vincolare contrattualmente l'agenzia a dati aggregati, non nominativi.
6. Correggere l'audit di Adiacent sull'automazione email, che è già in
   produzione: non va pagata due volte.
