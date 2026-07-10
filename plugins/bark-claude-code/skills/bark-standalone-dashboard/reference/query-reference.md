# Bark query reference (dashboard-specific)

The **authoritative** query DSL and this store's exact measure/dimension keys live in Bark — read them
at runtime, don't guess. You (the building agent) have the Bark MCP tools, so before writing any query:

- read `bark://docs/query-reference` once — the full DSL semantics (date, dimensions, measures,
  filters, compare, ordering);
- read `bark://stores/{storeId}/cubes/sales/members` once **per store** — that store's exact measure and
  dimension keys, their public `title`s, and their `format`s. Stores differ (some expose brand, class, or
  a custom category axis), so read the members for the real store you're building for.

This file only covers the parts specific to putting that data on a **dashboard**: the call shape, the
Window/Compare controls, and how to read the response back.

## The call

```js
await getSession();
const res = await callBark("bark_get_store_analytics", {
  subject: { type: "store", storeId: STORE_ID },
  query: { date, dimensions, measures, order, where, having, limit, totals: true },
  _annotations: ANN(),           // { sessionId, activeTurn:{ idx, user, context } } — REQUIRED
});
```

- `measures` / `dimensions` are arrays of `{ key }` (keys from the members resource). The time axis is a
  dimension `{ key: "date", resolution: "day"|"week"|"month" }`.
- Always set `totals: true` and read headline figures from the **totals row**, never by summing rows.
- `where` filters rows pre-aggregation: `{ key, operator, value }` with operators `equals`,
  `includes`/`excludes` (value = array), `like`, `gt`/`gte`/`lt`/`lte`.
- The Bark session id from `bark_start_session` must be in `_annotations.sessionId` on every call.

## Time presets (Window control)

Use the relative templates verbatim — Bark applies the store timezone; never add a time component.

| Preset        | `date`                                |
|---------------|---------------------------------------|
| Last 7 days   | `{ from:"now-7d/d",  to:"now/d-1s" }` |
| Last 30 days  | `{ from:"now-30d/d", to:"now/d-1s" }` |
| Last 90 days  | `{ from:"now-90d/d", to:"now/d-1s" }` |
| Month to date | `{ from:"now/M",     to:"now/d-1s" }` |
| Year to date  | `{ from:"now/y",     to:"now/d-1s" }` |

## Comparison (Compare control)

For deltas, switch `date` to compare mode `{ primary, secondary }` (both required). Build `secondary`
from the primary's `from`/`to` with Bark's weekday-aligned helpers (weekday alignment matters in retail):

- **vs preceding period** — `PRECEDING_PERIOD_MATCHING_WEEKDAYS_FROM(<pf>, <pt>)` / `..._TO(<pf>, <pt>)`
- **vs same period last year** — `PREVIOUS_YEAR_PERIOD_MATCHING_WEEKDAYS_FROM(<pf>, <pt>)` / `..._TO(<pf>, <pt>)`

`<pf>`/`<pt>` are the primary preset's `from`/`to`, embedded literally. "None" sends the single-period
`date` (no `secondary`).

```js
function dateSpec(winKey, cmpKey) {
  const p = WIN[winKey];
  if (cmpKey === "none") return { from: p.from, to: p.to };
  const fn = cmpKey === "yoy" ? "PREVIOUS_YEAR_PERIOD_MATCHING_WEEKDAYS" : "PRECEDING_PERIOD_MATCHING_WEEKDAYS";
  return {
    primary: { from: p.from, to: p.to },
    secondary: { from: `${fn}_FROM(${p.from}, ${p.to})`, to: `${fn}_TO(${p.from}, ${p.to})` },
  };
}
```

## Response shape

Returns `{ members, data: { columns, rows, totals }, stats }`.

- `data.columns` — column keys in order. `data.rows` — rows aligned to columns. `data.totals` — one
  array aligned to columns (dimension cells are `null`).
- `members[]` — `{ key, title, format, … }`; use `title` for labels and `format`
  (`currency`|`integer`|`percent`|`decimal`) for display. **Never** show the raw cube key.
- **Single-period:** a measure is one column under its plain key (`sales.netSalesAmount`).
- **Compare mode:** each measure expands into FOUR columns — `<key>.primary`, `<key>.secondary`,
  `<key>.changeAmount`, `<key>.changePercent` (a fraction: `-0.178` = −17.8%). Detect compare mode by
  whether `"<key>.primary"` is in `columns`.
- All numbers arrive as **strings** — convert before math. Build a column-key → index map once and reuse.

```js
const colMap = cols => { const m = {}; cols.forEach((c, i) => m[c] = i); return m; };
const isCompare = cols => cols.some(c => c.endsWith(".primary"));
function read(key, cols, cm, row) {                    // -> { now, prior, changePct }
  if (isCompare(cols)) return {
    now: num(row[cm[key + ".primary"]]), prior: num(row[cm[key + ".secondary"]]),
    changePct: num(row[cm[key + ".changePercent"]]),
  };
  return { now: num(row[cm[key]]), prior: null, changePct: null };
}
```

## Measures & dimensions — get them from the members resource

Don't hardcode a measure list from memory — the members resource is the source of truth for keys,
`title`s, and `format`s, and it's store-specific. As orientation, the bundled examples lean on a small
core: `sales.netSalesAmount`, `sales.grossSalesAmount`, `sales.discountsAmount`, `sales.returnsAmount`,
`sales.cogsAmount`, `sales.ordersCount`, `sales.avgOrderValue`, `derivatives.contributionMarginAmount`,
`derivatives.contributionMarginPercentage`, `derivatives.mediaCostAmount`,
`derivatives.mediaCostPercentage`, `derivatives.revenueOnAdSpend`, `derivatives.profitOnAdSpend`, and
`traffic.viewsCount` / `derivatives.viewsConversionRate`; grouped by dimensions like `products.category`,
`products.title`, and `date` (with `resolution`). Confirm every key against the members resource before
using it, and prefer that resource's `title`/`format` for display.

## Rules that keep the numbers honest

- **Totals row is truth.** Read headline figures from `data.totals`; never self-sum rows.
- **Compare-mode columns.** The plain measure key is absent in compare mode — read `<key>.primary` /
  `<key>.secondary` / `<key>.changePercent`. Numbers are strings; convert first.
- **Public names only.** Label with the member `title` and the public storefront name for
  products/categories — never a raw cube key or internal handle/SKU. One naming convention per measure
  across the whole board.
- **Many-to-many dimensions fan out.** Tags and collections can attach a product to several rows — use
  them to `where`-filter, not to split revenue.
- **Store-level-only metrics.** Some metrics (e.g. Sessions and Sessions CVR) are null below store level
  — use view-based equivalents in grouped blocks. The members resource and query-reference doc spell out
  which.
- **Render only what Bark returned.** If a field is missing, omit its block rather than show a
  placeholder `$0` / `—`. Bar widths track returned values only. Don't recompute or add caveats Bark
  didn't make.
