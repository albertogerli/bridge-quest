-- ============================================================================
-- BridgeLab: aste dei tornei di licita conclusi
--
-- DA APPLICARE su Supabase -> SQL Editor. Idempotente.
--
-- OBIETTIVO
--   1. salvare l'asta completa insieme al risultato della mano;
--   2. lasciare la classifica in diretta, ma non mostrare le aste finché il
--      torneo è aperto;
--   3. consentire, a torneo chiuso, di aprire dalla classifica le aste di un
--      altro giocatore;
--   4. conservare un accesso all'ultimo torneo chiuso anche quando il nuovo
--      periodo è già cominciato.
--
-- PERCHÉ LA STESSA TABELLA DEL RISULTATO
-- L'asta e il punteggio devono nascere nella stessa INSERT: due scritture
-- separate potrebbero lasciarne riuscire una sola. La colonna resta nullable
-- perché i risultati anteriori a questa modifica non hanno un'asta ricostruibile.
--
-- SICUREZZA
-- La vecchia policy rendeva leggibili a ogni autenticato tutte le righe grezze
-- del torneo. Non era un problema finché contenevano solo punteggi già esposti
-- dalla classifica; con l'asta permetterebbe invece di leggerla mentre il torneo
-- è ancora aperto. La SELECT diretta diventa quindi solo-proprietario. Le aste
-- altrui passano da una funzione che controlla nel database `chiude_at <= now()`.
-- ============================================================================

alter table public.risultati_torneo
  add column if not exists asta text[];

comment on column public.risultati_torneo.asta is
  'Dichiarazioni in ordine di turno. NULL per i risultati anteriori al salvataggio delle aste.';

-- Un'asta conclusa contiene almeno quattro chiamate (quattro Passo, oppure una
-- dichiarazione e tre Passo). Il tetto impedisce payload arbitrariamente grandi
-- senza imporre qui il regolamento completo, che resta nel motore applicativo.
do $block$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'risultati_torneo_asta_dimensione_check'
      and conrelid = 'public.risultati_torneo'::regclass
  ) then
    alter table public.risultati_torneo
      add constraint risultati_torneo_asta_dimensione_check
      check (
        asta is null
        or (
          array_ndims(asta) = 1
          and cardinality(asta) between 4 and 319
          and array_position(asta, null) is null
        )
      );
  end if;
end
$block$;

create index if not exists tornei_tipo_chiusura_idx
  on public.tornei (tipo, chiude_at desc);

-- I client non devono poter aggiornare, cancellare o leggere risultati altrui.
-- La upsert applicativa usa ON CONFLICT DO NOTHING: bastano INSERT e SELECT.
revoke all on table public.risultati_torneo from anon, authenticated;
grant select, insert on table public.risultati_torneo to authenticated;

