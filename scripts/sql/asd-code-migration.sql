-- BridgeLab — ASD migration: profiles.asd_id (int, ASD_LIST index)
--                            -> profiles.asd_code (text, FIGB F-code)
--                             + profiles.asd_name (text, human-readable)
--
-- Run on Supabase Dashboard -> SQL Editor.
-- Idempotent: safe to re-run.
--
-- IMPORTANT: ASD_LIST was reordered on 2026-03-26 (commit f2473af)
-- from 241 entries to 146 entries. The same asd_id value maps to
-- different clubs depending on when the user signed up:
--   - Before 2026-03-26: OLD mapping (241 entries)
--   - On/after 2026-03-26: NEW mapping (146 entries)

-- ============================================================
-- 1) Add columns
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS asd_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS asd_name text;

-- ============================================================
-- 2a) Backfill OLD users (created before 2026-03-26, 241-entry list)
-- ============================================================

UPDATE profiles p
SET asd_code = m.code
FROM (VALUES
  (1,'F0681'),(2,'F0349'),(3,'F0411'),(4,'F0510'),(5,'F0326'),
  (6,'F0196'),(7,'F0644'),(9,'F0704'),(10,'F0674'),(12,'F0500'),
  (13,'F0673'),(14,'F0810'),(15,'F0443'),(17,'F0701'),(18,'F0792'),
  (19,'F0401'),(20,'F0429'),(21,'F0718'),(22,'F0715'),(23,'F0666'),
  (24,'F0762'),(25,'F0528'),(26,'F0482'),(27,'F0711'),(28,'F0768'),
  (29,'F0112'),(30,'F0611'),(31,'F0776'),(32,'F0807'),(35,'F0178'),
  (36,'F0200'),(37,'F0217'),(38,'F0407'),(39,'F0637'),(40,'F0513'),
  (41,'F0079'),(42,'F0487'),(43,'F0747'),(44,'F0024'),(45,'F0449'),
  (46,'F0026'),(47,'F0532'),(48,'F0508'),(49,'F0095'),(50,'F0142'),
  (51,'F0705'),(52,'F0129'),(53,'F0158'),(55,'F0344'),(56,'F0653'),
  (57,'F0751'),(58,'F0808'),(59,'F0699'),(60,'F0618'),(61,'F0229'),
  (62,'F0034'),(63,'F0634'),(64,'F0039'),(65,'F0050'),(66,'F0059'),
  (67,'F0369'),(68,'F0070'),(69,'F0642'),(70,'F0004'),(71,'F0675'),
  (72,'F0054'),(73,'F0727'),(75,'F0345'),(76,'F0223'),(77,'F0210'),
  (78,'F0474'),(79,'F0444'),(80,'F0270'),(81,'F0680'),(82,'F0754'),
  (83,'F0594'),(84,'F0453'),(85,'F0472'),(86,'F0578'),(87,'F0100'),
  (88,'F0438'),(89,'F0466'),(90,'F0503'),(91,'F0055'),(92,'F0748'),
  (94,'F0132'),(95,'F0150'),(96,'F0376'),(97,'F0202'),(98,'F0216'),
  (99,'F0645'),(100,'F0215'),(102,'F0240'),(103,'F0753'),(104,'F0244'),
  (105,'F0114'),(106,'F0253'),(107,'F0742'),(109,'F0204'),(110,'F0280'),
  (111,'F0806'),(112,'F0814'),(113,'F0409'),(114,'F0232'),(115,'F0541'),
  (116,'F0368'),(117,'F0274'),(118,'F0028'),(119,'F0276'),(120,'F0149'),
  (121,'F0168'),(122,'F0224'),(123,'F0716'),(124,'F0588'),(125,'F0546'),
  (126,'F0778'),(127,'F0282'),(128,'F0656'),(129,'F0473'),(130,'F0696'),
  (131,'F0576'),(132,'F0813'),(133,'F0591'),(134,'F0805'),(135,'F0758'),
  (136,'F0766'),(139,'F0672'),(140,'F0392'),(141,'F0566'),(142,'F0236'),
  (143,'F0058'),(144,'F0170'),(145,'F0798'),(146,'F0214'),(147,'F0417'),
  (149,'F0734'),(150,'F0074'),(152,'F0135'),(153,'F0479'),(154,'F0432'),
  (155,'F0775'),(156,'F0606'),(158,'F0744'),(159,'F0090'),(160,'F0722'),
  (162,'F0140'),(163,'F0631'),(164,'F0694'),(167,'F0777'),(168,'F0795'),
  (169,'F0437'),(170,'F0550'),(171,'F0220'),(172,'F0713'),(173,'F0707'),
  (174,'F0430'),(175,'F0632'),(176,'F0769'),(178,'F0783'),(179,'F0442'),
  (180,'F0708'),(181,'F0760'),(182,'F0390'),(184,'F0136'),(185,'F0346'),
  (186,'F0731'),(187,'F0144'),(188,'F0585'),(189,'F0160'),(190,'F0162'),
  (191,'F0737'),(192,'F0595'),(193,'F0796'),(194,'F0598'),(195,'F0738'),
  (196,'F0695'),(197,'F0773'),(198,'F0190'),(200,'F0763'),(201,'F0341'),
  (202,'F0714'),(203,'F0635'),(204,'F0556'),(205,'F0082'),(206,'F0558'),
  (207,'F0640'),(208,'F0662'),(209,'F0791'),(210,'F0787'),(211,'F0213'),
  (213,'F0524'),(214,'F0322'),(215,'F0624'),(216,'F0759'),(217,'F0774'),
  (219,'F0646'),(220,'F0403'),(221,'F0720'),(222,'F0333'),(223,'F0596'),
  (224,'F0649'),(225,'F0809')
) AS m(asd_id, code)
WHERE p.asd_id = m.asd_id
  AND p.asd_code IS NULL
  AND p.created_at < '2026-03-26T00:00:00+00:00';

