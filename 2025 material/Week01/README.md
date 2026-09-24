# Week 1 slide source

`w01.md` is the editable Marp source for the Week 1 lecture. The PDF served by
the course site is `../../lectures/w01.pdf`. The `w01.pdf` in this folder is the
untouched 2025 export for comparison.

From the repository root, preview the slides with:

```sh
PORT=4181 npx @marp-team/marp-cli@4.5.1 --html --server '2025 material/Week01'
```

Open `http://localhost:4181/w01.md`. After editing, rebuild the site PDF with:

```sh
npx @marp-team/marp-cli@4.5.1 --html --allow-local-files --pdf '2025 material/Week01/w01.md' --output lectures/w01.pdf
```

`--html` is needed for this deck's custom HTML styling. Only render trusted
source with `--allow-local-files`. Check the exported PDF before publishing.
