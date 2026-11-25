-- ============================================================================
-- «Trova l'errore»: cinque esercizi con la risposta o la spiegazione sbagliata
-- ============================================================================
--
-- 26/11/2026. Revisione dei giochi dopo la segnalazione di un insegnante su
-- «Che contratto giocate?». Solo contenuti: nessuna modifica di schema.
-- IDEMPOTENTE: si può rieseguire (imposta valori, non li somma).
--
--  #5  ♦AKQ73 contro ♦J2 non si blocca: dopo A-K-Q il morto è ancora in presa
--      e incassa 7 e 3. Il gioco segnava un errore che non c'era. Ora il
--      blocco è vero: ♦AQ1073 al morto senza ingressi contro ♦K4.
--  #16 Ovest siede alla DESTRA del morto, non alla sinistra.
--  #25 Con il K al morto e AJ in terza mano si gioca il J (impasse contro il
--      morto): il gioco segnava giusto «vincere con l'Asso».
--  #29 8 fiori in linea: gli avversari ne hanno 5, «4-2» è impossibile; il
--      colpo in bianco serve con le fiori 3-2.
--  #31 Il colpo di lisciare l'Asso aveva senso solo a Senza: riscritto a 3SA,
--      dove Ovest liscia il primo giro e prende il secondo.
-- ============================================================================

update public.trova_errore_scenarios set
  situation = $t$Contratto 3SA, il morto non ha altri ingressi. Al morto: ♦AQ1073. In mano: ♦K4. Il dichiarante gioca il 4 per l'Asso del morto, poi piccola dal morto per il Re. Ora è in mano, e al morto restano ♦Q107 irraggiungibili. Qual è l'errore?$t$,
  cards = $t$Morto: ♦AQ1073 (nessun altro ingresso)  Mano: ♦K4$t$,
  error_description = $t$Ha giocato prima l'onore del lato lungo: doveva sbloccare il Re dal lato corto$t$,
  options = array[
    $t$Doveva giocare per primo il Re dal lato corto, poi il 4 verso A-Q$t$,
    $t$Doveva fare l'impasse$t$,
    $t$Doveva giocare le quadri dopo i fiori$t$,
    $t$Non c'è errore, il colore era bloccato comunque$t$
  ],
  correct_answer = 0,
  explanation = $t$Regola fondamentale: si giocano per primi gli onori del LATO CORTO. Re dalla mano (piccola dal morto), poi il 4 per A-Q: si resta al morto e, con le quadri 3-2, si incassano cinque prese. Giocando prima l'Asso del morto, il Re vince il secondo giro in mano e la Donna con le quadri franche resta al morto senza un ingresso per raggiungerla.$t$,
  situation_en = $t$Contract 3NT, dummy has no other entry. In the dummy: ♦AQ1073. In hand: ♦K4. Declarer plays the 4 to dummy's Ace, then a low card from dummy to the King. Now declarer is in hand, and dummy's ♦Q107 are stranded. What is the mistake?$t$,
  error_description_en = $t$Played the long side's honor first: should have unblocked the King from the short side.$t$,
  explanation_en = $t$Fundamental rule: play the honors from the SHORT SIDE first. King from hand (low from dummy), then the 4 to the A-Q: you stay in dummy and, with diamonds 3-2, take five tricks. Playing dummy's Ace first, the King wins the second round in hand and the Queen with the established diamonds stays in dummy with no entry to reach it.$t$,
  updated_at = now()
where id = 5;

update public.trova_errore_scenarios set
  explanation = $t$L'impasse si fa giocando VERSO la forchetta (AQ), non DALLA forchetta. La manovra corretta: gioca il 3 dalla mano. Ovest gioca prima del morto: se ha il Re, non può prendere senza regalarvi la Donna; voi inserite la Q e vince. Se giocate la Q dal morto, chi ha il Re la prende comunque: Est la copre, oppure Ovest la supera. Così l'impasse non riesce mai.$t$,
  explanation_en = $t$The finesse is taken by playing TOWARD the tenace (AQ), not FROM it. The correct maneuver: lead the 3 from your hand. West plays before dummy: if West holds the King, they cannot win without giving you the Queen; you insert the Q and it wins. If you lead the Q from dummy, whoever holds the King takes it anyway: East covers, or West overtakes. That way the finesse never works.$t$,
  updated_at = now()
where id = 16;

