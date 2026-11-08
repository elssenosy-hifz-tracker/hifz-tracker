# Hifz Tracker (source)

A single-page web app for running Quran hifz classes: students, sessions, review plans,
points, mushaf mistake marks, reports, and school mode (admin, teachers, substitutes).
It runs as a Claude Artifact with a small shared database (`window.claude` runtime).
The build produces **one self-contained HTML file**.

## Build

```bash
python3 build_portable.py            # writes dist/hifz-tracker-index.html
python3 build_portable.py out.html   # or choose the output path
```

No dependencies beyond Python 3. The output is byte-for-byte the same as the committed
`hifz-tracker-index.html` (the currently published version).

### What the build does
1. Reads `head_en.html` (CSS + HTML shell) and `app_en.js` (core app, ends with `init();`).
2. Fills placeholders in the data-heavy modules:
   - `mushaf.js`: `/*MUSDATA*/` gets `mushaf/mus.json` (Quran text, page layout), `/*HAFSFONT*/` gets `mushaf/hafs.b64` (the Hafs font as base64).
   - `heart.js`: `/*HEARTVEC*/` gets `heart/heartvec.json` (vector heart of the 114 surahs).
3. Strips the final `init();` from `app_en.js`, appends the modules in this order, then calls `init();` again:
   `mushaf.js, heart.js, guide.js, classrep.js, extras.js, more.js, quick.js, smart.js, goals.js, tarteel.js, school.js, schools.js`
4. Replaces `/*QDATA*/` with `qdata.json` (surah names, ayah counts, juz/page data).
5. Wraps it all into one HTML document (style from `head_en.html` into `<head>`, the rest into `<body>`, all JS in one `<script>`).

### The original build scripts
- `build-cloud.py` is the script actually used to publish the current version. Same steps as `build_portable.py`, but with hard-coded paths from the environment it ran in.
- `build.py` is an older version (paths under `/home/claude/hifz/`, without `tarteel.js`, `school.js`, `schools.js`). Kept for history.

Use `build_portable.py` from now on.

## Files

| Path | What it is |
|---|---|
| `head_en.html` | CSS and HTML skeleton |
| `app_en.js` | Core app: data model, students, sessions, review plan, points, navigation |
| `mushaf.js` | Mushaf view and mistake marks |
| `heart.js` | "Heart" of the surahs (strength view, PDF) |
| `guide.js` | In-app teacher guide |
| `classrep.js` | Class reports |
| `extras.js`, `more.js`, `quick.js` | Extra screens, quick record, misc features |
| `smart.js` | Settings, smart suggestions, admin tools |
| `goals.js` | Goals and plan sheets |
| `tarteel.js` | Coverage panel, recitation features |
| `school.js`, `schools.js` | School mode: roles, teachers, groups, substitutes, multiple schools |
| `qdata.json` | Quran metadata (surahs, ayahs, juz, pages) |
| `mushaf/mus.json`, `mushaf/hafs.b64` | Quran text/layout and Hafs font (see `mushaf/LICENSE-quran-ws-text.txt`) |
| `heart/` | Heart artwork, `heartvec.json` (used by the build), and the Python scripts that made it (`mk.py`, `vec.py`, `fit.py`, `lay.py`; they need numpy, scipy, Pillow, opencv, potrace and have old hard-coded paths) |
| `hifz-tracker-index.html` | Built output, the current published version |
| `hifz-tracker-arabic.html` | Early Arabic (RTL) version, before the app moved to the modular English build. Historical |
| `tests/` | Review reports (`A-pedagogy.md`, `B-ux.md`, `C-data.md`) and Playwright tests (`batch1.test.js`, `mock-db.js`). The test expects a built page named `test3.html` with the mock database injected in the working directory |
| `mockups/`, `ideas/`, `samples/`, `*-example.png` | Design mockups, idea PDF, sample certificate, screenshots. Documentation only, not used by the build |

## Licence note
The Quran text in `mushaf/` comes with its own licence: `mushaf/LICENSE-quran-ws-text.txt`. Keep it with the data if the repo is public.
