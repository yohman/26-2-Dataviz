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
- Put GDP on Columns and Life Expectancy on Rows. On each pill, choose Measure > Average so they show AVG(GDP) and AVG(Life Expectancy). Select Circle on the Marks card.
- Drag Country to Detail on the Marks card. The single circle splits into countries. They still summarize all years until you complete the next step.
- If Year is a measure, right-click it in the data pane and choose Convert to Dimension. Drag Year to Pages and make it Discrete (blue), not SUM(Year). Select 2000 in the page control to show one country per circle for that year.
- Drag region to Color on the Marks card.
- Drag Population to Size. SUM(Population) works when each mark is one country-year. Adjust Size so large bubbles do not obscure everything. Try 60–70% opacity under Color to reveal overlaps.
- Right-click the horizontal GDP axis, choose Edit Axis, and enable Logarithmic. Keep the Life Expectancy axis linear.
- Use Play on the Year page control to move through time, starting slowly. If the axes change between years, set fixed ranges covering the years you want to show. Remove any single-year filter before animating.
- Check the final setup: Columns = AVG(GDP); Rows = AVG(Life Expectancy); Marks = Circle; Detail = Country; Color = region; Size = SUM(Population); Pages = discrete Year. Check the source definition of GDP before labeling it GDP per capita or adding dollar units.
walkthrough_ja:
- GDPを「列」、Life Expectancyを「行」に置きます。各ピルのメニューで「メジャー」から「平均」を選び、AVG(GDP)とAVG(Life Expectancy)にします。「マーク」の種類は「円」を選びます。
- Countryを「マーク」の「詳細」にドラッグします。一つの円が国ごとの円に分かれます。ただし、この段階ではまだ全ての年をまとめているため、次の手順に進みましょう。
- Yearがメジャーの場合は、データペインで右クリックし「ディメンションに変換」を選びます。Yearを「ページ」に置き、「不連続」（青）にします。SUM(Year)にはしません。ページの操作欄で2000年を選ぶと、その年の各国が一つずつの円になります。
- regionを「マーク」の「色」にドラッグします。
- Populationを「サイズ」にドラッグします。一つのマークが一つの国・年ならSUM(Population)で構いません。大きな円が他の国を隠さないようサイズを調整し、「色」の不透明度を60〜70%程度にすると重なりが見やすくなります。
- 横軸のGDPを右クリックし、「軸の編集」で「対数」を有効にします。縦軸のLife Expectancyは通常の線形の軸のままにします。
- Yearのページ操作欄で再生し、年ごとの変化を見ます。まずは遅い速度で試しましょう。年ごとに軸が動く場合は、表示したい期間の値を含む固定範囲に設定します。一年だけのフィルターを設定している場合は、再生前に外してください。
- 最終確認：列＝AVG(GDP)、行＝AVG(Life Expectancy)、マーク＝円、詳細＝Country、色＝region、サイズ＝SUM(Population)、ページ＝不連続のYear。GDPの出典と定義を確認してから「一人当たりGDP」や通貨単位を軸に記載しましょう。

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
