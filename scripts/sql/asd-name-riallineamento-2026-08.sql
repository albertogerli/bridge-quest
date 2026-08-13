-- ============================================================================
-- BridgeLab: riallineamento di profiles.asd_name al circolo vero
-- ============================================================================
--
-- LA SEGNALAZIONE
-- «Pur avendo indicato nel profilo l'appartenenza al mio circolo (MESSINA), in
-- alcune parti, tipo nelle classifiche, il sistema mi considera appartenente a
-- BRIDGE MANTOVA. Non è un caso isolato, già segnalato da me e da altri nel
-- forum ma ancora presente.»
--
-- Aveva ragione, e il caso non era isolato: 162 profili su 364 con un circolo
-- mostravano il nome di un altro circolo.
--
-- COSA ERA SUCCESSO
-- Il profilo conserva due colonne: `asd_code` (il codice FIGB) e `asd_name`
-- (una copia del nome). Fino alla primavera 2026 le due venivano scritte da
-- fonti diverse e potevano divergere. Il difetto di scrittura è stato corretto
-- — da maggio in poi non c'è più una sola riga sbagliata — ma NESSUNO HA
-- RIPARATO LE RIGHE GIÀ SCRITTE. Per questo la segnalazione nel forum è
-- rimasta vera per mesi: il codice era a posto e i dati no.
--
--   mese      nome giusto   nome sbagliato
--   2026-02        3              4
--   2026-03      112            132
--   2026-04       28             26
--   2026-05       29              0     <- difetto corretto qui
--   2026-06       17              0
--   2026-07       13              0
--
-- QUALE DELLE DUE COLONNE HA RAGIONE
-- Il codice. È l'identificatore FIGB; il nome ne è una copia, e le copie
-- invecchiano. Lo conferma chi ha segnalato: «se vado da Trova ASD mi ritrovo
-- al posto giusto» — e Trova ASD risolve il codice, mentre la classifica
-- mostrava il nome copiato. Sul suo profilo `asd_code = F0150`, che in
-- catalogo è BRIDGE MESSINA: il codice diceva la verità.
--
-- PERCHÉ NON È SOLO UN'ETICHETTA
-- La classifica per circolo raggruppa PER NOME. Centosessantadue persone
-- venivano quindi conteggiate nella graduatoria del circolo sbagliato: non
-- era un'etichetta storta, erano classifiche false.
--
-- IDEMPOTENTE: si può rieseguire, non tocca le righe già allineate.
-- ============================================================================

-- Il nome torna a essere quello del catalogo per il codice salvato.
-- Le virgolette in alcuni nomi di catalogo ("AMICI DEL BRIDGE BARI") non sono
-- una differenza vera: si confronta normalizzando, ma si SCRIVE il nome
-- esatto del catalogo, così il raggruppamento della classifica combacia.
update public.profiles p
set asd_name = c.name
from public.asd_clubs c
where c.code = p.asd_code
  and p.asd_name is distinct from c.name;

-- Verifica: deve tornare 0.
-- select count(*) from profiles p join asd_clubs c on c.code = p.asd_code
--  where p.asd_name is distinct from c.name;

-- ============================================================================
-- E perché non ricapiti: il nome lo scrive il database, non il client
-- ============================================================================
--
-- Riallineare i dati sistema l'oggi. Ma `asd_name` resta una copia di un dato
-- che vive altrove, e le copie divergono: è già successo una volta, con
-- centosessantadue persone messe nella classifica del circolo sbagliato per
-- mesi. Le due strade che oggi scrivono il profilo derivano correttamente il
-- nome dal codice — ma sono due, domani potrebbero essere tre, e basta che una
-- sbagli.
--
-- Con questo trigger il client può mandare quello che vuole in `asd_name`:
-- viene comunque sovrascritto con il nome del catalogo per il codice indicato.
-- Un codice inesistente azzera il nome invece di lasciarne uno inventato.
create or replace function public.sync_asd_name()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  IF NEW.asd_code IS NULL THEN
    NEW.asd_name := NULL;
  ELSE
    SELECT c.name INTO NEW.asd_name FROM public.asd_clubs c WHERE c.code = NEW.asd_code;
  END IF;
  RETURN NEW;
END
$function$;

drop trigger if exists profiles_sync_asd_name on public.profiles;
create trigger profiles_sync_asd_name
  before insert or update of asd_code, asd_name on public.profiles
  for each row execute function public.sync_asd_name();
