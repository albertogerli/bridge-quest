# BridgeLab in inglese — progetto

Stato: **proposta**, nessuna riga scritta. Redatto il 18/08/2026 dopo una
ricognizione sul codice e sul database di produzione.

Il documento serve a decidere. Le stime sono ordini di grandezza dichiarati,
non impegni: dove non ho misurato, lo dico.

---

## 1. Cosa c'è da tradurre, misurato

| superficie | quantità | misurata come |
|---|---|---|
| Interfaccia (componenti e pagine) | 278 file `.tsx`; ~600 testi fra tag JSX e ~4.600 stringhe fra virgolette, da cui stimo **2.500–3.500 stringhe vere** rivolte all'utente | conteggio grezzo, va ripulito dai falsi positivi (classi CSS, chiavi, id) |
| Contenuti didattici nel database | **596.000 caratteri**, circa **90.000 parole** | somma dei campi testuali in produzione |
| — di cui moduli delle lezioni | 199 righe, 281.000 caratteri | `lesson_modules.content` |
| — smazzate commentate | 272 righe, 179.000 caratteri | `smazzate.commentary` |
| — eserciziario, glossario, trova-errore, carte | 134 righe, 124.000 caratteri | quattro tabelle |
| Infografiche / dispense | 404 file, **238 immagini distinte** (il resto sono varianti per profilo) | `public/infografiche` |
| Email transazionali | 1 file di modelli | `src/lib/email/templates.ts` |
| Video del maestro | **fuori ambito**, come chiesto | 49 file |

Due conseguenze che orientano tutto il resto:

- **Il testo delle dispense sta dentro le immagini.** Sono generate con Gemini
  (`scripts/generate-infografiche*.py`) a partire da prompt in italiano che
  contengono le frasi da disegnare. Non si traducono: si **rigenerano**.
- **I contenuti vivono nel database, non nel repository.** Il seed in
  `src/data/` diverge dalla produzione (è scritto in `CLAUDE.md`), quindi la
  traduzione si fa sul database e va versionata lì.

---

## 2. Una premessa di prodotto, in due righe

Il percorso didattico è quello federale FIGB, e i corsi si chiamano Fiori,
Quadri, Cuori. In inglese quella struttura non ha un equivalente riconosciuto:
un principiante americano si aspetta il percorso ACBL, un inglese l'EBU. La
traduzione dà a BridgeLab un pubblico internazionale, ma non lo rende un corso
riconosciuto altrove — vale la pena saperlo prima, perché cambia come si
scrivono i titoli dei corsi e la pagina di ingresso, non se farlo.

---

## 3. Le decisioni da prendere prima di cominciare

### 3.1 Dove vive l'inglese — *proposta: sottocartella `/en`*

| | pro | contro |
|---|---|---|
| **`bridgelab.it/en/...`** (proposta) | un solo deploy, un solo dominio da gestire, i link condivisi continuano a funzionare, SEO gestibile con `hreflang` | l'inglese sta sotto un dominio `.it` |
| `en.bridgelab.it` | più credibile per un pubblico estero | secondo dominio, certificati, cookie di sessione da condividere: lavoro in più per un beneficio di immagine |

### 3.2 Come si tengono le due lingue nel database — *proposta: colonne parallele*

| | pro | contro |
|---|---|---|
| **Colonne `_en` accanto alle esistenti** (proposta) | nessun join, letture invariate, si aggiunge una lingua sola e la vogliamo | una colonna per lingua: alla terza lingua diventa scomodo |
| Tabella `traduzioni(tabella, riga, campo, lingua, testo)` | pulita per N lingue | un join su ogni lettura di catalogo, e il catalogo è già il punto lento all'avvio |

Se un domani servissero francese e tedesco, si migra: con due lingue la tabella
è complessità pagata in anticipo per un'ipotesi.

### 3.3 Chi traduce

Serve deciderlo perché cambia tempi e costo:

