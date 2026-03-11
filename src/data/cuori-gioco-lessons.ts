/**
 * FIGB Bridge LAB - Cuori Gioco Lesson Content Data
 * Extracted from FIGB Corso Cuori Gioco (advanced card play course)
 * World 10: Tecniche Base (lessons 1-4)
 * World 11: Probabilità e Strategia (lessons 5-7)
 * World 12: Gioco Avanzato (lessons 8-10)
 */

import type { Lesson } from "./lessons";

// ===== LESSON 1: La Prima Presa =====

const lezione1CG: Lesson = {
  id: 100,
  worldId: 10,
  title: "La Prima Presa",
  subtitle: "Deduzioni dalla carta di attacco e riflessi immediati",
  icon: "🎯",
  smazzateIds: ["cg-1-1", "cg-1-2", "cg-1-3", "cg-1-4", "cg-1-5", "cg-1-6", "cg-1-7", "cg-1-8"],
  modules: [
    {
      id: "100-1",
      title: "Le regole dell'attacco normale",
      duration: "5",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "La Prima Presa",
        },
        {
          type: "text",
          content:
            "È statisticamente provato che la maggior parte dei contratti si perdono alla prima carta, proprio perché spesso il giocante comincia a pensare quando ormai è tardi. Una pausa di riflessione è indispensabile per riflettere sulla distribuzione e i punti avversari.",
        },
        {
          type: "rule",
          content:
            "Per trarre deduzioni dalla carta di attacco si deve supporre che l'avversario segua regole logiche. È normale: 1) Non attaccare sotto Asso nei contratti a colore. 2) Rispettare gli schemi di attacco con sequenze e cartine. 3) Preferire un colore in cui si abbia AK. 4) Attaccare nel colore dichiarato dal partner.",
        },
        {
          type: "text",
          content:
            "Altre regole importanti: 5) Attaccare nel colore in cui la coppia si è appoggiata. 6) Se nessuno della coppia ha parlato, attaccare nel colore non detto. 7) Non attaccare per fare tagli quando si ha una presa di lunga in atout.",
        },
        {
          type: "tip",
          content: "Pensate sempre alle carte che mancano!",
          explanation:
            "Fate almeno un'ipotesi sulla distribuzione avversaria e controllatela: a volte i conti non tornano, e se ne farà un'altra. Pensare PRIMA di giocare la prima carta è fondamentale.",
        },
        {
          type: "quiz",
          content: "Quale attacco è considerato 'anormale' e sospetto nel gioco a colore?",
          options: [
            "Attacco da AK in un colore",
            "Attacco sotto Asso",
            "Attacco nel colore del partner",
            "Attacco da una sequenza",
          ],
          correctAnswer: 1,
          explanation:
            "Attaccare sotto Asso nei contratti a colore è anormale: se l'avversario lo fa, sospettate un motivo nascosto come la ricerca di un taglio.",
        },
        {
          type: "true-false",
          content: "Quando nessuno della coppia difensiva ha parlato, è normale attaccare nel colore non dichiarato dagli avversari.",
          correctAnswer: 0,
          explanation:
            "Esatto! Se nessuno dei difensori ha dichiarato, si preferisce attaccare nel colore che gli avversari non hanno mostrato, cercando i punti del compagno.",
        },
      ],
    },
    {
      id: "100-2",
      title: "Palestra: cosa giocare dal morto",
      duration: "6",
      type: "exercise",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Esercizi sulla prima presa",
        },
        {
          type: "text",
          content:
            "Gioco a Senza, attacco di 5. La carta che giocate dal morto alla prima presa può determinare l'esito del contratto. Analizziamo le figure più comuni.",
        },
        {
          type: "example",
          content: "Morto ha J3, Mano ha A102. L'avversario attacca con il 5.",
          cards: "J3 + A102",
        },
        {
          type: "text",
          content:
            "Giocate piccola dal morto! Se mettete il J, lo catturano e perdete la chance di fare 2 prese. Stando bassi, il terzo di mano sarà costretto a impegnare un onore.",
        },
        {
          type: "example",
          content: "Morto ha Q2, Mano ha K43. L'avversario attacca con il 5.",
          cards: "Q2 + K43",
        },
        {
          type: "text",
          content:
            "Giocate la Dama dal morto! Se il terzo di mano copre con l'Asso, il vostro Re farà presa dopo. Se non copre, avete vinto una presa gratis.",
        },
        {
          type: "quiz",
          content: "Morto ha K3, Mano ha J54. L'avversario attacca con il 2. Se vi mancano A e Q, cosa giocate dal morto?",
          options: [
            "Il Re, sperando che cada l'Asso",
            "Piccola, stando bassi",
            "Il 3, tanto è indifferente",
            "Dipende solo dalla dichiarazione",
          ],
          correctAnswer: 1,
          explanation:
            "State bassi! Chi attacca può avere la Dama ma è fortemente improbabile che abbia l'Asso. Mettendo il Re perdete sempre. Stando bassi potreste fare il Re in seguito.",
        },
        {
          type: "card-select",
          content: "Morto ha KJ3, Mano ha 874. Sud attacca piccola, Nord vince con K e gioca J♥. Dovete sbloccare per fare 2 prese con l'impasse. Quale carta giocate?",
          cards: "♠A♠10♠5♠3",
          correctCard: "♠A",
          explanation:
            "Sbloccate l'Asso sotto il Re per poi fare l'impasse alla Dama con il 10. Se non sbloccate, resterete bloccati.",
        },
      ],
    },
    {
      id: "100-3",
      title: "Deduzioni dalla prima presa",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Fidatevi delle deduzioni",
        },
        {
          type: "text",
          content:
            "L'andamento della prima presa, e la memoria della dichiarazione, a volte è la chiave di volta per mantenere il contratto. Bisogna fidarsi delle deduzioni logiche.",
        },
        {
          type: "example",
          content: "Est gioca 4♥. Sud attacca A♣, K♣ e fiori tagliata da Nord. Ovest: ♠AJ ♥1063 ♦AQJ104 ♣Q62. Est: ♠Q82 ♥AKQ952 ♦6 ♣J97.",
          cards: "♠AJ ♥1063 ♦AQJ104 ♣Q62",
        },
        {
          type: "text",
          content:
            "La deduzione è chiara: Sud è passato su 1♥ avendo AKxxxx di fiori. Se avesse avuto un Re accanto al colore non sarebbe intervenuto di 2♣? Quindi Nord possiede entrambi i Re al 99%. Niente impasse a picche, ma impasse di taglio al K♦ di Nord.",
        },
        {
          type: "rule",
          content:
            "Sospettate degli attacchi in colori dove avete molte carte e onori: è probabile che l'avversario cerchi un taglio. Se gli avversari si appoggiano un palo e l'attacco è poi diverso, sospettate la ricerca di un taglio!",
        },
        {
          type: "tip",
          content: "Accorgetevi delle carte che l'avversario 'non possiede'",
          explanation:
            "In base alla giocata che fa, potete dedurre le carte mancanti. Ad esempio, se il terzo di mano gioca il J ma non il 9, il 9 deve essere dall'altra parte. Queste deduzioni possono guidare tutto il piano di gioco.",
        },
        {
          type: "quiz",
          content: "In un contratto a colore, l'avversario attacca con una cartina in un seme dove avete AKxxx al morto e xxxxx in mano. Cosa sospettate?",
          options: [
            "Ha una sequenza nel colore",
            "Cerca di affrancare una lunga",
            "Cerca un taglio dal partner",
            "Ha attaccato a caso",
          ],
          correctAnswer: 2,
          explanation:
            "Quando l'avversario attacca in un colore dove avete molte carte e onori, è probabile che cerchi un taglio: il suo partner potrebbe essere corto in quel colore.",
        },
        {
          type: "true-false",
          content: "Se siete certi che un taglio sia in agguato, potete scartare un onore dalla mano per confondere le acque al nemico.",
          correctAnswer: 0,
          explanation:
            "Sì! Se non vi costa prese, potete dare un onore di mano per far credere al difensore che siete voi a essere singoli. È una manovra ingannevole lecita e a volte brillante.",
        },
      ],
    },
  ],
};

// ===== LESSON 2: Fit 5-3 e Fit 4-4 =====

