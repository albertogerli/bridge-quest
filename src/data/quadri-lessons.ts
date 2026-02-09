/**
 * BridgeQuest - Quadri Course Lesson Content Data
 * Extracted from FIGB Corso Quadri 2022 official course material
 * "Bridge: Approfondimenti" - Second level course
 */

// ============================================================
// Type Definitions
// ============================================================

export interface QuadriContentBlock {
  type: "text" | "example" | "rule" | "tip" | "quiz";
  content: string;
  cards?: string;
  quizType?:
    | "multiple-choice"
    | "true-false"
    | "card-select"
    | "hand-eval"
    | "bid-select";
  options?: string[];
  correctAnswer?: string | number;
  correctValue?: number;
  explanation?: string;
}

export interface QuadriModule {
  id: string;
  title: string;
  icon: string;
  xp: number;
  content: QuadriContentBlock[];
}

export interface QuadriLesson {
  id: number;
  title: string;
  icon: string;
  description: string;
  modules: QuadriModule[];
  smazzateIds: string[];
}

export interface QuadriWorld {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  gradient: string;
  lessons: QuadriLesson[];
}

// ============================================================
// WORLD 1: GIOCO DELLA CARTA
// Lessons 1, 3, 5 - NT play, trump play, card combinations
// ============================================================

const lezione1: QuadriLesson = {
  id: 1,
  title: "Tempi e comunicazioni nel gioco a Senza",
  icon: "🕐",
  description:
    "Il gioco a SA e una corsa: impara a valutare tempi, ingressi e l'avversario pericoloso.",
  smazzateIds: ["Q1-1", "Q1-2", "Q1-3", "Q1-4"],
  modules: [
    {
      id: "Q1-1",
      title: "Valutare i tempi",
      icon: "⏱️",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Nel gioco a Senza la domanda fondamentale e: 'Posso affrancare le prese che mi servono, prima che gli avversari ne affranchino abbastanza nei loro colori per battere il mio contratto?'",
        },
        {
          type: "rule",
          content:
            "I TEMPI sono essenziali: il gioco a Senza e una corsa. Serve una scelta immediata, a favore dei colori che possono, da soli, produrre tutte le prese che servono.",
        },
        {
          type: "text",
          content:
            "Se due o tre colori presentano potenziali affrancabili, non fate un inventario di magazzino. Individuate immediatamente la sorgente di prese: scegliete quella che, da sola, vi basta.",
        },
        {
          type: "example",
          content:
            "Est gioca 3NT, attacco 5♠. Vincenti: 2♠ e 4♦. Ci sono 3 affrancabili nel colore di cuori e 4 nel colore di fiori, ma e rimasto un solo fermo a Picche. Si devono scegliere le Cuori che si affrancano in un tempo solo, e non le Fiori che richiedono due tempi.",
          cards: "♠63 ♥KJ105 ♦AQ75 ♣J83 | ♠AK ♥Q6 ♦KJ6 ♣Q109762",
        },
        {
          type: "rule",
          content:
            "Quando muoviamo un colore fatto di carte equivalenti (KQJ...QJ10...) le prese che cediamo all'avversario ERANO GIA SUE IN PARTENZA. Quando invece facciamo un impasse, o cediamo una presa per affrancarne di lunga, stiamo DANDO all'avversario prese che non aveva ancora a disposizione.",
        },
        {
          type: "quiz",
          content:
            "A Senza Atout, quando e meglio affrancareun colore con carte equivalenti (es. KQJ) rispetto a un colore che richiede un impasse?",
          quizType: "multiple-choice",
          options: [
            "Sempre: le carte equivalenti sono migliori",
            "Quando non si hanno abbastanza tempi per l'impasse",
            "Mai: l'impasse e sempre preferibile",
            "Solo quando si hanno 9+ carte nel colore",
          ],
          correctAnswer: 1,
          explanation:
            "Le carte equivalenti NON danno prese extra all'avversario, mentre un impasse o un affrancamento di lunga cedono tempi. Quando il tempo stringe, preferite i colori 'solidi'.",
        },
      ],
    },
    {
      id: "Q1-2",
      title: "Valutare gli ingressi",
      icon: "🚪",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Se la mano presenta un colore affrancabile in tempo utile, che puo dare da solo le prese che servono, tutto deve essere finalizzato all'affrancamento di quel colore. Potendo vincere l'attacco in mano o al morto, scegliete in base al modo migliore di manovrare il colore da affrancare.",
        },
        {
          type: "rule",
          content:
            "Assicuratevi che il colore sia raggiungibile, una volta affrancato, con i necessari ingressi. Le prese 'oltre che per incassare' vanno usate anche per consumo dei colori in cui c'e da lavorare.",
        },
        {
          type: "example",
          content:
            "Est gioca 3NT, attacco a Cuori. Per prima cosa si dovra dedicare alle Quadri (ha 5 vincenti), e le quadri forniranno 4 o 5 prese a seconda che riesca o meno l'impasse, muovendo dal morto verso la mano.",
          cards: "♠AQ7 ♥K84 ♦875 ♣8763 | ♠86 ♥A32 ♦AQJ106 ♣AK4",
        },
        {
          type: "tip",
          content:
            "Di solito se si fronteggiano mani di pari punteggio il collegamento e facile. Se c'e sproporzione di forze, abbiate cura di utilizzare in modo razionale i pochi ingressi della mano povera.",
        },
        {
          type: "quiz",
          content:
            "Se hai un colore di 7 carte tra mano e morto, con quale percentuale troverai la divisione 3/3 tra gli avversari?",
          quizType: "multiple-choice",
          options: ["48%", "36%", "50%", "68%"],
          correctAnswer: 1,
          explanation:
            "Con un colore di 7 carte, la 3/3 avversaria si trova nel 36% dei casi. La 4/2 e il 48%. Siate ottimisti se la probabilita di incassare l'intera lunghezza e altamente probabile.",
        },
      ],
    },
    {
      id: "Q1-3",
      title: "L'avversario pericoloso",
      icon: "⚠️",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "A volte l'attacco non ci lascia completamente sguarniti, ma con un fermo di posizione: un onore che 'sopravvive' solo se non va in presa un preciso difensore. Si parla di 'avversario pericoloso' o 'fianco pericoloso': quello che non deve entrare in presa.",
        },
        {
          type: "rule",
          content:
            "L'avversario pericoloso e 'quello che non deve entrare in presa', e molte volte non coincide con quello lungo nel colore di attacco. Ragionate sempre su chi potrebbe fare danno al vostro contratto.",
        },
        {
          type: "example",
          content:
            "Est gioca 3NT, attacco Cuori su cui Nord gioca il Fante. Se l'impasse a quadri fallisce, Nord in presa gioca Cuori: mortale. Se invece l'impasse a Fiori fallisce, Sud prende col Re di Cuori senza poter continuare. Dunque scegliete Fiori!",
          cards: "♠Q74 ♥KQ4 ♦AJ1097 ♣Q103 | ♠AK2 ♥Q8 ♦Q8 ♣AJ985",
        },
        {
          type: "quiz",
          content:
            "A 3NT, dopo un attacco nel vostro colore debole, quale difensore e l'avversario pericoloso?",
          quizType: "multiple-choice",
          options: [
            "Sempre quello alla vostra sinistra",
            "Sempre quello alla vostra destra",
            "Quello che puo continuare nel colore di attacco",
            "Quello con piu punti",
          ],
          correctAnswer: 2,
          explanation:
            "L'avversario pericoloso e quello che, se entra in presa, puo continuare a giocare il colore d'attacco e battere il contratto. Ogni volta che va in presa l'avversario, lavora a suo favore.",
        },
      ],
    },
    {
      id: "Q1-4",
      title: "Lisciare l'attacco",
      icon: "🎯",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "A volte la soluzione per evitare che la difesa incassi la lunga e lisciare l'attacco per tagliare i collegamenti tra i difensori.",
        },
        {
          type: "example",
          content:
            "Est gioca 3NT, attacco cuori su Nord con il Re. Il colore da affrancare, Fiori, prevede un impasse. Se Est vince l'attacco e lascia girare la Q♣, manterranno il contratto se l'impasse riesce. Ma rifiutando di prendere al primo e al secondo giro di Cuori, ha buone speranze di mantenere il contratto anche con le cuori divise 5-3 o 6-2.",
          cards: "♠974 ♥72 ♦AK7 ♣AJ1063 | ♠AK32 ♥A94 ♦985 ♣Q92",
        },
        {
          type: "rule",
          content:
            "Lisciare (hold-up) significa rifiutare di incassare una vincente nel colore di attacco, per esaurire le carte di quel colore nella mano dell'avversario non pericoloso, tagliando i collegamenti difensivi.",
        },
        {
          type: "tip",
          content:
            "Lisciare diventa inutile se il colore da affrancare rischia comunque di mettere in presa chi e lungo nel colore di attacco. Ricordate: come e ragionevole pensare, la lunga sia in mano a chi ha attaccato.",
        },
        {
          type: "quiz",
          content:
            "Giochi 3NT. L'attacco e nel colore di cuori. Hai Ax in mano. Quando conviene lisciare?",
          quizType: "true-false",
          correctAnswer: "true",
          explanation:
            "Con Ax, lisciando al primo giro si esauriscono le cuori del difensore non lungo. Quando il partner dell'attaccante entrera in presa non potra piu giocare cuori. E la tecnica del 'hold-up'.",
        },
      ],
    },
  ],
};

