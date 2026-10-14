# BCLearns admin rebuild: plan

Draft, 2026-10-14. Nothing here is built yet. The open questions at the end change parts of it.

## What the system is for

The whole admin side exists to move a family through one loop, with as little clicking as possible:

1. **A request comes in.** That's a website form, an email to hello@bclearns.com, a text, or word of mouth.
2. **Someone reaches out personally.** That's a private text from an admin's own phone, not an automated email.
3. **The family is matched with a tutor and given a rate.**
4. **Sessions go on the schedule.**
5. **Sessions are tracked.** Each one is held, cancelled or a no-show, and the hours roll up into what the family owes and what the tutor earns.
6. **Someone follows up.** That means checking in after the first session, renewing, re-engaging paused families.

On the side of that loop there are two more jobs:
- Reaching the whole team at once: one message to every tutor and admin.
- Keeping a clean list of every tutor and every client.

The guiding rules:
- **Nothing automatic goes to a client.** No "we received your request" email, no status-change emails, no reminder blasts to families. The system tells *admins* what to do next and makes doing it one tap. The message itself comes from a person.
- **Show, don't tell.** No explainer text and no big number tiles. Charts for trends, lists for work.
- **Act where you see it.** Every list row has its actions inline, and opening a client or tutor slides in a panel instead of loading a new page.

## Navigation (admin)

Six items, down from twelve:

| Item | What it is |
|---|---|
| **Dashboard** | All the work and all the data. Most days you never leave it. |
| **Schedule** | One big calendar for everyone, with filters. |
| **Clients** | The full list of families and students. |
| **Tutors** | The full list of tutors, plus applicants. |
| **Messages** | Team chat, and the announcement composer for messaging everyone. |
| **Settings** | Rates, admins, website editor, message templates. |

These pages are removed, and each one is folded into somewhere else:
- **Leads** becomes Clients plus the dashboard.
- **Claims** becomes a dashboard to-do item.
- **Requests** becomes a dashboard to-do item.
- **Assignments** moves into the client and tutor panels.
- **Reports** moves into the dashboard charts.
- **Email** moves into Messages.
- **Website** moves into Settings.

A **global search** (Ctrl/Cmd+K, plus a search box in the top bar) finds any client, student, tutor or phone number and opens its panel. A **"+ New"** button in the top bar is always there, with three choices: client, session, announcement.

## Dashboard

It's one scrolling page in three bands. No stat tiles.

### Band 1: To do (the action queue)

This is one combined list, sorted by urgency. Each row says what happened, who it's about and how long ago, and has its action buttons right on the row. A row disappears when you handle it. When the list is empty it shows a single "All caught up" line.

| Item | Shown when | Inline actions |
|---|---|---|
| New request | A form, quick-add or other request isn't contacted yet | **Text** · **Call** · **Email** (each opens your phone or mail app with a draft, and logs the contact) · **Mark contacted** · **Not a fit** |
| Tutor wants a student | A tutor claimed an open client | **Approve** (assigns them, asks you to confirm the rate) · **Decline** |
| Needs a tutor | The client was contacted but nobody is assigned | **Assign**, which opens a tutor picker showing who teaches that subject, how many students they have, and whether their availability matches |
| Needs a first session | A tutor is assigned but nothing is on the schedule | **Schedule** (create a session with the client and tutor already filled in) |
| Session not logged | The session time has passed and it's still "scheduled" | **Held** · **No-show** · **Cancelled** (one tap, with an optional note) |
| Follow-up due | A follow-up date you set has arrived | **Text** · **Call** · **Done** · **Snooze** (1 day, 1 week) |
| Tutor request | A tutor asked for time off, a reassignment, help, etc. | **Reply** · **Resolve** |
| Gone quiet | An active client has had no session in 14 days | **Text** · **Pause client** · **Dismiss** |

Some events prompt a follow-up, but the app never sends anything itself. For example, when a client's first session is logged as held, the app offers "Check in with the Smiths tomorrow?" with **Yes** or **No**. Saying yes just creates a follow-up row.

