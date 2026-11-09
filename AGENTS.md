# Hifz Tracker: instructions for agents

A web app for running Quran hifz classes, live at https://hifz-tracker-cd6d0.web.app on Firebase (Hosting + Firestore +
Auth, project `hifz-tracker-cd6d0`). Real teachers record real students in it every day, mostly on phones.

## Who you are working for

Usually the school's owner (GitHub `elssenosy-create`, on a Windows laptop): he knows the school, not software. Talk in plain
language about what he will see and do in the app; leave out git, GitHub, branch, merge, deploy, build and Firebase vocabulary
unless he asks (say "a test copy to try" and "put it live for the teachers"). When he asks a question rather than for a change,
answer it; a pull request is for changes. Both are owners of the GitHub organization `elssenosy-hifz-tracker`, which holds the
repo; technical contact: Edin (GitHub `elivnjak`).

## Setup

At session start a hook runs `node firebase/scripts/check-setup.mjs --session`: it installs the npm packages on a fresh checkout
and prints only what is missing, with the install command. When it reports something, fix it with him before other work:
explain in one sentence what the tool is for, run the install command (Windows: `winget`), then ask him to close and reopen the
terminal and Claude so the new tool is found. `npm run check-setup` (in `firebase/`) shows every check.

- A checkout made before the repo moved still points at `elivnjak/hifz-tracker` (`git remote get-url origin`): run
  `git remote set-url origin https://github.com/elssenosy-hifz-tracker/hifz-tracker.git`.
- `gh auth login`: choose GitHub.com, HTTPS, *Login with a web browser*; he types the code shown into the browser. Done when
  `gh auth status` succeeds.
- Git name and email: use his name and the email of his GitHub account.
- Java is required: `test:rules` and `test:e2e` need it, and GitHub does not test pull requests (see *Testing*).
- Windows: run the npm scripts (they find Python as `py`/`python` and handle paths); avoid calling `python3` directly.
  `.gitattributes` keeps LF line endings on every machine.

## Shipping a change

Every change, however small, goes through a pull request. Merging to `main` deploys to the live site automatically
(`.github/workflows/ci.yml`); that pipeline is the only way anything reaches the live site.

1. Before any new work, get up to date: `git checkout main` and `git pull` (Edin may have merged his own changes). If an
   unmerged branch of his exists, ask whether to continue that work first. Then start a new branch.
2. Make the change. Where to edit is under *Code map*. If the feature shows new kinds of data, add some to
   `firebase/src/sample-data.js` so the preview demonstrates it.
3. Run `npm test` in `firebase/` (details under *Testing*). Done when all three suites pass here; set up Java first if it is
   missing. GitHub only builds the preview for a pull request, so this run is the test before he tries it.
4. Commit, push, open a pull request. Title and description in plain language: what changes for teachers, and what to try.
5. Wait for the *Preview link* check (1 to 2 minutes). When it fails, read its log, fix and push again. Done when it is green
   and the pull request has the `<!-- hifz-preview -->` comment with the preview link.
6. Send him the preview link with a short list of what to try ("open Yusuf, record a session, check the new box"), and ask
   whether it can go live for the teachers. Do this for every change; when nothing in the app changes, say so. The preview
   runs on made-up sample data in his browser; *View as* at the top switches role. Links expire after 14 days; any new push
   makes a fresh one.
7. Merge only after he clearly says yes to that version, once he has had its preview link (after any later push, he approves
   again). Use a squash merge.
8. Watch the run on `main`: *Test* runs every suite again, then *Deploy to the live site*. Done when both are green; tell him it is live at
   https://hifz-tracker-cd6d0.web.app (teachers may need to refresh). When it fails, the live site keeps the previous version:
   tell him, fix, and ship again. Then `git checkout main` and `git pull`, so the next change starts from what is live.

Hard rules:
- Commit only to branches; `main` changes only by merging an approved pull request. (Branch protection is not available on this
  GitHub plan, so this rule is the protection.)
- Deploy only through the pipeline. `firebase deploy` from a laptop is for Edin in an emergency.
- Commit messages and pull request descriptions carry no AI attribution: no `Co-Authored-By` trailers naming an AI or tool,
  no "Generated with" lines.

### GitHub commands

`gh pr create`, `gh pr checks` and `gh pr merge` work when `gh` is signed in. REST equivalents, for when `gh pr` fails
(repo `elssenosy-hifz-tracker/hifz-tracker`):

