# A. Pedagogy, assessment and motivation review (code-checked)

Scope: app_en.js, quick.js, guide.js, tarteel.js, heart.js, smart.js, more.js, goals.js. I did not edit any source. Labels: **CD** = CONFIRMED DEFECT, **RT** = RISK NEEDS TEST, **RTR** = RECOMMENDATION NEEDS TRIAL, **MI** = MISSING INFO. The fixes below add fields or flags. None of them rewrites stored events.

## Critical (they distort the evidence the teacher acts on)

1. **CD: Mistakes entered with the counters never reach surah strength, so unheard or weak surahs can show as "Strong".** In quick.js every review and hifz row is built with `m:0`: `stopRows()` returns `{...,m:0}`, `qRaOk` and `qSmart` push rows with `m:0`, and a Repeat stores `hifzRows=pieces(...).map(p=>({...,m:0}))` (app_en.js save, line ~611). Counter totals go only into `revMist` and `hifzMist`. `heart.js:surahStrength` adds the pages from those rows but takes mistakes only from `r.m`, `e.errs` and mushaf marks. The result: a review with 6 mistakes counted on the counters credits every surah with clean pages. A **failed (Repeat) portion makes its surah look stronger.** Strength is correct only when the teacher taps words in the mushaf.
   *Fix:* store `revMk` and `hifzMk` per row when the session has a single row. When it has several, add `unattributed:true` to the event and have `surahStrength` show "mistakes not located" instead of a clean rate. Old events stay as they are. Mark the strength of pre-fix sessions "low confidence" by date.

2. **CD: Buddy results are merged into the teacher's session and lose their source (case 7 fails).** At quick.js:34, `buddyToday(st)` pre-fills review rows with the buddy's `m` and adds them to `q.rk.other`. On save, `revRows=rLive.map(({skip,added,buddy,...r})=>r)` strips `buddy` (app_en.js ~610). The buddy's mistakes then become teacher-graded `revMist`/`revGrade` and earn review points. `tarteel.js:lastSeenMap` also counts buddy events as "seen", which pushes a weak surah back in the smart suggestions.
   *Fix:* keep `src:"buddy"` and the helper on each row, and grade teacher rows and buddy rows separately. In `lastSeenMap`, store teacher-heard and any-source dates separately and base the smart suggestion on the teacher-heard date. The buddy event documents are already intact.

3. **CD: An unheard review can be stored as "Excellent" and earn points ("not recited" turns into "0 mistakes").** The hifz grade is guarded (`d.hifzGrade=any?…:""`), but the review grade is not: `d.revGrade=rv==="none"?"":s_rg.value`. `#s_rg` defaults to its first option, "Excellent", and `gradeFor` returns null when 0 lines are live, so the default stays. If every chip is tapped "not read" without choosing "Not ready", the record says Review Excellent and `ptsBreak` adds "Review, excellent +3". The juz test has the same problem: `t_m` defaults to `value="0"` and `t_res` auto-sets to pass, so an empty form gives "Passed", +20 points and a "Juz complete" badge.
   *Fix:* save `revGrade=""` and award no review points when live lines are 0. For a juz test, require an explicit mistakes entry (empty field, not 0) and a "whole juz recited" tick. When reading old records, treat `revGrade` with no `revRows` as ungraded.

4. **CD: The automatic absence ignores breaks and emergency days, and fires when no class was held.** In `tarteel.js:autoAbsent` the only skip is `m.status==="cancelled"`. When there is no meeting record, `nowMins()>=endM` is enough. `classesToday()` (smart.js:40) checks weekdays only, with no `breakFor` and no emergency event. If the teacher opens the app in the evening of a holiday that was not cancelled, every student is recorded absent: −2 each when noNeg is off, the streak resets (`streakOf`), and the month badge is lost.
   *Fix:* skip a class when `breakFor` applies or when there is no meeting with `started`. Also skip a student who has an emergency or excused event that day. Mark existing auto rows `auto:true` (already stored) so a one-tap "undo auto-absences for this date" is possible.

## High