- **Automatico + revisione tua**: veloce, ma su 90.000 parole la revisione è
  comunque lavoro vero, e il bridge ha una terminologia che non perdona.
- **Traduttore umano che gioca a bridge**: qualità migliore sui contenuti
  didattici, tempi e costi da preventivare.
- **Misto** (mia raccomandazione): automatico per l'interfaccia — frasi brevi,
  contesto povero, errori evidenti — e umano, o almeno rivisto da un giocatore
  di lingua inglese, per lezioni e commenti alle smazzate, che sono la parte
  che insegna.

### 3.4 Ambito: tutto o il cuore

Non tutto merita la stessa fatica. Proporrei di **escludere dalla prima
versione**: forum, negozio, portale istruttori, pagine legali (privacy,
termini), che restano in italiano con un avviso. Si traducono percorso
lezioni, giochi, profilo e classifica: cioè quello per cui uno straniero
arriverebbe.

---

## 4. Il pezzo che decide la qualità: il glossario dei termini

**Va costruito prima di tradurre una sola frase**, e va imposto come vincolo a
chiunque o qualunque cosa traduca. Nel bridge le parole sono tecniche: se
«presa» diventa a volte *trick* e a volte *hand*, la lezione non insegna più
niente e il lettore non se ne accorge subito — se ne accorge dopo, sbagliando
al tavolo.

Prima passata, da far validare a un giocatore di lingua inglese:

| italiano | inglese | nota |
|---|---|---|
| licita, dichiarazione | bidding, bid | «licita» come fase: *the auction* |
| smazzata | deal (board in gara) | |
| mano | hand | mai *deal* |
| presa | trick | |
| atout | trump | |
| contro / surcontro | double / redouble | |
| manche | game | **non** *match*: errore classico |
| parziale | part score | |
| slam / piccolo slam | slam / small slam | |
| cadere di due | to go down two | |
| dichiarante | declarer | |
| morto | dummy | |
| apertore | opener | |
| taglio | ruff | |
| impasse | finesse | |
| affrancare | to establish | |
| attacco | opening lead | |
| zona / prima | vulnerable / non vulnerable | |
| punti onori | high card points (HCP) | |
| fit | fit | invariato |
| Nord-Sud / Est-Ovest | North-South / East-West | |

Da decidere anche: **inglese britannico o americano**. Cambia la terminologia
di gara e l'ortografia. Con la FIGB dietro e un pubblico europeo, propendo per
il britannico (EBU).

---

## 5. Le fasi

Ogni fase è chiusa in sé: alla fine di ciascuna il sito è vivo e funzionante,
anche se l'inglese non è completo. Nessuna fase richiede di fermare la
produzione.

### Fase 1 — L'impianto, senza tradurre niente
`next-intl` con rotte `/en`, lingua nel percorso, selettore, memoria della
scelta, `hreflang` e `lang` corretto nell'HTML. **L'italiano resta la lingua
predefinita e non cambia una virgola**: chi arriva su `bridgelab.it` non si
accorge di nulla. Serve verificare una cosa non banale: l'app è quasi tutta
client-rendered, e il glossario è l'unica pagina server — vanno gestite
entrambe.
*Rischio*: basso. *Verificabile*: la home in `/en` esiste e mostra ancora
italiano.

### Fase 2 — Estrarre le stringhe dell'interfaccia
Le 2.500–3.500 stringhe vanno tolte dal codice e messe in un dizionario. È
lavoro meccanico ma non automatizzabile del tutto: molte stringhe sono dentro
frasi con interpolazioni, plurali, e testi che parlano al giocatore
(«Ci sei quasi: 225 punti sotto il contratto migliore»).
Si fa **un'area alla volta** — prima i giochi, poi le lezioni, poi il resto —
con un test che impedisce alle stringhe nuove di rientrare nel codice.
*Rischio*: medio, è il punto dove si rompono le cose per distrazione.
*Verificabile*: `it.json` completo e l'app identica a prima.