const lezione3: QuadriLesson = {
  id: 3,
  title: "Contratti ad atout: tempo e controllo",
  icon: "🃏",
  description:
    "Impara le tecniche fondamentali nel gioco con atout: scarti, tagli e il metodo Base-Satellite.",
  smazzateIds: ["Q3-1", "Q3-2", "Q3-3", "Q3-4"],
  modules: [
    {
      id: "Q3-1",
      title: "Il piano di gioco ad atout",
      icon: "📋",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Il tempo di gioco e l'opportunita di ogni coppia di muovere un colore nel proprio interesse. I Controlli sono i 'fermi' che ogni linea possiede per impedire l'affrancamento di prese nei colori avversari.",
        },
        {
          type: "rule",
          content:
            "Quando il piano di gioco prevede di cedere una presa, chiedetevi SEMPRE cosa fara l'avversario. L'equilibrio di Tempi e Controlli determina l'impostazione del piano di gioco.",
        },
        {
          type: "text",
          content:
            "Il controllo in un seme si puo avere o con carte alte o con le atout, ma per tagliare e necessario che la lunghezza in quel seme venga azzerata. Ottenere il controllo di taglio in un colore richiede, come mossa assai frequente, lo scarto di alcune carte vincenti in altri colori della mano di fronte.",
        },
        {
          type: "quiz",
          content:
            "In un contratto ad atout, quando si deve cedere una presa e importante...",
          quizType: "multiple-choice",
          options: [
            "Battere subito tutte le atout",
            "Chiedersi cosa fara l'avversario in presa",
            "Giocare sempre il colore piu lungo",
            "Passare subito al morto",
          ],
          correctAnswer: 1,
          explanation:
            "Prima di cedere la presa, valutate cosa l'avversario fara con il tempo guadagnato. Potrebbe affrancare un colore laterale, tagliare, o battere atout.",
        },
      ],
    },
    {
      id: "Q3-2",
      title: "Scartare su vincenti laterali",
      icon: "🔄",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "L'urgenza di disfarsi di carte perdenti e il tema principale dei contratti ad atout. Ci sono due modi per disfarsi delle carte spettanti avversari: scartandole su vincenti (o affrancabili) extra della mano di fronte, oppure tagliandole.",
        },
        {
          type: "rule",
          content:
            "Quando il tempo stringe, queste mosse vanno fatte PRIMA di battere atout. Se aspettate a battere atout, potreste cedere una presa nel momento sbagliato.",
        },
        {
          type: "example",
          content:
            "Est gioca 6♠, attacco Q♦. Se si precipita a muovere atout, dovendo cedere la presa d'Asso, andra inevitabilmente sotto al ritorno di quadri. Ovest deve procurarsi un controllo (taglio) nel colore di quadri, scartando subito la terza cuori del morto: KQ di ♥, fiori al Fante e A♥ scartando quadri. Ora si batte atout.",
          cards: "♠KQ75 ♥A97 ♦863 ♣J84 | ♠J10984 ♥KQ ♦A7 ♣AKQ7",
        },
        {
          type: "quiz",
          content:
            "In un contratto a colore, quando bisogna scartare le perdenti su vincenti laterali prima di battere atout?",
          quizType: "true-false",
          correctAnswer: "true",
          explanation:
            "Quando il tempo stringe e gli avversari potrebbero incassare un colore se ottengono la presa durante la battuta delle atout, bisogna prima eliminare le perdenti.",
        },
      ],
    },
    {
      id: "Q3-3",
      title: "Tagliare dalla parte corta",
      icon: "✂️",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Quando il conto di vincenti e affrancabili non porta a un numero sufficiente di prese, la sola risorsa sono i tagli. Si possono guadagnare prese supplementari tagliando dalla parte corta in atout.",
        },
        {
          type: "rule",
          content:
            "METODO PER CONTARE LE PRESE NEL GIOCO IN ATOUT: Se una mano contiene piu atout dell'altra, e considerata la mano BASE, l'altra il SATELLITE. Si contano le prese di atout della Base e si aggiungono quelle certe o possibili che possono essere reperite nel Satellite (tagli).",
        },
        {
          type: "tip",
          content:
            "Le prese disponibili nel Satellite devono essere raggiungibili. Altrimenti Base e Satellite si scollegano! Attenzione ai controlli e ai rientri.",
        },
        {
          type: "example",
          content:
            "Est gioca 4♠, attacco K♦. Solo 3 prese a lato delle atout, nessun affrancamento possibile. Le atout devono fornire 7 prese: 4 di una mano + 3 tagli dall'altra. A♦ e quadri taglio, fiori al morto e quadri taglio, fiori e quadri taglio con il K di atout.",
          cards: "♠AQJ10 ♥J5 ♦A872 ♣AK7 | ♠K986 ♥9743 ♦4 ♣8653",
        },
        {
          type: "quiz",
          content:
            "Qual e la 'parte corta' in un fit 5-3 di atout?",
          quizType: "multiple-choice",
          options: [
            "La mano con 5 atout",
            "La mano con 3 atout",
            "Dipende dagli onori",
            "Non esiste parte corta",
          ],
          correctAnswer: 1,
          explanation:
            "La mano con meno atout e il Satellite (parte corta). I tagli dal Satellite aggiungono prese extra, mentre quelli dalla Base no (sono gia contate).",
        },
      ],
    },
    {
      id: "Q3-4",
      title: "Il metodo Base-Satellite",
      icon: "🛰️",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Con il fit 4-4, entrambe le mani possono fare da Base o Satellite. Questo tipo di fit e il piu potente che esista. Non essendoci a priori una mano base, questa potra essere scelta dal giocante a seconda delle esigenze.",
        },
        {
          type: "rule",
          content:
            "La mano BASE e quella destinata prima o poi a battere atout. La mano SATELLITE usa le sue atout per effettuare i tagli. Questa distinzione e fondamentale nel piano di gioco.",
        },
        {
          type: "tip",
          content:
            "Attenzione a non sovrapporre due piani di gioco: se l'unico colore in cui si comunica con una lunga del morto e quello di atout, la parte corta non va accorciata con i tagli!",
        },
        {
          type: "quiz",
          content:
            "Si definiscono 'atout legittime' della difesa...",
          quizType: "multiple-choice",
          options: [
            "Tutte le atout degli avversari",
            "Solo le atout che possono tagliare",
            "Quelle che comunque presa la faranno",
            "Quelle giocate nel primo giro",
          ],
          correctAnswer: 2,
          explanation:
            "Le atout legittime della difesa sono quelle che comunque farebbero presa, indipendentemente da quando vengono giocate. Le prese di taglio in piu sono 'illegittime' perche vengono guadagnate extra.",
        },
      ],
    },
  ],
};

const lezione5: QuadriLesson = {
  id: 5,
  title: "I colori bucati: come muovere le figure",
  icon: "🎭",
  description:
    "Impasse, expasse, colpo di sonda e la regola aurea: come gestire i colori con forchette.",
  smazzateIds: ["Q5-1", "Q5-2", "Q5-3", "Q5-4"],
  modules: [
    {
      id: "Q5-1",
      title: "Il principio fondamentale",
      icon: "📐",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Quando si affronta un colore bucato (che contiene una forchetta), si deve tener presente un principio universale: 'chi comincia perde'. Nell'economia della presa, ogni giocatore marca a uomo l'avversario che lo precede.",
        },
        {
          type: "rule",
          content:
            "SE ENTRAMBE LE LINEE HANNO INTERESSE AD AFFRANCARE PRESE IN UN COLORE, LA LINEA CHE SI MUOVE PER PRIMA E QUASI SEMPRE SVANTAGGIATA.",
        },
        {
          type: "example",
          content:
            "Disposizione Q74 in Nord, K95 in Ovest, A106 in Est, J83 in Sud. Se Sud inizia col 3, Ovest sta basso; il suo K deve prendersi cura del J di Sud, mentre l'Asso di Est si occupera della Q di Nord. Se il colore viene mosso da Est o Ovest: una presa per NS.",
        },
        {
          type: "text",
          content:
            "Fare ipotesi sulla posizione degli onori mancanti e fondamentale. Quando affrontiamo una figura di carte dobbiamo sempre chiederci quale sia la configurazione per noi vincente.",
        },
        {
          type: "quiz",
          content:
            "Con AQ54 in Nord e J632 in Sud, cosa occorre perche facciate prese?",
          quizType: "multiple-choice",
          options: [
            "Che il K sia in Ovest (in impasse)",
            "Che il K sia in Est",
            "Non importa dove sia il K",
            "Che il K sia secco",
          ],
          correctAnswer: 0,
          explanation:
            "Occorre che il K sia secondo in impasse (in Ovest, davanti all'AQ). Si deve muovere piccola per la Q e poi tirare l'Asso. La posizione del 10 e del 9 e ininfluente.",
        },
      ],
    },
    {
      id: "Q5-2",
      title: "Il gradino di ingresso e il colpo di sonda",
      icon: "🔍",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Il 'gradino di ingresso' e una delle carte equivalenti che possediamo in linea e che ci permetterebbe, nelle figure di impasse, di forzare la carta avversaria restando dalla parte giusta per ripetere l'operazione.",
        },
        {
          type: "rule",
          content:
            "NON INIZIATE CON UN ONORE QUANDO... SE L'AVVERSARIO LO COPRE NON SIETE CONTENTI. Usare un gradino di ingresso implica sempre il consumo di due carte: prevedete sempre che l'avversario copra con l'onore.",
        },
        {
          type: "text",
          content:
            "Il colpo di sonda consiste nell'incassare un onore prima di effettuare un impasse. Con AK103 in Nord e Q9652 in Sud: iniziate con la Q, e in Nord la forchetta K10 (o A10) permette il colpo di sonda per catturare l'eventuale J quarto in Est.",
        },
        {
          type: "quiz",
          content:
            "Con AKJ10 in Nord e 8752 in Sud, la manovra migliore e...",
          quizType: "multiple-choice",
          options: [
            "Giocare AK e sperare nella Q secca",
            "Fare il colpo di sonda: A, poi piccola verso J10",
            "Impasse al J dal Sud",
            "Giocare piccola da entrambe le parti",
          ],
          correctAnswer: 1,
          explanation:
            "Con 8 carte in linea e mancando solo la Dama, il colpo di sonda (battere A poi K) e opportuno per catturare una eventuale Dama secca in Est. Se entrambi gli avversari rispondono con cartine, vi mancano ancora la Dama e una cartina: tornate in Sud e fate l'impasse.",
        },
      ],
    },
    {
      id: "Q5-3",
      title: "La regola aurea dell'impasse",
      icon: "👑",
      xp: 60,
      content: [
        {
          type: "rule",
          content:
            "QUANDO GLI AVVERSARI HANNO UN ONORE PIU DUE O TRE CARTINE... FATE L'IMPASSE. QUANDO GLI AVVERSARI HANNO UN ONORE E UNA CARTINA... BATTETE IN TESTA.",
        },
        {
          type: "example",
          content:
            "Con AQJ109 in Nord e 87654 in Sud: si gioca piccola verso il morto. Se compare una cartina a sinistra, quando manca il K (e due cartine) si fa l'impasse. Quando manca il K e una sola cartina, si batte l'Asso.",
        },
        {
          type: "text",
          content:
            "Quando manca solo la Dama: con 9 o piu carte si battono A e K (la probabilita di trovarla secca o seconda e superiore). Con 8 o meno carte si fa l'impasse.",
        },
        {
          type: "tip",
          content:
            "CHI GIOCA IL FANTE... E NON HA IL 10 DEVE STARE IN GINOCCHIO SUI CECI!!! Il 10 e una carta chiave nelle manovre di impasse: la mancanza del 10 orienta l'impasse verso il lato che ha il Fante.",
        },
        {
          type: "quiz",
          content:
            "Hai AQJ109 al morto e 87654 in mano. Manca il K. Se a sinistra compare una cartina, cosa fai?",
          quizType: "multiple-choice",
          options: [
            "Batti l'Asso",
            "Fai l'impasse inserendo il J",
            "Giochi il 10",
            "Passi sotto",
          ],
          correctAnswer: 1,
          explanation:
            "Quando manca il K e gli avversari hanno un onore piu due o tre cartine, si fa l'impasse. Inserendo il J (o il Q) si spera che il K sia in Ovest.",
        },
      ],
    },
    {
      id: "Q5-4",
      title: "Le expasse e i casi disperati",
      icon: "💎",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "I colori bucati possono presentare figure di onore isolato che si prestano a manovre di expasse: non muovete gli onori... ma muovete VERSO gli onori. La consegna e sempre la stessa.",
        },
        {
          type: "rule",
          content:
            "L'IMPASSE consiste nel giocare un colore iniziando dalla parte opposta di una forchetta, e inserendo la carta piu bassa della forchetta stessa, allo scopo di far presa se l'onore mancante e posizionato 'prima'. L'EXPASSE: non si muovono gli onori isolati ma si gioca verso di essi.",
        },
        {
          type: "example",
          content:
            "Con K1043 in Nord e Q652 in Sud: il 10 e la vostra carta chiave, rafforzata (protetta) da un onore. Piccola alla Dama, poi piccola all'Asso isolato. Qualunque cosa succeda, rimarremo con la forchetta K10.",
        },
        {
          type: "quiz",
          content:
            "Con AQJ10642 in mano e 3 al morto, bloccati in Ovest. Cosa fate?",
          quizType: "multiple-choice",
          options: [
            "Impasse verso la Q",
            "Tirate l'Asso e sperate",
            "Non c'e soluzione",
            "Giocate il K di mano se lo avete",
          ],
          correctAnswer: 1,
          explanation:
            "Se siete bloccati in Ovest e non potete fare l'impasse, tirate l'Asso! Ogni tanto trovate l'onore secco. Nei casi disperati, incassate la vincente: una volta all'anno trovate l'onore secco!",
        },
      ],
    },
  ],
};

