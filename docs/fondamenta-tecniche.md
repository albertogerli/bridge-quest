# Fondamenta tecniche — cosa c'è già, prima di costruirci sopra

Ricognizione del 19/08/2026, richiesta dal prompt 10bis del secondo lotto.
Decide la fattibilità degli interventi 10-14.

**In breve: tutte e quattro le fondamenta esistono già**, e tre sono più
complete di quanto il prompt supponesse. Il lavoro dei prossimi interventi è
quasi tutto interfaccia e collegamenti; l'unico pezzo di motore davvero nuovo è
il pannello delle probabilità di divisione (18), che è una formula.

---

## 1. Il solutore di doppio morto

**C'è.** È `bridge-dds`, cioè il DDS di Bo Haglund compilato in WebAssembly, già
fra le dipendenze e già usato in produzione. Non c'è niente da valutare fra le
due strade proposte: la scelta è stata fatta, ed è quella lato client.

| dove | cosa fa |
|---|---|
| `src/lib/dds-table.ts` | `calcDdsTable` (tabella completa 5 denominazioni × 4 posizioni), `calcPar`, `calcTableAndPar`, `solveBoard` |
| `src/lib/dds-exact.ts` | prese esatte di una singola linea di gioco |
| `src/lib/dds-select.ts` | costo in prese di ogni carta giocabile: è quello che alimenta il tavolo di studio |
| `src/lib/dds-replay.ts` | `analyseReplay` e `significantMoments` — **l'analisi presa per presa contro l'ottimo esiste già** |
| `src/lib/dds-worker.ts` | esecuzione fuori dal thread dell'interfaccia |
| `src/lib/par-contract.ts` | dal par grezzo al contratto assegnabile, con dichiarante |

**Client o server, la risposta pratica.** Sta sul client e va lasciato lì.
Il motivo non è ideologico: una tabella completa costa circa 1,3 secondi
(misurato in `dds-table.test.ts`), e su un server sarebbero 1,3 secondi di CPU
per board moltiplicati per ogni allievo che apre la stessa mano — su Vercel si
paga a tempo di esecuzione. Sul client è tempo che non costa niente a nessuno e
scala da solo. Il rovescio è che una tabella non si può calcolare durante
l'attesa di una pagina: va sempre trattata come asincrona, e l'interfaccia deve
funzionare anche mentre non c'è ancora (lezione imparata due volte in questa
sessione, l'ultima con la sfida IMP).

**Dove una cache lato server servirebbe davvero**: le mani del catalogo, che
sono sempre le stesse per tutti. Infatti `smazzate.dd_tricks` è già una colonna,
riempita da `scripts/valida-smazzate-dds.mjs`. Se in futuro servisse la tabella
completa e non solo le prese del dichiarante, il posto giusto è lì — una colonna
`dd_table jsonb` sulla smazzata — non un servizio.

## 2. Il canale realtime

**C'è**, su Supabase Realtime, ed è già usato per due cose: il tavolo condiviso
(`src/lib/live-table.ts:227` `watchLiveTable`) e le licite a due.

La struttura è deliberata e conviene riusarla identica per la vista proiezione:

- il canale trasporta solo una **campanella**, non i dati. All'`UPDATE` della
  riga, il client richiama `live_table_view()` e rilegge tutto. Il motivo sta
  scritto in `tavolo-condiviso-2026-08.sql:186`: con `replica identity default`
  nel payload viaggia solo la chiave primaria, quindi i dati andrebbero comunque
  richiesti;
- **c'è sempre un polling di riserva** ogni 5 secondi, attivo anche a canale
  sano. È la ragione per cui il tavolo non si pianta quando il WebSocket cade in
  una sala con il wi-fi del circolo.

**Regge due finestre?** Sì, ed è esattamente il caso d'uso già in produzione:
insegnante e allievo guardano lo stesso tavolo da due sessioni diverse. Due
finestre dello **stesso** browser sono un caso più facile, non più difficile.

Il punto delicato per l'intervento 10 è un altro, e non è il realtime: la vista
proiezione non deve **ricevere** le mani nascoste, non solo non mostrarle.
La strada c'è già ed è la stessa: `live_table_view()` filtra le mani in SQL
(`tavolo-condiviso-2026-08.sql:118-124`) e restituisce solo quelle che chi
chiama ha diritto di vedere. La vista proiezione deve passare da lì con una
sua condizione, non da una lettura diretta della tabella.

## 3. Come sono rappresentati mani, dichiarazione e gioco

**Smazzata**: `Record<Position, Card[]>`, con `Card = { suit, rank }`.
Tipi in `src/lib/bridge-engine.ts`, forma di catalogo in `src/lib/catalog.ts`
(`Smazzata`).