update public.trova_errore_scenarios set
  situation = $t$Sud gioca 3SA. Ovest attacca il 5♥. Al morto ♥K63. Est ha ♥AJ92. Il morto gioca il 3. Est gioca il J♥. Qual è l'errore?$t$,
  error_description = $t$Nessuno: con il Re al morto, il J è l'impasse contro il morto$t$,
  correct_answer = 0,
  explanation = $t$«Terzo di mano gioca alto» ha un'eccezione importante: quando l'onore che temete è AL MORTO e voi lo avete «chiuso» in forchetta. Con A-J dietro il K del morto, Est gioca il J. Se Ovest ha attaccato da Q, il J vince e il K del morto resta preso fra A e la Donna del compagno. Se il dichiarante ha la Q prende col Q, ma il K del morto resta intrappolato sotto l'Asso di Est. Vincendo subito con l'Asso, invece, il K del morto diventa una presa sicura per il dichiarante.$t$,
  situation_en = $t$South is playing 3NT. West leads the 5♥. In the dummy ♥K63. East holds ♥AJ92. Dummy plays the 3. East plays the J♥. What is the mistake?$t$,
  error_description_en = $t$None: with the King in dummy, the J is a finesse against dummy.$t$,
  explanation_en = $t$"Third hand high" has an important exception: when the honor you fear is IN DUMMY and you sit over it with a tenace. With A-J behind dummy's K, East plays the J. If West led from the Q, the J wins and dummy's K stays trapped between the A and partner's Queen. If declarer holds the Q they win it, but dummy's K stays trapped under East's Ace. Winning at once with the Ace instead turns dummy's K into a sure trick for declarer.$t$,
  updated_at = now()
where id = 25;

update public.trova_errore_scenarios set
  situation = $t$Contratto 3SA. Il dichiarante ha 7 vincenti e deve trovarne 2. Il morto non ha altri ingressi. Al morto: ♣A96543. In mano: ♣K2. Gioca A♣, K♣, poi il terzo giro. Le fiori sono 3-2: al terzo giro ne resta fuori una, e dalla mano non c'è più modo di tornare al morto. Qual è l'errore?$t$,
  explanation = $t$Con ♣A96543 al morto e ♣K2 in mano, il lato corto ha solo 2 carte. Giocando A e K si usano entrambe le carte della mano. Con le fiori 3-2, dopo due giri ne resta fuori una e non si hanno più carte dalla mano per raggiungere il morto. La tecnica del 'colpo in bianco' (duck): giocare il 2 dalla mano e piccola dal morto, cedendo la prima presa. Poi K dalla mano sorpassato dall'A del morto: le fiori restanti sono franche e raggiungibili.$t$,
  situation_en = $t$Contract 3NT. The declarer has 7 winners and needs to find 2 more. Dummy has no other entry. In the dummy: ♣A96543. In hand: ♣K2. Declarer plays ♣A, ♣K, then the third round. Clubs are 3-2: after two rounds one is still out, and there is no way back from hand to dummy. What is the mistake?$t$,
  error_description_en = $t$Did not duck a round to keep communication with dummy.$t$,
  explanation_en = $t$With ♣A96543 in the dummy and ♣K2 in hand, the short side has only 2 cards. Playing the A and K uses both cards from the hand. With clubs 3-2, after two rounds one is still out and there are no more cards in hand to reach the dummy. The technique of 'ducking': play the 2 from hand and a small card from the dummy, conceding the first trick. Then the K from hand overtaken by dummy's A: the remaining clubs are established and reachable.$t$,
  updated_at = now()
where id = 29;

update public.trova_errore_scenarios set
  situation = $t$Sud gioca 3SA. Al morto ♦KQJ109 senza altri ingressi; Sud ha ♦32. Ovest ha ♦A84. Sud gioca il 2 verso il morto e Ovest prende subito con l'Asso. Qual è l'errore?$t$,
  cards = $t$Ovest: ♦A84  Morto: ♦KQJ109 (nessun altro ingresso)  Sud: ♦32$t$,
  error_description = $t$Ha preso l'Asso troppo presto: doveva lisciare il primo giro$t$,
  options = array[
    $t$Corretto prendere subito l'Asso$t$,
    $t$Doveva lisciare il primo giro e prendere il secondo, quando Sud non ha più quadri$t$,
    $t$Doveva lisciare tutti i giri$t$,
    $t$Non importa quando prende l'Asso$t$
  ],
  correct_answer = 1,
  explanation = $t$Il morto ha cinque quadri ma nessun altro ingresso: l'unico modo di raggiungerlo sono le quadri di Sud. Se Ovest prende subito, a Sud resta il 3 per tornare al morto e incassare quattro quadri. Se Ovest liscia il primo giro e prende il secondo, Sud non ha più quadri e le tre quadri franche del morto non si raggiungono più: una presa sola invece di quattro. Lisciando tutti i giri, invece, Sud ne farebbe due. Il conto del compagno (alto-basso = pari) aiuta a capire quando prendere.$t$,
  situation_en = $t$South is playing 3NT. Dummy holds ♦KQJ109 with no other entry; South has ♦32. West holds ♦A84. South leads the 2 toward dummy and West wins the Ace at once. What is the mistake?$t$,
  error_description_en = $t$Took the Ace too early: should have ducked the first round.$t$,
  explanation_en = $t$Dummy has five diamonds but no other entry: the only way to reach it is with South's diamonds. If West wins at once, South keeps the 3 to get back to dummy and cash four diamonds. If West ducks the first round and wins the second, South has no diamonds left and dummy's three established diamonds can no longer be reached: one trick instead of four. Ducking every round, South would make two. Partner's count signal (high-low = even) helps you know when to win.$t$,
  updated_at = now()
where id = 31;

insert into public.script_applicati (nome) values ('correzioni-trova-errore-2026-11.sql')
on conflict (nome) do nothing;
