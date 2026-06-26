# Booking delivery

The booking form has two delivery paths, wired in `src/lib/booking.js`:

| Path | Where it runs | Holds secrets? | Status |
| --- | --- | --- | --- |
| **Formspree** (primary) | Formspree's servers | No (the form id is public by design) | Live now — emails you each booking |
| **Discord** (optional) | Your serverless proxy | Yes — the webhook, server-side only | Off until you deploy the proxy |

## The rule that drives this design

This is a **static site on a public repo**. A Discord webhook URL in client JS — or
in any committed file — can be scraped and abused. So:

- The browser **never** calls Discord directly.
- The browser **only** calls Formspree and (optionally) your proxy's public URL.
- The **real webhook lives only in the proxy's server-side secret store** — never in
  the repo, never in a committed `.env`, never inline in any `.js`/`.jsx`.
- If the proxy isn't set up, the form delivers via **Formspree only**. We never
  hardcode a webhook to get Discord working sooner.

## Deploy the Discord proxy (Cloudflare Worker)

```bash
npx wrangler deploy serverless/discord-proxy.worker.js --name severrir-discord-proxy
npx wrangler secret put DISCORD_WEBHOOK_URL    # paste your real webhook here
npx wrangler secret put ALLOWED_ORIGIN         # optional: e.g. https://your-domain
```

Then point the site at the proxy's URL (NOT the webhook):

```bash
# .env.local  (gitignored)
VITE_DISCORD_PROXY_URL=https://severrir-discord-proxy.<your-subdomain>.workers.dev
```

Rebuild/redeploy the site. Bookings now land in **both** email (Formspree) and Discord.

### Prefer Vercel / Netlify instead?

The same contract works on any platform — a function that reads
`DISCORD_WEBHOOK_URL` from the platform's env/secret settings and forwards the
posted `{ name, discord, email }` JSON to Discord. Deploy it, set the secret in
the dashboard, and set `VITE_DISCORD_PROXY_URL` to that function's URL.

## Verify no secret leaked into client code

```bash
# Should return ZERO matches in anything served to the browser:
grep -rn "discord.com/api/webhooks" src dist
```
