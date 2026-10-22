---
week: 5
act: MAKE
course_date: 2026-10-23
opens_at: 2026-10-23T09:00:00+09:00
date: Fri 23 Oct 2026 · P2 · 10:40–12:20
date_ja: 2026年10月23日（金） · 2限 · 10:40–12:20
title: Vibe Coding with Python
title_ja: Pythonでバイブコーディング
look: From Nightingale and Tukey to conversational data exploration with Python, Colab, and Gemini
look_ja: NightingaleとTukeyから、ColabとGeminiで対話しながらPythonでデータを探索する
learn: use Gemini to generate and run Python, explore a dataset, and check what the result actually shows
learn_ja: GeminiでPythonコードを生成・実行し、データを探索して、結果を自分で確かめる
schedule: 10:40–10:50|Submission review|Discuss the refined Tableau projects;10:50–11:10|Lecture|Visual evidence, vibe coding, and Gemini;11:10–11:30|Colab setup|Create a notebook, upload the CSV, and load the data;11:30–11:55|Find the dinosaur|Explore independently with Gemini and Python;11:55–12:10|Group share|Compare discoveries and help one another;12:10–12:20|Recap and homework|Explain the result and how you checked it
schedule_ja: 10:40–10:50|提出作品のレビュー|改善したTableau作品を振り返る;10:50–11:10|講義|視覚的な証拠・バイブコーディング・Gemini;11:10–11:30|Colabの準備|新しいノートブックを作り、CSVをアップロードして読み込む;11:30–11:55|恐竜を探そう|GeminiとPythonで自由に探索する;11:55–12:10|グループ共有|発見を比べ、助け合う;12:10–12:20|まとめと宿題|結果と確かめ方を説明する
in_class: Upload datasaurus.csv to a new Colab notebook. Start by asking Gemini to load the data, then explore independently until you find the dinosaur. Everyone works on their own computer.
in_class_ja: 新しいColabノートブックにdatasaurus.csvをアップロードします。Geminiにデータの読み込みを頼むところから始め、恐竜が見つかるまで自分で探索します。全員が自分のPCで取り組みます。
homework: Individually, use Python to explore data of your choice (EDA). Gemini, Codex, or another approach is welcome. Go beyond the first chart: ask new questions, compare, and keep exploring until you find something worth sharing. Tell that story with one or more visualizations.
homework_ja: 好きなデータをPythonで探索しましょう（EDA：探索的データ分析）。Gemini・Codex・その他の方法、どれでも構いません。最初に出た図で終わらず、問いを変え、比べ、人に伝えたくなる発見まで探索します。1つ以上の可視化で、そのストーリーを伝えてください。
requirements: Use one or more Python visualizations to tell the story of your discovery. Include the data-source link.;Explain what surprised you, what you discovered, and how further exploration changed your understanding. Check that the data supports your story.;Upload one screenshot (required), with an optional second screenshot. A screenshot may contain multiple charts.;A shared Colab notebook, app, or repository link is encouraged but optional. Check that others can open it, and remove personal information and API keys.
requirements_ja: Pythonで1つ以上の可視化を作り、発見のストーリーを伝える。データの出典リンクも添える。;何に驚き、何を発見したか。探索を続けて理解がどう変わったかを説明し、データで裏付ける。;スクリーンショット1枚は必須、2枚目は任意。1枚に複数の図をまとめても構いません。;Colab・アプリ・リポジトリなどの共有リンクも歓迎（任意）。他の人が開けるか確認し、個人情報やAPIキーは除く。
challenge: Python view
challenge_ja: Pythonビュー
tools: Python, Gemini, Codex, Google Colab, or other tools
tools_ja: Python・Gemini・Codex・Google Colabなど
image: assets/images/lecture/week05-python.png
---

## Materials

- [Lecture slides](lectures/w05-python-datasaurus.pdf) {slides}

## Lecture Resources

- [Nightingale mortality diagram](https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg) {reference}

## Activity 1 Materials

- [Datasaurus CSV](data/datasaurus.csv) {data}

## Activity 2 Materials

