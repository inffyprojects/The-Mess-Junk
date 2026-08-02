# Setup — Neon database + admin panel

Follow these once, in order. Everything after step 6 is automatic.

You need: a [Neon](https://neon.tech) account (free) and the Vercel project you
already have.

---

## 1. Create the database

1. Sign in to [neon.tech](https://neon.tech) and create a project — name it
   `the-mess-junk`, any region close to India (`ap-southeast-1` is the nearest).
2. On the project dashboard, copy the **pooled** connection string. It is the
   one with `-pooler` in the hostname and looks like:

   ```
   postgresql://neondb_owner:PASSWORD@ep-something-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

   Use the pooled one. The direct connection is fine for one-off scripts but
   runs out of connections under serverless traffic.

---

## 2. Create the tables

In the Neon dashboard, open **SQL Editor**, paste the entire contents of
[`db/schema.sql`](db/schema.sql), and run it.

It is safe to re-run at any time — every statement is `IF NOT EXISTS`.

---

## 3. Move the existing content into the database

The workshops, FAQ, pricing and dates currently live as files in
`_content-backup/`. This copies them into Neon:

```bash
# from the project folder
cp .env.example .env
# open .env and paste your DATABASE_URL into it, then:
npm install
npm run db:migrate
```

You should see:

```
Migrated into Neon:
  workshops      13
  faq            16
  pricing tiers  3
  dates          9  (9 linked to a workshop)
```

Re-running it is safe — it updates existing rows rather than duplicating them.

Keep `_content-backup/` in the repo. It is a plain-text copy of the content in
case anything goes wrong; nothing reads from it any more.

---

## 4. Choose an admin password

```bash
npm run admin:hash -- "pick a good password here"
```

It prints two lines:

```
ADMIN_PASSWORD_HASH=210000:...:...
SESSION_SECRET=...
```

Copy both. The password itself is never stored — only the hash — so if it is
forgotten, generate a new one and repeat this step.

All three of you share this one password. Anyone who has it can edit the site.

---

## 5. Create the rebuild hook

The public pages are built from the database, so they refresh when the site
rebuilds. This hook is what starts that automatically when you save.

1. Vercel → your project → **Settings** → **Git** → **Deploy Hooks**
2. Create one. Name it `admin-save`, branch `main`.
3. Copy the URL it gives you.

---

## 6. Put everything into Vercel

Vercel → your project → **Settings** → **Environment Variables**. Add each of
these to **Production** (and Preview if you want previews to work too):

| Name | Value | Mark as |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection string (step 1) | Sensitive |
| `ADMIN_PASSWORD_HASH` | from step 4 | Sensitive |
| `SESSION_SECRET` | from step 4 | Sensitive |
| `DEPLOY_HOOK_URL` | from step 5 | Sensitive |
| `RESEND_API_KEY` | your Resend key, for the enquiry form | Sensitive |

Then **redeploy** — environment variables are read at build and request time,
and a redeploy is the reliable way to be sure they have taken.

While you are in Settings, check **General → Node.js Version** is **22.x**.
`package.json` pins `engines.node` to `22.x` and that normally wins, but an
older value here is what caused the first deploy to fail with
*"invalid runtime: _render (nodejs18.x)"*.

---

## 7. Check it works

1. Visit `https://your-site/admin/` → you should get a password prompt.
2. Sign in → you should see the dashboard with your content counts.
3. Change something small (a workshop's sort order, say) and save.
4. Wait about a minute, then reload the public page. The change should be live.

If step 4 does not happen, `DEPLOY_HOOK_URL` is the thing to check — the save
itself will have worked.

---

## Day-to-day use

Everything is at `/admin/`:

- **Workshops** — add, edit, hide or delete. "Hide from the website" is better
  than deleting for seasonal sessions.
- **Upcoming dates** — the availability picker on the Contact page. Update
  "seats left" as bookings come in. Past dates drop off on their own.
- **Pricing** — the three cards on the Pricing page.
- **FAQ** — questions grouped into the three sections.

Every save triggers a rebuild. The site is live again in about a minute.

---

## Troubleshooting

**"The admin panel is not configured"** — `ADMIN_PASSWORD_HASH` or
`SESSION_SECRET` is missing in Vercel. The panel fails closed on purpose rather
than letting anyone in.

**"The site cannot reach the database"** — `DATABASE_URL` is wrong or missing.
Check you used the pooled connection string and that it is set for the right
environment.

**The build fails with "DATABASE_URL is not set"** — same cause. The public
pages are built from the database, so the build genuinely needs it.

**Saves work but the site does not change** — `DEPLOY_HOOK_URL` is missing or
wrong. Content is safe in the database; it just is not being published. You can
also trigger a redeploy by hand from the Vercel dashboard.

**Neon says the database is suspended** — the free tier sleeps after inactivity
and wakes on the next query, taking a second or two. This only ever affects the
admin panel and builds, never visitors, because the public pages are static.
