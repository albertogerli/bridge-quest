#!/usr/bin/env python3
"""
Generate 12 infographic images for FIGB Corso Quadri (Junior profile - Maestro Franci)
using Gemini API image generation.
"""

import json
import base64
import time
import ssl
import urllib.request
import urllib.error
import os
import sys
from pathlib import Path

API_KEY = "AIzaSyAB_VB1vU6eqJLf5OE_5OYeE5Gr571wUKs"
MODEL = "gemini-3-pro-image-preview"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
OUTPUT_DIR = Path("/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest/public/infografiche/quadri")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

STYLE = """
STYLE INSTRUCTIONS (follow precisely):
- Educational vertical infographic, clean modern vector style, aspect ratio approximately 2:3 (portrait/vertical, suitable for A4 print)
- White background with FIGB blue accents (#0098D4)
- TOP HEADER: FIGB logo area - four blue diamonds arranged in a row, each containing a suit symbol (spades black, hearts red, diamonds red, clubs green), with text FIGB in blue (#0098D4) below the diamonds
- BOTTOM RIGHT corner: Maestro Franci written in italic blue (#0098D4) font
- Bridge table when shown: green felt seen from above, rectangular with rounded edges, 4 labeled positions (NORD at top, SUD at bottom, EST at right, OVEST at left)
- Card suits always rendered correctly: Spades in black, Hearts in red, Diamonds in red, Clubs in dark green or black
- ALL text must be in ITALIAN only. No English words anywhere. No BridgeQuest text.
- Use clean sans-serif font, all text must be legible and well-sized for print
- Layout suitable for A4 print as study handout
- Simple, clear educational icons and diagrams
- Target audience: ages 8-17 (colorful and engaging but not childish, professional quality)
- Use numbered sections, arrows, icons, and visual hierarchy to organize information
- Include small illustrative card diagrams where relevant to the lesson content
"""

