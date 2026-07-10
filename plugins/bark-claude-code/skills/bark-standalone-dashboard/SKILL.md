---
name: bark-standalone-dashboard
description: A Claude Code skill for coding and shipping a live, deployable Bark AI dashboard — a self-contained HTML page you host yourself. It signs the merchant into Bark with OAuth (PKCE) and pulls live store analytics by calling Bark's MCP server directly from the browser, no backend. Use it in Claude Code whenever the user wants to build, create, code, deploy, host, or share a Bark dashboard, board, report, or live analytics view as a real web page on a static host (Vercel, Netlify, Cloudflare Pages, S3, GitHub Pages, any web server) that re-pulls fresh Bark data on every visit — even when they just say "put my Bark numbers on a page I can share", "a dashboard I can host", or name a hosting platform. Turns Bark store data (sales, profit and contribution margin, media/ROAS, inventory, pricing) into a branded, interactive site. Bundles the OAuth + MCP data layer, the query approach, the Bark design system, and three ready dashboards — Profit & Loss, CM Heroes & Bleeders, and Category Analysis.
---

# Build a deployable Bark dashboard

Turn a store's Bark numbers into a calm, branded, interactive dashboard that lives at a URL. It's one
self-contained HTML file that, entirely in the browser: signs the merchant into Bark with OAuth, calls
Bark's MCP server directly, and re-pulls fresh data every time it's opened or a control changes. Deploy
it to any static host — no backend, no server code, no proxy.

## How it works (the architecture)

A deployable board owns two things a hosted-inside-an-app board never has to:

1. **Auth.** The page runs an OAuth Authorization-Code + PKCE flow itself (registering as a public
   client via dynamic client registration), stores the token in the browser, and refreshes it.
2. **Transport.** The page speaks the MCP JSON-RPC protocol straight to `https://app.bark-ai.com/mcp`
   — `initialize` → `tools/call` — carrying the bearer token. Bark serves open CORS, so this works from
   the browser with no backend.

Everything above that — pulling numbers, composing blocks, rendering — is ordinary dashboard code. This
skill gives you the auth+transport layer ready to paste (`reference/auth-and-rpc.md`), the design system
(`reference/design-and-composition.md`), the query approach (`reference/query-reference.md`), and three
complete, working example boards.

## When to use this

Use it when the user wants a **standalone, hostable** Bark dashboard — "build me a dashboard I can
deploy / host / share", "put my P&L on a page", "a live board on Netlify/Pages/S3". If they just want an
*answer* from their Bark data (a number, a table, an analysis), answer that directly with the Bark tools;
only reach for this skill when the deliverable is a **web page**.

## Prerequisites

- **A static host** for the finished HTML (Netlify, Cloudflare Pages, S3, GitHub Pages, or `python -m
  http.server` for local testing). It must serve the page at a stable path **without** a per-request
  token in the URL — see the redirect-URI note in `reference/auth-and-rpc.md`. (IDE built-in preview
  servers such as JetBrains/WebStorm do **not** qualify — they gate files on a query token the OAuth
  redirect drops.)
- **The store's config**: `storeId`, `storeName`, `currencyCode` (ISO, e.g. "USD"), `timezone` (IANA,
  e.g. "America/New_York"). The person deploying knows these; you can also read the accessible stores
  from `bark_start_session`. Never bake a real store id or name into a *template* — use placeholders
  (`storeId: 0`, `"Acme Hats"`) until it's a real deployment for a real store.
