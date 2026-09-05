# Lotto 2 — Le tre viste e la home guidata

**Piano da approvare prima di scrivere codice.** Traguardo: fine settembre.

---

## Il punto che decide il disegno

Trevissoi: *«l'allievo non può debordare più di tanto»*. Ma anche: verso fine
corso l'insegnante *vuole* aprire gli strumenti online.

**Non è un muro, è un rubinetto.** E il rubinetto ha un proprietario: se lo apre
l'insegnante, la piattaforma smette di essere il concorrente che gli porta via
gli allievi e diventa una cosa che comanda lui. È questa la condizione di
adozione, non la restrizione in sé.

Corollario di disegno che tengo fermo in tutto il resto: **all'allievo non si
mostrano porte chiuse.** Una funzione non ancora aperta semplicemente non è in
evidenza — non compare grigia con un lucchetto. Un lucchetto dice «ti stanno
tenendo fuori» e produce esattamente il senso di gabbia da evitare; l'assenza
dice «non è ancora il momento». Quando l'insegnante apre, la voce compare, e
compare come un regalo.

---

## Le tre viste

| vista | chi | cosa vede |
|---|---|---|
| **1 · Insegnante** | `role = instructor` | quello che c'è oggi, riorganizzato nel lotto 3 |
| **2 · Allievo di una classe** | ha una `class_members` attiva | il percorso del suo corso: compiti, materiali sbloccati, la sua classe. Il resto non è in evidenza |
| **3 · Esterno** | registrato, nessuna classe | mini-giochi, qualche mano, la vetrina. Non consuma il percorso didattico |

**La vista si deduce, non si sceglie.** Nessun campo nuovo su `profiles`: il
ruolo c'è già e l'appartenenza a una classe è una query che facciamo di continuo.
Un campo «tipo di vista» sarebbe un dato in più da tenere allineato, e si
disallineerebbe il giorno in cui uno entra in una classe.

**Chi sta in più classi** prende l'unione dei permessi: se un insegnante gli ha
aperto i tornei, li vede, anche se l'altro non li ha aperti. L'alternativa —
l'intersezione — farebbe sparire una cosa già concessa quando ci si iscrive a un
secondo corso, e sarebbe incomprensibile.

---

## Il rubinetto: quale granularità

Hai chiesto pro e contro prima di scegliere.

**A · Un interruttore per funzione** (tavolo libero, mini-giochi, tornei, mani
oltre le assegnate, revisione, forum, classifica, negozio, amici…)
*Pro*: controllo totale. *Contro*: dieci interruttori a un insegnante over 60
che ha quaranta iscritti da approvare. Nessuno li tocca, e il predefinito
diventa la sola cosa che esiste.

**B · Per gruppi** (Pratica libera · Sfide e tornei · Vita sociale)
*Pro*: tre decisioni, comprensibili. *Contro*: qualche accoppiata sbagliata —
chi vuole i mini-giochi ma non i tornei deve prendersi entrambi.

**C · Un interruttore solo** «percorso libero»
*Pro*: impossibile sbagliare. *Contro*: è tutto o niente proprio dove serve la
gradualità che descrive lui.

**D · Tre posizioni progressive** ← **la mia proposta**
`solo il corso` → `corso + pratica libera` → `tutto aperto`
*Pro*: **è la forma del rubinetto che descrive lui**, un cursore che si sposta
avanti man mano che il corso procede. Una decisione sola, e la direzione è
ovvia. *Contro*: meno fine di B.

**Proposta: D come comando principale, con B come «impostazioni avanzate»
richiudibile** per il minoranza che vuole la combinazione strana. Il cursore
scrive i tre gruppi sotto; chi apre le avanzate li muove a mano e il cursore
passa a «personalizzato».

Predefinito per una classe nuova: **`solo il corso`**.

---

## La revisione delle mani

Oggi l'allievo rivede le proprie mani quando vuole. Trevissoi: *«è l'insegnante
che le deve rendere disponibili dopo che le ha spiegate»*.

**Non serve niente di nuovo.** `assignments.soluzioni` esiste già, con la
visibilità applicata dal database (`scripts/sql/soluzioni-dopo-il-gioco-2026-08.sql`).
Si aggiunge un valore alla colonna esistente — `quando-l-insegnante-decide` — e
un pulsante «Apri la revisione» sul compito. Predefinito per i compiti nuovi:
chiuso.

**Attenzione al vincolo di non rompere niente**: i 14 compiti già assegnati
tengono il valore che hanno. Nessuno perde una revisione che oggi vede.

---

## Modifica di schema: sì, minima

Serve, e la preparo separata col rollback come al solito. Due colonne:

```
classes.accesso_libero  text default 'solo-il-corso'   -- il cursore
classes.permessi        jsonb default '{}'             -- le avanzate
```

Precedente identico già in tabella: `classes.risultati_nominativi`. Il resto —
viste, navigazione, revisione — è tutto `git revert`.

**La colonna `soluzioni` non cambia forma**: si aggiunge un valore ammesso al
CHECK, che è una modifica compatibile all'indietro.

---

## Come lo costruisco, in ordine

1. **`permessiAllievo(userId)`** — funzione pura, con i test, che dai
   `class_members` attivi e dalle impostazioni delle classi ricava che cosa
   quella persona può vedere. Unione fra classi. È il pezzo su cui poggia tutto
   il resto e l'unico che può sbagliare in silenzio.
2. **La navigazione filtrata** — `bottom-nav` e `desktop-nav` prendono le voci
   dai permessi invece che da una lista fissa. Niente lucchetti.
3. **La home dell'allievo** — il percorso del corso al posto della griglia
   attuale.
4. **La vista esterna** — sottoinsieme, e serve anche da vetrina.
5. **Il comando per l'insegnante** — il cursore a tre posizioni sulla classe.
6. **La revisione** — valore nuovo su `soluzioni` più il pulsante.

Uno alla volta, commit separati, e mi fermo dopo ciascuno come nel lotto
precedente.

---

## Le due cose su cui voglio il tuo via

**Il predefinito per le 18 classi che esistono già.** Se metto `solo-il-corso`
retroattivamente, 52 allievi domani mattina vedono meno di oggi — e il vincolo
dice di non togliere niente a chi è già dentro. Proposta: **le classi esistenti
partono da `tutto aperto`**, le nuove da `solo il corso`. Gli insegnanti attuali
sono venti e li conosci: possono stringere quando vogliono. Il rischio opposto —
un allievo che si lamenta di aver perso i mini-giochi — è peggio.

**Fin dove arriva «non in evidenza».** La mia proposta è: fuori dalla
navigazione, ma **l'indirizzo diretto continua a funzionare**. Cioè non lo
trovi, ma se hai il link non ti sbatte fuori. Il motivo: un blocco vero sulle
rotte è la cosa che rompe le PWA installate e i preferiti, ed è anche quella che
fa sentire l'allievo in gabbia. Se invece Trevissoi intende un divieto vero, si
fa — ma è una decisione sua, non nostra, e cambia il lavoro.