const lezione2CG: Lesson = {
  id: 101,
  worldId: 10,
  title: "Fit 5-3 e Fit 4-4",
  subtitle: "Controllo del colpo, taglio totale e accorciamento",
  icon: "🔄",
  smazzateIds: ["cg-2-1", "cg-2-2", "cg-2-3", "cg-2-4", "cg-2-5", "cg-2-6", "cg-2-7", "cg-2-8"],
  modules: [
    {
      id: "101-1",
      title: "Due modi di giocare ad atout",
      duration: "5",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "Controllo del colpo e Taglio totale",
        },
        {
          type: "text",
          content:
            "Ci sono fondamentalmente due modi di giocare ad atout: a) mantenendo il controllo del colpo (le più frequenti), b) in Taglio totale.",
        },
        {
          type: "rule",
          content:
            "Mantenere il controllo del colpo: piano di gioco che prevede battute di atout postume o preventive, affrancamenti, cessione di prese. Il giocante conserva fino alla fine il potere di controllo grazie alle atout rimaste.",
        },
        {
          type: "text",
          content:
            "Le mani giocate a Taglio totale sono quelle in cui il giocante arraffa più rapidamente che può le prese, incassando le vincenti e sfruttando il maggior numero possibile di atout per i tagli. L'analisi dei semi a lato dell'atout determina il piano di gioco da adottare.",
        },
        {
          type: "tip",
          content: "Due precauzioni per il Taglio totale",
          explanation:
            "a) Incassate le vincenti laterali il prima possibile (dopo ve le taglieranno!). b) Cominciate a tagliare sempre il colore in cui avete più tagli da fare, altrimenti vi ritroverete in difficoltà con gli ingressi.",
        },
        {
          type: "example",
          content: "Est gioca 6♥. Le prese esterne sono 4: 1♠, 2♦, 1♣. Servono 8 prese con le atout tramite tagli incrociati.",
          cards: "♠Q ♥AQ104 ♦AK54 ♣A732",
        },
        {
          type: "quiz",
          content: "In un piano di Taglio totale, in quale ordine si eseguono i tagli?",
          options: [
            "Si taglia a caso, alternando le mani",
            "Si comincia dal colore con più tagli da fare",
            "Si comincia dal colore con meno tagli",
            "Si battono prima le atout e poi si taglia",
          ],
          correctAnswer: 1,
          explanation:
            "Si comincia a tagliare il colore in cui si hanno più tagli da fare, per non restare senza collegamenti (ingressi). I tagli stessi forniscono i collegamenti con l'altra mano!",
        },
      ],
    },
    {
      id: "101-2",
      title: "Il fit 5-3",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Il fit 5-3: il più delicato",
        },
        {
          type: "text",
          content:
            "Il fit 5-3 è il più delicato tra tutti i fit di 8 carte, sia perché dopo le indispensabili tre battute solo una mano avrà conservato potere di taglio sia perché è quello che meno garantisce facili collegamenti mano-morto.",
        },
        {
          type: "rule",
          content:
            "La mano che potrebbe portare allungamento di prese è quasi sempre la corta di atout. Quando la parte corta presenta un colore da affrancare e i collegamenti sono garantiti solo dal colore di atout, bisogna anticipare l'affrancamento alla battuta.",
        },
        {
          type: "example",
          content: "Est gioca 4♠ con attacco atout. La linea di gioco per affrancare le fiori è molto più semplice che tagliare al morto. Ovest: ♠KQ2 ♥65 ♦74 ♣Q98643. Est: ♠AJ875 ♥AK ♦Q863 ♣K2.",
          cards: "♠KQ2 ♥65 ♦74 ♣Q98643",
        },
        {
          type: "text",
          content:
            "Servono ingressi a fianco della lunga: l'attacco va preso in mano, poi K♣. Anche se l'avversario tornasse atout, si prende al morto, si incassa la Q♣, si taglia alto una fiori e si rientra al morto battendo l'ultima atout. Condizione: atout 3-2 e fiori 3-2.",
        },
        {
          type: "quiz",
          content: "Nel fit 5-3, quale mano conviene usare normalmente per i tagli?",
          options: [
            "La mano con 5 atout",
            "La mano con 3 atout (la corta)",
            "È indifferente",
            "La mano con più onori",
          ],
          correctAnswer: 1,
          explanation:
            "La mano corta di atout porta allungamento di prese. La mano lunga (5 atout) deve restare intatta per mantenere il controllo e battere le atout avversarie.",
        },
        {
          type: "true-false",
          content: "Con fit 5-3 bisogna sempre battere tutte le atout prima di affrancare i colori laterali.",
          correctAnswer: 1,
          explanation:
            "Falso! A volte è necessario posporre la battuta delle atout per produrre dei tagli o affrancare un colore laterale. L'ordine dipende dalla mano specifica.",
        },
      ],
    },
    {
      id: "101-3",
      title: "Il pericolo dell'accorciamento",
      duration: "5",
      type: "theory",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "Difendersi dall'accorciamento",
        },
        {
          type: "text",
          content:
            "Se il morto non ha corte, il carico di tagliare pesa tutto sulla mano lunga in atout, e questo accorciamento rischia di far perdere il controllo della situazione, soprattutto se le atout sono mal divise.",
        },
        {
          type: "rule",
          content:
            "Ci si difende dall'accorciamento in due modi: 1) Rifiutando di tagliare (scartando dal morto o dalla mano). 2) Costringendo l'avversario lungo in atout a usare le sue atout per tagliare.",
        },
        {
          type: "example",
          content: "Est gioca 4♥ con fit 7 carte. Prende l'attacco a fiori e la prosecuzione. Se Est taglia, mantiene solo con cuori 3-3 (36%). Se rifiuta di tagliare scartando 2 picche, è in botte di ferro sia con 3-3 che con 4-2.",
          cards: "♠7643 ♥K53 ♦KQ2 ♣763",
        },
        {
          type: "quiz",
          content: "L'avversario vi forza ripetutamente nel vostro colore lungo di atout. Come vi difendete?",
          options: [
            "Tagliate sempre, per non perdere prese",
            "Rifiutate di tagliare, scartando un perdente",
            "Battete subito tutte le atout",
            "Chiedete un cambio di contratto",
          ],
          correctAnswer: 1,
          explanation:
            "Rifiutando di tagliare dalla mano lunga si evita l'accorciamento. Si scarta una carta perdente e si mantiene la lunghezza delle atout per il controllo finale.",
        },
      ],
    },
    {
      id: "101-4",
      title: "Il fit 4-4: il più potente",
      duration: "5",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Il fit 4-4",
        },
        {
          type: "text",
          content:
            "È il più potente dei fit di 8 carte. Non essendoci a priori una mano da usare per i tagli, questa potrà essere scelta dal giocante a seconda delle esigenze. A volte è lo stesso attacco che decide l'impostazione della manovra.",
        },
        {
          type: "rule",
          content:
            "Quando si gioca nella 4-4 l'importante è decidere quale mano affrancare e quale usare per i tagli. L'avventura incerta di un taglio di qua e un taglio di là può diventare pericolosa!",
        },
        {
          type: "example",
          content: "Est gioca 4♠ con attacco K♦. Ovest: ♠AQJ7 ♥52 ♦A875 ♣AK3. Est: ♠K863 ♥9743 ♦2 ♣8752. Avendo 3 quadri pronte da tagliare, Est può fare 4 prese in atout di Ovest + 3 tagli + 2 fiori + 1 quadri = 10.",
          cards: "♠AQJ7 ♥52 ♦A875 ♣AK3",
        },
        {
          type: "quiz",
          content: "Nel fit 4-4, quale è il rischio principale se si taglia da entrambe le mani senza un piano?",
          options: [
            "Si fanno troppe prese",
            "Si perde il controllo: le atout avversarie non vengono mai eliminate",
            "Si regalano prese agli avversari",
            "Non c'è alcun rischio",
          ],
          correctAnswer: 1,
          explanation:
            "Tagliare 'un po' di qua e un po' di là' senza piano può essere pericoloso: si rischia di non avere più abbastanza atout per eliminare quelle avversarie, e la difesa riprenderà il controllo.",
        },
        {
          type: "true-false",
          content: "Il fit 4-4 è più potente del fit 5-3 perché offre flessibilità nella scelta di quale mano usare per i tagli.",
          correctAnswer: 0,
          explanation:
            "Corretto! Nel fit 4-4 si può scegliere liberamente quale mano affrancare e quale usare per i tagli, adattandosi alla situazione specifica della mano.",
        },
      ],
    },
  ],
};

// ===== LESSON 3: Conto e Preferenziali =====