### Band 2: Open clients and this week

This band has two columns side by side.

- **Open clients.** Everyone who isn't active yet (new, contacted, or waiting on a tutor). Each row shows the name, grade, subjects, how long they've waited and the last contact, with **Assign** and **Text** right on the row. Clicking a row opens the client panel.
- **This week.** A compact agenda of the next 7 days, grouped by day. Each row is the time, the student and the tutor. Clicking a session opens it so you can log, move or cancel it. A link at the bottom goes to the full schedule.

### Band 3: Trends

These are small line and area charts in a 2×2 grid, with one range switch shared by all four: 3 months, 6 months, 12 months.
1. **New requests over time,** by week, split by where they came from.
2. **Active clients over time:** how many families had at least one session held in each week.
3. **Hours tutored per week:** the total, with a filter to look at one tutor.
4. **Money per month:** what families owe and what tutors are owed, as two lines.

Each chart has a title and a small "now" value in the corner. There are no separate big-number cards.

## Schedule

There's one calendar for everyone. The current version splits it into a row per tutor; that goes away.

- **Views:** Week (the default), Day and List. The List view is good on a phone.
- **Colors:** each session is colored by tutor, with a legend that doubles as the filter.
- **Filters:** a filter bar with tutor (multi-select), client, subject and status. A **"Needs logging"** quick filter shows past sessions that are still unmarked. Filters are saved in the URL, so you can bookmark "Shlok's week".
- **Creating a session:** click an empty slot, pick the client (search), and the tutor and subject fill in from their assignment. You can set it to repeat weekly for N weeks. The app warns about a clash but still lets you go ahead.
- **Moving a session:** drag it. A one-off move doesn't change the repeating series.
- **Editing a session:** click it to get a small popover with Held / No-show / Cancel, plus time, location or link, shared notes and private notes.
- **Tutors' view:** tutors see the same calendar, but locked to their own sessions.

## Clients list

This is a table, with search and filters at the top.
- **Columns:** Family, Student(s) and grade, Subjects, Tutor, Status, Rate, Last contact, Next follow-up, Hours this month.
- **Filters:** status (New, Contacted, Matched, Active, Paused, Ended, Not a fit), tutor, subject and source.
- **Bulk actions:** change status, export to CSV.

Clicking a row opens the **client panel**, a side panel with four tabs:
- **Overview**
  - Contact details with **Text / Call / Email** buttons.
  - The students: grade, school and subjects, all editable inline.
  - Their original request answers.
  - Status, and where the client came from.
- **Tutoring**
  - Which tutor teaches which student, with the client's rate and the tutor's pay rate, editable inline.
  - **Add tutor**, end or pause an assignment.
  - Upcoming and past sessions, with **Schedule session**.
- **Money**
  - Hours and amount owed per month.
  - **Mark paid**, recording the amount, method (Venmo, Zelle or cash) and date.
  - The running balance.
- **Notes and log**
  - Every contact made (texted, called, emailed), each with an optional one-line note.
  - Internal notes, which can be pinned.
  - The next follow-up date.

**Quick add** (from "+ New" or the dashboard) creates a client in about ten seconds. It needs only a name and a phone number or email; what they need, the grade and where they came from are optional. Quick add is how texts, calls and emails that never went through the website form get into the system.

## Tutors list

This is a table with these columns: Name, Subjects, Grades, Active students, Hours this month, Owed this month, Availability (as a mini week strip), and Status. There's an **Applicants** filter for people who applied through the website.

Clicking a row opens the **tutor panel**:
- **Profile**
  - Contact details, subjects, availability, and the most students they'll take.
  - Whether they appear on the website.
- **Students:** their current assignments.
- **Sessions**
  - Their upcoming sessions and their history.
  - A link to the schedule filtered to them.
- **Pay**
  - Hours and amount owed per month.
  - **Mark paid** to record a payout to them.
- **Notes.**

**Add tutor** creates the tutor directly and sends an invite, without needing an application.

## Messages