LESSONS = [
    {"id": 1, "title": "Lezione 1: Tempi e Comunicazioni nel Gioco a Senza",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Tempi e Comunicazioni nel Gioco a Senza.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): TEMPI E COMUNICAZIONI NEL GIOCO A SENZA\n\nCONTENUTI DA VISUALIZZARE (5-7 sezioni con icone e diagrammi):\n\n1. LA CORSA - Il gioco a Senza e' una corsa: affrancare le prese prima degli avversari. Mostra due frecce che corrono in parallelo (noi vs avversari) con icona cronometro.\n\n2. SCEGLIERE LA SORGENTE DI PRESE - Diagramma con due opzioni: Colore A (piu' prese ma 2 tempi) vs Colore B (meno prese ma 1 tempo). Con un solo fermo, scegli B! Usa frecce e icone chiare.\n\n3. PERCENTUALI DI DIVISIONE - Tabella colorata:\n   - 7 carte in linea: 3-3 = 36%, 4-2 = 48%\n   - 8 carte in linea: 3-2 = 68%, 4-1 = 28%\n   - 9 carte in linea: 2-2 = 40%, 3-1 = 50%\n   - Impasse = 50% (meglio della 3-3!)\n\n4. GLI INGRESSI - Diagramma che mostra come le prese certe servono come ingressi per raggiungere i colori affrancati. Frecce tra le due mani.\n\n5. L'AVVERSARIO PERICOLOSO - Icona con un difensore evidenziato in rosso: e' quello che NON deve andare in presa. Scegli l'impasse che, se fallisce, mette in presa l'avversario NON pericoloso.\n\n6. LISCIARE L'ATTACCO - Diagramma: rifiutare di prendere al 1 e 2 giro per tagliare i collegamenti tra i difensori. Mostra il flusso delle carte con X sui collegamenti.\n\n7. ESEMPIO PRATICO - Piccolo diagramma di mano: 3NT, attacco Picche: con 1 fermo a Picche, scegli il colore affrancabile in 1 tempo!"},

    {"id": 2, "title": "Lezione 2: Valutazioni sull'Apertura",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Valutazioni sull'Apertura.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): VALUTAZIONI SULL'APERTURA\n\nCONTENUTI DA VISUALIZZARE:\n\n1. I 5 DIFETTI DEGLI 11 PUNTI - Lista visiva con icone rosse di warning:\n   1) Poche carte di testa (A e K meglio di Q e J)\n   2) Mano impura (onori fuori dai colori lunghi)\n   3) Colori non competitivi (mancanza di nobili Picche e Cuori)\n   4) Posizione sfavorevole (1 e 4 di mano = apertura piena)\n   5) Pessima seconda dichiarazione\n\n2. LA REGOLA D'ORO - Box evidenziato in blu: Con 11 punti e ALMENO 2 DIFETTI = PASSO! con icona stop.\n\n3. FORZA GIOCABILE vs FORZA ONORI - Due colonne a confronto:\n   - Giocabile: prese solo col proprio atout (es: KQJxxxx = 6 prese)\n   - Onori: prese in qualsiasi contratto (A, K isolati)\n\n4. APERTURE DI BARRAGE (3x e 4x) - Diagramma:\n   - Requisiti: 7+ carte onorate, max 1 carta alta esterna\n   - Messaggio: Faccio circa 3 prese in meno di quelle che dichiaro\n   - Regola: Chi fa un barrage poi va al bar! (non prende piu' iniziative)\n\n5. MANI 6-5 - Nota: se non hai almeno 8 vincenti, tratta la 6-5 come 5-5 e apri nel seme di rango maggiore.\n\n6. DISTRIBUZIONE - Scala visiva: 4432 > 5332 > 4333 (la peggiore!)"},

    {"id": 3, "title": "Lezione 3: Contratti ad Atout - Tempo e Controllo",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Contratti ad Atout: Tempo e Controllo.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): CONTRATTI AD ATOUT: TEMPO E CONTROLLO\n\nCONTENUTI DA VISUALIZZARE:\n\n1. TEMPO E CONTROLLO - Due concetti chiave con icone:\n   - TEMPO: opportunita' di muovere un colore nel proprio interesse\n   - CONTROLLO: fermi per impedire l'affrancamento avversario\n\n2. SCARTARE PRIMA DI BATTERE ATOUT - Diagramma sequenziale con frecce:\n   Passo 1: Scarta le perdenti su vincenti laterali\n   Passo 2: POI batti le atout\n   Quando il tempo stringe, scarta PRIMA!\n\n3. ATOUT LEGITTIMA vs ILLEGITTIMA - Due box a confronto:\n   - LEGITTIMA (verde): la presa che spettava comunque all'avversario\n   - ILLEGITTIMA (rosso): un taglio con carta che non gli spettava\n\n4. TAGLIARE DALLA PARTE CORTA - Diagramma del tavolo di bridge visto dall'alto:\n   - Mano con 5 atout (lunga) = NON tagliare qui\n   - Morto con 3 atout (corta) = TAGLIA QUI!\n   Guadagni prese supplementari tagliando dalla mano con meno atout\n\n5. IL FIT 4-4 - Box evidenziato: Il fit 4-4 e' il piu' potente!\n   Diagramma: non c'e' una parte corta fissa, si sceglie in base alle esigenze.\n\n6. ATTENZIONE! - Warning box in rosso:\n   Se l'unico collegamento con le lunghe del morto e' l'atout, NON accorciare la parte corta!\n\n7. DOMANDA CHIAVE - Box: Quando cedi presa, chiediti: cosa fara' l'avversario?"},

    {"id": 4, "title": "Lezione 4: Il Capitanato e la Replica dell'Apertore",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Il Capitanato e la Replica dell'Apertore.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): IL CAPITANATO E LA REPLICA DELL'APERTORE\n\nCONTENUTI DA VISUALIZZARE:\n\n1. CAPITANO vs SUBORDINATO - Due figure stilizzate:\n   - CAPITANO: conosce la forza combinata, DECIDE il contratto\n   - SUBORDINATO: ha limitato la mano, DESCRIVE soltanto\n   Su apertura di 1, il Capitanato spetta al Rispondente\n\n2. 3 REGOLE D'ORO con icone:\n   1) Se il Capitano INDAGA il Subordinato DESCRIVE\n   2) Se il Capitano DECIDE il Subordinato PASSA\n   3) Se il Capitano RINUNCIA il Subordinato diventa Capitano\n\n3. REPLICA DOPO RISPOSTA A LIVELLO 1 - Schema con frecce:\n   - 1NT = bilanciata 12-14 (nega fit, nega quarte a livello 1)\n   - Ripetizione colore = 12-14, sbilanciata\n   - Colore nuovo = punteggio elastico (include 15-17)\n\n4. DIRITTO vs ROVESCIO - Due zone colorate:\n   - DIRITTO (verde): 12-15 punti, descrizione semplice\n   - ROVESCIO (blu): 16-20 punti, Rever!\n\n5. I REVER - Scala visiva:\n   - Piccolo Rever (15-17): salto in colore gia' detto, NON forzante\n   - Rever senza salto (16-20): a tutto campo\n   - Gran Rever (18-20): salto, FORZANTE a manche\n\n6. REPLICA DOPO 2 su 1 - Breve schema:\n   - 2NT = bilanciata 5332, 12-14\n   - Colore nuovo lv.2 = 12+ elastico\n   - Colore nuovo lv.3 = 15+ o 5-5\n   - Salto = monocolore chiusa o grande bicolore"},

    {"id": 5, "title": "Lezione 5: I Colori Bucati - Come Muovere le Figure",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema I Colori Bucati: Come Muovere le Figure.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): I COLORI BUCATI: COME MUOVERE LE FIGURE\n\nCONTENUTI DA VISUALIZZARE:\n\n1. PRINCIPIO UNIVERSALE - Box grande evidenziato in blu:\n   Chi muove per primo e' quasi sempre SVANTAGGIATO!\n   Icona: due giocatori, freccia dal primo che perde verso il secondo che vince.\n\n2. SECONDA POSIZIONE: GIOCA PICCOLA! - Regola con diagramma:\n   - Piccola su piccola\n   - Onore su onore\n   Ogni giocatore marca a uomo l'avversario che lo precede\n\n3. COMBINAZIONI DI FIGURE - 4 diagrammi di carte con frecce:\n   - AQ54 + J632: K secondo in impasse, piccola per Q poi A. Mai il J!\n   - AKJ43 + 652: Colpo di Sonda (incassa un onore) poi impasse\n   - 1083 + AQJ95: Gradino di ingresso: 8, poi 10, poi 3 per J\n\n4. IL COLPO DI SONDA - Diagramma:\n   Incassa un onore prima dell'impasse per catturare un pezzo secco\n   - AKJ10 + 8752: A o K, poi impasse cattura Q secca\n   Incassa sempre dal lato con 2 onori!\n\n5. LA REGOLA AUREA DELL'IMPASSE - Due box:\n   - Manca onore + 2-3 cartine = FAI L'IMPASSE\n   - Manca onore + 1 cartina = BATTI IN TESTA\n   - Manca solo Q: 9+ carte = batti, 8 o meno = impasse\n\n6. IL FANTE SENZA IL 10 - Warning rosso con icona:\n   Chi gioca il Fante e non ha il 10 deve stare in ginocchio sui ceci!\n\n7. GRADINI DI INGRESSO - Carte equivalenti che permettono di ripetere l'impasse senza ingressi esterni."},

    {"id": 6, "title": "Lezione 6: Le Aperture Oltre il Livello 1",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Le Aperture Oltre il Livello 1.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): LE APERTURE OLTRE IL LIVELLO 1\n\nCONTENUTI DA VISUALIZZARE:\n\n1. APERTURE 2 Quadri, 2 Cuori, 2 Picche - Box blu:\n   - Colore almeno quinto (meglio sesto), troppo forti per livello 1\n   - 20-21+ punti OPPURE 16-20 con 8.5-9 vincenti\n   - FORZANTI fino a 3 nel colore iniziale\n   - Il Capitanato spetta all'APERTORE (unica apertura cosi'!)\n\n2. RISPOSTE SU 2 A COLORE - Schema con frecce:\n   - Colore nuovo lv.2 = 0+ punti, 4+ carte\n   - Dichiarazioni lv.3 = forzanti manche, 5+ carte\n   - Rialzo a 3 = forzante manche, visuale slam\n   - Appoggio a manche = forza minima\n   - 2NT = attesa, nega quarte a lv.2\n\n3. IL LIVELLO DI GUARDIA - Diagramma con linea:\n   3 nel colore di apertura = livello di sicurezza\n   - Sotto: arrivo a 9 prese, se non porti 1 presa fermiamoci\n   - Sopra: ho 10 prese, si va avanti!\n\n4. APERTURA 2 Fiori - Box speciale verde:\n   - Contenitore ambiguo: bilanciata 23+ OPPURE base fiori\n   - 2 giro: 2NT = bilanciata; colore = base fiori\n   - 2 Quadri = risposta d'attesa (NON promette quadri!)\n\n5. RKCB - 4NT CHIEDE ASSI - Schema colorato delle 5 chiavi:\n   - 5 Fiori = 0 o 3 assi\n   - 5 Quadri = 1 o 4 assi\n   - 5 Cuori = 2 assi, SENZA Q atout\n   - 5 Picche = 2 assi, CON Q atout\n   - 5NT = chiede Re (solo con tutti e 5 gli assi)\n\n6. GAMBLING 3NT - Box:\n   Colore minore settimo chiuso (AKQJ+), nessun'altra carta alta\n   Passo con fermi ovunque; 4 Fiori = passa o correggi"},

    {"id": 7, "title": "Lezione 7: Attacchi e Segnali di Controgioco",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Attacchi e Segnali di Controgioco.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): ATTACCHI E SEGNALI DI CONTROGIOCO\n\nCONTENUTI DA VISUALIZZARE:\n\n1. DUE SCELTE NELL'ATTACCO - Due box:\n   1) IN CHE SEME? Basarsi sulla licita, colori non detti, colore del compagno\n   2) CON CHE CARTA? Sistema Busso + accordi di coppia\n\n2. IL SISTEMA BUSSO - Schema chiaro con colori:\n   - PICCOLA delle cartine = Ho un onore! Prendi e torna! (verde)\n   - ALTA delle cartine = Nessun onore, fai come vuoi (rosso)\n   - Il 9 NON e' cartina (promette l'8)\n   - L'8 e' la piu' alta delle cartine\n   Esempi: K9754 attacca 4, 97542 attacca 7, Q10865 attacca 5, 10872 attacca 8\n\n3. IL CONTO (nel colore del compagno) - Schema:\n   - Carte PARI (2,4,6): carta alta poi bassa = numero pari\n   - Carte DISPARI (1,3,5): la piu' piccola = numero dispari\n   - Se c'e' sequenza: SEQUENZA prevale sul conto!\n\n4. IL GRADIMENTO (Pari-Dispari) - Diagramma:\n   - DISPARI (9,7,5,3) = MI PIACE (verde)\n   - PARI (8,6,4,2) = NON MI PIACE (rosso)\n   - Solo su colori mossi dalla DIFESA, MAI dal giocante!\n\n5. IL PRIMO SCARTO ALL'ITALIANA - Box con due regole:\n   - DISPARI chiama (mostra valori nel seme)\n   - PARI rifiuta (nega valori nel seme)\n\n6. A SENZA vs A COLORE - Due note:\n   - A Senza: gradimento solo con carta equivalente o onore\n   - A Colore: anche possibilita' di taglio (doubleton)"},

    {"id": 8, "title": "Lezione 8: L'Accostamento a Manche",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema L'Accostamento a Manche.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): L'ACCOSTAMENTO A MANCHE\n\nCONTENUTI DA VISUALIZZARE:\n\n1. TERZO COLORE vs QUARTO COLORE - Due box a confronto:\n   - TERZO COLORE: scelta tra 2 colori disponibili\n     In discendente a lv.2 = forzante 1 giro\n     Ascendente o a lv.3 = forcing manche\n     Tendenzialmente colore reale\n   - QUARTO COLORE: l'ultimo rimasto\n     Forcing manche (tranne a lv.1)\n     NON promette lunghezza ne' valori\n     Richiede 12/13+ punti\n\n2. NOBILE vs MINORE - Regola con icone:\n   - Un NOBILE (Picche/Cuori) chiede di essere appoggiato\n   - Un MINORE (Quadri/Fiori) chiede descrizione generica\n\n3. COMPORTAMENTO DELL'APERTORE SUL 4 COLORE - Scala di priorita':\n   1) Appoggiare il 1 colore di Sud con fit 3 (PRIORITA' se nobile!)\n   2) NT se ferma nel 4 colore\n   3) Ripetere un colore per piu' lunghezza\n   4) Rialzare nel 4 colore con 4 carte\n   5) Allungo impossibile (nega tutto il resto)\n\n4. DOPO IL FIT: INDAGINI TRA 2 E 3 IN ATOUT - Diagramma:\n   Livello 2 - SPAZIO PER INDAGINI - Livello 3\n   Un cambio di colore del Capitano dopo il fit = prospettive di manche vive\n\n5. GAME TRY DOPO FIT - Schema:\n   - Cambio colore = Ho bisogno di aiuto qui!\n   - Se ha valori (A,K,Q): rialza a manche\n   - Se ha cartine: riporta a 3 nell'atout\n   - Con 2 colori deboli: scegli il rango piu' basso\n\n6. 2NT = INVITO GENERICO - Box:\n   Non e' proposta di Senza! Il contratto finira' nel nobile, a 3 o 4"},

    {"id": 9, "title": "Lezione 9: Ricevere l'Attacco",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Ricevere l'Attacco.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): RICEVERE L'ATTACCO\n\nCONTENUTI DA VISUALIZZARE:\n\n1. DEDUZIONI DALLA CARTA DI ATTACCO - Box con lente d'ingrandimento:\n   - Guarda la carta appena INFERIORE alla carta di attacco\n   - Se il 9 e' in mano e l'attacco e' il 10: secco o secondo\n   - Nessuno attacca sotto Asso ad atout! Se manca l'A, e' nell'altra mano\n\n2. LISCIARE L'ATTACCO - 3 diagrammi di carte:\n   - 654 sopra + AJ3 sotto, attacco K: LISCIA (Ovest bloccato)\n   - A65 sopra + J73 sotto, attacco K: LISCIA (Ovest bloccato)\n   - J65 sopra + A73 sotto, attacco K: NON LISCIARE (cattura K e expasse al J)\n\n3. CREARE ILLUSIONI - Icona magia:\n   Se si subodora un taglio, dai un onore alto per confondere!\n   Es: dare il J invece della Q per depistare il difensore\n\n4. PROTEGGERE GLI ONORI DEL MORTO - Regola con icona scudo:\n   Non sprecare MAI onori del morto quando non vinceranno la presa!\n   Un onore vivo inibisce l'avversario dal rigiocare il colore.\n\n5. USA LA DICHIARAZIONE! - Icona megafono:\n   Licita e gioco sono connessi\n   Est ha aperto 1 Picche, attacco 10 Picche = secco o secondo, stai basso\n\n6. LISCIARE PER IL PIANO DI GIOCO - Schema:\n   Obiettivo: tagliare i collegamenti tra i difensori\n   Impedire che vada in presa l'avversario pericoloso\n\n7. PROTEGGERE L'ASSO DAL TAGLIO - Warning:\n   Se sospetti un taglio: stai basso e salva l'Asso per dopo la battuta di atout"},

    {"id": 10, "title": "Lezione 10: Il Contro e la Surlicita",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Il Contro e la Surlicita.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): IL CONTRO E LA SURLICITA\n\nCONTENUTI DA VISUALIZZARE:\n\n1. CONTRO vs SURLICITA - Due box grandi a confronto:\n   - CONTRO (X): usabile solo se ultima licita e' dell'avversario\n     CERCA il fit (non lo ha ancora trovato)\n   - SURLICITA (rialzo colore avversario): usabile sempre in competizione\n     PROMETTE il fit (lo ha gia'!)\n\n2. REGOLA FONDAMENTALE - Box evidenziato:\n   Quando entrambe sono disponibili:\n   CONTRO = cerca fit\n   SURLICITA = promette fit\n   Quando solo Surlicita disponibile: si carica TUTTE le mani forti\n\n3. COMPAGNO DELL'APERTORE - Schema con esempi:\n   - CONTRO: cerca fit, invita il partner a dichiarare\n   - SURLICITA: fit + almeno forza di manche\n\n4. COMPAGNO DI CHI E' INTERVENUTO - Regole:\n   - Surlicita su intervento: 11+ con fit, 14+ senza fit\n   - 1NT di fronte a intervento = 9-14\n   - Forzante fino al livello di guardia\n\n5. COMPAGNO DEL CONTRANTE - Schema risposte:\n   - Surlicita = unica forzante, obbligatoria con 11+\n   - Livello minimo = 0-10 punti\n   - Salto semplice = 8-10, 5+ carte (NF)\n   - Manche = 8-10, 6+ carte\n\n6. COME VERIFICARE SE IL FIT E' GARANTITO - Test:\n   Avrebbe potuto anche CONTRARE?\n   SI = fit CERTO al 100%\n   NO = fit possibile ma non garantito"},

    {"id": 11, "title": "Lezione 11: Controgioco - Ragionare e Dedurre",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Controgioco: Ragionare e Dedurre.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): CONTROGIOCO: RAGIONARE E DEDURRE\n\nCONTENUTI DA VISUALIZZARE:\n\n1. I 6 PREREQUISITI - Lista con icone numerate:\n   1) Gira la testa e GUARDA IL MORTO\n   2) Ricordati la DICHIARAZIONE\n   3) Conta PUNTI e LUNGHEZZE delle mani nascoste\n   4) Fai DEDUZIONI sulle carte giocate\n   5) Guarda le CARTE DEL COMPAGNO\n   6) Non intervenire a colore in modo scriteriato\n\n2. RICOSTRUIRE LA DISTRIBUZIONE - Diagramma tavolo bridge:\n   Es: Sud ha dichiarato 5 Cuori - 4 Quadri e ha 3 Picche = ha AL MASSIMO 1 Fiori!\n   Frecce che mostrano come dedurre le carte mancanti.\n\n3. ANALIZZA LA PRIMA PRESA - Box con lente:\n   Le carte della prima presa sono SEMPRE illuminanti!\n\n4. NON AFFRANCARE PER IL GIOCANTE! - Regola importante (rosso):\n   Se hai una vincente che affranchi carte al morto: NON incassarla!\n   Incassa SOLO se e' la presa del down\n\n5. MANTIENI LA LUNGHEZZA DEL MORTO - Diagramma:\n   Morto ha K92 Quadri, tu hai J10xx Quadri = NON scartare Quadri!\n   Scarta nell'ALTRO colore per mantenere il controllo\n\n6. EVITA IL TAGLIO E SCARTO - Warning rosso:\n   Non giocare colori in cui il morto e' VUOTO!\n   Il giocante taglia da una parte e scarta una perdente dall'altra.\n\n7. NON ESSERE PIGRO! - Box motivazionale:\n   Se il contratto sembra corazzato: CONTA le prese e cerca una falla!"},

    {"id": 12, "title": "Lezione 12: Interventi e Riaperture",
     "content": "Crea un'infografica educativa verticale per il bridge sul tema Interventi e Riaperture.\n\nTITOLO GRANDE in alto (sotto il logo FIGB): INTERVENTI E RIAPERTURE\n\nCONTENUTI DA VISUALIZZARE:\n\n1. CONTRO INFORMATIVO + RIMOZIONE - Schema con due tipi:\n   - CON 12-14 punti: requisiti stretti sui colori\n     Contro su 1 Cuori: mostra 4 Picche + tolleranza Fiori e Quadri\n     Contro su 1 Picche: mostra 4 Cuori + tolleranza Fiori e Quadri\n     Accetta qualsiasi scelta del compagno!\n   - CON 18+ punti: qualsiasi distribuzione\n     RIMOZIONE = cambio dichiarazione partner = mano 18+ automatica\n\n2. LA RIMOZIONE - Box evidenziato con esempi:\n   1Q-X-P-1C / P-1NT = bilanciata 18-20 con fermo Quadri\n   1Q-X-P-1P / P-2C = 18+ sbilanciata con Cuori quinte\n   Il compagno riconsideri le possibilita' di manche!\n\n3. INTERVENTO A SALTO (livello 2) - Box:\n   - 6 buone carte (2 onori) + valori di apertura: 11-15 punti\n   - Campo ristretto = facili decisioni per il compagno\n\n4. 2NT = BICOLORE MINORI - Schema (su aperture 1 Cuori o 1 Picche):\n   - Almeno 5 Quadri - 5 Fiori con buoni colori\n   - Nessun limite superiore\n   - NON con: colori inconsistenti, 5-4, monocolore mascherata\n\n5. IL PASSO FORTE - Diagramma strategico:\n   L'avversario apre nel TUO colore forte = PASSO!\n   NON contrare (significherebbe il contrario!)\n   Il compagno riapre con Contro, Tu PASSI = Contro trasformato!\n\n6. RIAPERTURE - Box:\n   Chi riapre con il Contro NON mostra forza propria\n   Ipotizza forza taciuta nel compagno\n   Con poche prese difensive ma forza giocabile: riapri a COLORE, non Contro"},
]


