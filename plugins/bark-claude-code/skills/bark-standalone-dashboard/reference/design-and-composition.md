# Design system + what makes a good Bark dashboard

Two things live here: the **visual system** (so every board looks like Bark) and the **composition
principles** (so a board communicates a decision instead of dumping data). The three bundled examples
are the concrete reference — open the closest one and match it. `profit-loss.html` is the strongest
example of the principles below.

## Contents
- [The feel](#the-feel)
- [Palette](#palette)
- [Header lockup (identical on every board)](#header-lockup-identical-on-every-board)
- [Controls](#controls)
- [Block vocabulary](#block-vocabulary)
- [What makes a good dashboard](#what-makes-a-good-dashboard)
- [Deltas — colour by profit effect](#deltas--colour-by-profit-effect)
- [States: loading, empty, error, connect](#states-loading-empty-error-connect)

## The feel

Aim for the calm of a well-made Notion doc: a **white** page, **system sans-serif** type, lots of
whitespace, almost no borders, and a **single** Bark-magenta accent used only to mark what matters.
Light mode only. Content centered in ~1100–1280px. `~32–44px` between major blocks, `~16–20px` within.
8–12px rounding on filled blocks. No gradients; shadows a whisper at most; no chart junk.

A deployed page can freely use web fonts and a CDN chart library, but the house style is
**system fonts** — keep it unless there's a reason:
`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Use
`font-variant-numeric: tabular-nums` on every number so digits don't jitter.

## Palette

Copy these CSS variables verbatim (they're in every example's `:root`).

| Role        | Hex     | Where it's used                                                   |
|-------------|---------|-------------------------------------------------------------------|
| Page        | #FFFFFF | page background — white, not cream                                |
| Block       | #F7F6F3 | subtle fill — callouts, wells, KPI wells                          |
| Ink         | #1A1714 | primary text (near-black)                                         |
| Ink-soft    | #6B635B | labels, sub-labels, meta                                          |
| Hairline    | #EAE7E1 | the few thin dividers                                             |
| Accent      | #AD1A72 | the ONE highlight — all chart bars, key figure, link, accent text |
| Accent-tint | #F0E9EE | bar rail (track) and soft fills                                   |
| Up          | #2F6E4F | positive delta text                                               |
| Down        | #C0392B | decrease delta text — a TRUE red, distinct from the brand magenta |
| Bark Indigo | #252751 | the "Bark" wordmark in the header                                 |
| Spark       | #EA43E2 | the magenta asterisk in the logo — not a UI accent                |

## Header lockup (identical on every board)

Lead with the Bark logo lockup, sized the same every time: wordmark **Bark** at 26px/700 in Bark Indigo;
magenta spark **✱** at 16px (#EA43E2) ~4px right of the wordmark; a 1px×22px hairline divider with ~14px
gap each side; then the **store name** at 16px/600 ink and the **board label** beneath at 13px ink-soft.
Right-aligned: a small "Data updated …" stamp at 13px ink-soft, and (deployable-specific) a small
**Disconnect** control beneath it. The selects already show the period — don't also print a dateline.

## Controls

Two `select` dropdowns under the header (not button rows), wired to re-query on change:

- **Window** — 7d / 30d / 90d / MTD / YTD (default 30d unless the ask implies otherwise).
- **Compare** — None / Preceding period / Last year (default: preceding period, or last year for
  seasonal stores).

Style the focus ring in the accent (#AD1A72), never the browser default. On a board that ranks a
many-item dimension, add a **Top N** select (Top 5/10/20/All, default Top 10) that caps the ranked
bars + detail table; leave store-wide blocks (KPIs, a fixed time chart) unfiltered.

## Block vocabulary

Use only the few blocks that fit — one idea per block, space between.

- **Headline** — one bold line stating the finding, key figures in accent. Computed from the data
  every render, never hardcoded.
- **KPI cards** — big bold number, small uppercase soft label, delta beneath. On white, borderless or
  in a subtle #F7F6F3 well. In compare mode show the prior value alongside the delta
  (`▲ 0.5% · from $1.74M`).
- **P&L bar (waterfall)** — bold solid accent bars on a #F0E9EE rail; rows differ by length, not colour.
  Structural rows (Gross → Net → CM) get a bold label + subtle row fill; deduction rows staircase down.
  Three right-aligned columns **NOW · PRIOR · Δ** aligned down every row.
- **Ranked bars** — one measure across the items of one dimension, sorted, lead bar accented. Same
  NOW · PRIOR · Δ columns past the bar.
- **Line chart** — genuine time series only (Chart.js is fine on a deployed page). Never for categorical
  comparison — that's bars. See `category-analysis.html`.
- **Table / detail wells** — group metrics in #F7F6F3 wells with an uppercase label; each row reads
  *metric · now · prior · Δ* on a real aligned grid, tabular figures, no zebra striping. Aim for a tidy
  2×2 of wells on wide screens.
- **Callout** — a #F7F6F3 rounded block with a 💡 icon and one insight, placed **directly above** the
  block it interprets (finding first, chart below). One or two per board.

## What makes a good dashboard

The examples embody these; hold to them when you build or adapt.

- **Lead with the finding, not the data.** "Your top style carries ~80% of profit," not "a breakdown by
  category." The board answers one decision — pick the measures, dimension, and blocks that serve it;
  don't force sales+profit+media+inventory onto every board.
- **Derive the words from the data — never hardcode.** The headline, the callout, context sub-labels
  ("13.7% of net"), which bar gets the accent, each delta's colour — all computed at render time from
  the current response, because the board re-queries on every open and every control change. Fill a
  short sentence template from the numbers; if the data can't support a verdict, fall back to the plain
  summary or omit the line.
- **Visualize, don't re-analyze.** Take Bark's numbers as given. Read totals from the totals row; don't
  invent figures, recompute, or add caveats Bark didn't make. If it isn't in the response, it isn't on
  the board.
- **A single number said well beats a chart.** Don't chart one number, and don't add a second chart that
  repeats the first. Match the visual to the intent (KPI for one number, bars for one measure across a
  dimension, waterfall for a top-line decomposition, line only for real time series).
- **One accent, calm throughout.** Deltas are text-only (▲/▼ + percent). Editorial labels and one-line
  verdicts, never narrative prose. A dashboard is not a chat — no prompts, no conversational actions.

## Deltas — colour by profit effect

Wherever a delta appears, also show the **prior value** — never the percent alone. Colour by whether
the move **helped or hurt profit**, not by its raw sign: green when good for the business (sales/CM up,
or a cost — COGS, media, fulfillment, returns, discounts — down), true red (#C0392B) when it hurts. So
"Returns −27.6%" and "Media −34.5%" read **green** while "Gross Sales −17.8%" reads **red**.

```js
// goodWhenDown = true for cost rows (a decrease is good)
function deltaHTML(changePct, goodWhenDown) {
  if (changePct == null) return "";
  const up = changePct >= 0, good = goodWhenDown ? !up : up;
  return `<span class="${good ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(changePct * 100).toFixed(1)}%</span>`;
}
```

## States: loading, empty, error, connect

A deployable board fetches live on every open, so all four states are real UI, not afterthoughts:

- **Loading** — skeleton placeholders shaped like the KPI cards, bar rows, and table rows (a gentle
  shimmer is fine). Never a spinner, never empty space, never last render's numbers frozen as current.
- **Empty** — a block whose query returned nothing renders an empty-state ("No category data for this
  period."), never a crash. Default every array to `[]` on read and null-guard nested lookups.
- **Error** — a data/transport error shows an inline error card with the message; it does not blank the
  board.
- **Connect / expired** — before auth (or after a session that can't refresh) show the **connect gate**
  (Bark lockup + one line + a "Connect Bark" button), not an error. The render catch routes
  `not-authenticated` / `session-expired` to the gate.
