# Review C: data model, position logic, provenance, permissions, backup and operations

Scope: app_en.js, quick.js, extras.js, school.js, schools.js, tarteel.js, more.js (current sources, built 6 Nov 04:38). The tests ran on a copy of the mock harness, `review/C/app.html`, which is test2.html plus a `?fresh` switch for an empty store. Scripts: `review/C/t_pos.js`, `t_edit.js`, `t_ord.js`, `t_bk.js`, `t_rb.js`, `t_mig.js`, `t_mig2.js`. The mock does not enforce access rules and has a single client, so the permission and concurrency findings come from reading the code and the rules.

How the model works: `students.pos` is the only source of truth for progress. It is a count of lines along the student's own axis, built by `buildOrder(order, prevS, startS)`. The plan (`dayPlan`) is computed from `pos` and the amount alone. Events are a log: each one stores `from`/`to` in the coordinates of the axis that was current when it was saved. Nothing ever recomputes `pos` from the events.

## Ranked findings

### 1. CONFIRMED DEFECT: re-entering a back-dated session after deleting an old one counts the progress twice (case 5)
`app_en.js:renderSession` onsubmit always sets `d.from=st.pos`, the current head, and `newPos=end`, whatever the date.
Test (t_pos.js):
1. Three sessions advance pos 40 → 45 → 49.86 → 54.6.
2. Deleting the middle one leaves pos at 54.6 and keeps the later record. This part passes: no later session is lost.
3. Re-entering the corrected session for the same date writes `from 54.6 → 60` and pos becomes 60. The student skips about 5 lines that were never memorized, and the 45–49.86 gap stays unrecorded.

Deleting the head record rewinds correctly (`wireDeletes`, pos 60 → 54.6). There is no way to edit a past record: only today's record can be replaced.

**Fix (keeps data):**
- When `date` is earlier than the latest hifz record, never move `pos`.
- Set `from` to the first gap in the recorded coverage, or ask the teacher for the range.
- Add a real "edit record" action. It changes mistakes, grade, review and notes in place and locks `from`/`to`, except on the head record.

### 2. CONFIRMED DEFECT: changing the date while editing today's record creates a duplicate record
`renderSession`: `st={...st,pos:dup.from}`, but the record is replaced only `if(dup&&date===dup.date)`.
Test: save today's session (54.6 → 60), reopen it and change the date to 4 days ago. Result: two records, `e1` (today) and `m5` (back-dated), both 54.6 → 60. Pos stays correct, but lines, points, streak and the monthly challenge count the session twice. The back-dated record also sits out of order in time.
**Fix:** in dup mode, always set `d._replace=dup.id`, so the record moves to the new date.

### 3. CONFIRMED DEFECT: editing a student's previous memorization or direction silently resets or inflates the position
`app_en.js` edit form onsubmit: `pos=posAfterAyah(s,a)` under the new axis.
- If the "reached" surah is ticked as previously memorized, `posAfterAyah` finds no segment and returns 0. Test (t_edit.js): pos 45 → 0, and memorized lines 45 → 4.9. The 40 lines memorized in the program disappear from the plan and the far review.
- Changing the direction from nas to fatiha with reached = Quraysh 4 gives pos 45 → 9019.92, which is 3 pages → 601 pages memorized (t_ord.js). This follows from the axis design, but it happens with no warning.
- Old records keep coordinates from the old axis. After any axis change, the comparisons in delete-rewind and today's replace (`dup.from`) mix coordinate systems.

**Fix:**
- Before saving, compare the memorized pages before and after and ask for confirmation when they change by more than one portion.
- Refuse a "reached" ayah inside `prevS`, or snap it to the previous non-prev ayah.
- Store a global anchor on each record (`toS`/`toA`, surah and ayah) as well as the axis number, so positions can be rebuilt after an axis change.
- Log every change to `pos` in a `posLog` field.

### 4. CONFIRMED DEFECT (rollback): restore is a merge, so an older backup moves position back while newer records remain (case 11 rollback)
`extras.js:wireBackup` uses `set` for each document in the file and deletes nothing.
Test (t_rb.js): back up at pos 45, record Al-Fil (→ 49.86), restore the older backup. Pos goes back to 45 and the Al-Fil record stays, so Al-Fil is assigned again. A record deleted after the backup (e4) comes back.
The writes run one by one with no rollback, so a partial failure leaves a mixed state.

