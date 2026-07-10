# bark-claude-code

The Bark AI toolkit for **Claude Code**. Build live, **deployable Bark dashboards** — self-contained
HTML pages that sign the merchant into Bark with OAuth and pull live store analytics by calling Bark's
MCP server directly from the browser, then host them anywhere static.

> Deployable, not in-app. Where `bark-cowork` builds live artifacts inside Claude Cowork, this builds
> standalone web pages you deploy to your own host (Vercel, Netlify, Cloudflare Pages, S3, GitHub
> Pages, any web server).

## What's inside

```
bark-claude-code/
├── .claude-plugin/
│   └── plugin.json                       # plugin manifest
├── .mcp.json                             # Bark AI MCP connector (auto-registers on install)
└── skills/
    └── bark-standalone-dashboard/
        ├── SKILL.md                      # when/how to build a deployable board
        ├── reference/
        │   ├── auth-and-rpc.md           # OAuth (PKCE + DCR) + MCP client — exact code
        │   ├── query-reference.md        # dashboard-specific query bits; defers to live Bark resources
        │   └── design-and-composition.md # Bark design system + good-dashboard principles
        └── examples/
            ├── profit-loss.html          # flagship P&L board
            ├── cm-heroes-bleeders.html   # product-level contribution margin
            └── category-analysis.html    # category CM with a Chart.js time series
```

## How it works

The **MCP connector** gives Claude Code live Bark access while it *builds* — reading the query
reference and this store's cube members so queries are correct. The **skill** teaches Claude Code to
assemble a single self-contained HTML dashboard whose own OAuth + MCP data layer talks to Bark directly
from the browser, so once deployed the page authenticates and refreshes its data on its own — no
backend, no proxy. Copy one of the three example boards (set the store config block) or design a custom
board from the design system, then deploy the file to any static host.

## Install

Add the Bark AI marketplace, then install `bark-claude-code`. The Bark connector registers
automatically; authenticate your Bark account when prompted.
