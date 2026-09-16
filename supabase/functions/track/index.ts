/**
 * track — counts individual people, not page views.
 *
 * Why this runs on the edge and not in the browser: a visitor id kept in
 * localStorage counts *browsers*. It resets when someone clears their data,
 * starts fresh in every private window, and issues a second id on the same
 * person's phone — so it drifts upward and never settles. The only stable
 * signal available for free is the request itself, and a browser cannot see
 * its own IP address. This function can.
 *
 * What gets stored is sha256(ip + user agent + pepper). The pepper is a
 * function secret that never reaches a client, so the hash cannot be
 * recomputed from outside to test whether a given address has visited, and
 * the address itself is never written down.
 *
 * Known and unfixable at this price: a household behind one router counts once,
 * and one person on a laptop and a phone counts twice. It is much closer to
 * "individual people" than anything that runs in the page.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const ALLOWED_ORIGINS = [
  "https://severrir.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function corsHeaders(origin: string | null) {
  // Echo the origin only when it is one of ours; otherwise send none, and the
  // browser refuses the response.
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * x-forwarded-for is a chain; the client is the first entry. The rest are
 * proxies and must not be trusted or included, or the hash changes whenever
 * routing does.
 */
function clientIp(req: Request) {
  const chain = req.headers.get("x-forwarded-for") ?? "";
  const first = chain.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const pepper = Deno.env.get("VISITOR_PEPPER");
  if (!pepper) {
    console.error("VISITOR_PEPPER is not set — refusing to hash with a known salt.");
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  // Service role: the visitors table has row-level security on and no policies
  // at all, so this is the only key in existence that can touch it.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const hash = await sha256Hex(`${clientIp(req)}|${userAgent}|${pepper}`);

  let body: { exclude?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // An empty body is the ordinary page-load call.
  }

  // Retiring a device from the count is an owner action, so the caller has to
  // prove it. The bearer token is verified against auth, then checked against
  // the admins table — being signed in is not enough.
  if (body.exclude) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const { data: userData } = token
      ? await admin.auth.getUser(token)
      : { data: { user: null } };

    const caller = userData?.user;
    if (!caller) {
      return new Response(JSON.stringify({ error: "Not signed in" }), {
        status: 401,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const { data: isAdmin } = await admin
      .from("admins")
      .select("user_id")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    // upsert rather than update: the owner may never have been counted from
    // this device, and the point is that they never will be.
    const { error } = await admin
      .from("visitors")
      .upsert({ visitor_hash: hash, excluded: true }, { onConflict: "visitor_hash" });

    if (error) {
      console.error("exclude failed", error);
      return new Response(JSON.stringify({ error: "Could not exclude device" }), {
        status: 500,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ excluded: true }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  /*
   * ignoreDuplicates keeps a returning visitor from touching the row at all,
   * which is what makes this a count of people rather than of visits — and it
   * leaves `excluded` alone, so an owner device that has been retired stays
   * retired no matter how often it comes back.
   */
  const { error } = await admin
    .from("visitors")
    .upsert({ visitor_hash: hash }, { onConflict: "visitor_hash", ignoreDuplicates: true });

  if (error) console.error("track failed", error);

  // The visitor is told nothing either way. The count is the owner's to read,
  // and a failed write must never surface in the page.
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...cors, "content-type": "application/json" },
  });
});
