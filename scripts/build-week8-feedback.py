from pathlib import Path
from io import BytesIO
import json,math,subprocess,tempfile,urllib.request
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor,Color
ROOT=Path(__file__).resolve().parents[1]
# The last pre-insertion deck is the source; repeated builds never duplicate slides.
ORIGINAL=subprocess.check_output(['git','show','ed0c7e0:lectures/w08.pdf'],cwd=ROOT)
pdfmetrics.registerFont(TTFont('Georgia','/System/Library/Fonts/Supplemental/Georgia.ttf'))
pdfmetrics.registerFont(TTFont('GeorgiaBold','/System/Library/Fonts/Supplemental/Georgia Bold.ttf'))
jp_font=Path(tempfile.gettempdir())/'week8-framework/NotoSerifJP-full.ttf'
if not jp_font.exists():
 jp_font.parent.mkdir(parents=True,exist_ok=True)
 jp_font.write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifjp/NotoSerifJP%5Bwght%5D.ttf',timeout=30).read())
pdfmetrics.registerFont(TTFont('JP',str(jp_font)))
PAPER='#faf8f2';INK='#40392f';RED='#ad3d50';GOLD='#b78631';GREEN='#5f7651';BLUE='#456d78';LIGHT='#d8d0c1'
W,H=960,540
buf=BytesIO();c=canvas.Canvas(buf,pagesize=(W,H))
c.setTitle('Week 8 - Reflection, critique and iteration')
def bg():c.setFillColor(HexColor(PAPER));c.rect(0,0,W,H,stroke=0,fill=1)
def text(x,y,s,size=24,font='Georgia',color=INK,align='left'):
 c.setFillColor(HexColor(color));c.setFont(font,size)
 (c.drawCentredString if align=='center' else c.drawRightString if align=='right' else c.drawString)(x,y,s)
def line(x1,y1,x2,y2,color=LIGHT,width=1):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x1,y1,x2,y2)
def arrow(x1,y1,x2,y2,color=GOLD,width=2):
 line(x1,y1,x2,y2,color,width)
 a=math.atan2(y2-y1,x2-x1);r=9
 for delta in [-.5,.5]:line(x2,y2,x2-r*math.cos(a+delta),y2-r*math.sin(a+delta),color,width)
def curve_arrow(points,color=GOLD):
 c.setStrokeColor(HexColor(color));c.setLineWidth(2);p=c.beginPath();p.moveTo(*points[0]);p.curveTo(*points[1],*points[2],*points[3]);c.drawPath(p)
 x,y=points[3];px,py=points[2];a=math.atan2(y-py,x-px)
 for d in [-.5,.5]:line(x,y,x-9*math.cos(a+d),y-9*math.sin(a+d),color,2)
# 1983: actual publisher cover; original-publication date, not a claim about this cover edition.
bg();c.drawImage(str(ROOT/'assets/images/lecture/week08-schon-cover.jpg'),90,76,width=246,height=386,mask='auto')
text(425,365,'1983',100)
text(430,299,'Donald Schön',34)
text(430,229,'Reflection-in-action',29,color=RED)
text(430,185,'行為の中の省察',25,font='JP')
c.linkURL('https://www.routledge.com/The-Reflective-Practitioner-How-Professionals-Think-in-Action/Schon/p/book/9781857423198',(90,76,336,462),relative=0)
c.showPage()
# 2003: the original question that prompted the framework.
bg();text(75,447,'2003',34,color=RED)
text(75,337,'How do we describe',54)
text(75,262,'design process?',64)
text(80,173,'デザインの過程を、どう表す？',25,font='JP')
text(80,89,'Richard Eisermann · Design Council',17,color=BLUE)
c.linkURL('https://www.designcouncil.org.uk/resources/the-double-diamond/history-of-the-double-diamond/',(0,0,W,H),relative=0)
c.showPage()
# 2004: a course redraw of the Design Council model, with an explicit return path.
bg();text(65,457,'Double Diamond',37);text(895,460,'2004',28,color=RED,align='right')
xs=[82,282,482,682,882];cy=286;dy=126
for i,(x1,x2,col) in enumerate([(xs[0],xs[2],BLUE),(xs[2],xs[4],RED)]):
 mid=(x1+x2)/2
 c.setFillColor(HexColor(col));c.setFillAlpha(.09);p=c.beginPath();p.moveTo(x1,cy);p.lineTo(mid,cy+dy);p.lineTo(x2,cy);p.lineTo(mid,cy-dy);p.close();c.drawPath(p,stroke=0,fill=1);c.setFillAlpha(1)
 for a,b in [((x1,cy),(mid,cy+dy)),((mid,cy+dy),(x2,cy)),((x2,cy),(mid,cy-dy)),((mid,cy-dy),(x1,cy))]:line(*a,*b,col,2)
 line(mid,cy-dy,mid,cy+dy,col,.6)
