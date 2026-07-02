# bark-cowork

Build branded, live **Bark dashboards** in **Claude Cowork**. The plugin bundles the Bark AI MCP
connector and a `design-dashboard` skill that turns "build me a dashboard for my store" into a
branded live artifact you can reopen and refresh.

> Cowork only. Live-artifact dashboards need a Claude Cowork session (desktop/CLI) — the skill checks
> for `create_artifact` and stops gracefully elsewhere.

## What's inside

```
bark-cowork/
├── .claude-plugin/
│   └── plugin.json                     # plugin manifest
├── .mcp.json                           # Bark AI MCP connector (auto-registers on install)
└── skills/
    └── design-dashboard/
        ├── SKILL.md                    # build / modify / publish workflow
        └── templates/
            └── dashboard.html          # branded dashboard template (copied per board)
```

## How it works (MVP)

`design-dashboard` copies the bundled `templates/dashboard.html` into the working folder, sets the
header (store name + board label), and publishes it as a live artifact via `create_artifact`. Modify
an existing board by editing its file and calling `update_artifact` with the same id.

The template is currently a branded shell; data-bound blocks (KPIs, charts, tables) are added by
extending the template, not by regenerating HTML per request.

## Install

Add the Bark AI marketplace, then install `bark-cowork`. The Bark connector registers
automatically; authenticate your Bark account when prompted.
