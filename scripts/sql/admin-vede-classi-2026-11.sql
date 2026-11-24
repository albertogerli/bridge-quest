-- ============================================================================
-- BridgeLab: l'amministratore entra in ogni classe come un collega
-- ============================================================================
--
-- 24/11/2026. Per aiutare un insegnante («dove vedo i compiti?») bisogna poter
-- guardare la sua classe. Finora la vedevano solo l'insegnante, i colleghi e
-- gli allievi: l'amministratore no.
--
-- COME. `is_instructor_of_class` risponde sì anche all'amministratore. È il
-- controllo che usano le policy e le funzioni della classe (oltre settanta
-- punti): una modifica sola le apre tutte, invece di inseguirle una per una.
--
-- COSA NON CAMBIA.
-- - L'amministratore non compare fra gli insegnanti: non è in
--   `classe_insegnanti` né in `classes.instructor_id`. Gli insegnanti e gli
--   allievi non vedono che sta guardando; il suo nome compare solo se scrive
--   (chat, commenti).
-- - Le sue classi restano le sue: «Le mie classi» filtra su instructor_id e
--   classe_insegnanti, non su questa funzione.
-- - Eliminare una classe e scegliere chi insegna restano al titolare
--   (`is_owner_of_class`, non toccata).
--
-- DIPENDENZE: `is_admin()` (instructor_portal.sql), `classe_insegnanti`
-- (co-insegnanti-2026-11.sql).
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create or replace function public.is_instructor_of_class(p_class_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1 from classes c
    where c.id = p_class_id and c.instructor_id = auth.uid()
  ) or exists (
    select 1 from classe_insegnanti ci
    where ci.class_id = p_class_id and ci.insegnante_id = auth.uid()
  ) or public.is_admin();
$function$;

-- Registro (vedi registro-script-2026-10.sql).
insert into public.script_applicati (nome) values ('admin-vede-classi-2026-11.sql')
on conflict (nome) do nothing;
