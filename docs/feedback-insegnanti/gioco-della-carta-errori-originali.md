# Il gioco della carta: errori trovati nei materiali originali

Ottobre 2026. Rifacendo slide, dispense e infografiche del primo modulo
(archivio «Gioco della Carta» di Carla Gianardi e Giuseppe Trevissoi), il
generatore controlla ogni mano: 13 carte per mano, nessuna carta in due posti.
Questi sono i punti in cui l'originale non torna. **Nei nuovi PDF il testo è
rimasto quello originale**; dove una mano era impossibile da disegnare è
mostrata parziale, oppure solo Nord-Sud. Le correzioni vanno decise da chi ha
scritto il materiale.

Sorgenti: `scripts/materiali/gioco-della-carta/`. Per rigenerare tutto:
`node scripts/materiali/rendi-gioco-della-carta.mjs`.

## Mani impossibili

| Dove | Cosa non torna |
|---|---|
| Dispensa *Il piano di gioco a senz'atout*, primo esempio (3SA, attacco ♥2) | Nord ♠86 ♥K5 ♦KQ1075 ♣872 ha 12 carte; Sud ♠AKQ3 ♥A72 ♦J32 ♣A654 ne ha 14 |
| Slide *Il piano di gioco*, n. 21 (stessa mano) | Sud è ♠AK53 ♥A72 ♦J32 ♣AK54: ancora 14 carte, e diverso dalla dispensa |
| Dispensa *Il piano di gioco a senz'atout*, colpo in bianco (1SA, attacco ♠4) | Sud ♠985 ♥1032 ♦63 ♣K8653 ha 14 carte |
| Dispensa *Il gioco ad atout*, affrancamento di lunga con i tagli | Il 4♠ è sia in Nord (KJ4) sia in Ovest (74); il 7♥ sia in Nord (A7) sia in Est (KJ74). Mancano 3♠ e 2♥ |
| Dispensa *Il gioco ad atout*, 4♠ con attacco ♦K | Sud ♠KJ1063 ♥A8 ♦85 ♣KQ2 ha 12 carte |
| Slide *Il gioco ad atout*, n. 7 | Sud ♠KJ1063 ♥8 ♦85 ♣KQ52 ha 12 carte |
| Dispensa *Il gioco ad atout*, «aprire il taglio», figura 2 | Il 6♠ è sia in Nord (7653) sia in Sud (AKQ64) |
| Dispensa *Il punto di vista dei difensori*, esempio 96 / Q8653 | Il 6 è sia in Nord sia in Ovest |
| Slide *Il piano di gioco*, n. 20 (difesa dagli affrancamenti di posizione) | Il 7♣ è sia in Est (1072) sia in Sud (J75); manca il 6 |
| Slide *Il piano di gioco*, n. 22 | Il 6♦ è sia in Nord (Q654) sia in Sud (632) |

## Testi che non corrispondono alla figura

1. **Dispensa *Affrancamenti*, esempio «expasse» K85 / 763.** Il testo è quello
   dell'impasse AQ5 copiato: parla di affrancare «la Dama… con la Donna (oltre
   che con l'Asso)» e di Re in Ovest. Nella figura c'è solo il Re: la manovra è
   piccola verso il Re, e riesce se l'Asso è in Ovest.
2. **Dispensa *Il gioco ad atout*, stesso esempio dell'affrancamento con i
   tagli.** «Raggiungibili tramite il Re di Cuori»: Nord ha ♥A7, è l'Asso.
3. **Dispensa *Il punto di vista dei difensori*, esempio 96 / Q8653.** «Sapete
   che l'Asso è in Sud» e poi «Chi ha il Re? Non lo sappiamo», ma nella figura
   Sud ha appena vinto con il Re. Il ragionamento non segue la figura.
4. **Dispensa *Il gioco ad atout*, «mettetevi nei panni di Est».** Accanto al
   testo c'è una figurina ♥K54 / A2 che non coincide con le cuori del morto
   (J74). Nella nuova dispensa è stata tolta.
5. **Slide *Il gioco ad atout*, n. 4.** Con tredici picche a senz'atout si
   legge «0 vincenti»: sono tutte vincenti, il senso è «0 prese», perché
   l'attacco arriva in un altro seme.
6. **Slide *Vincenti e affrancabili*, n. 16.** «Est con AJ avrebbe preso con
   l'Asso e giocato il J»: probabilmente «e poi rigiocato il J».

## Da approvare: aggiunte nelle nuove slide

Nella presentazione *Il piano di gioco* le slide 4, 5, 8, 10, 18 e 19 hanno
una riga di spiegazione che nell'originale non c'è (l'originale la lasciava
alla voce dell'insegnante). Vanno lette e approvate, oppure tolte.

## Cosa è cambiato nell'impaginazione, ovunque

- Nessun nome d'autore sulle pagine e nessun numero di lezione.
- Testo originale, con corretti solo refusi, punteggiatura e maiuscole
  «urlate».
- Le infografiche delle lezioni 1–6 sono riassunti nuovi, scritti dal testo
  ufficiale. Usano solo esempi le cui mani tornano.
