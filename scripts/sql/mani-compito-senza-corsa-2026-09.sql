-- Assegnare mani a una lezione diventa una sola scrittura atomica.
--
-- Dipendenze: assignments, classes.soluzioni_predefinite, indice unico
--   assignments_una_lezione_per_classe — tutti presenti dalla baseline.
-- Rollback: mani-compito-senza-corsa-2026-09-rollback.sql (elimina la
--   funzione; il client torna a leggere-e-riscrivere, quindi torna anche il
--   difetto — vedi la nota nel rollback).
--
-- IL DIFETTO. `assegnaManiLezione` leggeva le mani già assegnate e riscriveva
-- l'unione. Fra la lettura e la scrittura ci sta un'altra scheda: due
-- insegnanti che assegnano mani alla stessa lezione nello stesso minuto, e il
-- secondo sovrascrive le aggiunte del primo. Nessun errore, nessun segno:
-- semplicemente delle mani assegnate spariscono. Il commento del codice diceva
-- «LA CORSA È GESTITA», ma copriva solo il ramo che CREA il compito (23505);
-- il ramo che lo fa CRESCERE non era coperto affatto.
--
-- LA CORREZIONE. Un solo `insert ... on conflict do update`: l'unione la
-- calcola il database sulla riga che ha davvero in quel momento, non sulla
-- copia che il client aveva letto prima. Sparisce anche il giro del 23505,
-- perché non c'è più niente contro cui sbattere.
--
-- L'ORDINE SI CONSERVA. `with ordinality` più `min(ord)` tiene le mani già
-- assegnate al loro posto e accoda le nuove, invece di rimescolarle: per
-- l'insegnante l'elenco del compito è quello che ha costruito lui, e un
-- riordino silenzioso a ogni aggiunta sarebbe indistinguibile da un errore.
--
-- `soluzioni` SI DECIDE SOLO ALLA NASCITA. Sul ramo di conflitto non si tocca:
-- un compito che esiste ha già la sua scelta, e chi aggiunge mani non deve
-- cambiarla di rimbalzo. Se il chiamante non la passa si prende quella della
-- classe, risolta qui dentro — così il valore non dipende più dal fatto che il
-- chiamante si ricordi di passarlo.
--
-- SECURITY INVOKER (implicito): la funzione NON aggira RLS. Scrive solo chi la
-- policy «Instructor can create/update assignments» lascia scrivere.

create or replace function public.aggiungi_mani_al_compito(
  p_class_id uuid,
  p_lesson_id integer,
  p_titolo text,
  p_smazzate text[],
  p_soluzioni text default null
) returns jsonb
language plpgsql
volatile
set search_path to ''
as $function$
declare
  v_prima text[];
  v_dopo  text[];
begin
  -- `for update` blocca la riga se esiste: l'altra scheda aspetta qui invece
  -- di leggere un valore che sta per diventare vecchio. Serve a far tornare
  -- «aggiunte» esatto; l'unione sarebbe corretta comunque, perché la calcola
  -- il ramo di conflitto qui sotto.
  select smazzata_ids into v_prima
  from public.assignments
  where class_id = p_class_id and lesson_id = p_lesson_id
  for update;

  insert into public.assignments (class_id, lesson_id, title, smazzata_ids, soluzioni)
  values (
    p_class_id, p_lesson_id, p_titolo, coalesce(p_smazzate, '{}'::text[]),
    coalesce(
      p_soluzioni,
      (select c.soluzioni_predefinite from public.classes c where c.id = p_class_id),
      'dopo-il-gioco'
    )
  )
  on conflict (class_id, lesson_id) where lesson_id is not null
  do update set smazzata_ids = (
    select coalesce(array_agg(d.x order by d.ord), '{}'::text[])
    from (
      select u.x, min(u.ord) as ord
      from unnest(assignments.smazzata_ids || excluded.smazzata_ids)
        with ordinality as u(x, ord)
      group by u.x
    ) d
  )
  returning smazzata_ids into v_dopo;

  return jsonb_build_object(
    'totale', to_jsonb(coalesce(v_dopo, '{}'::text[])),
    'aggiunte', to_jsonb(coalesce(
      (select array_agg(s order by o)
         from unnest(coalesce(p_smazzate, '{}'::text[])) with ordinality as n(s, o)
        where not (s = any (coalesce(v_prima, '{}'::text[])))),
      '{}'::text[]
    ))
  );
end
$function$;

revoke all on function public.aggiungi_mani_al_compito(uuid, integer, text, text[], text)
  from public, anon, authenticated, service_role;
grant execute on function public.aggiungi_mani_al_compito(uuid, integer, text, text[], text)
  to authenticated;
grant execute on function public.aggiungi_mani_al_compito(uuid, integer, text, text[], text)
  to service_role;
