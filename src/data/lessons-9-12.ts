/**
 * BridgeQuest - Lesson Content Data (Lessons 9-12)
 * Extracted from FIGB Corso Fiori 2022 official course material
 * World 4: La Dichiarazione (lessons 9, 10)
 * World 5: La Competizione (lessons 11, 12)
 */

import type { Lesson } from "./lessons";

// ===== LESSON 9: Aperture di 1 a colore. Le risposte =====

const lezione9: Lesson = {
  id: 9,
  worldId: 4,
  title: "Aperture di 1 a colore. Le risposte",
  subtitle: "Come rispondere all'apertura del compagno",
  icon: "repeat",
  smazzateIds: ["9-1", "9-2", "9-3", "9-4", "9-5", "9-6", "9-7", "9-8"],
  modules: [
    {
      id: "9-1",
      title: "Risposte limitative, invitanti, forzanti",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "I tre tipi di risposta",
        },
        {
          type: "text",
          content:
            "Apertore e Rispondente si scambiano informazioni con un duplice scopo: trovare un fit (incontro di almeno 8 carte in un seme) e valutare la forza combinata delle due mani per decidere il livello a cui giocare. Poiche 24/25 punti coppia danno ragionevoli probabilita di manche, nessuno dei due dovra abbandonare finche non avra escluso tale possibilita.",
        },
        {
          type: "text",
          content:
            "E fondamentale che il Rispondente sappia, fin dalla prima occasione dichiarativa, quale sia il valore dinamico della risposta che fornisce: se la sua licita puo indurre a un arresto del dialogo (Passo) o se obbligatoriamente ne provochera la continuazione.",
        },
        {
          type: "rule",
          content:
            "Le risposte si dividono in tre categorie: LIMITATIVE (mostrano limiti precisi, l'apertore puo passare), INVITANTI (mostrano un limite ma chiedono qualcosa in piu), FORZANTI (cambio di colore, l'apertore non puo passare).",
        },
        {
          type: "tip",
          content: "Ricorda la regola d'oro del Passo",
          explanation:
            "Quando il compagno apre di 1 a colore, non dire mai Passo se avete 5 o piu punti! Chi apre puo avere da 12 a 20, quindi la coppia potrebbe avere 25 punti per la manche.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♠ e tu hai 3 punti. Cosa dici?",
          options: ["1NT", "2♠", "Passo", "2♣"],
          correctAnswer: 2,
          explanation:
            "Con meno di 5 punti si dice Passo: la manche non e realizzabile perche la coppia avrebbe al massimo 23 punti (20+3).",
        },
        {
          type: "true-false",
          content:
            "Una risposta di colore nuovo è sempre forzante (l'apertore non può passare)?",
          correctAnswer: 0,
          explanation:
            "Esatto! Il colore nuovo è la dichiarazione forzante per eccellenza: promette 5+ punti e chiede all'apertore di parlare ancora.",
        },
      ],
    },
    {
      id: "9-2",
      title: "Gli appoggi",
      duration: "6",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Appoggi a livello 2, 3 e 4",
        },
        {
          type: "text",
          content:
            "Le risposte di appoggio mostrano un limite inferiore e un limite superiore di forza. Questo mette l'apertore in grado di fare somme e di prendere decisioni, compreso il passo. Gli appoggi sono dichiarazioni NON FORZANTI.",
        },
        {
          type: "rule",
          content:
            "Appoggio a livello 2 (es. 1♦-2♦, 1♠-2♠): LIMITATIVO, mostra fit sufficiente e circa 5-9 punti. Il messaggio e: 'se hai una mano di forza normale (12-13) la manche e irraggiungibile'.",
        },
        {
          type: "example",
          content: "Il compagno apre 1♦ e tu hai:",
          cards: "♠Q53 ♥A5 ♦Q874 ♣7654",
        },
        {
          type: "text",
          content:
            "Dite 2♦: avete il fit (4 carte) e i punti giusti (7). Su 1♥ o 1♠ bastano 3 carte per l'appoggio; su 1♦ ne servono 4.",
        },
        {
          type: "rule",
          content:
            "Appoggio a livello 3 (es. 1♦-3♦, 1♥-3♥): INVITANTE, mostra fit e 10-11 punti. Il messaggio e: 'la manche e possibile se tu hai qualcosa in piu del minimo: almeno 14 punti'.",
        },
        {
          type: "rule",
          content:
            "Appoggio a livello 4 nel nobile (1♥-4♥, 1♠-4♠): mostra almeno fit di 4 carte e una distribuzione adatta ai tagli. Il messaggio e: 'penso che tu possa fare 10 prese anche col minimo'. Si descrive una mano di forza limitata (mai piu di 11 punti onori) che si e rivalutata grazie al fit.",
        },
        {
          type: "example",
          content: "Legge di Rivalutazione - il compagno apre 1♥ e tu hai:",
          cards: "♠8 ♥KJ72 ♦KQ74 ♣7642",
        },
        {
          type: "text",
          content:
            "Dite 4♥! Avete 9 punti onori ma con la rivalutazione (differenza atout meno colore corto = 4-1 = +3) arrivate a 12. La Legge di Rivalutazione: il rispondente con mano sbilanciata (non 4333) e fit di almeno 4 carte aggiunge ai suoi punti un valore x dato dalla differenza tra il numero di carte di atout e il numero di carte del colore piu corto.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♥ e tu hai: ♠83 ♥AJ5 ♦K9874 ♣K32. Cosa rispondi?",
          options: ["2♥", "3♥", "4♥", "1NT"],
          correctAnswer: 1,
          explanation:
            "Avete 10 punti e fit di 3 carte a Cuori: e un appoggio invitante (livello 3). Se il compagno ha 14+, la manche sara raggiungibile.",
        },
        {
          type: "hand-eval",
          content:
            "Conta i punti della mano: ♠K82 ♥Q963 ♦A74 ♣J65",
          cards: "♠K82 ♥Q963 ♦A74 ♣J65",
          correctValue: 10,
          explanation:
            "K=3, Q=2, A=4, J=1. Totale: 10 punti onori.",
        },
      ],
    },
    {
      id: "9-3",
      title: "I colori nuovi a livello 1 e 2",
      duration: "6",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Le risposte a colore nuovo: forzanti!",
        },
        {
          type: "text",
          content:
            "Quando il rispondente dice un colore nuovo a livello 1, promette almeno 5 punti e un massimo indefinito. Chiede che gli torni la parola: l'apertore non puo passare. I colori nuovi sono dichiarazioni FORZANTI.",
        },
        {
          type: "rule",
          content:
            "Le risposte 'uno su uno' promettono 4 o piu carte e chiedono all'apertore di descriversi ancora, con precedenza assoluta al fit. N.B: 1♥ e 1♠ sono sempre quinte in apertura, ma anche solo quarte in risposta!",
        },
        {
          type: "example",
          content: "Il compagno apre 1♣ e voi avete:",
          cards: "♠82 ♥KJ72 ♦Q92 ♣7642",
        },
        {
          type: "text",
          content:
            "Dite 1♥: mostrate le vostre 4 carte di Cuori. Se il compagno ha fit dira 2♥; se non ha Cuori ma ha 4 Picche dira 1♠; altrimenti potra dire 1NT o il suo colore lungo.",
        },
        {
          type: "rule",
          content:
            "Con due colori entrambi lunghi (5 carte) si inizia dal piu alto di rango. Con un colore lungo e uno quarto si inizia dal lungo. Con due colori quarti si inizia dal piu economico.",
        },
        {
          type: "text",
          content:
            "Le risposte 2 su 1 (es. 1♠-2♣, 1♠-2♦, 1♠-2♥) sono FORZANTI FINO A MANCHE: promettono almeno 12 punti. Serve almeno lo stesso numero di carte richiesto dall'apertura: almeno 4 per 2♦, almeno 2 per 2♣, almeno 5 a Cuori per 2♥ (su apertura 1♠).",
        },
        {
          type: "tip",
          content: "Non saltare livello inutilmente!",
          explanation:
            "Se potete dire il vostro colore a livello 1, non salite a livello 2 solo perche avete molti punti. La risposta di 1♥ mostra 5+ punti: ci rientrano anche 17 splendidi punti! Non fate un 'salto' che avrebbe un altro significato.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♦ e voi avete: ♠AQ7 ♥AQJ762 ♦K4 ♣A2. Cosa rispondete?",
          options: ["2♥", "1♥", "4♥", "3NT"],
          correctAnswer: 1,
          explanation:
            "Dite 1♥! La risposta 'uno su uno' mostra 5 o piu punti con un massimo illimitato. Non saltate a 2♥ che richiederebbe di mostrare una mano completamente diversa.",
        },
        {
          type: "bid-select",
          content:
            "Il compagno apre 1♦, avete 4 cuori e 4 picche con 8 punti. Quale colore mostrate per primo?",
          options: ["1♥", "1♠", "1NT", "2♦"],
          correctAnswer: 0,
          explanation:
            "Con due colori quarti si inizia dal più economico: 1♥ viene prima di 1♠.",
        },
      ],
    },
    {
      id: "9-4",
      title: "La risposta 1NT, 2NT e 3NT",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Le risposte a Senza Atout",
        },
        {
          type: "text",
          content:
            "Puo succedere che il Rispondente non possa dire Passo (ha 5+ punti) ne dire il proprio colore (non ha i punti sufficienti per andare a livello 2). A volte dovra rinunciare a mostrare un colore, o addirittura rinunciare a mostrarli entrambi.",
        },
        {
          type: "rule",
          content:
            "La risposta 1NT e NON FORZANTE, mostra 5-10 punti e nega 4+ carte in tutti i colori che avrebbero potuto essere dichiarati a livello 1. Non promette mano bilanciata.",
        },
        {
          type: "example",
          content: "Il compagno ha aperto 1♥ e voi avete:",
          cards: "♠32 ♥4 ♦QJ973 ♣KQ852",
        },
        {
          type: "text",
          content:
            "Avete due quinte ma non potete dichiarare nessuna delle due, perche avete punteggio insufficiente per salire a livello 2. Il sistema offre una sola soluzione: la risposta 1NT.",
        },
        {
          type: "text",
          content:
            "La risposta 2NT (11 punti) e INVITANTE: descrive carte con cui il rispondente ha contato almeno 23 sulla linea (12 dell'apertore + 11 suoi). Esclude fit nei nobili. La risposta 3NT (12-15 punti) propone direttamente la manche: mano bilanciata senza colori nobili giocabili.",
        },
        {
          type: "example",
          content: "Risposte a Senza - su apertura 1♣ avete:",
          cards: "♠AQ6 ♥KJ4 ♦J1098 ♣QJ6",
        },
        {
          type: "text",
          content:
            "Dite 3NT: la somma e 25 anche a fronte dell'apertura minima, la mano e assolutamente bilanciata, e senza colori nobili giocabili.",
        },
        {
          type: "quiz",
          content:
            "Su apertura 1♠, se rispondete 1NT, cosa state negando?",
          options: [
            "Di avere punti",
            "Di avere 4+ carte di Picche",
            "Di avere un colore lungo",
            "Di voler giocare",
          ],
          correctAnswer: 1,
          explanation:
            "Su 1♠ la risposta 1NT nega fit a Picche (non avete 3+ carte). Mostra 5-10 punti e nessun colore dichiarabile a livello 1 (non ci sono colori sopra le Picche!). Puo avere qualsiasi distribuzione.",
        },
        {
          type: "true-false",
          content:
            "La risposta 1NT è sempre forzante?",
          correctAnswer: 1,
          explanation:
            "No! La risposta 1NT è NON FORZANTE: mostra 5-10 punti. L'apertore può passare se ha mano minima.",
        },
      ],
    },
    {
      id: "9-5",
      title: "Pratica: Smazzate 9",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: Le risposte all'apertura",
        },
        {
          type: "text",
          content:
            "Gioca le smazzate della Lezione 9. In ogni mano, analizza prima la tua forza e distribuzione, poi scegli la risposta corretta: appoggio, colore nuovo o senza atout.",
        },
        {
          type: "tip",
          content: "Consiglio del Maestro Fiori",
          explanation:
            "Prima di rispondere, chiediti sempre: 'Ho il fit? Se si, a che livello lo comunico? Se no, ho un colore nuovo da dire? Se neanche, dico Senza.' Questa scaletta ti guidera alla risposta giusta!",
        },
      ],
    },
  ],
};