for x,en,ja in [(182,'Discover','探る'),(382,'Define','絞る'),(582,'Develop','試す'),(782,'Deliver','仕上げる')]:
 text(x,293,en,24,align='center');text(x,258,ja,20,font='JP',align='center')
curve_arrow([(807,139),(785,74),(566,73),(545,139)],RED)
text(895,40,'Design Council · course adaptation',11,color=BLUE,align='right')
c.linkURL('https://www.designcouncil.org.uk/resources/framework-for-innovation/',(0,0,W,H),relative=0)
c.showPage()
# 2026: the same principle applied to our class, illustrated with real Gapminder values.
bg();text(65,464,'2026',30,color=RED)
examples=json.loads((ROOT/'data/week07-examples.json').read_text())
# Source has five country/year observations used by Week 7's bar chart.
countries={r['country'] for r in examples['series']}
values=[(r['country'],float(r['life'])) for r in examples['scatter'] if r['country'] in countries]
assert len(values)==5
lefts=[65,365,665]
for phase,x in enumerate(lefts):
 if phase<2:
  line(x+16,232,x+218,232,INK,1);line(x+16,232,x+16,375,INK,1)
  for i,(country,val) in enumerate(values):
   h=val/90*130;c.setFillColor(HexColor(BLUE));c.rect(x+33+i*35,233,23,h,stroke=0,fill=1)
  if phase==1:
   text(x+195,389,'?',44,color=RED)
   line(x+192,372,x+165,338,RED,1.4)
 else:
  for i,(country,val) in enumerate(sorted(values,key=lambda r:r[1],reverse=True)):
   y=357-i*29
   label={'United States':'USA','Sweden':'Sweden','Japan':'Japan','China':'China','India':'India'}.get(country,country)
   text(x+66,y+1,label,13,align='right')
   c.setFillColor(HexColor(GREEN));c.rect(x+75,y-3,val/90*108,14,stroke=0,fill=1)
   text(x+75+val/90*108+6,y+1,f'{val:.1f}',11)
  text(x+75,194,'Life expectancy · 2018',11,color=BLUE)
for x,jp,en in zip(lefts,['つくる','見せる','つくり直す'],['Make','Critique','Revise']):
 text(x+122,150,jp,29,font='JP',align='center');text(x+122,115,en,20,color=BLUE,align='center')
arrow(310,301,347,301);arrow(610,301,647,301)
curve_arrow([(793,82),(796,16),(191,16),(187,82)],RED)
c.showPage();c.save()
add=PdfReader(BytesIO(buf.getvalue()));original=PdfReader(BytesIO(ORIGINAL));writer=PdfWriter()
for p in original.pages[:2]:writer.add_page(p)
for p in add.pages:writer.add_page(p)
for p in original.pages[2:]:writer.add_page(p)
writer.add_metadata({'/Title':'Week 8 - XAVIZ and group projects','/Subject':'Four added slides on reflective practice and the Double Diamond'})
with (ROOT/'lectures/w08.pdf').open('wb') as f:writer.write(f)
# Verify each original page's drawing/text stream is preserved after insertion.
final=PdfReader(ROOT/'lectures/w08.pdf');assert len(final.pages)==11
for i,p in enumerate(original.pages):
 target=i if i<2 else i+4
 assert p.get_contents().get_data()==final.pages[target].get_contents().get_data(),(i,target)
print('11 slides; all 7 original page content streams preserved.')
