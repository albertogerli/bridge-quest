# Bozze email — nomi BBO duplicati (gruppo B)

Preparate il 2026-08-10. **Da rileggere e inviare a mano**: non sono agganciate
ad alcun invio automatico.

## Perché queste email

Su BBO ogni nome utente è unico al mondo. Su BridgeLab risultavano 18 nomi BBO
dichiarati da due o più account: è la causa della segnalazione di un'utente che
aveva chiesto l'amicizia a un'amica e la richiesta era arrivata a un'altra
persona.

I 18 casi sono stati divisi in tre gruppi (dettaglio in
`scripts/sql/bbo-username-cleanup-group-a-2026-08.sql`):

- **A — 9 casi**, risolti d'ufficio il 2026-08-10: un account attivo e uno
  abbandonato subito dopo l'iscrizione. Nessuna email necessaria.
- **B — 4 casi**, oggetto di queste bozze: stesso nome visualizzato su più
  account, quasi certamente la stessa persona iscritta due volte.
- **C — 5 casi**, lasciati come sono: probabilmente persone diverse che hanno
  inserito il proprio nome di battesimo al posto del nome BBO.

## Destinatari

Quattro persone, per un totale di **7 account**. Gli indirizzi sono in
`tmp/bbo-gruppo-b-destinatari.txt` (fuori dal repository, non versionato).

| Caso | Account | Situazione |
|---|---|---|
| `pierlouis` | 3 | 14.136 XP / 2.035 / 60. Due sono nello stesso circolo (F0141). |
| `mrzvll` | 2 | 2.996 XP (usato fino al 20/07) e 460 XP (aperto il 31/07, in uso). |
| `franca` | 2 | 2.388 XP e 2.248 XP, entrambi fermi da maggio-giugno. |
| `didi` | 2 | 585 XP e 420 XP, entrambi fermi da marzo-aprile. |

**Nota su `pierlouis` — la causa è un errore di battitura nell'email.** I tre
indirizzi sono lo stesso nome su tre domini: `yahoo.it`, `yaoo.it`, `uahoo.it`.
Gli ultimi due **non esistono**: dichiarano un null MX (RFC 7505), cioè
rifiutano formalmente ogni messaggio. Questa persona ha sbagliato a scrivere il
proprio indirizzo, non ha mai potuto ricevere un reset password e si è
re-iscritta. **Scrivere solo a `@yahoo.it`**, che per fortuna è anche l'account
principale (14.136 XP): agli altri due non arriverebbe nulla.

Stessa dinamica, più sfumata, per `franca`: `spigafrana0@` contro
`spigafranca0@` (manca una lettera). Il dominio è gmail in entrambi i casi,
quindi recapitabile, ma una delle due caselle potrebbe non esistere.

**Nota su `mrzvll` — caso ambiguo, non dare per scontato che sia la stessa
persona.** I due indirizzi sono `michela.ramos@alice.it` e
`maurizi.villelma@gmail.com`, con lo stesso nome visualizzato (MRZMIKY) e lo
stesso handle. Possono essere due familiari che condividono un unico account
BBO — cosa comune fra i giocatori — oppure la stessa persona con due caselle.
La **variante 2** è scritta per non presumere: chiede, invece di proporre una
fusione. Il secondo account è stato aperto il 31 luglio ed è l'unico in uso dal
20 luglio, quindi vale comunque la pena segnalare i progressi rimasti sul
primo.

**Nota sul consenso**: `mrzvll` ha `marketing_consent = false` su entrambi gli
account. Queste comunicazioni riguardano lo stato del suo account e non sono
marketing, quindi il consenso commerciale non le blocca — ma per la stessa
ragione **non vanno inviate tramite il flusso delle email promozionali** e non
devono contenere inviti a usare il prodotto o richiami ad altre iniziative.

---

## Variante 1 — due account, entrambi fermi (`pierlouis`, `franca`, `didi`)

> **Oggetto:** Il tuo profilo BridgeLab risulta doppio
>
> Ciao NOME,
>
> ti scriviamo per una piccola cosa che abbiamo notato controllando gli account
> di BridgeLab: risultano NUMERO profili diversi registrati con lo stesso nome
> BBO (HANDLE). Con ogni probabilità sono entrambi tuoi — capita di iscriversi
> due volte senza accorgersene, magari con due indirizzi email diversi.
>
> Non è successo nulla di grave e nessuno ha potuto vedere i tuoi dati. L'unico
> inconveniente è che i tuoi progressi sono divisi fra i due profili, e che chi
> ti cerca fra gli amici tramite il nome BBO potrebbe finire su quello
> sbagliato.
>
> Ci diresti quale vuoi tenere come profilo principale? Ti basta rispondere a
> questa email indicando l'indirizzo con cui ti registri di solito. Al resto
> pensiamo noi: dall'altro profilo togliamo soltanto il nome BBO, senza
> cancellare niente.
>
> Se preferisci lasciare le cose come stanno va benissimo lo stesso — ce lo
> dici e non ne parliamo più.
>
> Grazie,
> Il team di BridgeLab

**Da personalizzare prima dell'invio**: `NOME`, `NUMERO` (due, tre per
`pierlouis`), `HANDLE`.

Per `pierlouis`, sostituire il secondo capoverso con:

> Con ogni probabilità sono tutti e tre tuoi: due risultano iscritti allo stesso
> circolo, quindi è quasi certo che si tratti della stessa persona.

---

## Variante 2 — due account con lo stesso nome BBO, forse due persone (`mrzvll`)

Da inviare **a entrambi** gli indirizzi. Non presume che siano la stessa
persona: se sono due familiari che condividono l'account BBO, la variante 1
suonerebbe sbagliata.

> **Oggetto:** Una domanda sul tuo profilo BridgeLab
>
> Ciao,
>
> ti scriviamo per una verifica veloce. Su BridgeLab ci sono due profili che
> indicano lo stesso nome BBO (mrzvll): uno registrato a maggio e uno a fine
> luglio.
>
> Può darsi che siano entrambi tuoi, oppure che tu condivida l'account BBO con
> un familiare — capita spesso e va benissimo. Ce lo diresti? Ci serve solo per
> far funzionare bene la ricerca degli amici: oggi chi vi cerca con il nome BBO
> non sa su quale dei due profili finirà.
>
> Ti segnaliamo anche che sul profilo di maggio sono rimasti quasi 3.000 punti
> esperienza e una quarantina di mani giocate, se per caso non riuscivi più a
> entrarci.
>
> Non cancelliamo nulla e non serve che tu faccia niente: ci basta una risposta
> a questa email.
>
> Grazie,
> Il team di BridgeLab

---

## Dopo la risposta

Per liberare il nome BBO da un profilo, riusare la migrazione del gruppo A: il
valore va prima salvato in `bbo_username_cleanup_2026_08` (così l'operazione
resta annullabile), poi azzerato su `profiles`. Non cancellare l'account.

Quando tutti i duplicati saranno risolti si potrà creare l'indice unico
parziale (punto 2 del piano), che oggi fallirebbe.
