"""Plain archival identification: original title, translation, year and place."""
from io import BytesIO
from pathlib import Path
from pypdf import PdfReader
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor

W,H=960,540
FONT='JusticeTitleJP'
if FONT not in pdfmetrics.getRegisteredFontNames():
    pdfmetrics.registerFont(TTFont(FONT,'/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))

def lines(text,font,size,width):
    result=[]
    for paragraph in text.split('\n'):
        # Japanese can wrap between characters; English wraps only at spaces.
        japanese=font==FONT
        tokens=list(paragraph) if japanese else paragraph.split(' ')
        line=''
        for token in tokens:
            candidate=line+('' if japanese or not line else ' ')+token
            if line and pdfmetrics.stringWidth(candidate,font,size)>width:
                result.append(line);line=token
            else:line=candidate
        if line:result.append(line)
    return result

def original_title_card(work):
    stream=BytesIO();c=canvas.Canvas(stream,pagesize=(W,H))
    c.setFillColor(HexColor('#faf8f2'));c.rect(0,0,W,H,fill=1,stroke=0)
    x,width=70,820
    english=lines(work['original_title'],'Helvetica',36,width)
    japanese=lines(work['title_translation_ja'],FONT,24,width)
    total=len(english)*45+28+len(japanese)*34+48+22
    top=(H+total)/2-35;y=top
    c.setFillColor(HexColor('#40382f'));c.setFont('Helvetica',36)
    for line in english:c.drawString(x,y,line);y-=45
    y-=20;c.setFont(FONT,24)
    for line in japanese:c.drawString(x,y,line);y-=34
    y-=35;c.setFont('Helvetica',18);c.setFillColor(HexColor('#70685f'))
    c.drawString(x,y,f"{work['year']}  /  {work['place']}")
    assert y>45 and top<485,(work['id'],top,y)
    c.linkURL(work['title_source'],(x,55,890,485),relative=0,thickness=0)
    c.showPage();c.save()
    return PdfReader(stream).pages[0]
