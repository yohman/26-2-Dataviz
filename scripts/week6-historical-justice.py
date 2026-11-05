"""Insert four sourced historical case studies after the social-justice introduction.

Run against the 42-page Week 6 deck (or supply that baseline as the first argument).
Full-bleed details retain the unaltered, full-resolution scans in the PDF; every
graphic links to its complete source. Original pages retain their content and order.
"""
import json
import re
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/images/week06'
DECK = ROOT / 'lectures/w06_lores.pdf'
W, H = 960, 540
pdfmetrics.registerFont(TTFont('JP', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
PAPER, INK = '#faf8f2', '#40382f'
from week6_title_cards import original_title_card
CASES = json.loads((ASSETS/'historical-justice-sources.json').read_text())['cases']

def build_page(draw):
    stream=BytesIO(); c=canvas.Canvas(stream,pagesize=(W,H)); draw(c); c.showPage(); c.save()
    return PdfReader(stream).pages[0]

def clipped_image(c,path,crop):
    """Fill the slide with a documented detail, keeping native image pixels."""
    l,t,r,b=crop
    assert abs((r-l)/(b-t)-W/H)<0.003, crop
    with Image.open(path) as im: iw,ih=im.size
    scale=W/(r-l)
    c.saveState(); clip=c.beginPath(); clip.rect(0,0,W,H); c.clipPath(clip,stroke=0)
    c.drawImage(ImageReader(str(path)),-l*scale,H-(ih-t)*scale,iw*scale,ih*scale)
    c.restoreState()

def context_slide(case):
    return original_title_card(case)

def graphic_slide(case):
    def draw(c):
        clipped_image(c,ASSETS/case['image'],case['crop'])
        c.linkURL(case['original'],(0,0,W,H),relative=0,thickness=0)
    return build_page(draw)

reader=PdfReader(sys.argv[1] if len(sys.argv)>1 else DECK)
assert len(reader.pages)==42, 'Use the 42-page baseline; do not insert this sequence twice.'
assert 'socialjustice' in re.sub('[^a-z]', '', reader.pages[21].extract_text().lower()), 'Expected the social-justice introduction at slide 22.'
writer=PdfWriter(); notes=[]
for page in reader.pages[:22]: writer.add_page(page)
for case in CASES:
    sources=[case['source'],case.get('extra',case['original'])]
    writer.add_page(context_slide(case))
    notes.append(dict(page=len(writer.pages),title=case['original_title'],ja=case['ja'],en=case['en'],sources=sources))
    writer.add_page(graphic_slide(case))
    notes.append(dict(page=len(writer.pages),title=case['original_title']+' / detail',ja=case['detail_ja'],en=case['detail_en'],sources=[case['original'],case['source']]))
for page in reader.pages[22:]: writer.add_page(page)
notes.append(dict(page=len(writer.pages),title='Brookes / complete poster',ja='以前追加したBrookes号の全図。新しい歴史事例の部分図と同じ資料で、図をクリックすると原解像度のスキャンが開く。',en='The previously added complete Brookes poster. This is the same source as the new historical detail. Its link opens the full-resolution scan.',sources=[CASES[0]['original'],CASES[0]['source']]))
temporary=DECK.with_suffix('.tmp.pdf')
with temporary.open('wb') as output: writer.write(output)
temporary.replace(DECK)
(ROOT/'lectures/w06_lores.notes.json').write_text(json.dumps(dict(file='lectures/w06_lores.pdf',slides=notes),ensure_ascii=False,indent=2)+'\n')
(ASSETS/'historical-justice-sources.json').write_text(json.dumps(dict(insertion_after=22,cases=CASES),ensure_ascii=False,indent=2)+'\n')
print(f'{len(reader.pages)} original pages preserved + 8 new pages = {len(writer.pages)} slides. New cases: 23-30.')