-- ============================================================
-- 2b) Backfill NEW users (created on/after 2026-03-26, 146-entry list)
-- ============================================================

UPDATE profiles p
SET asd_code = m.code
FROM (VALUES
  (1,'F0681'),(2,'F0233'),(3,'F0349'),(4,'F0692'),(5,'F0811'),
  (6,'F0510'),(7,'F0674'),(8,'F0196'),(9,'F0644'),(10,'F0673'),
  (11,'F0219'),(12,'F0443'),(13,'F0338'),(14,'F0701'),(15,'F0718'),
  (16,'F0762'),(17,'F0528'),(18,'F0711'),(19,'F0112'),(20,'F0611'),
  (21,'F0807'),(22,'F0583'),(23,'F0032'),(24,'F0178'),(25,'F0200'),
  (26,'F0366'),(27,'F0217'),(28,'F0407'),(29,'F0513'),(30,'F0487'),
  (31,'F0017'),(32,'F0747'),(33,'F0024'),(34,'F0449'),(35,'F0026'),
  (36,'F0797'),(37,'F0129'),(38,'F0411'),(39,'F0751'),(40,'F0808'),
  (41,'F0699'),(42,'F0030'),(43,'F0229'),(44,'F0034'),(45,'F0634'),
  (46,'F0039'),(47,'F0044'),(48,'F0050'),(49,'F0058'),(50,'F0066'),
  (51,'F0070'),(52,'F0223'),(53,'F0210'),(54,'F0474'),(55,'F0444'),
  (56,'F0680'),(57,'F0080'),(58,'F0754'),(59,'F0812'),(60,'F0594'),
  (61,'F0091'),(62,'F0100'),(63,'F0102'),(64,'F0466'),(65,'F0116'),
  (66,'F0503'),(67,'F0120'),(68,'F0504'),(69,'F0748'),(70,'F0127'),
  (71,'F0132'),(72,'F0141'),(73,'F0150'),(74,'F0376'),(75,'F0202'),
  (76,'F0784'),(77,'F0301'),(78,'F0216'),(79,'F0645'),(80,'F0215'),
  (81,'F0240'),(82,'F0244'),(83,'F0114'),(84,'F0266'),(85,'F0204'),
  (86,'F0280'),(87,'F0814'),(88,'F0409'),(89,'F0232'),(90,'F0274'),
  (91,'F0028'),(92,'F0276'),(93,'F0168'),(94,'F0716'),(95,'F0576'),
  (96,'F0805'),(97,'F0758'),(98,'F0745'),(99,'F0766'),(100,'F0672'),
  (101,'F0236'),(102,'F0698'),(103,'F0734'),(104,'F0074'),(105,'F0135'),
  (106,'F0088'),(107,'F0722'),(108,'F0437'),(109,'F0707'),(110,'F0430'),
  (111,'F0719'),(112,'F0442'),(113,'F0760'),(114,'F0390'),(115,'F0136'),
  (116,'F0346'),(117,'F0144'),(118,'F0162'),(119,'F0737'),(120,'F0595'),
  (121,'F0789'),(122,'F0796'),(123,'F0598'),(124,'F0738'),(125,'F0174'),
  (126,'F0743'),(127,'F0695'),(128,'F0773'),(129,'F0190'),(130,'F0679'),
  (131,'F0341'),(132,'F0714'),(133,'F0635'),(134,'F0556'),(135,'F0558'),
  (136,'F0816'),(137,'F0662'),(138,'F0787'),(139,'F0213'),(140,'F0657'),
  (141,'F0646'),(142,'F0385'),(143,'F0663'),(144,'F0596'),(145,'F0649'),
  (146,'F0809')
) AS m(asd_id, code)
WHERE p.asd_id = m.asd_id
  AND p.asd_code IS NULL
  AND p.created_at >= '2026-03-26T00:00:00+00:00';

