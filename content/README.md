# Weekly course content

Each teaching week is one editable Markdown file in `content/weeks/`.

1. Open the Markdown file for the week you want to update.
2. Edit the key-value pairs in the front matter and the `## Materials` list.
3. Save the file. The Agenda and homepage NEXT WEEK card read it directly when the page loads.

Keep every front-matter value on one line. `course_date` uses `YYYY-MM-DD`; it determines which week appears next on the homepage and when that week's panel opens. The Agenda shows a compact date derived from `course_date` and the class time from `date`. Keep `date` and `date_ja` up to date for other course uses.

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

## Mori's Corner

title: A short heading from Mori
title_ja: モリからの短い見出し
text: A brief weekly tip or invitation
text_ja: 今週のヒントやひとこと
link: https://example.org/
link_label: Explore this resource
link_label_ja: 参考リンクを開く
file: content/files/week01-handout.pdf
file_label: Open Mori's handout
file_label_ja: モリの配布資料を開く
```

`in_class` and `in_class_ja` are optional, but always add or remove them together. `homework` and `homework_ja` are required. When a weekly card is expanded, `look` / `look_ja` becomes the short lecture overview. The slide image (`image`, if supplied) and any `{slides}` link appear with the lecture and Mori's Corner. `{data}` and `{reference}` links appear inside the **IN CLASS** card alongside its tools, so list resources there that students will use for that activity. The **HOMEWORK** card remains separate. Keep `learn` / `learn_ja` as the brief practice preview visible before a week is expanded.

Future weeks stay collapsed and cannot be opened until the calendar day before `course_date` in Japan time. To inspect every week while preparing materials, add `?preview=all` to the Agenda URL (for example, `agenda.html?preview=all#week-2`). This also works for Mori, but it is only a preview convenience, not a private login: anyone with that URL can use it, and published Markdown files are publicly accessible. Do not put genuinely private or embargoed material in the published site.

Every week also has a `## Mori's Corner` section. Fill in any of its title, text, link, or file fields when Mori has something to share; leave unused fields blank. The English and Japanese fields can be edited independently, with a friendly placeholder shown until content is ready. `link` can be an HTTPS URL. Put downloadable files in the site (for example `content/files/`) and enter their site-relative path in `file`. Labels are optional; the site supplies defaults.