5. **CD: There is no plan for resuming after an absence (case 8 fails), and emergency days do not change the plan.** `dayPlan` reads only `breakFor`, and `emergency` appears only in chips, history and guide text (app_en.js:227,431,569). The guide promises "far moves to the next day" and "after more than 3 days, the first day back is review only", but nothing does this. After a 3-week gap the next class assigns new hifz as usual. The far review is indexed by calendar day (`idx=dn%FD`), so missed slices simply vanish. That avoids a backlog pile-up but leaves untracked coverage holes.
   *Fix:* add a computed "return mode": if the last attended session is more than N days old, or more than 3 emergency days run in a row, the next plan shows "review only: near in full, plus a far slice capped at X pages". New hifz resumes after one graded near-review session. This needs no schema change.

6. **CD: Strength judgments come from tiny fragments and attach to the whole surah (case 3 fails).** `surahStrength` uses `rate=m/Math.max(0.5,pg)` per surah index. Two clean lines of al-Baqarah make all of al-Baqarah "Strong" in the heart and strength panel. `lastSeenMap` marks the whole surah seen after any fragment. `smartReview` skips surahs longer than 48 lines (`SURAH_B-SURAH_A>48`), so long surahs are never suggested.
   *Fix:* store strength per page or per ruku', not per surah. Require at least 1 page heard (or at least 50% of a short surah) before showing Strong or Good, and below that show "sample too small". Show the coverage share in the tooltip ("2 of 48 pages heard in 60 days").

7. **CD: The far review heard in class is systematically partial.** The in-class far slice is `idx=dn%FD` from `st.start`. A class that meets 2 fixed weekdays with FD=7 keeps hearing roughly the same 2 of 7 slices each week, so most of the far review is never teacher-heard. Nothing measures this (the coverage map was deferred).
   *Fix:* build a coverage view from teacher-sourced rows ("not heard by the teacher in 28 days"), and let the in-class far chip rotate by class meetings instead of calendar days.

8. **CD: Failed tests and the consolidation week do not change the plan.** A failed juz test should "stay in near another week" (guide text), but near is positional only (`nearStart=stBack(pos,amt,10)`). Monthly-test misses (`e.places[].ok`) are used only for points and display. The consolidation week is a banner only (app_en.js:372), and `dayPlan` still assigns new hifz.
   *Fix:* add a `hold` overlay: a failed juz joins near until a pass, ✗ places join the smart list, and an open consolidation block sets `isHifz=false`, with a teacher override.

9. **RT: "Part of it" conflates "teacher stopped (time)" with "could not continue", and "prompt" weighs the same as other mistakes.** `kindSum` counts `prompt` like `forgot`, and the grade is computed only on the recited fragment, so a student who stalls after 3 lines with 0 mistakes gets "Excellent". The ERR_KINDS data is kept, so the information exists, but nothing in the grade or the summary uses it.
   *Fix:* add a stop reason (time / teacher / could not continue). "Could not continue" shows next to the grade and counts toward the "make it lighter" suggestion. List prompts separately in the grade line ("2 prompts").

## Medium

10. **CD: The thresholds are inconsistent.** `gradeFor` floors at 0.5 page, while the "Reduce amount" chip (app_en.js:224) uses `Math.max(1,pages)` and only `lastHifz` with `hifzLines>0`. A session saved as Repeat has `hifzLines=0`, so the session that triggered the Repeat is invisible to that chip.
   *Fix:* use one helper, and read the lines from `hifzRows` when `hifzRepeat` is set.

11. **RT: A short sample still decides the grade.** Case 1 passes. 3 lines with 1 mistake gives 2/page, which is "Good", and Repeat is only a hint (`qRep.classList.toggle("hint")`), so the teacher decides. But 3 lines with 2 mistakes gives "Repeat", and 1 line with 2 mistakes gives 4/page.
   *Fix:* show a "short sample" tag when the sample is under half a page (already agreed in the assessment). When the grade is Repeat but the teacher advances, save `advancedDespite:true` so the record does not read as an unexplained Repeat. Today that case gets +1 point, while an explicit Repeat gets 0 because `hifzLines=0`: the points then depend on the teacher's button, not the performance.

12. **CD: The error book overcounts.** `errorBook` counts every mark, including `k:"hesitate"` (it has no filter, unlike `surahStrength`), and counts several marks from the same day. "Needs a rule" (`count>=2`) can therefore fire from one session or from self-corrections. `fixed` is a manual toggle with no date and no retest.
   *Fix:* count distinct dates and exclude hesitations. Store `fixedOn`, and schedule a check 7 days later that records "held after interval" separately from "corrected now".

