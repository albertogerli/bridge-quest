# Proposta: una sola strada

*27 settembre 2026 — proposta di riorganizzazione del layout. Non è ancora una decisione.*

---

## 1. Il fatto che conta

**Il 62% di chi apre BridgeLab non apre mai una lezione.**

Su 172 persone attive negli ultimi trenta giorni, 65 hanno completato almeno un
modulo. Le altre 107 hanno solo giocato.

Non è che la parte didattica sia brutta: 49 lezioni, 199 moduli, 1002 moduli
completati in trenta giorni da chi ci arriva. È che il layout dice a tutti di
fare un'altra cosa — e la gente fa quello che il layout dice.

Guarda la barra in basso da un telefono:

```
 🏠        📖        ( 🎮 )        🏫        ⋯
Home     Impara      GIOCA      Scuola     Altro
                       ↑
          grande, al centro, rialzato, colorato
```

«Gioca» è il pulsante più grosso dello schermo. «Impara» è una voce di menu
come le altre, e dietro «Impara» non c'è ancora il percorso: c'è **un altro
menu**, con dentro il collegamento al percorso.

Il percorso vero dista **due tocchi** dall'ingresso. Il gioco ne dista uno, e
quell'uno è il più visibile.

---

## 2. Gli altri numeri, in fila

| misura | valore |
|---|---|
| Rotte totali | 93 |
| Pagine di gioco sotto `/gioca` | 28 |
| Pagine di gioco con **almeno un risultato** in 30 giorni | 13 |
| Pagine di gioco con **zero** risultati in 30 giorni | **15** |
| Quota dei primi tre giochi sul totale giocato | **92%** |
| Destinazioni raggiungibili in due tocchi dalla home | ~45 |
| Voci nel cassetto «Altro» | 8 |

I primi tre — *smazzata*, *sfida del giorno*, *mano del giorno* — fanno il 92%.
Gli altri venticinque si dividono l'8%.

Un dettaglio che vale più della percentuale: **`mano-guidata` ha 43 persone e
92 partite.** Due a testa. È la firma di una cosa che si prova una volta e non
si ritrova più — non di una cosa che non piace.

---

## 3. La diagnosi, in una frase

> Tre delle cinque schede — Home, Impara, Gioca — rispondono alla stessa
> domanda, «e adesso cosa faccio?», e nessuna delle tre ha l'ultima parola.

La risposta esiste già: si chiama `SuggestedNextStep`, sta nella home, ed è
**una scheda fra dodici**. La home monta dodici blocchi: eroe, prossimo passo,
scrigni, collezione, licita, trova-circolo, scheda insegnante, banner consenso,
richiamo notifiche, promemoria ospite, modale del riepilogo settimanale,
popup dei traguardi. Ognuno chiede attenzione. Nessuno decide.

È la stessa cosa scritta in `CLAUDE.md`, vista da un'altra angolazione: **la
prima schermata dà, non chiede.** Tre menu in fila sono tre domande in fila.

---

## 4. Cosa prendere da Duolingo, e cosa no

**Da prendere: una cosa sola.** Duolingo non ha una home. Ha *il percorso*. Il
percorso È la schermata iniziale, e a ogni apertura c'è esattamente un cerchio
che pulsa. Non ti fa scegliere: ti dice.

**Da NON prendere: la gamification.** Qui ce n'è già più che da loro — XP,
livelli, leghe, striscia, scrigni, negozio, collezione, traguardi, classifiche
per corso/ASD/gioco. Non manca l'incentivo: manca il posto dove guardare.
Aggiungerne altra peggiorerebbe esattamente il problema.

**Da NON prendere: le lezioni da due minuti.** Una mano di bridge dura otto
minuti e non si spezza. Il ritmo di Duolingo non è trasferibile, e provarci
distruggerebbe la cosa migliore che questo sito ha.

**Da NON prendere: la solitudine.** Duolingo è un'app che si usa da soli. Qui
c'è l'insegnante, e l'insegnante è il canale di distribuzione della FIGB. Va
messo al centro, non nascosto.

