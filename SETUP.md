# Setup — accounts, dashboard, visitor count

Everything here is on Supabase's free tier: 50,000 monthly active users,
500 MB of database, unlimited API requests, 500,000 edge function calls. No card
is required.

Steps 1–3 need you in a browser. The rest is copy and paste. Budget 15 minutes.

Until it is done the site works exactly as it does today: the showcase reads
from `src/data/projects.ts`, and sign-in and the dashboard say they are not
connected yet rather than breaking.

---

## 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a project.
   Pick a region near you; the database password is only for direct SQL access
   and this site never uses it.
2. Open **Settings → API Keys** — or press **Connect** at the top of the
   dashboard and pick **App Frameworks → Next.js**, which prints both of these
   ready to paste — and copy two values:
   - **Project URL** — `https://<something>.supabase.co`
   - the public browser key: **publishable** (`sb_publishable_…`) on new
     projects, **anon public** (a long JWT) on older ones

Both are safe to commit and safe to paste anywhere. The publishable key is the
one browsers are meant to hold. It opens nothing on its own: every table has
row-level security on, and a request made with it can do only what
`supabase/schema.sql` explicitly permits.

The **service_role** key on that same page is the opposite. It bypasses every
policy. It belongs only in the edge function's environment and must never reach
a browser, a commit, or a chat message.

## 2. Create the Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
   and press **New Application**. Name it whatever you like — people see this
   name on the authorise screen, so `severrir` is the right answer.
2. Open **OAuth2** in the sidebar and copy the **Client ID**, then
   **Reset Secret** to reveal a **Client Secret**.
3. In Supabase, open **Authentication → Providers → Discord**, switch it on, and
   paste both values in. Supabase shows a **Callback URL** on that page —
   copy it.
4. Back in Discord, under **OAuth2 → Redirects**, press **Add Redirect**, paste
   that callback URL, and **Save Changes**.

## 3. Tell Supabase where the site lives

**Authentication → URL Configuration**:

- **Site URL**: `https://severrir.github.io`
- **Redirect URLs** — add both:
  - `https://severrir.github.io/**`
  - `http://localhost:3000/**`

The second one is what lets sign-in work while developing. Without the exact
wildcards, Discord sends people back to the site URL and the round trip silently
drops whatever page they came from.

## 4. Create the tables

Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and
press run. It is safe to run more than once.

That file is worth reading before you run it — it is where every rule about who
can see and change what actually lives.

## 5. Add the keys

**For the live site** — in GitHub: **Settings → Secrets and variables → Actions
→ Variables** tab → **New repository variable**, twice:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | the Project URL from step 1 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the public browser key from step 1 |

The key can also be named `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the build reads
either, so a variable copied straight out of the dashboard works unrenamed.
Set one of the two, not both.

Variables, not Secrets. Both values end up in the JavaScript bundle either way,
and Secrets would only make them harder to read in the build log.

**For local development** — copy `.env.example` to `.env.local` and fill in the
same two values. `.env.local` is already gitignored.

Push to `main`, or run the workflow by hand, and the site deploys with sign-in
working.

## 6. Make yourself the admin

Sign in on the live site with Discord once, so the account exists. Then in the
**SQL Editor**:

```sql
insert into public.admins (user_id)
select id from auth.users order by created_at asc limit 1
on conflict do nothing;
```

That promotes the oldest account, which will be yours if you signed in first.
Check it took:

```sql
select u.raw_user_meta_data ->> 'full_name' as discord, a.added_at
from public.admins a join auth.users u on u.id = a.user_id;
```

Reload the site. The avatar in the header now has a **Dashboard** entry, and
`/admin` opens.

## 7. Deploy the visitor counter

This is the only part that needs a terminal.

```bash
npm install --global supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF     # the subdomain from the Project URL

# Any long random string. It is what stops anyone outside the function from
# recomputing a visitor hash. Generate one and do not reuse it elsewhere.
supabase secrets set VISITOR_PEPPER="$(openssl rand -hex 32)"

supabase functions deploy track
```

On Windows without `openssl`, generate the value with:

```powershell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

**Do not change `VISITOR_PEPPER` after the site is live.** Every stored hash is
derived from it, so a new pepper makes every returning visitor look new and the
count restarts.

Then open the site in a private window. The count in the dashboard goes up by
one; reloading does not move it again.

---

## How the count works

The function stores `sha256(ip + user agent + pepper)`. No address is ever
written down, so there is nothing in the table to leak, and the hash cannot be
recomputed from outside to test whether a particular person visited.

Two things it cannot do, at any price on a static host:

- A household or office behind one connection counts as one person.
- The same person on a laptop and a phone counts as two.

**You are not in the number.** Three separate things keep you out: signed-in
admins never call the function at all; **Stop counting this device** in the
dashboard retires the device you press it on, including visits it made before
you signed in; and the total ignores every retired device. Press it once on each
device you browse the site from.

## Everyday use

- **Cards** — edit a description, swap the demo video, reorder, or hide a card.
  Changes are live on the next page load; there is no deploy. A blank field
  means "use whatever `src/data/projects.ts` says", which is shown as the
  placeholder. **Reset to committed** clears every edit to that card.
- **Requests** — everything sent through the booking form. Formspree still pings
  you on Discord the moment one arrives; this is the second copy, so nothing is
  lost if a ping is missed. Mark a request handled once you have replied.
- **Visitors** — the count.

## If something breaks

**"Sign-in is not connected yet"** — the two repository variables are missing or
the deploy predates them. Check the **Variables** tab, then re-run the workflow.

**Discord returns to the site signed out** — the redirect URLs in step 3 do not
match. They need the `/**` wildcard.

**"This account cannot open the dashboard"** — step 6 has not run, or it promoted
a different account. Re-run the check query.

**The count stops moving** — free Supabase projects pause after 7 days with no
traffic at all. Any visit wakes it. Open the Supabase dashboard and press
**Restore** if it has already paused.

**The dashboard loads but is empty** — the account is signed in but not in
`admins`, so every query is refused by design. See step 6.