// ============================================================
// WORLD 2: VALUTAZIONE E DICHIARAZIONE BASE
// Lessons 2, 4, 6 - Hand evaluation, captaincy, openings
// ============================================================

const lezione2: QuadriLesson = {
  id: 2,
  title: "Valutazioni sull'apertura",
  icon: "⚖️",
  description:
    "Mani di 11 punti, forza giocabile vs onori, barrage e valutazione della distribuzione.",
  smazzateIds: ["Q2-1", "Q2-2", "Q2-3", "Q2-4"],
  modules: [
    {
      id: "Q2-1",
      title: "Mani di 11 punti: passare o aprire?",
      icon: "🤔",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Il conteggio Milton Work e estremamente approssimativo e insufficiente, va integrato con altre considerazioni. Con mani di 11 punti i 'difetti' possono essere tanti.",
        },
        {
          type: "rule",
          content:
            "Difetti delle mani da 11 punti: 1) Poche carte 'di testa' (A e K sono piu apprezzabili di Q e J). 2) La mano e 'impura' (onori concentrati nei colori lunghi). 3) Colori non competitivi (mancanza di maggiori). 4) La posizione di apertura sconsiglia. 5) Seconda dichiarazione pessima.",
        },
        {
          type: "example",
          content:
            "♠AK75 ♥98 ♦A543 ♣754 - Questi sono 11 punti belli: 3 prese certe, qualunque sia il contratto finale.",
          cards: "♠AK75 ♥98 ♦A543 ♣754",
        },
        {
          type: "example",
          content:
            "♠Q753 ♥K ♦QJ543 ♣QJ3 - Difficile immaginare di peggio: assenza di carte di testa e punti nei colori corti.",
          cards: "♠Q753 ♥K ♦QJ543 ♣QJ3",
        },
        {
          type: "rule",
          content:
            "SE AVETE 11 PUNTI E LA MANO CONTIENE ALMENO DUE DI QUESTI DIFETTI... PASSATE!",
        },
        {
          type: "quiz",
          content:
            "Hai ♠KQ75 ♥98 ♦A543 ♣754 (11 punti). Apri?",
          quizType: "multiple-choice",
          options: [
            "Si, sempre con 11 punti",
            "Si, carte di testa e distribuzione pulita",
            "No, troppo debole",
            "Dipende dalla vulnerabilita",
          ],
          correctAnswer: 1,
          explanation:
            "Con A e K (carte di testa), mano pura (onori nei lunghi) e buona seconda dichiarazione, questi 11 punti meritano l'apertura.",
        },
      ],
    },
    {
      id: "Q2-2",
      title: "Forza giocabile e forza onori",
      icon: "💪",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "La Forza Giocabile e la capacita di una mano di conseguire prese alla sola condizione di imporre il proprio atout. La Forza Onori e la capacita di produrre prese qualunque sia il contratto del tavolo.",
        },
        {
          type: "example",
          content:
            "1) ♠AKQ8765 ♥62 ♦J ♣543 - 7 vincenti con atout Picche, ma scarsissime possibilita in altri contratti. 2) ♠AQJ ♥KJ54 ♦AJ97 ♣K4 - Meno vincenti certe ma prese ovunque.",
          cards: "♠AKQ8765 ♥62 ♦J ♣543",
        },
        {
          type: "rule",
          content:
            "QUANDO APRIAMO IN BARRAGE DICIAMO QUANTE PRESE FACCIAMO NOI. QUANDO APRIAMO DI 'UNO' DICIAMO QUANTE PRESE NON FA L'AVVERSARIO.",
        },
        {
          type: "quiz",
          content:
            "Una mano con solo forza giocabile ha...",
          quizType: "multiple-choice",
          options: [
            "Molti onori sparsi",
            "Un colore lungo e dominante",
            "Distribuzione bilanciata",
            "Almeno 15 punti onori",
          ],
          correctAnswer: 1,
          explanation:
            "La forza giocabile e data dalla capacita di fare prese con un colore lungo imposto come atout. Ha scarsissime possibilita di fare prese in contratti alternativi.",
        },
      ],
    },
    {
      id: "Q2-3",
      title: "Le aperture di barrage",
      icon: "🚧",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Le aperture di barrage (livello 3 e 4) sono per mani con grande forza giocabile: monocolori onorati. Il messaggio e: 'da solo, con le mie carte, faccio circa tre prese in meno di quelle che sto dichiarando.'",
        },
        {
          type: "rule",
          content:
            "Requisiti barrage: 7+ carte onorate nel colore, non piu di una carta alta (A o K) esterna al colore. Dopo un'apertura di barrage ogni decisione spetta al compagno: CHI FA UN BARRAGE... POI VA AL BAR A PRENDERSI UN CAFFE.",
        },
        {
          type: "example",
          content:
            "♠KQJ7654 ♥75 ♦43 ♣J5 = 3♠ (6 prese a Picche). ♠7 ♥75 ♦AQJ7654 ♣QJ5 = 3♦ (probabili 6 prese a Quadri). ♠AKJ87643 ♥7 ♦75 ♣54 = 4♠ (probabili 8 prese a Picche).",
        },
        {
          type: "quiz",
          content:
            "Hai ♠Q876543 ♥K2 ♦75 ♣J5 - Apri di barrage 3♠?",
          quizType: "true-false",
          correctAnswer: "false",
          explanation:
            "No! Le picche non sono sufficientemente onorate (dove vedete 6-7 prese?), e il K esterno e un difetto per un barrage. Questa mano va passata.",
        },
      ],
    },
    {
      id: "Q2-4",
      title: "Valutare la distribuzione",
      icon: "📊",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Le valutazioni possono cambiare di molto strada facendo, sia la distribuzione che per i punti. Una lunga e tendenzialmente costante: tanto piu se facilmente affrancabile, e sempre e comunque una buona cosa.",
        },
        {
          type: "rule",
          content:
            "Una mano con due colori quarti (4432) e decisamente migliore di una che ne abbia uno solo (4333, la peggiore in assoluto). Ogni mano aumenta di valore quando si scopre fit, e perde valore quando si fronteggiano colori opposti.",
        },
        {
          type: "text",
          content:
            "Le mani 6-5 sono spesso traditrici. Se la dichiarazione non ha impennate, la descrizione di una 6-5 richiede tre tempi. Se la mano non ha almeno 8 vincenti, e consigliabile trattare la 6-5 come fosse una 5-5, aprendo nel seme di rango maggiore anche se l'altro e piu lungo.",
        },
        {
          type: "quiz",
          content:
            "Quale distribuzione e la peggiore in assoluto per il gioco ad atout?",
          quizType: "multiple-choice",
          options: ["4432", "5332", "4333", "5422"],
          correctAnswer: 2,
          explanation:
            "La 4333 e la peggiore: un solo colore quarto e nessuna possibilita di taglio. La 4432 e decisamente migliore perche offre un doubleton dove tagliare.",
        },
      ],
    },
  ],
};