const lezione3CG: Lesson = {
  id: 102,
  worldId: 10,
  title: "Conto e Preferenziali",
  subtitle: "Segnali di controgioco per la difesa",
  icon: "💬",
  smazzateIds: ["cg-3-1", "cg-3-2", "cg-3-3", "cg-3-4", "cg-3-5", "cg-3-6", "cg-3-7", "cg-3-8"],
  modules: [
    {
      id: "102-1",
      title: "Il conto della carta",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Il conto della carta",
        },
        {
          type: "rule",
          content:
            "IL SEGNALE DI CONTROGIOCO È LA RISPOSTA ALLA DOMANDA CHE IL COMPAGNO SI STA FACENDO, O CHE SI STA PER FARE.",
        },
        {
          type: "text",
          content:
            "Il conto della carta è una convenzione per leggere la lunghezza del colore in mano al dichiarante. Un difensore che mostri il conto aiuta il partner a ricostruire con precisione quante carte abbia la mano nascosta.",
        },
        {
          type: "rule",
          content:
            "Carta ALTA poi carta BASSA = numero PARI di carte. Carta BASSA poi carta ALTA = numero DISPARI di carte. In presenza di sequenze, esse prevalgono sul conto.",
        },
        {
          type: "text",
          content:
            "Quando si rigioca in un colore già mosso, si torna in conto delle carte rimaste. Ad esempio: A72 - dopo aver usato l'Asso rigioca il 7 (la più alta delle 2 rimaste). K853 - dopo aver usato il Re rigioca il 3 (la più piccola delle 3 rimaste).",
        },
        {
          type: "quiz",
          content: "Il compagno attacca con il 2♦. Voi avete A843♦. Prendete con l'Asso. Quale carta tornate per mostrare il conto di 3 carte rimaste?",
          options: ["Il 3 (la più piccola)", "L'8 (la più alta)", "Il 4 (intermedia)", "Non importa quale"],
          correctAnswer: 0,
          explanation:
            "Si torna in conto delle carte RIMASTE: con 3 carte rimaste (dispari) si gioca la più piccola. Con 843, la 3 dice 'dispari = mi restano 3 carte'.",
        },
        {
          type: "true-false",
          content: "Il conto va sempre dato, in ogni situazione di controgioco.",
          correctAnswer: 1,
          explanation:
            "Falso! Il conto non va mai dato quando può essere utile solo al giocante, né quando la lunghezza nel colore mosso è già assolutamente conosciuta dalla licita.",
        },
      ],
    },
    {
      id: "102-2",
      title: "Il messaggio preferenziale",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Preferenziali: parlare con le carte",
        },
        {
          type: "text",
          content:
            "Si dicono preferenziali le chiamate indirette: si usa un colore per indicare gradimento di un altro. Si possono usare le carte di un colore per parlare di un altro SOLO dopo che la situazione di quel colore sia già chiarita.",
        },
        {
          type: "rule",
          content:
            "La regola dei messaggi preferenziali: carta ALTA chiama nel più ALTO di rango dei restanti colori. Carta BASSA chiama nel più BASSO di rango dei restanti colori.",
        },
        {
          type: "example",
          content: "Sud gioca 4♠. Ovest attacca A♥, ma il morto ha il singolo. Il terzo di mano gioca il 9♥: non sta chiamando a cuori, ma nel più alto dei colori rimasti (quadri).",
          cards: "♠AQ75 ♥10 ♦KJ54 ♣K1086",
        },
        {
          type: "text",
          content:
            "Quando si offre un taglio, si gioca piccola se si vuole il ritorno nel colore più basso di rango e alta se lo si vuole nel più alto. Quando si mette in presa l'avversario con una carta obbligata, la carta scelta indica l'ingresso per le future prese.",
        },
        {
          type: "rule",
          content:
            "UNA PREFERENZA ALTA È INEQUIVOCABILE. UNA PREFERENZA BASSA È DUBBIA: o chiama nel colore basso o non chiama niente. Di certo non chiama nel colore alto.",
        },
        {
          type: "quiz",
          content: "Il vostro compagno sta per tagliarvi una quadri. Volete che dopo il taglio ritorni a Fiori (il colore più basso). Quale quadri giocate per il taglio?",
          options: [
            "La quadri più alta possibile",
            "La quadri più bassa possibile",
            "È indifferente",
            "Il 10 di quadri",
          ],
          correctAnswer: 1,
          explanation:
            "Una carta bassa chiama nel colore più basso di rango tra quelli restanti. Se volete il ritorno a Fiori (basso) giocate la carta più piccola.",
        },
      ],
    },
    {
      id: "102-3",
      title: "Scarto e preferenza in pratica",
      duration: "5",
      type: "exercise",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Segnalare con gli scarti",
        },
        {
          type: "text",
          content:
            "Quando si scarta in un colore che è inutile tenere, l'ordine scelto per le carte scartate indica valori nei colori laterali. Scartando dall'alto si attira l'attenzione verso il colore più alto di rango dei restanti.",
        },
        {
          type: "example",
          content: "Sud gioca 4♠ dopo che EstOvest si sono appoggiati fino a 4♥. L'attacco è A♥, Sud taglia e batte atout. Est scarta le cuori dall'alto (10 poi 9): segnala valori nel colore più alto dei restanti (quadri).",
          cards: "♠3 ♥K10982 ♦AKJ ♣J974",
        },
        {
          type: "quiz",
          content: "Siete Est e dovete scartare su un giro di atout. Avete valori a Fiori (il colore più basso). Come scartate le vostre cuori inutili?",
          options: [
            "Dall'alto: 10, poi 9, poi 8",
            "Dal basso: 2, poi 8",
            "È indifferente",
            "Scartate una fiori per mostrare il colore",
          ],
          correctAnswer: 1,
          explanation:
            "Scartando dal basso si indica interesse nel colore più basso di rango dei restanti. Per chiamare a Fiori, scartate le cuori dal basso.",
        },
        {
          type: "true-false",
          content: "Le chiamate preferenziali sono frequenti quando si risponde su un colore mosso dal partner.",
          correctAnswer: 1,
          explanation:
            "Falso! Le chiamate preferenziali sono rarissime quando si risponde su un colore mosso dal partner: in queste situazioni prevale il messaggio di gradimento o rifiuto di quel colore.",
        },
      ],
    },
  ],
};

// ===== LESSON 4: Difesa - Colori da Muovere con Urgenza =====

const lezione4CG: Lesson = {
  id: 103,
  worldId: 10,
  title: "I Colori da Muovere in Difesa",
  subtitle: "Tempi, controllo e attacco aggressivo vs. neutro",
  icon: "⚡",
  smazzateIds: ["cg-4-1", "cg-4-2", "cg-4-3", "cg-4-4", "cg-4-5", "cg-4-6", "cg-4-7", "cg-4-8"],
  modules: [
    {
      id: "103-1",
      title: "Tempi e Controllo in difesa",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Difesa: colori da muovere con urgenza",
        },
        {
          type: "text",
          content:
            "Lo stile del combattimento viene scelto già con l'attacco: un attacco aggressivo è di chi vuole incassare rapidamente; un attacco neutro è di chi mantiene alta la guardia. Capire quale sia il comportamento giusto dipende molto dalla dichiarazione.",
        },
        {
          type: "rule",
          content:
            "Il problema principale dei difensori è ANTICIPARE URGENTEMENTE i colori in cui possono affrancare prese, prima che il giocante tagli le perdenti o le scarti su vincenti in altri colori.",
        },
        {
          type: "example",
          content: "Sud gioca 4♠ con attacco piccola Fiori. Est prende e deve muovere cuori SUBITO, prima che Sud scarti la perdente di cuori sulle quadri affrancate del morto.",
          cards: "♠QJ64 ♥A6 ♦KQ864 ♣65",
        },
        {
          type: "text",
          content:
            "Prima di muovere un colore in cui compare al morto una figura a rischio, il difensore dovrà chiedersi: a) è veramente indispensabile giocare subito quel colore? b) quali carte si deve sperare di trovare nel compagno? c) qual è la carta giusta da muovere?",
        },
        {
          type: "quiz",
          content: "Il morto ha KQ864♦ e il giocante ha dichiarato con forza. Perché è urgente muovere un altro colore prima?",
          options: [
            "Per confondere il giocante",
            "Per togliere gli ingressi al morto",
            "Per affrancare prese prima che il giocante scarti le perdenti sulle quadri",
            "Non è urgente, si può aspettare",
          ],
          correctAnswer: 2,
          explanation:
            "Quando il morto ha un lungo colore affrancabile, il giocante potrebbe scartare le sue perdenti su quelle vincenti. Bisogna affrancare le proprie prese PRIMA che questo accada!",
        },
      ],
    },
    {
      id: "103-2",
      title: "Immaginare le figure",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Immaginare le figure del compagno",
        },
        {
          type: "text",
          content:
            "Immaginare le figure è un'operazione faticosa ma fondamentale. Bisogna ipotizzare le possibili carte in mano al partner e scegliere l'uscita corretta.",
        },
        {
          type: "example",
          content: "Vedete al morto K86. Supponete che Est abbia l'Asso. Se il J è in Sud con AJxx, partire con la Q è fondamentale. Se il J è in Est con A9xx e Sud ha Jxx, non bisogna muoversi!",
          cards: "Q104 + K86",
        },
        {
          type: "rule",
          content:
            "Notate come acquistano valore i 10, i 9 e gli 8 in queste figure. La scelta della carta giusta da muovere può fare la differenza tra regalare una presa e affrancarne due.",
        },
        {
          type: "text",
          content:
            "Quando muovete 'sotto Asso' a smazzata iniziata è un rischio che si può correre, purché si abbia la certezza che il giocante non abbia il K secco. Quel che c'è al morto si vede! Non abbiate timore a segnalare al partner quel poco che avete.",
        },
        {
          type: "quiz",
          content: "Vedete al morto KJ del colore. Avete Q104 e ipotizzate l'Asso nel compagno. Come muovete?",
          options: [
            "La Q, per costringere il morto a coprire",
            "Il 4, la più piccola",
            "Il 10, per non perdere la Dama",
            "La Q o il 10, sono indifferenti",
          ],
          correctAnswer: 3,
          explanation:
            "Con Q104 contro KJ al morto e Asso al compagno, Q e 10 sono indifferenti. Ma NON il 4: se partite con il 4 il compagno con AJxx resterebbe in presa col J lasciandovi la Q tagliata.",
        },
        {
          type: "true-false",
          content: "In un torneo a duplicato è giustificato fare giocate rischiose per battere il contratto, anche a costo di regalare prese in più.",
          correctAnswer: 0,
          explanation:
            "Sì! In duplicato la cosa più importante è battere il contratto: le prese in più non hanno grosso peso. In Mitchell invece bisogna stare attenti a non regalare prese.",
        },
      ],
    },
    {
      id: "103-3",
      title: "Contare e ragionare in difesa",
      duration: "5",
      type: "exercise",
      xpReward: 60,
      content: [
        {
          type: "heading",
          content: "Contare le carte del giocante",
        },
        {
          type: "text",
          content:
            "I segnali difensivi forniscono aiuti preziosi, ma la fatica di contare e immaginare le carte dovete farla voi. Ricostruire la distribuzione del giocante è fondamentale per scegliere il momento giusto per muovere un colore.",
        },
        {
          type: "example",
          content: "Siete Ovest. Attaccate A♠, Est rifiuta con il 4. Sud ha 6 picche e 0 cuori, quindi 7 carte tra fiori e quadri. Non devono far paura le fiori del morto: anche se Sud scarta, gli rimangono comunque 2 quadri. Non è urgente muovere quadri!",
          cards: "♠A103 ♥98732 ♦Q104 ♣86",
        },
        {
          type: "quiz",
          content: "Il giocante ha 6 atout e 0 cuori. Ha quindi 7 carte tra fiori e quadri. Il morto ha 5 fiori. Dovete muovere quadri subito?",
          options: [
            "Sì, è sempre urgente",
            "No, sulle fiori il giocante non può scartare abbastanza quadri per eliminare il problema",
            "Dipende solo dai punti",
            "Sì, perché il morto ha 5 fiori",
          ],
          correctAnswer: 1,
          explanation:
            "Qualunque sia la distribuzione (3♦+4♣ o 4♦+3♣), il giocante non riesce a eliminare tutte le quadri sulle fiori. Lasciamolo muovere da solo: andremo meglio!",
        },
      ],
    },
  ],
};

