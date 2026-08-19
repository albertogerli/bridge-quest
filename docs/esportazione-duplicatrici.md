# Esportare verso le duplicatrici — cosa ho trovato

Ricognizione e prima realizzazione, 19/08/2026. Intervento 24 del terzo lotto.

Il prompt chiedeva esplicitamente due cose prima di implementare: verificare il
tracciato atteso, e non dichiarare fatto niente che non fosse stato provato su
un file reale. Questo documento è la risposta a entrambe, e **una parte resta
aperta** — quella che dipende da un file che non ho.

---

## 1. Il PBN, verificato con un parser di terze parti

**Fatto e verificato.** L'esportazione PBN esisteva già
(`src/lib/pbn.ts`, `dealsToPbn`) ed era controllata solo dal nostro parser —
che è una tautologia: se sbagliassimo la notazione allo stesso modo in scrittura
e in lettura, il test passerebbe e il file resterebbe illeggibile per il
software del circolo.

Ora `src/lib/pbn-terze-parti.test.ts` genera le mani col nostro esportatore e le
rilegge con **`pbn` di Richard Schneider**, un parser indipendente. Verifica che:

- ogni smazzata si espanda in **52 carte**, non meno;
- ogni posizione ne riceva **13**, e siano esattamente le nostre;
- mazziere, zona e numero di board arrivino leggibili;
- il parser non emetta errori sul file.

Il pacchetto sta fra le dipendenze **di sviluppo**: non entra nel pacchetto
dell'applicazione.

## 2. Il LIN, scritto da zero

**Fatto.** Nel progetto non esisteva (verificato nella ricognizione 10bis).
Sta in `src/lib/lin.ts`, con otto test.

Due cose del formato meritano di essere scritte, perché sono le due che si
sbagliano:

- **La mano di Est non si scrive.** BBO la ricava per differenza dalle altre
  tre. Scriverla fa rifiutare il file, e non con un messaggio utile: si vede
  solo che la mano non si apre.
- **Il mazziere è numerato partendo da Sud** (1=Sud, 2=Ovest, 3=Nord, 4=Est).
  Viene da come BBO ordina i posti, non da una convenzione di bridge, e
  sbagliarlo sposta la dichiarazione di un posto senza che nessun controllo se
  ne accorga.

## 3. Le duplicatrici: cosa ho trovato, e cosa manca

**Non dichiarato fatto.** Ecco perché.

I formati delle macchine Duplimate e Dealer4 sono tre — **BRI**, **DGE**,
**DUP** — e sono descritti in `duplimate.com/DuplimateClub/convert.pdf`. Il
pacchetto `pbn` li implementa, ma **in una sola direzione**: `convertBRI`,
`convertDGE` e `convertDUP` leggono quei file e producono PBN. Servono a
*importare* da una macchina, non a esportare verso.

Da lì si ricava comunque la struttura, ed è utile averla scritta:

> BRI è un sottoinsieme di DUP. 78 numeri ASCII per smazzata: le mani di Nord,
> Est e Sud in quest'ordine, 26 byte per mano, due cifre per carta
> (01 = ♠A, 02 = ♠K, … 52 = ♣2). La mano di Ovest si ricava per differenza.
> Ogni smazzata è riempita fino a 128 byte, con spazi e byte nulli.

Nota che anche qui **una mano non si scrive** — Ovest invece di Est, che è la
scelta opposta al LIN: due formati, due convenzioni, e nessuna delle due si
indovina.

**Quello che manca per chiudere il punto è un file vero.** La maggior parte dei
programmi di gestione torneo e delle duplicatrici importa direttamente PBN, e
quello ora è verificato; ma scrivere un esportatore BRI/DUP a partire da una
descrizione in prosa e dichiararlo funzionante senza averlo mai dato in pasto a
una macchina sarebbe esattamente ciò che il prompt vieta. In particolare non so,
e non posso sapere senza un campione:

- se il riempimento a 128 byte usa spazi, byte nulli o entrambi, e in che ordine
  (la descrizione dice «con spazi e nulli!», con il punto esclamativo di chi si
  è arreso a documentarlo);
- se il file vuole un'intestazione o un piè di pagina;
- quale codifica e quale terminatore di riga accettano i programmi italiani più
  diffusi.

**Cosa serve da te**: un file `.dup`, `.dge` o `.bri` prodotto da una
duplicatrice vera, anche di due sole smazzate. Con quello davanti l'esportatore
si scrive in un'ora e si verifica confrontando byte per byte.

## 4. Import speculare

**Già possibile.** Le mani giocate in sala rientrano dal PBN, che
`src/lib/pbn.ts` importa da tempo ed è collegato ai compiti. Per i formati
delle macchine, il pacchetto `pbn` sa già convertirli in PBN: quando servirà,
l'importazione è una rotta che passa quel file dentro `convertDUP` e poi dentro
`parsePbn`, senza scrivere nessun parser nuovo.

---

## In sintesi

| | stato |
|---|---|
| PBN in uscita | fatto, **verificato con parser di terze parti** |
| LIN in uscita | fatto, con test |
| Import PBN | c'era già |
| Import BRI/DGE/DUP | fattibile con `pbn`, non ancora collegato |
| Export BRI/DGE/DUP | **fermo**: serve un file reale per verificarlo |
| Stampa hand record | fatta con l'intervento 14 (formato compatto) |
