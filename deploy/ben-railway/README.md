# BEN su Railway

Ospita [BEN](https://github.com/lorserker/ben) (l'avversario a rete neurale) su
Railway e lo collega a BridgeLab.

## Attenzione a dove si lancia `railway up`

**Il servizio `ben` si deploya solo da questa cartella**, e il comando va dato
con progetto e servizio espliciti:

```bash
cd deploy/ben-railway
railway up -s ben -p 8909e811-f028-4429-80ea-2b1aed342a00 -e production --ci
```

Il motivo non è pedanteria. Il 02/09/2026 un `railway up` di **un altro
progetto** — un'applicazione FastAPI, con `backend/`, Playwright e migrazioni —
è finito su questo servizio. Il build è fallito, quindi BEN ha continuato a
girare col deploy precedente e nessuno se n'è accorto se non per l'email di
Railway. Se fosse riuscito, il motore di BridgeLab sarebbe stato sostituito da
un'applicazione che non c'entra niente.

La causa: la CLI di Railway tiene i collegamenti **per cartella** in
`~/.railway/config.json`, e risalendo i genitori. Una cartella temporanea era
rimasta collegata a questo progetto, così un `railway up` lanciato lì dentro
puntava qui. Il collegamento è stato tolto; se dovesse ricomparire, si controlla
con:

```bash
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.railway/config.json')));[print(k) for k,v in d['projects'].items() if v.get('project')=='8909e811-f028-4429-80ea-2b1aed342a00']"
```

Deve stampare **solo** `deploy/ben-railway`.

## Perché non su Vercel

BEN è Python con TensorFlow: carica circa 200 MB di modelli in memoria e deve
restare acceso. Il serverless di Vercel li ricaricherebbe a ogni richiesta —
secondi di attesa per ogni carta giocata. Serve un processo che vive.

## Cosa cambia per i giocatori

Il livello «esperto» oggi usa il double dummy solo negli ultimi 7 cartoni: le
prime sei prese restano euristica, ed è lì che si concentra metà degli errori
misurati (`src/lib/robot-quality.test.ts`). Con BEN attivo la rete neurale
gioca dalla prima carta.

Se BEN è spento o irraggiungibile **non succede nulla di visibile**: la cascata
BEN → double dummy → euristica degrada in silenzio.

## La sicurezza

BEN non ha autenticazione: è nato per stare su localhost. Esposto su Internet
sarebbe una GPU/CPU gratuita per chiunque lo trovi. Davanti c'è quindi
`guard.py`, che:

- pretende l'intestazione `X-BEN-Token`, confrontata a tempo costante;
- **si rifiuta di partire** se il segreto manca o è più corto di 24 caratteri —
  un deploy distratto non può pubblicare BEN in chiaro;
- lascia passare solo `/`, `/play`, `/lead`, `/autoplay`. BEN espone anche
  `/claim`, `/explain_auction`, `/cuebid`, `/bids`, `/contract`: non li usiamo
  e alcuni costano molto più di una carta da giocare;
- risponde `404` a chi non ha il segreto, invece di `401`: a un estraneo non si
  conferma nemmeno che qui ci sia qualcosa da indovinare;
- se BEN muore, esce, così Railway riavvia tutto invece di lasciare in piedi un
  servizio che risponde 502 per sempre.

`/healthz` è l'unico percorso senza segreto — serve alla sonda di Railway e
dice solo se il processo dietro è vivo.

BEN resta in ascolto su `127.0.0.1:8085`: da fuori si passa dalla guardia o da
niente.

La guardia ha una sua verifica, che non richiede né BEN né Docker: mette un
finto motore dietro e controlla chi riesce a parlargli.

```bash
cd deploy/ben-railway && python3 test_guard.py
```

## Passi

### 1. Genera il segreto

```bash
openssl rand -hex 32
```

### 2. Crea il servizio su Railway

Nuovo servizio → **Deploy from GitHub repo** → questo repository.
Poi, in Settings:

| Campo | Valore |
|---|---|
| Root Directory | `deploy/ben-railway` |
| Builder | Dockerfile |
| Health Check Path | `/healthz` |
| Health Check Timeout | `300` (il primo avvio carica i modelli) |

Variabili (Variables):

| Nome | Valore |
|---|---|
| `BEN_API_TOKEN` | il segreto generato sopra |

`PORT` la mette Railway da sé.

Poi Settings → Networking → **Generate Domain**: ottieni un indirizzo tipo
`https://ben-production-xxxx.up.railway.app`.

### 3. Collega BridgeLab

Su Vercel (Settings → Environment Variables), in Production:

| Nome | Valore |
|---|---|
| `BEN_API_URL` | l'indirizzo Railway, **senza** barra finale |
| `BEN_API_TOKEN` | lo stesso segreto |

Poi un redeploy. Da quel momento il badge in partita mostra «BEN» invece di
«Esperto».

### 4. Verifica

```bash
# senza segreto: deve rispondere 404, non 200
curl -s -o /dev/null -w '%{http_code}\n' https://TUO-DOMINIO.up.railway.app/

# con segreto: 200
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "X-BEN-Token: IL-SEGRETO" https://TUO-DOMINIO.up.railway.app/

# un percorso non ammesso: 404 anche col segreto
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "X-BEN-Token: IL-SEGRETO" https://TUO-DOMINIO.up.railway.app/explain
```

## Costruirla in locale

Railway costruisce su amd64 e non serve fare nulla. Se invece vuoi provare
l'immagine sul tuo computer, su Mac Apple Silicon **va forzata la piattaforma**:

```bash
docker build --platform linux/amd64 -t ben .
docker run --rm -p 8080:8080 -e BEN_API_TOKEN="$(openssl rand -hex 32)" ben
```

Senza `--platform` la costruzione fallisce: `psutil==5.9.0` non ha pacchetti
già compilati per ARM e `gevent` nemmeno, e nell'immagine non c'è un
compilatore. Il primo avvio carica i modelli e sotto emulazione è lento.

## BEN dichiara, non solo gioca

Oltre alle carte, BEN ha un modello neurale per la LICITA: l'endpoint `/bid`,
con la rete `GIB-BBO-8730`. Era già caricato in memoria dal primo giorno e non
lo usava nessuno, perché la guardia non lo lasciava passare.

Verificato in produzione il 14/08/2026, meno di mezzo secondo a dichiarazione:

| mano | risposta |
|---|---|
| 16 bilanciati, in apertura | `1SA` |
| quinta di picche, 12 punti | `1♠` |
| fit di picche, 6 punti, dopo l'1♠ del compagno | `2♠` |
| 19 punti dopo l'1♠ del compagno | `2♦` (cambio di colore) |
| mano nulla dopo l'1♠ | `PASS` |

ATTENZIONE AL SISTEMA. La rete è addestrata su GIB/BBO, cioè lo standard
americano. Non è lontano dal Naturale dei corsi FIGB — anche lì quinta
maggiore e 1SA 15-17 — ma le convenzioni divergono. BEN porta con sé altre
configurazioni (SAYC, 21GF, UCBC): si cambiano con `BEN_CONFIG`, che la
guardia passa già. È una scelta didattica, non tecnica: va fatta guardando
cosa insegna la Commissione.

UN PARAMETRO VUOTO NON È UN PARAMETRO ASSENTE. Il nostro proxy saltava i
valori vuoti, quindi a licita appena iniziata non mandava `ctx` affatto e BEN
rispondeva 400 — il compagno restava muto proprio alla prima dichiarazione,
cioè sempre. `ctx` ora si manda anche vuoto.

## Ne vale la pena?

Misurato il 13/08/2026 su 10 mani, con lo stesso metro per tutti e tre i
motori (`src/lib/robot-quality-ben.test.ts`): prese buttate per mano rispetto
al gioco perfetto a carte scoperte.

| motore | dichiarante | difesa | totale | mani perfette |
|---|---|---|---|---|
| euristica | 2,20 | 2,00 | 4,20 | 0/10 |
| double dummy (livello «esperto») | 1,20 | 1,50 | 2,70 | 0/10 |
| **BEN** | **0,60** | **0,70** | **1,30** | **4/10** |

BEN dimezza il double dummy. Il secondo per carta è speso bene.

## Quanto è lento

**La regione conta più di quanto sembri.** Stesse identiche immagine e
configurazione, misurate il 13/08/2026 dall'Italia:

| chiamata | Railway US | **Railway `europe-west4`** |
|---|---|---|
| `/lead` (attacco, con simulazioni) | 2,0 – 4,0 s | **1,0 – 2,2 s** |
| `/play` con una scelta vera | 4,4 – 5,4 s | **0,89 – 1,33 s** |
| `/play` con carta obbligata (`"who": "Forced"`) | 0,4 s | 0,46 s |
| sola connessione di rete | 0,04 – 0,16 s | 0,03 s |

Quattro volte più veloce, e **non per la distanza**: il viaggio dei pacchetti
valeva un decimo di secondo, il resto era CPU. Se un giorno il servizio
sembrasse lento, la regione è la prima cosa da guardare.

Due cose da tenere a mente:

- **le carte obbligate costano meno ma non zero** (mezzo secondo). In una mano
  buona parte delle giocate lo è, quindi il conto non è «39 decisioni per il
  tempo di una», ma nemmeno trascurabile;
- **il costo si moltiplica per i giocatori contemporanei.** Ogni decisione
  occupa una CPU: con più partite insieme è la CPU, non la memoria, a decidere
  se il servizio regge. Il proxy di BridgeLab aspetta 15 secondi prima di
  arrendersi e ripiegare sul double dummy.

Se servisse guadagnare altro tempo, le leve sono nel conf di BEN:
`sample_hands_play` (200) e `sample_boards_for_play` (5000) governano il costo
del gioco della carta. La guardia accetta `BEN_CONFIG`, quindi si può puntare
a un conf ridotto senza toccare l'immagine — misurando poi cosa si perde con
`MISURA_ROBOT=1`.

## Costruirla in locale

Railway costruisce su amd64 e non serve fare nulla. Se invece vuoi provare
l'immagine sul tuo computer, su Mac Apple Silicon **va forzata la piattaforma**:

```bash
docker build --platform linux/amd64 -t ben .
docker run --rm -p 8080:8080 -e BEN_API_TOKEN="$(openssl rand -hex 32)" ben
```

Senza `--platform` la costruzione fallisce: `psutil==5.9.0` non ha pacchetti
già compilati per ARM e `gevent` nemmeno, e nell'immagine non c'è un
compilatore. Il primo avvio carica i modelli e sotto emulazione è lento.

## BEN dichiara, non solo gioca

Oltre alle carte, BEN ha un modello neurale per la LICITA: l'endpoint `/bid`,
con la rete `GIB-BBO-8730`. Era già caricato in memoria dal primo giorno e non
lo usava nessuno, perché la guardia non lo lasciava passare.

Verificato in produzione il 14/08/2026, meno di mezzo secondo a dichiarazione:

| mano | risposta |
|---|---|
| 16 bilanciati, in apertura | `1SA` |
| quinta di picche, 12 punti | `1♠` |
| fit di picche, 6 punti, dopo l'1♠ del compagno | `2♠` |
| 19 punti dopo l'1♠ del compagno | `2♦` (cambio di colore) |
| mano nulla dopo l'1♠ | `PASS` |

ATTENZIONE AL SISTEMA. La rete è addestrata su GIB/BBO, cioè lo standard
americano. Non è lontano dal Naturale dei corsi FIGB — anche lì quinta
maggiore e 1SA 15-17 — ma le convenzioni divergono. BEN porta con sé altre
configurazioni (SAYC, 21GF, UCBC): si cambiano con `BEN_CONFIG`, che la
guardia passa già. È una scelta didattica, non tecnica: va fatta guardando
cosa insegna la Commissione.

UN PARAMETRO VUOTO NON È UN PARAMETRO ASSENTE. Il nostro proxy saltava i
valori vuoti, quindi a licita appena iniziata non mandava `ctx` affatto e BEN
rispondeva 400 — il compagno restava muto proprio alla prima dichiarazione,
cioè sempre. `ctx` ora si manda anche vuoto.

## Ne vale la pena?

Misurato il 13/08/2026 su 10 mani, con lo stesso metro per tutti e tre i
motori (`src/lib/robot-quality-ben.test.ts`): prese buttate per mano rispetto
al gioco perfetto a carte scoperte.

| motore | dichiarante | difesa | totale | mani perfette |
|---|---|---|---|---|
| euristica | 2,20 | 2,00 | 4,20 | 0/10 |
| double dummy (livello «esperto») | 1,20 | 1,50 | 2,70 | 0/10 |
| **BEN** | **0,60** | **0,70** | **1,30** | **4/10** |

BEN dimezza il double dummy. Il secondo per carta è speso bene.

## Quanto è lento

Misurato il 13/08/2026 sull'immagine costruita qui, **sotto emulazione**
(amd64 su un Mac ARM), quindi sono valori pessimistici:

| chiamata | tempo |
|---|---|
| `/lead` (attacco, con simulazioni) | 2,0 – 2,4 s |
| `/play` con una scelta vera | 1,4 – 3,2 s |
| `/play` quando la carta è obbligata (`"who": "Forced"`) | 0,08 s |

Su Railway gira nativamente e sarà parecchio più rapido, ma **di quanto va
verificato sul posto**: l'emulazione costa tipicamente da tre a dieci volte.

Due cose da tenere a mente:

- **le carte obbligate non costano nulla.** In una mano buona parte delle
  giocate lo è, quindi il costo reale è molto sotto «39 decisioni × il tempo
  di una»;
- **il costo si moltiplica per i giocatori contemporanei.** Ogni decisione
  occupa una CPU: con più partite in corso insieme è la CPU, non la memoria,
  a decidere se il servizio regge. Il proxy di BridgeLab lascia 15 secondi
  prima di arrendersi e ripiegare sul double dummy.

## Costi e dimensionamento

TensorFlow più i modelli stanno in memoria: **almeno 2 GB di RAM**, meglio 4.
L'immagine pesa qualche GB (TensorFlow da solo è oltre 600 MB), ma si costruisce
una volta sola.

Il carico è a raffica: una mano genera fino a una quarantina di richieste in
pochi secondi. Se il servizio va in affanno conviene guardare la CPU prima
della memoria.

## Aggiornare BEN

Il Dockerfile clona BEN a un commit fissato (`ARG BEN_COMMIT`). Per aggiornare:
cambia il commit, ricostruisci, e **misura** — `MISURA_ROBOT=1 npx vitest run
src/lib/robot-quality.test.ts` dice se l'avversario è migliorato o peggiorato,
invece di lasciarlo supporre.
