-- Chi è stato respinto non può riammettersi da solo.
--
-- Dipendenze: class_members, is_instructor_of_class() — presenti dalla baseline.
-- Rollback: respinto-non-si-riammette-2026-09-rollback.sql (simmetrico: rimette
-- la policy esatta di prima, nessun dato viene toccato in nessuna delle due
-- direzioni).
--
-- IL DIFETTO. La policy di UPDATE permetteva all'allievo di scrivere
-- `status = 'removed'` sulla PROPRIA riga qualunque fosse lo stato di partenza.
-- Per «esco dalla classe» è giusto. Ma `join_class_by_code` fa rientrare chi è
-- `removed`, e quindi chi era stato RESPINTO aveva la strada completa: si
-- riscriveva `removed`, ridigitava il codice, rientrava. La distinzione fra
-- «respinto dall'insegnante» e «uscito di sua volontà» era aggirabile
-- esattamente da chi la subisce, senza errori e senza che nessuno lo sapesse.
--
-- PERCHÉ IL CONTROLLO VA IN `USING` E NON IN `WITH CHECK`. `WITH CHECK` guarda
-- il valore NUOVO, e il valore nuovo — `removed` — è lecito: è lo stesso che
-- scrive chi esce legittimamente. Quello che non è lecito è la riga di
-- PARTENZA, e la riga di partenza la filtra `USING`. Scritto in `WITH CHECK`
-- il controllo non avrebbe fermato niente.

drop policy if exists "Instructor or self can update membership" on public.class_members;
create policy "Instructor or self can update membership"
  on public.class_members for update
  using (
    is_instructor_of_class(class_id)
    or (student_id = auth.uid() and status <> 'rejected')
  )
  with check (
    is_instructor_of_class(class_id)
    or (student_id = auth.uid() and status = 'removed')
  );
