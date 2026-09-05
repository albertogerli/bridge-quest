# Che cosa finisce dove — da approvare prima della funzione dei permessi

Due famiglie, come deciso: **contenuti didattici** = divieto vero applicato dal
server; **funzioni ludiche** = solo tolte dall'evidenza, mai vietate.

Sotto, tutte le rotte del portale classificate. Poi le tre cose su cui mi fermo.

---

## A · Contenuti didattici — divieto vero (server)

Il criterio: **consumano il percorso**. Se l'allievo ci arriva prima che
l'insegnante l'abbia spiegato, la lezione in aula perde di senso.

| rotta | cosa è |
|---|---|
| `/lezioni`, `/lezioni/[id]`, `/lezioni/[id]/[modulo]` | le lezioni oltre quelle assegnate |
| `/impara` | l'indice delle lezioni |
| `/dispense` | i materiali — sbloccati per lezione |
| `/classi/[id]/compito/[id]` | il compito e le sue soluzioni |
| `/classi/[id]/esercizio/[id]` | gli esercizi di posizione |
| revisione di una mano assegnata | governata da `assignments.soluzioni` |
| `/ripasso` | ripete i moduli di lezione — segue le lezioni sbloccate |
| `/prima-mano`, `/scuola` | il percorso introduttivo guidato |

Applicazione: RLS e controlli lato server, come già fa `assignments.soluzioni`.
Un indirizzo passato nel gruppo WhatsApp della classe non deve funzionare.

## B · Funzioni ludiche e pratica libera — solo non in evidenza

Il criterio: **le vede già chiunque si registri senza essere in una classe.**
Vietarle a chi si iscrive a un corso vorrebbe dire che iscriversi TOGLIE
qualcosa. Assurdo da spiegare, pessimo da vivere.

| gruppo | rotte |
|---|---|
| Pratica libera | `/gioca/pratica`, `/pratica-licita`, `/dichiara`, `/quale-contratto`, `/quiz-prese`, `/impasse`, `/segnali`, `/cosa-apri`, `/trova-errore` |
| Mini-giochi | `/gioca/memory`, `/conta-veloce`, `/quiz-lampo`, `/minibridge` |
| Sfide e tornei | `/gioca/torneo`, `/torneo-licita`, `/sfida*`, `/mano-del-giorno`, `/licita`, `/licita-amico` |
| Vita sociale | `/amici`, `/classifica`, `/forum`, `/negozio`, `/collezione`, `/obiettivi`, `/profilo/wrapped` |

## C · Sempre visibili, fuori dal rubinetto

`/profilo` · `/impostazioni` · `/accessibilita` · `/glossario` · `/guida` ·
`/classi` e la propria classe · `/privacy` · `/termini`

E soprattutto **`/trova-circolo` e `/trova-compagno`**: sono le due cose che
portano l'allievo *dentro* il circolo. Nasconderle a un allievo di un corso
sarebbe l'esatto contrario dell'obiettivo dichiarato in riunione.

---

## Le tre cose su cui mi fermo

### 1 · La revisione delle mani **non passa dal server** — e questo rompe il piano

`/gioca/analisi` legge la mano da **`localStorage`**
(`bq_game_history`, `bq_last_game_for_analysis`), non dal database. La mano
giocata è già sul dispositivo dell'allievo.

Quindi **un divieto lato server su quella rotta non protegge niente**: i dati
sono già lì, e chi vuole li rivede anche a portale spento. Promettere
all'insegnante che «la revisione la apre lei» sarebbe una promessa falsa — cioè
esattamente la cosa da evitare.

Le strade, in ordine di onestà:

- **(a)** Distinguere i due casi. La revisione delle **mani del compito** passa
  già dal database e si blocca davvero. La revisione delle mani giocate **in
  pratica libera** resta all'allievo: sono partite sue, contro il computer, che
  non consumano nessuna lezione. *È quella che consiglio*, ed è probabilmente
  ciò che Trevissoi intende: la sua frase parla di *«le mani»* del corso.
- **(b)** Smettere di salvare in `localStorage` e far passare tutto dal
  database. Blocco vero ovunque, ma si perde la revisione offline — e la PWA
  offline è una cosa che oggi funziona.
- **(c)** Dirgli che su quelle non possiamo garantire nulla.

**Domanda per lui**: *«quando dice che è lei a rendere disponibili le mani,
intende quelle che ha assegnato lei, o anche quelle che l'allievo gioca per
conto suo contro il computer?»*

### 2 · `/gioca/smazzata` sta davvero a cavallo

È la rotta con cui si gioca una mano del **catalogo federale** — cioè contenuto
didattico — ma nel modo di una pratica libera, e la vede anche l'utente esterno.

- Trattata come **A**: un esterno la vede e un allievo no. Incomprensibile.
- Trattata come **B**: l'allievo può giocarsi in anticipo le mani della lezione
  di giovedì. Consuma il percorso.

**Proposta**: **B**, ma le mani **della lezione non ancora assegnata** non
compaiono nell'elenco e non si aprono per indirizzo. Cioè: la funzione è
ludica, il contenuto dentro è didattico. Costa poco perché il legame mano-lezione
esiste già (`Smazzata.lesson`).

### 3 · `/dispense` l'abbiamo appena collegata dalla classe

Ieri ho messo «Materiali del corso» nella pagina della classe dell'allievo. Se
`/dispense` diventa A, quel collegamento va reso coerente: mostra solo i corsi
delle lezioni assegnate, che è già come funziona, ma il **blocco per lezione**
oggi è client-side (`isLessonStarted` guarda i moduli completati in locale).

Va spostato sul server insieme al resto. Lo segnalo perché è lavoro in più
rispetto a quanto avevo stimato nel piano: **mezza giornata**, non zero.

---

## Come procedo, appena mi rispondi

`permessiAllievo(userId)` restituisce due cose separate, e la separazione è il
punto:

```
{ vietati: string[],   // A — il server rifiuta
  nascosti: string[] } // B — la navigazione non li propone
```

Tenerle in un elenco solo sarebbe l'errore che rende il sistema o troppo
severo o bugiardo. Due elenchi, due meccanismi, e i test che verificano che
nessuna rotta finisca in tutti e due.