// ===== LESSON 5: Le Giocate di Sicurezza =====

const lezione5CG: Lesson = {
  id: 104,
  worldId: 11,
  title: "I Giochi di Sicurezza",
  subtitle: "Rinunciare a una presa per non perderne due",
  icon: "🛡️",
  smazzateIds: ["cg-5-1", "cg-5-2", "cg-5-3", "cg-5-4", "cg-5-5", "cg-5-6", "cg-5-7", "cg-5-8"],
  modules: [
    {
      id: "104-1",
      title: "Il concetto di sicurezza",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Le giocate di sicurezza",
        },
        {
          type: "text",
          content:
            "Quando si dice 'gioco di sicurezza' s'intende la volontaria rinuncia a una presa per evitare di perderne due qualora il colore fosse distribuito in modo pessimo.",
        },
        {
          type: "rule",
          content:
            "Il concetto di sicurezza entra in azione quando il contratto ha enormi probabilità di riuscita e, non essendo interessati alle prese in più, tutta l'attenzione si concentra nel cautelarsi da quelle rare disposizioni di carte che potrebbero generare difficoltà.",
        },
        {
          type: "example",
          content: "6NT. L'unico colore nevralgico è quadri (K92 + AJ765) dove basta fare 4 prese. Si inizia battendo l'Asso (l'onore alto che accompagna il Fante) poi si muove piccola verso K9, inserendo il 9 se Sud gioca piccola.",
          cards: "♦K92 + ♦AJ765",
        },
        {
          type: "text",
          content:
            "In questo modo ci si cautela dalla Q10xx in una mano sola. Se il 9 viene catturato, i difensori hanno una sola carta di quadri e cadrà sotto il Re. Se Q10xx è nel giocatore dopo di noi, lo vedremo alla seconda presa e faremo l'expasse.",
        },
        {
          type: "quiz",
          content: "Avete K92♦ al morto e AJ765♦ in mano. Dovete fare 4 prese su 5 in quadri. Qual è la giocata di sicurezza?",
          options: [
            "Re e piccola al Fante (impasse normale)",
            "Asso e poi piccola verso K9, inserendo il 9",
            "Asso e Re sperando nella caduta della Q",
            "Piccola al J (impasse al volo)",
          ],
          correctAnswer: 1,
          explanation:
            "Si batte l'Asso (l'onore vicino al J) e si muove verso K9. Se Sud ha Q10xx il 9 farà presa. Se Est ha Q10xx lo si scoprirà e si vincerà col Re per l'expasse. La giocata normale (K e piccola al J) perde 2 prese con Q10xx in Sud.",
        },
      ],
    },
    {
      id: "104-2",
      title: "Figure di sicurezza comuni",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Le figure da conoscere",
        },
        {
          type: "text",
          content:
            "Con 9 carte in linea mancanti solo del J, basta incassare per primo un onore dalla parte dove ce ne sono due, conservando una forchetta in entrambe le mani. Constatata la 4/0 si potrà catturare il J dovunque sia.",
        },
        {
          type: "rule",
          content:
            "Se mancano J e 10 con 8 carte (KQ962 + A753): non si deve sguarnire la forza dei due onori raggruppati. Bisogna incassare l'onore isolato (Asso). Se J e 10 sono quarti a sinistra, li cattureremo grazie alla forchetta KQ9.",
        },
        {
          type: "example",
          content: "8 carte mancanti di Q e 10 con J isolato (AKxxx + Jx): si gioca subito piccola verso il J. Si batte un onore e se non si possono perdere prese si incassa anche l'altro sperando nella Q seconda.",
          cards: "♥AKxxx + ♥Jx",
        },
        {
          type: "text",
          content:
            "Con AQxx e xxxx: poiché si dovrà perdere in ogni caso una presa anche se il Re è in impasse, non costa nulla incassare l'Asso e poi tornare in mano per giocare piccola verso la Dama. Se il Re è secco in Est, chi ha fatto l'impasse perde poi 2 prese in più.",
        },
        {
          type: "quiz",
          content: "Avete 7 carte (KJ52 + A43) mancanti di Q e 10. In sicurezza come giocate?",
          options: [
            "Asso e piccola al Fante (impasse)",
            "K e poi Asso, e poi piccola verso il Fante",
            "Fante per primo",
            "Asso, Re e poi piccola",
          ],
          correctAnswer: 1,
          explanation:
            "In sicurezza: K e poi Asso, poi piccola verso il Fante. Questa giocata guadagna rispetto all'impasse normale nel caso in cui la Q sia seconda dopo il J: chi fa l'impasse resta a 2 prese, chi gioca in sicurezza ne fa 3.",
        },
        {
          type: "true-false",
          content: "Molte giocate di sicurezza distruggono volontariamente la forchetta (incassando l'onore alto) e trasformano un impasse in un expasse.",
          correctAnswer: 0,
          explanation:
            "Esatto! È una caratteristica comune: si rinuncia all'impasse diretto per creare un expasse che protegge da distribuzioni sfavorevoli.",
        },
      ],
    },
    {
      id: "104-3",
      title: "Piani di gioco in sicurezza",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Sicurezza nella linea di gioco",
        },
        {
          type: "text",
          content:
            "Il concetto di sicurezza non si applica solo alla manovra di uno specifico colore: sovente è la linea generale di gioco ad essere improntata a questo concetto.",
        },
        {
          type: "example",
          content: "3NT. La protezione: se le fiori corrono ci sono 10 prese ma se Nord ha il J quarto, preso a fiori tornerà a cuori. Sicurezza: incassare Q♣ e poi ♣ al 10. Se prende Sud, il K♥ resta protetto.",
          cards: "♠K83 ♥62 ♦K62 ♣AQ953",
        },
        {
          type: "text",
          content:
            "L'eliminazione di sicurezza: in 6♠ con attacco ambiguo di 10♥, invece di rischiare impasse, si può: A♥, battere atout, incassare le 3 fiori, poi giocare Q♥. Chiunque prenda dovrà giocare il taglio e scarto o regalare l'impasse a quadri. 12 prese garantite!",
        },
        {
          type: "quiz",
          content: "In un torneo a squadre giocate un 6NT sicuro. Vale la pena rischiare per la tredicesima presa?",
          options: [
            "Sì, ogni presa in più conta",
            "No, a squadre mantenere il contratto è tutto: la presa in più vale pochissimo",
            "Dipende dal punteggio",
            "Sì, per il morale della coppia",
          ],
          correctAnswer: 1,
          explanation:
            "A squadre il concetto di sicurezza è fondamentale: perdere uno slam per cercare una presa in più è un disastro. In Mitchell a coppie invece la presa in più conta per il confronto.",
        },
      ],
    },
  ],
};

// ===== LESSON 6: Probabilità e Percentuali =====