- **Team chat.** This stays as it is today: a #general channel, a thread per client, and direct messages.
- **Announcement.** Write the message once, then choose who gets it: all tutors, all admins, everyone, or selected tutors. It's posted in #general and also emailed. Texting it as well needs a texting service (see question 2). The email copy is still sent to everyone, even people who turned off email notifications.
- **Templates.** Saved message drafts with fill-ins like `{parent_first}`, `{student}`, `{tutor}`, `{day}` and `{time}`. The Text/Email buttons offer them, so you open your phone with the message already written and can personalise it before you send.

## How texting works without being impersonal

- **Text and Call buttons** open your phone's own messaging or call app: `sms:` and `tel:` links on a phone, and on a laptop through iMessage or Phone Link. The message comes from your own number.
- **Logging is automatic.** Each tap records "Texted by James, 4:12pm" on the client. If you change your mind, you can undo it.
- **Templates are only drafts.** You always edit and send them yourself.
- **Replies don't come back into the app.** Texts from families arrive on your own phone and the app can't read them. That's why there's quick add and a one-tap "log a reply" option. A shared business number that does feed replies back into the app is a possible later step (question 2).

## Rates and tracking

- **Client rates.** Each assignment has a client rate, which defaults from the rate tiers in Settings: K–8 $25, high school $30, test prep $35, specialized $60.
- **Tutor pay.** Each assignment also has a tutor pay rate, which defaults to a percentage or fixed amount set in Settings (question 3).
- **Hours.** Only sessions marked **Held** count. Hours times rate gives what the family owes and what the tutor is owed. No-shows can be billed or not, as a setting.
- **Payments.** These are recorded by hand. Families pay, tutors get paid out, and both sides show a running balance. There's no card processing.

## Statuses, simplified

There are seven client statuses instead of nine:

| Status | Meaning |
|---|---|
| **New** | Nobody has reached out yet. |
| **Contacted** | Someone has reached out, but there's no tutor yet. |
| **Matched** | A tutor is assigned, but no session has been held yet. |
| **Active** | At least one session has been held. |
| **Paused** | On hold. |
| **Ended** | Finished. |
| **Not a fit** | Not going ahead. |

Most of these change on their own, but only inside the app; nothing is ever sent to the family.
- Logging a contact moves New to Contacted.
- Assigning a tutor moves the client to Matched.
- The first held session moves them to Active.

The old statuses carry over like this:
- *open* and *claimed* become Contacted. A pending tutor claim stays a to-do item rather than a status.
- *assigned* and *onboarding* become Matched.
- *lost* becomes Not a fit.

## What changes underneath

These are the data changes behind the plan.
- **Client records (`Lead`)** get these new fields:
  - `nextFollowUp` (a date and a note).
  - `contactLog[]`: who made the contact, the channel, when, and a note.
  - `lastContactAt`.
- **Assignments** get a `tutorRate` field.
- **A new `Payment` record**, with:
  - who it's for: a client or a tutor,
  - which client or tutor,
  - the amount, the method and the date,
  - a note.
- **Settings** get:
  - message templates,
  - the default tutor pay,
  - whether no-shows are billable,
  - the "gone quiet" threshold (14 days by default).
- **Emails that will stop going to clients:**
  - `lead_confirmation` (the automatic "we received your request" email),
  - session reminders to families,
  - the invite to the family portal (if the portal goes; see question 4).

  The family portal itself may also go (question 4).
- **Emails that stay:**
  - New-request alerts to admins.
  - Alerts to tutors, which become optional (question 5).
  - Session reminders to tutors.
  - Password resets.
  - Announcements.
- **Database cleanup:**
  - Old statuses are converted to the new ones.
  - Existing assignments get their tutor pay rate filled in from the default.

## Use cases checked against the design

Each row is something you'll need to do, and where in the design it happens.

