---
week: 4
act: MAKE
course_date: 2026-10-16
date: Fri 16 Oct 2026 · P2 · 10:40–12:20
date_ja: 2026年10月16日（金） · 2限 · 10:40–12:20
title: Visual Language and the Pokémon Challenge
title_ja: 視覚言語とポケモン・チャレンジ
look: Marks, channels, and Nightingale: how visual choices shape what we see
look_ja: マーク、チャネル、Nightingale：視覚的な選択で、見えるものが変わる
learn: use position, color, size, and chart type deliberately in Tableau
learn_ja: Tableauで位置・色・大きさ・グラフの種類を意図的に選ぶ
schedule: 10:40–10:50|Submission review|Look back at your Tableau projects;10:50–11:15|Visual language|Marks, channels, and Nightingale;11:15–11:40|Individual challenge|Explore the shared Pokémon dataset in Tableau;11:40–11:55|Group share and selection|Compare four works and select one to post;11:55–12:10|Show and tell|Browse the group selections and discuss a few examples;12:10–12:20|Recap and homework|Apply today's visual choices to your own project
schedule_ja: 10:40–10:50|提出作品のレビュー|これまでのTableau作品を振り返る;10:50–11:15|視覚言語|マーク・チャネル・Nightingale;11:15–11:40|個人チャレンジ|共通のポケモンデータをTableauで探索;11:40–11:55|グループ共有と選択|4人の作品を比べ、投稿する1点を選ぶ;11:55–12:10|ショー＆テル|各グループの投稿を見て、数例を全体で共有;12:10–12:20|まとめと宿題|今日の学びを自分の作品の改善へ
in_class: Explore the same Pokémon dataset individually in Tableau, compare your findings in groups of four, and post one selected work per group for show and tell.
in_class_ja: 共通のポケモンデータをTableauで個人探索し、4人で発見を比べ、グループから1点を選んで投稿・共有します。
homework: Refine your own Tableau project from a previous assignment using today's lesson and feedback. This is your individual project, not the group's Pokémon selection.
homework_ja: 今日の学びとフィードバックを生かし、以前の課題で制作した自分のTableau作品を改善してください。グループで選んだポケモン作品ではなく、個人の作品を仕上げる課題です。
requirements: Improve your own existing Tableau project. Keep your chosen data and question, or refine them if necessary.;Make at least two purposeful improvements, such as chart type, position, color, size, ordering, labels, or axes.;Use a clear title and include a link to your data, website, or source document.;Submit one screenshot of the improved visualization (required). A second screenshot is optional and may show the earlier version for comparison.;Explain what you changed, why, and what the viewer can now understand more clearly.;Use the usual homework form. You may resubmit until the deadline.
requirements_ja: これまでの自分のTableau作品を改善する。データや問いは継続し、必要に応じて見直して構いません。;グラフの種類・位置・色・大きさ・並び順・ラベル・軸など、意図のある改善を少なくとも2点行う。;内容が伝わるタイトルと、使用データ・ウェブサイト・資料へのリンクを添える。;改善後のスクリーンショット1枚は必須。2枚目は任意で、比較用の改善前の画像でも構いません。;何を変えたか、なぜ変えたか、何がより伝わるようになったかを説明する。;いつもの宿題フォームから提出する。締切までは再提出できます。
challenge: Refine your Tableau project
challenge_ja: 自分のTableau作品を磨く
tools: Tableau
tools_ja: Tableau
image: assets/images/lecture/week04-visual-language.png
---

## Materials

