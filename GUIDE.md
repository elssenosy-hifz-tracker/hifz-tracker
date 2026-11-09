# Changing Hifz Tracker with Claude

This is for the school owner. You do not need to know programming: you tell Claude what you want, check it on a
preview link, and say yes. Claude does the rest, and the live app updates by itself a few minutes after you approve.

Live app: https://hifz-tracker-cd6d0.web.app

## One-time setup (on your laptop)

1. **GitHub invitation**: open https://github.com/orgs/elssenosy-hifz-tracker/invitation while signed in as `elssenosy-create`
   and accept.
2. **Get the project onto the laptop.** Open Claude Code in a folder where you keep projects (for example `Documents`) and say:
   *"Clone github.com/elssenosy-hifz-tracker/hifz-tracker, open it, and get it set up following its AGENTS.md."*
3. **Let Claude install what is missing.** It checks the laptop and may ask to install a few free tools (Git, Node.js,
   Python, the GitHub tool, Java). Say yes. After installing, it may ask you to **close and reopen** the terminal and Claude;
   then start Claude again in the `hifz-tracker` folder.
4. **Sign in to GitHub once.** Claude runs `gh auth login`: pick GitHub.com, then *Login with a web browser*, copy the
   8-character code it shows, paste it into the browser page, and approve.
5. **Try a tiny first change**, for example *"change the sign-in page text to say Welcome"*, so you have seen the whole
   journey once. Edin can look along.

Each time after that: open Claude Code in the `hifz-tracker` folder and say what you want. Claude fetches the latest
version first.

## Making a change

1. **Ask.** Describe what teachers should be able to do, as you would to a person: *"When I record a session I want a box for
   the parent's comment, and it should show in the weekly parent message."*
2. **Claude builds it**, tests it, and opens a *pull request* (a proposed change). After a few minutes it gives you a
   **preview link**.
3. **Try the preview.** It is the app with made-up students, running only in your browser: you can click, record and delete
   anything, and the real school is never touched. Use **View as** at the top to see it as a teacher or supervisor.
   *Reset sample data* starts it fresh.
4. **Say yes, or ask for changes.** *"Looks good, put it live"*, or *"make the box bigger"*. Every new version gets a new
   preview to check.
5. **Live.** After you say yes, Claude merges it and the live app updates a few minutes later. Claude tells you when it is done.
   Teachers may need to refresh the page to see it.

## Good to know

- Nothing goes live without your yes, and nothing goes live if the automatic tests fail.
- Changes to **who can sign in or what each role may see** are sensitive (children's records). Claude will flag them; ask Edin
  to look before you approve those.
- **Something looks wrong on the live app?** Tell Claude *"the live site is broken after the last change, follow the recovery
  guide"*. You (as Firebase owner) can also undo the last release yourself in one minute: Firebase console → Hosting →
  *Release history* → previous release → *Rollback*.
- **Before big changes to data** (bulk edits, importing), download a backup: in the app, Settings → *Grading, points,
  holidays, backup* → *Download full backup*. The database is also backed up automatically every day (kept 7 days).
- Costs: a budget alert emails you if the Firebase bill passes $10 in a month.
