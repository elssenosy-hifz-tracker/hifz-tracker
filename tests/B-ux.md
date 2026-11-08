# Review B: UX, Arabic/accessibility and frontend (record-session flow)

Method: I read the source in /mnt/project-files/website and drove an instrumented copy of test2.html (`review/B/t.html`, where the mock `add`/`set`/`update` calls can be made to fail or slow down) with Playwright at 390x844. Scripts and screenshots are in `scratchpad/review/B/`. No user research was done; usability claims come from the code and from tap counts.

## What works (verified)
- **Tap count is low.** Recording one student with no mistakes takes 2 taps: "Record next" and "Save". Attendance defaults to On time and "Recited all" is preselected. Each mistake adds 1 tap, or 1 tap plus open and Done in the mushaf. "Next student" adds 1 more.
- **"Saved" waits for the write.** The save handler (`app_en.js renderSession f.onsubmit`) waits for the database writes to finish before it shows the toast or the Saved page. When the event write fails, all input is kept and a retry saves a single record (flow4 A).
- **Undo restores the record.** Undo on a save removes the event and puts the position back. Editing a same-day record shows a clear banner ("Already recorded today… update… Add a second record instead").
- **Case 2 mostly holds.** A student marked "Arrived" but not heard stays present after the class ends (`tarteel.js autoAbsent` skips anyone who has a record). He gets only +2 for On time and is not counted as "not ready" (flow8).

## Findings, ranked

**1. CONFIRMED DEFECT: A double tap on Save creates two records (case 10).** The Save button is never disabled, there is no in-flight guard, and every save calls `events.add()` with a new id. With 1.5 s of latency, two taps produced two identical events. Points and the streak chip both counted twice (flow4 C). The only feedback during the save is "Saving…" in small grey text.
*Fix:* at the start of submit, return early if a save is running, then disable the button and show a spinner. Create a client id once per form (`sid_date_rand`) and write with `db.doc('events/'+id).set()`, so a retry overwrites instead of adding.

**2. CONFIRMED DEFECT: A partial failure misreports and then duplicates (case 10).** The save makes two writes: `events.add` and then `students.update({pos})`.
- If the second write fails after a field was edited, the page says "Not saved…" even though the event exists. Retrying adds a second event (flow5: 2 events, streak 2→3).
- If nothing was edited (`busy=false`), the first write's snapshot re-renders the page mid-save. No error is shown, the form reloads in "Already recorded" mode, and the position stays at 40 while the record says the student recited to 76. Next class would plan the same portion again.

*Fix:* set `busy=true` when submit starts. After `add` succeeds, keep `nid` and switch to replace mode, so a retry only re-runs the step that failed. Better still, move position into the same write (a batch, or work out `pos` from the events).

**3. CONFIRMED DEFECT: A second recitation counts the first one's mushaf mistakes again (case 6 + 4).** `quick.js quickSession` line 162 (`if(!dup&&SM.size)…`) adds all of today's session marks to the counters. After "Add a second record instead", the second record was saved with `hifzMist:2` and the teacher had made no taps (flow3).
*Fix:* tag each mark with the session it belongs to (a form id), or count only marks newer than the previous record's `t`.

**4. CONFIRMED DEFECT: The counter and the mushaf get out of sync, and Undo brings removed mistakes back (case 4).** Tapping words saves marks right away (`tarteel.js openQMus`). Pressing "−" on the counter lowers the number but leaves the mark in the database and red in the mushaf. Undo deletes the event but keeps the marks. When the student was recorded again, the count came back as 2 instead of the 1 the teacher had set (flow3).
*Fix:* make the counter show "n from mushaf". Pressing "−" when the count would drop below the mushaf marks should remove the last mark, or explain why it can't. Undo should delete or untag the marks made in that session.

**5. CONFIRMED DEFECT: The app warns about its own default plan.** For Yusuf (5 lines a day, 7 days a week), the preselected "Recited all" covers 2.4 pages, which is 7 days' worth. That happens because `renderSession` sets `wk=st.days.length` and then `defEnd=ends[min(wk)-1]`. `smart.js oddChecks` compares against `ends[0]`, so every untouched save shows "Check before saving: about 7 times usual" and needs an extra "Save anyway" tap. That adds a tap for every student and teaches the teacher to ignore the warning.
*Fix:* confirm which portion was intended (probably `7/days.length` days, or 1). Then use the same base for the default and for the check.

**6. RISK NEEDS TEST: A present student whose turn never came has no neutral state (case 2).**
- The Today page keeps saying "0 of 1 recorded · Record next › Yusuf" after the class ends.
- History shows only "On time", with nothing to say he wasn't heard.
- On the session page, the only way to record "not heard" is "Did not recite", which counts as not ready and gives −2. `doneToday` (quick.js) treats a record with attendance only as not done.
- If the teacher skipped "Arrived", auto-absent marks the student absent with −2.

