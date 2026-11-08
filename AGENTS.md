# Hifz Tracker: instructions for agents

A web app for running Quran hifz classes, live at https://hifz-tracker-cd6d0.web.app on Firebase (Hosting + Firestore +
Auth, project `hifz-tracker-cd6d0`). Real teachers record real students in it every day.

## Who you are working for

Usually the school's owner (GitHub `elssenosy-create`): he knows the school, not software. Talk in plain language about what
he will see and do in the app; leave out git, branch, build and Firebase vocabulary unless he asks. Repo owner and technical
contact: Edin (GitHub `elivnjak`).

## Shipping a change

Every change, however small, goes through a pull request. Merging to `main` deploys to the live site automatically
(`.github/workflows/ci.yml`); that pipeline is the only way anything reaches the live site.

1. Start from fresh `main` on a new branch.
2. Make the change. Where to edit is under *Code map*. If the feature shows new kinds of data, add some to
   `firebase/src/sample-data.js` so the preview demonstrates it.
3. Run `npm test` in `firebase/` (details under *Testing*). Done when it passes, or when you can name which suites could not run
   here and why.
4. Commit, push, open a pull request. Title and description in plain language: what changes for teachers.
5. Wait for the checks to finish. When the *Test* check fails, fix and push again. Done when *Test* and *Preview link* are green
   and the pull request has the `<!-- hifz-preview -->` comment with the preview link.
6. Send him the preview link with a short list of what to try ("open Yusuf, record a session, check the new box"). The preview
   runs on made-up sample data in his browser; *View as* at the top switches role.
7. Merge only after he clearly says yes to that version (after any later push, he approves again). Use a squash merge.
8. Watch the *Deploy to the live site* job on `main`. Done when it is green; tell him it is live at
   https://hifz-tracker-cd6d0.web.app. When it fails, the live site keeps the previous version: tell him, fix, and ship again.

Hard rules:
- Commit only to branches; `main` changes only by merging an approved pull request. (Branch protection is not available on this
  GitHub plan, so this rule is the protection.)
- Deploy only through the pipeline. `firebase deploy` from a laptop is for Edin in an emergency.
- Commit messages and pull request descriptions carry no AI attribution: no `Co-Authored-By` trailers naming an AI or tool,
  no "Generated with" lines.

### GitHub commands

Use the GitHub tools your environment has. In Claude Code on the web, `gh pr ...` (GraphQL) can fail through the proxy; these
REST forms work everywhere (repo `elivnjak/hifz-tracker`):

```bash
gh api repos/elivnjak/hifz-tracker/pulls -f title="..." -f head=BRANCH -f base=main -f body="..."        # open PR
gh api repos/elivnjak/hifz-tracker/commits/SHA/check-runs --jq '.check_runs[] | [.name, .status, .conclusion] | @tsv'
gh api repos/elivnjak/hifz-tracker/issues/PR/comments --jq '.[] | select(.body | startswith("<!-- hifz-preview -->")) | .body'
gh api -X PUT repos/elivnjak/hifz-tracker/pulls/PR/merge -f merge_method=squash                          # after approval
gh api "repos/elivnjak/hifz-tracker/actions/runs?branch=main&event=push&per_page=1" --jq '.workflow_runs[0] | [.head_sha, .status, .conclusion, .html_url] | @tsv'
```

## Code map

- **App code**: the `*.js` files in the repo root (`app_en.js` core, then the modules) plus `head_en.html` (CSS and page shell).
  `build_portable.py` concatenates them into one classic `<script>`: every top-level name is a global shared across files, and
  a new module file must be added to the `mods` list in `build_portable.py`. README.md has the per-file table.
- **Data layer**: the app was written for the Claude Artifact runtime and still calls `claude.use("db" | "user" | "downloads")`.
  `firebase/src/boot.js` provides those on Firestore and Firebase Auth (with the sign-in screen); `firebase/src/demo.js` provides
  them on an in-browser store with sample data (previews, local dev). App code talks only to `claude.use(...)`, never to Firebase.
- **Build**: `python3 build_firebase.py` writes `public/` (real app); `--demo` writes `public-demo/`. Both are generated and
  git-ignored: edit the sources and rebuild. `hifz-tracker-index.html` is the frozen Claude Artifact version; leave it as is.
- **Access**: `firestore.rules`, `firebase/owners.json`, and the members sync in `boot.js`. Who gets in and what each role may do
  is explained in README.md (*Firebase*).

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

From `firebase/`, after `npm ci`:
- `npm run dev`: the demo build at http://localhost:5173 (sample data, no Firebase, no Java). Use it to look at your change.
- `npm test`: `test:demo` (demo build in Chrome), `test:rules` (security rules), `test:e2e` (the real build against the Firebase
  emulators: sign-in, roles, backup restore). `test:rules` and `test:e2e` need Java 11+; on Edin's Mac
  `export JAVA_HOME=/opt/homebrew/opt/openjdk@21`. Without Chrome, set `PW_BUNDLED=1` after `npx playwright install chromium`.
- On localhost the real build uses the emulators; adding `?live` to the URL points it at the real database. Keep `?live` for
  read-only checks Edin asks for.
- CI runs all three suites on every push, so a suite that cannot run here still gates the merge.
- `tests/batch1.test.js` is an older standalone test (see README); it is not part of `npm test`.