**Fix:**
- Download a safety backup automatically before every restore.
- Offer two restore modes:
  - "Merge": keep `pos = max(file pos, max to of the student's records)`, where the axis matches.
  - "Exact rollback": also delete documents that are not in the file, after a second confirmation.
- Report per-collection counts afterwards, and check `v` (the backup format version) before restoring.

### 5. CONFIRMED (test passed): the backup round trip into a fresh store matches every collection (case 11)
t_bk.js:
1. Seed the mock store with every collection: 18 collections, 27 documents. This includes schools, hours, fees, access, absences, groupnotes, requests, waiting, links, an archived student and settings.
2. Download through the real `#jsonBtn`.
3. Restore through `#rsFile`/`#rsBtn` into a new `?fresh` store.

Result: all 18 collections match document for document. The only difference is `settings.main.lastBackup`, which is expected because it is written after the JSON is built. Restoring a second time gives the same result.

One side effect: the empty fresh store had already auto-created `schools/s1 "Allatif Mosque"` before the restore. It was overwritten only because the backup's school id was also `s1`. If the backup's school has another id, the restored store ends up with an extra school.

### 6. RISK NEEDS TEST: readiness is tied to one collection only
`loaded` is set by the `students` snapshot alone (`app_en.js:init`). The `events`, `marks`, `settings`, `meetings` and `classes` snapshots have no error handler and no ready flag. Consequences:
- **Backup:** `backupJson` packs whatever is in memory. A backup taken before `events` arrives, or after it fails, is silently incomplete.
- **Auto-absent:** `tarteel.js:autoAbsent` (every 60 s) with `events=[]` would mark every student absent. With `meetings` not loaded, it calls `set()` on the meeting document and wipes its started/ended/startBy fields.
- **Settings writes:** `settings/main` is written as `set({...settings.main, x})` at `smart.js:192` and `app_en.js:1093`, and `guide.js:78`. If settings has not loaded, this wipes fee, grading, points and lastBackup.
- **Class writes:** classes are saved as a whole document with `set({...rest,...})` at `app_en.js:1050`.

**Fix:**
- Add a ready flag per collection and an error callback.
- Disable backup, auto-absent and settings writes until every collection has reported.
- Use `update`/merge in place of read-modify-write `set`.
- Put document counts in the backup file.

### 7. RISK NEEDS TEST (needs two clients): duplicates and lost updates
- Pos is written as an absolute last-write-wins value from a possibly stale client (`update({pos:newPos})`). If the teacher and a substitute record the same student, two records share the same `from`.
- Attendance (`app_en.js:346`, `tarteel.js:313`) and `autoAbsent` look up an existing record and then `add()` with a random id. Two open devices can each add an absence (−2 points each).
- `goals.js` dedupes sessions by day, but the points, monthly and class reports do not, so the totals disagree.

**Fix:**
- Use deterministic ids: `events/ses_<sid>_<date>`, `abs_<sid>_<date>`.
- Before advancing, re-read the student (`get()`) and require `from === current pos`.

### 8. CONFIRMED (code): provenance and audit are weak
- `events.by` is free text from `#s_by`, defaulting to localStorage or the teacher name. The teacher activity counts in `school.js:184` and `schools.js:150` match on that text.
- No record stores the writer's uid (`ME_UID` is known but never written).
- `t` comes from the client clock and also decides which record counts as "latest" today.
- Replacing a record (`db.doc(...).set(d)`) overwrites the previous version. The old version exists only in the in-memory undo toast, so there is no edit history.
- `src` exists on marks only.

**Fix:**
- Stamp `uid`, `tid`, `at` and `app` (version) on every write.
- On replace or delete, append the previous version to an `audit` collection (interact-writable) or to `events/<id>.hist[]`.

This deters mistakes, but it cannot be enforced against a Contributor (see 9).

### 9. CONFIRMED (rules analysis): per-group permissions exist only in the UI (case 12)
What the database actually enforces:
- Viewers (supervisors) cannot write anything.
- Non-admins cannot read or write `fees`. A substitute cannot read fee payments.
- Non-admins cannot write classes, settings, teachers, breaks, schedule, waiting or schools.

