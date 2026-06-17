// Cloudflare Pages Function: GET/PUT the shared strategy-day state.
// Bindings required (set in the Pages project):
//   KV namespace binding:  STATE
//   Environment variable:  API_TOKEN  (must match the token baked into the site)
const KEY = "terracore-state";

export async function onRequest(context) {
  const { request, env } = context;

  // auth: bearer token that only exists inside the logged-in (decrypted) site
  const expected = env.API_TOKEN;
  const got = request.headers.get("Authorization") || "";
  if (!expected || got !== "Bearer " + expected) {
    return json({ error: "unauthorized" }, 401);
  }

  if (!env.STATE) return json({ error: "KV binding STATE missing" }, 500);

  if (request.method === "GET") {
    const v = await env.STATE.get(KEY);
    return new Response(v || JSON.stringify({ state: {} }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  if (request.method === "PUT") {
    const body = await request.text();
    if (body.length > 3_000_000) return json({ error: "too large" }, 413);
    try { JSON.parse(body); } catch (e) { return json({ error: "bad json" }, 400); }
    await env.STATE.put(KEY, body);
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