// ===== LESSON 10: L'apertore descrive (La ridichiara dell'apertore) =====

const lezione10: Lesson = {
  id: 10,
  worldId: 4,
  title: "L'apertore descrive",
  subtitle: "La ridichiara dell'apertore dopo la risposta",
  icon: "hash",
  smazzateIds: ["10-1", "10-2", "10-3", "10-4", "10-5", "10-6", "10-7", "10-8"],
  modules: [
    {
      id: "10-1",
      title: "Il compito dell'apertore",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Decidere o descrivere?",
        },
        {
          type: "text",
          content:
            "Il compito dell'apertore al momento della sua replica si riassume in tre righe: su risposte non forzanti, DECIDE. Su risposte 1 su 1, descrive forza e distribuzione. Su risposte 2 su 1, descrive solo la distribuzione.",
        },
        {
          type: "rule",
          content:
            "L'apertore ha mano 'di Diritto' quando e nella fascia 12-15, e ha mano 'di Rovescio' quando e nel campo 16-20.",
        },
        {
          type: "text",
          content:
            "Il partner, per avere idea di quale sia la forza di chi ha aperto, ha bisogno di sentire almeno due dichiarazioni. Ora ci serve una definizione: chiamiamo LIVELLO DI GUARDIA l'ultimo contratto superato il quale non c'e piu certezza di conseguire un risultato ragionevole.",
        },
        {
          type: "tip",
          content: "Diritto o Rovescio: la chiave della ridichiara",
          explanation:
            "Se avete aperto con 12-15 punti (Diritto) cercate di descrivervi restando entro il Livello di Guardia. Se avete 16-20 (Rovescio) superate il Livello di Guardia per mostrare la vostra forza extra.",
        },
        {
          type: "quiz",
          content:
            "Avete aperto 1♦ e il compagno ha risposto 1♠. Avete 13 punti e mano bilanciata. Cosa dite?",
          options: ["2♦", "1NT", "2♠", "2NT"],
          correctAnswer: 1,
          explanation:
            "Con mano di Diritto bilanciata, il Livello di Guardia e 1NT. Dichiarate 1NT per descrivere forza 12-15 e distribuzione bilanciata.",
        },
        {
          type: "true-false",
          content:
            "L'apertore con 12-15 punti ha una mano di 'Diritto'?",
          correctAnswer: 0,
          explanation:
            "Esatto! La mano di Diritto è nella fascia 12-15 punti. La mano di Rovescio è 16-20.",
        },
      ],
    },
    {
      id: "10-2",
      title: "Ridichiarazione dopo risposta 1 su 1",
      duration: "6",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Mano di Diritto: restare entro il Livello di Guardia",
        },
        {
          type: "text",
          content:
            "Le risposte 1 su 1 non hanno limite superiore, ma il limite minimo e 5 punti. L'Apertore ha il compito di descriversi, ma anche di tener presente che esiste un 'livello di guardia' oltre il quale la coppia, se non trova fit e ha solo 18-19 punti in linea, potrebbe essere a rischio.",
        },
        {
          type: "rule",
          content:
            "Dopo risposta 1 su 1, quando l'apertore ha mano di Diritto: se e bilanciato il suo Livello di Guardia e 1NT; se e sbilanciato il suo Livello di Guardia e '2 nel colore di apertura' (il suo colore lungo).",
        },
        {
          type: "example",
          content: "Aprite 1♣, il compagno risponde 1♠ e avete:",
          cards: "♠AKJ7 ♥Q43 ♦42 ♣KJ86",
        },
        {
          type: "text",
          content:
            "Mano di Diritto bilanciata. Il livello di Guardia e 1NT, ma la quarta di Picche puo essere descritta restando al di sotto di tale livello: dite 1♠. Trovate fit senza superare il LDG!",
        },
        {
          type: "example",
          content: "Aprite 1♥, il compagno risponde 1♠ e avete:",
          cards: "♠J7 ♥KQ943 ♦AQ65 ♣J7",
        },
        {
          type: "text",
          content:
            "Mano di Diritto sbilanciata. Il livello di Guardia e 2♥; poiche le Quadri possono essere descritte restando al di sotto di tale livello (2♦), e corretto che Sud dica 2♦.",
        },
        {
          type: "quiz",
          content:
            "Aprite 1♣, il compagno risponde 1♠. Avete: ♠AK7 ♥QJ43 ♦42 ♣KJ86. Cosa dite?",
          options: ["1NT", "2♥", "2♠", "2♣"],
          correctAnswer: 0,
          explanation:
            "Mano di Diritto bilanciata: non gli e concesso dichiarare le Cuori (sarebbe un colore nuovo sopra il LDG di 1NT). Dichiarate 1NT. Nessun timore di perdere fit: Nord non ha 4 carte di Cuori (altrimenti avrebbe detto 1♥ prima di 1♠), oppure le ha accanto a Picche piu lunghe e le mostrera al giro successivo.",
        },
        {
          type: "hand-eval",
          content:
            "Conta i punti della mano: ♠AKJ7 ♥Q43 ♦42 ♣KJ86",
          cards: "♠AKJ7 ♥Q43 ♦42 ♣KJ86",
          correctValue: 14,
          explanation:
            "A=4, K=3, J=1, Q=2, K=3, J=1. Totale: 14 punti. Mano di Diritto!",
        },
      ],
    },
    {
      id: "10-3",
      title: "Mano di Rovescio",
      duration: "6",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Mano di Rovescio: superare il Livello di Guardia",
        },
        {
          type: "rule",
          content:
            "Dopo risposta 1 su 1, quando l'apertore ha mano di Rovescio (16-20), descrivera SEMPRE superando il Livello di Guardia.",
        },
        {
          type: "example",
          content: "Aprite 1♣, il compagno risponde 1♦ e avete:",
          cards: "♠AKJ7 ♥Q43 ♦4 ♣AKJ86",
        },
        {
          type: "text",
          content:
            "Mano di Rovescio, sbilanciata. La quarta di Picche deve essere descritta saltando un livello: dite 2♠. Il compagno ne ricavera due informazioni: A) che l'apertore ha almeno 16 punti; B) che essendo sbilanciato e non avendo aperto 1NT, e di certo sbilanciato, quindi le Picche sono 4 e il colore di apertura e lungo.",
        },
        {
          type: "example",
          content: "Aprite 1♥, il compagno risponde 1♠ e avete:",
          cards: "♠A7 ♥AQ943 ♦4 ♣AKJ86",
        },
        {
          type: "text",
          content:
            "Mano di Rovescio, sbilanciata. Le Fiori devono essere descritte saltando un livello: dite 3♣ (entro il LDG si direbbe 2♣, quindi il salto mostra forza extra).",
        },
        {
          type: "text",
          content:
            "Se l'apertore ha mano di Rovescio con distribuzione bilanciata e troppi punti per 1NT (15-17) e troppo pochi per 2NT (21-23), fa il salto a 2NT che descrive al compagno la bilanciata intermedia di 18-20 punti.",
        },
        {
          type: "quiz",
          content:
            "Aprite 1♦, il compagno risponde 1♠. Avete: ♠A987 ♥AQ3 ♦KQ874 ♣6. Con 16 punti, cosa dite?",
          options: ["2♠", "3♠", "2♦", "4♠"],
          correctAnswer: 1,
          explanation:
            "Mano di Rovescio! Dovete comunicare fit e forza. L'appoggio a livello 3 descrive una mano di Rovescio minimo (circa 16-18): se tale forza e sbilanciata, automaticamente la mano e sbilanciata, altrimenti avreste aperto 1NT.",
        },
        {
          type: "bid-select",
          content:
            "Aprite 1♥, il compagno risponde 1♠. Avete 18 punti e mano bilanciata. Cosa dite?",
          options: ["1NT", "2NT", "3NT", "2♥"],
          correctAnswer: 1,
          explanation:
            "Con mano di Rovescio bilanciata (18-20 punti), il salto a 2NT descrive la vostra forza extra.",
        },
      ],
    },
    {
      id: "10-4",
      title: "Ridichiarazione dopo risposta 2 su 1",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Dopo risposte 'due su uno': forzanti a manche",
        },
        {
          type: "rule",
          content:
            "Sulle risposte 2 su 1, forzanti fino a manche, l'Apertore descrive senza fare distinzioni tra Diritto e Rovescio.",
        },
        {
          type: "text",
          content:
            "La manche piu ragionevole dal punto di vista di Est, quando sente Ovest dichiarare il solo colore che lo preoccupa, e spesso 3NT: non ha piu problemi e propone 3NT.",
        },
        {
          type: "example",
          content: "Ovest apre 1♦, Est risponde 2♣ e poi:",
          cards: "♠93 ♥AK73 ♦KQJ5 ♣983",
        },
        {
          type: "text",
          content:
            "Ovest ha mano di Diritto, non ha niente da aggiungere. Ma poiche la risposta 2 su 1 e forzante a manche, descrive semplicemente: 2♥. Est sentendo il solo colore che lo preoccupava, dira 3NT.",
        },
        {
          type: "text",
          content:
            "Dichiarazioni successive del rispondente: se dopo che l'apertore si e descritto con due dichiarazioni il rispondente e in grado di dichiarare un contratto finale, lo fa. Se la prima risposta e stata 'uno su uno', l'UNICO MODO per garantirsi che l'apertore parli ancora e dichiarare un colore nuovo (che funziona da pungolo e non richiede effettiva lunghezza).",
        },
        {
          type: "rule",
          content:
            "Dopo risposta 1 su 1, da parte del rispondente: le dichiarazioni a Senz'atout oppure di vecchi colori (= gia dichiarati da uno dei due) sono 'non forzanti'. 1NT e tutti i vecchi colori al minimo escludono tassativamente manche. 2NT e i vecchi colori a salto sono invitanti.",
        },
        {
          type: "quiz",
          content:
            "Aprite 1♦, il compagno risponde 2♣ (forzante a manche). Avete: ♠AJ10 ♥62 ♦A73 ♣KQ754. Cosa dite?",
          options: ["2♦", "3♣", "2NT", "3NT"],
          correctAnswer: 0,
          explanation:
            "Descrivete semplicemente: mostrate i Quadri per continuare il dialogo. Poiche la risposta 2 su 1 e forzante a manche, non c'e fretta di saltare livelli. Il dialogo continuera fino alla manche.",
        },
        {
          type: "true-false",
          content:
            "Sulle risposte 2 su 1, l'apertore deve distinguere tra Diritto e Rovescio?",
          correctAnswer: 1,
          explanation:
            "No! Sulle risposte 2 su 1 (forzanti a manche), l'apertore descrive senza fare distinzioni: non importa se è di Diritto o Rovescio.",
        },
      ],
    },
    {
      id: "10-5",
      title: "Pratica: Smazzate 10",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: La ridichiara dell'apertore",
        },
        {
          type: "text",
          content:
            "Gioca le smazzate della Lezione 10. In ogni mano, valuta se hai una mano di Diritto o Rovescio, individua il tuo Livello di Guardia, e scegli la ridichiara corretta.",
        },
        {
          type: "tip",
          content: "Consiglio del Maestro Fiori",
          explanation:
            "La regola e semplice: prima classifica la tua mano (Diritto 12-15 o Rovescio 16-20), poi decidi se restare entro il Livello di Guardia o superarlo. Se sei di Diritto, resta sotto. Se sei di Rovescio, salta!",
        },
      ],
    },
  ],
};

