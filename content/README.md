# Weekly course content

Each teaching week is one editable Markdown file in `content/weeks/`.

1. Open the Markdown file for the week you want to update.
2. Edit the key-value pairs in the front matter and the `## Materials` list.
3. Save the file. The Agenda and homepage NEXT WEEK card read it directly when the page loads.

Keep every front-matter value on one line. `course_date` uses `YYYY-MM-DD`; it determines which week appears next on the homepage. `date` and `date_ja` are the labels students see on the Agenda.

```md
---
week: 1
act: SEE
course_date: 2026-09-25
date: Fri 25 Sep 2026 · P2 · 10:40–12:20
date_ja: 2026年9月25日（金） · 2限 · 10:40–12:20
title: Why Visualize?
title_ja: なぜ可視化するのか？
look: What students will look at
look_ja: 学生が見るもの
learn: What students will learn
learn_ja: 学生が学ぶこと
in_class: Optional work students complete during class
in_class_ja: 任意：授業内で取り組むこと
homework: Work students complete after class
homework_ja: 学生が授業後に取り組むこと
challenge: Short assignment name
challenge_ja: 短い課題名
tools: Suggested tools
tools_ja: おすすめのツール
image: assets/images/lecture/example.png
---

## Materials

- [Lecture slides](lectures/w01.pdf) {slides}
- [Dataset](data/example.csv) {data}
- [Reference](https://example.org/) {reference}
```

`in_class` and `in_class_ja` are optional, but always add or remove them together. `homework` and `homework_ja` are required. When a weekly card is expanded, students see the lecture first, then a distinct **IN CLASS** card when supplied and a **HOMEWORK** card. `image` is optional. Resource categories are `slides`, `data`, and `reference`; slides are displayed first automatically.