-- ============================================================
-- 2c) Backfill asd_name from asd_code using the ASD_CLUBS reference
-- ============================================================

UPDATE profiles p
SET asd_name = m.name
FROM (VALUES
  ('F0004','BRIDGE CLUB BUSACCHI'),('F0017','AVELLINO BRIDGE'),
  ('F0024','BAVENO BRIDGE CLUB'),('F0026','BERGAMASCA BRIDGE'),
  ('F0028','BRIDGE PADOVA'),('F0030','BRIDGE BOLOGNA'),
  ('F0032','ASS.BR.BOLZANO'),('F0034','BRIDGE BORDIGHERA'),
  ('F0039','BRIDGE BRINDISI'),('F0044','BRIDGE CAGLIARI'),
  ('F0050','BRIDGE CARRARA'),('F0054','BRIDGE CLUB CASERTA ASD'),
  ('F0055','BRIDGE CLUB FORTE DEI MARMI'),('F0058','BRIDGE CATANIA'),
  ('F0059','BRIDGE CATANZARO'),('F0066','BRIDGE CESENA'),
  ('F0070','BRIDGE CHIAVARI'),('F0074','CIRCOLO DEL BRIDGE FI'),
  ('F0079','ASSOCIAZIONE BRIDGE CREMA'),('F0080','BRIDGE CREMONA'),
  ('F0082','ROMA BRIDGE ASD'),('F0088','BRIDGE TORINO'),
  ('F0090','G.B.FOSSATI BELLANO'),('F0091','BRIDGE COMO'),
  ('F0095','BR.FERMO-P.TO S.GIORGIO'),('F0100','BRIDGE FIRENZE'),
  ('F0102','BRIDGE FORLI'''),('F0112','ASD POLISPORTIVA GRIFONE'),
  ('F0114','BRIDGE GENOVA'),('F0116','BRIDGE FAENZA'),
  ('F0120','BRIDGE GROSSETO'),('F0127','BRIDGE LECCE'),
  ('F0129','BR.LAVENO MOMBELLO'),('F0132','BRIDGE LIVORNO'),
  ('F0135','CIRCOLO DEL BRIDGE - MI'),('F0136','BRIDGE NAPOLI'),
  ('F0140','G.SINISCALCO'),('F0141','BRIDGE LUCCA'),
  ('F0142','BR.FILARMONICA MACERATA'),('F0144','BRIDGE NOVARA'),
  ('F0149','C.S.A. BRIDGE ASD'),('F0150','BRIDGE MANTOVA'),
  ('F0158','BR.MODENA "C.LO PERROUX"'),('F0160','PARMA BRIDGE'),
  ('F0162','BRIDGE PERUGIA'),('F0168','CIRCOLO BRIDGE ROVIGO'),
  ('F0170','CIRCOLO BRIDGE TRENTO'),('F0174','S. CASCIANO VP BRIDGE'),
  ('F0178','ASS.BR.PALERMO'),('F0190','BRIDGE RAVENNA'),
  ('F0196','ABP SOCIALE 1806'),('F0200','ASS.BRIDGE PISA'),
  ('F0202','BRIDGE MERANO'),('F0204','BRIDGE SASSARI'),
  ('F0210','BRIDGE CLUB PRATO'),('F0213','TENNIS CLUB TREVISO'),
  ('F0214','CIRCOLO BRIDGE TRENTO'),('F0215','BRIDGE MODENA'),
  ('F0216','BRIDGE MESTRE'),('F0217','ASS.RIMINI BRIDGE'),
  ('F0219','AMICI DEL BRIDGE RI'),('F0220','LUCCA BRIDGE'),
  ('F0223','BRIDGE CLUB LA VALLEE  ASD'),('F0224','C.ACCADEMICO BRIDGE'),
  ('F0229','BRIDGE BOLOGNA RASTIGNANO'),('F0232','CIRCOLO BRIDGE TRIESTE'),
  ('F0233','A.B.SAN GIORGIO DEL SANNIO'),('F0236','PONT SAINT MARTIN BRIDGE'),
  ('F0240','BRIDGE MONZA'),('F0244','BRIDGE PARMA'),
  ('F0253','BRIDGE TERNI'),('F0266','PALCAN BRIDGE'),
  ('F0270','BRIDGE CLUB SANREMO'),('F0274','BRIDGE PADOVA'),
  ('F0276','BRIDGE PESCARA'),('F0280','BRIDGE SAVONA'),
  ('F0282','C.LO "PABIS TICCI" SIENA'),('F0301','BRIDGE MILANO'),
  ('F0322','REGGIO EMILIA BRIDGE'),('F0326','A.S.D. SPORTING CLUB MILANO 2'),
  ('F0333','VERSILIA BRIDGE AND GAMES'),('F0338','ANKON BRIDGE – RIVIERA DEL CONERO'),
  ('F0341','RE BRIDGE'),('F0344','BR.SPORTING CLUB S.SEVERO'),
  ('F0345','BRIDGE CLUB DRUSO'),('F0346','BRIDGE NUORO'),
  ('F0349','A.BERGAMASCA BR.LORETO'),('F0366','ASS.BRIDGE SORA'),
  ('F0368','C.B. SENIGALLIA - RIVIERA'),('F0369','BRIDGE CHIARAVALLE'),
  ('F0376','BRIDGE MASSA'),('F0385','VARESE BRIDGE'),
  ('F0390','BRIDGE PIACENZA'),('F0392','NAPOLI BRIDGE'),
  ('F0401','APD C.LO CANOTTIERI ROMA'),('F0403','VERSILIA BRIDGE ASD'),
  ('F0407','ASS.SP.DILETTANTISTICA BRIDGE COSENZA'),
  ('F0409','CIRCOLO BRIDGE ROMA'),('F0411','BR.NINO MARCON VE'),
  ('F0417','CIRCOLO TENNIS BARI ASD'),('F0429','APSD C.MAGISTRATI C.C.'),
  ('F0430','ROMA NORD BRIDGE'),
  ('F0432','GORIZIA BRIDGE'),('F0437','POKER BRIDGE'),
  ('F0438','BRIDGE EST MILANESE'),('F0442','ROMA TROPHY BRIDGE ASD'),
  ('F0443','ANGOLO VERDE PG'),('F0444','BRIDGE CLUB SANREMO'),
  ('F0449','BCM BR.CLUB MERATE'),('F0453','BRIDGE EXCELSIOR'),
  ('F0466','BRIDGE GALLARATE'),('F0472','BRIDGE D''IRPINIA'),
  ('F0473','GOLF BR.CLUB ACQUASANTA'),('F0474','BRIDGE CLUB SIRACUSA'),
  ('F0479','GOLF BRIDGE RAPALLO'),('F0482','ASD CANOTTIERI TICINO PAVIA'),
  ('F0487','ASSOCIAZIONE SPORTIVA AMP - ASD'),('F0500','AMICI BRIDGE ABRUZZO'),
  ('F0503','BRIDGE GORIZIA'),('F0504','BRIDGE IMOLA'),
  ('F0508','BR.CL.NUOVA CASALE A.S.D.'),('F0510','A.S.D. MES AMIS'),
  ('F0513','ASSOCIATO ALLEGRA'),('F0524','REGGIO CAL. BRIDGE'),
  ('F0528','ASD C.LO TENNIS PALERMO'),('F0532','BR.ASS.COMOCANTUHELIOS'),
  ('F0541','C.LO ARTIGIANELLI BRIDGE'),('F0546','CIRCOLO BRIDGE ASTI'),
  ('F0550','LUCCA BRIDGE'),('F0556','SPOLETO BRIDGE'),
  ('F0558','TARANTO BRIDGE ASD'),('F0566','NEAPOLIS BRIDGE ASD'),
  ('F0576','ORISTANO BRIDGE'),('F0578','BRIDGE CREMA'),
  ('F0583','ASD TENNIS ROMA'),('F0585','PARMA BRIDGE'),
  ('F0588','CIRCOLO BRIDGE BERGAMO'),('F0591','NUORO BRIDGE'),
  ('F0594','BRIDGE CONVIVIUM'),('F0595','BRIDGE ROMA EUR'),
  ('F0596','VIAREGGIO VERSILIA BR. A.S.D.'),('F0598','S. CASCIANO VP BRIDGE'),
  ('F0606','IMOLA BRIDGE CLUB'),('F0611','ASD SOC GINNASTICA ANGIULLI'),
  ('F0618','BRIDGE BOLOGNA CENTRO'),('F0624','SAN DONA'' DI PIAVE BRIDGE'),
  ('F0631','GEN.A. FERRARA'),('F0632','MINCIO BRIDGE'),
  ('F0634','BRIDGE BRENO'),('F0635','SPEZIA BRIDGE'),
  ('F0637','ASSI NEL MONDO'),('F0640','SIENA BRIDGE ASD'),
  ('F0642','BRIDGE CITTA'' DEL TRICOLORE'),('F0644','ACCADEMIA DEL BRIDGE'),
  ('F0645','BRIDGE MESTRE'),('F0646','VARESE BRIDGE'),
  ('F0649','VITTORIO VENETO'),('F0653','BR.MONFORTE CAMPOBASSO'),
  ('F0656','COLLI EUGANEI BRIDGE'),('F0657','UDINE BRIDGE'),
  ('F0662','TERAMO BRIDGE'),('F0663','VENEZIA BRIDGE'),
  ('F0666','ARONA BRIDGE CLUB 50'),('F0672','NOVARA BRIDGE'),
  ('F0673','AMICI BRIDGE OLGIATA'),('F0674','A.S.D.ALESSANDRIA BRIDGE'),
  ('F0675','BRIDGE CLUB ALASSIO'),('F0679','PISA BRIDGE'),
  ('F0680','BRIDGE CUSANO MILANINO'),('F0681','A. VOLTA'),
  ('F0692','A.BRIDGE CIRCOLO 1871'),('F0694','GENOVA BRIDGE E SCACCHI'),
  ('F0695','C.LO "PABIS TICCI" SIENA'),('F0696','GUBBIO BRIDGE'),
  ('F0698','MODENA BRIDGE'),('F0699','BRIDGE ARCOBALENO'),
  ('F0701','ANTICO TIRO A VOLO - BR. A.S.D'),('F0704','ALBA BRIDGE CLUB'),
  ('F0705','BR.G.CABOTO - GAETA'),('F0707','RAVENNA BRIDGE'),
  ('F0708','REGGIO C. BRIDGE ASD'),('F0711','ASD CIRCOLO BOCCIOFILA LIDO'),
  ('F0713','MATERA BRIDGE'),('F0714','ROMAGNA BRIDGE'),
  ('F0715','ARCA BRIDGE ASD'),('F0716','CIRCOLO BRIDGE ROVIGO'),
  ('F0718','ARBAREE BRIDGE'),('F0719','ROMA SUD BRIDGE'),
  ('F0720','VERDE BRIDGE ASD'),('F0722','G.B.FOSSATI BELLANO'),
  ('F0727','BRIDGE CLUB DELFINI JONICI'),('F0731','CANTU'' BRIDGE'),
  ('F0734','CIRCOLO DEL BRIDGE FI'),('F0737','BRIDGE ROMA'),
  ('F0738','SARZANA BRIDGE'),('F0742','BRIDGE TOSCANO ASD'),
  ('F0743','S.LAZZARO BRIDGE'),('F0744','GALLURA BRIDGE'),
  ('F0745','MESSINA BRIDGE'),('F0747','B.RIVIERA PALME S.BENEDETTO T.'),
  ('F0748','BRIDGE IMOLA'),('F0751','BRIDGE ADDAURA ASD'),
  ('F0753','BRIDGE OLBIA'),('F0754','BRIDGE D''IRPINIA'),
  ('F0758','PERUGIA BRIDGE ASD'),('F0759','SALERNO BRIDGE'),
  ('F0760','ROMA BRIDGE ASD'),('F0762','ASD C.LO BR. PESCARA RIVIERA'),
  ('F0763','PRATO BRIDGE'),('F0766','PINEROLO BRIDGE'),
  ('F0768','ASD CITTA'' DI LECCO'),('F0769','MILANO BRIDGE'),
  ('F0773','PIETRASANTA BRIDGE'),('F0774','SAMMARINESE BRIDGE'),
  ('F0775','GORIZIA BRIDGE'),('F0776','ASD SOCIALTENNIS CLUB'),
  ('F0777','LA SPEZIA BRIDGE'),('F0778','CIRCOLO BRIDGE ASTI'),
  ('F0783','MANTOVA BRIDGE'),('F0784','BRIDGE MERANO ASD'),
  ('F0787','TERNI BRIDGE'),('F0789','BRIDGE ROMA EUR'),
  ('F0791','SIRACUSA BRIDGE'),('F0792','ANZIO & NETTUNO BRIDGE CLUB ASD'),
  ('F0795','L''AQUILA BRIDGE'),('F0796','SAVONA BRIDGE'),
  ('F0797','BITALBRIDGE'),('F0798','CIRCOLO BRIDGE TRENTO'),
  ('F0805','PAVIA BRIDGE'),('F0806','CAGLIARI BRIDGE'),
  ('F0807','ASD SPORTING STELLE DEL SUD'),('F0808','BRIDGE ANZIO ASD'),
  ('F0809','WHITE BRIDGE CESENA'),('F0810','AMICI DEL BRIDGE BARI'),
  ('F0811','A.S.D. CLUB NAUTICO GAETA'),('F0812','BRIDGE DESENZANO DEL GARDA'),
  ('F0813','OLBIA BRIDGE'),('F0814','CASERTA BRIDGE'),
  ('F0816','TORINO BRIDGE')
) AS m(code, name)
WHERE p.asd_code = m.code
  AND p.asd_name IS NULL;

