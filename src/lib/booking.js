// Booking submission.
//
// SECURITY: this is a static site on a public repo. The Discord webhook URL is
// NEVER touched here — the browser only ever talks to:
//   1. Formspree (primary): handles the request server-side and emails you. The
//      form id is public by design (it's safe to expose).
//   2. An OPTIONAL serverless proxy (VITE_DISCORD_PROXY_URL): a Cloudflare
//      Worker / Vercel / Netlify function that holds the real Discord webhook as
//      a server-side secret and forwards to it. The proxy URL is safe to expose;
//      the webhook it wraps is not, and never reaches the client.
// If the proxy URL isn't configured, we silently fall back to Formspree-only —
// we never hardcode a webhook to "make Discord work sooner".

const FORMSPREE_ENDPOINT =
  import.meta.env.VITE_FORMSPREE_ENDPOINT || "https://formspree.io/f/xgojkepa";
const DISCORD_PROXY_URL = import.meta.env.VITE_DISCORD_PROXY_URL || "";

// Human-readable labels for the budget ranges the form offers, so the email/
// Discord message reads "$1,500 – $3,000" instead of the raw option value.
const BUDGET_LABELS = {
  "under-500": "Under $500",
  "500-1500": "$500 – $1,500",
  "1500-3000": "$1,500 – $3,000",
  "3000-5000": "$3,000 – $5,000",
  "5000-plus": "$5,000+",
  revshare: "Revenue share / ongoing",
  unsure: "Not sure yet — wants to discuss",
};

export async function submitBooking({ name, discord, email, commission, budget }) {
  const payload = {
    name: name.trim(),
    discord: discord.trim(),
    email: (email || "").trim(),
    commission: (commission || "").trim(),
    budget: budget ? BUDGET_LABELS[budget] || budget : "",
    _subject: `New booking — ${name.trim()} (Discord: ${discord.trim()})`,
  };

  // Primary delivery: Formspree (email). This is the source of truth for whether
  // the submission "succeeded".
  const res = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Something went wrong sending that. Try again, or reach out on Discord.";
    try {
      const data = await res.json();
      if (data?.errors?.length) message = data.errors.map((e) => e.message).join(" ");
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  // Optional secondary delivery: serverless Discord proxy (best-effort). A
  // failure here must NOT fail the booking — Formspree already succeeded.
  if (DISCORD_PROXY_URL) {
    try {
      await fetch(DISCORD_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      /* proxy unreachable — email path already delivered */
    }
  }

  return { ok: true, discordProxy: Boolean(DISCORD_PROXY_URL) };
}