drop policy if exists "Risultati del torneo leggibili" on public.risultati_torneo;
drop policy if exists "Ognuno legge il proprio risultato di torneo" on public.risultati_torneo;
create policy "Ognuno legge il proprio risultato di torneo"
  on public.risultati_torneo
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- La classifica resta visibile mentre il torneo è aperto, ma espone solo i
-- campi già mostrati dalla UI. L'identificativo serve esclusivamente al click
-- "Vedi le aste" e non viene stampato a schermo.
create or replace function public.classifica_torneo(
  p_torneo uuid,
  p_quanti int default 50
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select case when (select auth.uid()) is null then null else jsonb_build_object(
    'totale', (
      select count(distinct user_id)
      from public.risultati_torneo
      where torneo_id = p_torneo
    ),
    'mia', (
      select jsonb_build_object(
        'posizione', x.posizione,
        'stelle', x.stelle,
        'mani', x.mani
      )
      from (
        select
          r.user_id,
          rank() over (order by sum(r.stelle) desc, max(r.created_at)) as posizione,
          sum(r.stelle) as stelle,
          count(*) as mani
        from public.risultati_torneo r
        where r.torneo_id = p_torneo
        group by r.user_id
      ) x
      where x.user_id = (select auth.uid())
    ),
    'righe', (
      select coalesce(
        jsonb_agg(y order by (y->>'posizione')::int),
        '[]'::jsonb
      )
      from (
        select jsonb_build_object(
          'posizione', rank() over (order by sum(r.stelle) desc, max(r.created_at)),
          'giocatoreId', r.user_id,
          'haAste', bool_or(r.asta is not null),
          'nome', p.display_name,
          'asd', p.asd_name,
          'stelle', sum(r.stelle),
          'mani', count(*),
          'sonoIo', r.user_id = (select auth.uid())
        ) as y
        from public.risultati_torneo r
        join public.profiles p on p.id = r.user_id
        where r.torneo_id = p_torneo
        group by r.user_id, p.display_name, p.asd_name
        order by sum(r.stelle) desc, max(r.created_at)
        limit greatest(1, least(coalesce(p_quanti, 50), 200))
      ) t
    )
  ) end;
$function$;

revoke execute on function public.classifica_torneo(uuid, int) from public;
revoke execute on function public.classifica_torneo(uuid, int) from anon;
grant execute on function public.classifica_torneo(uuid, int) to authenticated;

-- Il torneo da presentare nello storico. Si sceglie l'ultimo CHIUSO che abbia
-- almeno un'asta realmente salvata: i tornei anteriori alla migrazione non
-- mostrano un archivio vuoto e fuorviante.
create or replace function public.ultimo_torneo_con_aste(p_tipo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select case when (select auth.uid()) is null then null else (
    select jsonb_build_object(
      'id', t.id,
      'tipo', t.tipo,
      'periodo', t.periodo,
      'chiudeAt', t.chiude_at,
      'quante', (select count(*) from public.torneo_mani tm where tm.torneo_id = t.id)
    )
    from public.tornei t
    where t.tipo = p_tipo
      and t.chiude_at <= now()
      and exists (
        select 1
        from public.risultati_torneo r
        where r.torneo_id = t.id
          and r.asta is not null
      )
    order by t.chiude_at desc
    limit 1
  ) end;
$function$;

revoke execute on function public.ultimo_torneo_con_aste(text) from public;
revoke execute on function public.ultimo_torneo_con_aste(text) from anon;
grant execute on function public.ultimo_torneo_con_aste(text) to authenticated;

-- Una sola persona per richiesta: la pagina carica il dettaglio soltanto
-- quando viene aperto, evitando di scaricare le aste di tutta la classifica.
-- Nessuna carta viene restituita: soltanto numero della mano, dealer, asta e
-- risultato già pubblico. Il controllo temporale è qui, non nell'interfaccia.
create or replace function public.aste_giocatore_torneo(
  p_torneo uuid,
  p_giocatore uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select case when (select auth.uid()) is null then null else (
    select jsonb_build_object(
      'giocatore', jsonb_build_object(
        'nome', p.display_name,
        'asd', p.asd_name,
        'sonoIo', p.id = (select auth.uid())
      ),
      'aste', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'numero', tm.numero,
              'dealer', m.dealer,
              'bids', r.asta,
              'contratto', r.contratto,
              'stelle', r.stelle
            )
            order by tm.numero
          ),
          '[]'::jsonb
        )
        from public.risultati_torneo r
        join public.torneo_mani tm
          on tm.torneo_id = r.torneo_id
         and tm.mano_id = r.mano_id
        join public.mani_generate m on m.id = r.mano_id
        where r.torneo_id = p_torneo
          and r.user_id = p_giocatore
          and r.asta is not null
      )
    )
    from public.profiles p
    join public.tornei t on t.id = p_torneo
    where p.id = p_giocatore
      and t.chiude_at <= now()
      and exists (
        select 1
        from public.risultati_torneo r
        where r.torneo_id = p_torneo
          and r.user_id = p_giocatore
          and r.asta is not null
      )
  ) end;
$function$;

revoke execute on function public.aste_giocatore_torneo(uuid, uuid) from public;
revoke execute on function public.aste_giocatore_torneo(uuid, uuid) from anon;
grant execute on function public.aste_giocatore_torneo(uuid, uuid) to authenticated;

comment on function public.ultimo_torneo_con_aste(text) is
  'Ultimo torneo di licita chiuso che contiene almeno un asta salvata.';
comment on function public.aste_giocatore_torneo(uuid, uuid) is
  'Aste di un giocatore, leggibili dagli autenticati soltanto a torneo chiuso.';

-- VERIFICHE DA ESEGUIRE DOPO L'APPLICAZIONE
-- 1. Deve restituire false: il ruolo autenticato non può modificare i risultati.
-- select has_table_privilege('authenticated', 'public.risultati_torneo', 'update,delete');
-- 2. Deve mostrare la nuova policy proprietario.
-- select policyname, cmd, roles, qual from pg_policies
-- where schemaname = 'public' and tablename = 'risultati_torneo';
-- 3. Da utente autenticato, un torneo aperto deve restituire NULL.
-- select public.aste_giocatore_torneo('<torneo-aperto>', '<giocatore>');
