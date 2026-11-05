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
CASES = [
    dict(id='brookes', title='奴隷貿易を、止めるために。', english='The Brookes diagram and the abolition campaign',
         where='1788-1789  /  Britain & the Atlantic', color='#ad3d50',
         cause='船内の寸法と人の身体で、奴隷貿易の非人道性を示す。',
         impact='廃止運動のなかで、繰り返し配布された図。',
         image='brookes-poster.jpg', crop=[0, 1500, 3952, 3723],
         original='https://upload.wikimedia.org/wikipedia/commons/8/82/Slaveshipposter.jpg',
         source='https://archives.history.ac.uk/1807commemorated/exhibitions/museums/brookes.html',
         credit='Plymouth abolition committee / Library of Congress',
         ja='Brookes号の図は1788年にPlymouthの奴隷貿易廃止団体から出版され、その後広く複製・配布された。廃止運動の視覚的な訴えの一部であり、この図だけで廃止が実現したわけではない。図は規制後の配置を表し、実際の航海の過密状態をそのまま記録した写真ではない。',
         en='First published by abolitionists in Plymouth in 1788 and widely reproduced afterward, the Brookes diagram formed part of the campaign against the slave trade. It did not bring about abolition on its own. The layout represents regulated stowage rather than a photograph or an average of actual voyages.',
         detail_ja='下甲板と追加の棚状区画の部分図。各人の身体を並べることで、収容人数と空間の関係が見える。元の印刷物には現在では差別的とされる表現が含まれる。人々の抵抗・主体性までを、この配置図だけで表せるわけではない。巻末には従来の全図も残している。',
         detail_en='Detail of the lower deck and additional platforms. Repeated human figures connect capacity to physical space. The historic print contains dehumanizing language, and the arrangement cannot communicate the full lives, resistance, and agency of the people represented. The previously added complete poster remains at the end of the deck.'),
    dict(id='booth', title='貧困を、街路ごとに。', english='Charles Booth: making urban poverty visible',
         where='1898-1899  /  East Central London, Britain', color='#497780',
         cause='街路を色分けし、暮らしの格差を公共の議論へ。',
         impact='社会調査は、Boothの公的な老齢年金の提唱にもつながった。',
         image='booth-poverty-sheet5.jpg', crop=[400, 2100, 4800, 4575],
         legend=('booth-poverty-sheet5.jpg', [350, 6700, 4880, 7100]),
         original='https://client-files.humap.site/booth/sheet5.jpg',
         source='https://booth.lse.ac.uk/learn-more/what-were-the-poverty-maps',
         extra='https://booth.lse.ac.uk/learn-more/who-was-charles-booth',
         credit='Charles Booth inquiry / LSE Library / Sheet 5 (detail)',
         ja='Charles Boothのロンドン調査は1886-1903年。最初の貧困地図は1889年で、この図は1898-99年版の第5図。調査員は警察官の巡回に同行するなどして街路の情報を集めた。Boothは公的な老齢年金を提唱したが、地図が単独で制度を生んだという因果関係は示せない。',
         en='Booth’s London inquiry ran from 1886 to 1903. The first poverty map appeared in 1889; this is Sheet 5 of the 1898-99 edition. Investigators gathered street-level evidence, including walks with police officers. Booth advocated state old-age pensions; that does not establish that a map alone caused the policy.',
         detail_ja='East Central Districtの部分図。色は住民の所得・社会階層の分類で、人口密度ではない。複数色が同じ街路に使われることもある。凡例は前のスライドに原図のまま掲載。最下層を道徳的に評価する当時の言葉が残り、分類は観察者の視点にも依存している。',
         detail_en='Detail of the East Central District. Street colors classify income and social class, not population density; mixed colors can represent different classes on one street. The preceding slide reproduces the original legend. Its moralizing language about poor people also reveals the investigators’ perspective.'),
    dict(id='hullhouse', title='働いても、貧しい。', english='Hull-House: evidence from the neighborhood',
         where='1895  /  Near West Side, Chicago, USA', color='#a67a2c',
         cause='移民の多い地区を戸別調査し、家族の週収を地図に。',
         impact='労働と住環境の改善を求める、地域に根ざした社会調査。',
         image='hull-house-wages.jpg', crop=[150, 1100, 2550, 2450],
         legend=('hull-house-wages-legend-source.jpg', [300, 2080, 2850, 2300]),
         original='https://upload.wikimedia.org/wikipedia/commons/4/4e/WAGEMAP1.pdf',
         source='https://dcc.newberry.org/?p=17805',
         extra='https://socialwelfare.library.vcu.edu/settlement-houses/hull-house-sociological-laboratory-1894/',
         credit='Hull-House residents / Samuel Sewell Greeley / 1895',
         ja='Hull-House Maps and Papersは1895年に刊行され、Chicagoの移民の多い地区の賃金と出身の分類を地図化した。Jane AddamsとEllen Gates Starrが1889年に設立したHull Houseを拠点とする共同の調査。個人の伝記ではなく、住宅・労働条件を街区の証拠として見せる試みだった。',
         en='Published in 1895, Hull-House Maps and Papers mapped wages and nationality classifications in a Chicago immigrant neighborhood. This was collaborative research associated with the settlement founded by Jane Addams and Ellen Gates Starr in 1889. The maps made household and labor conditions visible block by block.',
         detail_ja='Wage Map No. 1の部分図。色は家族全体の1週間の収入区分であり、個人の時給ではない。建物には複数の色が並ぶ。凡例の紫は「不明」で、高所得を示さない。前のスライドには原図の凡例を掲載し、図のリンクから全体を確認できる。',
         detail_en='Detail of Wage Map No. 1. Colors represent total weekly family earnings, not individual hourly pay. Several colors can appear within a building. Purple means unknown, not high income. The preceding slide reproduces the historic legend; the linked original supplies the complete map.'),
    dict(id='redlining', title='地図が、差別をつくるとき。', english='Redlining: housing discrimination in color',
         where='1939  /  Los Angeles, USA', color='#587865',
         cause='住宅地の評価に人種的偏見を組み込み、排除を制度化。',
         impact='現在は、住宅差別の仕組みを検証する一次資料に。',
         image='holc-los-angeles-1939.jpg', crop=[250, 100, 1870, 1011.25],
         original='https://scalar.usc.edu/hc/jewish-histories-boyle-heights/media/losangelesholc-med.jpg',
         source='https://dsl.richmond.edu/panorama/redlining/map/CA/LosAngeles',
         extra='https://planning.lacity.gov/odocument/7db8747f-87fb-4c6f-bb95-5482be050683/SurveyLA_AfricanAmericanHCS_05242019.pdf',
         credit='Home Owners’ Loan Corporation / Los Angeles / 1939 (detail)',
         ja='1939年のHOLC住宅地評価図。評価には住宅・経済的な条件に加え、人種や民族に対する偏見が組み込まれていた。これは正義を実現した地図ではなく、差別的な制度の記録。現在のMapping Inequalityなどは、地図と地区説明書を公開し、その仕組みの検証を可能にしている。',
         en='The 1939 HOLC residential-security map incorporated racial and ethnic prejudice alongside housing and economic criteria. This is a record of discriminatory institutions, not a map that advanced justice when created. Projects such as Mapping Inequality now make the maps and neighborhood descriptions available for scrutiny.',
         detail_ja='Los Angeles中央部の部分図。緑・青・黄・赤は当時の評価区分A-Dであり、実測された人種構成の割合を表す色ではない。現在の犯罪率の地図でもない。境界・色は元の地図のまま。地図の存在だけで個々の融資拒否との因果関係までは立証できない。',
         detail_en='Detail of central Los Angeles. Green, blue, yellow, and red encode grades A-D, not measured percentages of racial groups or present-day crime rates. Boundaries and colors are unchanged from the historic map. The map alone does not establish the cause of an individual lending decision.'),
]