---

## 5. La proposta

### La barra scende da cinque voci a quattro, e nessuna è un menu

```
   🛤            🏋            🏫            👤
Percorso    Allenamento     Classe       Profilo
```

**La novità vera non è la barra: è che la Home sparisce.** L'indirizzo `/` non
mostra più un cruscotto — mostra il percorso. Quella schermata esiste già,
funziona già, si chiama «Il Percorso» e sta in `/lezioni`, con i suoi corsi e
i suoi mondi. **Non c'è da costruirla. C'è da smettere di nasconderla.**

### Prima e dopo

```
   OGGI                                   DOMANI
┌────────────────────────┐        ┌────────────────────────┐
│ ciao Marco  🔥3 ⭐1240  │        │ Cuori·Gioco 🔥3 ⭐1240  │
├────────────────────────┤        ├────────────────────────┤
│ [banner consenso]      │        │          ◯ ✓           │
│ [nudge notifiche]      │        │        ◯ ✓             │
│ [hai un codice?]       │        │          ◯ ✓           │
│ ┌────────────────────┐ │        │                        │
│ │ EROE: gioca subito │ │        │     ┌────────────┐     │
│ └────────────────────┘ │        │     │  ▶  14     │     │
│ Prossimo passo →       │ ←l'unica│    │ Il taglio  │     │
│ ┌────┐┌────┐┌────┐     │  che    │    │  TOCCA A TE│     │
│ │forz││coll││lici│     │  conta, │    └────────────┘     │
│ └────┘└────┘└────┘     │  ottava │          ◯             │
│ Scrigni · Collezione   │         │       ◯     🎁         │
│ Trova un circolo       │         │          ◯             │
├────────────────────────┤        ├────────────────────────┤
│🏠  📖  (🎮)  🏫   ⋯   │        │ 🛤   🏋   🏫   👤      │
└────────────────────────┘        └────────────────────────┘
  3 schede, stessa domanda           1 schermata, 1 risposta
```

### Cosa c'è in ciascuna delle quattro

**🛤 Percorso** — è `/lezioni` promosso a `/`. Corsi e mondi restano come sono.
Cambia una cosa: fra un nodo e l'altro il percorso **intercala il gioco che
allena quella lezione**. Finita «Il taglio», il nodo successivo non è la lezione
15: è una mano da giocare col taglio. È così che i 28 giochi smettono di essere
un menu e diventano il ritmo del percorso.

**🏋 Allenamento** — quello che oggi è `/gioca`, ma senza la pretesa di essere
la porta d'ingresso. Tre cose in cima (sfida del giorno, mano del giorno,
torneo: il 92% del giocato), e sotto una libreria cercabile con il resto.

**🏫 Classe** — compare **solo a chi una classe ce l'ha**. Per l'insegnante è
la stessa voce che porta al suo pannello. Sparisce la parola «Scuola», sparisce
la distinzione fra `/scuola`, `/classi` e `/impara` — tre nomi per cose che chi
guarda da fuori non distingue.

**👤 Profilo** — assorbe il cassetto «Altro»: amici, classifica, collezione,
negozio, obiettivi, impostazioni. Otto voci nascoste dietro «⋯» diventano una
pagina che si scorre.

### Cosa succede ai dodici blocchi della home

| blocco | dove va |
|---|---|
| Prossimo passo | **diventa la schermata** |
| Eroe «gioca subito» | eliminato: il percorso è già un invito |
| Scrigni, collezione, traguardi | Profilo |
| Licita, trova-circolo | nodi dentro il percorso, al punto giusto |
| Scheda insegnante | scheda Classe |
| Banner consenso, notifiche, ospite | restano, ma **uno per volta**, mai in pila |
| Riepilogo settimanale | resta modale, una volta a settimana |

---

## 6. I quindici giochi che nessuno apre

