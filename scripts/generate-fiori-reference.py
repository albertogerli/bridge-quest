"""Generate new reference sheets and PDF downloads. Originals are not overwritten.
Source: FIGB Corso Fiori 2022, pp. 24–30. These are BridgeLab summaries, not official FIGB pages.
Uses reportlab + pypdf; render with pdftoppm and inspect before release.
"""
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
import subprocess

root = Path(__file__).resolve().parents[1]
font = Path('/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
if not font.exists():
    font = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
pdfmetrics.registerFont(TTFont('Reference', str(font)))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='RefTitle', fontName='Reference', fontSize=23, leading=29, textColor=colors.HexColor('#075b44'), spaceAfter=15))
styles.add(ParagraphStyle(name='RefBody', fontName='Reference', fontSize=11, leading=17, spaceAfter=12))
styles.add(ParagraphStyle(name='RefSmall', fontName='Reference', fontSize=9, leading=13, textColor=colors.HexColor('#52605b'), spaceAfter=10))

sheets = {
 'it': {
  7: ('Scegliere l’apertura', [
   'Quinta maggiore, quadri quarto. Riferimento: FIGB Fiori 2022, pagine 24–27.',
   'Con una mano bilanciata (4333, 4432, 5332), prima controlla la fascia di forza:',
  ], [['Punti onori', 'Apertura'], ['15–17', '1SA'], ['21–23', '2SA'], ['24 o più', '2♣, poi descrivi la bilanciata']], [
   'Con 12–14 o 18–20 punti bilanciati si apre a colore: un maggiore richiede cinque carte; altrimenti 1♦ con almeno quattro quadri, oppure 1♣ anche con sole due fiori.',
   'Per le sbilanciate da 12–20: con un solo colore lungo apri quello; con due colori entrambi quinti o più, il testo Fiori 2022 indica il più alto di rango.',
   'Forti a colore: 21+ punti oppure circa 8½–9 vincenti. Il colore deve essere sesto, o quinto affiancato da un altro colore almeno quarto. La valutazione delle vincenti non coincide con il conteggio dei punti.',
   '2♣ è ambiguo: bilanciata da 24 oppure mano forte a base fiori. Le aperture forti a colore sono forzanti per un giro: il rispondente non passa.',
   'Esempio: ♠J ♥KQJ74 ♦AK4 ♣AQ63 = 20 punti. Non è una bilanciata: l’apertura ordinaria è 1♥, non 1♣ e non automaticamente 2♥.',
  ]),
  8: ('Senza atout e Stayman', [
   'Riferimento: FIGB Fiori 2022, pagine 28–30. 1SA: 15–17 punti. 2SA: 21–23. Entrambe richiedono una bilanciata.',
   'Nel corso Fiori le risposte a colore sono naturali. I transfer sono accordi aggiuntivi e devono essere dichiarati nell’esercizio.',
   'Stayman cerca il fit 4–4 nei maggiori. Su 1SA si interroga con 2♣; su 2SA con 3♣. Le risposte previste sono quattro:',
  ], [['Distribuzione dell’apertore', 'Su 2♣', 'Su 3♣'], ['Nessuna quarta maggiore', '2♦', '3♦'], ['Quattro cuori, non quattro picche', '2♥', '3♥'], ['Quattro picche, non quattro cuori', '2♠', '3♠'], ['Entrambe le quarte maggiori', '2SA', '3SA']], [
   'La risposta 2SA alla Stayman su 1SA esiste in questo sistema. Anche 3SA alla Stayman su 2SA esiste: indica entrambe le quarte maggiori.',
   'Non confondere ruoli e sequenze: il 3SA diretto del rispondente su 2SA è una scelta di contratto; il 3SA dell’apertore dopo 3♣ descrive le due quarte maggiori.',
   'Esempio: su 2SA, ♠43 ♥K52 ♦AJ952 ♣976 vale 8 punti. La linea ha 29–31 punti e nessuna quarta maggiore da cercare: 3SA.',
   'Le convenzioni delle altre edizioni o dei corsi avanzati non si trasferiscono automaticamente a questo sistema.',
  ])},
 'en': {
  7: ('Choosing the opening bid', [
   'Five-card majors, four-card diamonds. Reference: FIGB Fiori 2022, pages 24–27.',
   'With a balanced hand (4333, 4432, 5332), check the high-card point range first:',
  ], [['HCP', 'Opening'], ['15–17', '1NT'], ['21–23', '2NT'], ['24 or more', '2♣, then describe the balanced hand']], [
   'With balanced 12–14 or 18–20 HCP, open a suit: a major requires five cards; otherwise 1♦ requires four diamonds, or open 1♣ even with only two clubs.',
   'With an unbalanced 12–20 HCP: open the only long suit, or, with two suits both at least five cards long, the higher-ranking suit as specified in Fiori 2022.',
   'Strong suit openings: 21+ HCP or about 8½–9 winners. The suit must be six cards long, or five with another suit of at least four cards. Counting winners is different from counting HCP.',
   '2♣ is ambiguous: a balanced 24+ HCP or a strong club-based hand. Strong suit openings are forcing for one round: responder must not pass.',
   'Example: ♠J ♥KQJ74 ♦AK4 ♣AQ63 = 20 HCP. It is not balanced: the ordinary opening is 1♥, not 1♣ and not automatically 2♥.',
  ]),
  8: ('Notrump and Stayman', [
   'Reference: FIGB Fiori 2022, pages 28–30. 1NT: 15–17 HCP. 2NT: 21–23 HCP. Both require a balanced hand.',
   'Fiori uses natural suit responses. Transfers are additional agreements and must be explicitly stated in an exercise.',
   'Stayman looks for a 4–4 major-suit fit. Ask with 2♣ over 1NT or 3♣ over 2NT. There are four responses:',
  ], [['Opener’s shape', 'Over 2♣', 'Over 3♣'], ['No four-card major', '2♦', '3♦'], ['Four hearts, not four spades', '2♥', '3♥'], ['Four spades, not four hearts', '2♠', '3♠'], ['Both four-card majors', '2NT', '3NT']], [
   'In this system, 2NT is a Stayman response over 1NT. Likewise, 3NT is a Stayman response over 2NT: both show both four-card majors.',
   'Do not confuse roles and sequences: responder’s direct 3NT over 2NT chooses a contract; opener’s 3NT after 3♣ describes both four-card majors.',
   'Example: over 2NT, ♠43 ♥K52 ♦AJ952 ♣976 has 8 HCP. The partnership has 29–31 HCP and no four-card major to explore: bid 3NT.',
   'Agreements from other editions or advanced courses do not automatically apply to this system.',
  ])}
}
for lang, lessons in sheets.items():
    folder = root / 'public/infografiche' / ('en/fiori' if lang == 'en' else 'fiori')
    for number, (title, intro, rows, body) in lessons.items():
        path = folder / f'lezione-{number:02}-junior-rev2022.pdf'
        story = [Paragraph('BridgeLab · Fiori 2022', styles['RefSmall']), Paragraph(title, styles['RefTitle'])]
        story.extend(Paragraph(p, styles['RefBody']) for p in intro)
        table = Table([[Paragraph(c, styles['RefBody']) for c in row] for row in rows], colWidths=[270,95,95] if len(rows[0])==3 else [145,315])
        table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8f2ed')),('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),3),('LINEBELOW',(0,0),(-1,-1),0.3,colors.HexColor('#cedbd4'))]))
        story.extend([table, Spacer(1,14)])
        story.extend(Paragraph(p, styles['RefBody']) for p in body)
        note = 'Sintesi BridgeLab, non dispensa ufficiale. Revisione 23/09/2026.' if lang=='it' else 'BridgeLab summary, not an official handout. Revised 23 September 2026.'
        story.append(Paragraph(note, styles['RefSmall']))
        SimpleDocTemplate(str(path), pagesize=A4, leftMargin=48, rightMargin=48, topMargin=38, bottomMargin=35).build(story)
        if len(PdfReader(path).pages) != 1: raise RuntimeError(f'Unexpected overflow: {path}')
        subprocess.run(['pdftoppm','-singlefile','-scale-to','1500','-jpeg',str(path),str(path.with_suffix(''))],check=True)
        print(path.relative_to(root))