13. **CD: noNeg is off by default and applies retroactively.** `noNegFor` reads the class's current flag at render time, so turning it on or off rewrites past totals, levels, boards and past stars of the month. It also leaves sleepiness at −2 for children by default.
    *Fix:* stamp `nn` on each event at save. For old events, apply the flag only from a stored `noNegFrom` date. Default it on for new children's classes.

14. **CD: The same incident is penalised several times.** One "did not recite" gives `hifzNR` −2, often `hwNot` −2 as well, resets the streak, and lowers the star score. An absence gives −2, loses the +2 on-time points, and loses the +2 per day in the star score (`score=pts+days*2`, smart.js:148), which counts attendance twice. "Did not recite" is labelled "Hifz not ready" even when the teacher ran out of time.
    *Fix:* add a reason to "did not recite" (not prepared / no time / unwell), and apply the minus only to "not prepared". Apply one penalty per incident.

15. **CD: Rankings and the star favour new hifz and attendance volume.** Hifz points are +5 vs +3 for review. The challenge and "Who helped most" count only `hifzLines` (goals.js:60). The star tie-break is pages memorised, and the star is picked automatically and shown in a banner on the Today page. Points are absolute, so students with fewer hifz days, smaller amounts, a consolidation week, or a later start rank lower. The weekly points ranking is shown on the projector screen (more.js:renderScreen).
    *Fix (RTR):* make the star a teacher pick from a shortlist, let review pages count toward the challenge, use per-session rates, and offer an option to hide individual ranks on the screen.

16. **RTR: Adults get the same badges, levels and boards as children.** There is no per-class switch other than noNeg.
    *Fix:* add per-class toggles for levels, the board and the star. For adults, default to progress and consistency summaries.

17. **RT: The daily load is not shown, and the defaults are adult-sized.** `clsRead` defaults to 20 pages for every class, including children. Nothing estimates daily minutes, and FD=3 for a 20-juz student gives about 130 pages a day of far review with no warning. The near review is 10 × the *current* amount (`stBack(pos,amt,10)`), not the last 10 actual hifz days, so lowering the amount shrinks near abruptly.
    *Fix:* show estimated minutes using the plan's own assumptions (1 min per page reviewed, 30 min per juz read), warn above a per-class cap, and compute near from the actual dates of recent hifz sessions.

18. **RT: Changing a student's prior hifz, start surah or direction rebuilds the axis (`buildOrder`).** The historical `from`/`to` values are axis offsets that `lastSeenMap`, `posAt` and `surahFrac` then reinterpret.
    *Fix:* save the global start and end lines (or surah:ayah) on each event from now on, and keep the axis key on each event.

19. **Case 9: passes in part.** `portionEnd` stops at `TOTAL` (no wrap), and `neu` becomes "No new hifz". But after the khatm the near review stays the final 10 portions forever, and there is no 6-month consolidation track and no sard ladder. **RTR:** add a "post-khatm" phase flag that drives the plan.

## Missing info
- **MI:** Home practice is not logged at all; the plan uses a printed weekly sheet. Any future home log needs `src:"home"`, and it must never feed grades.
- **MI:** Whether breaks in "pause" mode still hold class; this affects finding 4.
- **MI:** Real session timing and how often the teacher taps the mushaf versus the counters. This decides how much finding 1 matters in practice.

## Acceptance cases
| # | Result | Evidence |
|---|---|---|
| 1 | Pass (with caveat 11) | `gradeFor` floor 0.5; Repeat is a hint only |
| 3 | Fail | finding 6 |
| 7 | Fail | finding 2 |
| 8 | Fail | finding 5 |
| 9 | Partial | finding 19 |

## Needs a qualified Quran teacher (software cannot decide)
- What counts as one mistake: tajweed versus a memorisation slip, a prompt versus a repeated prompt, a mutashabih mix-up. Also how to weigh a prompt compared with a forgotten word.
- The per-page thresholds for children reciting 2 to 5 lines, and whether a fixed rule fits tiny samples at all.
- Whether a buddy or a parent can ever confirm a portion, and for which children.
- The return-after-absence protocol (length of review-only, far cap) and the actual times for children.
- Whether minus points, public boards and an automatic star fit the intention (niyyah) and manners (adab) the teacher wants for children; and whether adults want any gamification.
- The pass criteria for the juz gate and the "imam-level" bar, and how strict to be on previously memorised portions.
