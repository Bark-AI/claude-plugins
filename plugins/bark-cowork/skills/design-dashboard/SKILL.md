---
name: design-dashboard
description: Build a branded, live Bark dashboard in Claude Cowork. Use when the user asks to build, create, make, or set up a Bark dashboard or board for their store — writes a small spec, injects it into the bundled template with the build script, and publishes the result as a live artifact.
---

# Design a Bark dashboard (Cowork live artifact)

Build a branded Bark dashboard by writing a small **spec** (JSON), injecting it into the bundled HTML
template with the build script, and publishing the result as a Cowork live artifact. This is the
placeholder/MVP flow — the spec currently just carries the store name and board label; the
data-driven catalog comes later.

## When this applies

Only when the user asks to **build / create / make / set up a Bark dashboard** (a board / live view)
for their store. A question about the business is not a dashboard request — answer that directly.

## Prerequisites

- **Cowork:** this skill needs Cowork's live-artifact tools. Check that `create_artifact` is
  available before starting; if it isn't, say the dashboard builder only works in a Claude Cowork
  session and stop.
- **Node:** the build script runs with Node (`node`). It ships with this skill — no install needed.

## Files bundled with this skill

```
design-dashboard/
├── scripts/
│   └── build.mjs                   # injects a spec into the template → working dir
├── spec.example.json               # example spec ({ storeName, boardLabel })
└── templates/
    └── dashboard.template.html     # branded template with a __DASHBOARD_SPEC__ slot
```

`${CLAUDE_PLUGIN_ROOT}` points at the plugin, but be aware it's a **host** path that often does
**not** exist inside the bash sandbox — in Cowork the plugin is mounted under
`/sessions/*/mnt/.remote-plugins/*/`. So don't hardcode `${CLAUDE_PLUGIN_ROOT}` in a bash command;
resolve the script path first (see step 2).

## Steps

1. **Write the spec** to a file in the working folder (e.g. `spec.json`). Minimum shape:
   ```json
   { "storeName": "Acme Hats", "boardLabel": "Profit & Loss" }
   ```
   `storeName` is required; `boardLabel` is optional (defaults to "Dashboard"). See
   `spec.example.json` for reference.
2. **Build the dashboard.** First resolve the script path (the `${CLAUDE_PLUGIN_ROOT}` host path may
   not exist in the bash sandbox), then run it — it reads the spec, injects it into the template, and
   writes the finished HTML to the working folder:
   ```bash
   BUILD="${CLAUDE_PLUGIN_ROOT:-}/skills/design-dashboard/scripts/build.mjs"
   [ -f "$BUILD" ] || BUILD="$(find /sessions ~/.claude -path '*/skills/design-dashboard/scripts/build.mjs' -print -quit 2>/dev/null)"
   node "$BUILD" spec.json dashboard.html
   ```
   The scoped `find … -print -quit` stops at the first match — don't `find /` (scanning the whole
   disk prints permission-denied noise and returns a **misleading exit 1** even when the file is
   found). The second arg is the output path (defaults to `./dashboard.html`). **Never edit the
   bundled template in place** — the build always writes a fresh copy to the working dir.
3. **Publish as a live artifact.** Call `create_artifact` pointing at the built `dashboard.html`.
   - **Name:** `Bark · <Board> — <Store>` (store name at the end) — e.g. "Bark · P&L — Acme Hats".
   - **id:** a stable kebab-case slug of the board then the store, `&` → `n`/`and`, e.g.
     `profit-loss-acme-hats`. Reuse the same id when updating an existing board.
4. **Tell the user it's live** in one line — no need to paste the file back into chat.

## To modify an existing board

The built HTML embeds the spec in a `<script id="dashboard-spec">` block. To change a board:

1. Find the artifact by its stable id and read its HTML.
2. Edit the **spec** — either update `spec.json` and re-run `build.mjs`, or edit the embedded spec
   JSON directly.
3. `update_artifact` with the **same id** — don't spawn a new one.

## Notes

- Keep the bundled template and script pristine — always work on the built copy in the working dir.
- This is a starting point: the template is a branded shell rendered from the spec. Richer,
  data-bound dashboards come from growing the spec + template, not from regenerating HTML per request.
