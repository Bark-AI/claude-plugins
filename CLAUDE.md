# CLAUDE.md

Guidance for working in this repo. Keep it current as things change.

## What this is

The **Bark plugin marketplace** for Claude — a public GitHub repo that distributes Bark AI plugins
for **Claude Cowork** (not Claude Code). Marketplace manifest: `.claude-plugin/marketplace.json`
(name `bark-marketplace`). It is **not open source** — proprietary, source-available so Bark
customers can install the plugins (see `LICENSE`).

## Layout

- `.claude-plugin/marketplace.json` — marketplace catalog (lists plugins).
- `plugins/bark-cowork/` — the plugin: Bark MCP connector (`.mcp.json`) + the `design-dashboard` skill.
- `plugins/bark-cowork/skills/design-dashboard/` — `SKILL.md` (how to design Bark dashboards in Cowork),
  `templates/` (prepackaged dashboard HTMLs, each with an inlined config block), and
  `scripts/copy-template.mjs`.
- `.github/workflows/validate.yml` — CI runs `claude plugin validate .` on Node 24.

An exploratory **Bun + React (json-render)** renderer — a possible v1 direction — lives on the
**`v1-alpha`** branch, not `main`.

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

- **Two paths:** (a) **copy a matching prepackaged template** (`templates/*.html`), injecting the store
  config via `scripts/copy-template.mjs`; or (b) **design a custom board** following the design system in
  `SKILL.md`, using the templates as style examples. Then publish as a Cowork live artifact via
  `create_artifact` (which points at a file, so the built HTML is copied, not re-emitted).
- **Config** (`storeId, storeName, currencyCode, timezone, boardName`) is passed to `copy-template.mjs`
  as an **inline JSON string** — never a `config.json` file (don't litter the merchant's working folder).
  The script replaces the template's inlined `<script id="bark-dashboard-config">` block; the board reads
  it at load to query/format Bark.
- Templates are **dual-purpose**: copyable ready boards *and* the style reference for custom builds.
  Roadmap boards: P&L, Heroes & Bleeders, Category Analysis, POAS & Channels.
- Artifact **name** `Bark · <Board> — <Store>` (store last); **id** kebab slug `board-then-store`, with
  `&` → `n`/`and` (e.g. `profit-loss-acme-hats`).
- Reference bundled scripts/templates with **`${CLAUDE_SKILL_DIR}`**, not `${CLAUDE_PLUGIN_ROOT}` (the
  latter is a host path absent in the Cowork bash sandbox). Keep a scoped `find /sessions … -print -quit`
  fallback (never `find /`).
