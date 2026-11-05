"""Reorder the 50-page Nov 5 Week 6 deck, preserving retained PDF pages.

Usage: python scripts/reorder-week6-justice.py /path/to/50-page-baseline.pdf
The numbered cuts refer to that baseline, before any pages move.
"""
from io import BytesIO
from pathlib import Path
import json,sys
from PIL import Image
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
ROOT=Path(__file__).resolve().parents[1]
DECK=ROOT/'lectures/w06_lores.pdf'
reader=PdfReader(sys.argv[1] if len(sys.argv)>1 else DECK)
assert len(reader.pages)==50,'Use the 50-slide baseline, not the already reordered deck.'
notes_path=ROOT/'lectures/w06_lores.notes.json'
old_notes={n['page']:n for n in json.loads((Path(sys.argv[2]) if len(sys.argv)>2 else notes_path).read_text())['slides']}
source='https://upload.wikimedia.org/wikipedia/commons/8/82/Slaveshipposter.jpg'
stream=BytesIO();c=canvas.Canvas(stream,pagesize=(960,540))
# Keep the original scan at native resolution. The PDF clips the scan to each
# complete view; it does not rasterize the diagram into a low-resolution slide.
for l,t,r,b in [(180,1320,3660,2460),(20,20,3930,1260)]:
    im=Image.open(ROOT/'assets/images/week06/brookes-poster.jpg')
    iw,ih=im.size;scale=min(960/(r-l),500/(b-t))
    x=(960-(r-l)*scale)/2;y=(540-(b-t)*scale)/2
    c.setFillColorRGB(.972,.964,.94);c.rect(0,0,960,540,fill=1,stroke=0)
    c.saveState();clip=c.beginPath();clip.rect(x,y,(r-l)*scale,(b-t)*scale);c.clipPath(clip,stroke=0)
    c.drawImage(ImageReader(str(ROOT/'assets/images/week06/brookes-poster.jpg')),x-l*scale,y-(ih-b)*scale,iw*scale,ih*scale)
    c.restoreState();c.linkURL(source,(0,0,960,540),relative=0,thickness=0);c.showPage()
c.save();views=PdfReader(stream)
removed={5,6,8,13,14,15}
# Graphic, then context. The duplicate full poster is replaced by the second view.
order=['brookes-plan','brookes-section',23,26,25,28,27,30,29]
body=[n for n in range(1,50) if n not in removed and not 23<=n<=30 and n!=12]
body.insert(body.index(9),12)
order+=body
writer=PdfWriter();notes=[]
for item in order:
    if isinstance(item,int):
        writer.add_page(reader.pages[item-1])
        if item in old_notes:
            note=dict(old_notes[item]);note['page']=len(writer.pages);notes.append(note)
    else:
        idx=0 if item=='brookes-plan' else 1
        writer.add_page(views.pages[idx]);base=dict(old_notes[24]);base['page']=len(writer.pages)
        base['title']='Brookes / lower-deck plan' if idx==0 else 'Brookes / longitudinal section'
        base['ja']=('Brookes号の下甲板を上から見た配置図。繰り返す人の身体が、人数と空間の関係を示す。規制後の収容配置であり、実際の航海の平均を示したものではない。' if idx==0 else 'Brookes号の縦断面。棚状の区画と高さ方向の制約が見える。元の印刷物には人間性を奪う歴史的な表現が含まれる。この図だけでは、描かれた人々の人生、抵抗、主体性を表せない。')
        base['en']=('Plan of the lower deck of the Brookes. Repeated human figures connect capacity to physical space. This represents regulated stowage, not an average of actual voyages.' if idx==0 else 'Longitudinal section of the Brookes, showing platforms and vertical constraints. The historic print contains dehumanizing language. The diagram cannot convey the full lives, resistance, and agency of the people represented.')
        notes.append(base)
# Context now follows the image, so references in retained notes must follow too.
for n in notes:
    n['ja']=n['ja'].replace('凡例は前のスライドに原図のまま掲載。','凡例は次のスライドに原図のまま掲載。').replace('前のスライドには原図の凡例を掲載','次のスライドには原図の凡例を掲載')
    n['en']=n['en'].replace('The preceding slide reproduces','The following slide reproduces')
assert len(writer.pages)==44
writer.compress_identical_objects(remove_duplicates=True,remove_unreferenced=True)
tmp=DECK.with_suffix('.tmp.pdf')
with tmp.open('wb') as out:writer.write(out)
tmp.replace(DECK)
notes_path.write_text(json.dumps(dict(file='lectures/w06_lores.pdf',slides=notes),ensure_ascii=False,indent=2)+'\n')
(ROOT/'lectures/w06-order.json').write_text(json.dumps(dict(baseline_pages=50,removed=sorted(removed),order=order),indent=2)+'\n')
print('44 slides: two Brookes views, context, then three graphic/context pairs; original 12 precedes original 9.')
