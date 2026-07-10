---
name: bark-cowork-dashboard
description: Design a branded, live Bark dashboard in Claude Cowork — a persisted board (date-range + compare controls, KPI cards, ranked widgets) that re-pulls fresh Bark data every time the merchant opens it. Either COPY a matching prepackaged template (fast) or DESIGN a custom board following the design system here, using the templates as style examples; then publish it as a Cowork live artifact. Use ONLY in a Claude Cowork session, and ONLY when the merchant explicitly asks to create, build, make, or set up a dashboard / board / live view. Do NOT use to ANSWER a question or run analysis — answer those directly, then you may OFFER to build a board. Do NOT use for inline branded panels (Ask Bark, Bark Brief, Finding panels) — that is panel_rendering.
---

# Design a Bark dashboard (Claude Cowork live artifact)

Turn a store's Bark numbers into a calm, branded, interactive dashboard that lives in the Cowork
sidebar and re-pulls fresh Bark data every time the merchant opens it or changes a control. The
output is a single self-contained HTML **Cowork live artifact** built with `create_artifact`.

There are **two ways** to produce a board:

- **Copy a matching template** — when the request maps to a board that already exists in `templates/`,
  copy it with the `copy-template` script (inject the store config) and publish. Fast, consistent,
  already-tested. Prefer this.
- **Design a custom board** — when no template fits, author a new self-contained HTML board following
  the **design system** below, using the templates in `templates/` as concrete **examples and styles**
  to match.

Tools this skill uses: `bark_start_session`, `bark_get_store_analytics`, `bark_read_resource`, and the
Cowork artifact tools (`create_artifact`, `list_artifacts`, `update_artifact`). If live-artifact
support isn't present, say so instead of faking a dashboard.

## When this applies

Only when the merchant **explicitly asks to build / create / make / set up a dashboard or live
artifact**. This skill builds dashboards and nothing else.

