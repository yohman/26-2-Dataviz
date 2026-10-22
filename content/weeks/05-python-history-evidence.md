---
week: 5
act: MAKE
course_date: 2026-10-23
opens_at: 2026-10-23T09:00:00+09:00
date: Fri 23 Oct 2026 · P2 · 10:40–12:20
date_ja: 2026年10月23日（金） · 2限 · 10:40–12:20
title: Python and the Unexpected
title_ja: Pythonで予想外を見つける
look: Nightingale's visual evidence, then Tukey and Datasaurus: look beyond the summary
look_ja: Nightingaleの視覚的な証拠から、TukeyとDatasaurusへ：要約の先を見る
learn: run, modify, and explain a first Python visualization in a notebook
learn_ja: ノートブックで初めてのPython可視化を実行し、変更し、説明する
schedule: 10:40–10:50|Submission review|Discuss the refined Tableau projects;10:50–11:10|Evidence and exploration|Nightingale, then Python, Tukey, and looking beyond summaries;11:10–11:30|First notebook|Load the data and draw the dinosaur;11:30–11:55|Datasaurus exploration|Compare statistics and plots, then change a visual choice;11:55–12:10|Group share|Help one another and compare discoveries;12:10–12:20|Recap and homework|Explain what changed when you could see the data
schedule_ja: 10:40–10:50|提出作品のレビュー|改善したTableau作品を振り返る;10:50–11:10|証拠と探索|NightingaleからPython・Tukey・要約の先へ;11:10–11:30|最初のノートブック|データを読み込み、恐竜を描く;11:30–11:55|Datasaurusの探索|統計量と図を比較し、見せ方を変更する;11:55–12:10|グループ共有|助け合い、発見を比べる;12:10–12:20|まとめと宿題|データが見えたことで何が変わったかを説明
in_class: Everyone runs the Datasaurus starter notebook, compares statistics and plots, and changes a visual choice. Work individually, with your group helping everyone succeed on their own computer.
in_class_ja: 全員がDatasaurusの入門ノートブックを実行し、統計量と図を比べ、見せ方を変更します。個人で取り組み、グループでは全員が自分のPCでできるよう助け合います。
homework: Use the starter notebook to make your own Python view of Datasaurus or another dataset. Explain what the picture reveals and one deliberate visual choice.
homework_ja: 入門ノートブックを基に、Datasaurusまたは別のデータで自分のPython可視化をつくります。図から分かることと、意図的に選んだ見せ方を1つ説明してください。
requirements: Create one visualization using Python. You may adapt the starter notebook.;Use Datasaurus or another dataset and provide its source link.;Submit one screenshot (required), with an optional second screenshot.;Explain the data, what the visualization reveals, and one change you made in code.;Use the usual homework form.
requirements_ja: Pythonで可視化を1点つくる。入門ノートブックを改変して構いません。;Datasaurusまたは別のデータを使い、出典リンクを添える。;スクリーンショット1枚は必須、2枚目は任意。;データの内容、図から分かること、コードで変更した点を1つ説明する。;いつもの宿題フォームから提出する。
challenge: Python view
challenge_ja: Pythonビュー
tools: Python notebook
tools_ja: Pythonノートブック
image: assets/images/lecture/week05-python.png
---

## Materials

- [Lecture slides](lectures/w05-python-datasaurus.pdf) {slides}

## Lecture Resources

- [Nightingale mortality diagram](https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg) {reference}

## Activity 1 Materials

- [Datasaurus starter notebook](data/datasaurus-python.ipynb) {data}
- [Datasaurus CSV](data/datasaurus.csv) {data}

## Activity 2 Materials

- [Open starter notebook in Colab](https://colab.research.google.com/github/yohman/26-2-Dataviz/blob/main/data/datasaurus-python.ipynb) {reference}
- [Anscombe CSV](data/anscombe.csv) {data}
- [Gapminder wrangling notebook (optional extension)](data/gapminder/gapdata.ipynb) {data}

## In Class Activities

### Activity 1
title: Turn numbers into a dinosaur
title_ja: 数字から恐竜を描く
text: Run Python in Google Colab, in your browser. No installation needed. Download the two files below. If Colab resets the session, upload the CSV again.
text_ja: Google Colabで、ブラウザ上でPythonを動かします。インストールは不要です。下の2つのファイルをダウンロードします。セッションがリセットされたら、CSVを再アップロードしてください。
link: https://colab.research.google.com/
link_label: Open Google Colab
link_label_ja: Google Colabを開く
steps:
- Download datasaurus.csv and datasaurus-python.ipynb using the Download buttons below.
- Open Google Colab and sign in with your Google account.
- Choose File > Upload notebook (or Open notebook > Upload), then select datasaurus-python.ipynb. Do not put the notebook in the Files sidebar.
- Click Connect if needed. Open the folder icon on the left, click Upload to session storage, and choose datasaurus.csv. Wait until it appears in the file list.
- Run each code cell from the top with its play button, or Shift+Enter. Wait for each cell to finish. The notebook reads your uploaded datasaurus.csv.
- Find the dinosaur plot. Change the point color or size, then run that cell again. Save your notebook to Drive using File > Save a copy in Drive if needed.
steps_ja:
- 下のダウンロードボタンから、datasaurus.csvとdatasaurus-python.ipynbをPCに保存します。
- Google Colabを開き、Googleアカウントでログインします。
- 「ファイル > ノートブックをアップロード」（または「ノートブックを開く > アップロード」）からdatasaurus-python.ipynbを選びます。左のファイル一覧には入れません。
- 必要なら「接続」をクリック。左のフォルダアイコンを開き、「セッション ストレージにアップロード」からdatasaurus.csvを選びます。一覧に表示されるまで待ちます。
- 上から順に、各コードセルの再生ボタン、またはShift+Enterで実行します。終わってから次のセルへ進みます。アップロードしたdatasaurus.csvを読み込みます。
- 恐竜の図が出たら、点の色か大きさを変えて再実行します。必要なら「ファイル > ドライブにコピーを保存」でノートブックを保存します。

### Activity 2
title: Compare and help one another
title_ja: 比べて、助け合う
text: Groups of four are here to help, not compete. Everyone should finish with a working plot on their own computer and a short explanation of why looking at the data matters.
text_ja: 4人グループは競争のためではなく、助け合うためです。全員が自分のPCで図を描き、なぜデータを見ることが大切なのか短く説明できることを目指します。
steps:
- Show your plot and one code change to the group. If someone is stuck, help them run the notebook on their own computer.
- Compare two datasets with similar means, standard deviations, and correlation but different shapes. Describe what the statistics do not reveal.
- Discuss how axis scaling and point size affect the result. Keep the underlying data unchanged while testing these choices.
- Prepare one observation or question for the class recap. There is no competition or formal group presentation.
steps_ja:
- グループに自分の図とコードの変更を1つ見せます。困っている人がいたら、その人のPCで動かせるよう助けましょう。
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
