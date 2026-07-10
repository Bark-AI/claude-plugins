# Auth + RPC: talking to Bark's MCP server from a deployed page

A deployed page has no host to lean on — it must (1) obtain an OAuth token itself and (2) speak the MCP
protocol to `https://app.bark-ai.com/mcp` directly. Both run **in the browser with no backend**, because
Bark serves open CORS (`access-control-allow-origin: *`) on its OAuth and MCP endpoints.

Copy these two layers verbatim into the board; only the render layer above them changes per board.
The working, browser-tested implementation lives in `examples/profit-loss.html` — this file explains
*why* each piece is shaped the way it is, so you can debug it and adapt it.

## Contents
- [The one contract that matters](#the-one-contract-that-matters)
- [Layer 1 — OAuth (PKCE + Dynamic Client Registration)](#layer-1--oauth-pkce--dynamic-client-registration)
- [Layer 2 — MCP client (Streamable HTTP)](#layer-2--mcp-client-streamable-http)
- [Bark-specific quirks that will bite you](#bark-specific-quirks-that-will-bite-you)

---

## The one contract that matters

The render layer only ever calls **`callBark(toolName, args)`** and gets back the tool's parsed JSON
payload (or a thrown error). Keep that boundary: the design and query layers only ever touch
`callBark`, so `callBark` is the only thing that has to know about OAuth and MCP.

```js
await getSession();                                   // mint a Bark session once, on load
const res = await callBark("bark_get_store_analytics", { subject, query, _annotations });
```

---

## Layer 1 — OAuth (PKCE + Dynamic Client Registration)

A deployed page is a **public client**: it has no secret and can't keep one. So it uses Authorization
Code + PKCE, and registers itself at runtime (Dynamic Client Registration) rather than shipping a
hardcoded `client_id`. Tokens live in `localStorage`. Nothing here is Bark-proprietary — it's textbook
MCP-spec OAuth — but the exact endpoints are discovered, never hardcoded.

```js
const BARK = { mcpUrl: "https://app.bark-ai.com/mcp", scope: "openid offline_access" };
const redirectUri = () => location.origin + location.pathname;
let TOKENS = null;

// PKCE + state helpers
function b64url(bytes) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function randB64url(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a); }
async function sha256b64url(s) {
  return b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

// --- discovery: MCP server is the OAuth "protected resource" -> its authorization server ---
async function discoverAS() {
  const ru = new URL(BARK.mcpUrl);
  const prm = await fetch(ru.origin + "/.well-known/oauth-protected-resource" + ru.pathname).then(r => r.json());
  const issuer = (prm.authorization_servers && prm.authorization_servers[0]) || ru.origin;
  const iu = new URL(issuer);
  for (const c of [
    iu.origin + "/.well-known/oauth-authorization-server" + iu.pathname,   // RFC 8414, path-aware
    issuer.replace(/\/$/, "") + "/.well-known/openid-configuration",
    iu.origin + "/.well-known/openid-configuration" + iu.pathname,
  ]) { try { const r = await fetch(c); if (r.ok) return r.json(); } catch (_) {} }
  throw new Error("Could not discover Bark authorization server metadata.");
}

// --- dynamic client registration, cached per (issuer + redirect_uri) ---
async function ensureClient(as) {
  const key = "bark_oauth_client:" + as.issuer + ":" + redirectUri();
  const cached = JSON.parse(localStorage.getItem(key) || "null");
  if (cached && cached.client_id) return cached;
  const c = await fetch(as.registration_endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: OAUTH_CLIENT_NAME,               // include the store name — see the CLIENT NAME note
      redirect_uris: [redirectUri()],
      token_endpoint_auth_method: "none",           // public client, no secret
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"], scope: BARK.scope,
    }),
  }).then(r => r.ok ? r.json() : Promise.reject(new Error("Client registration failed (HTTP " + r.status + ").")));
  localStorage.setItem(key, JSON.stringify(c));
  return c;
}

// --- start the redirect ---
async function beginAuth() {
  const as = await discoverAS();
  const client = await ensureClient(as);
  const verifier = randB64url(48), state = randB64url(16);
  const challenge = await sha256b64url(verifier);
  sessionStorage.setItem("bark_pkce",
    JSON.stringify({ verifier, state, client_id: client.client_id, token_endpoint: as.token_endpoint }));
  const p = new URLSearchParams({
    response_type: "code", client_id: client.client_id, redirect_uri: redirectUri(),
    scope: BARK.scope, state, code_challenge: challenge, code_challenge_method: "S256",
    resource: BARK.mcpUrl,     // RFC 8707 — binds the token's audience to the MCP server
    prompt: "consent",         // REQUIRED for offline_access to mint a refresh token (see quirks)
  });
  location.assign(as.authorization_endpoint + "?" + p.toString());
}

// --- handle the redirect back (?code=&state=) -> exchange for tokens ---
async function handleCallback() {
  const q = new URLSearchParams(location.search);
  const code = q.get("code"), state = q.get("state"), err = q.get("error");
  if (!code && !err) return "none";
  const saved = JSON.parse(sessionStorage.getItem("bark_pkce") || "null");
  history.replaceState({}, document.title, redirectUri());     // strip code so a refresh can't replay it
  if (err) return { ok: false, msg: "Authorization was declined (" + err + ")." };
  if (!saved || saved.state !== state) return { ok: false, msg: "Auth state mismatch — please reconnect." };
  const r = await fetch(saved.token_endpoint, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code", code, redirect_uri: redirectUri(),
      client_id: saved.client_id, code_verifier: saved.verifier, resource: BARK.mcpUrl,
    }),
  });
  if (!r.ok) return { ok: false, msg: "Token exchange failed (HTTP " + r.status + ")." };
  let t = null; try { t = await r.json(); } catch (_) {}
  if (!t || !t.access_token) return { ok: false, msg: "Token endpoint returned no access token." };
  saveTokens(t, saved);
  sessionStorage.removeItem("bark_pkce");
  return { ok: true };
}

// --- token lifecycle ---
function saveTokens(t, meta) {
  TOKENS = {
    access_token: t.access_token,
    refresh_token: t.refresh_token || (meta && meta.refresh_token) || (TOKENS && TOKENS.refresh_token) || null,
    token_endpoint: (meta && meta.token_endpoint) || (TOKENS && TOKENS.token_endpoint),
    client_id: (meta && meta.client_id) || (TOKENS && TOKENS.client_id),
    expires_at: Date.now() + (t.expires_in || 3600) * 1000 - 60000,   // refresh 60s early
  };
  localStorage.setItem("bark_oauth_tokens", JSON.stringify(TOKENS));
}
async function refreshTokens() {
  if (!TOKENS || !TOKENS.refresh_token) throw new Error("not-authenticated");
  const r = await fetch(TOKENS.token_endpoint, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token", refresh_token: TOKENS.refresh_token,
      client_id: TOKENS.client_id, resource: BARK.mcpUrl, scope: BARK.scope,
    }),
  });
  if (!r.ok) { disconnect(); throw new Error("session-expired"); }
  saveTokens(await r.json(), TOKENS);
}
async function accessToken() {
  if (!TOKENS) throw new Error("not-authenticated");
  if (Date.now() >= TOKENS.expires_at) await refreshTokens();
  return TOKENS.access_token;
}
```

---

## Layer 2 — MCP client (Streamable HTTP)

MCP over HTTP is a small JSON-RPC protocol. The handshake is `initialize` →
`notifications/initialized` → then any number of `tools/call`. Bark replies as **SSE**
(`text/event-stream`), so the parser must handle both SSE frames and plain JSON.

```js
const MCP = { sessionId: null, protocol: null, initialized: false, rpcId: 0 };

async function mcpPost(body) {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "Authorization": "Bearer " + (await accessToken()),
  };
  if (MCP.protocol) headers["MCP-Protocol-Version"] = MCP.protocol;
  if (MCP.sessionId) headers["Mcp-Session-Id"] = MCP.sessionId;    // only if the server issued one
  return fetch(BARK.mcpUrl, { method: "POST", headers, body: JSON.stringify(body) });
}

async function parseMcp(res, wantId) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text();
  if (!text) return null;
  let msgs;
  if (ct.indexOf("text/event-stream") >= 0) {
    msgs = text.split(/\n\n/).map(chunk =>
      chunk.split(/\n/).filter(l => l.indexOf("data:") === 0).map(l => l.slice(5).trim()).join("\n")
    ).filter(Boolean).map(d => { try { return JSON.parse(d); } catch (_) { return null; } }).filter(Boolean);
  } else {
    let j; try { j = JSON.parse(text); } catch (e) { throw new Error("Unexpected non-JSON MCP payload: " + text.slice(0, 200)); }
    msgs = Array.isArray(j) ? j : [j];
  }
  if (wantId != null) { const m = msgs.find(x => x && x.id === wantId); if (m) return m; }
  return msgs.find(x => x && (x.result !== undefined || x.error !== undefined)) || msgs[0] || null;
}

async function rpc(method, params, isNotification) {
  const body = isNotification
    ? { jsonrpc: "2.0", method, params }
    : { jsonrpc: "2.0", id: ++MCP.rpcId, method, params };
  let res = await mcpPost(body);
  if (res.status === 401) {                          // expired token, or a fresh JWT hitting clock skew
    if (TOKENS && TOKENS.refresh_token) await refreshTokens();
    res = await mcpPost(body);                        // retry once
    if (res.status === 401) { disconnect(); throw new Error("session-expired"); }
  }
  const sid = res.headers.get("mcp-session-id");
  if (sid) MCP.sessionId = sid;
  if (res.status === 202) return null;               // a notification was accepted, no body
  const msg = await parseMcp(res, body.id);
  if (!res.ok && !msg) throw new Error("MCP transport error (HTTP " + res.status + ").");
  if (msg && msg.error) throw new Error(msg.error.message || "MCP error");
  return msg ? msg.result : null;
}

// Memoised so parallel callBark()s (Promise.all) share ONE handshake instead of racing.
let mcpInitPromise = null;
function ensureMcp() {
  if (MCP.initialized) return Promise.resolve();
  if (mcpInitPromise) return mcpInitPromise;
  mcpInitPromise = (async () => {
    MCP.protocol = null; MCP.sessionId = null;
    const result = await rpc("initialize", {
      protocolVersion: "2025-06-18", capabilities: {},
      clientInfo: { name: `Bark Deployable Dashboard · ${DASHBOARD_NAME}`, version: "1.0" },
    }, false);
    MCP.protocol = (result && result.protocolVersion) || "2025-06-18";
    await rpc("notifications/initialized", {}, true);
    MCP.initialized = true;
  })().catch(e => { mcpInitPromise = null; throw e; });
  return mcpInitPromise;
}

// The contract the render layer depends on: returns the tool's parsed JSON, throws on error.
async function callBark(name, args) {
  await ensureMcp();
  const result = await rpc("tools/call", { name, arguments: args }, false);
  if (!result) throw new Error("Empty MCP result for " + name);
  if (result.isError) throw new Error((result.content && result.content[0] && result.content[0].text) || "MCP tool error");
  if (result.structuredContent && Object.keys(result.structuredContent).length) return result.structuredContent;
  for (const b of (result.content || [])) {
    if (b && b.type === "text") { try { return JSON.parse(b.text); } catch (_) {} }
  }
  throw new Error("Unexpected non-JSON tool payload from " + name);
}
```

Then the Bark session helper (a Bark session is separate from the MCP session — see quirks):

```js
let BARK_SESSION = null, sessionPromise = null;   // memoised so parallel first-calls mint ONE session
async function mintSession() {
  const res = await callBark("bark_start_session", {});
  let sid = res && res.sessionId;
  if (!sid && res && Array.isArray(res.content)) {
    for (const b of res.content) { try { const j = JSON.parse(b.text); if (j && j.sessionId) { sid = j.sessionId; break; } } catch (_) {} }
  }
  if (!sid) throw new Error("Could not obtain a Bark session id.");
  return sid;
}
function getSession(force) {
  if (force) { sessionPromise = null; BARK_SESSION = null; }   // re-mint a stale session
  if (BARK_SESSION) return Promise.resolve(BARK_SESSION);
  if (!sessionPromise) sessionPromise = mintSession().then(s => (BARK_SESSION = s)).catch(e => { sessionPromise = null; throw e; });
  return sessionPromise;
}
```

---

## Bark-specific quirks that will bite you

Each of these cost real debugging time. They are the reason the code above is shaped the way it is —
don't "simplify" them away.

1. **`prompt=consent` is mandatory for a refresh token.** Bark's OIDC provider only mints an
   `offline_access` refresh token when consent is *explicitly* prompted. Omit `prompt=consent` and you
   get an access token but **no** refresh token, so the board silently dies after ~1h and forces a full
   re-login. With it, you get a refresh token and durable sessions.

2. **The MCP server is stateless — no `Mcp-Session-Id`.** `initialize` returns *no* session-id header.
   That's fine: only send `Mcp-Session-Id` if the server ever issues one (the code guards this). Don't
   block on receiving one.

3. **Responses are SSE, not JSON.** Bark answers `tools/call` as `text/event-stream`
   (`event: message\ndata: {...}`). `parseMcp` handles both; a naïve `res.json()` throws.

4. **Two different "sessions."** The MCP transport session (the `Mcp-Session-Id` header, unused here)
   is NOT the Bark session. `bark_start_session` returns a Bark `sessionId` that must ride in
   `_annotations.sessionId` on every `bark_get_store_analytics` call. Mint it once on load, hold it,
   re-mint only if a call fails as stale (`getSession(true)`).

5. **Fresh-JWT clock skew → transient 401.** A just-issued token can 401 once against the resource
   server. The `rpc` 401 path refreshes-or-retries once before giving up, so a transient skew doesn't
   bounce the user to the login screen.

6. **`redirect_uri` must be an exactly-served static path.** OAuth requires the redirect URI to match
   the registered one exactly, and the host must serve that path *without* a per-request token in the
   query. Plain static servers (Netlify, Pages, S3, `python -m http.server`) work. The JetBrains /
   WebStorm built-in preview server does **not** — it gates files on an `_ijt` query token that the
   OAuth redirect drops, so the round-trip 404s. Serve the page from a normal static host.

7. **`resource` on both authorize and token requests.** RFC 8707 resource indicator = the MCP URL. It
   binds the token's audience to `app.bark-ai.com/mcp`. Send it in both requests.

8. **CLIENT NAME carries the store.** The registered `client_name` shows up in Bark's connected-apps
   list, so make it name the board *and* the store (e.g. `Bark Dashboard · Profit & Loss — Acme Hats`).
   That's the only signal in Bark's records of what a token is for — a bare "Dashboard" is useless when
   a merchant has several.

### Loading sequence (what boot() does)
`read config → (has token? render : show connect gate) → on connect: beginAuth() → redirect → back at
handleCallback() → exchange → render`. On every render: `getSession()` (mint once) → the
`bark_get_store_analytics` queries → paint. A 401 that can't refresh, or a missing token, throws
`not-authenticated`/`session-expired`; the render catch shows the connect gate instead of an error.
