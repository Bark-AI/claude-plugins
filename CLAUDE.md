# CLAUDE.md

Guidance for working in this repo. Keep it current as things change.

## What this is

The **Bark plugin marketplace** for Claude — a public GitHub repo that distributes Bark AI plugins,
one per Claude surface: **`bark-cowork`** (Claude Cowork) and **`bark-claude-code`** (Claude Code).
Marketplace manifest: `.claude-plugin/marketplace.json` (name `bark-marketplace`). It is **not open
source** — proprietary, source-available so Bark customers can install the plugins (see `LICENSE`).

## Layout

- `.claude-plugin/marketplace.json` — marketplace catalog (lists both plugins).
- `plugins/bark-cowork/` — the **Cowork** plugin: Bark MCP connector (`.mcp.json`) + the
  `bark-cowork-dashboard` skill.
- `plugins/bark-cowork/skills/bark-cowork-dashboard/` — `SKILL.md` (how to design Bark dashboards in
  Cowork), `templates/` (prepackaged dashboard HTMLs, each with an inlined config block), and
  `scripts/copy-template.mjs`.
- `plugins/bark-claude-code/` — the **Claude Code** plugin: Bark MCP connector (`.mcp.json`) + the
  `bark-standalone-dashboard` skill.
- `plugins/bark-claude-code/skills/bark-standalone-dashboard/` — `SKILL.md` (how to build a live,
  **deployable** dashboard: a self-contained HTML page that does its own OAuth + MCP), `reference/`
  (auth+RPC, query, design docs), and `examples/` (three ready deployable boards).
- `.github/workflows/validate.yml` — CI runs `claude plugin validate .` on Node 24.

An exploratory **Bun + React (json-render)** renderer — a possible v1 direction — lives on the
**`v1-alpha`** branch, not `main`.

## Hard rules

- **Privacy (critical):** never commit real customer data — real store names, product names, or
  figures (e.g. real Bark stores). Use illustrative placeholders only (e.g. "Acme Hats"). This repo
  is public.
- **License:** proprietary (© Bark A.I. LTD). Do not reintroduce an OSS license.

## Conventions

- **Versioning:** stay in `0.0.x` — **patch bumps only**, no minor. Bump **only the plugin you changed**
  (`plugins/<plugin>/.claude-plugin/plugin.json` + the matching `plugins[].version` in
  `marketplace.json`, kept equal); the two plugins version independently. Bump marketplace
  `metadata.version` only when the **catalog** changes (a plugin added or removed), not for a plugin's
  own content bump. **Always bump in a separate commit** from the change it versions.
- **Updates** reach clients via **auto-sync** (must be enabled); bumping the plugin version is what a
  client picks up.
- **Commits:** Conventional Commits. End each message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  Commit/push only when asked.
- **Validation:** run `claude plugin validate .` after structural changes (new plugin/skill, manifest
  shape). Skip it for text-only edits.

## bark-cowork-dashboard skill

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

## bark-standalone-dashboard skill (in `bark-claude-code`)

- Builds a **deployable** board: one self-contained HTML file that runs its own **OAuth
  (PKCE + dynamic client registration)** and speaks **MCP JSON-RPC directly** to
  `https://app.bark-ai.com/mcp` from the browser — no backend, no host bridge. Deploy to any static host.
- The reusable **auth + MCP data layer** is inlined identically in every example; only the render layer
  differs per board. It's documented with exact code in `reference/auth-and-rpc.md`. Don't rewrite it —
  its shape encodes real quirks (stateless server, SSE responses, `prompt=consent` for a refresh token,
  clock-skew 401 retry, exact-match `redirect_uri`).
- **Config** block (`boardName, storeId, storeName, currencyCode, timezone`) — **no `tools` field**
  (unlike the Cowork boards). Placeholders only in the bundled examples (`storeId: 0`, `"Acme Hats"`);
  never ship a real store id/name.
- The bundled **MCP connector** gives the building agent live Bark access; the skill tells it to read the
  live `bark://docs/query-reference` and `bark://stores/{storeId}/cubes/sales/members` rather than a
  static list. Examples: `profit-loss` (flagship), `cm-heroes-bleeders`, `category-analysis` (Chart.js).
