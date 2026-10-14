# BCLearns platform: what's next

Written 2026-10-14. These steps are ordered by what unblocks real use first. Pick, reorder or cross out.

## Where it stands

Everything below runs on your own computer, with a local database that has the real team in it plus some made-up demo families.

- **Website:** the homepage and the one-question-at-a-time booking form.
- **Admin dashboard:**
  - Overview charts.
  - A work box with a labelled tab for each kind of task: new leads, tutor claims, needs a tutor, to schedule, sessions to log, follow-ups, tutor requests, fees.
  - A "Message everyone" card and this week's sessions.
- **Clients and Tutors:** full lists, slide-in detail panels, and full delete and edit control. Settings has a one-click "Delete demo data".
- **Schedule:** one shared calendar with filters.
- **Tutor side:** tutors claim new students, log their own sessions, and see their schedule.

## 1. Go live (needed before anyone else uses it)

1. **Hosted database.** Create a MongoDB Atlas cluster (the free tier is fine to start) and copy the real team over.
2. **Hosting.** Deploy with the existing `render.yaml` and point `bclearns.com` at it. Render's free plan sleeps when idle, so the first visit after a quiet spell is slow. The paid plan ($7 a month) stays awake.
3. **Email.** Verify bclearns.com in Resend so new-lead alerts, tutor invites and team messages send from hello@bclearns.com.
4. **Tutor accounts.** Put each tutor's real email on their account (Tutors, then their panel, then Profile), then send the invites.
5. **Clean slate.** Settings, then Data, then "Delete demo data".
6. **Your account page.** Change your password and update your email from inside the app. Right now that only works through the "forgot password" email.

## 2. Bring in what you already have

7. **CSV import.** Upload current families and past sessions from the Google Form responses or a spreadsheet, so history isn't lost.
8. **A trash instead of instant deletes.** Deleted clients and tutors would go to a 30-day trash you can restore from. That keeps full control without the risk of a slip.

## 3. One shared BCLearns number (BlueBubbles)

9. **The shared number.** An iMessage number for BCLearns, run through BlueBubbles on a Mac that stays on.
   - **Texts come in:** an incoming text attaches to the matching client by phone number, or creates a new lead.
   - **Replies go out from the app:** the whole conversation shows in the client panel, and your contact log fills in by itself.
   - **Starting a conversation:** the Text button sends from the shared number instead of your personal phone.
10. **AI help with leads.** When someone texts for the first time, the app:
    - reads the message and pulls out the student, grade and subject,
    - drafts a personal reply for you to approve,
    - suggests the best-fit tutor, who can then reach out.

    Nothing sends without a person approving it.
11. **Shared inbox.** Emails to hello@bclearns.com are forwarded into the app the same way: a new lead, or a note on an existing client.

## 4. Smoother matching and scheduling

12. **Availability matching.** Ask families when they're free in the booking form, then match it against tutor availability when you assign. The best fits show first, already filtered to times that work.
13. **Calendar sync.** Each tutor gets a private calendar link for Google or Apple Calendar, so their sessions show up on their phone.
14. **Reminders that stay personal.** Instead of automatic emails to families, the dashboard nudges *you* or the tutor the day before a first session.
15. **Fee tracking.** A tutor sees what they owe on their home page, with Venmo or Zelle details, and marks it sent. You confirm.

## 5. Later

16. **Family logins:** session notes, upcoming times and progress, only when you want them.
17. **Install as an app:** add BCLearns to the home screen on phones, with push notifications for new leads and claims.
18. **Reports you can send:** monthly hours and fees for each tutor, as a PDF or CSV.
19. **Website polish:** testimonials, SEO, and simple visitor analytics.

## Decisions I need from you

- **The BlueBubbles Mac:** is there a Mac that can stay on, or should we look at a hosted option? This decides whether step 3 can start.
- **Hosting:** the free plan (with the slow first load) or the paid one?
- **Existing data:** do you have a spreadsheet or form export of current families to import (step 7)?
- **Order:** which of sections 2 to 4 matters most after going live?