-- ============================================================
-- 3) Index
-- ============================================================

CREATE INDEX IF NOT EXISTS profiles_asd_code_idx ON profiles (asd_code);

-- ============================================================
-- 4) Replace club RPCs (int -> text param)
-- ============================================================

DROP FUNCTION IF EXISTS get_club_leaderboard(int);
DROP FUNCTION IF EXISTS get_club_stats(int);

CREATE OR REPLACE FUNCTION get_club_leaderboard(p_asd_code text)
RETURNS TABLE (id uuid, display_name text, xp int, avatar_url text, updated_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT p.id, p.display_name, p.xp, p.avatar_url, p.updated_at
  FROM profiles p
  WHERE p.asd_code = p_asd_code AND p.display_name IS NOT NULL
  ORDER BY p.xp DESC LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION get_club_stats(p_asd_code text)
RETURNS TABLE (member_count int, total_xp bigint, avg_xp int)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COUNT(*)::int, COALESCE(SUM(xp), 0), COALESCE(AVG(xp), 0)::int
  FROM profiles WHERE asd_code = p_asd_code AND display_name IS NOT NULL;
$$;

-- ============================================================
-- 5) Replace search_users RPC: return asd_code + asd_name
-- ============================================================

DROP FUNCTION IF EXISTS search_users(text, uuid);

