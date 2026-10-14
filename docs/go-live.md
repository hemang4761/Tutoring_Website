# Putting BCLearns live on bclearns.com

Total time: about 45 minutes. The steps marked **(you)** need your own logins. Claude can do the rest once those are done.

bclearns.com already points at Render: the old static site is hosted there. That means **no DNS changes are needed for the website.** The domain just moves from the old site to the new app inside the same Render account.

## What it costs

| Service | Plan | Cost |
|---|---|---|
| Render web app | Starter (always on) | $7 a month |
| Render reminder job | Starter cron | about $1 a month |
| MongoDB Atlas | M0 | Free |
| Resend email | Free tier (3,000 emails a month) | Free |

To spend nothing, change `plan: starter` to `plan: free` in `render.yaml` and delete the cron block. The catch is that the site sleeps after 15 quiet minutes, so the next visitor waits about 30 seconds.

## 1. Database: MongoDB Atlas (you)

1. Go to <https://cloud.mongodb.com> and sign up. Using hello@bclearns.com keeps it shared.
2. Create a project called **BCLearns**, then **Create cluster**: **M0 Free**, AWS, region **N. Virginia (us-east-1)**. That's the same region as the Render app, which keeps it fast.
3. **Database Access** → **Add new database user**:
   - Username `bclearns-app`.
   - Click **Autogenerate secure password** and copy it.
   - Role: **Read and write to any database**.
4. **Network Access** → **Add IP address** → **Allow access from anywhere** (`0.0.0.0/0`). Render doesn't have a fixed address, so this is needed. The password is what protects the database.
5. **Clusters** → **Connect** → **Drivers**, then copy the connection string. Change it in two places:
   - Swap `<db_password>` for the password from step 3.
   - Add `bclearns` before the `?`.

   It should end up looking like this:

   ```
   mongodb+srv://bclearns-app:PASSWORD@cluster0.xxxxx.mongodb.net/bclearns?retryWrites=true&w=majority
   ```

## 2. Email: Resend (you)

1. Go to <https://resend.com> and sign up.
2. **Domains** → **Add domain** → `bclearns.com`. Resend shows 3–4 DNS records (TXT and MX, all on a `send.` subdomain). Add them wherever bclearns.com's DNS is managed, then click **Verify**.
   - These sit on a subdomain, so they **don't affect** the hello@bclearns.com inbox.
3. **API Keys** → **Create API key**:
   - Name: `bclearns-prod`.
   - Permission: **Sending access**.
   - Copy the key (it starts with `re_`).

You can skip email for now and go live without it. Alerts and invites are then logged but not sent, and you can add the key later.

## 3. Create the real accounts in the new database

Create a file called `.env.production.local` in the project folder. It's already ignored by git, so it never gets uploaded. Put this in it:

```
MONGODB_URI=the Atlas connection string from step 1
SEED_ADMIN_EMAIL=hello@bclearns.com
SEED_ADMIN_NAME=James Doherty
```

Then run:

```bash
npm run seed:prod
```

This creates:
- your admin account,
- the six real tutors,
- the default settings and team chat.

It adds **no demo data**. The new logins are added to `LOGINS.local.md`.

## 4. Upload the code (Claude, once you say so)

Render builds from GitHub (`hemang4761/Tutoring_Website`), so these changes need to be committed and pushed to `main` first. Tell Claude to "commit and push", or push from GitHub Desktop yourself.

## 5. The app: Render (you)

1. Sign in to <https://dashboard.render.com> with the account that already hosts bclearns.com.
2. Make sure Render can see the repo: **Account settings** → **GitHub** → give it access to `hemang4761/Tutoring_Website`. If it isn't your repo, Hemang needs to add you as a collaborator first.
3. **New** → **Blueprint** → pick the repo. Render reads `render.yaml` and asks for the secret values:

   | Setting | Value |
   |---|---|
   | `MONGODB_URI` | The Atlas string from step 1 |
   | `RESEND_API_KEY` | The `re_` key from step 2, or leave it blank |
   | `CLOUDINARY_URL` | Leave blank |

4. Click **Apply** and wait for the build (5–10 minutes).
5. Open the `bclearns.onrender.com` link Render shows you.
   - `/api/health` should say `{"ok":true}`.
   - Log in at `/login` with your account from `LOGINS.local.md`.

## 6. Move bclearns.com over (you, about 2 minutes)

1. In Render, open the **old** bclearns site → **Settings** → **Custom Domains** → delete `bclearns.com` and `www.bclearns.com`.
2. Open the **new** `bclearns` web service → **Settings** → **Custom Domains** → add `bclearns.com` and `www.bclearns.com`.
3. Render verifies them and issues HTTPS on its own. Because DNS already points at Render, this usually takes a few minutes.
4. Once bclearns.com shows the new site, you can suspend or delete the old static site.

## 7. After it's live

1. Sign in, go to **Settings → Your account**, and change your password.
2. **Tutors**: open each tutor's panel and put their **real email** in Profile, then click **Resend invite**. They'll set their own password.
3. Fill in the booking form on bclearns.com yourself, and check it shows up under **New leads** on the dashboard.
4. In **Settings**, check the rate tiers and your text templates.