def label(c, value, x, y, size=22, color=INK, font='JP'):
    c.setFillColor(HexColor(color)); c.setFont(font,size); c.drawString(x,y,value)

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
    def draw(c):
        c.setFillColor(HexColor(PAPER));c.rect(0,0,W,H,fill=1,stroke=0)
        c.setFillColor(HexColor(case['color']));c.rect(0,0,12,H,fill=1,stroke=0)
        label(c,'DATA / POWER / CHANGE',65,482,12,case['color'],'Helvetica-Bold')
        label(c,case['title'],65,393,52)
        label(c,case['english'],68,350,20,color=case['color'],font='Helvetica')
        label(c,case['where'],68,289,25,font='Helvetica')
        label(c,case['cause'],68,233,21)
        label(c,case['impact'],68,191,19,case['color'])
        if case.get('legend'):
            name,box=case['legend']; legend=Image.open(ASSETS/name).crop(box)
            iw,ih=legend.size; width=820; height=width*ih/iw
            c.drawImage(ImageReader(legend),68,58,width,height)
        elif case['id']=='redlining':
            for i,(color,grade,term) in enumerate([('#76a865','A','Best'),('#7cb5bd','B','Still desirable'),('#e8cc3b','C','Definitely declining'),('#ce6666','D','Hazardous')]):
                x=68+i*215;c.setFillColor(HexColor(color));c.circle(x+9,100,9,fill=1,stroke=0)
                label(c,f'{grade}  {term}',x+28,95,12,font='Helvetica')
        label(c,case['credit'],68,22,10,font='Helvetica')
        label(c,'MAP / DIAGRAM DETAIL',710,22,9,color=case['color'],font='Helvetica')
        c.linkURL(case['source'],(65,12,890,39),relative=0,thickness=0)
    return build_page(draw)

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
    notes.append(dict(page=len(writer.pages),title=case['english'],ja=case['ja'],en=case['en'],sources=sources))
    writer.add_page(graphic_slide(case))
    notes.append(dict(page=len(writer.pages),title=case['english']+' / detail',ja=case['detail_ja'],en=case['detail_en'],sources=[case['original'],case['source']]))
for page in reader.pages[22:]: writer.add_page(page)
notes.append(dict(page=len(writer.pages),title='Brookes / complete poster',ja='以前追加したBrookes号の全図。新しい歴史事例の部分図と同じ資料で、図をクリックすると原解像度のスキャンが開く。',en='The previously added complete Brookes poster. This is the same source as the new historical detail. Its link opens the full-resolution scan.',sources=[CASES[0]['original'],CASES[0]['source']]))
temporary=DECK.with_suffix('.tmp.pdf')
with temporary.open('wb') as output: writer.write(output)
temporary.replace(DECK)
(ROOT/'lectures/w06_lores.notes.json').write_text(json.dumps(dict(file='lectures/w06_lores.pdf',slides=notes),ensure_ascii=False,indent=2)+'\n')
(ASSETS/'historical-justice-sources.json').write_text(json.dumps(dict(insertion_after=22,cases=CASES),ensure_ascii=False,indent=2)+'\n')
print(f'{len(reader.pages)} original pages preserved + 8 new pages = {len(writer.pages)} slides. New cases: 23-30.')