const lezione4: QuadriLesson = {
  id: 4,
  title: "Il capitanato e la replica dell'apertore",
  icon: "🎖️",
  description:
    "Capitano e Subordinato: chi decide il contratto e chi si descrive. La replica dell'Apertore.",
  smazzateIds: ["Q4-1", "Q4-2", "Q4-3", "Q4-4"],
  modules: [
    {
      id: "Q4-1",
      title: "Capitano e Subordinato",
      icon: "👨‍✈️",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Nel corso di una sequenza dichiarativa, prima o poi uno dei due compagni precisa il suo punteggio tra un massimo e un minimo: si dice che ha 'limitato la mano'. Diventa il Subordinato, mentre il compagno che conosce la forza combinata diventa il Capitano.",
        },
        {
          type: "rule",
          content:
            "SU QUALSIASI APERTURA DI UNO IL CAPITANATO SPETTA AL RISPONDENTE. L'APERTORE QUINDI DOVRA DESCRIVERSI. MA MAI PRENDERSI L'ARBITRIO DI DECIDERE IL CONTRATTO.",
        },
        {
          type: "text",
          content:
            "Tutte le dichiarazioni fatte dal Subordinato sono descrittive e rappresentano sempre colori reali. Il Capitano puo inventare cambi di colore anche senza averli, perche sara lui a prendere la decisione finale.",
        },
        {
          type: "quiz",
          content:
            "Nella sequenza 1♥-2♣-2♥, chi e il Capitano?",
          quizType: "multiple-choice",
          options: [
            "L'Apertore (Nord)",
            "Il Rispondente (Sud)",
            "Nessuno ancora",
            "Dipende dai punti",
          ],
          correctAnswer: 1,
          explanation:
            "Il Rispondente e il Capitano: ha dichiarato un colore nuovo (2♣ forzante) e l'Apertore, ridichiarando 2♥, si sta descrivendo come Subordinato. Sud decidera il contratto finale.",
        },
      ],
    },
    {
      id: "Q4-2",
      title: "La replica dopo risposte 2 su 1",
      icon: "🔢",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Quando l'apertura e stata 1♥ o 1♠ e la risposta e stata 2 su 1, vale che: la ripetizione del nobile non lo allunga e non limita la mano. Un colore nuovo a livello 2 ha forza ambigua (12+). Un colore nuovo a livello 3 e certamente mano buona (15+ oppure 5-5).",
        },
        {
          type: "rule",
          content:
            "2NT e una 5332 di 12-14, adatta a giocare a Senza con un fermo nei colori non detti. Un SALTO mostra una monocolore 'chiusa' o una grande bicolore.",
        },
        {
          type: "example",
          content:
            "Dopo 1♥-2♣: ♠K75 ♥Q9853 ♦AKQ ♣72 - La replica corretta e 2NT (5332 di Diritto, non 2♦!). L'Apertore si descrive senza fare invenzioni.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♠-2♣, Nord con ♠AKQJ94 ♥64 ♦A73 ♣J6 replica...",
          quizType: "bid-select",
          options: ["2♠", "3♠", "2NT", "2♦"],
          correctAnswer: 1,
          explanation:
            "3♠ e un salto che mostra una monocolore 'chiusa': picche lunghe e solide, qualita eccezionale del colore. Il messaggio e: 'possiamo giocare a picche anche se non ne hai'.",
        },
      ],
    },
    {
      id: "Q4-3",
      title: "La replica dopo risposte a livello 1",
      icon: "1️⃣",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Sulla risposta a colore a livello 1, l'Apertore ha il compito di descriversi senza inventare mai colori che non ha. La replica di 1NT mostra una bilanciata (12-14), nega fit quarto, nega quarte che si sarebbero potute dire a livello 1.",
        },
        {
          type: "rule",
          content:
            "LA RIPETIZIONE DEL COLORE DI APERTURA: su risposte a livello UNO, mostra forza (12-14) e mano sbilanciata: o il colore e sesto, o c'e una 5/4 non dichiarabile. Mai la 5332.",
        },
        {
          type: "text",
          content:
            "I Rever: Piccoli Rever (15-17) sono le dichiarazioni con cui l'Apertore SALTA in un colore gia detto. I Rever senza salto sono a tutto campo: 16-20. I Rever a salto (Gran Rever) sono sempre nella fascia massima: 18-20.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♣-1♠, Nord con ♠K5 ♥V65 ♦AKJ965 ♣AJ2 replica...",
          quizType: "bid-select",
          options: ["1NT", "2♦", "3♦", "2NT"],
          correctAnswer: 2,
          explanation:
            "3♦ e un Piccolo Rever (15-17): l'Apertore salta nel proprio colore mostrando forza extra. Se avesse dichiarato solo 2♦ avrebbe mostrato 12-14.",
        },
      ],
    },
    {
      id: "Q4-4",
      title: "Repliche elastiche e forza",
      icon: "🎯",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Quando l'Apertore ridichiara 1NT, la sua mano e decisamente definita tra 12 e 14 punti. Quando mostra un nuovo colore (1♦-1♥-1♠, oppure 1♥-1♠-2♦) il punteggio e piu elastico e non si puo tassativamente circoscrivere ai 12-14.",
        },
        {
          type: "rule",
          content:
            "I ROVESCI IN APPOGGIO O IN 'AUTO-APPOGGIO' MOSTRANO 15-17 E NON SONO FORZANTI. I REVER SENZA SALTO SONO A TUTTO CAMPO: 16-20. I REVER A SALTO (GRAN REVER) SONO SEMPRE NELLA FASCIA MASSIMA: 18-20.",
        },
        {
          type: "tip",
          content:
            "Quando siete in dubbio se fare Gran Rever o temporeggiare in Diritto, ricordatevi che la situazione di probabile misfit e un elemento negativo. Con mani di forza 15-17, descrivete la mano come bilanciata e aprite di 1NT quando i colori lunghi sono fragili e i doubleton entrambi coperti.",
        },
        {
          type: "quiz",
          content:
            "L'apertura di 1NT aperta mostra...",
          quizType: "multiple-choice",
          options: [
            "12-14 bilanciata",
            "15-17 bilanciata",
            "12-20 qualunque",
            "16-18 sbilanciata",
          ],
          correctAnswer: 1,
          explanation:
            "1NT mostra una mano bilanciata con 15-17 punti. E l'esempio tipico di mano 'definita' per punteggio e distribuzione: in una sola dichiarazione l'Apertore ha dato un'informazione precisa.",
        },
      ],
    },
  ],
};

const lezione6: QuadriLesson = {
  id: 6,
  title: "Le aperture oltre il livello 1",
  icon: "🚀",
  description:
    "Aperture forti di 2♦, 2♥, 2♠, 2♣ e la Richiesta d'Assi (Blackwood 4NT).",
  smazzateIds: ["Q6-1", "Q6-2", "Q6-3", "Q6-4"],
  modules: [
    {
      id: "Q6-1",
      title: "Le aperture a livello 2: 2♦, 2♥, 2♠",
      icon: "2️⃣",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Le aperture di 2♦, 2♥, 2♠ mostrano mani sbilanciate, troppo forti per essere aperte a livello uno: 20-21+ punti onori oppure 16-20 con una mano che presenta 8½-9 vincenti probabili.",
        },
        {
          type: "rule",
          content:
            "LE APERTURE DI 2♦, 2♥, 2♠ SONO FORZANTI FINO A 'TRE NEL COLORE INIZIALE'. Nessuno dei due potra abbandonare la licita al di sotto di tale livello.",
        },
        {
          type: "text",
          content:
            "Le risposte: a) un colore nuovo a livello 2 richiede 0+ punti e 4+ carte; b) dichiarazioni a livello 3 sono forzanti di manche e mostrano 5+ carte; c) l'appoggio immediato a manche mostra forza appena sufficiente; d) 2NT e una risposta d'attesa debole e disperata.",
        },
        {
          type: "quiz",
          content:
            "Il compagno apre 2♥. Con ♠52 ♥94 ♦J82 ♣AQJ832, rispondi...",
          quizType: "bid-select",
          options: ["Passo", "2NT", "3♣", "2♠"],
          correctAnswer: 2,
          explanation:
            "3♣ e forzante a manche: mostra 5+ carte con almeno 2 onori al livello 3. Con un colore cosi bello e 5+ punti, e la risposta corretta. Non si passa MAI su apertura di 2 a colore!",
        },
      ],
    },
    {
      id: "Q6-2",
      title: "L'apertura di 2♣",
      icon: "♣",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "L'apertura di 2♣ e anomala: e un contenitore per due tipi di mano: la bilanciata forte (23+) e la mano a base fiori. La risposta 2♦ e convenzionale d'attesa (non promette le quadri).",
        },
        {
          type: "rule",
          content:
            "Su apertura 2♣: le risposte 2♥, 2♠, 3♣, 3♦ richiedono 5+ carte con almeno un onore se restano al livello 2, almeno 2 onori se a livello 3, e sono forzanti di manche (almeno 5 punti). Se l'Apertore replica 2NT mostra la bilanciata (23+).",
        },
        {
          type: "example",
          content:
            "♠AQJ3 ♥AK5 ♦KJ107 ♣AQ - Apre 2♣, poi dira 2NT (bilanciata 23+). ♠KQJ3 ♥- ♦AK7 ♣AK10954 - Apre 2♣, poi dira fiori (mano a base fiori fortissima).",
        },
        {
          type: "quiz",
          content:
            "Dopo 2♣-2♦-2NT, cosa descrive l'Apertore?",
          quizType: "multiple-choice",
          options: [
            "Una mano con le fiori",
            "Una bilanciata di 23+ punti",
            "Una mano debole",
            "Una bicolore minori",
          ],
          correctAnswer: 1,
          explanation:
            "Quando l'Apertore di 2♣ replica 2NT, mostra la bilanciata forte di 23+ punti. La licita prosegue come se avesse aperto di 2NT, con il 3♣ interrogativo.",
        },
      ],
    },
    {
      id: "Q6-3",
      title: "La Richiesta d'Assi: Blackwood 4NT",
      icon: "🎰",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Per giocare un Piccolo Slam serve che l'avversario non possa incassare due assi; per il Grande Slam neanche uno. La dichiarazione di 4NT (Roman Key Card Blackwood) chiede il numero di assi.",
        },
        {
          type: "rule",
          content:
            "AD ATOUT gli ASSI sono CINQUE: A♣, A♦, A♥, A♠ e il K di atout. Le risposte: 5♣ = 0 o 3 assi; 5♦ = 1 o 4 assi; 5♥ = 2 assi senza la Dama di atout; 5♠ = 2 assi piu la Dama di atout.",
        },
        {
          type: "text",
          content:
            "Note importanti: il 4NT e richiesta d'assi SOLO se esiste un atout concordato esplicitamente o implicitamente. La richiesta e prerogativa del Capitano, o comunque di chi non si sia mai limitato in precedenza. La dichiarazione di 5NT chiede i Re: 6♣=0, 6♦=1, 6♥=2, 6♠=3.",
        },
        {
          type: "quiz",
          content:
            "Nella RKCB (Roman Key Card Blackwood), quanti 'assi' si contano quando si gioca ad atout?",
          quizType: "multiple-choice",
          options: ["4", "5", "6", "Dipende dal colore"],
          correctAnswer: 1,
          explanation:
            "Ad atout gli assi sono 5: i quattro Assi tradizionali piu il Re di atout, che e una carta importantissima e viene accomunato agli assi.",
        },
      ],
    },
    {
      id: "Q6-4",
      title: "L'apertura di 3NT Gambling",
      icon: "🎲",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "L'apertura di 3NT (Gambling) mostra un colore minore settimo e 'chiuso' (tassativamente capeggiato da AKQJ) e nessun'altra carta alta a lato (al massimo una Dama, corta).",
        },
        {
          type: "rule",
          content:
            "Il compagno dira Passo solo se avendo i fermi in tutti i colori ritiene che 3NT sia un contratto fattibile. Altrimenti dira 4♣ col significato: 'passa se il tuo colore e fiori, altrimenti correggi a 4♦'.",
        },
        {
          type: "example",
          content:
            "♠7 ♥Q3 ♦AKQJ765 ♣753 = 3NT. ♠75 ♥53 ♦86 ♣AKQJ875 = 3NT. Il compagno con ♠A753 ♥QJ32 ♦A98 ♣42 dice Passo (7 fiori + le sue 2 prese).",
        },
        {
          type: "quiz",
          content:
            "Su apertura 3NT del compagno, con ♠J5 ♥Q765 ♦53 ♣K9876, cosa dici?",
          quizType: "bid-select",
          options: ["Passo", "4♣", "4NT", "5♣"],
          correctAnswer: 1,
          explanation:
            "Non hai i fermi necessari per giocare a Senza. Dici 4♣: 'passa se il tuo colore e fiori, altrimenti correggi a 4♦'. E l'unico modo per trovare il parziale giusto.",
        },
      ],
    },
  ],
};

