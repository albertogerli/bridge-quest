/** Reviewed, bilingual corrections. Source: FIGB Fiori 2022, pp. 24–30.
 * Default: produces a guarded SQL patch and a before/after record, NEVER writes remotely.
 * Original editorial snapshot is preserved. No users, results or tournament hands involved.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source = JSON.parse(readFileSync('docs/audit-qualita-2026-09-23/contenuti.json', 'utf8'));
const ids = ['7-2', '7-3', '8-4', '10-3', '105-3'];
const changes = ids.map(id => {
  const before = source.lesson_modules.find(r => r.module_id === id);
  if (!before) throw Error(`Missing source ${id}`);
  const after = structuredClone(before);
  const it = after.content, en = after.content_en;
  if (id === '7-2') {
    it[3].content = 'Riferimento: FIGB Fiori 2022. Con 12–20 punti si apre a livello 1. Le aperture forti a colore richiedono 21+ punti oppure circa 8½–9 vincenti: questa seconda valutazione non dipende dai soli punti onori. Con mano bilanciata di 21–23 punti si apre 2NT; da 24 punti si apre 2♣. Il 2♣ può anche contenere una mano forte a base fiori e si chiarisce al giro successivo.';
    en[3].content = 'Reference: FIGB Fiori 2022. With 12–20 points, open at the one level. Strong suit openings require 21+ points or about 8½–9 winners; the latter assessment is not based on high-card points alone. With a balanced 21–23 HCP, open 2NT; from 24 HCP, open 2♣. The 2♣ opening may also contain a strong club-based hand and is clarified on the next round.';
  }
  if (id === '7-3') {
    it[2].content = 'FIGB Fiori 2022: con una bilanciata di 15–17 punti apri 1NT. Con bilanciata di 12–14 o 18–20 apri di 1 a colore. Con una sbilanciata di 12–20 apri di 1 a colore; le mani da apertura forte seguono le regole della lezione precedente.';
    en[2].content = 'FIGB Fiori 2022: with a balanced 15–17 HCP, open 1NT. With a balanced 12–14 or 18–20 HCP, open one of a suit. With an unbalanced 12–20 HCP, open one of a suit; strong openings follow the rules in the preceding module.';
    it[3].content = 'Quinta maggiore con quadri quarto: 1♥ e 1♠ richiedono almeno cinque carte; 1♦ almeno quattro; in mancanza si apre 1♣, anche con due carte. Con un solo colore lungo apri quello; con due colori entrambi quinti o più, il Fiori 2022 indica il più alto di rango.';
    en[3].content = 'Five-card majors with four-card diamonds: 1♥ and 1♠ require at least five cards; 1♦ requires four. Otherwise open 1♣, even with two cards. With one long suit, open that suit; with two suits both at least five cards long, Fiori 2022 specifies the higher-ranking suit.';
    it[4].content = '♠K2 ♥4 ♦KJ876 ♣AQ873 → 1♦ (due quinti: il più alto). ♠AQJ3 ♥KJ62 ♦Q7 ♣853 → 1♣ (nessun maggiore quinto e solo due quadri). ♠53 ♥AJ4 ♦K9 ♣AJ10762 → 1♣ (colore lungo).';
    en[4].content = '♠K2 ♥4 ♦KJ876 ♣AQ873 → 1♦ (two five-card suits: higher ranking). ♠AQJ3 ♥KJ62 ♦Q7 ♣853 → 1♣ (no five-card major and only two diamonds). ♠53 ♥AJ4 ♦K9 ♣AJ10762 → 1♣ (long suit).';
    it[7].content = 'Hai ♠AQJ3 ♥KJ62 ♦Q73 ♣85 (13 punti, due quarti nobili). Cosa apri nel Fiori 2022?';
    en[7].content = 'You have ♠AQJ3 ♥KJ62 ♦Q73 ♣85 (13 HCP, both four-card majors). What do you open in Fiori 2022?';
    for (const blocks of [it,en]) { blocks[7].options = ['1S','1H','1C','1NT']; blocks[7].correctAnswer = 2; }
    it[7].explanation = '1♣: i maggiori richiedono cinque carte e 1♦ ne richiede quattro. Qui hai quattro picche, quattro cuori, tre quadri e due fiori. Il 1♣ può essere di sole due carte. Punti: 7 a picche + 4 a cuori + 2 a quadri = 13.';
    en[7].explanation = '1♣: major-suit openings require five cards and 1♦ requires four. Here you have four spades, four hearts, three diamonds and two clubs. 1♣ may be only two cards. HCP: 7 in spades + 4 in hearts + 2 in diamonds = 13.';
  }
  if (id === '8-4') {
    it[5].content = 'Il compagno apre 2NT (21–23). Hai ♠43 ♥K52 ♦AJ952 ♣976 (8 punti). Cosa rispondi?';
    en[5].content = 'Partner opens 2NT (21–23). You have ♠43 ♥K52 ♦AJ952 ♣976 (8 HCP). What do you respond?';
    it[5].explanation = 'La linea ha 29–31 punti: con questa bilanciata senza quarte nobili scegli 3NT. Questo 3NT diretto conclude la dichiarazione; non è il 3NT dell’apertore dopo Stayman, che mostra entrambe le quarte nobili.';
    en[5].explanation = 'The partnership has 29–31 HCP. With this balanced hand and no four-card major, bid 3NT to play. This direct 3NT is not the opener’s 3NT response to Stayman, which shows both four-card majors.';
  }
  if (id === '10-3') {
    for (const blocks of [it,en]) blocks[7].content = blocks[7].content.replace('♥AQ3', '♥AK3');
    it[7].explanation = 'Con 16 punti onori (A♠ 4 + AK♥ 7 + KQ♦ 5) e quattro carte di appoggio, 3♠ comunica fit e forza da rovescio minimo. La mano è sbilanciata: il singolo a fiori esclude l’apertura di 1NT.';
    en[7].explanation = 'With 16 HCP (A♠ 4 + AK♥ 7 + KQ♦ 5) and four-card support, 3♠ shows the fit and minimum extra strength. The hand is unbalanced: the singleton club rules out a 1NT opening.';
  }
  if (id === '105-3') {
    for (const blocks of [it,en]) { blocks[3].numericUnit = 'percent'; blocks[3].numericMin = 0; blocks[3].numericMax = 100; delete blocks[3].cards; }
  }
  return { id, before, after };
});
const dir = 'docs/attuazione-qualita-2026-09-23';
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/correzioni-editoriali.json`, JSON.stringify(changes,null,2)+'\n');
const sqlJson = x => "'"+JSON.stringify(x).replaceAll("'","''")+"'::jsonb";
let sql = '-- FIGB Fiori 2022: guarded bilingual corrections; no reseeding.\nBEGIN;\n';
for (const { id, before, after } of changes) {
  sql += `DO $patch$ BEGIN\nUPDATE public.lesson_modules SET content=${sqlJson(after.content)}, content_en=${sqlJson(after.content_en)}\nWHERE lesson_id=${before.lesson_id} AND module_id='${id}' AND content=${sqlJson(before.content)} AND content_en=${sqlJson(before.content_en)};\nIF NOT FOUND AND NOT EXISTS (SELECT FROM public.lesson_modules WHERE lesson_id=${before.lesson_id} AND module_id='${id}' AND content=${sqlJson(after.content)} AND content_en=${sqlJson(after.content_en)}) THEN RAISE EXCEPTION 'Content changed: ${id}'; END IF;\nEND $patch$;\n`;
}
sql += 'COMMIT;\n';
writeFileSync(`${dir}/correzioni-editoriali.sql`, sql);
console.log(JSON.stringify({ modules: changes.length, sqlSha256: createHash('sha256').update(sql).digest('hex'), remoteWrites: 0, output: dir }));