Visible to everyone with view access:
- the fee setting `settings.main.fee`
- `schools.fees`
- teacher phone numbers and emails
- the waiting list (children's names, phones, ages)
- parent phone numbers

What `canEditCls`, `schoolGuard`, `SUB` and the 🔒 locks only hide: a Contributor running `await claude.use("db")` from devtools can:
- read every student, record and mark;
- change or delete any student or record in any group (pos, name, prevS);
- write `access` to give themselves `kind:"always"` substitute access to any group;
- write `links/<anyUid>` to unlink others or claim another teacher (`wireClaim` already allows claiming any unlinked teacher from the UI);
- forge `hours` for any teacher, which matters if hours drive pay;
- rewrite `meetings`.

`extras.js:detectRole` also fails open: `SUB=false` until `canEdit()` resolves, or forever if it throws, so the full admin UI shows. The database still blocks admin writes, but the errors are swallowed (`catch(_){}`). Example: a substitute's class log with a tajweed lesson saves the meeting, then fails on `classes/` and reports "not saved".

**Fix within this runtime:**
- Default `SUB=true` until `canEdit()` confirms otherwise.
- Make `hours` and `access` admin-write. Teachers would then record hours through `requests`, which the admin approves.
- Keep `links` interact-write, but have the app ignore a link whose uid does not match the teacher's email.
- For real per-group isolation, publish one artifact per group (its own database and share list) and bring them together through admin exports. Otherwise this needs a backend with per-document rules.

### 10. Parent portal (case 13): not achievable in this runtime as built
Rules are per collection and per role. Anyone shared at view access can list `students`, `events` and `marks` for every family. Changing ids makes no difference, because they can list the whole collection, and unguessable ids would not help either.

What is needed:
- (a) A family identity, i.e. sign-in.
- (b) Server-side read rules tied to that identity. For example `students/{sid}`: read if `auth.uid in guardians[sid]`; events and marks: read only where `sid` is one of the caller's students, with collection-wide listing denied.
- (c) Or a server function that returns one family's data after checking a signed, revocable token.

Options in this runtime:
- A separate per-family artifact holding a copied snapshot of that one student, with its own database and shared only with that family. The admin regenerates it, for example a weekly static report.
- Or keep using the WhatsApp/PDF output.

### 11. RECOMMENDATION: schools.js:schMigrate
- It is idempotent: tested, renaming survives, and it repeats safely.
- It works in passes that depend on load order. In t_mig2.js, classes were migrated about 3 s after teachers.
- If every school is deleted, it re-creates `s1 "Allatif Mosque"` (tested), including in a brand-new store.

**Fix:**
- Run it only when classes, teachers and waiting have all loaded.
- Create a school only if classes exist.
- Record `settings.main.migrations.schools=1` and never run it again after that.
- Don't hard-code an organisation name.

### 12. RECOMMENDATION: directions, boundaries and khatm (case 9)
- Both directions, wrapping from `startS`, scattered `prevS` (taken out of the axis), and ayah-snapped portions (`portionEnd` always moves forward) behave correctly.
- Zero-length and reversed ranges render as "—" and give `rowLines`=0 (tested).
- At the end of a khatm: pos is capped at TOTAL and the plan shows "No new hifz". The near review then stays fixed on the last 10 portions forever, and nothing starts a second cycle or a post-khatm review.
- `pos` greater than TOTAL is never clamped when read: pos=1e9 showed "11037528%" (t_ord.js).
- Near review uses `10 × current amount` (`dayPlan` / `stBack`), not the recorded history. A "More" day, a change of amount or a half-amount break pushes recently memorized material straight into the far review. `-4` (one rub') steps back by an average rub' length.
- Custom rows ahead of the position, or inside `prevS`, add to `hifzLines` without moving pos. This inflates pages and challenge totals and counts them again later.

**Fix:**
- Clamp pos when reading.
- Build the near review from the `from` of the last 10 hifz records, falling back to the formula.
- Count only new coverage in `hifzLines`.
- Add a post-khatm mode.

### 13. Operations
- Publishing a new version changes the code, not the database. Rolling back the artifact to before v43 would leave `schools`/`hours` out of its backups.
- The rules are set at publish time and are not kept in the source (build-cloud.py). Write them into the repository and check them on every publish.
- The backup is manual, and the file holds children's and parents' data unencrypted. Remind the teacher weekly (this exists), and store the file only in a private drive.
