"""Merge Engineer vibe-coding excerpts and Colab/Gemini slides into Week 5.

The first 20 original pages and the final CSV page remain unchanged.
Running again replaces the additions rather than duplicating them.
"""
from io import BytesIO
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from pypdf import PdfReader, PdfWriter

root = Path(__file__).resolve().parents[1]
path = root / 'lectures/w05-python-datasaurus.pdf'
reader = PdfReader(path)
pdfmetrics.registerFont(TTFont('Japanese', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
w, h = 960, 540
buffer = BytesIO()
c = canvas.Canvas(buffer, pagesize=(w, h))

def text(value, x, y, size=28, color='#40382f'):
    c.setFillColor(HexColor(color))
    c.setFont('Japanese', size)
    c.drawString(x, y, value)

def slide(title, subtitle, lines, source=None):
    c.setFillColor(HexColor('#fcfbff'))
    c.rect(0, 0, w, h, fill=1, stroke=0)
    text(title, 72, 445, 40)
    text(subtitle, 74, 401, 19, '#756b61')
    for index, line in enumerate(lines):
        text(line, 74, 310-index*58, 27)
    if source:
        label, url = source
        text(label, 74, 36, 14, '#ac3e50')
        c.linkURL(url, (72, 30, 875, 54), relative=0)
    c.showPage()

slide('Geminiとは？', 'Google DeepMind / December 2023', [
    '言葉・画像・コードを扱う、GoogleのAIモデル群',
    '名はふたご座の双子、カストルとポルックスから。',
    'BrainとDeepMindの合流も、この名の由来。',
], ('Google: Geminiの名前の由来', 'https://blog.google/innovation-and-ai/products/google-gemini-ai-name-meaning/'))

slide('Google Colabの準備', 'Python runs in your browser', [
    '1   ログインして、新しいノートブックを作る。',
    '2   必要なら「接続」。左のフォルダアイコンを開く。',
    '3   「セッション ストレージにアップロード」を選ぶ。',
    '4   datasaurus.csvを選び、一覧への表示を待つ。',
], ('Google Colabを開く', 'https://colab.research.google.com/'))

c.setFillColor(HexColor('#fcfbff'))
c.rect(0, 0, w, h, fill=1, stroke=0)
text('最初のひと言', 72, 445, 40)
text('Geminiのきらきらマークをクリック。右のパネルで。', 74, 397, 23)
text('データを読み込んで', 90, 255, 59, '#ac3e50')
text('Load the data.', 95, 200, 27)
text('ここからは、自分で探索。恐竜を見つけよう。', 74, 86, 26)
text('Geminiが使えない場合は、教員に相談してください。', 74, 44, 17, '#756b61')
c.showPage()

slide('Geminiと、試してみる', 'Conversation + Python + output', [
    'Geminiがコードセルを作ったら、提案を確認。',
    '「Accept and run」をクリックして実行。',
    '結果を見て、次に知りたいことを自分で考える。',
    'エラーも会話の続き。直して、また試す。',
], ('Google: ColabとGeminiの使い方', 'https://developers.googleblog.com/en/new-ai-first-google-colab-now-available-to-everyone/'))

slide('動いた。では、正しい？', 'You decide whether the result makes sense', [
    '図は、アップロードしたデータを表している？',
    '軸・数値・説明は、元のデータと合っている？',
    '知らないコードの働きは、Geminiに説明してもらう。',
    '個人情報は入れず、ノートブックをDriveに保存。',
], ('Google Colab FAQ: AIの利用とデータの扱い', 'https://research.google.com/colaboratory/faq.html'))

c.save()
writer = PdfWriter()
for page in reader.pages[:20]:
    writer.add_page(page)
colab = PdfReader(buffer)
writer.add_page(colab.pages[0])
writer.append(PdfReader(root / 'lectures/sources/engineer-week4-vibe-excerpts.pdf'))
for page in colab.pages[1:]:
    writer.add_page(page)
writer.add_page(reader.pages[-1])
with path.open('wb') as output:
    writer.write(output)
print(f'{len(writer.pages)} slides, CSV remains the final slide')
