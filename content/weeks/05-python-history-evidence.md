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
homework: Individually, use Python to visualize data of your choice. Gemini, Codex, or another approach is welcome. Share your notebook or working project if you can.
homework_ja: 自分で選んだデータを、Pythonで可視化しましょう。Gemini・Codex・その他の方法、どれでも構いません。ノートブックや動く作品の共有も歓迎します。
requirements: Create one Python visualization using data of your choice and provide the data-source link.;Upload one screenshot (required), with an optional second screenshot.;Briefly explain the data, your finding, and how you checked the result.;A shared Colab notebook, app, or repository link is encouraged but optional. Check that others can open it, and remove personal information and API keys.
requirements_ja: 好きなデータでPythonの可視化を1点つくり、データの出典リンクを添える。;スクリーンショット1枚は必須、2枚目は任意。;データ・発見したこと・結果の確かめ方を短く説明する。;Colab・アプリ・リポジトリなどの共有リンクも歓迎（任意）。他の人が開けるか確認し、個人情報やAPIキーは除く。
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
text: Choose one prompt below, or invent your own. Paste it into Gemini, use Accept and run, and refine the result through conversation. Work on your own computer, help one another in your group, and share one discovery. The iTunes app runs inside Colab using Python and ipywidgets. Its results are catalog matches, not necessarily an artist's complete discography. APIs may have limits or temporary outages.
text_ja: 下のプロンプトから1つ選ぶか、自分で考えてみましょう。Geminiに貼り付け、「Accept and run」で実行し、対話しながら改善します。自分のPCで取り組み、グループで助け合って発見を1つ共有。iTunesのアプリはPythonとipywidgetsでColab内に作れます。検索結果は全曲一覧とは限りません。APIには利用制限や一時的な停止があります。
steps:
- Earthquake map: “Use Python in Colab to get the past 30 days of earthquakes from USGS at https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson and map them interactively. Use circle size for magnitude and color for depth. Show the place, magnitude, and date when clicked. Start with magnitude 2.5 or higher to keep the map responsive.”
- Artist song finder: “Build a Python app inside Colab using ipywidgets and the iTunes Search API. Let me enter an artist, choose the matching artist, and see up to 50 songs with album, release date, duration, and an iTunes link. Use the Japan store. Cache results and show a helpful message if no matches are found. Add a chart of song durations.”
- Weather comparison: “Use Open-Meteo in Python to compare the next 7 days of hourly temperature forecasts for Tokyo, Seoul, and Taipei. Plot all three in Japan time with clear city labels and Celsius units. Show the data source and when you retrieved it.”
- Pokemon explorer: “Use my uploaded pokemon-review.csv to make an interactive Pokemon explorer in Colab. First inspect the actual column names. Let me filter by type and compare Attack and Defense in a scatterplot. Show the Pokemon name when I hover over a point.”
- Your own data: “Explore the CSV I uploaded using Python in Colab. First inspect the columns and missing values, then suggest three questions this data could answer. Wait for me to choose one before making a visualization. Explain the result without inventing missing data.”
steps_ja:
- 地震マップ：「ColabのPythonでUSGSの過去30日間の地震データ https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson を取得して、操作できる地図にして。円の大きさでマグニチュード、色で深さを表し、クリックで場所・規模・日時を表示。まずM2.5以上に絞って、軽く動くようにして。」
- アーティストの曲探し：「Colab内でPythonとipywidgetsを使い、iTunes Search APIの曲検索アプリを作って。名前を入力し、該当するアーティストを選ぶと、曲名・アルバム・発売日・長さ・iTunesリンクを最大50曲表示。日本のストアを使い、結果をキャッシュして。見つからない場合はメッセージを出し、曲の長さもグラフにして。」
- 3都市の天気：「PythonでOpen-Meteoから東京・ソウル・台北の今後7日間の毎時気温予報を取得し、比較する折れ線グラフを作って。時刻は日本時間、気温は℃、都市名を明記。出典と取得日時も表示して。」
- ポケモン図鑑：「アップロードしたpokemon-review.csvで、Colabに操作できるポケモン図鑑を作って。まず実際の列名を確認。タイプで絞り込み、攻撃力と防御力の散布図を表示して。点にマウスを重ねると名前が分かるようにして。」
- 自分のデータ：「アップロードしたCSVをColabのPythonで探索したい。まず列と欠損値を確認し、このデータで調べられる問いを3つ提案して。私が1つ選ぶまで可視化は待って。欠けたデータを勝手に作らず、結果を説明して。」

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