// ============================================================
// WORLD 3: DICHIARAZIONE AVANZATA
// Lessons 8, 10, 12 - Game approach, doubles, overcalls
// ============================================================

const lezione8: QuadriLesson = {
  id: 8,
  title: "L'accostamento a manche",
  icon: "🎯",
  description:
    "Il Terzo e Quarto colore forzante, trial bid e la ricerca della manche.",
  smazzateIds: ["Q8-1", "Q8-2", "Q8-3", "Q8-4"],
  modules: [
    {
      id: "Q8-1",
      title: "Il Terzo colore",
      icon: "3️⃣",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Quando si parla di 'cambio di colore forcing' si intende la situazione in cui il Rispondente (non l'Apertore!), dopo aver gia detto un colore e non 1NT, al giro successivo dichiara un colore nuovo.",
        },
        {
          type: "rule",
          content:
            "Il Terzo colore: se e DISCENDENTE a livello 2 e forzante 1 giro. Se e ASCENDENTE o DISCENDENTE a livello 3 e forzante a manche. ALLUNGA il colore precedente. E tendenzialmente un colore reale, o quantomeno mostra valori.",
        },
        {
          type: "example",
          content:
            "1♦-1♠-2♦-3♣: il terzo colore a livello 3 rende la situazione forzante manche. Con 3♠ Est mostra almeno 6 carte, sta cercando di giocare 3NT o 4♠.",
          cards: "♠KQ10875 ♥43 ♦A8 ♣A53",
        },
        {
          type: "quiz",
          content:
            "Nella sequenza 1♦-1♥-1♠-2♣, il 2♣ e...",
          quizType: "multiple-choice",
          options: [
            "Forzante a manche",
            "Forzante 1 giro (discendente a livello 2)",
            "Non forzante",
            "Un barrage",
          ],
          correctAnswer: 1,
          explanation:
            "2♣ e un terzo colore discendente a livello 2: e forzante un solo giro. L'Apertore non puo passare ma la coppia non e ancora obbligata alla manche.",
        },
      ],
    },
    {
      id: "Q8-2",
      title: "Il Quarto colore",
      icon: "4️⃣",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Il Quarto colore e forcing manche (tranne a livello 1: 1♣-1♦-1♥-1♠ e forzante 1 solo giro). Non garantisce necessariamente 3 carte nel palo precedente, non promette lunghezza ne valori.",
        },
        {
          type: "rule",
          content:
            "Il Quarto colore e l'unico rimasto a disposizione del Rispondente per forzare e richiedere ulteriore descrizione. Il Rispondente vuole sapere: se l'apertore ha fit terzo nel primo colore, se possiede il fermo nel 4° colore, se ha ulteriore lunghezza nei propri colori.",
        },
        {
          type: "text",
          content:
            "Comportamento dell'Apertore sul quarto colore: 1) appoggiare il primo colore del Rispondente con fit terzo. 2) dichiarare a Senza se ha il fermo. 3) ripetere un colore per mostrare lunghezza extra. 4) rialzare nel quarto colore con 4 carte. 5) negare tutto con un 'allungo impossibile'.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♦-1♥-1♠-2♣ (4° colore), Nord con ♠AJ75 ♥K53 ♦AJ64 ♣76 replica...",
          quizType: "bid-select",
          options: ["2♥", "2NT", "2♦", "3♣"],
          correctAnswer: 0,
          explanation:
            "2♥: Nord ha fit terzo nel primo colore del Rispondente (cuori). E la prima priorita: mostrare il fit nel maggiore del partner, prima di Senza.",
        },
      ],
    },
    {
      id: "Q8-3",
      title: "Quando il fit maggiore e trovato",
      icon: "🤝",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Quando c'e fit e si gioca ad atout, il risultato in prese puo risultare diverso a seconda che gli onori dei colori laterali si complementino o meno.",
        },
        {
          type: "rule",
          content:
            "QUANDO IL CONTRATTO E AD ATOUT, IL SUCCESSO DIPENDE NON SOLO DALLA QUANTITA DEI PUNTI ONORI MA DAI COLORI IN CUI SONO DISLOCATI! Quando una coppia trova fit a livello 2, tutto lo spazio compreso tra il 2 e il 3 in atout e destinato alle indagini per sondare le possibilita di manche.",
        },
        {
          type: "example",
          content:
            "Ovest: ♠AQ863 ♥KJ102 ♦6 ♣AQ3 con Est: ♠K742 ♥Q5 ♦8732 ♣K82 - Tutti e tre gli onori di Est a peso d'oro: 11 prese facili. Ma con ♠742 ♥A53 ♦KJ32 ♣852: KJ di quadri assolutamente no!",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♠-2♠, un cambio di colore del Capitano (es. 3♦) e...",
          quizType: "multiple-choice",
          options: [
            "Una proposta di nuovo contratto",
            "Una trial bid: chiede aiuto nel colore",
            "Un barrage",
            "Un segnale di debolezza",
          ],
          correctAnswer: 1,
          explanation:
            "E una trial bid: chiede al Rispondente di chiamare manche se aiuta nel colore dichiarato (con onori o valori di taglio), ma di riportare a 3 in atout in caso contrario.",
        },
      ],
    },
    {
      id: "Q8-4",
      title: "Le trial bid",
      icon: "🧪",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Quando il Rispondente ha rialzato a 2 un maggiore, il contratto GOAL e 4 nel maggiore, e la licita di un nuovo colore da parte dell'Apertore e detta trial-bid. Chiede al Rispondente di chiamare manche se aiuta nel colore dichiarato.",
        },
        {
          type: "rule",
          content:
            "AD ATOUT MAGGIORE TROVATO A LIVELLO 'DUE', UN CAMBIO DI COLORE DEL CAPITANO CHIEDE AIUTO NEL COLORE ED E FORZANTE FINO A 'TRE' NELL'ATOUT.",
        },
        {
          type: "text",
          content:
            "Come comportarsi di fronte a un colore nuovo (trial bid): se ha valori (A,K,Q) rialza a manche. Se ha cartine, riporta a 3 nell'atout: 'mi spiace, tentativo di manche fallito'. Se ha un valore importante (A o Re) in un altro seme, puo dichiararlo 'sotto' del 3 in atout.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♠-2♠-3♣ (trial bid), con ♠Q96 ♥97643 ♦762 ♣AQ2, rispondi...",
          quizType: "bid-select",
          options: ["3♠", "4♠", "3♦", "Passo"],
          correctAnswer: 1,
          explanation:
            "4♠! Avete valori ottimi nel colore richiesto (AQ di fiori). La trial bid chiede aiuto a fiori e voi ce l'avete: rialzate a manche con entusiasmo.",
        },
      ],
    },
  ],
};

const lezione10: QuadriLesson = {
  id: 10,
  title: "Il Contro e la Surlicita",
  icon: "✊",
  description:
    "Contro informativo, Surlicita e le differenze: come cercare fit nella dichiarazione competitiva.",
  smazzateIds: ["Q10-1", "Q10-2", "Q10-3", "Q10-4"],
  modules: [
    {
      id: "Q10-1",
      title: "Contro e Surlicita: le basi",
      icon: "⚡",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Il Contro ci aiuta a distinguere i colori quarti dai colori lunghi. La Surlicita e il rialzo di un colore mostrato dall'avversario. Entrambe si usano solo in competizione.",
        },
        {
          type: "rule",
          content:
            "QUANDO ENTRAMBE LE DICHIARAZIONI SONO DISPONIBILI: IL CONTRO CERCA FIT (forzante generico che nega fit). LA SURLICITA LO PROMETTE (forzante che conferma fit). QUANDO IL CONTRO NON E DISPONIBILE: La Surlicita si fa carico di tutte le mani forti, con o senza fit.",
        },
        {
          type: "example",
          content:
            "Dopo 1♦-1♠-?: con ♠54 ♥AJ54 ♦Q75 ♣K753 Nord dichiara CONTRO (cerca fit in altri colori). Con ♠J5 ♥AQ753 ♦KJ64 ♣A9 Nord dichiara 2♠ SURLICITA (fit cuori e almeno forza di manche).",
        },
        {
          type: "quiz",
          content:
            "La Surlicita, a differenza del Contro, promette...",
          quizType: "multiple-choice",
          options: [
            "Piu punti",
            "Fit nel colore del compagno",
            "Un colore lungo proprio",
            "Mano bilanciata",
          ],
          correctAnswer: 1,
          explanation:
            "La Surlicita e un forzante che promette fit. Il Contro e un forzante generico che nega fit. Questa definizione e il caposaldo di tutta la dichiarazione competitiva.",
        },
      ],
    },
    {
      id: "Q10-2",
      title: "Contro e surlicita del compagno dell'apertore",
      icon: "🤝",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Dopo apertura e intervento a colore, il compagno dell'apertore puo usare il contro per cercare fit e la surlicita per mostrare 'forza almeno di manche e fit trovato'.",
        },
        {
          type: "rule",
          content:
            "SU UN INTERVENTO A COLORE DEL COMPAGNO: SE C'E FIT LA SURLICITA PROMETTE 11+ PUNTI. SE NON C'E FIT LA SURLICITA PROMETTE 14+ PUNTI.",
        },
        {
          type: "text",
          content:
            "Se il compagno dell'apertore ha mani forti ma senza fit, usa il Contro. Se ha fit e forza, usa la Surlicita. Se ha una dichiarazione naturale forzante a disposizione, la preferisce sempre a Contro e Surlicita.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♥-1♠-? avete ♠K75 ♥53 ♦AKJ5 ♣J976. Cosa dite?",
          quizType: "bid-select",
          options: ["2♠ (surlicita)", "X (contro)", "2♦", "1NT"],
          correctAnswer: 2,
          explanation:
            "2♦ e la dichiarazione naturale corretta: 11+ punti e 5+ carte di quadri. Non fate uso di Contro o Surlicita quando avete a disposizione una dichiarazione naturale forzante!",
        },
      ],
    },
    {
      id: "Q10-3",
      title: "Contro e surlicita dopo il Contro informativo",
      icon: "🔄",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Sul contro del compagno l'unica dichiarazione forzante, obbligatoria con tutte le mani di 11+, e la surlicita. Chi surlicita si impegna a parlare ancora almeno fino a livello 3 in uno dei colori 'promessi'.",
        },
        {
          type: "rule",
          content:
            "Sul contro del compagno: una dichiarazione al minimo (0 a 9-10 punti) dice 'di manche non se ne parla'. Un colore a salto semplice (8-10 punti e 5+ carte) dice 'sono contento del contratto che sto dichiarando'. Una manche a colore (8-10 punti e 6+ carte) dice 'me la gioco e spero di farla'.",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♦-X-P-?, con ♠AQ75 ♥K754 ♦43 ♣KQ2, cosa dite?",
          quizType: "bid-select",
          options: ["1♠", "2♦ (surlicita)", "1♥", "2NT"],
          correctAnswer: 1,
          explanation:
            "2♦ e surlicita: una manche e certa, ma perche mettersi a indovinare quale? 'Caro compagno, almeno fino a livello di 3 possiamo giocare, comincia TU a dirmi il primo colore in cui hai 4 carte!'.",
        },
      ],
    },
    {
      id: "Q10-4",
      title: "Contro e surlicita dell'Apertore",
      icon: "🎤",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Quando l'avversario e entrato in dichiarazione, l'occasione per contrare o surlicitare capita anche all'apertore. La surlicita dell'Apertore esprime fit quarto a cuori e una mano piu forte che se avesse detto 3♥ o 4♥.",
        },
        {
          type: "rule",
          content:
            "Il contro dell'Apertore mostra una mano di REVER e chiede al partner di dichiarare ancora: non ha 4 carte nel nobile del compagno e non ha una licita migliore. E la 'rimozione': Contro poi cambio colore = 18+ punti.",
        },
        {
          type: "example",
          content:
            "1♦-P-1♥-1♠: Sud con ♠A5 ♥AQ86 ♦AKJ754 ♣3 dice 2♠ (surlicita, fit quarto a cuori, 14+ belli). Con ♠AQ75 ♥KQ8 ♦AQJ4 ♣J3 dice X (contro, rever senza fit).",
        },
        {
          type: "quiz",
          content:
            "L'Apertore surlicita per mostrare...",
          quizType: "multiple-choice",
          options: [
            "Una mano debole con fit",
            "Fit quarto nel colore del compagno e mano forte",
            "Una mano bilanciata",
            "Che vuole giocare nel colore avversario",
          ],
          correctAnswer: 1,
          explanation:
            "La surlicita dell'Apertore esprime fit quarto nel colore del compagno con mano piu forte di un semplice appoggio. Con onori concentrati nei colori lunghi, pochi punti possono bastare.",
        },
      ],
    },
  ],
};

const lezione12: QuadriLesson = {
  id: 12,
  title: "Interventi e riaperture",
  icon: "🛡️",
  description:
    "Il Contro informativo con rimozione, l'intervento a salto, 2NT delle minori e il Passo forte.",
  smazzateIds: ["Q12-1", "Q12-2", "Q12-3", "Q12-4"],
  modules: [
    {
      id: "Q12-1",
      title: "Il Contro informativo e la rimozione",
      icon: "🔊",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Le bilanciate di 15-17 si descrivono con l'intervento di 1NT. Dal contro informativo transitano: a) mani con valore di apertura normale (12-14) e requisiti di colori; b) mani forti di 18+, con qualsiasi distribuzione.",
        },
        {
          type: "rule",
          content:
            "Il contro su 1♥ mostra 4 picche e tolleranza per fiori e quadri. Il contro su 1♠ mostra 4 cuori e tolleranza per fiori e quadri. Il contro su 1♣/1♦ mostra almeno la 4/3 nobile e tolleranza per l'altro minore.",
        },
        {
          type: "text",
          content:
            "Quando si da il Contro con 12-14, si deve poter accettare qualsiasi scelta del compagno perche non si potra piu scappare. Se il contrante cambia quanto ha detto il partner seguendo il meccanismo della 'Rimozione', mostra in automatico la mano con 18+.",
        },
        {
          type: "quiz",
          content:
            "Ovest ha ♠QJ87 ♥V75 ♦AQ3 ♣A754. Dopo 1♦ dell'avversario, cosa dichiara?",
          quizType: "bid-select",
          options: ["Passo", "1NT", "X (Contro)", "2♣"],
          correctAnswer: 2,
          explanation:
            "Contro informativo: mostra valore di apertura (12-14), 4 carte in entrambi i nobili e tolleranza per fiori. Perfetto per il contro!",
        },
      ],
    },
    {
      id: "Q12-2",
      title: "L'intervento a salto e 2NT minori",
      icon: "⬆️",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "L'intervento a salto a livello due mostra 6 buone carte (due onori) e valori di apertura, da 11 a 14-15. Essendo un intervento a campo ristretto, il compagno ha facili decisioni da prendere.",
        },
        {
          type: "rule",
          content:
            "Dopo aperture di 1♥ o 1♠, l'intervento di 2NT mostra una bicolore minore almeno 5-5, con buoni colori. Non puo mostrare una bilanciata forte (per quella si usa Contro poi 1NT). E una dichiarazione illogica e quindi forzante.",
        },
        {
          type: "example",
          content:
            "♠5 ♥72 ♦KQ1082 ♣AJ1062 = 2NT su 1♥ o 1♠ (bicolore minori 5-5). ♠KJ ♥A ♦Q8732 ♣Q7653 = Passo (punti nei colori sbagliati!)",
        },
        {
          type: "quiz",
          content:
            "Su apertura avversaria di 1♠, con ♠4 ♥6 ♦AKJ1065 ♣J6542 dite...",
          quizType: "bid-select",
          options: ["2NT", "2♦", "Passo", "3♦"],
          correctAnswer: 1,
          explanation:
            "Questa non e una bicolore: e una monocolore di quadri con un ciuffo di fiori. Intervenite 2♦, non 2NT! La 2NT richiede una vera 5-5 minore con colori onesti.",
        },
      ],
    },
    {
      id: "Q12-3",
      title: "Il Passo forte e le riaperture",
      icon: "🤫",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Il 'Passo forte' e la situazione in cui il Passo non e dovuto a scarso punteggio ma al possesso di lunghezza e forza nel colore avversario. Il compagno deve proteggere riaprendo la licita.",
        },
        {
          type: "rule",
          content:
            "Si definisce 'RIAPERTURA' qualsiasi dichiarazione fatta dal giocatore che, se dicesse Passo, concluderebbe la licita (terzo e ultimo Passo). La RIAPERTURA DI CONTRO non mostra particolari requisiti di forza, ma garantisce almeno due prese certe di controgioco. E un CONTRO DI PROTEZIONE.",
        },
        {
          type: "text",
          content:
            "E fondamentale la differenza tra intervento e riapertura: l'intervento e di tipo 'informativo' (garantisce requisiti), la riapertura e di tipo 'deduttivo' (non si basa sulla forza propria ma su quella dedotta sulla propria linea).",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♠-P-P, siete in Est con ♠2 ♥KQJ652 ♦52 ♣Q743. Cosa dite?",
          quizType: "bid-select",
          options: ["Passo", "X (Contro)", "2♥", "2NT"],
          correctAnswer: 2,
          explanation:
            "Riaprite a colore con 2♥: avete forza giocabile e non volete lasciare giocare 1♠. Non Contro, perche se il compagno trasformasse il contro non fareste un buon affare!",
        },
      ],
    },
    {
      id: "Q12-4",
      title: "Quando riaprire",
      icon: "🔑",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Non si ha mai la certezza che il compagno sia in 'passo forte': qualora cosi non fosse sara lui a dover togliere il contro e dichiarare qualcosa. Chi riapre con il contro ipotizza forza taciuta nel compagno.",
        },
        {
          type: "rule",
          content:
            "QUANDO RIAPRITE: assicuratevi di avere buone probabilita di trovare un fit. Abbiate cura di avere tutti punti utili. QUANDO IL COMPAGNO RIAPRE RICORDATEVI CHE SA GIA CHE AVETE DEI PUNTI!",
        },
        {
          type: "tip",
          content:
            "La riapertura puo essere fatta anche a colore, quando le carte sono tali da ritenere che, se contrassimo e il compagno trasformasse, non faremmo un buon affare. Onde evitare, riaprire a colore e non con il Contro!",
        },
        {
          type: "quiz",
          content:
            "Dopo 1♦-1♥-P-P, Sud ha ♠K762 ♥9 ♦AK963 ♣A73. Cosa fa?",
          quizType: "bid-select",
          options: ["Passo", "X (Contro)", "2♦", "1♠"],
          correctAnswer: 1,
          explanation:
            "Contro di protezione: il partner potrebbe avere un 'passo forte' con buone cuori. Il Contro riapre la licita e il compagno potra trasformarlo dicendo Passo se ha le cuori, oppure dichiarare il suo colore.",
        },
      ],
    },
  ],
};

// ============================================================
// WORLD 4: DIFESA E CONTROGIOCO
// Lessons 7, 9, 11 - Leads, signals, defensive play
// ============================================================