const lezione6CG: Lesson = {
  id: 105,
  worldId: 11,
  title: "Probabilità e Percentuali",
  subtitle: "Tabelle, scelte e calcolo delle chance",
  icon: "📊",
  smazzateIds: ["cg-6-1", "cg-6-2", "cg-6-3", "cg-6-4", "cg-6-5", "cg-6-6", "cg-6-7", "cg-6-8"],
  modules: [
    {
      id: "105-1",
      title: "La tabella delle divisioni",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Probabilità e Percentuali",
        },
        {
          type: "text",
          content:
            "Quando si affronta una mano che offre due o più possibili linee di gioco, è matematicamente accertabile quale sia la migliore, in base alle percentuali statistiche relative alla divisione dei colori e alla posizione degli onori avversari.",
        },
        {
          type: "rule",
          content:
            "Quando manca un numero PARI di carte la divisione più probabile non è mai quella più equilibrata! 6 carte mancanti: 4-2 (48%) batte 3-3 (36%). 4 carte mancanti: 3-1 (50%) batte 2-2 (40%).",
        },
        {
          type: "text",
          content:
            "Tabella delle divisioni: 7 mancanti: 4-3 (62%), 5-2 (31%). 6 mancanti: 4-2 (48%), 3-3 (36%), 5-1 (15%). 5 mancanti: 3-2 (68%), 4-1 (28%), 5-0 (4%). 4 mancanti: 3-1 (50%), 2-2 (40%), 4-0 (10%). 3 mancanti: 2-1 (78%), 3-0 (22%). 2 mancanti: 1-1 (52%), 2-0 (48%).",
        },
        {
          type: "quiz",
          content: "Vi mancano 6 carte in un colore. Qual è la divisione più probabile?",
          options: ["3-3 (pari)", "4-2", "5-1", "2-4 e 3-3 sono uguali"],
          correctAnswer: 1,
          explanation:
            "Con 6 carte mancanti la 4-2 è più probabile (48%) della 3-3 (36%). Ricordate: con un numero pari di carte mancanti la divisione più probabile non è mai quella equilibrata!",
        },
        {
          type: "true-false",
          content: "Con 5 carte mancanti, la divisione 3-2 ha probabilità del 68%.",
          correctAnswer: 0,
          explanation:
            "Corretto! Con un numero dispari di carte mancanti la divisione più equilibrata È la più probabile: 3-2 = 68%.",
        },
      ],
    },
    {
      id: "105-2",
      title: "Impasse vs. divisione favorevole",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Scegliere la linea migliore",
        },
        {
          type: "text",
          content:
            "La domanda fondamentale: la nona presa verrà dall'impasse a quadri (50%) o dalle cuori 3-3 (36%)? La risposta è nei numeri: puntiamo sull'impasse!",
        },
        {
          type: "example",
          content: "3NT in Est. 4♠, 3♥, 1♦ sicure. La nona presa: impasse a ♦ (50%) o ♥ divise 3-3 (36%). Scartate la cartina di ♥ e fate l'impasse al K♦.",
          cards: "♠AQJ ♥654 ♦A943 ♣762",
        },
        {
          type: "rule",
          content:
            "Quando le chance sono SUCCESSIVE (non alternative), si sommano. Provate prima la chance che non preclude l'altra! L'esito negativo di un affrancamento non impedisce di provare poi un impasse.",
        },
        {
          type: "text",
          content:
            "Esempio: in 6NT la dodicesima presa può venire dalle quadri 3-2 (68%) o dall'impasse a cuori (50%). Si provano prima le quadri: se non vanno si prova l'impasse. Probabilità totale: 68% + (50% di 32%) = 68 + 16 = 84%!",
        },
        {
          type: "quiz",
          content: "Lo slam dipende da 2 impasse indipendenti: basta che almeno uno riesca. Qual è la probabilità di riuscita?",
          options: ["50%", "75%", "100%", "25%"],
          correctAnswer: 1,
          explanation:
            "Il primo impasse riesce il 50% delle volte. Del restante 50% in cui fallisce, il secondo riesce metà delle volte (+25%). Totale: 50% + 25% = 75%. Se servono ENTRAMBI: 50% x 50% = 25%.",
        },
        {
          type: "true-false",
          content: "Con 7 carte in linea (A3 + KQ1062) mancanti del J, battere in testa (52%) è leggermente meglio dell'impasse (50%).",
          correctAnswer: 0,
          explanation:
            "Esatto! La battuta funziona con 3-3 (36%) più le volte che J è nel doubleton su 4-2 (16%). Totale 52%, meglio del 50% dell'impasse. Ma se il 10 è accanto all'Asso (A10 + KQ632), l'impasse torna a essere preferibile.",
        },
      ],
    },
    {
      id: "105-3",
      title: "Esercizi sulle percentuali",
      duration: "5",
      type: "exercise",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Applicare le percentuali",
        },
        {
          type: "quiz",
          content: "Con 10 carte in linea (A7654 + QJ1098) mancanti del K: battete l'Asso o fate l'impasse?",
          options: [
            "Battere l'Asso: il Re secco cade il 13% delle volte",
            "Impasse: il 50% batte nettamente il 13%",
            "Sono uguali",
            "Non importa, il K caderà comunque",
          ],
          correctAnswer: 1,
          explanation:
            "Il Re secco dietro l'asso vale solo il 13% (un terzo del 39% di singolo a destra). L'impasse vale 50%. Con 10 carte è giusto fare l'impasse!",
        },
        {
          type: "quiz",
          content: "Se le vostre possibilità sono: quadri 3-2 (68%) E POI, come seconda chance, impasse a cuori (50%), qual è la percentuale combinata?",
          options: ["68%", "84%", "50%", "118%"],
          correctAnswer: 1,
          explanation:
            "68% (quadri buone) + 50% del restante 32% (quando le quadri sono cattive ma l'impasse riesce) = 68% + 16% = 84%. Le chance successive si sommano correttamente così!",
        },
        {
          type: "hand-eval",
          content: "In un colore mancano 4 carte. Quante volte su 100 saranno divise 2-2?",
          cards: "♠AKJ10 ♦9876",
          correctValue: 40,
          explanation:
            "Con 4 carte mancanti: 3-1 = 50%, 2-2 = 40%, 4-0 = 10%. La divisione pari NON è la più probabile!",
        },
      ],
    },
  ],
};

// ===== LESSON 7: Coprire o Non Coprire =====

const lezione7CG: Lesson = {
  id: 106,
  worldId: 11,
  title: "Coprire o Non Coprire",
  subtitle: "Quando giocare gli onori in seconda di mano",
  icon: "👁️",
  smazzateIds: ["cg-7-1", "cg-7-2", "cg-7-3", "cg-7-4", "cg-7-5", "cg-7-6", "cg-7-7", "cg-7-8"],
  modules: [
    {
      id: "106-1",
      title: "Piccola su piccola. Sempre?",
      duration: "6",
      type: "theory",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Piccola su piccola: le regole base",
        },
        {
          type: "text",
          content:
            "Normalmente il difensore, se non ha sequenze solide, deve giocare piccola quando il nemico parte di piccola, e trattenersi da pericolose tentazioni.",
        },
        {
          type: "rule",
          content:
            "a) Non buttate mai via onori secondi o terzi 'perché intanto sono in impasse': date relax all'avversario e le vie del Signore sono infinite. b) Evitate di giocare una intermedia altina per far impegnare un onore: potreste perdere una presa naturale.",
        },
        {
          type: "example",
          content: "Morto ha Q74, voi K93 e Est A1052. Se mettete il 9 su piccola di Sud, la Q sarà catturata dall'Asso ma poi Sud farà l'impasse al 10! Giocando piccola avreste fatto 3 prese.",
          cards: "Q74 / K93 / A1052",
        },
        {
          type: "text",
          content:
            "L'eccezione: quando avete una sequenza abbastanza solida da non rimetterci una presa, inserite la più alta della sequenza. Il morto muove il 4 verso la mano e voi avete QJ108: mettete la Q. Il compagno capirà che possedete tutte le inferiori.",
        },
        {
          type: "quiz",
          content: "Morto ha AQ1062, voi K7 in seconda di mano. Sud gioca il 3 verso il morto. Giocate il Re?",
          options: [
            "Sì, per prendere la presa",
            "No! Tenetevelo: Sud potrebbe decidere di battere l'Asso e il Re resterebbe vincente",
            "Sì, sempre onore su piccola con il Re",
            "Dipende da quante carte ha Sud",
          ],
          correctAnswer: 1,
          explanation:
            "Tenetevi il Re! Sud potrebbe avere 10-11 carte e decidere di battere l'Asso. O anche con Jx giocare piccola al 10. Se mettete il Re, non sbaglierà mai!",
        },
      ],
    },
    {
      id: "106-2",
      title: "Onore su onore: quando coprire",
      duration: "7",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Si copre per affrancare!",
        },
        {
          type: "rule",
          content:
            "SI COPRE L'ONORE AVVERSARIO SOLO SE C'È LA VEROSIMILE SPERANZA DI AFFRANCARE UNA CARTA INFERIORE A SE STESSI O AL PARTNER.",
        },
        {
          type: "example",
          content: "Morto AK64, voi Q983, Sud gioca il J: coprite! 9 e 8 vi garantiscono la quarta presa. Con A84, voi K103 e Sud Q: coprite, il 10 resterà vincente nella schiena del J di Sud.",
          cards: "AK64 / Q983",
        },
        {
          type: "text",
          content:
            "QUANDO IL MORTO HA UN ONORE SOLO, COPRITELO SUBITO. QUANDO IL MORTO HA DUE ONORI, NON COPRITE MAI IL PRIMO. COPRITE IL SECONDO! Esempio: morto QJ4, non coprite la Q ma coprite il J se viene regiocato.",
        },
        {
          type: "quiz",
          content: "Il morto ha QJ4 e voi K76. Il giocante parte di Q dal morto. Coprite?",
          options: [
            "Sì, sempre onore su onore",
            "No! Non coprite il primo onore quando ce ne sono due. Coprite il secondo (il J)",
            "Sì, il Re deve catturare la Dama",
            "No, mai coprire",
          ],
          correctAnswer: 1,
          explanation:
            "Con due onori al morto, non coprite mai il primo! Se coprite la Q, condannate l'eventuale 10 del compagno. Non coprendo, il colore va in 'stallo'. Coprirete il J se viene regiocato.",
        },
        {
          type: "true-false",
          content: "Se il morto ha l'Asso secondo (A4) e Sud gioca la Q, è corretto coprire con il K terzo.",
          correctAnswer: 1,
          explanation:
            "Falso! Vedendo l'Asso SECONDO al morto, è una follia mettere il K terzo: non mettendolo il Re farà presa sempre comunque, perché l'Asso è troppo corto per catturarlo.",
        },
      ],
    },
    {
      id: "106-3",
      title: "Secondo di mano: prendere o no?",
      duration: "5",
      type: "exercise",
      xpReward: 65,
      content: [
        {
          type: "heading",
          content: "Piccola verso il morto: prendere o stare bassi?",
        },
        {
          type: "text",
          content:
            "Non esiste regola fissa: si valuta caso per caso con riferimento alla dichiarazione. Si prende se la presa è quella del down, o se il giocante è quasi certamente singolo. Ma a volte lisciando si complica la vita al giocante.",
        },
        {
          type: "example",
          content: "Morto KJ52, voi A3, Sud gioca cartina: giocate PICCOLA. Lasciate che faccia il suo impasse. Se la Q è in Sud, potrete sempre incassare l'Asso dopo.",
          cards: "KJ52 / A3",
        },
        {
          type: "quiz",
          content: "Morto ha Q107, voi K53 in seconda di mano. Il giocante muove il 4 verso il morto. Cosa fate?",
          options: [
            "Mettete il Re per prendere subito",
            "Giocate piccola: se mettete il Re risolvete i problemi al giocante e non potrà più sbagliare",
            "Mettete il 5 per segnalare",
            "Mettete il 3 per il conto",
          ],
          correctAnswer: 1,
          explanation:
            "Se Sud ha l'Asso, dovrà indovinare se passare la Q o il 10. Mettendo il K gli risolvete i problemi! Stesso ragionamento con l'Asso: non catturate un onore del morto a vuoto.",
        },
      ],
    },
  ],
};

