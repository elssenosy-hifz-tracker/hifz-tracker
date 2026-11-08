# Hifz Tracker (source)

A single-page web app for running Quran hifz classes: students, sessions, review plans,
points, mushaf mistake marks, reports, and school mode (admin, teachers, substitutes).
It was built as a Claude Artifact (`window.claude` runtime) and now runs on **Firebase**:
https://hifz-tracker-cd6d0.web.app (Firebase project `hifz-tracker-cd6d0`, Firestore in Sydney).
The build produces **one self-contained HTML file** plus a small Firebase layer.

## Firebase (live site)

```bash
cd firebase && npm install && cd ..   # once
python3 build_firebase.py            # writes public/index.html + public/fb-<hash>.js
firebase deploy                      # rules + site (needs `firebase login` as a project owner)
```

How it fits together:
- `firebase/src/boot.js` gives the app the same `claude.use("db" | "user" | "downloads")` objects it was written for,
  backed by Cloud Firestore, Firebase Auth and browser downloads, and shows a sign-in screen first (Google or email link).
  `build_firebase.py` loads it in `<head>` and starts the app with `HIFZ_BOOT(init)` instead of `init()`. The app code is unchanged.
- Firestore cannot store arrays inside arrays or `undefined`; the layer stores inner arrays as `{__a:[...]}` and JSON-cleans
  values, so data looks exactly as it did in the Claude store.
- **Who gets in:** the owners in `firebase/owners.json` (also listed in `firestore.rules`; a test checks they match), plus every
  teacher in the app's Teachers list (School → Teachers) who has a sign-in email. Owners and admins keep `members/<email>`
  in sync with that list automatically; the rules read it. Roles: admin (everything), teacher (records, cannot change access),
  supervisor (read only). Only verified emails count.
- Data from the Claude version moves over with the app's own backup: in the old version, Settings → Grading, points,
  holidays, backup → *Download full backup*; on the new site, same place → *Restore from a backup file*.

Tests (Firebase emulators; need Java 11+, e.g. `export JAVA_HOME=/opt/homebrew/opt/openjdk@21`):
```bash
cd firebase
npm run test:rules   # security rules
npm run test:e2e     # the built app in Chrome: sign-in, roles, restore, data round trip (run build_firebase.py first)
```
Locally the app talks to the emulators automatically (add `?live` to use the real project).

## Build (single file)

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
| `hifz-tracker-index.html` | Built output of the Claude Artifact version |
| `build_firebase.py`, `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json` | Firebase build, hosting and security rules |
| `firebase/` | Firebase layer (`src/boot.js`, `src/config.js`), owners list, rules and end-to-end tests |
| `hifz-tracker-arabic.html` | Early Arabic (RTL) version, before the app moved to the modular English build. Historical |
| `tests/` | Review reports (`A-pedagogy.md`, `B-ux.md`, `C-data.md`) and Playwright tests (`batch1.test.js`, `mock-db.js`). The test expects a built page named `test3.html` with the mock database injected in the working directory |
| `mockups/`, `ideas/`, `samples/`, `*-example.png` | Design mockups, idea PDF, sample certificate, screenshots. Documentation only, not used by the build |

## Licence note
The Quran text in `mushaf/` comes with its own licence: `mushaf/LICENSE-quran-ws-text.txt`. Keep it with the data if the repo is public.
