"""Build the image-led Week 5 deck and its aligned viewer notes.

Original layouts/text are recoverable from Git revision bc4954f. The earlier
week5-vibe-slides.py builder produces the text-led version, not this revision.
Dependencies: reportlab, pypdf, svglib (and its cssselect2/tinycss2 dependencies).
"""
import csv
import json
import subprocess
from collections import defaultdict
from io import BytesIO
from pathlib import Path
from copy import copy
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF

root = Path(__file__).resolve().parents[1]
original = PdfReader(BytesIO(subprocess.check_output(
    ['git', 'show', 'bc4954f:lectures/w05-python-datasaurus.pdf'], cwd=root)))
pdfmetrics.registerFont(TTFont('Japanese', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
W, H = 960, 540
writer = PdfWriter()
symbols = root / 'assets/images/week05-symbols'

def page(draw):
    stream = BytesIO()
    c = canvas.Canvas(stream, pagesize=(W, H))
    c.setFillColor(HexColor('#fcfbff'))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    draw(c)
    c.showPage()
    c.save()
    writer.add_page(PdfReader(stream).pages[0])

def label(c, value, x, y, size=28):
    c.setFillColor(HexColor('#40382f'))
    c.setFont('Japanese', size)
    c.drawCentredString(x, y, value)

def symbol(c, name, x=330, y=120, size=300):
    drawing = svg2rlg(str(symbols / f'{name}.svg'))
    drawing.scale(size/drawing.width, size/drawing.height)
    renderPDF.draw(drawing, c, x, y)

def image_page(number, index=0, fill=False):
    image = original.pages[number-1].images[index].image
    iw, ih = image.size
    scale = (max if fill else min)(W/iw, H/ih)
    page(lambda c: c.drawImage(ImageReader(image), (W-iw*scale)/2,
                              (H-ih*scale)/2, iw*scale, ih*scale, mask='auto'))

def crop_page(number, box):
    source = copy(original.pages[number-1])
    source.cropbox = RectangleObject(box)
    source.trimbox = RectangleObject(box)
    x, y, right, top = box
    scale = min(W/(right-x), H/(top-y))
    target = writer.add_blank_page(W, H)
    transform = Transformation().translate(-x, -y).scale(scale).translate(
        (W-(right-x)*scale)/2, (H-(top-y)*scale)/2)
    target.merge_transformed_page(source, transform)

data = defaultdict(list)
with (root / 'data/datasaurus.csv').open() as f:
    for row in csv.DictReader(f):
        data[row['dataset']].append((float(row['x']), float(row['y'])))

def plot(c, points, box, name='', color='#ac3e50', axes=True):
    x, y, w, h = box
    pad = 24 if axes else 5
    scale = min((w-2*pad)/110, (h-2*pad)/110)
    ox, oy = x+(w-110*scale)/2, y+(h-110*scale)/2
    if axes:
        c.setStrokeColor(HexColor('#b8afa4'))
        c.setLineWidth(.7)
        c.line(ox, oy, ox+110*scale, oy)
        c.line(ox, oy, ox, oy+110*scale)
    c.setFillColor(HexColor(color))
    for px, py in points:
        c.circle(ox+px*scale, oy+py*scale, max(1.8, scale*.65), fill=1, stroke=0)
    if name:
        label(c, name, x+w/2, y+h-15, 13)

# Historical images fill the canvas; explanations move to the viewer notes.
image_page(7)
image_page(2, fill=True)
crop_page(4, (360, 110, 600, 430))
image_page(4)
image_page(5)
image_page(6)
image_page(7)
detail_notes = {}
def detail(key, image, box, title, ja, en, source):
    # Requested detail crops retain every word/mark in the selected section.
    im = image.crop(box)
    iw, ih = im.size
    scale = min(W/iw, H/ih)
    def draw(c):
        pixel = image.convert('RGB').getpixel((20, image.height // 2))
        c.setFillColorRGB(*(v/255 for v in pixel))
        c.rect(0, 0, W, H, fill=1, stroke=0)
        c.drawImage(ImageReader(im), (W-iw*scale)/2, (H-ih*scale)/2, iw*scale, ih*scale)
    page(draw)
    detail_notes[key] = (title, ja, en, source)
book = original.pages[6].images[0].image
book_source = 'https://journal.sciencemuseum.ac.uk/article/nightingale-and-martineau/'
from PIL import Image
chart = Image.open(root / 'assets/images/lecture/nightingale-mortality-hires.png')
chart_source = 'https://upload.wikimedia.org/wikipedia/commons/1/17/Nightingale-mortality.jpg'
detail('chart-full', chart, (0, 0, 3840, 2100), 'Diagram of the Causes of Mortality · full chart',
       'Nightingaleの死亡原因の図。左右の図は同じ面積尺度で異なる年を示す。',
       'Nightingale’s mortality diagram shows two years using the same area scale.', chart_source)
detail('book-page', book, (1160, 215, 1545, 825), 'England and Her Soldiers',
       '右ページはHarriet Martineau著『England and Her Soldiers』（1859）の扉。Nightingaleの証拠を一般読者に伝える出版と協力の文脈を紹介する。',
       'The right page is the title page of Harriet Martineau’s England and Her Soldiers (1859). Discuss publication and collaboration as ways of bringing Nightingale’s evidence to a wider audience.', book_source)
detail('chart-title', chart, (1230, 0, 2710, 205), 'Diagram of the Causes of Mortality',
       '題名が何を説明する図なのかを明示している。対象・場所・死因という情報に注目する。',
       'The title names the subject and setting. Ask students what question the chart promises to address.', book_source)
detail('chart-key', chart, (310, 1300, 1880, 2070), '面積と色の説明',
       '青は予防・軽減可能な病気、赤は負傷、黒はその他の死因。各扇形の面積を中心から測るという説明を読む。半径の長さではなく面積に注目する。',
       'Read the original key: blue denotes preventable or mitigable disease, red wounds, and black other causes. The encoding uses sector area measured from the center, not radius alone.', book_source)
detail('chart-large', chart, (1940, 75, 3530, 1980), '1854–1855',
       '最初の年の大きい図。冬に青い領域がどれほど増えるか。負傷による死と比較してもらう。',
       'The larger diagram shows April 1854–March 1855. Compare the winter disease sectors with deaths from wounds.', book_source)
detail('chart-small', chart, (345, 70, 1290, 1180), '1855–1856',
       '次の年の小さい図。同じ面積の尺度で比較する。縮小を読み取りつつ、この図だけで特定の個人や介入の因果効果を断定しない。',
       'The smaller diagram shows April 1855–March 1856 on the same area scale. Compare the reduction without treating the chart alone as proof of any individual intervention’s causal effect.', book_source)
from PIL import Image
early = Image.open(root / 'assets/images/lecture/nightingale-diagrams-k.jpg')
duke_source = 'https://exhibits.library.duke.edu/items/show/13722'
detail('early-radar', early, (150, 40, 1390, 1310), 'Diagrams K · 1858',
       'Nightingaleの初期の図。半径が死亡率を表すため、塗られた面積は値に比例しない。後の扇形の面積による表現と比較し、符号化の選択が印象をどう変えるか話す。',
       'Nightingale’s early radar-style diagrams encode mortality through radius, so shaded area is not proportional to the value. Compare this with the later polar-area design. Source: Duke University Libraries, 1858.', duke_source)
detail('scutari-radar', early, (175, 735, 640, 1300), 'Scutari · 1854–1855',
       'Scutariの病人集団の死亡率。長い半径が強い印象を与える。期間、分母、尺度を確かめ、前の軍全体の図とは単純比較しない。',
       'This early Scutari diagram concerns mortality in the sick population. Check its dates, denominator, and scale before comparing it with army-wide mortality.', duke_source)
hospital = Image.open(root / 'assets/images/lecture/nightingale-hospital-mortality.png')
detail('hospital-area', hospital, (0, 0, hospital.width, hospital.height), 'Scutari and Kulali hospitals',
       '1854年10月–1855年9月の病院死亡率。点線はロンドン周辺の軍病院の比較値。衛生改善の開始を示す文字と、その後の領域の変化を探してもらう。相関と因果は区別する。',
       'Hospital mortality at Scutari and Kulali, October 1854–September 1855. Locate the sanitation annotation and the dotted London comparison. Discuss the changing areas while distinguishing comparison from causal proof.',
       'https://r2bit.com/gpt-stat/cs_nightingale.html')
def brand(c, filename, x, y, width, height):
    drawing = svg2rlg(str(root / 'assets/images/lecture' / filename))
    scale = min(width/drawing.width, height/drawing.height)
    dw, dh = drawing.width*scale, drawing.height*scale
    drawing.scale(scale, scale)
    renderPDF.draw(drawing, c, x+(width-dw)/2, y+(height-dh)/2)
page(lambda c: brand(c, 'python-logo.svg', 190, 160, 580, 220))
def libraries(c):
    for i, item in enumerate(original.pages[8].images):
        im = item.image
        iw, ih = im.size
        scale = min(340/iw, 155/ih)
        cx, cy = (260 if i % 2 == 0 else 700), (390 if i < 2 else 150)
        c.drawImage(ImageReader(im), cx-iw*scale/2, cy-ih*scale/2, iw*scale, ih*scale, mask='auto')
page(libraries)
def tukey(c):
    im = original.pages[9].images[0].image
    iw, ih = im.size
    scale = min(300/iw, 470/ih)
    c.drawImage(ImageReader(im), 65, (H-ih*scale)/2, iw*scale, ih*scale)
    for i, line in enumerate(['“The greatest value of a picture', 'is when it forces us to notice', 'what we never expected to see.”']):
        label(c, line, 640, 330-i*49, 29)
    label(c, 'John Tukey · 1977', 640, 135, 20)
page(tukey)
def eda(c):
    im = ImageReader(str(root / 'assets/images/lecture/eda-architectural-workflow.png'))
    c.drawImage(im, 0, 0, W, H)
page(eda)
image_page(11)
image_page(18)
image_page(19)
image_page(20)
def gemini(c):
    brand(c, 'gemini-logo.svg', 330, 325, 300, 150)
    brand(c, 'deepmind-logo.svg', 435, 170, 90, 90)
    label(c, 'Google DeepMind', 480, 135, 32)
    label(c, 'Google Brain  +  DeepMind', 480, 65, 26)
page(gemini)
def karpathy(c):
    im = ImageReader(str(root / 'assets/images/lecture/karpathy.jpg'))
    iw, ih = im.getSize()
    scale = min(450/iw, 365/ih)
    c.drawImage(im, (W-iw*scale)/2, 175, iw*scale, ih*scale)
    label(c, 'Vibe coding', 480, 105, 48)
    label(c, 'Andrej Karpathy · 2025', 480, 55, 23)
page(karpathy)
# The actual nested diagram remains vector-based, with its three short labels.
crop_page(23, (28, 42, 403, 304))
def requests(c):
    label(c, '“I just see stuff, say stuff, run stuff,', 480, 305, 36)
    label(c, 'and copy paste stuff, and it mostly works.”', 480, 250, 36)
    label(c, 'Andrej Karpathy · 2025', 480, 150, 21)
page(requests)
def iteration(c):
    label(c, '「1回の依頼＝1つの変化」', 480, 280, 56)
    label(c, 'One request. One change.', 480, 200, 28)
page(iteration)
def debugging(c):
    label(c, '「AIの『確認しました』は証拠ではない。」', 480, 280, 38)
    label(c, '“I checked it” is not evidence.', 480, 200, 28)
page(debugging)
def upload(c):
    label(c, 'datasaurus.csv', 480, 155, 30)
page(upload)
source = copy(original.pages[14])
source.cropbox = source.trimbox = RectangleObject((417, 205, 550, 330))
writer.pages[-1].merge_transformed_page(source, Transformation().translate(-417, -205).translate(413.5, 235))
def instructions(c):
    label(c, 'Colab × Gemini', 480, 435, 38)
    for i, line in enumerate(['1   Gemini →「データを読み込んで」', '2   Accept and run → 出力を見る', '3   質問を重ねて、恐竜を探す']):
        label(c, line, 480, 325-i*85, 34)
page(instructions)
def csv_slide(c):
    rows = list(csv.DictReader((root / 'data/datasaurus.csv').open()))
    for i, values in enumerate([['dataset', 'x', 'y']] + [[r['dataset'], f"{float(r['x']):.4f}", f"{float(r['y']):.4f}"] for r in rows[:6]]):
        for x, value in zip([220, 480, 740], values):
            label(c, value, x, 430-i*54, 28)
    c.linkURL('https://yohman.github.io/26-2-Dataviz/csv-preview.html?file=data%2Fdatasaurus.csv&title=Datasaurus', (100, 70, 860, 480), relative=0)
page(csv_slide)

notes = [
('Nightingaleの図', 'まず、この図から何が読み取れるか学生に問いかける。言葉で先に解説せず、色・面積・配置から気づいたことを聞く。', 'Ask students what they notice in Nightingale’s diagram before explaining it. Invite observations about color, area, and arrangement.'),
('Florence Nightingale', 'Florence Nightingale（1820–1910）。看護の改革とともに、データを使って問題を伝え、行動につなげた人物として紹介する。', 'Introduce Florence Nightingale (1820–1910) as a reformer who used evidence and visualization to make problems visible.'),
('ランプを持つ女性', '病院の場面から、Nightingaleの活動を紹介する。個人の物語と、その背後にある多数の人々のデータをつなぐ。', 'Use the hospital scene to connect Nightingale’s personal story with the lives represented by the data.'),
('現場から証拠へ', '病院の現場を観察し、記録し、改善する。データは現場と切り離された数字ではないことを話す。', 'Connect observation, records, and reform. Data represents people and conditions in a real setting.'),
('本という伝達手段', '図を作るだけでなく、誰にどう届けるか。Nightingaleが使った本という媒体に注目する。', 'Discuss the book as a vehicle for communicating evidence to an audience.'),
('記録と報告', 'タイトルページを見せ、証拠をまとめて他の人が検討できる形にすることの意味を話す。', 'Discuss why recording and publishing evidence matters, beyond making a single chart.'),
('図が伝えるもの', '図の形・色・面積は、何を比較しやすくしているか。読み取り方を学生自身の言葉で説明してもらう。', 'Ask what the diagram makes easy to compare and what students need to know to interpret it.'),
('Why Python?', 'Pythonを、探索を何度も試せる道具として紹介する。今日はすべての文法を覚えるより、結果を見ながら問いを深める。', 'Introduce Python as a tool for repeated exploration. Today the focus is asking questions and inspecting results rather than memorizing syntax.'),
('Pythonの可視化ライブラリ', 'matplotlib、seaborn、Plotly、Bokeh。同じPythonでも異なる表現方法がある。道具の名前より、どのようにデータを見せたいかを重視する。', 'Matplotlib, seaborn, Plotly, and Bokeh offer different ways to visualize data. Begin with the visual question rather than a favorite library.'),
('John Tukey', 'Tukeyの言葉：「The greatest value of a picture is when it forces us to notice what we never expected to see.」予想外に気づくことが今日の授業と宿題の中心。', 'Use Tukey’s quotation about noticing the unexpected to introduce the purpose of today’s exploration.'),
('EDA', 'EDA＝探索的データ分析。データを見る、問いを立てる、可視化する、さらに問い直す。最初の図を作ることは出発点にすぎない。', 'EDA means exploratory data analysis. Examine data, ask questions, visualize, and revise the questions. The first chart is a starting point.'),
('可視化による発見', '数字だけでは見えにくい形や傾向を、図によって発見する。この図の点は、実際のDatasaurusデータを使っている。', 'Visualization reveals structure that summaries can hide. These points come from the actual Datasaurus dataset.'),
('反復的な探索', '同じような統計量でも形が違う。1枚で結論を出さず、別の見方や比較を試す。', 'Iterative exploration means trying another view or comparison instead of stopping after the first chart.'),
('予想外に開かれる', '驚きが見つかったら、それを新しい問いにする。見たかった結果だけを探すのではなく、実際のデータの形に注目する。', 'Let surprising patterns generate new questions. Attend to the data rather than only looking for the answer you expected.'),
('恐竜を探そう', '活動1。datasaurus.csvをColabにアップロードし、Geminiにはまず「データを読み込んで」とだけ伝える。そこからは学生自身で探索する。', 'Activity 1: upload datasaurus.csv to Colab and begin with only “Load the data.” Students choose how to explore from there.'),
('Anscombeの例', '4組のデータは似た要約統計を持つが、散布図は異なる。なぜ数値の要約だけでは足りないかを話し合う。', 'Anscombe’s quartet illustrates how similar summary statistics can conceal very different patterns.'),
('Datasaurus Dozen', '実際のCSVの13種類を、同じ縮尺で並べた図。要約統計と、目で見た形の両方を確かめる。', 'All 13 datasets use the same scale. Compare visual patterns as well as numerical summaries.'),
('要約で消える形', '平均やヒストグラムが見せるもの、隠すものを比較する。要約から元の分布の形が一意に分かるとは限らない。', 'Discuss what a summary reveals and conceals. A mean or histogram does not uniquely determine the underlying distribution.'),
('点を重ねて見る', '要約だけでなく個々の点を見る。外れ値や密度、ばらつきについて、何が新しく見えるかを聞く。', 'Ask what individual points reveal about density, variation, and outliers beyond a summary plot.'),
('視覚的な手がかり', '位置・長さ・角度で、同じ傾向の伝わり方が変わる。図の出典はNatureの記事。', 'Discuss how position, length, and angle communicate patterns differently. The original figure links to Nature.'),
('Gemini', 'GeminiはGoogle DeepMindのAIモデル群。最初の公開は2023年12月。名前は「双子」で、ふたご座のCastorとPollux、BrainとDeepMindの合流が由来。', 'Gemini is Google DeepMind’s AI model family, introduced in December 2023. Its name evokes the twins Castor and Pollux and the joining of the Brain and DeepMind teams.'),
('Vibe coding', '日本語など自然な言葉で頼み、AIが生成するコードを実行し、結果を見て対話を続けるスタイル。Karpathyが2025年2月に命名。速く始められる一方、理解や検証を後回しにしやすいことも説明する。', 'Vibe coding describes conversational creation and iteration with AI-generated code. Karpathy named it in February 2025. Discuss the tradeoff between speed and deferred understanding or verification.'),
('どこまでAIに任せる？', 'コーディングはコードを書くこと。プログラミングには手順を考え、動かして確かめることも含む。アプリ開発には、誰の何を解決するか、届け方や運用まで含む。図の3つの領域を指しながら説明する。', 'Coding sits inside programming, which sits inside app development. Explain the broader decisions involved at each level while pointing to the nested diagram.'),
('具体的な依頼と曖昧な依頼', '具体的な依頼では結果を比較しやすい。曖昧な依頼ではAIが仮定を置く。違っていたら言い直し、変更後も以前の動作を確かめる。長いプロンプトである必要はない。', 'Concrete requests are easier to check. Vague requests leave room for assumptions. Clarify through conversation and recheck earlier behavior after a change. Prompts need not be long.'),
('小さく変え、確かめる', '必要ならまず計画を聞く。1回で変えることを小さくする。不明点や仮定を確認する。直らないときは同じ指示を繰り返さず、事実を伝え、問題を小さくする。', 'Ask for a plan when useful, keep changes small, and identify assumptions. If a fix fails, provide observations and narrow the problem rather than repeating the same request.'),
('エラーと検証', '何をして何が起きたか、エラー全文とともに伝える。秘密情報は伏せる。AIの「確認した」という言葉だけを証拠にせず、実行結果を自分でも確かめる。', 'Describe the action and result, include the full error, and remove secrets. Verify the actual outcome rather than relying on an AI claim that it tested something.'),
('ColabにCSVをアップロード', 'Colabにログインして新規ノートブックを作る。必要なら接続。左のフォルダアイコンから「セッション ストレージにアップロード」を選びdatasaurus.csvをアップロード。一覧に出るまで待つ。セッションがリセットされたら再アップロードする。', 'Sign in to Colab, create a notebook, and connect if needed. Open the folder icon on the left, upload datasaurus.csv to session storage, and wait for it to appear. Upload again if the session resets.'),
('最初のひと言', 'きらきらマークで右のGeminiパネルを開く。最初は「データを読み込んで」とだけ伝える。それ以降の探索の手順は自分で考える。Geminiが使えない場合は教員に相談する。', 'Open Gemini’s right-hand panel using the sparkle icon. Begin only with “Load the data.” Choose your own next questions. Ask the instructor if Gemini is unavailable.'),
('Accept and run', 'Geminiがコードセルを作ったら提案を確認し、「Accept and run」をクリック。毎回、出力を見て次の問いを考える。エラーが出たら、その内容をGeminiと確認して再挑戦する。', 'Review the proposed code cells and click “Accept and run.” Inspect the output before choosing the next question. Discuss errors with Gemini and try again.'),
('結果を自分で確かめる', '図がアップロードしたデータを表しているか、軸や数値は合っているかを確認。知らないコードは説明してもらう。個人情報・APIキーは入れず、ノートブックはDriveに保存する。', 'Check that the chart uses the uploaded data and that axes and values make sense. Ask for code explanations. Keep out personal information and API keys, and save the notebook to Drive.'),
('datasaurus.csv', '1,846点、13種類のデータ。datasetはデータ名、xとyは各点の座標。活動1ではこのCSVだけをダウンロードする。表をクリックするとプレビューを開ける。', 'The CSV has 1,846 points across 13 datasets. dataset names the group, while x and y are point coordinates. Click the table to preview the CSV.')
]
order = list(range(1, 8)) + list(detail_notes) + [8, 9, 10, 'eda', 11, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 'instructions', 31]
assert len(writer.pages) == len(order) == 33
# Keep the full chart directly after the book spread, followed by its four details.
book_index = order.index('book-page')
book_page = writer.pages[book_index]
pages = list(writer.pages)
pages.pop(book_index)
order.pop(book_index)
book_index = order.index('chart-small') + 1
pages.insert(book_index, book_page)
order.insert(book_index, 'book-page')
reordered = PdfWriter()
for p in pages:
    reordered.add_page(p)
writer = reordered
# User's slide numbers refer to the pre-insertion 24-slide deck: 19 before 18.
first, second = order.index(23), order.index(24)
pages = list(writer.pages)
pages[first], pages[second] = pages[second], pages[first]
order[first], order[second] = order[second], order[first]
reordered = PdfWriter()
for p in pages:
    reordered.add_page(p)
writer = reordered
sources = {
    1: ['https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg'],
    7: ['https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg'],
    16: ['https://en.wikipedia.org/wiki/Anscombe%27s_quartet'],
    17: ['https://www.research.autodesk.com/publications/same-stats-different-graphs/'],
    20: ['https://www.nature.com/articles/497186a'],
    21: ['https://blog.google/innovation-and-ai/products/google-gemini-ai-name-meaning/'],
    22: ['https://simonwillison.net/2025/Feb/6/andrej-karpathy/'],
    27: ['https://colab.research.google.com/'],
    29: ['https://developers.googleblog.com/en/new-ai-first-google-colab-now-available-to-everyone/'],
    30: ['https://research.google.com/colaboratory/faq.html'],
    31: ['https://yohman.github.io/26-2-Dataviz/data/datasaurus.csv']
}
for number in range(22, 27):
    sources.setdefault(number, []).append('https://yohman.github.io/26-2-Reitaku-Engineer/assets/week02/ai-studio-prototyping.pdf')
output = root / 'lectures/w05-python-datasaurus.pdf'
writer.add_metadata({'/Title': 'Week 5: Visual evidence and vibe coding', '/Subject': 'Image-led slides; explanations in the course viewer notes'})
with output.open('wb') as f:
    writer.write(f)
sources[8] = ['https://www.python.org/community/logos/']
sources[21].append('https://deepmind.google/about/')
sources[22].append('https://karpathy.ai/')
sources[10] = ['https://www.princeton.edu/news/2000/07/28/statistician-john-w-tukey-dies',
               'https://as.amphilsoc.org/repositories/2/resources/2960',
               'https://www.pearson.com/en-us/subject-catalog/p/exploratory-data-analysis-classic-version-/P200000006400']
notes[9] = ('John Tukey',
    'John Wilder Tukey（1915–2000）はPrinceton大学とBell研究所で活躍した統計学者。データを見ることを、仮説検定の前のおまけではなく発見のための重要な仕事として位置づけた。1977年の『Exploratory Data Analysis』は、図を描いて構造・外れ値・予想外の特徴を探す姿勢を広めた。箱ひげ図も広く普及させた。\n\nCooleyとともに高速フーリエ変換（FFT）の発展にも貢献。学生には「AIに最初の図を作らせる」ことと「図を見て次の問いを考える」ことの違いを強調する。この引用は今日のEDAの中心。答えを飾るためでなく、まだ知らなかったことに気づくために可視化する。',
    'John Wilder Tukey (1915–2000) was a statistician at Princeton and Bell Laboratories. He helped make exploration a central part of data analysis, alongside formal confirmation. His 1977 book Exploratory Data Analysis promoted graphical investigation of structure, outliers, and unexpected features, and helped popularize box plots.\n\nHe also contributed to the fast Fourier transform with James Cooley. For students, contrast asking AI for a first chart with inspecting it and choosing the next question. His quotation captures today’s EDA goal: use visualization to discover something unexpected, then investigate it rather than treating an attractive chart as the conclusion.')
payload = {'file': 'lectures/w05-python-datasaurus.pdf', 'slides': []}
factual_notes = json.loads((root / 'scripts/week5-factual-notes.json').read_text())
assert len(factual_notes) == len(order)
for i, origin in enumerate(order):
    if origin in detail_notes:
        title, ja, en, link = detail_notes[origin]
        if origin in ['chart-title', 'chart-key', 'chart-large', 'chart-small']:
            link = chart_source
        text, links = '', [link]
    elif origin == 'eda':
        title, ja, en = ('Exploratory Data Analysis', notes[10][1], notes[10][2])
        text, links = '', []
    elif origin == 'instructions':
        title = 'Colab × Gemini'
        ja = '\n\n'.join(n[1] for n in notes[27:30])
        en = '\n\n'.join(n[2] for n in notes[27:30])
        text = '\n'.join(original.pages[n-1].extract_text() or '' for n in [28, 29, 30])
        links = sources[29] + sources[30]
    else:
        title, ja, en = notes[origin-1]
        text, links = original.pages[origin-1].extract_text() or '', sources.get(origin, [])
    ja, en = factual_notes[i]
    payload['slides'].append({'page': i+1, 'title': title, 'ja': ja, 'en': en, 'originalText': text, 'sources': links})
(root / 'lectures/w05-python-datasaurus.notes.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n')
print(f'Built {len(order)} slides with aligned bilingual notes')