const lezione7: QuadriLesson = {
  id: 7,
  title: "Attacchi e segnali di controgioco",
  icon: "📡",
  description:
    "La carta d'attacco, il Busso, il segnale del gradimento e il primo scarto all'italiana.",
  smazzateIds: ["Q7-1", "Q7-2", "Q7-3", "Q7-4"],
  modules: [
    {
      id: "Q7-1",
      title: "La carta di attacco e il Busso",
      icon: "🚪",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "La carta di attacco richiede due scelte: in che seme (dalla licita) e con che carta (dagli accordi di coppia). In presenza di sequenze, si sceglie la piu alta delle toccanti; senza sequenze si attacca di cartina.",
        },
        {
          type: "rule",
          content:
            "L'ATTACCO CON LA PIU PICCOLA DELLE CARTINE dice che in quel colore abbiamo almeno un onore. Al compagno viene chiesto di prendere e tornare. L'ATTACCO CON LA PIU ALTA DELLE CARTINE dice che non abbiamo onori: il compagno e libero di prendere e cambiare.",
        },
        {
          type: "text",
          content:
            "Le carte di attacco che promettono l'inferiore sono A, K, Q, J, 10, 9. Il 9 non e una cartina. La piu alta delle cartine e l'8, che non promette niente. Se volete attaccare da K9754, la carta e il 4. Da 97542, la carta e il 9. Da Q10865, la carta e il 5.",
        },
        {
          type: "quiz",
          content:
            "Da K9754 nel colore scelto per l'attacco, quale carta giocate?",
          quizType: "multiple-choice",
          options: ["K", "9", "4", "7"],
          correctAnswer: 2,
          explanation:
            "Si attacca con il 4 (la piu piccola delle cartine) per dire al compagno 'ho almeno un onore in questo colore, prendi e torna'. Il K e il 9 promettono l'inferiore e non vanno giocati in busso.",
        },
      ],
    },
    {
      id: "Q7-2",
      title: "L'attacco nel colore del compagno",
      icon: "🤝",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Quando si attacca in un colore che il compagno ha dichiarato, il Busso scompare. Si attacca 'in conto': da quante carte stiamo attaccando, non se ho l'onore o no.",
        },
        {
          type: "rule",
          content:
            "CON 2, 4, 6 CARTE SI SCEGLIE UNA CARTA ALTA (cui seguira una piu bassa). CON 1, 3, 5 CARTE SI SCEGLIE LA PIU PICCOLA, A PRESCINDERE DALLA PRESENZA O MENO DI ONORI.",
        },
        {
          type: "example",
          content:
            "Esempi: da 84 si attacca con l'8. Da J4 si attacca con il J. Da Q762 si attacca con il 7. Da K93 si attacca con il 3. Da 8752 si attacca con il 7. Da 963 si attacca con il 3.",
        },
        {
          type: "quiz",
          content:
            "Il compagno ha dichiarato cuori. Avete ♥Q762. Quale carta attaccate?",
          quizType: "multiple-choice",
          options: ["Q", "7", "2", "6"],
          correctAnswer: 1,
          explanation:
            "Con 4 carte (numero pari) si sceglie una carta alta: il 7. La Q non va giocata perche stiamo attaccando 'in conto' (mostrando la parita) non in busso.",
        },
      ],
    },
    {
      id: "Q7-3",
      title: "Il segnale del gradimento",
      icon: "👍",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Il segnale del gradimento entra in azione quando un difensore non e impegnato nella presa e le sue carte possono essere usate per mandare messaggi al compagno: 'il colore che hai mosso mi piace, continua' oppure 'non ho interesse alla continuazione'.",
        },
        {
          type: "rule",
          content:
            "In Italia esistono due stili: il Pari-Dispari (la carta dispari mostra gradimento) e il Basso-Alto (la carta bassa mostra gradimento). Quando volete mostrare gradimento, giocate la prima carta che incontrate partendo dal lato del gradimento del vostro display.",
        },
        {
          type: "text",
          content:
            "Precisazioni: a Senza il gradimento si da solo in presenza di una carta equivalente alla sequenza o di un onore. Nei contratti a colore, una carta di invito puo provenire da doubleton per segnalare la possibilita del taglio.",
        },
        {
          type: "quiz",
          content:
            "Con il sistema Pari-Dispari, per mostrare gradimento giocate...",
          quizType: "multiple-choice",
          options: [
            "Una carta pari (2, 4, 6, 8)",
            "Una carta dispari (3, 5, 7, 9)",
            "La piu alta possibile",
            "La piu bassa possibile",
          ],
          correctAnswer: 1,
          explanation:
            "Nel Pari-Dispari, la carta dispari mostra gradimento. Il 9 e la meno equivoca per mostrare gradimento, il 2 la piu lampante per mostrare sgradimento.",
        },
      ],
    },
    {
      id: "Q7-4",
      title: "Il primo scarto all'italiana",
      icon: "🇮🇹",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Quando un difensore si ritrova a dover SCARTARE per la prima volta, la scelta e piu ampia che col gradimento: puo scegliere tra due o tre colori. Il primo scarto segue la regola: DISPARI CHIAMA E PARI RIFIUTA.",
        },
        {
          type: "rule",
          content:
            "QUANDO UN DIFENSORE SCARTA: puo MOSTRARE VALORI in un seme scartando una carta DISPARI, o puo NEGARE VALORI in un seme scartando una carta PARI. Al primo scarto: dispari chiama e pari rifiuta!",
        },
        {
          type: "example",
          content:
            "Est deve scartare con lo scarto: chiama dove vi conviene, non dove avete le carte piu alte. Invitate il compagno a muovere FIORI: scartate le carte piu alte dispari di fiori. E se non aveste dispari di fiori? Otterreste lo stesso risultato scartando una PARI di quadri (negando quadri).",
        },
        {
          type: "quiz",
          content:
            "Al primo scarto, volete che il compagno giochi quadri. Avete ♦J932. Quale carta scartate?",
          quizType: "multiple-choice",
          options: ["♦2 (la piu bassa)", "♦J (la piu alta)", "♦9 (dispari alta)", "♦3 (dispari bassa)"],
          correctAnswer: 2,
          explanation:
            "Scartate il 9♦ (dispari = chiama). Al primo scarto all'italiana, una carta dispari mostra valori e chiama nel colore scartato. Il 9 e la piu inequivocabile.",
        },
      ],
    },
  ],
};

const lezione9: QuadriLesson = {
  id: 9,
  title: "Ricevere l'attacco",
  icon: "🎪",
  description:
    "Deduzioni sulla carta d'attacco, lisciare l'attacco nei contratti a colore e a SA.",
  smazzateIds: ["Q9-1", "Q9-2", "Q9-3", "Q9-4"],
  modules: [
    {
      id: "Q9-1",
      title: "Deduzioni sulla carta di attacco",
      icon: "🔎",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Nei contratti ad atout la scelta di attacco dell'avversario puo esser motivata anche dalla ricerca di un taglio. Un attacco di onore secondo e frequente, quindi per il giocante aumentano le difficolta per individuare la disposizione delle carte mancanti.",
        },
        {
          type: "rule",
          content:
            "Nessun giocatore attacca sotto asso contro un contratto ad atout: se l'Asso vi manca, date per scontato che sia in mano all'altro difensore.",
        },
        {
          type: "example",
          content:
            "Se subodorate un taglio, provate ad alzare un po' di nebbia: giocate carte false, come un onore alto che non vi costa nulla, per costruire un'illusione verosimile per il difensore che puo dare il taglio all'altro.",
        },
        {
          type: "quiz",
          content:
            "In un contratto ad atout, l'avversario attacca sotto un colore in cui non vedete l'Asso. Dove si trova l'Asso?",
          quizType: "multiple-choice",
          options: [
            "In mano a chi ha attaccato",
            "In mano al compagno di chi ha attaccato",
            "Non si puo sapere",
            "E stato scartato",
          ],
          correctAnswer: 1,
          explanation:
            "Nessun giocatore attacca sotto asso contro un contratto ad atout. L'Asso e sicuramente nell'altra mano difensiva.",
        },
      ],
    },
    {
      id: "Q9-2",
      title: "Lisciare l'attacco a colore",
      icon: "🃏",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Lisciare l'attacco nei contratti a colore serve sia per la specifica figura di carte che abbiamo nel colore, sia a volte per l'intero piano di gioco. Quando supponete che l'attacco venga da KQ, lisciando il K mettete Ovest in condizione di non poter proseguire, e conservate il controllo.",
        },
        {
          type: "example",
          content:
            "Con ♦654 al morto, ♦K in attacco da Ovest, e ♦AJ3 in mano: lisciando il K mettete Ovest in condizione di non poter proseguire, e conservate il controllo.",
        },
        {
          type: "rule",
          content:
            "Nei contratti a colore puo esserci convenienza a lisciare l'attacco per tagliare i collegamenti tra gli avversari, e impedire che vada in presa un difensore che potrebbe fare un ritorno pericoloso (un onore sotto impasse).",
        },
        {
          type: "quiz",
          content:
            "A 4♠ con ♦AJ3 in mano, l'attacco e ♦K. Conviene lisciare?",
          quizType: "true-false",
          correctAnswer: "true",
          explanation:
            "Si! Lisciando il K, Ovest (che ha KQ) non potra proseguire senza darvi la presa con l'Asso. Se rovesciate gli onori, se ha KQ potrebbe darvi problemi al secondo giro. Conservate il controllo per i tempi migliori.",
        },
      ],
    },
    {
      id: "Q9-3",
      title: "Prima di chiamare dal morto",
      icon: "🧠",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Prima di 'chiamare' la carta dal morto fate le opportune deduzioni sia in base alla carta d'attacco, sia in base alla licita. Ponetevi sempre delle domande: da quale figura di carte puo venire? Mi conviene prendere o lisciare? Devo fare dei tagli o battere atout?",
        },
        {
          type: "rule",
          content:
            "Ricordate che: nessun giocatore attacca sotto asso ad atout. Se pensate ad un attacco per il taglio, giocate carte 'false'. Non e utile sprecare onori lunghi del morto. Se l'attacco vi pone la scelta di un impasse, spesso e opportuno rinunciarci.",
        },
        {
          type: "tip",
          content:
            "Spesso la dichiarazione ci aiuta: se l'avversario ha aperto o intervenuto, ricordatevi la sua mano probabile! Licita e gioco sono strettamente connessi.",
        },
        {
          type: "quiz",
          content:
            "In un contratto ad atout, se l'attacco vi pone la scelta di un impasse con pochissime chance...",
          quizType: "multiple-choice",
          options: [
            "Fate sempre l'impasse",
            "Spesso e opportuno rinunciarci",
            "Prendete sempre con l'Asso",
            "Lisciate sempre",
          ],
          correctAnswer: 1,
          explanation:
            "Se l'attacco vi pone la scelta di un impasse che ha pochissime chance, puo essere conveniente rinunciarci. Prendete d'Asso, battete atout, e poi cedete le prese che dovete cedere.",
        },
      ],
    },
    {
      id: "Q9-4",
      title: "Il piano di gioco alla prima presa",
      icon: "📝",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Il problema delle comunicazioni e importantissimo e richiede di prevedere fin dall'inizio le mosse successive, anziche iniziare a pensare dopo la prima presa. E indispensabile fare il 'piano di gioco' e verificare eventuali collegamenti e rientri necessari.",
        },
        {
          type: "rule",
          content:
            "Non sprecate mai onori lunghi del morto quando e assolutamente certo che non vinceranno la presa e non avete nulla da affrancare. Un onore lungo, se lo lasciate dov'e, obbliga almeno uno degli avversari a non potersi muovere nel colore.",
        },
        {
          type: "tip",
          content:
            "E' possibile lisciare per tagliare i collegamenti agli avversari nei contratti a colore. Il taglio avverra grazie alle Cuori stesse, che comunicano ancora.",
        },
        {
          type: "quiz",
          content:
            "Al primo attacco in un contratto ad atout, la cosa piu importante e...",
          quizType: "multiple-choice",
          options: [
            "Giocare velocemente",
            "Fare il piano di gioco completo",
            "Battere subito atout",
            "Incassare subito le vincenti",
          ],
          correctAnswer: 1,
          explanation:
            "E indispensabile fare il piano di gioco PRIMA di chiamare dal morto. Contate le prese, identificate i pericoli, verificate i collegamenti e i rientri. Solo poi giocate.",
        },
      ],
    },
  ],
};

