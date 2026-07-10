# bark-cowork

Build branded, live **Bark dashboards** in **Claude Cowork**. The plugin bundles the Bark AI MCP
connector and a `bark-cowork-dashboard` skill that turns "build me a dashboard for my store" into a
branded live artifact you can reopen and refresh.

> Cowork only. Live-artifact dashboards need a Claude Cowork session (desktop/CLI) — the skill checks
> for `create_artifact` and stops gracefully elsewhere.

## What's inside

```
bark-cowork/
├── .claude-plugin/
│   └── plugin.json                          # plugin manifest
├── .mcp.json                                # Bark AI MCP connector (auto-registers on install)
└── skills/
    └── bark-cowork-dashboard/
        ├── SKILL.md                         # build / modify / publish workflow
        ├── scripts/
        │   └── build.mjs                    # injects a spec into the template → working dir
        ├── spec.example.json                # example spec ({ storeName, boardLabel })
        └── templates/
            └── dashboard.template.html      # branded template with a spec slot
```

## How it works (MVP)

`bark-cowork-dashboard` writes a small **spec** (JSON — currently just the store name and board label),
runs `scripts/build.mjs` to inject the spec into `templates/dashboard.template.html`, and writes the
finished HTML into the working folder. It then publishes that file as a live artifact via
`create_artifact`. The built HTML embeds the spec in a `<script id="dashboard-spec">` block; modify a
board by editing the spec, rebuilding, and calling `update_artifact` with the same id.

The template is currently a branded shell rendered from the spec; data-bound blocks (KPIs, charts,
tables) come from growing the spec + template, not from regenerating HTML per request.

## Install

Add the Bark AI marketplace, then install `bark-cowork`. The Bark connector registers
automatically; authenticate your Bark account when prompted.