# Supply missing English downloads from the existing displayed images: format conversion,
# NOT a new semantic review of those images. No original JPG/PNG is changed.
english = root / 'public/infografiche/en'
for folder in [p for p in english.iterdir() if p.is_dir()]:
    pdfs = []
    for image in sorted(folder.glob('lezione-*-junior.jpg')):
        revision = image.with_name(image.stem+'-rev2022.pdf')
        pdf = revision if revision.exists() else image.with_suffix('.pdf')
        if not pdf.exists():
            width,height = ImageReader(str(image)).getSize()
            c = canvas.Canvas(str(pdf), pagesize=(width*0.48,height*0.48))
            c.drawImage(str(image),0,0,width=width*0.48,height=height*0.48)
            c.save()
        pdfs.append(pdf)
    if pdfs:
        writer=PdfWriter()
        for pdf in pdfs: writer.append(pdf)
        suffix='-rev2022' if folder.name=='fiori' else ''
        writer.write(folder/f'corso-{folder.name}-junior{suffix}.pdf')
        print(f'English PDF downloads: {folder.name}, {len(pdfs)} lessons')

folder=root/'public/infografiche/fiori'
writer=PdfWriter()
for pdf in sorted(folder.glob('lezione-*-junior.pdf')):
    revised=pdf.with_name(pdf.stem+'-rev2022.pdf')
    writer.append(revised if revised.exists() else pdf)
writer.write(folder/'corso-fiori-junior-rev2022.pdf')
