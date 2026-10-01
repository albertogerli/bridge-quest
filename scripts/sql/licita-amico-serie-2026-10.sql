-- Licita con un amico: più mani in una serie, e il numero si sceglie.
--
-- Dipendenze: bidding_sessions, friendships, bidding_session_view,
-- my_bidding_sessions — presenti dalla baseline.
-- Rollback: licita-amico-serie-2026-10-rollback.sql (rimette le due funzioni
-- di prima e toglie colonne e funzione nuove; le licite restano).
--
-- PERCHÉ. «Devi poter scegliere il numero di mani in cui confrontarti»
-- (01/10/2026): una licita a due era una mano sola, e confrontarsi su una
-- mano sola è un caso, non un confronto. Ora si sceglie 1, 4 o 8 mani; le
-- mani della stessa serie si riconoscono da `serie`, e ognuna sa che numero è.
--
-- IL MAZZIERE RUOTA COME NEI BOARD VERI (mano 1 Nord, 2 Est, 3 Sud, 4 Ovest):
-- con il mazziere sempre a Sud ogni mano cominciava allo stesso modo, e la
-- licita di chi parla dopo un'apertura avversaria non si allenava mai.
-- La zona resta «nessuno», come in tutte le licite a due finora.

alter table public.bidding_sessions add column if not exists serie uuid;
alter table public.bidding_sessions add column if not exists numero smallint;
alter table public.bidding_sessions add column if not exists di smallint;
create index if not exists bidding_sessions_serie_idx on public.bidding_sessions (serie, numero);

-- Crea una serie di mani. `p_hands` è un array di smazzate, da 1 a 8.
-- Restituisce l'id della prima mano: da lì si comincia.
create or replace function public.bidding_series_create(p_partner uuid, p_hands jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_serie uuid := gen_random_uuid();
  v_n int;
  v_primo uuid;
  v_id uuid;
  ordine text[] := array['north','east','south','west'];
begin
  if auth.uid() is null or p_partner is null or p_partner = auth.uid() then
    return null;
  end if;
  -- Stessa regola della mano singola: solo con un amico.
  if not exists (
    select 1 from public.friendships f
     where f.status = 'accepted'
       and ((f.user_id = auth.uid() and f.friend_id = p_partner)
         or (f.friend_id = auth.uid() and f.user_id = p_partner))
  ) then
    return null;
  end if;
  if jsonb_typeof(p_hands) <> 'array' then return null; end if;
  v_n := jsonb_array_length(p_hands);
  if v_n < 1 or v_n > 8 then return null; end if;

  for i in 0 .. v_n - 1 loop
    insert into public.bidding_sessions (south_id, north_id, hands, dealer, serie, numero, di)
    values (auth.uid(), p_partner, p_hands -> i, ordine[(i % 4) + 1], v_serie, i + 1, v_n)
    returning id into v_id;
    if i = 0 then v_primo := v_id; end if;
  end loop;
  return v_primo;
end $$;

revoke all on function public.bidding_series_create(uuid, jsonb) from public;
grant execute on function public.bidding_series_create(uuid, jsonb) to authenticated;

-- La vista della mano: in più serie, numero, di, e l'id della mano dopo.
create or replace function public.bidding_session_view(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s public.bidding_sessions%rowtype;
  v_seat text; v_chiusa boolean; v_turno text; v_hands jsonb;
  ordine text[] := array['north','east','south','west']; i_dealer int;
  v_prossima uuid;
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
  if s.serie is not null then
    select b.id into v_prossima from public.bidding_sessions b
     where b.serie = s.serie and b.numero = s.numero + 1;
  end if;
  return jsonb_build_object('id', s.id, 'seat', v_seat, 'hands', v_hands,
    'bids', s.bids, 'dealer', s.dealer, 'turno', v_turno,
    'chiusa', v_chiusa, 'createdAt', s.created_at,
    'serie', s.serie, 'numero', s.numero, 'di', s.di, 'prossima', v_prossima);
end $$;

-- L'elenco: in più serie, numero, di.
create or replace function public.my_bidding_sessions()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', x.id, 'seat', x.seat, 'bids', x.bids, 'dealer', x.dealer,
    'chiusa', x.closed_at is not null, 'compagno', x.compagno, 'createdAt', x.created_at,
    'serie', x.serie, 'numero', x.numero, 'di', x.di
  ) order by x.created_at desc, x.numero desc), '[]'::jsonb)
  from (
    select s.id, s.bids, s.dealer, s.closed_at, s.created_at, s.serie, s.numero, s.di,
           case when s.south_id = auth.uid() then 'south' else 'north' end as seat,
           (select p.display_name from public.profiles p
             where p.id = case when s.south_id = auth.uid() then s.north_id else s.south_id end) as compagno
    from public.bidding_sessions s
    where s.south_id = auth.uid() or s.north_id = auth.uid()
    order by s.created_at desc limit 60
  ) x;
$$;
