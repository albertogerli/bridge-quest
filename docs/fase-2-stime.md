# Fase 2 — le quattro cose rimandate, con i costi

Deciso in riunione: *«per uscire facciamo quello che è fondamentale»* (Frola),
*«tutte le cose che richiedono un po' di tempo le mettiamo in fase 2»*
(Trevissoi). Qui non si implementa niente: si dice quanto costano.

---

## 1 · Predefinire dichiarazione e gioco carta per carta

> La domanda posta: **una settimana o un mese?** Risposta: **una settimana per
> la versione che serve davvero, un mese per «come BBO».** Sono due cose
> diverse e conviene non confonderle.

### Cosa c'è già, e non me l'aspettavo

- `esercizi_posizione` ha **già** le colonne `bids`, `played`, `posizione`: una
  dichiarazione e una sequenza di carte si possono già salvare.
- `salva-esercizio.tsx` le **valorizza già**: l'insegnante gioca la mano al
  tavolo di studio e quello che ha fatto viene catturato. L'autore esiste, e
  non è un modulo da compilare — è «gioca e salva», che per un insegnante è
  molto meglio.
- Il motore in `src/lib/bridge-engine.ts` è puro e testato: `getValidCards`,
  `determineTrickWinner`, `parseContract` fanno già il lavoro difficile.

### Cosa manca davvero

1. **Ripartire da metà mano.** `createGame(hands, contract, declarer, lead)`
   parte sempre da tredici carte in mano. Serve una funzione che, date le
   giocate registrate, ricostruisca lo stato — una piega sulle carte usando le
   funzioni che ci sono già. **Mezza giornata, test compresi.**
2. **La modalità «guidata»**, che è il cuore: l'allievo può giocare *solo* la
   carta prevista, e se ne prova un'altra riceve il perché invece di un errore.
   È una restrizione su `getValidCards`, più il messaggio. **Due giorni.**
3. **La stessa cosa sulla dichiarazione.** Più semplice del gioco: le
   dichiarazioni sono una lista, non ci sono regole di seme. **Un giorno.**
4. **Rifiniture dell'autore**: rivedere e correggere una sequenza salvata senza
   rigiocare tutta la mano. **Uno o due giorni.**

**Totale: cinque o sei giorni di lavoro pieno.** Una settimana.

### Che cosa invece è un mese

«Come sul tavolo di insegnamento di BBO» vuol dire anche: più tavoli in diretta
sincronizzati, l'insegnante che ferma tutti a metà mano, torna indietro di due
prese e fa ripartire, e vede in tempo reale cosa sta facendo ognuno. **Quella
è la sincronizzazione in diretta, ed è il mese** — ed è anche il punto 2 qui
sotto, con cui va fatta insieme o non va fatta.

**Raccomandazione**: la settimana produce una cosa completa e utile —
l'insegnante prepara una mano guidata, l'allievo la esegue passo passo. Il mese
si decide dopo aver visto se la usano.

---

## 2 · Rivedere cosa hanno dichiarato e giocato tutti i tavoli

**Costo: due o tre settimane.** Tocca: registrazione di ogni carta giocata in
aula (oggi si salva l'esito, non la sequenza), una vista per tavolo, e il peso
sul database — 1529 mani giocate diventano decine di migliaia di righe se si
salva carta per carta.

**Parte utile subito**: salvare la sequenza delle carte *da adesso*, senza
ancora costruire la vista. È lo stesso ragionamento delle presenze — il dato
non si recupera dopo. Costo: **un giorno**, e sblocca sia questo punto sia il
punto 1 in versione «rivedi la tua mano vera».

---

## 3 · Tabella di tutti i contratti possibili

**Costo: due giorni.** È la cosa meno cara delle quattro, perché il calcolo
esiste già: `bridge-dds` fa la tabella double-dummy completa, e in questa
sessione l'abbiamo usato per correggere le mani irrealizzabili
(`scripts/dds.mjs`).

Manca solo: calcolarla per le mani del catalogo e conservarla (è fissa, si
calcola una volta), e disegnare la griglia 4×5. **Un giorno di calcolo in
blocco, uno di interfaccia.**

Attenzione a una cosa: la tabella dice cosa si *può* fare vedendo tutte e
quattro le mani. A un principiante va spiegato, o pensa di aver giocato male
quando ha giocato benissimo al buio.

---

## 4 · Testo esplicativo mano per mano

**Costo: mezza giornata**, ed è quasi tutto già fatto.

Le note esistono già (`src/lib/note-smazzate.ts`, usate nella dispensa). Serve:
un campo di testo sulla mano dell'insegnante e la sua comparsa a fine mano.

Come ha detto Trevissoi, per le mani federali *«questo ti arriverà gratis»* col
pacchetto di slide. Quindi il lavoro vero è **importare quei testi quando
arrivano**, ed è un problema di formato, non di codice: se arrivano in un foglio
con una colonna «mano» e una «commento», è uno script di un'ora.

---

## Il quadro

| | costo | quando |
|---|---|---|
| 4 · testo per mano | mezza giornata | si può fare subito |
| 3 · tabella dei contratti | due giorni | quando serve |
| 1 · mano guidata (versione utile) | **una settimana** | dopo fine settembre |
| 2 · salvare le carte giocate | un giorno | **conviene subito** — il dato non si recupera |
| 1+2 · «come BBO», in diretta | **un mese** | da decidere dopo averlo visto usare |

**La sola cosa che sballerebbe i tempi è confondere la settimana col mese.**
Sono due prodotti diversi: il primo è un esercizio guidato che l'allievo fa per
conto suo, il secondo è una lezione dal vivo su più tavoli.
