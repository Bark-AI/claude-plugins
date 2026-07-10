# Bark AI Plugins for Claude

A marketplace of [Claude](https://claude.ai) plugins that help **Bark AI** users get more
out of Bark inside **Claude Cowork**.

> These plugins are built for Claude Cowork — they use **Skills** and **MCP connectors**,
> not Claude Code commands or hooks.

[Bark AI](https://bark-ai.com) is the profit engine for DTC brands: it harmonizes
Shopify, Magento, Amazon, Meta, Google, GA4, ERP, fulfillment, inventory, and COGS into
one product-level P&L graph. These plugins teach Claude how to use Bark to answer real
business questions — what's profitable, what to discount, where to spend.

## Available plugins

- **[`bark-cowork`](./plugins/bark-cowork)** — the Bark AI toolkit for Claude Cowork: the Bark
  MCP connector plus a `bark-cowork-dashboard` skill for building branded, live dashboards.

## Install

This repository is a **Claude plugin marketplace**. To use it:

1. In Claude Cowork, add this marketplace by its repository URL.
2. Browse the available plugins and install **`bark-cowork`**.
3. Authenticate the **Bark AI** connector with your Bark account when prompted.
4. In Cowork, ask *"Build me a dashboard for my store"* — the `bark-cowork-dashboard` skill
   creates a branded live artifact that re-pulls fresh Bark data.

The marketplace manifest lives at [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json).

## Repository layout

```
.
├── .claude-plugin/
│   └── marketplace.json              # Marketplace manifest (lists all plugins)
├── plugins/
│   └── bark-cowork/                  # Bark AI toolkit for Claude Cowork
│       ├── .claude-plugin/
│       │   └── plugin.json           # Plugin manifest
│       ├── .mcp.json                 # Bark MCP connector config
│       ├── README.md
│       └── skills/
│           └── bark-cowork-dashboard/     # Build a Bark dashboard as a live artifact
│               ├── SKILL.md          # Skill: copy template → set header → publish
│               └── templates/
│                   └── dashboard.html  # Branded dashboard template
├── .github/workflows/
│   └── validate.yml                  # CI: runs `claude plugin validate` on push/PR
├── README.md
└── LICENSE
```

## License

Copyright © 2026 Bark A.I. LTD. All rights reserved. This repository is published only so Bark AI
customers can install and use the plugins with Claude — see [`LICENSE`](./LICENSE). It is not
open-source, and the contents may not be copied, modified, or redistributed except as needed to
install and run the plugins.
