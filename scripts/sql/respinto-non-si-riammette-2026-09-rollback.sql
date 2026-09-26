-- Rollback di respinto-non-si-riammette-2026-09.sql.
--
-- Simmetrico: rimette la policy come stava prima, senza toccare nessuna riga.
-- ATTENZIONE: rieseguirlo riapre la strada al respinto che si riammette da
-- solo. Va usato solo se la policy nuova blocca un caso legittimo che non
-- avevamo previsto — e in quel caso la correzione giusta è restringere la
-- condizione, non toglierla.

drop policy if exists "Instructor or self can update membership" on public.class_members;
create policy "Instructor or self can update membership"
  on public.class_members for update
  using (
    (student_id = auth.uid()) or is_instructor_of_class(class_id)
  )
  with check (
    is_instructor_of_class(class_id)
    or ((student_id = auth.uid()) and (status = 'removed'))
  );