def generate_image(lesson_num, title, content_prompt):
    full_prompt = f"{content_prompt}\n\n{STYLE}\n\nIMPORTANT REMINDERS:\n- The infographic must be VERTICAL (portrait orientation), approximately 2:3 aspect ratio\n- All text in ITALIAN only\n- FIGB logo with 4 blue diamonds at the top\n- Maestro Franci in italic blue at bottom right\n- Clean, professional, colorful but not childish\n- Suitable for ages 8-17\n- Card suits: Spades black, Hearts red, Diamonds red, Clubs dark green/black\n- Use #0098D4 as primary blue accent color\n- White background\n- No English text, no BridgeQuest"

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        resp = urllib.request.urlopen(req, context=ssl_ctx, timeout=120)
        body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else "No body"
        print(f"  [ERROR] HTTP {e.code}: {error_body[:500]}")
        return None
    except Exception as e:
        print(f"  [ERROR] {type(e).__name__}: {e}")
        return None

    candidates = body.get("candidates", [])
    if not candidates:
        print(f"  [ERROR] No candidates in response")
        print(f"  Response keys: {list(body.keys())}")
        if "error" in body:
            print(f"  Error: {body['error']}")
        return None

    parts = candidates[0].get("content", {}).get("parts", [])

    image_path = None
    for part in parts:
        if "inlineData" in part:
            inline = part["inlineData"]
            img_data = base64.b64decode(inline["data"])
            mime = inline.get("mimeType", "image/png")
            ext = "png" if "png" in mime else "jpg"
            filename = f"lezione-{lesson_num:02d}-junior.{ext}"
            image_path = OUTPUT_DIR / filename
            with open(image_path, "wb") as f:
                f.write(img_data)
            print(f"  [OK] Saved: {image_path} ({len(img_data)} bytes, {mime})")
        elif "text" in part:
            text_preview = part["text"][:200]
            print(f"  [TEXT] {text_preview}")

    if image_path is None:
        print(f"  [ERROR] No image found in response parts")
        print(f"  Parts types: {[list(p.keys()) for p in parts]}")

    return image_path


