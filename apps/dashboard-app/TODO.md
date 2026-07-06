# dashboard-app — TODO

## Embed Inter (self-hosted, offline)

Right now the renderer uses the **system sans stack** + `tabular-nums` for numbers (no embedded
fonts). That's sandbox-safe and looks clean, but the same board renders as SF on macOS, Segoe UI on
Windows, Roboto on ChromeOS. Embed Inter for **cross-platform-consistent, branded** typography
(biggest win on Windows).

**Constraint:** the Cowork sandbox blocks web fonts (no CDN), so the font must be **embedded** —
`Bun.build({ compile: true, target: "browser" })` inlines `woff2` referenced from CSS as `data:` URIs.

**Plan:**
1. `bun add @fontsource-variable/inter` (exact-pinned; age-gated).
2. Import the all-subsets weight axis in `src/renderer/main.tsx`:
   `import "@fontsource-variable/inter/wght.css";`
   Covers latin, latin-ext, cyrillic(+ext), greek(+ext), vietnamese — "generous" coverage.
3. In `src/renderer/globals.css`, set the theme font to Inter first:
   `@theme { --font-sans: "Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
   Helvetica, Arial, sans-serif; }`
4. Keep `tabular-nums` for numeric cells — **no separate mono font** (Inter's tabular figures are
   enough).
5. Verify after `bun run build:renderer`: no external font `url(...)` remains (all `data:`), and the
   artifact grows by **~284 KB** (→ ~1.6 MB). `dist/renderer/index.html`.

**Options / notes:**
- **Italic** is skipped by default (markdown `*emphasis*` falls back to faux/browser italic). To get
  true italics, also import `@fontsource-variable/inter/wght-italic.css` (+~305 KB → ~1.9 MB).
- Inter sits a touch wider/looser than SF; consider `letter-spacing: -0.01em` on body to match.
- Leaner alternative if size matters: latin + latin-ext only (~62 KB).