// ===== LESSON 8: I Giochi di Eliminazione =====

const lezione8CG: Lesson = {
  id: 107,
  worldId: 12,
  title: "I Giochi di Eliminazione",
  subtitle: "Messa in mano, taglio e scarto, figure delicate",
  icon: "✂️",
  smazzateIds: ["cg-8-1", "cg-8-2", "cg-8-3", "cg-8-4", "cg-8-5", "cg-8-6", "cg-8-7", "cg-8-8"],
  modules: [
    {
      id: "107-1",
      title: "Il taglio e scarto",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "I Giochi di Eliminazione",
        },
        {
          type: "text",
          content:
            "I giochi di eliminazione consistono nel manovrare in modo tale da mettere in presa un avversario dopo che gli sia stata tolta ogni possibilità di uscita se non a favore del giocante.",
        },
        {
          type: "rule",
          content:
            "Due situazioni in cui un difensore è costretto a regalare una presa: 1) Gli unici colori rimasti offrono un TAGLIO E SCARTO. 2) L'alternativa è uscire in un colore dove regala l'impasse o toglie il problema di indovinare la figura.",
        },
        {
          type: "example",
          content: "Atout picche eliminate. Ovest: ♠865 ♥- ♦AJ2 ♣-. Est: ♠43 ♥- ♦K1073 ♣-. Il difensore in presa deve uscire a cuori (taglio e scarto), fiori (taglio e scarto) o quadri (regala la presa nel colore).",
          cards: "♠865 ♦AJ2 + ♠43 ♦K1073",
        },
        {
          type: "text",
          content:
            "Attenzione: quando ricevete il regalo di un taglio e scarto, prima individuate la carta che volete SCARTARE, e di conseguenza tagliate dall'altra mano. Se sbagliate mano non avrete risolto niente!",
        },
        {
          type: "rule",
          content:
            "PRIMA DI GIOCARE ANCORA IN UN COLORE CHE IL MORTO HA ESAURITO, È BENE ESSER CERTI CHE LA MANO NASCOSTA NE ABBIA ANCORA ALMENO UNA. Il conto della carta è lo strumento per saperlo.",
        },
        {
          type: "quiz",
          content: "Dopo l'eliminazione, il difensore in presa ha solo cuori (taglio e scarto) e quadri (dove avete AJ + K10). Cosa farete?",
          options: [
            "Sperare che giochi cuori per il taglio e scarto",
            "Non importa: qualunque cosa giochi vi favorisce! Cuori = taglio e scarto, quadri = presa regalata",
            "Dovete ancora indovinare la posizione della Dama",
            "Dipende dalla dichiarazione",
          ],
          correctAnswer: 1,
          explanation:
            "Questo è il bello dell'eliminazione! L'avversario è 'inchiodato': qualunque uscita vi favorisce. Se gioca cuori scartate la perdente, se gioca quadri vi regala la presa.",
        },
      ],
    },
    {
      id: "107-2",
      title: "Le figure 'delicate'",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Figure che beneficiano dell'uscita avversaria",
        },
        {
          type: "text",
          content:
            "Per individuare le mani adatte all'eliminazione, bisogna conoscere le figure di colori con cui il giocante guadagna una presa se un difensore muove per primo.",
        },
        {
          type: "example",
          content: "A103 + J63: Se muove Sud o Nord, difficile fare 2 prese. Se muove Est, Sud cattura un onore con l'A e fa un'altra presa con J e 10. Se muove Ovest, Sud sta basso e ripete l'impasse.",
          cards: "A103 + J63",
        },
        {
          type: "text",
          content:
            "Altre figure favorevoli: AJ3 + K102 (la Q è regalata se muove l'avversario); K103 + Q92 (si perde 1 presa invece di 2); J53 + Q62 (una presa assicurata invece del 50%); Q5 + A4 (la presa è certa se muove chi ha il K); 543 + AJ10 (il doppio impasse diventa 100%).",
        },
        {
          type: "rule",
          content:
            "BISOGNA PRIMA TOGLIERE ALL'AVVERSARIO OGNI POSSIBILITÀ DI USCITA NEUTRA: a) togliergli dalla mano tutte le carte di uscita libera; b) eliminare dalla mano e dal morto più colori possibile per creare il taglio e scarto.",
        },
        {
          type: "quiz",
          content: "Per preparare un'eliminazione in 4♠, dovete: battere atout, tagliare l'ultima cuori del morto, incassare A e K di fiori e cedere la terza. Perché tagliare la cuori PRIMA?",
          options: [
            "Per fare una presa in più",
            "Per eliminare l'uscita neutra del difensore: se non togliete le cuori, potrà uscire di cuori senza regalare niente",
            "Per contare i punti avversari",
            "Non serve tagliare la cuori",
          ],
          correctAnswer: 1,
          explanation:
            "Se non eliminate le cuori del morto, il difensore in presa a fiori potrebbe uscire tranquillamente a cuori senza regalare niente. Togliendogli questa uscita, sarà costretto a giocare quadri o a dare il taglio e scarto!",
        },
      ],
    },
    {
      id: "107-3",
      title: "Eliminazione in pratica",
      duration: "7",
      type: "exercise",
      xpReward: 75,
      content: [
        {
          type: "heading",
          content: "Smazzate di eliminazione",
        },
        {
          type: "example",
          content: "Sud gioca 4♠, attacco J♣. Rischia 3 perdenti a quadri e 1 a cuori. Battute le atout, incassa le due fiori vincenti scartando una cuori, poi A♥ e Q♥: i difensori dovranno fare taglio e scarto o muovere quadri.",
          cards: "♠109xx ♥AQx ♦Jxxx ♣Kx",
        },
        {
          type: "text",
          content:
            "L'eliminazione funziona anche a Senza! Ovviamente non c'è il taglio e scarto, ma si può costringere il difensore a uscire in un colore favorevole dopo avergli tolto tutte le alternative.",
        },
        {
          type: "example",
          content: "3NT: 8 prese sicure. Dopo A♦ e 9♦ per Ovest, le sue 3 quadri buone, è costretto a uscire a cuori o picche, regalando la nona presa. Ma prima bisogna togliergli le fiori incassandole tutte!",
          cards: "♠xxx ♥AJ9 ♦xxx ♣AQxx",
        },
        {
          type: "quiz",
          content: "Il taglio e scarto NON costituisce regalo quando:",
          options: [
            "Il giocante ha esaurito le atout in una delle due mani",
            "Il giocante non ha più perdenti nei colori laterali",
            "Il giocante scarta ma resta con troppe carte nel colore problematico",
            "Tutte le precedenti",
          ],
          correctAnswer: 3,
          explanation:
            "Tutte e tre! Il taglio e scarto non è un regalo se: le atout sono finite, non ci sono perdenti da scartare, o se il giocante scarta ma gli restano comunque troppe carte del colore problematico.",
        },
      ],
    },
  ],
};

