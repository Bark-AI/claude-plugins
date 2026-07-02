# CLAUDE.md

Guidance for working in this repo. Keep it current as things change.

## What this is

The **Bark plugin marketplace** for Claude — a public GitHub repo that distributes Bark AI plugins
for **Claude Cowork** (not Claude Code). Marketplace manifest: `.claude-plugin/marketplace.json`
(name `bark-marketplace`). It is **not open source** — proprietary, source-available so Bark
customers can install the plugins (see `LICENSE`).

## Layout

- `.claude-plugin/marketplace.json` — marketplace catalog (lists plugins).
- `plugins/bark-cowork/` — the plugin: Bark MCP connector (`.mcp.json`) + `skills/design-dashboard/`
  (build a branded live dashboard as a Cowork artifact).
- `apps/dashboard-app/` — **Bun + React** app (json-render + streamdown) that builds the dashboard
  template the skill uses. Build tooling only; not shipped in the plugin.
- `.github/workflows/validate.yml` — CI runs `claude plugin validate .` on Node 24.

## Hard rules

- **Privacy (critical):** never commit real customer data — real store names, product names, or
  figures (e.g. real Bark stores). Use illustrative placeholders only (e.g. "Acme Hats"). This repo
  is public.
- **License:** proprietary (© Bark A.I. LTD). Do not reintroduce an OSS license.

## Conventions

- **Versioning:** stay in `0.0.x` — **patch bumps only**, no minor. Bump the **plugin only**
  (`plugins/bark-cowork/.claude-plugin/plugin.json` + the matching `plugins[].version` in
  `marketplace.json`, kept equal). Leave marketplace `metadata.version` alone. **Always bump in a
  separate commit** from the change it versions.
- **Cowork updates** reach clients via **auto-sync** (must be enabled); bumping the plugin version is
  what a client picks up.
- **Commits:** Conventional Commits. End each message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  Commit/push only when asked.
- **Validation:** run `claude plugin validate .` after structural changes (new plugin/skill, manifest
  shape). Skip it for text-only edits.

## design-dashboard skill

- Flow: write a spec (JSON) → inject into the bundled template → publish as a Cowork live artifact via
  `create_artifact` (which points at a file, so the template is copied, not re-emitted).
- Artifact **name** `Bark · <Board> — <Store>` (store last); **id** kebab slug `board-then-store`,
  with `&` → `n`/`and` (e.g. `profit-loss-acme-hats`).
- Reference bundled scripts with **`${CLAUDE_SKILL_DIR}`**, not `${CLAUDE_PLUGIN_ROOT}` (the latter is
  a host path absent in the Cowork bash sandbox). Keep a `find /sessions … -print -quit` fallback.

## dashboard-app (Bun)

- **Pure Bun.** Install: `bun install`. Build: `bun run build` (produces the single self-contained
  HTML template and copies it into the skill).
- **Exact-frozen versions** in `package.json` (no carets). `bunfig.toml` enforces a 14-day
  supply-chain age gate (`minimumReleaseAge`, in seconds), excluding `typescript` / `@types`.
- Output is a **single self-contained HTML** (`bun build --compile --target=browser`) with everything
  inlined. At runtime the Cowork sandbox only allows Chart.js/Grid.js/Mermaid from CDN — but bundling
  everything avoids relying on that.
- For the json-render API, use the **`json-renderer-core`** and **`json-renderer-react`** skills
  rather than guessing.
