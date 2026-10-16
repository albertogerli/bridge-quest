-- ============================================================================
-- BridgeLab: il torneo di licita lo gestisce il server — parte 2 di 2
--
-- DA APPLICARE su Supabase -> SQL Editor, DOPO la parte 1 E DOPO il deploy
-- del codice che usa `/api/licita/torneo`. Idempotente.
--
-- Toglie al browser tre accessi che il nuovo codice non usa più, e che
-- permettevano di vincere un torneo senza dichiarare:
--
--   1. `mani_generate` era leggibile per intero da ogni utente con un
--      account (policy «Mani leggibili»). Con `torneo_mani`, che dice quali
--      mani sono di quale torneo, due richieste bastavano per avere TUTTE le
--      carte e la tabella double dummy di tutte le mani del torneo, prima di
--      cominciare. L'app non legge mai la tabella direttamente: le letture
--      passano da funzioni `security definer`, tranne `mano_da_fare`, che qui
--      lo diventa con lo stesso identico corpo.
--   2. `torneo_mano` consegnava al browser le quattro mani della smazzata in
--      corso. Adesso le legge solo il server (`torneo_mano_per`).
--   3. `risultati_torneo` accettava dal browser contratto, punteggio e
--      stelle. Adesso li scrive solo il server, che li calcola dall'asta.
--
-- COME SI TORNA INDIETRO, se servisse: ricreare la policy «Mani leggibili»
-- (`for select to authenticated using (true)`), ridare `execute` su
-- `torneo_mano` e `insert` su `risultati_torneo` ad `authenticated`, con la
-- policy «Ognuno scrive il proprio risultato di torneo» com'era in
-- `tornei-licita-2026-08.sql`.
-- ============================================================================

begin;

-- 1. Le mani non si leggono più in blocco. ---------------------------------
-- `mano_da_fare` era `security invoker`: senza la policy non vedrebbe più
-- niente. Diventa `definer` con lo stesso corpo — filtra già per
-- `auth.uid()` e restituisce una mano sola, come prima.
create or replace function public.mano_da_fare(p_slug text default null)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT to_jsonb(m) || jsonb_build_object(
    'scenario', CASE WHEN s.id IS NULL THEN NULL ELSE to_jsonb(s) - 'vincoli' END)
  FROM public.mani_generate m
  LEFT JOIN public.scenari s ON s.id = m.scenario_id
  WHERE (p_slug IS NULL OR s.slug = p_slug)
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.risultati_mano r
      WHERE r.mano_id = m.id AND r.user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.torneo_mani tm
      JOIN public.tornei t ON t.id = tm.torneo_id
      WHERE tm.mano_id = m.id AND now() < t.chiude_at
    )
  ORDER BY random()
  LIMIT 1;
$function$;

revoke execute on function public.mano_da_fare(text) from public, anon;
grant execute on function public.mano_da_fare(text) to authenticated;

drop policy if exists "Mani leggibili" on public.mani_generate;

-- 2. La mano del torneo arriva solo al server. ------------------------------
revoke execute on function public.torneo_mano(uuid) from authenticated;

-- 3. Il risultato lo scrive solo il server. ---------------------------------
drop policy if exists "Ognuno scrive il proprio risultato di torneo" on public.risultati_torneo;
revoke insert on table public.risultati_torneo from authenticated;

insert into public.script_applicati (nome) values ('torneo-licita-server-2-2026-10.sql')
on conflict (nome) do nothing;

commit;
