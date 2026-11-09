# Suggestions by email (one-time setup)

Teachers send suggestions and problems with **💬 Suggest** at the top of the app. They always arrive in the app, in
**Settings → Suggestions and problems** (admins and owners only). This page is only for the optional email copy.

## How it works

When an admin types an address under *Also send each message by email* (Settings → Suggestions and problems), every new
message is saved with that address and an email text. Firebase's official **Trigger Email from Firestore** extension
watches the `feedback` collection and sends those emails through a mail account you choose, then writes the result back
(the app shows *Emailed* or *Email not sent* under each message). The app page itself contacts no other site; the email
leaves from Firebase's servers.

The security rules only allow the email to go to the address saved in Settings, so the feature cannot be used to email
anyone else.

## What you need

- The Firebase project on the **Blaze (pay as you go)** plan. Extensions need it. A few emails a week stay inside the free
  allowance, and the $10 budget alert stays in place. If Firebase asks you to upgrade, check with Edin first.
- A mail account to send from. Simplest: a Gmail account for the school (for example a new `yourschool.app@gmail.com`).
  It needs **2-Step Verification** turned on and an **App password**: Google Account → Security → 2-Step Verification →
  App passwords → create one named "Hifz Tracker" and copy the 16 letters.

## Install the extension (about 10 minutes, once)

1. Open https://console.firebase.google.com, choose **hifz-tracker-cd6d0**.
2. Left menu: **Build → Extensions** (or **Extensions**), then **Explore Extensions Hub**, search **Trigger Email from
   Firestore** (by Firebase), **Install**.
3. Go through the steps (billing check, APIs, permissions: accept the defaults). On **Configure extension**:
   - *Cloud Functions location*: **Sydney (australia-southeast1)** (where the database is).
   - *Firestore Instance ID*: `(default)`. *Firestore Instance Location*: `australia-southeast1`.
   - *Authentication Type*: **Username & Password**.
   - *SMTP connection URI*: `smtps://yourschool.app@gmail.com@smtp.gmail.com:465` (your sending address in the middle).
   - *SMTP password*: the 16-letter App password.
   - *Email documents collection*: **feedback**
   - *Default FROM address*: the same Gmail address, for example `Hifz Tracker <yourschool.app@gmail.com>`.
   - Leave the other fields as they are.
4. **Install extension** and wait until it says it is installed (a few minutes).
5. In the app: Settings → Suggestions and problems → *Also send each message by email* → type the address where you want
   to receive them → **Save**. Then send a test with 💬 Suggest; it should show *Emailed* within a minute.

Before the extension is installed, messages show *Email waiting* and still arrive in the app. To stop emails, empty the
address and Save. If a message shows *Email not sent*, the App password or the SMTP address is usually wrong:
Extensions → Trigger Email → **Reconfigure extension**.