```bash
gh api repos/elssenosy-hifz-tracker/hifz-tracker/pulls -f title="..." -f head=BRANCH -f base=main -f body="..."        # open PR
gh api repos/elssenosy-hifz-tracker/hifz-tracker/commits/SHA/check-runs --jq '.check_runs[] | [.name, .status, .conclusion] | @tsv'
gh api repos/elssenosy-hifz-tracker/hifz-tracker/issues/PR/comments --jq '.[] | select(.body | startswith("<!-- hifz-preview -->")) | .body'
gh api -X PUT repos/elssenosy-hifz-tracker/hifz-tracker/pulls/PR/merge -f merge_method=squash                          # after approval
gh api "repos/elssenosy-hifz-tracker/hifz-tracker/actions/runs?branch=main&event=push&per_page=1" --jq '.workflow_runs[0] | [.head_sha, .status, .conclusion, .html_url] | @tsv'
```

## Code map

- **App code**: the `*.js` files in the repo root (`app_en.js` core, then the modules) plus `head_en.html` (CSS and page shell).
  `build_portable.py` concatenates them into one classic `<script>`: every top-level name is a global shared across files, and
  a new module file must be added to the `mods` list in `build_portable.py`. README.md has the per-file table.
- **Conventions**: plain browser JavaScript, no frameworks and no npm packages in app code (the app is one self-contained page
  that keeps working offline). Match the surrounding style, which is compact. Design for a phone first (the tests use a
  390 px wide screen).
- **Data layer**: the app was written for the Claude Artifact runtime and still calls `claude.use("db" | "user" | "downloads")`.
  `firebase/src/boot.js` provides those on Firestore and Firebase Auth (with the sign-in screen); `firebase/src/demo.js` provides
  them on an in-browser store with sample data (previews, local dev). App code talks only to `claude.use(...)`, never to Firebase.
- **Build**: `npm run build` in `firebase/` writes `public/` (real app, `build_firebase.py`) and `public-demo/` (demo,
  `--demo`). Both are generated and git-ignored: edit the sources and rebuild. `hifz-tracker-index.html` is the frozen Claude
  Artifact version; leave it as is.
- **Access**: `firestore.rules`, `firebase/owners.json`, and the members sync in `boot.js`. Who gets in and what each role may do
  is explained in README.md (*Firebase*).
- **Background**: `ideas/` (feature ideas) and `tests/*.md` (earlier reviews of teaching, UX and data) are useful context for
  new features.

## Data safety

The live database holds the school's records, and a Hosting rollback does not undo data changes. So:
- Treat stored field and collection names as a published format. Reading a new optional field is safe; renaming, removing or
  changing the meaning of a stored field needs code that still reads old records, or a migration Edin has agreed to.
- Changes to `firestore.rules`, `firebase/owners.json`, `firebase/src/boot.js` or `firebase/src/config.js` decide who can see
  children's records. Make them only when asked, say so in the pull request, and ask him to have Edin look before merging.
  `owners.json` and the owner list in `firestore.rules` must match (a test checks).
- Each new collection the app listens to is downloaded in full by every device; the project has a $10/month budget alert.
- Something went wrong on the live site or in the data: follow `docs/RECOVERY.md`.

## Testing and local preview

From `firebase/`:
- `npm run dev`: the demo build at http://localhost:5173 (sample data, no Firebase, no Java). Use it to look at your change,
  and he can open it too.
- `npm test`: `test:demo` (demo build in Chrome), `test:rules` (security rules), `test:e2e` (the real build against the Firebase
  emulators: sign-in, roles, backup restore). `test:rules` and `test:e2e` need Java 11+. Without Chrome, set `PW_BUNDLED=1`
  after `npx playwright install chromium`.
- For a new feature, add a check to `test/demo.mjs` (or `test/e2e.mjs` when it involves sign-in or access) that fails without it.
- On localhost the real build uses the emulators; adding `?live` to the URL points it at the real database. Keep `?live` for
  read-only checks Edin asks for.
- To save Actions minutes, GitHub runs no tests on pull requests, only the preview build. It runs every suite on Linux after a
  merge, before deploying; a failure there keeps the previous version live. His Windows laptop is the only Windows check.
- `tests/batch1.test.js` is an older standalone test (see README); it is not part of `npm test`.