*Fix:* add a neutral "Not heard today (no turn)" option on the Today row and in the session form. It should count as recorded, carry no points or "not ready" flag, and show in reports as "present, not assessed".

**7. RISK NEEDS TEST: Review defaults to "recited".** All review chips start as ✓. An untouched save records "Review 8 of 8 · Excellent" and +3, even if review never happened.
*Fix:* start review as "not heard yet" until the teacher touches it, or give it one tap to confirm "Review heard ✓". At minimum, highlight "review assumed" in the save bar.

**8. CONFIRMED DEFECT: Several writes fail silently.**
- `arrive()` (`tarteel.js`) catches the error and does nothing. In flow4 E the "✓ Arrived" button stayed greyed out with no message.
- The attendance switch (`[data-attsw]`), `setAttendance` (`app_en.js`) and mushaf marks (`.catch(()=>null)`) also swallow errors. In flow4 F the header said "Mistakes here: 1" while 0 marks were saved.

*Fix:* show one shared error toast with Retry, and re-enable or roll back the control.

**9. CONFIRMED DEFECT: Undo leaves a misleading screen.**
- After Undo, the Saved page still says "Yusuf saved… Everyone… is recorded" (flow3).
- The toast only says "Saved", without the student's name, and there is only one toast slot. Moving to the next student or marking an arrival replaces it, so the earlier save can no longer be undone.
- The arrival toast covered the "Open in mushaf" button for 10 s (session_top.png).

*Fix:* after Undo, go back to the restored form. Put the name in the label ("Yusuf saved"). Place the toast above the save bar, away from the controls.

**10. CONFIRMED DEFECT: The Arabic interface mixes languages and its text direction breaks (smart.js `arText`/`AR_SUB`).** Word-by-word substitution produces mixed sentences such as "Everyone في فصل الأطفال is سُجِّل for اليوم", "Give substitute access إلى" and "Signed في as Bilal" (screenshots `ar_today_teacher.png`, `ar_saved.png`).
- The most important error, "Not saved. Check your connection and try again.", stays in English. The odd-input warning is half English.
- Session-page help, the behaviour labels and the mushaf hint are untranslated.
- `<html>` keeps `lang="en"` and no `dir`. Only `#app` is set to RTL, so the toast and the mushaf header, which sit at body level, read left-to-right.

*Fix:* only replace whole strings, and if the result would still contain Latin words, keep the English rather than mixing. Add dictionary entries for every error, warning and banner. Set `dir`/`lang` on `<html>`.

**11. CONFIRMED DEFECT: Many touch targets are under 40 px (390 px viewport).**

| Control | Size (px) |
|---|---|
| Mistake counters −/+, the most-used control during recitation | 32×32 |
| ✓ Arrived | 85×27 |
| Record / Edit | 46×29 |
| ✕ Absent switch | 77×23 |
| Start now | 96×29 |
| "No new hifz today" (a consequential link) | 332×27 |
| Near/Far tabs | 29 high |
| ＋ Add surah | 99×29 |
| Mushaf mistake-type buttons | 29 high |
| Mushaf ✕ Done | 49×29 |
| Mushaf words | 27 high, as narrow as 9 |
| Ayah-number targets for changing the range | 11×27 |

*Fix:* make every control at least 44×44. Use a larger mushaf font or pinch-zoom. Make the whole ayah row the target for range selection.

**12. CONFIRMED DEFECT: Some text fails contrast, and errors don't look like errors.**
- In dark mode, "✓ Arrived" is white on #5cc2ae at 2.15:1, and "Self-corrected" is 2.8:1. In light mode the review chips are 4.36:1.
- `#s_msg` (errors and "Saving…") is small grey text with no error colour and no `aria-live`.
- The counter buttons have no `aria-label`.

*Fix:* raise the colour tokens. Show errors as a red banner with `role="alert"`.

**13. RECOMMENDATION: Make the substitute teacher's view clearer.** The teacher role sees a clear banner and 🔒 view-only labels on other groups, and the supervisor sees no Save button. However, the Today page shows the teacher admin-style panels ("Who can edit this group", "Give substitute access", "Teacher absences") above the class challenge, and in Arabic the banner text is garbled. A real time-limited substitute grant (teacher t3) was not tested: RISK NEEDS TEST.
*Fix:* collapse admin panels for non-admins, and put "Notes for the substitute" and the grading guide next to "Record next".

## Acceptance cases at a glance

| Case | Result |
|---|---|
| 2 | Partial pass (finding 6) |
| 4 | Fails: counter/mushaf sync and Undo leftovers (findings 3, 4) |
| 6 | Edit banner is clear, but a second record double-counts (finding 3) |
| 10 | Fails: duplicates from a double tap or a partial failure, plus silent failures (findings 1, 2, 8) |