- **The Bark MCP tools**, which you (the building agent) already have. Use them to read the live query
  reference and this store's cube members before writing queries (see
  [Read the live query reference](#read-the-live-query-reference)).

## Two ways to build

1. **Copy a matching example** (fast, preferred). `examples/` holds three complete, deployable boards.
   If one fits the ask, copy it, set its config block, and deploy. See [the examples](#examples).
2. **Design a custom board.** No example fits → author a new self-contained HTML board following
   `reference/design-and-composition.md`, reusing the **exact** data layer from `reference/auth-and-rpc.md`
   (copy it from any example — it's identical in all three). Open the closest example first as the style
   reference.

## Build steps

1. **Pin the board.** Decide the one decision the board is for (where profit goes → P&L; which products
   make vs. bleed margin → Heroes & Bleeders; where the margin lives → Category Analysis; or a custom
   cut). That picks the example or the measures/dimension/blocks.
2. **Set the config block.** Every board carries an inlined config the page reads at load:
   ```html
   <script type="application/json" id="bark-dashboard-config">
     { "boardName": "Profit & Loss", "storeId": 0, "storeName": "Acme Hats",
       "currencyCode": "USD", "timezone": "America/New_York" }
   </script>
   ```
   | Field          | What it is                                              |
   |----------------|---------------------------------------------------------|
   | `boardName`    | the board label shown in the header                     |
   | `storeId`      | the Bark store id (a real number for a real deployment) |
   | `storeName`    | the store's official name, shown in the header          |
   | `currencyCode` | ISO currency code — drives number formatting            |
   | `timezone`     | IANA timezone — drives the "Data updated" stamp         |

   The page derives its OAuth client name from `boardName` + `storeName`, so the token is
   self-describing in Bark's connected-apps list — keep both meaningful.
3. **Keep the data layer intact.** Auth + MCP is in `reference/auth-and-rpc.md` and already inlined in
   every example. Don't rewrite it — its shape encodes several quirks (stateless server, SSE responses,
   `prompt=consent` for refresh tokens, clock-skew 401 retry). Read that file before touching it.
4. **Read the live query reference** (below), then **query** per `reference/query-reference.md` — the
   call shape, time presets, compare mode, and how to read the response.
5. **Compose + style** per `reference/design-and-composition.md` — Bark palette, header lockup, block
   vocabulary, and the principles that make a board communicate a decision (lead with the finding; derive
   words from data; one accent; deltas coloured by profit effect).
6. **Deploy** the single HTML file to the static host. On first open the merchant clicks "Connect Bark",
   approves once, and the board renders — and keeps rendering fresh data on every reopen.

## Read the live query reference

You have the Bark MCP tools, so use the **authoritative, live** definitions rather than guessing measure
keys — read these Bark resources once before writing queries:

- `bark://docs/query-reference` — the query DSL semantics (date, dimensions, measures, filters, compare).
- `bark://stores/{storeId}/cubes/sales/members` — **this store's** exact measure/dimension keys, their
  public `title`s, and their `format`s. Different stores expose different axes (brand, class, category),
  so read the members for the actual store you're building for.

`reference/query-reference.md` covers only the parts specific to building a *dashboard* on top of that.

## Examples

All three are self-contained, deployable, browser-tested, and share the identical auth+MCP data layer.
They double as the **style reference** for custom builds. Open the closest one and match it.

- **`examples/profit-loss.html`** — **P&L (demand → profit)**, the flagship and the strongest example of
  the design principles: KPIs (Net Sales, CM, CM %, Media % of net) → a **P&L waterfall** (Gross Sales →
  − Discounts → − Returns → **Net Sales** → − COGS → − Fulfillment → − Payments → − Media →
  **Contribution Margin**) → **CM by category** ranked bars with a computed callout → **four detail-table
  wells**. Start here.
- **`examples/cm-heroes-bleeders.html`** — **Contribution Margin, Heroes & Bleeders**: product-level CM.
  A heroes table (top by CM) and a bleeders table (CM < 0, worst first, CM in red).
- **`examples/category-analysis.html`** — **Category Analysis**: per `products.category`, with a
  **Chart.js time-series** line (loaded from a CDN — fine on a deployed page), ranked CM bars, and a
  category detail table.

## Reference files

Read the relevant one before working in its area (bundled next to this skill; reference them by relative
path, or via `${CLAUDE_SKILL_DIR}` at runtime):

- **`reference/auth-and-rpc.md`** — the OAuth (PKCE + dynamic client registration) and MCP
  (Streamable-HTTP) data layer, with exact code and the quirks that will bite you.
- **`reference/query-reference.md`** — the dashboard-specific query bits: call shape, time presets,
  compare mode, and reading the response.
- **`reference/design-and-composition.md`** — the visual system (palette, header, blocks) and what makes
  a good Bark dashboard.

## Hard rules

- **Never ship real customer data in a template.** Placeholders only (`storeId: 0`, `"Acme Hats"`) until
  it's a real deployment for a real store. Scrub store ids and names before committing or sharing a
  template.
- **Public names only.** Label with the member `title` and the public storefront product/category name —
  never a raw cube key or internal handle/SKU.
- **Visualize, don't re-analyze.** Read the totals row; don't invent, recompute, or caveat. If Bark
  didn't return it, it doesn't go on the board.
- **Keep the data-layer contract.** The render layer only calls `callBark(name, args)` and `getSession()`.
  Preserve that boundary so the design and query layers stay portable.
- **Static host, stable path.** The OAuth `redirect_uri` must be served exactly, without a query token.
  Plain static hosts work; IDE preview servers don't.
