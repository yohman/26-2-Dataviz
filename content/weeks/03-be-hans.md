---
week: 3
act: MAKE
course_date: 2026-10-09
date: Fri 9 Oct 2026 · P2 · 10:40–12:20
date_ja: 2026年10月9日（金） · 2限 · 10:40–12:20
title: Be Hans
title_ja: ハンスになろう
look: Hans Rosling and Gapminder’s moving relationship between health, income, and population
look_ja: Hans RoslingとGapminder：健康、所得、人口の動く関係
learn: Tableau: import, wrangle, and explore hans.csv
learn_ja: Tableau：hans.csvの読み込み、整形、探索
schedule: 10:40–11:00|Submission review|Look back at student work and share observations;11:00–11:20|Hans Rosling|A short lecture on Hans and Gapminder;11:20–11:50|Explore and share|Import the data, explore individually, then compare and revise in groups;11:50–12:20|Presentations and recap|Groups share a chosen chart, followed by discussion and homework
schedule_ja: 10:40–11:00|提出作品のレビュー|学生の作品を見返し、気づきを共有する;11:00–11:20|ハンス・ロスリング|ハンスとGapminderについての短い講義;11:20–11:50|探索とグループ共有|データを読み込み、個人で探索した後、グループで比較・修正する;11:50–12:20|グループ発表とまとめ|選んだグラフを発表し、全体で振り返り、宿題を確認する
in_class: Import hans.csv in Tableau, build one scatterplot, and share one question the view raises.
in_class_ja: Tableauでhans.csvを読み込み、散布図を一つつくり、そのビューから生まれる問いを一つ共有する。
homework: Use Tableau to visualize data of your own choice. You are welcome to reuse the dataset from a previous assignment, collect your own new data, or find a completely new dataset. Choose a question or comparison to explore, then try different chart types, fields, and visual choices to make your findings clear. Include a meaningful title and identify your data source. Submit through the same homework form as before, with one required screenshot and an optional second screenshot, plus commentary explaining your work.
homework_ja: 自分で選んだデータをTableauで可視化してください。これまでの課題で使ってきたデータを再利用しても、自分で新しいデータを集めても、まったく新しいデータセットを探しても構いません。調べたい問いや比較を決め、グラフの種類、項目、見せ方を試しながら、発見が伝わる可視化をつくりましょう。内容が伝わるタイトルを付け、データの出典を明記してください。提出はこれまでと同じ宿題フォームで、スクリーンショット1枚（必須）、必要に応じて2枚目（任意）、作品についての説明を添えて行います。
deliverables: A title; a link to your data, website, or source document; one screenshot (required) and a second screenshot if useful (optional); and commentary explaining what data you chose, what you visualized in Tableau, what you found, and why you chose that particular representation.
deliverables_ja: タイトル、使用したデータ・ウェブサイト・資料へのリンク、スクリーンショット1枚（必須）と必要に応じて2枚目（任意）、作品の説明。説明では、どのデータを選んだか、Tableauで何を可視化したか、何が分かったか、その表現を選んだ理由を伝えてください。
challenge: Your data, visualized with Tableau
challenge_ja: 自分のデータをTableauで可視化する
tools: Tableau
tools_ja: Tableau
image: assets/images/lecture/hans.png
---

## Materials

- [Lecture slides](lectures/w03.pdf) {slides}
- [Hans CSV](data/gapminder/hans.csv) {data}
- [Tableau for students](https://www.tableau.com/academic/students) {reference}

## In Class Activities

### Activity 1
title: Rebuild Hans's chart, then make it yours
title_ja: ハンスのグラフを再現し、自分の発見へ
text: Start with hans.csv and explore how income, life expectancy, and population change across countries and years. First work individually, then compare and improve your charts with your group.
text_ja: hans.csvを使い、国や年ごとに所得・平均寿命・人口がどう変化するかを探ります。まず個人で試し、その後グループで比べてグラフを改善します。
steps:
- Open Tableau Public (Student Edition) and import hans.csv.
- Find and use Country, Year, Life expectancy, GDP, Population, and region; check that Tableau reads each field correctly.
- Individual exploration · 10 minutes: try to recreate Hans's chart. Explore the data and note one pattern or question.
- Group discussion · 10 minutes: share what you found, discuss what worked and what did not, and revise your charts.
- Choose one revised chart to present. Explain one finding and one change you made after the group discussion.
steps_ja:
- Tableau Public（学生版）を開き、hans.csvを読み込みます。
- Country、Year、Life expectancy、GDP、Population、regionの各項目を使います。Tableauが各項目を正しく読み取っているか確認しましょう。
- 個人での探索・10分：ハンスのグラフの再現を試します。データを探索し、見つけたパターンか疑問を一つメモします。
- グループでの話し合い・10分：発見を共有し、うまくいった点・いかなかった点を話し合い、グラフを修正します。
- 修正版から一つを選んで発表します。発見したことを一つと、グループでの話し合いを受けて変更した点を一つ説明しましょう。

walkthrough:
- Set the axes::Drag `GDP` to `Columns` and `Life Expectancy` to `Rows`. Set both to `Average` using each pill's menu. Choose `Circle` on the Marks card.
- Split the single circle::Drag `Country` to `Detail`. Each country gets its own circle, but years are still combined.
- Choose one year::Convert `Year` to a dimension if needed. Drag it to `Pages` and select `Discrete` (blue). Choose `2000`. Each circle now represents one country in one year.
- Add color and size::Drag `region` to `Color` and `Population` to `Size`. Keep `SUM(Population)`. Adjust bubble size and try 60–70% opacity to see overlaps.
- Adjust the axes::Right-click the GDP axis: `Edit Axis` > `Logarithmic`. Keep life expectancy linear. If circles crowd the top, uncheck `Include zero` on its axis, or try a fixed range of 20–90 years.
- Animate::Press `Play` on the Year control. Start slowly and use fixed axis ranges for consistent comparisons. Remove any single-year filter first.
- Check the meaning::Confirm the source definition of `GDP` before adding per-capita or currency labels.
walkthrough_ja:
- 軸をつくる::`GDP`を`列`、`Life Expectancy`を`行`に置きます。各ピルのメニューで`平均`を選び、マークの種類を`円`にします。
- 一つの円を国ごとに分ける::`Country`をマークの`詳細`へドラッグします。国ごとの円になりますが、まだ全ての年をまとめています。
- 一年を選ぶ::必要なら`Year`をディメンションに変換します。`ページ`へ置き、`不連続`（青）を選択。`2000`年を選ぶと、一つの円が一つの国・年になります。
- 色と大きさを付ける::`region`を`色`、`Population`を`サイズ`へ。`SUM(Population)`で構いません。円のサイズを調整し、不透明度を60〜70%程度にすると重なりが見やすくなります。
- 軸を調整する::GDPの横軸を右クリックし、`軸の編集`で`対数`を有効に。平均寿命の縦軸は線形のままにします。円が上半分に集まる場合は`ゼロを含める`を外すか、20〜90年の固定範囲を試しましょう。
- 時間の変化を見る::Yearの操作欄で`再生`します。まずは遅い速度で。比較しやすいよう軸の範囲を固定し、一年だけのフィルターは外してください。
- データの意味を確認する::`GDP`の出典と定義を確認してから、一人当たりや通貨単位を軸に記載しましょう。

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
