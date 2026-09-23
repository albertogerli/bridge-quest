"""Extract official FIGB board geometry for review; never writes to the database."""
import json, re, subprocess, hashlib, xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/attuazione-qualita-2026-09-23/fonti-smazzate'
OUT.mkdir(parents=True, exist_ok=True)
SUITS = {'\uf0aa': 'S', '\uf0a9': 'H', '\uf0a8': 'D', '\uf0a7': 'C'}
SEATS = {'Nord': 'north', 'Est': 'east', 'Sud': 'south', 'Ovest': 'west', 'N': 'north', 'E': 'east', 'S': 'south', 'O': 'west'}
def norm(s):
    for a,b in SUITS.items(): s=s.replace(a,b)
    return s.replace('*','').replace('Dbl','X').replace('dbl','X').replace('–','-')
def center(w): return (w['x']+w['right'])/2
def txt(ws):
    rows=[]
    for w in sorted(ws,key=lambda w:w['y']):
        row=next((r for r in rows if abs(r[0]['y']-w['y'])<4),None)
        if row is None: rows.append([w])
        else: row.append(w)
    return '\n'.join(' '.join(norm(w['t']) for w in sorted(r,key=lambda w:w['x'])) for r in rows)
results=[]
for prefix,folder in [('Q','FIGB_CORSO QUADRI'),('CG','FIGB_CORSO CUORI GIOCO')]:
  for pdf in sorted((ROOT.parent/folder).rglob('*.pdf')):
    if not ('Smazzate' in pdf.name or 'smz' in pdf.name): continue
    lesson=int(re.search(r'(?:LEZIONE|GIOCO) (\d+)',str(pdf))[1])
    raw=subprocess.check_output(['pdftotext','-bbox',str(pdf),'-'])
    root=ET.fromstring(raw)
    for page_no,page in enumerate(root.findall('.//{*}page'),1):
      ws=[dict(t=w.text or '',x=float(w.attrib['xMin']),right=float(w.attrib['xMax']),y=float(w.attrib['yMin'])) for w in page.findall('.//{*}word')]
      boards=[w for w in ws if w['t']=='Board']
      for board in boards:
        x0=0 if board['x']<420 else 421
        y0=board['y']-5
        later=[b['y']-5 for b in boards if abs(b['x']-board['x'])<20 and b['y']>board['y']+20]
        y1=min(later) if later else float(page.attrib['height'])-10
        section=[w for w in ws if x0<=w['x']<x0+420 and y0<=w['y']<y1]
        nums=[w for w in section if board['right']<=w['x']<board['right']+25 and abs(w['y']-board['y'])<4 and w['t'].isdigit()]
        if len(nums)!=1: continue
        num=int(nums[0]['t']); id=f'{prefix}{lesson}-{num}'
        headers=sorted([w for w in section if w['t'] in ['S','O','N','E'] and abs(w['y']-board['y'])<5 and w['x']>x0+240],key=lambda w:w['x'])
        hand_words=[w for w in section if w['t'] in SUITS and w['x']<x0+230 and w['y']<y0+175]
        hands={p:{} for p in ['north','east','south','west']}
        for w in hand_words:
          x=w['x']-x0
          seat='west' if x<80 else 'east' if x>145 else ('north' if w['y']<y0+65 else 'south')
          cards=sorted([r for r in section if 0<=r['x']-w['right']<50 and abs(r['y']-w['y'])<5 and re.fullmatch(r'[AKQJT\d]+|[-–]',r['t'])],key=lambda r:r['x'])
          if cards: hands[seat][SUITS[w['t']]]=cards[0]['t'].replace('10','T').replace('-','').replace('–','')
        auction=[]
        if len(headers)==4:
          prose=[w['y'] for w in section if w['x']>=headers[0]['x']-25 and w['y']>board['y']+8 and re.search(r'[A-Za-zÀ-ÿ]{3}',norm(w['t'])) and not re.fullmatch(r'[1-7](?:NT|[SHDC])|P|X|XX|-',norm(w['t']))]
          stop=min(prose) if prose else board['y']+110
          candidates=[]
          for w in section:
            b=norm(w['t'])
            if w['y']<=board['y']+6 or w['y']>=stop-3: continue
            nearest=min(headers,key=lambda h:abs(center(h)-center(w)))
            if abs(center(nearest)-center(w))<8 and re.fullmatch(r'[1-7](?:NT|[SHDC])|P|X|XX|-',b):
              candidates.append({**w,'bid':b,'seat':SEATS[nearest['t']]})
          rows=[]
          for w in sorted(candidates,key=lambda w:w['y']):
            row=next((r for r in rows if abs(r[0]['y']-w['y'])<4),None)
            if row is None: rows.append([w])
            else: row.append(w)
          for row in rows: auction.extend(sorted(row,key=lambda w:w['x']))
        contract_label=next((w for w in section if w['t'].startswith('Contratto')),None)
        contract=None; declarer=None
        if contract_label:
          region=[w for w in section if w['x']<x0+115 and 5<w['y']-contract_label['y']<36]
          match=re.search(r'([1-7](?:NT|[SHDC]))\s*\(([NSEO])\)',txt(region))
          if match: contract=match[1];declarer=SEATS[match[2]]
        result={'id':id,'file':str(pdf.relative_to(ROOT.parent)),'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'page':page_no,'crop':[x0,round(y0,2),420,round(y1-y0,2)],'hands':hands,'contract':contract,'declarer':declarer,'auction':[{'seat':b['seat'],'bid':b['bid']} for b in auction],'text':txt(section)}
        results.append(result)
(OUT/'estrazione.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
invalid=[]
for r in results:
  cards=[s+c for h in r['hands'].values() for s,cs in h.items() for c in cs]
  if len(cards)!=52 or len(set(cards))!=52 or any(sum(map(len,h.values()))!=13 for h in r['hands'].values()): invalid.append(r['id'])
print(json.dumps({'boards':len(results),'invalidCardExtractions':invalid,'missingContract':[r['id'] for r in results if not r['contract'] or not r['declarer']],'missingAuction':[r['id'] for r in results if not r['auction']]}))
