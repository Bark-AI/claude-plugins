// build:renderer — bundle the React renderer into a single self-contained HTML.
// Uses Bun.build (not the CLI) so the Tailwind plugin runs: `compile: true` +
// `target: "browser"` inlines all JS/CSS into one index.html.
import tailwind from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["./index.html"],
  target: "browser",
  compile: true,
  minify: true,
  outdir: "dist/renderer",
  plugins: [tailwind],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log("Built dist/renderer");