const lezione11: QuadriLesson = {
  id: 11,
  title: "Controgioco: ragionare e dedurre",
  icon: "🧩",
  description:
    "Ricordare la dichiarazione, analizzare la prima presa, capire il piano del giocante e giocare attivamente.",
  smazzateIds: ["Q11-1", "Q11-2", "Q11-3", "Q11-4"],
  modules: [
    {
      id: "Q11-1",
      title: "Le basi del controgioco",
      icon: "🧱",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Per effettuare un buon controgioco bisogna: girare la testa per guardare il morto, ricordare la dichiarazione, contare i punti e le lunghezze delle mani nascoste, fare deduzioni sulle carte giocate nella presa, guardare le carte del compagno, e non intervenire a colore in modo scriteriato.",
        },
        {
          type: "rule",
          content:
            "NON E' POSSIBILE ATTUARE UN BUON CONTROGIOCO SE: non si gira la testa per guardare il morto, non ci si ricorda la dichiarazione, non si contano i punti e le lunghezze, non si fanno deduzioni, non si guardano le carte del compagno.",
        },
        {
          type: "tip",
          content:
            "Ricordatevi la dichiarazione! E' sempre l'indizio fondamentale: e in base alla dichiarazione che si cerca di ricostruire la distribuzione del Giocante e gli onori che puo avere.",
        },
        {
          type: "quiz",
          content:
            "Per un buon controgioco, la prima cosa da fare quando il morto viene esposto e...",
          quizType: "multiple-choice",
          options: [
            "Giocare velocemente",
            "Guardare il morto e ricordare la dichiarazione",
            "Contare solo i propri punti",
            "Scegliere subito il colore da attaccare",
          ],
          correctAnswer: 1,
          explanation:
            "Il primo passo e guardare il morto e ricordare la dichiarazione. Da queste informazioni si deducono distribuzione e onori del giocante, e si imposta la strategia difensiva.",
        },
      ],
    },
    {
      id: "Q11-2",
      title: "Analizzare la prima presa",
      icon: "🔬",
      xp: 50,
      content: [
        {
          type: "text",
          content:
            "Le carte della prima presa sono sempre illuminanti: evitate di coprire le carte ai cento all'ora. Le deduzioni non sono difficili quando avete le carte in vista, ma diventano faticose se vi ritrovate a doverci pensare tre o quattro prese dopo.",
        },
        {
          type: "rule",
          content:
            "SE SIETE IN PRESA E AVETE UNA VINCENTE DA INCASSARE CHE POTREBBE AFFRANCARE CARTE AL GIOCANTE... INCASSATELA SOLO SE E' LA PRESA DEL DOWN!",
        },
        {
          type: "example",
          content:
            "L'attacco e Asso di fiori. Est risponde con il 2 e Sud con il 3. Sapete che il 2 nega interesse. Proseguite con il K di Fiori! Sapete che la Dama e in Sud e che Est non taglia. Se Sud ha Qx di fiori, state per affrancarsi il J del morto.",
        },
        {
          type: "quiz",
          content:
            "Avete un colore capeggiato da AK in mano: attaccando con l'Asso, il compagno vi segnala sgradimento. Cosa fate?",
          quizType: "multiple-choice",
          options: [
            "Proseguite comunque con il K",
            "Cambiate colore come chiede il compagno",
            "Giocate una terza carta nello stesso colore",
            "Passate ad atout",
          ],
          correctAnswer: 1,
          explanation:
            "Avere AK vi costringe a prendere al primo colpo, ma il segnale di sgradimento dice 'cerca prese da un'altra parte'. Non continuate: cambiate colore seguendo le indicazioni del compagno.",
        },
      ],
    },
    {
      id: "Q11-3",
      title: "Capire il piano del giocante",
      icon: "🕵️",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Cercate di capire il piano di gioco del Giocante: solo cosi potrete cercare di ostacolarlo. Contate le prese del giocante come fa lui, provateci anche voi. E se vi rendete conto che ha il contratto in tasca, non arrendetevi: giocate attivamente e non pigramente.",
        },
        {
          type: "rule",
          content:
            "Se il contratto sembra corazzato, non fate giocate pigre e automatiche. Contate le prese del giocante. Se sono sufficienti, cercate mosse attive. A volte una difesa aggressiva e l'unica chance.",
        },
        {
          type: "example",
          content:
            "Sud gioca 3NT dopo 1♣-1♦-1NT-3NT. Attacco Q♥. Est risponde con il 2. Sud prende con l'Asso e gioca il K♣. Siete in presa. Sud ha verosimilmente ♥AKx, ♣KQxx. Tornate a cuori: al 2 di Est: 'cuori non ha' e un'informazione preziosa. Sud ha 12 punti certi: non ha l'Asso di Picche. Giocate piccola picche per l'Asso di Est!",
        },
        {
          type: "quiz",
          content:
            "Il compagno muove una piccola chiedendo un ritorno. Ma voi non avete carte nel colore richiesto. Cosa fate?",
          quizType: "multiple-choice",
          options: [
            "Giocate un altro colore a caso",
            "Rispettate il linguaggio di controgioco: cercate il colore piu verosimile dal morto",
            "Battete atout",
            "Non importa, giocate qualunque cosa",
          ],
          correctAnswer: 1,
          explanation:
            "Rispettate i codici del linguaggio di controgioco. Se non potete dare il ritorno chiesto, cercate il colore piu logico guardando il morto. Una carta di rifiuto chiede comunque un cambio di colore!",
        },
      ],
    },
    {
      id: "Q11-4",
      title: "Evitare il taglio e scarto",
      icon: "🚫",
      xp: 60,
      content: [
        {
          type: "text",
          content:
            "Il 'taglio e scarto' e un errore difensivo grave: giocate un colore in cui il morto presenta il vuoto, il giocante taglia da una parte e scarta una perdente dall'altra. Ottiene un allungamento di taglio che non era in grado di produrre da solo.",
        },
        {
          type: "rule",
          content:
            "NON GIOCATE COLORI IN CUI IL MORTO PRESENTA IL VUOTO SE NON AVETE LA CERTEZZA CHE IL GIOCANTE POSSIEDE ANCORA ALMENO UNA CARTA! Dare taglio e scarto e quasi sempre fatale.",
        },
        {
          type: "tip",
          content:
            "3 consigli per una buona difesa: 1) CONTARE i punti e le lunghezze dei colori nelle 26 carte che vedete. 2) INTERPRETARE correttamente i segnali difensivi del compagno. 3) RICORDARSI delle licite avversarie e di quelle del compagno. Correlare queste 3 azioni per ottenere dati certi.",
        },
        {
          type: "quiz",
          content:
            "Se non si ottengono certezze sul controgioco, si gioca...",
          quizType: "multiple-choice",
          options: [
            "Passivamente, senza rischiare",
            "'Come se': ipotizzando situazioni e agendo come se fossero certe",
            "A caso, sperando nel meglio",
            "Sempre nello stesso colore",
          ],
          correctAnswer: 1,
          explanation:
            "SE NON SI OTTENGONO CERTEZZE... SI GIOCA 'COME SE'... IPOTIZZANDO DETERMINATE SITUAZIONI E AGENDO COME SE FOSSERO CERTE. E il principio fondamentale del controgioco ragionato.",
        },
      ],
    },
  ],
};

// ============================================================
// Export: Organize into 4 Worlds
// ============================================================

export const quadriWorlds: QuadriWorld[] = [
  {
    id: "quadri-w1",
    name: "Gioco della carta",
    subtitle: "Tecniche di gioco a SA e ad atout",
    icon: "🃏",
    gradient: "from-blue-500 to-cyan-500",
    lessons: [lezione1, lezione3, lezione5],
  },
  {
    id: "quadri-w2",
    name: "Valutazione e dichiarazione",
    subtitle: "Apertura, capitanato e livelli alti",
    icon: "⚖️",
    gradient: "from-orange-500 to-amber-500",
    lessons: [lezione2, lezione4, lezione6],
  },
  {
    id: "quadri-w3",
    name: "Dichiarazione avanzata",
    subtitle: "Manche, competizione e interventi",
    icon: "🎯",
    gradient: "from-purple-500 to-pink-500",
    lessons: [lezione8, lezione10, lezione12],
  },
  {
    id: "quadri-w4",
    name: "Difesa e controgioco",
    subtitle: "Attacchi, segnali e ragionamento difensivo",
    icon: "🛡️",
    gradient: "from-green-500 to-emerald-500",
    lessons: [lezione7, lezione9, lezione11],
  },
];

// Helper to get all lessons flat
export const allQuadriLessons: QuadriLesson[] = quadriWorlds.flatMap(
  (w) => w.lessons
);

// Helper to find a lesson by id
export function getQuadriLesson(id: number): QuadriLesson | undefined {
  return allQuadriLessons.find((l) => l.id === id);
}

// Helper to find a world by lesson id
export function getQuadriWorldForLesson(
  lessonId: number
): QuadriWorld | undefined {
  return quadriWorlds.find((w) => w.lessons.some((l) => l.id === lessonId));
}

// ============================================================
// Adapter: Convert to shared types for courses.ts
// ============================================================

import type {
  World,
  Lesson,
  LessonModule,
  ContentBlock,
} from "./lessons";

const worldIdMap: Record<string, number> = {
  "quadri-w1": 30,
  "quadri-w2": 31,
  "quadri-w3": 32,
  "quadri-w4": 33,
};

function adaptContentBlock(qcb: QuadriContentBlock): ContentBlock {
  // Map quizType to shared ContentBlock type
  if (qcb.type === "quiz" && qcb.quizType) {
    const typeMap: Record<string, ContentBlock["type"]> = {
      "multiple-choice": "quiz",
      "true-false": "true-false",
      "card-select": "card-select",
      "hand-eval": "hand-eval",
      "bid-select": "bid-select",
    };
    return {
      type: typeMap[qcb.quizType] || "quiz",
      content: qcb.content,
      cards: qcb.cards,
      options: qcb.options,
      correctAnswer: typeof qcb.correctAnswer === "number" ? qcb.correctAnswer : undefined,
      correctValue: qcb.correctValue,
      explanation: qcb.explanation,
    };
  }
  return {
    type: qcb.type as ContentBlock["type"],
    content: qcb.content,
    cards: qcb.cards,
    options: qcb.options,
    explanation: qcb.explanation,
  };
}

function adaptModule(qm: QuadriModule): LessonModule {
  return {
    id: qm.id,
    title: qm.title,
    duration: "5",
    type: qm.content.some((c) => c.type === "quiz") ? "quiz" : "theory",
    xpReward: qm.xp,
    content: qm.content.map(adaptContentBlock),
  };
}

function adaptLesson(ql: QuadriLesson, wId: number): Lesson {
  return {
    id: ql.id,
    worldId: wId,
    title: ql.title,
    subtitle: ql.description,
    icon: ql.icon,
    modules: ql.modules.map(adaptModule),
    smazzateIds: ql.smazzateIds,
  };
}

// Exported adapted worlds/lessons for courses.ts
export const quadriWorldsAdapted: World[] = quadriWorlds.map((qw) => {
  const numId = worldIdMap[qw.id] ?? 30;
  return {
    id: numId,
    name: qw.name,
    subtitle: qw.subtitle,
    icon: qw.icon,
    gradient: qw.gradient,
    iconBg: "bg-orange-100",
    lessons: qw.lessons.map((l) => adaptLesson(l, numId)),
  };
});

export const quadriLessons: Lesson[] = quadriWorldsAdapted.flatMap(
  (w) => w.lessons
);
