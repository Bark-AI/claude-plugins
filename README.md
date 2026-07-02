# Bark AI Plugins for Claude

A marketplace of [Claude](https://claude.ai) plugins that help **Bark AI** users get more
out of Bark inside **Claude Web** and **Claude Cowork**.

> These plugins are built for Claude Web / Cowork — they use **Skills** and **MCP
> connectors**, not Claude Code commands or hooks.

[Bark AI](https://bark-ai.com) is the profit engine for DTC brands: it harmonizes
Shopify, Magento, Amazon, Meta, Google, GA4, ERP, fulfillment, inventory, and COGS into
one product-level P&L graph. These plugins teach Claude how to use Bark to answer real
business questions — what's profitable, what to discount, where to spend.

## Available plugins

| Plugin | Description |
|--------|-------------|
| [`bark-ai`](./plugins/bark-ai) | The Bark MCP connector for Claude. Skills will be added over time. |

## Install

This repository is a **Claude plugin marketplace**. To use it:

1. In Claude (Web or Cowork), add this marketplace by its repository URL.
2. Browse the available plugins and install **`bark-ai`**.
3. Authenticate the **Bark AI** connector with your Bark account when prompted.
4. Start chatting — ask *"What's working in my store this week?"* and Claude will use
   the Bark connector to answer.

The marketplace manifest lives at [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json).

## Repository layout

```
.
├── .claude-plugin/
│   └── marketplace.json      # Marketplace manifest (lists all plugins)
├── plugins/
│   └── bark-ai/              # The Bark AI plugin (MCP connector)
│       ├── .claude-plugin/
│       │   └── plugin.json   # Plugin manifest
│       ├── .mcp.json         # Bark MCP connector config
│       └── README.md
├── bark-skills/              # Bark Skills — independent of the marketplace,
│   └── README.md             #   distributed via the Bark MCP server (see below)
├── .github/workflows/
│   └── validate.yml          # CI: runs `claude plugin validate` on every push/PR
└── LICENSE
```

## Bark Skills

The [`bark-skills/`](./bark-skills) folder is the version-controlled source of truth for
**Bark Skills** — reusable playbooks that run when Claude is connected to the Bark MCP
server. They are **independent of this plugin marketplace**: distributed and deployed
through Bark MCP (`bark_manage_skill`), not installed by the plugin. See
[`bark-skills/README.md`](./bark-skills/README.md).

## License

[MIT](./LICENSE) © Bark AI