def create_pdfs(image_paths):
    from PIL import Image

    valid_paths = [(i, p) for i, p in enumerate(image_paths) if p is not None and p.exists()]

    if not valid_paths:
        print("\\n[WARNING] No images found, skipping PDF creation.")
        return

    print(f"\\n{'='*60}")
    print(f"Creating PDFs from {len(valid_paths)} images...")
    print(f"{'='*60}")

    individual_pdfs = []
    pil_images = []

    for idx, img_path in valid_paths:
        img = Image.open(img_path)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        pdf_name = f"lezione-{idx+1:02d}-junior.pdf"
        pdf_path = OUTPUT_DIR / pdf_name
        img.save(pdf_path, "PDF", resolution=150)
        individual_pdfs.append(pdf_path)
        pil_images.append(img)
        print(f"  [PDF] {pdf_path}")

    if len(pil_images) > 1:
        combined_path = OUTPUT_DIR / "corso-quadri-junior.pdf"
        pil_images[0].save(
            combined_path, "PDF", resolution=150,
            save_all=True, append_images=pil_images[1:]
        )
        print(f"\\n  [COMBINED PDF] {combined_path}")
    elif len(pil_images) == 1:
        combined_path = OUTPUT_DIR / "corso-quadri-junior.pdf"
        pil_images[0].save(combined_path, "PDF", resolution=150)
        print(f"\\n  [COMBINED PDF] {combined_path}")

    print(f"\\nPDF creation complete: {len(individual_pdfs)} individual + 1 combined")


def main():
    print("=" * 60)
    print("FIGB Corso Quadri - Infographic Generation (Junior Profile)")
    print(f"Model: {MODEL}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Lessons: {len(LESSONS)}")
    print("=" * 60)

    image_paths = []

    for i, lesson in enumerate(LESSONS):
        lid = lesson["id"]
        title = lesson["title"]
        content = lesson["content"]

        print(f"\\n[{i+1}/{len(LESSONS)}] Generating: {title}")

        img_path = generate_image(lid, title, content)
        image_paths.append(img_path)

        if i < len(LESSONS) - 1:
            print(f"  Waiting 3 seconds before next request...")
            time.sleep(3)

    success = sum(1 for p in image_paths if p is not None)
    print(f"\\n{'='*60}")
    print(f"GENERATION COMPLETE: {success}/{len(LESSONS)} images generated")
    print(f"{'='*60}")

    create_pdfs(image_paths)

    print(f"\\n{'='*60}")
    print("OUTPUT FILES:")
    print(f"{'='*60}")
    for f in sorted(OUTPUT_DIR.iterdir()):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
