"""Append the full-resolution Brookes poster without altering existing slides.

Source: https://commons.wikimedia.org/wiki/File:Slaveshipposter.jpg
The JPEG is embedded at its original resolution, with a full-image source link.
"""
from io import BytesIO
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DECK = ROOT / 'lectures/w06_lores.pdf'
IMAGE = ROOT / 'assets/images/week06/brookes-poster.jpg'
SOURCE = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Slaveshipposter.jpg'

reader = PdfReader(DECK)
if any(a.get_object().get('/A', {}).get('/URI') == SOURCE
       for a in reader.pages[-1].get('/Annots', [])):
    raise SystemExit('Brookes poster is already the final slide.')

width, height = 960, 540
with Image.open(IMAGE) as image:
    assert image.size == (3952, 4672), image.size
    iw, ih = image.size
scale = min(width / iw, height / ih)
x, y = (width - iw * scale) / 2, (height - ih * scale) / 2
stream = BytesIO()
c = canvas.Canvas(stream, pagesize=(width, height))
c.setFillColorRGB(1, 1, 1)
c.rect(0, 0, width, height, fill=1, stroke=0)
c.drawImage(ImageReader(str(IMAGE)), x, y, iw * scale, ih * scale)
c.linkURL(SOURCE, (x, y, x + iw * scale, y + ih * scale), relative=0, thickness=0)
c.showPage()
c.save()

writer = PdfWriter()
writer.append(reader)
writer.append(PdfReader(stream))
temporary = DECK.with_suffix('.tmp.pdf')
with temporary.open('wb') as output:
    writer.write(output)
temporary.replace(DECK)
print(f'{len(reader.pages)} original slides preserved; Brookes poster is slide {len(reader.pages)+1}.')
