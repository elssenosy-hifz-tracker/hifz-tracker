# Recovery: when the live site or its data goes wrong

Read the whole section that matches before acting. Steps marked **owner** need a Google account that is Owner of Firebase
project `hifz-tracker-cd6d0` (the school owner and Edin both are). Agents: say which steps you can do and which a person must do.

## The site is broken after a change went live

Two parts can change in a deploy, and they recover separately: the **site** (app code) and the **security rules**.

1. Fastest fix for the site (**owner**, about one minute, no code): Firebase console → Hosting → site `hifz-tracker-cd6d0` →
   *Release history* → the release before the bad one → ⋮ → *Rollback*. This restores the previous app code only; rules and data
   stay as they are.
2. Proper fix (agent): open a pull request that reverts the bad merge (`git revert <merge-sha>`), ship it like any change. This
   restores both app code and rules, and keeps `main` matching what is live. Do this even after a console rollback; otherwise
   the next merge brings the bad change back.
3. Rules locked people out or opened too much: a rules change goes live with the deploy, and step 1 does not undo it. Ship the
   revert from step 2 urgently, and tell Edin.

## Data was changed or deleted by mistake

Pick the smallest tool that fixes it.

1. **A few records**: fix them in the app by hand.
2. **The app's own backup file** (`.json`): Settings → *Grading, points, holidays, backup* → *Restore from a backup file*.
   It first downloads a safety copy of the current data, then writes every record in the file back (records with the same id
   are overwritten; records not in the file are left alone). Backup files come from *Download full backup* on the same screen,
   and from the safety copy made before any restore. Download a full backup before any risky data change.
3. **Daily database backups** (**owner**, kept 7 days, taken automatically): these restore into a **new, separate database**;
   they cannot overwrite the live one. So recovery is: restore, then copy the needed records back.
   ```bash
   firebase firestore:backups:list --project hifz-tracker-cd6d0
   firebase firestore:databases:restore --project hifz-tracker-cd6d0 \
     --backup projects/hifz-tracker-cd6d0/locations/australia-southeast1/backups/<BACKUP_ID> --database restored-<YYYYMMDD>
   ```
   Then copy records from `restored-<YYYYMMDD>` into `(default)` with a small Firebase Admin SDK script, run by an owner
   (Edin), copying only what was damaged. Delete the restored database afterwards
   (`firebase firestore:databases:delete restored-<YYYYMMDD> --project hifz-tracker-cd6d0`); it is billed while it exists.
   Plan this with Edin before running anything against `(default)`.

## A deploy failed

The live site keeps the previous version; nothing is half-deployed from the user's point of view. Read the failed job's log
(GitHub → Actions → the run), fix on a branch, ship again. If the failure is about credentials (`GCP_SA_DEPLOY`,
`GCP_SA_PREVIEW`, permission denied), tell Edin: only the repo owner can change secrets.