### Fase 3 — Tradurre l'interfaccia
Dal dizionario italiano a quello inglese. Qui l'automatico va bene, con il
glossario come vincolo. Va previsto che l'inglese è **più corto** dell'italiano
di circa il 10-15%: i riquadri che oggi stanno stretti staranno meglio, ma
qualche titolo cambierà a capo — si verifica con il test di impaginazione che
già esiste (`e2e/layout.spec.ts`).

### Fase 4 — I contenuti didattici
Colonne `_en`, uno script di traduzione campo per campo (i moduli sono blocchi
tipizzati: `text`, `quiz`, `heading`, `rule`, `example`, `true-false`, quindi
si traduce il campo giusto e non si tocca la struttura), e una revisione umana
sui contenuti. È la fase **più lunga**: 90.000 parole.
Il catalogo (`src/lib/catalog.ts`) sceglie la colonna in base alla lingua, con
ripiego sull'italiano quando la traduzione manca — così la fase può procedere
un corso alla volta senza pagine vuote.
*Verificabile*: un controllo che dice, per ogni corso, quante righe hanno la
traduzione.

### Fase 5 — Le dispense
Rigenerate con gli script Python esistenti, prompt tradotti, stile identico.
I file sono 404, ma le immagini **distinte** sono **238**: il resto sono
varianti per profilo (junior, senior…) dello stesso contenuto. È 238 il numero
su cui ragionare, e sono divise fra le quattro cartelle dei corsi (67 fiori,
65 quadri, 49 cuori-gioco, 62 cuori-licita) e le serie di slide per lezione.
Attenzione a due cose: le infografiche pesano 340 MB e sono già escluse dal
precache del service worker (vedi `next.config.ts`), e la versione inglese
raddoppia lo spazio.

### Fase 6 — Il contorno
Email transazionali, metadati e SEO, mappa del sito con le rotte inglesi,
pagina di ingresso dedicata. Le pagine legali restano in italiano con un
avviso, salvo diversa decisione.

### Fase 7 — Verifica
Le prove dal browser girate anche in inglese, un controllo automatico sulla
coerenza terminologica contro il glossario, e una lettura umana del percorso
completo di un corso.

---

## 6. Cosa non cambia

I motori restano invariati: punteggi, IMP, stelle, double dummy, BEN. Le
smazzate sono numeri, non parole. Anche i nomi dei semi nel codice
(`spade`, `heart`…) restano quelli: sono identificatori, non testo.

---

## 7. Rischi, detti prima

1. **La regola in `CLAUDE.md` dice l'opposto**: «Solo italiano: niente i18n,
   per scelta di prodotto». Va riscritta nel primo commit, altrimenti la prima
   cosa che farà un domani chiunque legga quel file è rimuovere l'i18n.
2. **La traduzione invecchia.** Ogni correzione ai contenuti italiani — e ne
   abbiamo fatte parecchie in questi giorni — lascia indietro l'inglese. Serve
   un controllo che elenchi le righe italiane cambiate dopo l'ultima
   traduzione, altrimenti la divergenza è silenziosa come lo era lo schema.
3. **Il costo di manutenzione raddoppia** su ogni contenuto nuovo. È la ragione
   per cui la scelta originale era «solo italiano»: va rifatta consapevolmente,
   non per inerzia.
4. **La qualità tecnica della traduzione** è il rischio più concreto: un errore
   di terminologia insegna una cosa sbagliata a chi si fida.

---

## 8. Cosa serve da te per partire

1. Le quattro decisioni del §3 (rotte, schema, chi traduce, ambito).
2. Britannico o americano (§4).
3. Se qualcuno di lingua inglese che gioca a bridge può rivedere lezioni e
   commenti. Se non c'è, il piano regge lo stesso, ma la Fase 4 diventa il
   punto debole e va detto.