- A question about the business ("where am I leaking?", "what should I push?", "how did last week
  go?") is **not** a dashboard request. Answer it directly with Bark, then you may offer: "Want me to
  turn this into a live dashboard you can re-open?" — and build only on yes.
- If a request is ambiguous between "answer me" and "build me a board," answer first, then offer.
- This is for product-level P&L the Bark cube holds (sales, profit/CM, media/ROAS, inventory,
  pricing). For things the cube can't answer (LTV, cohorts, copy, competitors), say so plainly.
- This builds a **persisted, interactive Cowork artifact**. For inline branded panels — Ask Bark /
  Bark Asks / Bark Brief / Finding panels — use `panel_rendering` instead.

## Prerequisites

- **Cowork:** needs Cowork's live-artifact tools. Confirm `create_artifact` is available before
  starting; if not, say the dashboard builder only works in a Claude Cowork session and stop.
- **Node:** the `copy-template` script runs with `node` (ships with this skill).

## 1. Pin the board (ask if ambiguous)

Dashboards are not a fixed module set — different ones communicate different things. Clarify the one
decision or theme the board is for, and let that pick the template (or, for a custom board, the
measures, the dimension, and the blocks).

**If the ask is ambiguous, ask first — with a tool, not a chat reply.** When the request doesn't pin
down what the board should be about (e.g. just "build me a dashboard"), use the **ask-user-question**
tool to put one short questionnaire to the merchant — never guess, never interrogate in prose. Keep it
**high-level — enough to grasp intent, not a spec interview**: up to 5 questions, ideally 1–3. Lead
with the **template menu** (see [Templates](#templates--board-catalog)) as the options — e.g. *what's
this board for?* → "Where my profit goes (P&L)" / "Which products make vs bleed margin" / "Where the
margin lives (categories)" / "Is media paying off (POAS & channels)"; optionally *default window?* →
7d / 30d / 90d / MTD / YTD. Don't ask about colours, layout, or exact measures — default those. If the
intent is already clear, skip the questionnaire and build.

## 2. Start a session & the store config

Every board — copied or custom — is bound to a store by an inlined **config block**:

```html
<script type="application/json" id="bark-dashboard-config">{ … }</script>
```

Call `bark_start_session` to get the **store id** and store metadata (name, currency, timezone); pair
that with the board label and this session's **fully-qualified Bark tool names**. That's the whole
config. To copy a template, pass it as an **inline JSON string** to the copy script (nothing is written
to the merchant's working folder):

| Field                | What it is                                                                   |
|----------------------|------------------------------------------------------------------------------|
| `storeId`            | the Bark store id (from `bark_start_session`)                                 |
| `storeName`          | the store's official name (e.g. "Acme Hats")                                |
| `currencyCode`       | ISO currency code (e.g. "USD", "GBP")                                        |
| `timezone`           | IANA timezone (e.g. "America/New_York")                                     |
| `boardName`          | the board label (e.g. "Profit & Loss", "Category Analysis")                  |
| `tools.startSession` | fully-qualified `bark_start_session` name (`mcp__<hash>__bark_start_session`) |
| `tools.executeQuery` | fully-qualified `bark_get_store_analytics` name                              |

```json
{
  "storeId": 123,
  "storeName": "Acme Hats",
  "currencyCode": "USD",
  "timezone": "America/New_York",
  "boardName": "Profit & Loss",
  "tools": {
    "startSession": "mcp__<hash>__bark_start_session",
    "executeQuery": "mcp__<hash>__bark_get_store_analytics"
  }
}
```

The board reads `storeId` / `currencyCode` / `timezone` at load to query and format, shows `storeName` /
`boardName` in the header, and calls Bark through `tools.*` (see
[Resolve the Bark tool names](#resolve-the-bark-tool-names)). A custom board embeds the **same** config
block.

Tool names embed an install-specific hash — **discover this session's fully-qualified names at runtime,
never hardcode them.** That, plus the session, is all the **template path** needs before publishing — a
template carries its own queries, so no schema or field discovery (that heavier setup is **custom** only,
§4).

## 3. Copy a matching template

When a template fits the request, copy it — don't re-author it.

1. Run the copy script, passing the config as an **inline JSON string** (§2) — no file is written
   to the working folder. `${CLAUDE_SKILL_DIR}` points at this skill, but it's a **host** path that may
   not exist inside the Cowork bash sandbox (the plugin is mounted under
   `/sessions/*/mnt/.remote-plugins/*/`), so resolve the skill dir with a fallback, then run:
   ```bash
   SKILL="${CLAUDE_SKILL_DIR:-}"
   [ -f "$SKILL/scripts/copy-template.mjs" ] || SKILL="$(find /sessions ~/.claude -type d -path '*/skills/bark-cowork-dashboard' -print -quit 2>/dev/null)"
   node "$SKILL/scripts/copy-template.mjs" \
     '{"storeId":123,"storeName":"Acme Hats","currencyCode":"USD","timezone":"America/New_York","boardName":"Profit & Loss","tools":{"startSession":"mcp__<hash>__bark_start_session","executeQuery":"mcp__<hash>__bark_get_store_analytics"}}' \
     "$SKILL/templates/profit-loss.template.html" profit-loss-acme-hats.html
   ```
   **Single-quote the JSON** so the shell passes it intact (it contains spaces and `&`). The scoped
   `find … -print -quit` stops at the first match — don't `find /` (a whole-disk scan prints
   permission-denied noise and a misleading exit 1). Args are: `'<config-json>' <template.html>
   <output.html>`. It copies the template and replaces its config block with yours.
2. Publish the output (see [Publish](#5-publish)).

## 4. Design a custom board

When no template fits, author a single self-contained HTML board following the design system below.
**Open the closest template in `templates/` first** — it is the reference for the header lockup,
palette, controls, and block styling. Keep the same config block and the same Bark bridge.

**Set up first (custom only).** The Bark MCP prefix is install-specific and the field set is
store-specific — discover both at runtime, never hardcode from memory:

- The board reads the Bark tool names from its **injected `config.tools`** — don't hardcode them into
  the page (see [Resolve the Bark tool names](#resolve-the-bark-tool-names)). Resolve this session's
  fully-qualified names, pass them in the config, and also list them in `create_artifact`'s `mcp_tools`
  at publish so the board is granted access.
- Read `bark://docs/query-reference` once and `bark://stores/{storeId}/cubes/sales/members` once for the
  live measure/dimension keys.
- **Look at the store's real numbers first** (the main P&L query + the category breakdown) so any
  headline or callout is true to *this* store and you catch surprises (a missing cost line, a dominant
  category) before they reach the board. Don't run probe queries just to "check the shape" — it's
  documented under [Data & querying](#data--querying).

**Visualize, don't re-analyze.** Take Bark's numbers as given — don't invent figures, recompute totals,
or add caveats Bark didn't make; if it isn't in Bark's response, it doesn't appear on the board. Read
totals from the totals row, never self-sum rows.

Every dashboard carries, up top, two **select** controls wired to re-query Bark on change (dropdowns,
not button rows):

- **Window** — 7d / 30d / 90d / MTD / YTD (default 30d unless the request implies otherwise).
- **Compare** — none / preceding period / last year, day-of-week aligned (default: preceding period).

Lead with the finding, not the data — "Your top style carries ~80% of profit," not "a breakdown by
category." That finding is *computed from the data on every render, never hardcoded* (see
[Derive the words from the data](#composition)). One idea per block, with space between. A single
number said well beats a chart; don't add a second chart that repeats the first.

---

## Data & querying

The board calls `bark_get_store_analytics` with `{ subject, query, _annotations }`:

- `subject`: `{ type: "store", storeId: <number> }` — `storeId` from the config block.
- `query`: `{ date, dimensions?, measures, order?, where?, having?, havingChange?, limit?, totals? }`.
  `measures`/`dimensions` are arrays of `{ key }`; the time axis is a dimension
  `{ key: "date", resolution: "day"|"week"|"month" }`. Always set `totals: true`.
- `_annotations`: `{ sessionId, activeTurn: { idx, user, context } }` — required on every call.

### Resolve the Bark tool names

A Bark tool name is `mcp__<install-hash>__<tool>` and the hash is **install-specific** — a name that
works on the machine that authored a board is wrong on every other install, and a real hash must never
ship in this public repo. The board must **never hardcode** tool names. The host exposes **no runtime
tool-listing API** to a live artifact, so the board reads them from the **injected config** — you resolve
this session's fully-qualified names and pass them in `config.tools` (Step 2), and the page reads them:

```js
const BARK_START = (CFG.tools && CFG.tools.startSession) || "";
const BARK_QUERY = (CFG.tools && CFG.tools.executeQuery) || "";
```

If either is empty, show the error state — don't call with an empty name. At **publish** you also list
these same fully-qualified names in `create_artifact`'s `mcp_tools` to *grant* the board access.

### Calling Bark from inside the artifact (the Cowork bridge)

The load sequence is **read `config.tools` → `bark_start_session` (mint a session) →
`bark_get_store_analytics` (query)**, re-minting the session if a later call returns a session error.
Each call goes through
`window.cowork.callMcpTool(name, args)` and resolves to a result object
`{ content, structuredContent, isError }` — it does **not** throw on a tool error. Four rules, in order,
prevent the failures this bridge invites (each has bitten a real build):

1. **Check `isError` before parsing anything.** A failed call comes back as a normal result with
   `isError: true` and a *plain-text* message (e.g. `MCP error "…"`). If you blindly
   `JSON.parse(content[0].text)`, you parse "MCP error …" and throw `Unexpected token 'M'`, burying the
   real cause. If `isError`, surface `content[0].text` as the error and stop — never parse it.
2. **Read the payload defensively.** Prefer `structuredContent`; fall back to
   `JSON.parse(content[0].text)` only when it's absent, and wrap that parse so a non-JSON payload fails
   loudly with the raw text.
3. **Mint your own session on every load, and extract the id correctly.** `bark_start_session` returns
   **two** content blocks — a JSON block `{"sessionId": …}` *and* a markdown briefing — so don't assume
   `content[0]` is the JSON, and never `JSON.stringify(result)` then regex for `sessionId` (stringifying
   escapes the quotes, the match misses, and you carry a `null` id into every call). Read
   `structuredContent.sessionId` if present, else find the content block whose text parses as JSON and
   take its `sessionId`.
4. **Guard every array before you iterate.** An unexpected shape leaves `data.rows`, `data.columns`,
   `data.totals`, `members`, or a per-category array **`undefined`**, and `undefined.forEach(...)`
   throws `Cannot read properties of undefined (reading 'forEach')`, blanking the board. Default each to
   `[]` on read (`const rows = data?.rows ?? []`) and null-guard nested lookups. An empty array renders
   an empty-state ("no data this period"), never a crash.

**The build-time session id is dead on reopen.** The artifact persists and re-runs cold every time the
merchant opens it. The page must call `bark_start_session` *itself* at load, reuse that id across
`bark_get_store_analytics` calls, and re-mint if a later call returns a session error.

### Time presets (Window control)

Use the relative templates verbatim — Bark applies the store timezone; never add a time component.

| Preset        | `date`                                |
|---------------|---------------------------------------|
| Last 7 days   | `{ from:"now-7d/d",  to:"now/d-1s" }` |
| Last 30 days  | `{ from:"now-30d/d", to:"now/d-1s" }` |
| Last 90 days  | `{ from:"now-90d/d", to:"now/d-1s" }` |
| Month to date | `{ from:"now/M",     to:"now/d-1s" }` |
| Year to date  | `{ from:"now/y",     to:"now/d-1s" }` |

### Comparison (Compare control, day-of-week aligned)

For deltas, switch `date` to compare mode `{ primary, secondary }` (both required). Build `secondary`
from the primary's own `from`/`to` with a helper so the comparison is aligned by weekday (essential in
retail):

- **vs preceding period** — `PRECEDING_PERIOD_MATCHING_WEEKDAYS_FROM(<pf>, <pt>)` / `..._TO(<pf>, <pt>)`.
- **vs same period last year** — `PREVIOUS_YEAR_PERIOD_MATCHING_WEEKDAYS_FROM(<pf>, <pt>)` / `..._TO(<pf>, <pt>)`.
  `<pf>`/`<pt>` are the primary preset's `from`/`to`, embedded literally. "None" sends the
  single-period `date` (no `secondary`).

### Response shape

Returns `{ members, data: { columns, rows, totals }, stats }`.

- `data.columns` — column keys in order. `data.rows` — rows aligned to columns. `data.totals` — one
  array aligned to columns (dimension cells are `null`).
- `members[]` — `{ key, title, format, … }`; use `title` for labels, `format`
  (`currency`|`integer`|`percent`|`decimal`) for display.
- **Single-period:** a measure is one column under its plain key (`sales.netSalesAmount`).
- **Compare mode:** each measure expands into FOUR columns — `<key>.primary`, `<key>.secondary`,
  `<key>.changeAmount`, `<key>.changePercent` (a fraction: `-0.178` = −17.8%). Detect compare mode by
  whether `"<key>.primary"` is in `columns`.
- All numbers arrive as **strings** — convert before math. Build a column-key → index map once from
  `columns` and reuse it.

### Common measures (pick the few that answer the question)

Sales & orders: `sales.netSalesAmount` (Net Sales) · `sales.grossSalesAmount` (Gross Sales) ·
`sales.netSalesQuantity` (Net QTY) · `sales.ordersCount` (Orders) · `sales.avgOrderValue` (AOV) ·
`sales.avgItemsCountPerOrder` (Items/Order) · `sales.avgEffectivePrice` (Effective Price) ·
`sales.discountsAmount` (Discounts) · `sales.discountsPercentage` (% Discounts) ·
`sales.returnsAmountPercentage` (% Returns).
Profit & margin: `derivatives.contributionMarginAmount` (CM $) ·
`derivatives.contributionMarginPercentage` (% CM) · `sales.grossProfitAmount` (Gross Margin) ·
`sales.grossProfitPercentage` (% GM) · `sales.cogsAmount` (COGS) ·
`derivatives.contributionMarginAmountPerView` (Profit/View).
Media & efficiency: `derivatives.mediaCostAmount` (Media) · `derivatives.mediaCostPercentage`
(% Media) · `derivatives.revenueOnAdSpend` (ROAS) · `derivatives.profitOnAdSpend` (POAS).
Traffic & conversion: `traffic.viewsCount` (GA4 Views) · `sessions.sessionsCount` (GA4 Sessions) ·
`derivatives.sessionsConversionRate` (Sessions CVR) · `derivatives.viewsConversionRate` (Views CVR).
Inventory: `inventory.availableQuantity` (Inventory QTY) · `inventory.incomingQuantity` (Incoming) ·
`consumption_analysis.month_of_stock` (Months of Stock) ·
`productVariants.withInventoryCountPercentage` (% Variants with Stock).

### Common dimensions

`date` (with `resolution`) · `products.category` · `products.title` · `products.id` ·
`products.status` · `products.isPublished` · `productCollections.title` (many-to-many) ·
`productTags.tag` (many-to-many) · `productVariants.option1`/`option2` (color/size, store-specific) ·
`customerTypes.label` (new/returning) · `stores.platform` · `product_lifecycle.segment` ·
`product_lifecycle.status_on_hand`. Brand axes are store-specific — confirm against the members
resource.

### Caveats

Totals row is truth (don't sum rows). Tags/collections are many-to-many and fan out — use them to
`where`-filter, not to split revenue. Sessions & Sessions CVR exist only at store level (null in
grouped rows) — use Views / Views CVR below store level.

---

## Theming (clean, Notion-style)

Aim for the calm feel of a well-made Notion doc: a **white** page, **sans-serif** type, lots of
whitespace, almost no borders, and a single Bark-magenta accent used only to mark what matters. Light
mode only; no web fonts (the sandbox blocks font CDNs) — system stacks only.

**Palette**

| Role        | Hex     | Where it's used                                                   |
|-------------|---------|-------------------------------------------------------------------|
| Page        | #FFFFFF | page background — white, Notion-clean (not cream)                 |
| Block       | #F7F6F3 | subtle fill — callouts, detail-table wells, KPI wells             |
| Ink         | #1A1714 | primary text (near-black)                                         |
| Ink-soft    | #6B635B | labels, sub-labels, meta                                          |
| Hairline    | #EAE7E1 | the few thin dividers                                             |
| Accent      | #AD1A72 | the ONE highlight — all chart bars, key figure, link, accent text |
| Accent-tint | #F0E9EE | bar fill rail (track) and soft fills                              |
| Up          | #2F6E4F | positive delta text                                               |
| Down        | #C0392B | decrease delta text — a TRUE red, distinct from the brand magenta |
| Bark Indigo | #252751 | Bark wordmark in the header (logo)                                |
| Spark       | #EA43E2 | the magenta asterisk in the Bark logo — not a UI accent           |

System sans stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
Use tabular figures (`font-variant-numeric: tabular-nums`) for every number so digits don't jitter.

- **Header & logo (exact — identical on every board).** Lead with the **Bark logo lockup**, sized the
  same every time: wordmark **Bark** at **26px / 700**, Bark Indigo (#252751); magenta **spark "✱"** at
  **16px** (#EA43E2), ~4px right of the wordmark; a **1px × 22px hairline divider** (#EAE7E1) with ~14px
  gap each side; then **store name** at 16px / 600 ink and the **board label** beneath at 13px ink-soft.
  Right-aligned, a small "Data updated …" stamp at 13px ink-soft. The selects already show the period
  and comparison — **don't also print a "Last 30 days · vs last year" dateline**.
- **Type.** System **sans throughout — no serif.** Headline large and bold (~24–30px, 600–700),
  near-black, key dollar figures in accent. Section labels: small uppercase, letter-spacing ~.08em, in
  accent (e.g. "THE FLOW TO PROFIT"). Body/sub-labels/meta in ink-soft.
- **Controls — select fields, not button rows.** Window (7d / 30d / 90d / MTD / YTD) and Compare
  (None / Preceding period / Last year) as compact labelled **dropdowns** under the header. Style the
  focus/active ring in the accent (#AD1A72) — never the browser default. On a board that **ranks a
  many-item dimension**, add a **Top N** select (Top 5 / 10 / 20 / All, default Top 10) that caps the
  ranked bars + detail table; leave store-wide blocks (KPIs, headline, a fixed time chart) unfiltered.
- **KPI row.** Big bold number, small uppercase soft label above, delta beneath — on white,
  **borderless** or in a very subtle #F7F6F3 well, never heavy boxes. In compare mode show the
  **prior-period value** alongside the delta (e.g. "▲ 0.5% · from $1.74M"). Colour the delta by effect
  on profit (see [Deltas](#composition)).
- **P&L bar — solid and substantial (the centerpiece).** **Bold, solid bars** with rounded ends and
  real height (~22–30px), NOT thin stubs. Read top to bottom; magnitude scales to the top line (Gross
  Sales = full width). **One bar colour for every row — the solid accent (#AD1A72) — on a clean #F0E9EE
  rail;** rows differ by length, not colour. The three structural rows — **Gross Sales, Net Sales,
  Contribution Margin** — get a **bold label and a subtle #F7F6F3 row background**. Each row: label +
  sub-label left, the bar in the middle, then **three right-aligned columns — NOW · PRIOR · Δ** aligned
  down every row (not a stacked "from $X" note). Subtraction rows prefixed "−".
- **Ranked bars.** Same clean treatment — every bar the solid accent on a #F0E9EE rail; already sorted
  by length. Label + sub-label left, then the same **NOW · PRIOR · Δ** columns past the bar's end,
  aligned down every row — **the prior column is required**. Widths proportional to returned values only.
- **Callouts (Notion notes).** A #F7F6F3 rounded block with a **💡 leading icon** and one or two
  sentences, for a single content-level insight. **Place it directly above the block it interprets** (a
  lede — finding first, chart below), spanning the full content width. One or two per board. The
  top-of-board summary is a **headline, not a callout**.
- **Detail tables — easy to grasp.** Group each theme in a subtle **#F7F6F3 well** with an uppercase
  label. Each row: the metric's **public `title`** on the left ("Gross Sales", "Contribution Margin %")
  — **never the raw cube key** — then the current value in ink, semibold; in compare mode the
  **prior value** (`.secondary`, ink-soft) then the delta, so a row reads *metric · now · vs then · Δ%*.
  **Align numbers with a real grid** (CSS grid or `<table>`) — fixed columns, each numeric column
  right-aligned to an identical edge, tabular figures. Keep one naming convention per measure across the
  whole board. Lay wells in a two-column grid on wide screens (never three), aiming for **~four wells
  (a tidy 2×2)**; fold a thin theme into a neighbour rather than orphan a fifth. No heavy borders, no
  zebra striping.
- **Frame & spacing.** White page, content centered in ~1100–1280px. Comfortable padding; a clear
  vertical rhythm — **~32–44px between major blocks**, ~16–20px within. 8–12px rounding on filled
  blocks. No gradients; shadows a whisper at most; no chart junk.
- **Loading state.** While the first query — or a Window/Compare change — is in flight, show **skeleton
  placeholders** (soft #F7F6F3 blocks shaped like the KPI cards, bar rows, table rows; a gentle shimmer
  is fine). Never a spinner, never empty space, never the prior render's numbers frozen as if current.

## Composition

Compose from the question, not a fixed template. Pick the few measures, the dimension, and the blocks
that answer the one decision the board is for; don't force "sales + profit + media + inventory" onto
every board.

**Pick the visualization by intent** — never heavier than the question needs:

- **A single number that *is* the answer** → a **KPI card** (or fold into the headline). Don't chart
  one number.
- **One measure across the items of one dimension** (categories, products) → **ranked bars**, sorted,
  lead bar accented.
- **How a top line decomposes into profit** (Gross Sales → … → Contribution Margin) → the **P&L bar**.
- **Movement over time** → a **line chart** (Chart.js). Genuine time series only; never for categorical
  comparison — that's bars.
- **Many metrics across many rows, for exact lookup** → a **table**. Lean: a few columns, right-aligned
  numbers, no zebra noise.

**Block vocabulary** (use only the few that fit; one idea per block):
**Header** · **Controls** (Window / Compare / optional Top N selects) · **Headline** (one bold line
stating the finding, key figures in accent) · **KPI cards** · **Ranked bars** · **P&L bar** ·
**Line chart** (Chart.js, real time series only) · **Table** · **Callout** (💡, one insight, above the
block it ledes).

**Deltas — colour + prior value, everywhere.** Wherever a delta appears, also show the **prior-period
value** — never the percent alone. In row/column blocks (P&L bar, ranked bars, detail tables) present it
as **three right-aligned columns: NOW · PRIOR · Δ** sharing column tracks down every row. Reserve the
compact "▲ 0.5% · from $1.74M" wording for standalone KPI cards. Colour by whether the move **helped or
hurt profit**, not its raw sign: green when good for the business (sales/CM up, or a cost — COGS, media,
fulfillment, returns, discounts — down), a **true red (#C0392B)** when it hurts. So "Returns −27.6%" and
"Media −34.5%" read green while "Gross Sales −17.8%" reads red. Deltas stay text-only (▲/▼ + percent).

**Derive the words from the data — never hardcode.** The interpretive parts (headline, the
one-thing-to-notice callout, context sub-labels like "13.7% of net", which bar gets the accent, each
delta's colour) are **computed at render time from the current response**, not typed as fixed strings —
the board re-queries on every open and every Window / Compare change. Pick the subject from the data
(whatever ranks first this period), compute every number and ratio from the response (totals row, member
`format`), then fill a short sentence template. **Degrade honestly** — if the data can't support a
verdict, fall back to the plain summary or omit the line. **No runtime model** — page logic filling
templates, only the Bark data it pulled.

**Assembly order (top to bottom):** Header → Controls → Section label → Headline → KPIs → Evidence
blocks — placing any insight callout **directly above the block it interprets**.

**Rules.** Lead with the finding, not the data. A single number said well beats a chart. Minimize
generated wording — let the data speak; no narrative prose. A dashboard is not a chat: no prompts, no
conversational actions.

**Sandbox constraints.** One self-contained HTML file with all CSS/JS inlined. Light mode only, no web
fonts, no `position:fixed`. Chart.js (from a CDN) is the only charting library, and only for a genuine
time series.

## 5. Publish

Assemble the board (copied or custom) and create it as a Cowork live artifact.

- **Name:** `Bark · <Board> — <Store>` (brand-led so boards group; store last) — e.g. "Bark · P&L —
  Acme Hats". Keep the store's official casing and a short board label ("P&L", "Media").
- **id (set separately):** the Cowork sidebar label derives from the `id`, and sanitisation strips
  non-alphanumerics (so "P&L" collapses to "PL"). Make the `id` a **kebab-case slug of the board then
  the store** (no `Bark` prefix), lowercase letters/digits/hyphens, spelling symbols out — **`&` → `n`
  or `and`**: e.g. `profit-loss-acme-hats`, `heroes-n-bleeders-acme-hats`. Name the output file
  `<id>.html`.
- List every Bark tool the page calls in `create_artifact`'s `mcp_tools` (the fully-qualified names).

**Build quietly, then tell the user** in one or two sentences: it's live, the Window and Compare
controls re-query Bark, and it re-pulls fresh data each time they open it. Don't paste numbers into
chat or narrate the build steps.

## Modify an existing board

Re-run `copy-template.mjs` with the updated inline config (or re-author the HTML), and `update_artifact`
with the **same id and name** — don't spawn a new one.

## Templates / board catalog

Templates in `templates/` are **both** copyable ready boards **and** style examples for custom builds.
When one matches, [copy it](#3-copy-a-matching-template); otherwise build from the spec, using the
closest template for styling. Figures/product names in the specs are **illustrative placeholders** —
never bake a real store's products or numbers into a board; compute them from the live response.

Available templates:

- [`templates/profit-loss.template.html`](templates/profit-loss.template.html) — **P&L (demand →
  profit)**, the default board: the margin structure, "where the money goes between sales and profit".
  KPIs (Net Sales, CM, CM %, Media % of net) → the **P&L bar** (Gross Sales → − Discounts → − Returns →
  **Net Sales** → − COGS → − Fulfillment → − Payments → − Media → **Contribution Margin**) → **~four
  detail-table wells** (Sales / Discounts & returns / Margin & profit / Media & traffic), each row
  *metric · now · prior · Δ*. Copy it, or open it as the style reference for a custom board.
- [`templates/cm-heroes-bleeders.template.html`](templates/cm-heroes-bleeders.template.html) —
  **Contribution Margin — Heroes & Bleeders**: product-level CM. KPIs (Total CM, CM %, top-5 share,
  media on bleeders) → **Heroes table** (top 10 by CM) → **Bleeders table** (CM < 0, worst first, CM in
  red). Excludes service/returns-only line items; a low-stock bleeder with media riding it is
  exposure–inventory misalignment; media is view-share, not a per-SKU budget.
- [`templates/category-analysis.template.html`](templates/category-analysis.template.html) —
  **Category Analysis (where the margin lives)**: per `products.category`. KPIs (Net Sales, CM, CM %,
  Media) → **CM over time** (fixed trailing-12-month Chart.js line, top 5 categories, NOT tied to the
  Window) → **CM by category** (ranked bars) → **category detail table**. `products.category` is a clean
  split (safe to rank and sum); non-merchandise categories are excluded.

The boards below are the roadmap (added as real templates over time):

- **POAS & Channels (media efficiency)** — Window scopes the whole board. **Blended POAS over time**
  (line chart, resolution matched to the window, dashed **breakeven at 0**) → **by-channel table**
  (Net Sales · Net Δ · Media · CM · CM Δ · POAS, "All channels" totals row; negative CM / sub-breakeven
  POAS in red; hide rows with no net sales). Channel = normalized UTM source; media is view-share.

## Watch out for

- **Scope.** Don't trigger on analysis/research questions — answer those, then *offer* a board.
- **Honesty.** Render only fields Bark returned; omit a missing value's block rather than show a
  placeholder `$0`/`—`. Bar widths track returned values only.
- **Public names only.** Label with the member `title` (never the raw `sales.grossSalesAmount` key) and
  the public storefront name for products/categories (never an internal handle or SKU). One naming
  convention per measure across the board.
- **Totals.** Read the `totals` row; never self-sum data rows.
- **Compare-mode columns.** The plain measure key is absent — read `<key>.primary`, `<key>.secondary`,
  `<key>.changePercent`. Numbers are strings; convert before math.
- **Store-level-only metrics.** Sessions and Sessions CVR are null below store level — use Views /
  Views CVR in grouped blocks.
- **Many-to-many dimensions.** Tags/collections fan out — filter with them, don't split revenue.
- **Tool names.** The Bark MCP prefix is install-specific — discover the real names at runtime and list
  every tool the page calls in `create_artifact`'s `mcp_tools`.
- **Bridge & session.** `callMcpTool` returns failures as `{ isError: true }` plain text — check
  `isError` before any `JSON.parse`. Pull `sessionId` from the JSON block (or `structuredContent`),
  never stringify-and-regex. Mint a fresh session each load; the build-time id is dead on reopen. Guard
  every array before iterating. See [the Cowork bridge](#calling-bark-from-inside-the-artifact-the-cowork-bridge).
- **Sandbox limits.** Light mode only, no web fonts, no `position:fixed`; Chart.js only, for genuine
  time series.
- **Calm.** One accent; muted deltas (text only); editorial labels and one-line verdicts, never
  narrative prose.
