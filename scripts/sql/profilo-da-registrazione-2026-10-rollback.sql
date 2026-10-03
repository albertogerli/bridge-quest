-- Rollback di `profilo-da-registrazione-2026-10.sql`: il trigger torna a
-- salvare il solo nome. ATTENZIONE: il client non scrive più gli altri campi,
-- quindi con questo rollback vanno persi di nuovo (come da agosto a ottobre).

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
  begin
    insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Bridgista'));
    return new;
  end;
$function$;

delete from public.script_applicati where nome = 'profilo-da-registrazione-2026-10.sql';

commit;