// ===== LESSON 11: L'intervento =====

const lezione11: Lesson = {
  id: 11,
  worldId: 5,
  title: "L'intervento",
  subtitle: "Come entrare nella dichiarazione avversaria",
  icon: "swords",
  smazzateIds: ["11-1", "11-2", "11-3", "11-4", "11-5", "11-6", "11-7", "11-8"],
  modules: [
    {
      id: "11-1",
      title: "L'intervento di Contro",
      duration: "6",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Il Contro informativo",
        },
        {
          type: "text",
          content:
            "Si definisce intervento la prima dichiarazione diversa da Passo effettuata da un giocatore appartenente alla linea opposta all'Apertore. Un intervento e una libera iniziativa: sta al giocatore decidere se gli convenga o meno entrare in dichiarazione. Ci sono tre tipi di intervento: Contro, 1NT, e intervento a colore.",
        },
        {
          type: "text",
          content:
            "Il Contro esprime il desiderio di aggiudicarsi un contratto sulla propria linea, giocando in un colore diverso da quello dell'apertore. La mano perfetta per il Contro presenta tutti e tre i colori giocabili e la corta in corrispondenza del seme avversario.",
        },
        {
          type: "example",
          content: "Sud ha aperto 1♦, tocca a Ovest con:",
          cards: "♠KJ98 ♥AQ74 ♦5 ♣K983",
        },
        {
          type: "text",
          content:
            "Contro! I requisiti sono perfetti: entrambe le quarte maggiori, eventuale tolleranza delle Quadri, e punteggio sufficiente.",
        },
        {
          type: "rule",
          content:
            "L'intervento di Contro, in seconda come in quarta posizione, chiede al compagno di scegliere un colore e dichiararlo al livello cui pensa di poter giocare.",
        },
        {
          type: "rule",
          content:
            "Quando si e nella fascia 12-16: il Contro su 1♣ o 1♦ garantisce 4 Cuori e 4 Picche (o 4+3, mai 4+2). Il Contro su 1♥ garantisce 4 Picche. Il Contro su 1♠ garantisce 4 Cuori.",
        },
        {
          type: "quiz",
          content:
            "Sud apre 1♣, tocca a voi con: ♠9854 ♥K4 ♦A765 ♣AJ3. Cosa dite?",
          options: ["Contro", "1♦", "1NT", "Passo"],
          correctAnswer: 3,
          explanation:
            "Passo! I punti basterebbero per intervenire, ma mancano le Cuori. Il compagno, a cui si sta chiedendo di scegliere un colore (con l'implicita promessa di portargli fit), si sentirebbe tradito.",
        },
        {
          type: "true-false",
          content:
            "Il Contro informativo su apertura 1♦ garantisce almeno 4 Cuori e 4 Picche?",
          correctAnswer: 0,
          explanation:
            "Nella fascia 12-16 punti, il Contro su apertura a minore garantisce 4+4 nei nobili (o almeno 4+3).",
        },
      ],
    },
    {
      id: "11-2",
      title: "Il compagno del contrante",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Come rispondere al Contro del compagno",
        },
        {
          type: "rule",
          content:
            "Il compagno del contrante sceglie un colore perche e obbligato a farlo; il punteggio minimo con cui fa una dichiarazione al minimo livello e ZERO.",
        },
        {
          type: "example",
          content: "Sud apre 1♦, Ovest dice Contro, Nord passa. Est ha:",
          cards: "♠54 ♥J986 ♦952 ♣Q532",
        },
        {
          type: "text",
          content:
            "1♥: anche con una mano quasi nulla e opportuno fare una scelta, la piu bassa possibile. Non passare! Il Passo farebbe diventare definitivo il contratto di '1♦ contrato', che si risolverebbe in un disastro ben peggiore: con molta probabilita verrebbe mantenuto, e ogni presa in piu costerebbe una cifra.",
        },
        {
          type: "text",
          content:
            "Con una mano di almeno 12 punti, fate la dichiarazione che fareste se poteste vedere le carte del compagno: una mano con 'almeno la 4-3' nei colori nobili. Se pensate di poter fare una manche, dichiaratela e resterete al palo.",
        },
        {
          type: "example",
          content: "Dopo Contro del compagno, con carte buone:",
          cards: "♠KJ954 ♥A76 ♦95 ♣K64",
        },
        {
          type: "text",
          content:
            "4♠! Fate la dichiarazione che fareste se poteste vedere le carte del compagno: una mano di almeno 12 punti con 'almeno la 4-3' nei colori nobili.",
        },
        {
          type: "quiz",
          content:
            "Il compagno dice Contro su 1♦ avversario. Avete: ♠K4 ♥Q86 ♦AJ10 ♣K954. Cosa dite?",
          options: ["1♥", "2♦", "1NT", "3NT"],
          correctAnswer: 3,
          explanation:
            "3NT! Il punteggio e sufficiente, il fit a Cuori o Picche e escluso, e il fermo a Quadri c'e: decisione facile.",
        },
        {
          type: "hand-eval",
          content:
            "Conta i punti della mano: ♠KJ954 ♥A76 ♦95 ♣K64",
          cards: "♠KJ954 ♥A76 ♦95 ♣K64",
          correctValue: 11,
          explanation:
            "K=3, J=1, A=4, K=3. Totale: 11 punti.",
        },
      ],
    },
    {
      id: "11-3",
      title: "L'intervento di 1NT e a colore",
      duration: "6",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Gli altri due tipi di intervento",
        },
        {
          type: "text",
          content:
            "L'intervento di 1NT promette forza e distribuzione equivalente all'apertura di 1NT. Visto che gli avversari hanno gia un'indicazione per l'attacco (c'e stata l'apertura in un colore), l'intervento di 1NT garantisce il fermo nel colore dell'apertore.",
        },
        {
          type: "example",
          content: "Sud ha aperto 1♥, Ovest ha:",
          cards: "♠AJ5 ♥KJ7 ♦AJ1053 ♣K8",
        },
        {
          type: "text",
          content:
            "1NT: forza giusta (15-17), distribuzione bilanciata, e fermo nelle Cuori dell'avversario.",
        },
        {
          type: "rule",
          content:
            "L'intervento a colore mette in luce il tratto piu significativo della mano. Ha precisi limiti superiori: promette al massimo 16/17 punti. La forza minima e 8 punti a livello 1, e un po' di piu a livello 2.",
        },
        {
          type: "text",
          content:
            "Si interviene dichiarando un colore solo se: si possiede un ottimo colore, lungo e solido (anche con soli 7/8 punti), oppure si possiede un punteggio elevato inadatto al Contro e a 1NT (colore scarsamente onorato ma tanti punti).",
        },
        {
          type: "rule",
          content:
            "Un intervento a colore e giustificato o da un ottimo colore o da tanti punti: evitatelo se non avete ne una cosa ne l'altra! Ricordatevi che il compagno ci attacchera.",
        },
        {
          type: "example",
          content: "Intervento a colore 1 su 1 - apertura avversaria 1♦:",
          cards: "♠82 ♥AKJ1042 ♦86 ♣983",
        },
        {
          type: "text",
          content:
            "1♥: 5 carte con almeno 1 Onore (raramente 4 con almeno 2 onori), 6 qualsiasi. Punti: 8-16. Il punteggio minimo (7/8) e tutto concentrato nel colore.",
        },
        {
          type: "quiz",
          content:
            "Sud apre 1♥. Avete: ♠AK5 ♥98 ♦AK73 ♣QJ97. Cosa dite?",
          options: ["Contro", "1NT", "2♦", "Passo"],
          correctAnswer: 0,
          explanation:
            "Contro! Non 1NT perche non avete il fermo a Cuori (98 non basta). Il Contro e appropriato: avete i punti e la giocabilita nei colori rimasti. Non importa che non abbiate esattamente 4 Picche: con 17 punti e questa distribuzione il Contro e la scelta migliore.",
        },
        {
          type: "bid-select",
          content:
            "Sud apre 1♠. Avete: mano bilanciata, 16 punti, KJ7 di Picche. Come intervenite?",
          options: ["Contro", "1NT", "2♣", "Passo"],
          correctAnswer: 1,
          explanation:
            "1NT! Avete la distribuzione bilanciata (15-17 range), il fermo a Picche (KJ7) e i punti giusti.",
        },
      ],
    },
    {
      id: "11-4",
      title: "L'intervento a colore: requisiti e consigli",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Intervento 2 su 1 e consigli pratici",
        },
        {
          type: "text",
          content:
            "L'intervento a colore 2 su 1 normalmente e almeno sesto, si fa eccezione per le Cuori (nel caso di apertura 1 Picche e intervento di 2 Cuori) data la loro nobilta. I requisiti sono uguali sia in seconda che in quarta posizione.",
        },
        {
          type: "rule",
          content:
            "Intervento 2 su 1: Punti 10-16. Carte: 6 (se ♣ o ♦) con almeno 1 Onore, oppure 5 (se ♥) con almeno 1 Onore e 13+ punti.",
        },
        {
          type: "example",
          content: "Apertura avversaria di 1♠, intervento in 2a posizione:",
          cards: "♠54 ♥98 ♦KQJ862 ♣A76",
        },
        {
          type: "text",
          content:
            "2♦: sesto con onori e punteggio sufficiente (10 punti). Le Quadri sono un ottimo colore da dichiarare.",
        },
        {
          type: "text",
          content:
            "Il compagno di chi ha fatto un intervento a colore si basera sul minimo garantito. Con 9+ punti non dovra mai dire passo, perche la manche e possibile (16+9=25). Gli appoggi possono essere dati anche con tre sole carte.",
        },
        {
          type: "tip",
          content: "Il consiglio d'oro sull'intervento a colore",
          explanation:
            "Quando state per dire un colore, ricordatevi che il compagno ci attacchera. Se questo vi fa rizzare i capelli, vuol dire che l'intervento e sbagliato! Nel 70% dei casi quando c'e competizione il contratto finisce alla linea dell'Apertore, quindi ogni intervento influenza il controgioco.",
        },
        {
          type: "quiz",
          content:
            "L'avversario apre 1♠. Avete: ♠K98 ♥87 ♦KQ4 ♣AJ543. Cosa dite?",
          options: ["2♣", "Contro", "1NT", "Passo"],
          correctAnswer: 3,
          explanation:
            "Passo! Le Fiori sono scarsamente onorate per un intervento a livello 2 (servirebbero 6 carte), e la mano non e adatta ne al Contro (mancano le Cuori) ne a 1NT (manca il fermo sicuro a Picche con solo K98). Meglio aspettare.",
        },
        {
          type: "true-false",
          content:
            "L'intervento a colore può mostrare più di 16/17 punti?",
          correctAnswer: 1,
          explanation:
            "No! L'intervento a colore ha un preciso limite superiore di 16-17 punti. Con di più, si usa il Contro (seguito da eventuale cambio di colore) per mostrare forza extra.",
        },
      ],
    },
    {
      id: "11-5",
      title: "Pratica: Smazzate 11",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: L'intervento",
        },
        {
          type: "text",
          content:
            "Gioca le smazzate della Lezione 11. Valuta se e opportuno intervenire e con quale tipo di intervento: Contro, 1NT o a colore. Ricorda: non intervenire sempre, a volte la scelta migliore e Passo!",
        },
        {
          type: "tip",
          content: "Consiglio del Maestro Fiori",
          explanation:
            "Prima di intervenire chiediti tre cose: 1) Ho i requisiti per il Contro? (colori giusti e punti) 2) Ho i requisiti per 1NT? (15-17 bilanciata col fermo) 3) Ho un ottimo colore per l'intervento a colore? Se la risposta e 'no' a tutte e tre, passa senza rimpianti!",
        },
      ],
    },
  ],
};

