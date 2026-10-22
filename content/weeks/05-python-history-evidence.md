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
homework: Use Gemini and Python in Colab to visualize Datasaurus or another dataset. Explain what you found and how you checked the result.
homework_ja: ColabでGeminiとPythonを使い、Datasaurusまたは別のデータを可視化します。発見したことと、結果をどう確かめたかを説明してください。
requirements: Create one visualization using Python in Colab, with Gemini's help.;Use Datasaurus or another dataset and provide its source link.;Submit one screenshot (required), with an optional second screenshot.;Explain the data, your finding, and how you checked Gemini's output.;Use the usual homework form.
requirements_ja: ColabでGeminiを使い、Pythonで可視化を1点つくる。;Datasaurusまたは別のデータを使い、出典リンクを添える。;スクリーンショット1枚は必須、2枚目は任意。;データ・発見したこと・Geminiの出力をどう確かめたかを説明する。;いつもの宿題フォームから提出する。
challenge: Python view
challenge_ja: Pythonビュー
tools: Google Colab, Gemini, Python
tools_ja: Google Colab・Gemini・Python
image: assets/images/lecture/week05-python.png
---

## Materials

- [Lecture slides](lectures/w05-python-datasaurus.pdf) {slides}

## Lecture Resources

- [Nightingale mortality diagram](https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg) {reference}

## Activity 1 Materials

- [Datasaurus CSV](data/datasaurus.csv) {data}

## Activity 2 Materials

- [Anscombe CSV](data/anscombe.csv) {data}
- [Gapminder wrangling notebook (optional extension)](data/gapminder/gapdata.ipynb) {data}

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
- Explore from there in your own words. Review Gemini's proposed actions, accept or insert its code, and run it. If it inserts a code cell, use that cell's play button. Look at the output before continuing.
- Keep experimenting until you can see the dinosaur. If you get an error, discuss it with Gemini and try again. Save your notebook in Drive.
steps_ja:
- 下のdatasaurus.csvをダウンロード。Google Colabを開いてログインし、「ノートブックを新規作成」を選びます。
- 必要なら「接続」をクリック。左のフォルダアイコンを開き、「セッション ストレージにアップロード」でdatasaurus.csvを選びます。一覧への表示を待ちます。
- きらきらマークからGeminiを開きます。右のチャット欄で、最初は「データを読み込んで」とだけ伝えます。
- ここからは自分の言葉で探索しましょう。Geminiの提案を確認してコードを承認・挿入し、実行します。セルに入ったコードは再生ボタンで実行。毎回、結果を見てから次へ進みます。
- 恐竜が見えるまで試してみましょう。エラーが出たらGeminiと相談して再挑戦。ノートブックはドライブに保存します。

### Activity 2
title: Compare and help one another
title_ja: 比べて、助け合う
text: Groups of four are here to help, not compete. Everyone should finish with a working plot on their own computer and a short explanation of why looking at the data matters.
text_ja: 4人グループは競争のためではなく、助け合うためです。全員が自分のPCで図を描き、なぜデータを見ることが大切なのか短く説明できることを目指します。
steps:
- Show your plot and how your conversation with Gemini developed. If someone is stuck, help them explore on their own computer.
- Compare two datasets with similar means, standard deviations, and correlation but different shapes. Describe what the statistics do not reveal.
- Discuss how axis scaling and point size affect the result. Keep the underlying data unchanged while testing these choices.
- Prepare one observation or question for the class recap. There is no competition or formal group presentation.
steps_ja:
- 自分の図と、Geminiとの対話の進め方を見せます。困っている人がいたら、その人のPCで探索を続けられるよう助けましょう。
- 平均・標準偏差・相関が似ているのに形が異なるデータを2つ比べ、統計量だけでは分からないことを説明します。
- 軸の縮尺や点の大きさが見え方に与える影響を話し合います。データ自体は変えず、見せ方を試してください。
- 全体の振り返りで共有する気づきか疑問を1つ用意します。競争や正式なグループ発表はありません。

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
