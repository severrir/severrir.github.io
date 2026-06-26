// Cloudflare Worker — Discord booking proxy.
//
// WHY THIS EXISTS: the site is static and lives on a public repo, so a Discord
// webhook URL placed in client code (or even a committed .env) could be scraped
// and abused. This Worker is the ONLY thing that knows the webhook. The browser
// posts booking JSON to the Worker's public URL; the Worker forwards it to
// Discord using a secret it reads from its own environment.
//
// DEPLOY (one time):
//   1. npm i -g wrangler           # or: npx wrangler ...
//   2. wrangler deploy serverless/discord-proxy.worker.js --name severrir-discord-proxy
//   3. Set the secret (paste your real webhook when prompted):
//        wrangler secret put DISCORD_WEBHOOK_URL
//   4. (Optional) lock it to your site origin:
//        wrangler secret put ALLOWED_ORIGIN     # e.g. https://severrir.dev
//   5. Put the Worker's URL in your site env as VITE_DISCORD_PROXY_URL.
//
// The real webhook lives only in Cloudflare's secret store — never in the repo.

const JSON_HEADERS = { "Content-Type": "application/json" };

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || "*";
    const reqOrigin = request.headers.get("Origin") || "";
    const originHeader = allowed === "*" ? "*" : allowed;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors(originHeader) });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors(originHeader) });
    }
    if (allowed !== "*" && reqOrigin && reqOrigin !== allowed) {
      return new Response("Forbidden", { status: 403, headers: cors(originHeader) });
    }
    if (!env.DISCORD_WEBHOOK_URL) {
      return new Response(JSON.stringify({ ok: false, error: "Proxy not configured" }), {
        status: 500,
        headers: { ...JSON_HEADERS, ...cors(originHeader) },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Bad JSON" }), {
        status: 400,
        headers: { ...JSON_HEADERS, ...cors(originHeader) },
      });
    }

    const name = String(body.name || "").slice(0, 200);
    const discord = String(body.discord || "").slice(0, 200);
    const email = String(body.email || "").slice(0, 200);
    if (!name || !discord) {
      return new Response(JSON.stringify({ ok: false, error: "Missing fields" }), {
        status: 422,
        headers: { ...JSON_HEADERS, ...cors(originHeader) },
      });
    }

    const content = {
      username: "SEVERRIR Bookings",
      embeds: [
        {
          title: "New consultation request",
          color: 0x6fe3ff,
          fields: [
            { name: "Name", value: name, inline: true },
            { name: "Discord", value: discord, inline: true },
            { name: "Email", value: email || "—", inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(content),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: "Discord rejected" }), {
        status: 502,
        headers: { ...JSON_HEADERS, ...cors(originHeader) },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...JSON_HEADERS, ...cors(originHeader) },
    });
  },
};
