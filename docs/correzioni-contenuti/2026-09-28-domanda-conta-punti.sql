-- Eseguito il 28/09/2026 in produzione (i contenuti vivono nel database, vedi CLAUDE.md).
-- Lezione 7, modulo 7-2 «Quando aprire la dichiarazione»: la domanda di tipo
-- hand-eval chiede un NUMERO (correctValue 13), ma il testo diceva
-- «Conta i punti di questa mano. Apriresti?» — segnalato da un controllo esterno.
update lesson_modules
   set content = replace(content::text, 'Conta i punti di questa mano. Apriresti?', 'Conta i punti di questa mano: quanti sono?')::jsonb,
       content_en = replace(content_en::text, 'Count the points in this hand. Would you open?', 'Count the points in this hand: how many are there?')::jsonb,
       updated_at = now()
 where lesson_id = 7 and module_id = '7-2';
