-- Rollback di licita-amico-serie-2026-10.sql. Le licite restano; si perde il
-- legame fra le mani della stessa serie. Prima: git revert del codice.
drop function if exists public.bidding_series_create(uuid, jsonb);

create or replace function public.bidding_session_view(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  s public.bidding_sessions%rowtype;
  v_seat text; v_chiusa boolean; v_turno text; v_hands jsonb;
  ordine text[] := array['north','east','south','west']; i_dealer int;
begin
  select * into s from public.bidding_sessions where id = p_id;
  if not found then return null; end if;
  v_seat := case when s.south_id = auth.uid() then 'south'
                 when s.north_id = auth.uid() then 'north' else null end;
  if v_seat is null then return null; end if;
  v_chiusa := s.closed_at is not null;
  i_dealer := array_position(ordine, s.dealer);
  v_turno := ordine[((i_dealer - 1 + jsonb_array_length(s.bids)) % 4) + 1];
  if v_chiusa then v_hands := s.hands;
  else v_hands := jsonb_build_object(v_seat, s.hands -> v_seat); end if;
  return jsonb_build_object('id', s.id, 'seat', v_seat, 'hands', v_hands,
    'bids', s.bids, 'dealer', s.dealer, 'turno', v_turno,
    'chiusa', v_chiusa, 'createdAt', s.created_at);
end $$;

create or replace function public.my_bidding_sessions()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', x.id, 'seat', x.seat, 'bids', x.bids, 'dealer', x.dealer,
    'chiusa', x.closed_at is not null, 'compagno', x.compagno, 'createdAt', x.created_at
  ) order by x.created_at desc), '[]'::jsonb)
  from (
    select s.id, s.bids, s.dealer, s.closed_at, s.created_at,
           case when s.south_id = auth.uid() then 'south' else 'north' end as seat,
           (select p.display_name from public.profiles p
             where p.id = case when s.south_id = auth.uid() then s.north_id else s.south_id end) as compagno
    from public.bidding_sessions s
    where s.south_id = auth.uid() or s.north_id = auth.uid()
    order by s.created_at desc limit 30
  ) x;
$$;

drop index if exists public.bidding_sessions_serie_idx;
alter table public.bidding_sessions drop column if exists di;
alter table public.bidding_sessions drop column if exists numero;
alter table public.bidding_sessions drop column if exists serie;