**Dichiarazione**: `{ dealer: Position, bids: string[] }`, le dichiarazioni in
forma canonica ASCII (`["1NT","P","3NT","P","P","P"]`). Il contratto risultante
è una stringa che `parseContract` legge in entrambe le notazioni, italiana
(`3SA`, `4♠`) e internazionale (`3NT`, `4S`).

**Gioco**: `{ seat: Position, card: Card }[]`, in ordine. È la stessa forma sul
tavolo condiviso (`live_tables.played`), nelle mani salvate
(`saved_hands.played`) e nei risultati dei compiti
(`game_results.details.play`).

**Serializzabile a metà?** Sì, ed è già fatto in due posti:

- `saved_hands` (`hands`, `contract`, `declarer`, `played`) — l'archivio
  dell'insegnante salva una posizione **esattamente dov'era**, carte già giocate
  comprese, e la riapre nel tavolo di studio;
- `live_tables`, con le stesse quattro colonne più i posti e cosa è scoperto.

Per l'intervento 12 (salva posizione come esercizio) non serve inventare un
formato: serve la stessa forma più la consegna, la risposta attesa e il legame
con un compito.

**PBN: c'è.** `src/lib/pbn.ts` importa (`parsePbn`) ed esporta (`dealToPbnString`,
`dealsToPbn`), ed è già collegato all'importazione dei compiti.

**LIN: non c'è.** Nessuna traccia in tutto il repository. Va detto perché il
prompt lo dà per possibile: serve solo per scambiare mani con BBO, e nessuno
degli interventi 10-14 lo richiede. Se servirà, è un modulo a sé di poche
decine di righe, simmetrico a `pbn.ts`.

## 4. Il generatore di mani

**C'è, ed è molto più di un generatore casuale.** `src/lib/deal-generator.ts`
accetta già vincoli su:

- punti onori per posizione e **per linea** (`nsHcp`, `ewHcp`);
- lunghezza di ogni singolo seme;
- mano bilanciata (definizione italiana: 4333, 4432, 5332);
- sagome ammesse (`["5431", "4432"]`);
- lunghezze **relative** (`piuLungo`), per i bicolori;
- cortezze, anche senza specificare il colore (serve per gli splinter);
- qualità del colore (quanti onori in una lunga);
- carte obbligate;
- **alternative in OR** (`oppure`), cioè «apre 1♠ oppure 1♥».

È deterministico a parità di seme, ha un tetto di tentativi e segnala quando ne
ha prodotte meno di quante richieste. Ha già i test.

Esistono `DEAL_TEMPLATES`, **sette** modelli in codice, e una tabella `scenari`
(`vincoli jsonb`, `autore_id`, `ufficiale`, `pubblico`, `modulo`, `slug`) con
sette righe, tutte ufficiali e pubbliche.

**Quindi l'intervento 11 non è «scrivere un motore di generazione»**: il motore
c'è ed è più espressivo di quanto il prompt chieda. Quello che manca è:

1. il **form** con menù e cursori — oggi i vincoli si scelgono da un elenco di
   modelli, non si compongono;
2. la libreria **personale** — `scenari` ha `autore_id` e `pubblico`, ma nessuna
   interfaccia per salvare, rinominare, duplicare o condividere;
3. i **modelli ufficiali per ogni lezione del Corso Fiori** — la colonna
   `modulo` esiste e non è valorizzata su nessuna delle sette righe. È il punto
   che il prompt indica come «quello che rende il portale utile al primo
   accesso», ed è anche l'unico che richiede scrivere contenuto e non codice.

---

## Cosa cambia nella stima degli interventi 10-14

| | il prompt suppone | com'è davvero |
|---|---|---|
| 10 · proiezione | realtime da verificare | c'è, e il filtro delle mani in SQL pure: resta la finestra e il pannello |
| 11 · generatore | motore da scrivere | motore completo; mancano form, libreria e i modelli per lezione |
| 12 · salva posizione | formato da definire | `saved_hands` lo fa già: manca la consegna e il legame col compito |
| 13 · replay | analisi da costruire | `analyseReplay` + `significantMoments` esistono e sono già a schermo in `turning-point-panel.tsx`; manca «rigioca da qui», i preferiti e il confronto di classe |
| 14 · PDF | da zero | `/istruttori/dispensa` stampa già con `@media print`; mancano le note sulle smazzate e i due formati |

L'unico pezzo di calcolo nuovo di tutto il lotto è il **18**, le probabilità di
divisione dei semi: una formula ipergeometrica su poche righe.