CREATE OR REPLACE FUNCTION search_users(
  p_query   text,
  p_user_id uuid
)
RETURNS TABLE (
  id           uuid,
  display_name text,
  bbo_username text,
  avatar_url   text,
  asd_code     text,
  asd_name     text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    p.id,
    p.display_name,
    p.bbo_username,
    p.avatar_url,
    p.asd_code,
    p.asd_name
  FROM profiles p
  WHERE
    p.id <> p_user_id
    AND p.display_name IS NOT NULL
    AND (
      p.display_name ILIKE '%' || p_query || '%'
      OR p.bbo_username ILIKE '%' || p_query || '%'
    )
  ORDER BY p.display_name
  LIMIT 20;
$$;

-- ============================================================
-- 6) Fix Ggolino (asd_id=46 was set with old 241-entry list)
-- ============================================================

UPDATE profiles
SET asd_code = 'F0026', asd_name = 'BERGAMASCA BRIDGE'
WHERE id = '76ebd1c7-07a4-4d21-95f6-d6f5a9685064';

-- ============================================================
-- Verification queries (run manually after migration)
-- ============================================================
-- SELECT COUNT(*) FILTER (WHERE asd_id IS NOT NULL) AS with_id,
--        COUNT(*) FILTER (WHERE asd_code IS NOT NULL) AS with_code,
--        COUNT(*) FILTER (WHERE asd_name IS NOT NULL) AS with_name,
--        COUNT(*) FILTER (WHERE asd_id IS NOT NULL AND asd_code IS NULL) AS unbackfilled
--   FROM profiles;