// ===== LESSON 12: Sviluppi dopo l'intervento avversario =====

const lezione12: Lesson = {
  id: 12,
  worldId: 5,
  title: "Sviluppi dopo l'intervento avversario",
  subtitle: "Come proseguire quando l'avversario interviene",
  icon: "shield",
  smazzateIds: ["12-1", "12-2", "12-3", "12-4", "12-5", "12-6", "12-7", "12-8"],
  modules: [
    {
      id: "12-1",
      title: "Dichiarazioni obbligate e libere",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Quando l'avversario si intromette",
        },
        {
          type: "text",
          content:
            "Nel dialogo 'a due' ogni dichiarazione fornita e la condizione indispensabile per dare al compagno l'opportunita di dichiarare ancora: e un rimbalzo simile a un palleggio su un campo da tennis. Ma quando nella dichiarazione si intromette un avversario, crea automaticamente una situazione in cui 'l'ultima parola' spetta a chi e seduto alla sua destra.",
        },
        {
          type: "rule",
          content:
            "Una dichiarazione fornita liberamente, in assenza di obblighi, mostra sempre una mano che e CONTENTA di dichiarare (= requisiti non minimi).",
        },
        {
          type: "example",
          content: "Il compagno apre 1♦, l'avversario interviene 1♠:",
          cards: "♠xx ♥AQxxx ♦Qx ♣KJxx",
        },
        {
          type: "text",
          content:
            "Nord potrebbe avere 20 punti, ed e questo il motivo per cui Sud, anche con 5, ha il compito di 'tenere aperto'. Ma ora non serve che lo faccia: l'intervento di Est dara modo comunque a Nord, se ha davvero tanto, di rientrare in dichiarazione. Se Sud fornisce una qualsiasi dichiarazione lo fa quindi 'liberamente'.",
        },
        {
          type: "text",
          content:
            "L'intervento avversario modifica le risposte: a) non e piu 'necessario' parlare con 4-5 punti, quindi con mani nulle si passa; b) i 'senza' non sono piu una risposta d'obbligo, ma proposta di contratto (promettono il fermo nel colore avversario); c) qualunque colore nuovo e almeno quinto; d) si 'aggiungono' il Contro (su un colore) e il Surcontro (sul Contro).",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♦, l'avversario dice 1♠. Avete: ♠Jxx ♥Kx ♦Qxxx ♣Qxxx. Cosa dite?",
          options: ["2♦", "1NT", "Passo", "Contro"],
          correctAnswer: 2,
          explanation:
            "Passo! Senza l'intervento avreste detto 2♦ (5-9 punti con fit). Ma ora non siete piu obbligati a parlare, e con solo 7 punti senza nulla di speciale, lasciate che il compagno decida.",
        },
        {
          type: "true-false",
          content:
            "Dopo un intervento avversario, con 4-5 punti bisogna sempre rispondere?",
          correctAnswer: 1,
          explanation:
            "No! L'intervento avversario toglie l'obbligo di parlare con mani deboli. Se non avete nulla di speciale, passate.",
        },
      ],
    },
    {
      id: "12-2",
      title: "Su intervento di Contro",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Come reagire al Contro avversario",
        },
        {
          type: "text",
          content:
            "Con il Contro l'avversario propone di aggiudicarsi un contratto sulla sua linea; se avete almeno 11 punti, siete certi che il diritto a giocare sia vostro, e altrettanto certi che la vostra linea e in grado di contrare (punitivamente) qualunque contratto alternativo gli altri propongano.",
        },
        {
          type: "rule",
          content:
            "Dopo intervento avversario di Contro: un colore nuovo e NON FORZANTE, e almeno quinto. Surcontro mostra 11+ punti e qualunque tipo di mano.",
        },
        {
          type: "text",
          content:
            "Il Surcontro e l'UNICA dichiarazione forte dopo il Contro avversario; la descrizione si rimanda al giro dopo. Non esclude ne promette fit. Le dichiarazioni alternative sono: un colore nuovo (non forzante, proposta di contratto finale con un buon colore di almeno 5-6 buone carte), tutti gli appoggi (come senza intervento ma in ogni caso meno di 11 punti), e 1NT (7/10, contenti di giocarlo con fermi nei colori impliciti del contrante).",
        },
        {
          type: "example",
          content: "L'avversario dice Contro dopo apertura 1♥ del compagno:",
          cards: "♠Kx ♥Jx ♦AQx ♣KQJ10xx",
        },
        {
          type: "text",
          content:
            "Surcontro (e non 2♣): essendoci il Contro di mezzo, mostrare 2♣ significherebbe una mano inferiore agli 11 punti e chiedereste al compagno di passare.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♥, l'avversario dice Contro. Avete: ♠xx ♥Jx ♦xxx ♣KQ10xxx. Cosa dite?",
          options: ["Surcontro", "2♣", "2♥", "Passo"],
          correctAnswer: 1,
          explanation:
            "2♣: un colore nuovo dopo Contro e non forzante. Mostra che 'sarei contento di giocare 2♣!' con un buon colore di 6 carte. Non avete gli 11 punti per il Surcontro.",
        },
        {
          type: "bid-select",
          content:
            "Il compagno apre 1♥, l'avversario dice Contro. Avete 12 punti. Cosa dite?",
          options: ["2♥", "Surcontro", "2♣", "Passo"],
          correctAnswer: 1,
          explanation:
            "Surcontro! Con 11+ punti dopo Contro avversario, il Surcontro è l'UNICA dichiarazione forte. La descrizione si rimanda al giro dopo.",
        },
      ],
    },
    {
      id: "12-3",
      title: "Su intervento a colore",
      duration: "6",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "Come reagire all'intervento a colore",
        },
        {
          type: "text",
          content:
            "Un intervento a colore dell'avversario crea un vincolo sulla lunghezza dei colori che il compagno dell'apertore vorrebbe descrivere: un colore nuovo infatti implica il possesso di almeno 5 carte.",
        },
        {
          type: "rule",
          content:
            "Dopo intervento avversario a colore: un colore nuovo E' FORZANTE, e almeno quinto. Il Contro cerca i fit 4-4 e chiede all'apertore di dichiarare i colori rimasti.",
        },
        {
          type: "text",
          content:
            "E per trovare i fit 4-4? L'uso del Contro con il significato di 'vorrei giocare nei colori rimanenti' appartiene a chi interviene sull'apertura ma anche, con identico significato, a chi e seduto davanti all'apertore.",
        },
        {
          type: "rule",
          content:
            "Il Contro promette 8+ punti (illimitato!) e mostra 'licita impedita': chiede all'apertore di dichiarare altri colori, o i Senza, se puo.",
        },
        {
          type: "example",
          content: "Apertura 1♦, intervento avversario 1♠:",
          cards: "♠xx ♥AQxxx ♦Qx ♣KJxx",
        },
        {
          type: "text",
          content:
            "2♥: tutto in regola, il colore e quinto e i punti consentono di andare a livello due.",
        },
        {
          type: "example",
          content: "Apertura 1♦, intervento avversario 1♥:",
          cards: "♠xx ♥AQxx ♦Q10xx ♣Qxx",
        },
        {
          type: "text",
          content:
            "Contro: i punti per un colore a livello 2 ci sono, ma e la lunghezza che manca. Invece di dire un colore, chiediamo all'apertore di mostrare altre quarte, se ne ha.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 1♦, l'avversario dice 1♠. Avete: ♠xxx ♥Kxx ♦AQxx ♣KJx. Cosa dite?",
          options: ["2♦", "1NT", "Contro", "2NT"],
          correctAnswer: 0,
          explanation:
            "2♦: gli appoggi rimangono invariati come se l'intervento non ci fosse stato. Avete fit a Quadri e 11 punti: un appoggio invitante. Non servono 5 carte per appoggiare!",
        },
        {
          type: "true-false",
          content:
            "Dopo intervento avversario a colore, un colore nuovo del rispondente è forzante?",
          correctAnswer: 0,
          explanation:
            "Sì! A differenza del caso dopo Contro (dove il colore nuovo è non forzante), dopo intervento a colore il colore nuovo resta FORZANTE.",
        },
      ],
    },
    {
      id: "12-4",
      title: "Il comportamento dell'apertore",
      duration: "5",
      type: "theory",
      xpReward: 50,
      content: [
        {
          type: "heading",
          content: "L'apertore in situazione competitiva",
        },
        {
          type: "text",
          content:
            "Anche l'Apertore, dopo intervento alla sua destra, si puo trovare in una situazione di 'parlata libera'. Se il compagno ha gia risposto e l'intervento avversario gli consente di dire Passo, allora se Nord dichiara lo fa 'liberamente'.",
        },
        {
          type: "rule",
          content:
            "Con tutte le mani 'normali', bilanciate o sbilanciate, l'Apertore Passa. A meno che abbia fit quarto: in tal caso appoggia il compagno, proporzionalmente alla propria forza.",
        },
        {
          type: "text",
          content:
            "L'Apertore ridichiara liberamente solo con mani sbilanciate di Diritto che presentano un'ottima monocolore o una bicolore di almeno 10 carte. O con la bilanciata 18-20, se ha il fermo, dichiara i Senza al minimo livello.",
        },
        {
          type: "example",
          content: "Aprite 1♦, il compagno passa, l'avversario dice 1♥, il compagno dice 1♠. L'avversario alla vostra destra dice 2♥. Avete:",
          cards: "♠Jx ♥Kx ♦AQxxx ♣Qxxx",
        },
        {
          type: "text",
          content:
            "Passo: una bicolore al minimo dei requisiti (di punti e di distribuzione) e una mano 'normale'!",
        },
        {
          type: "example",
          content: "Stessa sequenza, ma avete:",
          cards: "♠x ♥xx ♦AKJxxx ♣AQx",
        },
        {
          type: "text",
          content:
            "2♦: il punteggio e di Diritto, ma ci sono ottimi colori da dire velocemente, prima che le Picche vengano rialzate da Ovest. Un colore ridichiarato spontaneamente e sempre un 'signor colore'.",
        },
        {
          type: "quiz",
          content:
            "Aprite 1♣, il compagno dice 1♥, l'avversario dice 1♠. Avete: ♠AQxx ♥x ♦Qx ♣KQxxxx. Cosa dite?",
          options: ["2♣", "Passo", "1NT", "Contro"],
          correctAnswer: 1,
          explanation:
            "Passo! La mano e 'normale': e una sbilanciata di Diritto, ma non ha un colore eccezionale ne fit per il compagno. La dichiarazione libera di 1♠ rende le Fiori reali e lunghe, visto che la mano deve essere sbilanciata. Ma con carta normale, passate.",
        },
        {
          type: "hand-eval",
          content:
            "Conta i punti della mano: ♠AQ92 ♥K5 ♦J1074 ♣Q83",
          cards: "♠AQ92 ♥K5 ♦J1074 ♣Q83",
          correctValue: 12,
          explanation:
            "A=4, Q=2, K=3, J=1, Q=2. Totale: 12 punti.",
        },
      ],
    },
    {
      id: "12-5",
      title: "Pratica: Smazzate 12",
      duration: "15",
      type: "practice",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Metti in pratica: Sviluppi dopo l'intervento",
        },
        {
          type: "text",
          content:
            "Gioca le smazzate della Lezione 12. In ogni situazione competitiva, valuta se la tua dichiarazione e libera o obbligata, e scegli di conseguenza. Ricorda: se sei libero di passare, mostra solo mani con requisiti non minimi!",
        },
        {
          type: "tip",
          content: "Consiglio del Maestro Fiori",
          explanation:
            "In competizione la parola chiave e 'libero'. Se l'intervento avversario ti da la possibilita di passare, ogni tua dichiarazione mostrera una mano contenta di parlare. Non sentirti obbligato a dichiarare solo perche hai dei punti: valuta se hai davvero qualcosa di speciale da comunicare!",
        },
      ],
    },
  ],
};

// ===== EXPORT =====

export const lessons9to12: Lesson[] = [
  lezione9,
  lezione10,
  lezione11,
  lezione12,
];