// ===== LESSON 9: Giocare Come Se =====

const lezione9CG: Lesson = {
  id: 108,
  worldId: 12,
  title: "Giocare Come Se",
  subtitle: "Ipotesi necessarie e condizioni ineluttabili",
  icon: "🧭",
  smazzateIds: ["cg-9-1", "cg-9-2", "cg-9-3", "cg-9-4", "cg-9-5", "cg-9-6", "cg-9-7", "cg-9-8"],
  modules: [
    {
      id: "108-1",
      title: "Scartare le situazioni perdenti",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Giocare Come Se",
        },
        {
          type: "text",
          content:
            "I singoli passaggi di un ragionamento non sono quasi mai difficili, però a volte sono tanti. La cosa essenziale è non perdere il filo. In prima istanza non prendete in considerazione distribuzioni molto improbabili.",
        },
        {
          type: "rule",
          content:
            "SE INDIVIDUIAMO UNA SITUAZIONE CHE SIA INELUTTABILMENTE PERDENTE DOBBIAMO SCARTARLA E NON PREOCCUPARCENE. Giocare 'come se' significa dare per scontata l'unica distribuzione che rende possibile il contratto.",
        },
        {
          type: "example",
          content: "7NT in Est. Solo 10 prese fuori da picche. DEVE andare bene il doppio impasse a picche (K e J in Sud). È solo il 25%? Meglio di niente. Se Nord ha un onore, si va sotto e basta. Ovest: ♠AQ10 ♥J109 ♦AKQJ ♣Q72. Est: ♠9843 ♥AKQ ♦652 ♣AKJ.",
          cards: "♠AQ10 ♥J109 ♦AKQJ ♣Q72",
        },
        {
          type: "text",
          content:
            "Un altro esempio: Est gioca 6♠ con attacco A e K di cuori. Non c'è alcuna possibilità di fare il contratto se le picche non sono 3-3. Quindi le picche SONO 3-3: la giocata dura un attimo.",
        },
        {
          type: "quiz",
          content: "Giocate 6♠ e il contratto è impossibile se l'avversario ha AQ6 di atout. Che fate?",
          options: [
            "Cercate di indovinare dove sono le carte",
            "Giocate come se fossero tutte nello stesso avversario dove il contratto è fattibile",
            "Vi arrendete",
            "Battete tutte le atout di testa",
          ],
          correctAnswer: 1,
          explanation:
            "Se una distribuzione è ineluttabilmente perdente, scartatela e giocate come se le carte fossero nella posizione che rende possibile il contratto. È l'unica chance!",
        },
      ],
    },
    {
      id: "108-2",
      title: "La catena di ragionamenti",
      duration: "7",
      type: "theory",
      xpReward: 75,
      content: [
        {
          type: "heading",
          content: "Condizioni necessarie e catene logiche",
        },
        {
          type: "text",
          content:
            "Porre dei punti fermi è indispensabile per poterne mettere altri, fino a individuare il giusto percorso. Se una condizione è necessaria, datela per scontata e procedete con le conseguenze.",
        },
        {
          type: "example",
          content: "Est gioca 6♥ con attacco 6♣. Non bisogna fare l'impasse a fiori! Visto che l'Asso di picche dovrà per forza essere ceduto, non ci si può permettere di perdere una presa in atout. L'impasse alla Q♥ DEVE riuscire. Quindi: A♣, A♥ e cuori al Fante.",
          cards: "♠K4 ♥A875 ♦AJ1053 ♣AQ",
        },
        {
          type: "text",
          content:
            "La paura del down è una pessima consigliera: rimandando il problema spesso si perde la possibilità di risolverlo. Se l'impasse a fiori DEVE riuscire e deve essere fatto due volte, fatelo subito prima di incassare le quadri, o non tornerete più al morto!",
        },
        {
          type: "rule",
          content:
            "Per folle che sia l'ipotesi vincente che avete formulato, se non ne esistono altre non avete di meglio che seguirla passo a passo. Qualche volta sarete premiati: tutte le atout e le fiori nello stesso avversario è possibile!",
        },
        {
          type: "quiz",
          content: "In 6♣ l'A♣ mostra che Nord ha tutte le atout (3-0). Dovete scartare la cuori sulla picche del morto. Questo richiede che Sud risponda 4 volte a picche. Come giocate?",
          options: [
            "Impasse a picche subito",
            "A e K di picche, e se il J non cade... picche al 10! Si gioca come se Sud avesse J quarto",
            "Incassate le vincenti e sperate",
            "A e K di picche e poi stop",
          ],
          correctAnswer: 1,
          explanation:
            "Poiché dovete assolutamente scartare la cuori, Sud DEVE rispondere 4 volte a picche. Giocate come se avesse il J quarto: A, K e poi picche al 10 se il J non è caduto.",
        },
      ],
    },
    {
      id: "108-3",
      title: "Ipotesi sulla distribuzione",
      duration: "6",
      type: "exercise",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Quando la distribuzione è la chiave",
        },
        {
          type: "text",
          content:
            "Molte delle ipotesi necessarie sono basate sulla distribuzione. Quando dovete scartare 2 picche sulle vincenti rosse del morto con atout cattive (4-1), dovete scegliere da quale colore rosso cominciare.",
        },
        {
          type: "example",
          content: "In 6♣ con atout 4-1 (Nord scarta), dovete incassare vincenti rosse senza che Sud tagli. Da dove cominciate? Dalle cuori! Sud DEVE avere almeno 3♥, altrimenti il piano non funziona. Se scoprite che ne ha 4, incasserete anche la quarta prima delle quadri.",
          cards: "♠96 ♥AQ94 ♦AQ7 ♣AK52",
        },
        {
          type: "quiz",
          content: "Sud ha distribuzione ignota. Dovete incassare 3♥ e 3♦ senza che tagli. Sud ha 2♦ o 3♦, e 3♥ o 4♥. Da quale colore cominciate?",
          options: [
            "Dalle quadri, perché ne ho meno",
            "Dalle cuori: se Sud ha 3♥ e 3♦ è uguale, ma se ha 4♥ e 2♦ solo iniziando dalle cuori funziona",
            "È indifferente",
            "Dall'istinto del momento",
          ],
          correctAnswer: 1,
          explanation:
            "Se le divisioni sono uguali (3+3) è indifferente. Ma se Sud ha 4♥ e 2♦ DOVETE cominciare dalle cuori, altrimenti vi taglia un giro di cuori. Cominciare dalle cuori copre entrambi i casi!",
        },
        {
          type: "true-false",
          content: "La paura del down è spesso una buona consigliera, perché vi fa rimandare le giocate rischiose.",
          correctAnswer: 1,
          explanation:
            "Falso! La paura del down è una PESSIMA consigliera. Rimandando il problema spesso si perde la possibilità di risolverlo. Affrontate subito le condizioni necessarie!",
        },
      ],
    },
  ],
};

// ===== LESSON 10: Le Deduzioni del Giocante =====