Quindici pagine su ventotto non hanno prodotto un solo risultato in trenta
giorni. Non propongo di cancellarle: propongo di **decidere**, una per una, fra
due destini.

1. **Entra nel percorso** — se allena una cosa che una lezione insegna, diventa
   il nodo di esercizio dopo quella lezione. Lì la gente ci arriva.
2. **Va in libreria** — resta raggiungibile da Allenamento, cercabile, e smette
   di occupare spazio nel menu di chi non la cerca.

Il criterio è uno: *questa cosa allena una lezione che esiste?* Se sì, il suo
posto è nel percorso; se no, è in libreria.

---

## 7. Cosa NON si tocca

- **I contenuti.** 49 lezioni, 199 moduli, 272 smazzate: non si riscrive niente.
- **I motori.** Engine, scoring, PBN, DDS, la catena BEN: fuori dal perimetro.
- **La gamification.** Resta tutta, si sposta nel Profilo.
- **L'insegnante.** Il portale ASD non si semplifica: è l'unica parte del sito
  con un utente che sa già cosa vuole.

Questa proposta riguarda **dove stanno le cose**, non cosa sono.

---

## 8. Il rischio, detto chiaro

**Il percorso presuppone un ordine, e il bridge non è il francese.** Chi arriva
sapendo già giocare non vuole ricominciare dalla lezione 1, e un percorso
lineare gli dice esattamente quello. Serve un modo di entrare a metà — una
prova d'ingresso, o la scelta del corso al primo accesso — e va progettato
prima, non dopo.

**Si perde il giocatore che vuole solo giocare.** Oggi ha un pulsante grande al
centro; domani ne ha uno normale in seconda posizione. Dei 107 che non studiano
mai, qualcuno userà meno il sito. La scommessa è che altri, messi davanti a una
strada invece che a un bivio, comincino a studiare. **È una scommessa, e va
misurata**: la percentuale di attivi che apre una lezione, oggi 38%, è il
numero da guardare dopo.

**Non si fa in una settimana.** È un cambio di navigazione: tocca la barra, la
home, tre hub e i punti d'ingresso di 28 giochi.

---

## 9. Come procederei

**Fase 1 — una settimana.** `/` mostra il percorso. La barra scende a quattro
voci. Niente altro. È il 90% del beneficio e si può annullare con un `git
revert`: nessuna tabella, nessun contenuto, nessuna migrazione.

**Fase 2 — due settimane.** I blocchi della home si spostano dove devono
andare; i banner smettono di impilarsi. Il Profilo assorbe il cassetto.

**Fase 3 — due settimane.** I giochi entrano nel percorso come nodi di
esercizio, uno per lezione, partendo dai tre che già funzionano.

**Fase 4 — da decidere.** I quindici giochi fermi: uno per uno, percorso o
libreria.

La Fase 1 da sola si misura: se dopo un mese la quota di attivi che apre una
lezione non si muove dal 38%, il problema non era il layout e le fasi 2-4 non
vanno fatte.

---

## La mezza pagina da portare in riunione

Il sito ha 49 lezioni, 199 moduli e 28 giochi. Funziona tutto. Ma sei persone
su dieci che lo aprono non vedono mai una lezione, e non perché non vogliano:
perché il pulsante più grande dello schermo dice «Gioca» e la strada per
studiare è nascosta dietro due menu.

Duolingo ha una cosa sola che qui manca, e non è la gamification — di quella ne
abbiamo di più. È che la loro schermata iniziale non è un menu: è la strada, con
un solo passo illuminato.

Quella strada qui c'è già, è fatta bene, e si chiama «Il Percorso». Proponiamo
di metterla all'ingresso al posto del cruscotto, e di far scendere la barra da
cinque voci a quattro. Una settimana di lavoro, nessun contenuto toccato,
reversibile in un minuto.

Poi si guarda un numero solo: oggi 38 persone su 100 aprono una lezione. Se fra
un mese non si muove, avevamo torto noi e non il layout.
