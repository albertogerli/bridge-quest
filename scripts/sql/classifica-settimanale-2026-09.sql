-- La classifica settimanale diventa settimanale.
--
-- Dipendenze: game_results, profiles. Rollback:
--   classifica-settimanale-2026-09-rollback.sql (elimina la funzione; va
--   insieme al git revert del commit che la chiama).
--
-- IL DIFETTO. La scheda «Settimanale» prendeva la classifica GLOBALE, la
-- filtrava tenendo chi aveva `updated_at` negli ultimi sette giorni, e poi la
-- lista la riordinava di nuovo per XP TOTALE. Quindi non era una classifica
-- della settimana: era la classifica di sempre, ristretta a chi si era fatto
-- vivo. Il cartello sopra diceva «Chi gioca di più sale in cima!», e chi
-- giocava di più non saliva affatto — restava sotto a un veterano che aveva
-- aperto l'applicazione una volta il martedì.
--
-- COSA SI PUÒ MISURARE DAVVERO. Gli XP guadagnati in una settimana NON sono
-- ricavabili: l'XP si assegna nel browser, si somma in `profiles.xp` e da
-- nessuna parte resta traccia di quanto è stato guadagnato e quando. Per
-- averli servirebbe registrare ogni assegnazione sul server — un lavoro a sé,
-- che parte da zero e riempie la settimana solo a partire dal giorno in cui
-- si accende.
--
-- Quello che c'è già è `game_results`: una riga per mano o partita giocata,
-- con la data. Quindi la settimanale misura le MANI GIOCATE negli ultimi
-- sette giorni — che è poi, alla lettera, quello che il cartello prometteva.
-- Il cartello adesso dice quella cosa lì e non un'altra.
--
-- GLI OSPITI RESTANO FUORI. Chi entra in aula con un link porta il proprio
-- nome vero per una sera: finire in una classifica pubblica non è qualcosa a
-- cui abbia acconsentito. La colonna `ospite` non è nemmeno leggibile dal
-- browser, quindi il filtro può stare solo qui dentro.

create or replace function public.classifica_settimanale(p_quanti integer default 100)
returns jsonb
language sql
stable security definer
set search_path to ''
as $function$
  select case when (select auth.uid()) is null then '[]'::jsonb else coalesce(
    (select jsonb_agg(jsonb_build_object(
        'id', t.user_id, 'nome', t.nome, 'asd', t.asd, 'xp', t.xp, 'mani', t.mani
      ) order by t.mani desc, t.xp desc)
     from (
       select g.user_id,
              p.display_name as nome,
              p.asd_name as asd,
              coalesce(p.xp, 0) as xp,
              count(*) as mani
       from public.game_results g
       join public.profiles p on p.id = g.user_id
       where g.created_at > now() - interval '7 days'
         and coalesce(p.ospite, false) = false
       group by g.user_id, p.display_name, p.asd_name, p.xp
       order by count(*) desc, coalesce(p.xp, 0) desc
       limit greatest(1, least(coalesce(p_quanti, 100), 500))
     ) t),
    '[]'::jsonb) end;
$function$;

revoke all on function public.classifica_settimanale(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.classifica_settimanale(integer)
  to authenticated, service_role;