| You want to… | Where | How many clicks |
|---|---|---|
| See who to get back to today | Dashboard to-do list | 0 |
| Reply to a new form | To-do row, then **Text** (draft opens on your phone) | 1 |
| Add someone who texted you | **+ New**, then **Client**, enter name and phone, **Save** | about 3 |
| Match a client with a tutor | **Assign** on the row, pick a tutor (best fits listed first), confirm the rate | 2–3 |
| Approve a tutor's claim on a student | **Approve** on the row | 1 |
| Book a recurring weekly slot | **Schedule** on the row, or click a slot on the calendar, set repeat to 10 weeks | 3–4 |
| Log yesterday's sessions | To-do rows, then **Held** on each | 1 each |
| Reschedule one session | Drag it on the calendar | 1 |
| See what one tutor has this week | Schedule, filter to that tutor | 1 |
| Check in after a first session | Accept the suggested follow-up; it shows up on the day | 1 |
| Message all tutors | **+ New**, then **Announcement** | 2 |
| Answer a tutor asking for time off | **Reply** or **Resolve** on the to-do row | 1 |
| Change one family's rate | Client panel, **Tutoring** tab, edit the rate inline | 2 |
| See what a family owes | Client panel, **Money** tab | 1 |
| Record that a family paid | **Money**, then **Mark paid** | 2 |
| Pay out a tutor | Tutor panel, **Pay**, then **Mark paid** | 2 |
| Find a client from a phone number | Ctrl+K, type the digits | 1 |
| Pause a family over summer | **Pause** on the client, optionally with a follow-up date to restart | 2 |
| See whether the business is growing | Dashboard trend charts | 0 |
| Find families who've gone quiet | "Gone quiet" items on the to-do list | 0 |
| Take on a new tutor | Tutors, then **Add tutor**, or **Approve** an applicant | 2 |
| Edit the website | Settings, then Website | 2 |

## Speed

- **Panels instead of pages.** Client and tutor details slide in on the page you're on, so there's no page load.
- **Instant updates.** Changes show immediately and save in the background.
- **The dashboard loads in one request.** All its data is fetched together and stays cached until something changes.
- **Production build.** Run it with a real build (`npm run build && npm start`) to judge speed; dev mode on this machine is slow regardless.

## Build order

Each phase works on its own, and the app keeps running after every one.

1. **Groundwork.** The new statuses and the database cleanup. The data changes: contact log, follow-ups, tutor pay rate, `Payment` and template settings. Turn off the automatic emails to clients.
2. **Dashboard.** The to-do list with every inline action, the open-clients list, this week, and the four charts. Remove the old Leads, Claims, Requests, Assignments, Reports and Email pages, and set up the new navigation.
3. **Client and tutor panels, and both lists.** This includes quick add and global search.
4. **The single schedule.** The filters, slot creation, drag to move, logging popovers, and the tutors' locked-to-themselves view.
5. **Money.** Rates on assignments, owed and paid amounts, and payment records for both families and tutors.
6. **Messages.** The announcement composer and message templates on the Text and Email buttons.
7. **The tutor side** (depending on question 6). A matching simple dashboard for tutors: their to-do list, their schedule, open students to claim, and their earnings.

## Decisions (answered 2026-10-14)

1. **Money:** families pay tutors directly. BCLearns only pairs them, so there's no invoicing or payouts. Each assignment's rate is the tutor's full rate.
2. **The BCLearns fee:** BCLearns takes the first session's amount as a fee for each match. When a match's first session is logged as held, the fee becomes **due from the tutor**. It shows on the dashboard until you mark it paid. The Money tab is now just this: hours and fees.
3. **Texting:** Text buttons open your own phone for now. A shared BCLearns number comes later (probably BlueBubbles, with AI-assisted lead intake). For now, the contact log records the channel and leaves room for that integration.
4. **Family logins:** none for now. The family invite and every email to families are switched off. The portal code stays but nothing links to it.
5. **Claiming:** tutors claim students as requests come in, and the admin approves each claim. Tutors still get the new-request email, as a setting.
6. **Logging sessions:** tutors mark their own sessions. Unlogged sessions show on the tutor's dashboard, and on the admin to-do list only once they're more than two days overdue.
7. **Cancellations:** no charges and no policy. Everything is informal.
8. **Admins:** just one admin, so follow-ups aren't assigned to anyone.