const lezione10CG: Lesson = {
  id: 109,
  worldId: 12,
  title: "Le Deduzioni del Giocante",
  subtitle: "Leggere l'attacco, la licita e il controgioco",
  icon: "🔍",
  smazzateIds: ["cg-10-1", "cg-10-2", "cg-10-3", "cg-10-4", "cg-10-5", "cg-10-6", "cg-10-7", "cg-10-8"],
  modules: [
    {
      id: "109-1",
      title: "Deduzioni dall'attacco",
      duration: "6",
      type: "theory",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Deduzioni dall'attacco",
        },
        {
          type: "text",
          content:
            "L'attacco è l'unica mossa che la difesa fa alla cieca, senza vedere il morto. Per questo motivo i giocatori scelgono l'attacco senza fare invenzioni: più sono bravi, più si attengono a logiche universali.",
        },
        {
          type: "example",
          content: "In Sud giocate 4♠. Ovest attacca Q♦. L'attacco fa dedurre che Ovest non ha AK♥: un pezzo è certamente in Est (probabilmente il K). Con il K♥, Est non può avere nient'altro: le due Donne sono in Ovest. Impasse a picche su Ovest e AK fiori in testa: 11 prese.",
          cards: "♠AJ6 ♥J74 ♦1087 ♣A652",
        },
        {
          type: "rule",
          content:
            "A Senza: attacco sofferto = non ha buona quinta. Non attacca l'ovvio = max 3 carte con figura imbarazzante (AQx, KJ10). Attacco neutro nel vostro colore = non aveva alternative migliori.",
        },
        {
          type: "text",
          content:
            "Ad atout: attacco di cartina = non ha sequenze (AK, KQ, QJ) né singoli. Se si appoggiano un colore ma attaccano in un altro = singolo o AQ nel colore fittato. Attacco sotto J = in ogni altro seme ha figura problematica.",
        },
        {
          type: "quiz",
          content: "Ovest attacca Q♦ contro il vostro 4♠. Con KQ♥ avrebbe preferito quell'attacco. Cosa deducete?",
          options: [
            "Ha entrambi i Re",
            "Non ha AK di cuori, e il K♥ è probabilmente in Est",
            "Ha 5 carte di quadri",
            "Non si può dedurre nulla",
          ],
          correctAnswer: 1,
          explanation:
            "Con AK di cuori Ovest avrebbe preferito quell'attacco. Attaccando Q♦ rivela che non ha la combinazione AK a cuori. Il K♥ è probabilmente in Est, e questo indirizza tutto il piano di gioco.",
        },
        {
          type: "true-false",
          content: "Se l'attacco arriva da un probabile singolo nel gioco ad atout, è improbabile che l'attaccante abbia una buona figura di atout (Qxx, Jxxx).",
          correctAnswer: 0,
          explanation:
            "Esatto! Chi cerca un taglio non ha di solito una buona figura di atout, perché taglierebbe perdendo una presa naturale. L'attacco da singolo suggerisce mano corta in atout.",
        },
      ],
    },
    {
      id: "109-2",
      title: "Deduzioni dalla licita e dal controgioco",
      duration: "7",
      type: "theory",
      xpReward: 75,
      content: [
        {
          type: "heading",
          content: "Deduzioni dalla licita",
        },
        {
          type: "rule",
          content:
            "Prima, ovvia e importante deduzione: l'avversario che passa al suo turno NON HA L'APERTURA! Se ha già mostrato 2 Assi, non può avere anche una Dama: avrebbe aperto.",
        },
        {
          type: "example",
          content: "Est passa e poi mostra 2 Assi (A♠ e A♥). Dovete indovinare chi ha Q♣: non può essere Est! Con 2 Assi + Q avrebbe aperto. Impasse a fiori su Ovest.",
          cards: "♠4 ♥J854 ♦KJ964 ♣AJ9",
        },
        {
          type: "text",
          content:
            "Le informazioni ricavate dal comportamento avversario dipendono soprattutto da quello che NON fa e NON dice. Anche i PASSO sono fonte di deduzioni: se Ovest non interviene con AKxxxx♦ e non ha aggiunto nulla alla dichiarazione, non può avere una Dama in aggiunta.",
        },
        {
          type: "text",
          content:
            "Se il tipo di apertura avversaria vi consente di capire la distribuzione, approfittatene! Ad esempio: Est apre 1♣ e in gioco vedete il doubleton di fiori. Il solo caso in cui si apre di 1♣ in 2 carte è la 4-4-3-2. Quindi Est ha 4 picche, 4 cuori, 3 quadri e 2 fiori!",
        },
        {
          type: "quiz",
          content: "Ovest è passato di mano e poi ha attaccato AKQ di fiori. Il K♠ vi manca. Può avere AKQ♣ + K♠?",
          options: [
            "Sì, perché ha attaccato con forza",
            "No! Con 12+ punti avrebbe aperto. Giocate per il K♠ secco dietro l'Asso",
            "Forse, dipende dalla vulnerabilità",
            "Sì, potrebbe aver passato per tattica",
          ],
          correctAnswer: 1,
          explanation:
            "Ovest è passato: non ha 12 punti. AKQ♣ = 9 punti. Se avesse anche K♠ sarebbero 12 e avrebbe aperto. Il K♠ NON è in Ovest: giocate A♠ sperando nel Re secco in Est.",
        },
      ],
    },
    {
      id: "109-3",
      title: "Leggere il comportamento dei difensori",
      duration: "6",
      type: "exercise",
      xpReward: 70,
      content: [
        {
          type: "heading",
          content: "Deduzioni dal comportamento",
        },
        {
          type: "text",
          content:
            "Il compito dei difensori è non bloccare il proprio colore. A seconda di come si comportano potete capire come sia diviso il colore e adeguare la vostra linea di gioco.",
        },
        {
          type: "example",
          content: "3NT. L'attacco è J♠, su cui Est invita. Deducete che Est ha la Q♠ terza: con Q seconda avrebbe sbloccato. Picche 4-3, cedete 2 quadri per le 9 prese senza avventure a cuori o fiori.",
          cards: "♠864 ♥J73 ♦A9532 ♣64",
        },
        {
          type: "rule",
          content:
            "In generale, se state giocando un parziale con 18-22 punti in linea e l'avversario è sempre passato: i punti sono divisi, se mancano 8 carte in un maggiore il colore è probabilmente 4-4, e l'avversario con mani molto bilanciate abbandona la competizione presto.",
        },
        {
          type: "quiz",
          content: "L'attacco è J♠ e il terzo di mano mette la Q♠. Supponete che normalmente si sblocchi la Q seconda. Cosa deducete?",
          options: [
            "Est ha la Q secca",
            "Est ha la Q terza (o quarta con J10x di Ovest)",
            "Ovest ha la Q",
            "Non si può dedurre nulla",
          ],
          correctAnswer: 1,
          explanation:
            "Un giocatore normalmente costituito sblocca la Q seconda sull'attacco di J. Se la Q 'non scende' al primo giro, Est ha Q terza o quarta. Con picche 4-3, potete cedere 2 quadri per le 9 prese senza rischi.",
        },
        {
          type: "true-false",
          content: "Un Maggiore dichiarato in risposta (come 2♣ su 1♦) chiede una descrizione generica dell'apertura, non fit specifico in quel seme.",
          correctAnswer: 1,
          explanation:
            "Falso! Un MINORE chiede una descrizione generica. Un MAGGIORE chiede di SÉ: cioè chiede se c'è fit in quel seme specifico. Ricordate: Maggiore chiede di sé, minore chiede descrizione!",
        },
      ],
    },
    {
      id: "109-4",
      title: "Quiz finale: deduzioni integrate",
      duration: "5",
      type: "quiz",
      xpReward: 80,
      content: [
        {
          type: "heading",
          content: "Mettere tutto insieme",
        },
        {
          type: "quiz",
          content: "4♠ di Sud. Ovest attacca da cartina. Cosa potete dedurre sugli altri colori di Ovest?",
          options: [
            "Ha sequenze solide negli altri colori",
            "Non ha sequenze (AK, KQ, QJ) né singoli negli altri colori",
            "Ha un colore lunghissimo",
            "Ha molti punti",
          ],
          correctAnswer: 1,
          explanation:
            "Un attacco di cartina nel gioco ad atout indica che l'attaccante non aveva alternative migliori: né sequenze di 2+ onori, né singoli promettenti negli altri colori.",
        },
        {
          type: "quiz",
          content: "L'avversario gioca consapevolmente in taglio e scarto. Cosa vi aspettate sulla sua lunghezza in atout?",
          options: [
            "Ha esattamente 2 atout",
            "È molto corto o molto lungo in atout: sta cercando di accorciarvi per salvare una presa",
            "Ha 3 atout esatte",
            "Non ha atout",
          ],
          correctAnswer: 1,
          explanation:
            "Se l'avversario gioca deliberatamente il taglio e scarto, è o molto corto (non ha prese di atout da proteggere) o molto lungo (cerca di farvi tagliare dalla parte corta per accorciarvi e salvare la sua lunga di atout).",
        },
        {
          type: "quiz",
          content: "Ricevete l'attacco nel colore dichiarato da Est, ma Ovest non attacca nel colore in cui si sono appoggiati. Cosa sospettate?",
          options: [
            "Ovest ha dimenticato la licita",
            "Ovest ha un singolo nel colore di attacco, o AQ nel colore fittato",
            "Est ha bluffato",
            "Nulla di particolare",
          ],
          correctAnswer: 1,
          explanation:
            "Se Ovest non attacca nel colore appoggiato, è perché ha un singolo altrove (un doubleton non giustificherebbe rinunciare al colore fittato) oppure ha AQ nel colore dell'appoggio e preferisce non muoverlo.",
        },
      ],
    },
  ],
};

// ===== WORLDS & EXPORT =====

import type { World } from "./lessons";

export const cuoriGiocoWorlds: World[] = [
  {
    id: 10,
    name: "Tecniche Base",
    subtitle: "Deduzioni, conteggio e manovre fondamentali",
    icon: "🎯",
    gradient: "from-red-500 to-rose-500",
    iconBg: "bg-red-100",
    lessons: [
      { ...({} as any) }, // placeholder, replaced below
    ] as any,
  },
  {
    id: 11,
    name: "Probabilità e Strategia",
    subtitle: "Percentuali, squeeze e colpi avanzati",
    icon: "🧠",
    gradient: "from-rose-500 to-pink-500",
    iconBg: "bg-rose-100",
    lessons: [] as any,
  },
  {
    id: 12,
    name: "Gioco Avanzato",
    subtitle: "Eliminazioni, conteggio e gioco in difesa",
    icon: "🏆",
    gradient: "from-pink-500 to-red-700",
    iconBg: "bg-pink-100",
    lessons: [] as any,
  },
];

// Assign lessons to worlds
cuoriGiocoWorlds[0].lessons = [lezione1CG, lezione2CG, lezione3CG, lezione4CG];
cuoriGiocoWorlds[1].lessons = [lezione5CG, lezione6CG, lezione7CG];
cuoriGiocoWorlds[2].lessons = [lezione8CG, lezione9CG, lezione10CG];

export const cuoriGiocoLessons: Lesson[] = cuoriGiocoWorlds.flatMap(w => w.lessons);
