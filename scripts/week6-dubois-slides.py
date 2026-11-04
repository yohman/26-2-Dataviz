"""Rebuild the Week 6 image-led PDF and bilingual factual viewer notes.

Original lecture preserved as lectures/w06_lores.pdf. No network needed to rebuild.
Charts use values printed on LOC ppmsca.33873 and ppmsca.33876, not inferred pixels.
"""
import json
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
W, H = 960, 540
PAPER, INK, RED, GREEN = '#faf8f2', '#40382f', '#ad3d50', '#527865'
pdfmetrics.registerFont(TTFont('JP', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
original = PdfReader(ROOT / 'lectures/w06_lores.pdf')
writer, notes = PdfWriter(), []
CITY = ROOT / 'assets/images/week06/city-rural.jpg'
LITERACY = ROOT / 'assets/images/week06/illiteracy.jpg'
CITY_SOURCE = 'https://www.loc.gov/item/2013650430/'
LITERACY_SOURCE = 'https://www.loc.gov/pictures/item/2013650433/'
EXHIBIT_SOURCE = 'https://blogs.loc.gov/picturethis/2020/04/african-americans-at-the-turn-of-the-20th-century-a-graphic-visualization/'
CONTEXT_SOURCE = 'https://blogs.loc.gov/inside_adams/2015/02/du-bois-in-paris-exposition-universelle-1900/'
counts = [78139, 8025, 37699, 734952]
categories = ['1万人超の都市', '5千〜1万人の都市', '2,500〜5千人の都市', '農村・村落']

def text(c, value, x, y, size=28, color=INK, center=False):
    c.setFillColor(HexColor(color))
    c.setFont('JP', size)
    (c.drawCentredString if center else c.drawString)(x, y, value)

def picture(c, image, box=(0, 0, W, H)):
    source = ImageReader(image)
    iw, ih = source.getSize()
    x, y, bw, bh = box
    scale = min(bw/iw, bh/ih)
    c.drawImage(source, x+(bw-iw*scale)/2, y+(bh-ih*scale)/2,
                iw*scale, ih*scale, mask='auto')

def legacy_image(number):
    return original.pages[number-1].images[0].image

def slide(title, ja, en, draw, sources=(), minutes=0):
    stream = BytesIO()
    c = canvas.Canvas(stream, pagesize=(W,H))
    c.setFillColor(HexColor(PAPER))
    c.rect(0,0,W,H,fill=1,stroke=0)
    draw(c)
    c.showPage()
    c.save()
    writer.add_page(PdfReader(stream).pages[0])
    notes.append({'page':len(notes)+1, 'title':title, 'ja':ja, 'en':en,
                  'sources':list(sources), 'minutes':minutes})

def city_bars(c, box=(70,80,830,345), small=False):
    x,y,bw,bh = box
    label_width = bw*.31
    chart_width = bw*.56
    row_height = bh/4
    font = 14 if small else 21
    for i,(category,value) in enumerate(zip(categories,counts)):
        yy = y+bh-(i+.7)*row_height
        text(c,category,x,yy+2,font)
        c.setFillColor(HexColor(GREEN if i<3 else RED))
        c.rect(x+label_width,yy,value/800000*chart_width,row_height*.3,fill=1,stroke=0)
        text(c,f'{value:,}',x+label_width+value/800000*chart_width+8,yy+2,font)
    c.setStrokeColor(HexColor('#b8afa3'))
    c.setLineWidth(.5)
    c.line(x+label_width,y-2,x+label_width+chart_width,y-2)
    for tick in [0,200000,400000,600000,800000]:
        xx=x+label_width+tick/800000*chart_width
        c.line(xx,y-2,xx,y-7)
        text(c,str(tick//10000)+'万' if tick else '0',xx,y-24,11 if small else 15,center=True)

slide('City and rural population',
      '1890年のジョージア州の黒人人口。4つの居住地区分を色と長い帯で表し、農村・村落の帯を渦巻きに折り畳んでいる。都市の面積や人口密度を表す地図ではない。',
      'Black population of Georgia in 1890. Four settlement categories appear as colored bands, with the rural band folded into a spiral. This is not a map of city area or population density.',
      lambda c:picture(c,str(CITY)), [CITY_SOURCE], 1)

def portrait(c):
    picture(c,legacy_image(9),(440,65,440,435))
    text(c,'W. E. B.',90,315,48)
    text(c,'Du Bois',90,248,57)
    text(c,'1868–1963',94,194,24)
slide('W. E. B. Du Bois',
      'W. E. B. Du Bois（1868–1963）は社会学者・歴史家・公民権運動家。1895年、黒人として初めてHarvard大学の博士号を取得。1900年の図は個人だけの制作ではなく、Atlanta Universityを拠点とするチームの仕事でもある。',
      'Du Bois (1868–1963) was a sociologist, historian, and civil-rights activist. He became the first African American to earn a Harvard PhD in 1895. The 1900 charts also reflect collaborative work by an Atlanta University-based team.',
      portrait,['https://guides.library.harvard.edu/c.php?g=471403&p=3224164',EXHIBIT_SOURCE],1.5)

def dates(c):
    text(c,'1865',250,285,92,center=True)
    text(c,'1900',710,285,92,center=True)
    text(c,'奴隷制廃止',250,218,25,center=True)
    text(c,'パリ万博',710,218,25,center=True)
    text(c,'35年',480,104,27,RED,True)
slide('1865 / 1900',
      '1865年に合衆国憲法修正第13条が批准され、犯罪に対する刑罰の例外を伴って奴隷制を廃止した。1900年の展示はその35年後。法的な廃止は差別・隔離・権利の制限の終わりを意味しなかった。',
      'The Thirteenth Amendment was ratified in 1865, abolishing slavery with an exception for punishment for crime. The exhibition followed 35 years later. Legal abolition did not end discrimination, segregation, or restrictions on rights.',
      dates,['https://www.archives.gov/milestone-documents/13th-amendment',EXHIBIT_SOURCE],1)

slide('Paris, 1900',
      '1900年のパリ万博は国際的な観客へ届く展示の場だった。原講義のパリ万博の図を継承。図が誰に、どの場所で見られるかも可視化の意味をつくる。',
      'The 1900 Paris Exposition brought exhibits to an international audience. This exposition view is retained from the original course deck. Audience and display setting contribute to the meaning of a visualization.',
      lambda c:picture(c,legacy_image(13)),[CONTEXT_SOURCE],1)

slide('The exhibit',
      'Thomas J. Calloway、Du Bois、Daniel A. P. Murrayらが展示資料を集めた。チャートだけでなく、写真や出版物も黒人の生活・成果を伝え、固定観念に対抗した。原講義の展示写真を継承。原資料には当時の人種表現が含まれる。',
      'Calloway, Du Bois, and Murray assembled exhibition materials. Photographs and publications accompanied charts to document Black lives and achievements and counter stereotypes. The exhibition photograph is retained from the original deck. Historical racial terminology remains visible in archival material.',
      lambda c:picture(c,legacy_image(14)),[EXHIBIT_SOURCE,CONTEXT_SOURCE],1.5)

slide('The labels',
      '原図の人数は78,139、8,025、37,699、734,952。区分の「人口1万人超」は都市全体の規模を指し、その区分の人数はそこに住む黒人人口。帯の長さと曲がった経路を区別する必要がある。',
      'The printed counts are 78,139; 8,025; 37,699; and 734,952. Settlement thresholds describe the size of the cities; counts describe Black residents in those categories. Path length and the position of a bend are different visual properties.',
      lambda c:picture(c,Image.open(CITY).crop((280,330,1750,1670))),[CITY_SOURCE],2)

def bars(c):
    text(c,'都市と農村の人口',70,475,34)
    text(c,'ジョージア州の黒人人口 / 1890年 / 人',70,438,17)
    city_bars(c)
slide('Same values, straight bars',
      '原図と同じ4つの人数を、0から始まる横棒グラフにした教育用の再設計。4区分の合計は858,815人で、農村・村落は約85.6%。この割合は転記した4値から計算したもので、原図の新しい観測値ではない。',
      'This teaching redesign uses the original four counts with a zero-based bar scale. They total 858,815 people, with about 85.6% in country and villages. That percentage is calculated from the transcribed counts, not an additional observation printed in the original.',
      bars,[CITY_SOURCE],1.5)

def compare(c):
    picture(c,str(CITY),(20,35,390,470))
    city_bars(c,(438,155,480,250),True)
    text(c,'同じ数値。異なる見え方。',665,90,23,center=True)
slide('Original and redesign',
      '左の原図は長い帯を折り畳み、農村人口の大きさを印象的に表す。右の棒グラフは長さを共通の基線で比べやすい。値を保った再設計でも、注目の順序や記憶に残る形は変わる。',
      'The original folds a long band into a memorable form. Straight bars support comparison along a shared baseline. Preserving values does not mean preserving emphasis, viewing sequence, or memorability.',
      compare,[CITY_SOURCE],1.5)

slide('Illiteracy',
      '「The Georgia Negro」シリーズの図。原図の割合は1860年99%、1870年92%、1880年81.8%、1890年67.27%、1900年50%。最後の年と割合には疑問符があり、確定した観測値として扱えない。分母の年齢範囲は図だけでは明確でない。',
      'In the “The Georgia Negro” series, printed percentages are 99, 92, 81.8, 67.27, and 50 for 1860–1900. Both the last year and its value carry question marks. The denominator’s age range is not explicit in the chart alone.',
      lambda c:picture(c,str(LITERACY)),[LITERACY_SOURCE],1.5)

slide('A question mark',
      '拡大部分の「1900?」と「50%?」は不確かさを示す。再制作では「推定」などの注記を残す。原図の疑問符を消すと、証拠の強さが変わって見える。',
      'The enlarged “1900?” and “50%?” mark uncertainty. A remake needs an estimate label or equivalent. Removing the question marks changes the apparent strength of the evidence.',
      lambda c:picture(c,Image.open(LITERACY).crop((350,1050,1440,2010))),[LITERACY_SOURCE],1)

def literacy_line(c):
    text(c,'読み書きができない人の割合',80,474,32)
    text(c,'歴史資料の転記 / % / 1900年は推定',80,436,18)
    x0,y0,bw,bh=125,100,680,290
    c.setStrokeColor(HexColor('#d6cec0'))
    c.setLineWidth(.6)
    for value in [0,25,50,75,100]:
        yy=y0+value/100*bh
        c.line(x0,yy,x0+bw,yy)
        text(c,str(value),88,yy-5,15)
    points=[(x0+i*bw/4,y0+v/100*bh) for i,v in enumerate([99,92,81.8,67.27,50])]
    c.setStrokeColor(HexColor(RED)); c.setLineWidth(3)
    for i in range(3):c.line(*points[i],*points[i+1])
    c.setDash(5,5);c.line(*points[3],*points[4]);c.setDash()
    for i,((x,y),v) in enumerate(zip(points,[99,92,81.8,67.27,50])):
        c.setFillColor(HexColor(PAPER if i==4 else RED));c.circle(x,y,6,fill=1,stroke=1)
        text(c,str(1860+i*10),x,72,17,center=True)
        text(c,f'{v:g}'+('（推定）' if i==4 else ''),x,y+19,17,center=True)
slide('Showing uncertainty',
      '原図の5値を年と割合で描いた教育用の再設計。最後の区間は破線、1900年は白抜き点と「推定」で区別。点を結ぶ線は観測間を描画上でつないだもので、その間の毎年のデータを意味しない。',
      'This teaching redesign plots the five printed values by year and percentage. A dashed final segment, open marker, and estimate label distinguish 1900. Connecting lines are graphical links, not observations for every intervening year.',
      literacy_line,[LITERACY_SOURCE],2)

slide('Education',
      '公立学校への就学を扱う原講義の歴史的チャート。教育へのアクセスの変化を公衆に伝える例である。就学者数だけでは就学率や教育の質はわからず、人口規模や対象年齢の確認が別途必要になる。',
      'This public-school enrollment chart is retained from the original lecture. Enrollment counts can communicate changing access, but do not by themselves establish enrollment rates or quality. Population size and eligible ages require separate evidence.',
      lambda c:picture(c,legacy_image(21)),[CONTEXT_SOURCE],1)

slide('Occupations',
      '職業を扱う原講義の歴史的チャート。分類・並べ方・色は、どの比較を目立たせるかに関わる。記載された職業の構成だけで、働き手の選択の自由や制度的な障壁を測れるわけではない。',
      'This historical occupation chart is retained from the original lecture. Categories, order, and color shape which comparisons stand out. Occupational composition alone does not measure freedom of choice or institutional barriers.',
      lambda c:picture(c,legacy_image(18)),[CONTEXT_SOURCE],1.5)

def framing(c):
    for yy,word in [(360,'誰に伝える？'),(253,'何が言える？'),(146,'何は言えない？')]:text(c,word,W/2,yy,48,center=True)
slide('Audience, evidence, limits',
      '主張は、対象となる読者、データが支える比較、資料の限界に依存する。Du Boisらの仕事では、データ・写真・出版物と展示の文脈が組み合わさって公共的な議論をつくった。',
      'An argument depends on its audience, the comparisons supported by evidence, and the limits of the record. In this exhibition, data, photographs, publications, and display context worked together as a public argument.',
      framing,[EXHIBIT_SOURCE],2)

def assignment(c,title,lines,link=None):
    text(c,title,85,425,43)
    for i,line in enumerate(lines):text(c,line,88,325-i*73,27)
    if link:
        text(c,'原図とデータは Week 6 の活動パネルへ',88,65,19,RED)
        c.linkURL(link,(75,48,800,92),relative=0)
slide('Activity 1',
      '個人制作は30分。2つの原図から1つ選び、活動パネルの小さな表を入力して制作。渦巻きの形の再現は任意で、普通の棒グラフでも課題の目的を満たす。',
      'The 30-minute individual activity uses one of two originals and its transcribed source table in the activity panel. Exact reproduction of the spiral is optional; a conventional chart meets the task.',
      lambda c:assignment(c,'個人制作 / 30分',['原図を1つ選ぶ','同じデータで、自分の図をつくる','タイトル・単位・出典を残す'],'https://yohman.github.io/26-2-Dataviz/agenda.html#week-6'))
slide('Activity 2',
      '4人で全員の原図と再制作を比較する。1人約2分の紹介から、よい点と改善案を交換。最後の15分は個人で改善する。別のグループ提出は不要。',
      'Groups of four compare every original and remake, with about two minutes per person. Feedback identifies a strength and an improvement; the final 15 minutes support individual revision. There is no separate group submission.',
      lambda c:assignment(c,'グループで比較',['全員が、原図と自分の図を見せる','よい点1つ、改善案1つ','最後の15分は、個人で磨く']))
slide('Homework',
      '個人の再制作または再設計を完成。値・対象・年代・単位・不確かさを保持する。画像1枚必須、2枚目任意、原図URLと2〜4文の説明。作品・ノートブックURLは任意。締切は次回授業の前日23:59 JSTで、サイトと提出フォームに表示される。',
      'Complete the individual remake or redesign. Retain values, population, dates, units, and uncertainty. Submit one image (optional second), the original source URL, and 2–4 sentences. A project/notebook link is optional. The website and form show the deadline: 23:59 JST the night before the next class.',
      lambda c:assignment(c,'宿題 / 自分の図を完成',['画像1枚（2枚目は任意）＋ 原図URL','2〜4文：発見・工夫・限界','道具は自由。手描きもOK。']))

assert len(notes)==17
assert sum(s['minutes'] for s in notes)==20
writer.add_metadata({'/Title':'Week 6: Du Bois and the public argument', '/Author':'Yoh', '/Subject':'20-minute image-led lecture, activities and homework'})
with (ROOT/'lectures/w06-dubois-public-argument.pdf').open('wb') as f:writer.write(f)
(ROOT/'lectures/w06-dubois-public-argument.notes.json').write_text(json.dumps({'file':'lectures/w06-dubois-public-argument.pdf','lectureMinutes':20,'lectureSlides':14,'slides':notes},ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(notes)} slides; lecture {sum(s["minutes"] for s in notes):g} minutes')