- [Lecture slides](lectures/w04-visual-language.pdf) {slides}
- [Pokémon CSV](data/pokemon-review.csv) {data}
- [PokéAPI source and field definitions](https://pokeapi.co/docs/v2) {reference}

## In Class Activities

### Activity 1
title: One dataset, your own discovery
title_ja: 同じデータから、自分の発見を
text: Everyone uses the same 1,025 Pokémon and 19 fields. No game knowledge is needed: each row is one species' default form. Work on your own computer for 25 minutes and make one visualization that communicates a finding, not just a collection of circles.
text_ja: 全員が同じ1,025匹・19項目のデータを使います。ゲームの知識は不要で、1行が1種の標準の姿を表します。25分間、自分のPCで探索し、単に円を並べるのではなく、発見が伝わる可視化を1点つくりましょう。
steps:
- Download the Pokémon CSV and import it into Tableau. Names and types are available in Japanese and English. Height is in metres and weight in kilograms.
- Choose a question: are heavier Pokémon slower? How do attack and defense relate? Do primary types or generations differ? These are starting points, not required answers.
- Try at least two visual approaches, then choose the one that best communicates your finding. Use position, color, size, and labels with a purpose.
- For a scatterplot, place Name or Pokedex_ID on Detail so each species has its own mark. Treat Generation as a discrete dimension. Filter to Generation 1 for a smaller starting point of 151 Pokémon if useful.
- For group comparisons, use averages rather than sums of stats unless you have a reason. Primary-type comparisons do not include both types. Blank Type_2 means there is no second type.
- Give your chosen chart a meaningful title, identify the units, and save a screenshot. Note one finding and one visual choice you can explain.
steps_ja:
- ポケモンCSVをダウンロードし、Tableauで読み込みます。名前とタイプには日本語・英語があり、身長はm、体重はkgです。
- 問いを選びます。重いポケモンは遅い？攻撃と防御には関係がある？主タイプや世代で違う？これらは出発点の例で、同じ答えを探す必要はありません。
- 少なくとも2通りの見せ方を試し、発見が最も伝わるものを選びます。位置・色・大きさ・ラベルを意図的に使いましょう。
- 散布図ではNameまたはPokedex_IDを「詳細」へ置き、1種につき1マークにします。Generationは不連続のディメンションとして扱います。必要なら第1世代の151匹に絞って始めても構いません。
- タイプや世代を比べる際は、理由がなければ能力値の合計ではなく平均を使います。主タイプだけの比較は第2タイプを含みません。Type_2の空欄は、第2タイプがないという意味です。
- 内容が伝わるタイトルと単位を付け、スクリーンショットを保存します。発見を1つ、説明できる視覚的な選択を1つメモしましょう。

### Activity 2
title: Share, select, and show
title_ja: 共有し、選び、見せる
text: Form groups of four. Everyone shows their own chart. Choose the work that most clearly communicates an interesting finding, improve it together, and post one entry per group. This is a class showcase, not a final-project team decision.
text_ja: 4人グループになり、全員が自分のグラフを見せます。面白い発見が最も明確に伝わる作品を1点選び、一緒に改善して、グループにつき1件投稿します。最終プロジェクトのチーム決めではなく、今日の作品共有です。
steps:
- Group share · 8 minutes: give everyone about two minutes to show their finding and explain one design choice. Ask what is clear and what is difficult to read.
- Select and improve · 7 minutes: choose one work based on the finding, visual clarity, and accurate comparison, not the most decoration. Make one final improvement together.
- One representative posts the chosen work using the linked form. Keep Week 4 selected and start the title with [Group 01] (use your group's number). Add all four members' names and one sentence explaining why you selected it in the commentary.
- Upload one screenshot (a second is optional) and use the Pokémon dataset link as the data source. Submit only once per group for this activity, separately from each person's homework.
- Show and tell · 15 minutes: open the Week 4 gallery, browse the group posts, and prepare to explain your finding and design choice in one minute if invited. We will discuss a few contrasting examples rather than present every group in turn.
steps_ja:
- グループ共有・8分：1人約2分で発見とデザイン上の工夫を説明します。伝わる点、読み取りにくい点を話し合いましょう。
- 選択と改善・7分：装飾の多さではなく、発見・伝わりやすさ・比較の正確さで1点を選びます。最後に1点、一緒に改善します。
- 代表者1人が下のフォームから投稿します。第4週を選んだまま、タイトルの先頭を[Group 01]のように自分たちのグループ番号にします。説明欄に4人全員の名前と、選んだ理由を1文で添えてください。
- スクリーンショット1枚（2枚目は任意）と、データの出典としてポケモンCSVのリンクを添えます。この授業内課題は1グループ1件で、個人の宿題とは別に提出します。
- ショー＆テル・15分：第4週のギャラリーで各グループの投稿を見ます。指名されたら、発見と見せ方の工夫を1分で説明しましょう。全グループの順番発表ではなく、対照的な数例を全体で取り上げます。
link: https://docs.google.com/forms/d/e/1FAIpQLSctVgkCDhtkaG8UscBrVJVteqBiCFXHCB_tlQFscdM8wU4xAg/viewform?usp=pp_url&entry.155622460=%E7%AC%AC4%E9%80%B1%EF%BD%9C%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E3%83%BB%E3%82%B0%E3%83%AB%E3%83%BC%E3%83%97%E5%85%B1%E6%9C%89
link_label: Post the group selection
link_label_ja: グループで選んだ作品を投稿
results_link: gallery.html?week=4
results_label: Week 4 show and tell
results_label_ja: 第4週の作品を見る

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