- [USGS earthquake data](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) {reference}
- [iTunes Search API](https://performance-partners.apple.com/search-api) {reference}
- [Open-Meteo weather data](https://open-meteo.com/en/docs) {reference}
- [Pokemon CSV](data/pokemon-review.csv) {data}

## In Class Activities

### Activity 1
title: Find the dinosaur with Gemini
title_ja: Geminiと恐竜を探そう
text: Your goal is to find the dinosaur hidden in the data. No starter code and no recipe: begin with one prompt, then decide what to try next. If Gemini is unavailable on your account, ask the instructor. Upload the CSV again if the session resets.
text_ja: データの中に隠れた恐竜を見つけましょう。お手本コードも、決まった手順もありません。最初の一言から、次に何を試すか自分で考えます。Geminiが使えない場合は教員に相談してください。セッションがリセットされたらCSVを再アップロードします。
link: https://colab.research.google.com/
link_label: Open Google Colab
link_label_ja: Google Colabを開く
steps:
- Download datasaurus.csv below. Open Google Colab, sign in, and choose New notebook.
- Click Connect if needed. Click the folder icon on the left, then Upload to session storage. Select datasaurus.csv and wait for it to appear.
- Open Gemini using the sparkle icon. In the chat panel on the right, start with only: “Load the data.”
- Explore from there in your own words. After Gemini creates code cells, review its proposal and click “Accept and run.” Look at the output before continuing.
- Keep experimenting until you can see the dinosaur. If you get an error, discuss it with Gemini and try again. Save your notebook in Drive.
steps_ja:
- 下のdatasaurus.csvをダウンロード。Google Colabを開いてログインし、「ノートブックを新規作成」を選びます。
- 必要なら「接続」をクリック。左のフォルダアイコンを開き、「セッション ストレージにアップロード」でdatasaurus.csvを選びます。一覧への表示を待ちます。
- きらきらマークからGeminiを開きます。右のチャット欄で、最初は「データを読み込んで」とだけ伝えます。
- ここからは自分の言葉で探索しましょう。Geminiがコードセルを作ったら、提案を確認し「Accept and run」をクリック。毎回、結果を見てから次へ進みます。
- 恐竜が見えるまで試してみましょう。エラーが出たらGeminiと相談して再挑戦。ノートブックはドライブに保存します。

### Activity 2
title: What will you make with Gemini?
title_ja: Geminiで、何をつくる？
text: Choose one prompt, or invent your own. Use Accept and run, then keep asking questions. iTunes results are not necessarily an artist's complete discography. APIs may have limits or temporary outages.
text_ja: 1つ選ぶか、自分で考えてみましょう。「Accept and run」で実行し、問いを重ねます。iTunesの検索結果は全曲一覧とは限りません。APIには利用制限や一時的な停止があります。
steps:
- Earthquakes: “Get the last 30 days of earthquakes from USGS and map them.”
- Music: “Use the iTunes API to make an app in Colab where I enter an artist and see their songs.”
- Weather: “Compare next week's temperatures in Tokyo, Seoul, and Taipei.”
- Pokemon: “Explore this Pokemon CSV. How do Attack and Defense differ by type?”
- Your own data: “Look at my CSV. What interesting questions could we explore?”
steps_ja:
- 地震：「USGSから過去30日間の地震を取得して、地図にして。」
- 音楽：「iTunes APIで、アーティスト名を入れると曲の一覧が出るアプリをColabに作って。」
- 天気：「東京・ソウル・台北の来週の気温を比べて。」
- ポケモン：「このポケモンCSVを探索したい。タイプで攻撃力と防御力はどう違う？」
- 自分のデータ：「このCSVで、どんな面白い問いを調べられそう？」

### Activity 3
title: Share what you made
title_ja: つくったものを見せ合おう
text: Get together in groups of four. Take turns showing what you created in Activity 2. Work in progress is welcome.
text_ja: 4人グループで、アクティビティ2でつくったものを順番に見せ合いましょう。途中のものでも構いません。
steps:
- Show your visualization or app and explain what you tried to find out.
- Share something surprising you discovered, or something that did not work as expected.
- Ask each other questions and suggest one thing to explore next.
steps_ja:
- 可視化やアプリを見せて、何を知りたかったのか説明します。
- 驚いた発見や、思い通りにいかなかったことを共有します。
- お互いに質問し、次に試すと面白そうなことを提案しましょう。

## Mori's Corner

title:
title_ja:
text:
text_ja:
link:
link_label:
link_label_ja:
file:
file_label:
file_label_ja:
