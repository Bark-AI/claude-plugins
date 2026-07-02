// build:catalog — serialize the component catalog into an LLM prompt and write
// it to dist/, ready for `publish:catalog` to inline into the skill.
import { catalog } from "@catalog";

// Bark-aligned intro — replaces json-render's generic "You are a UI generator" persona.
// This text is inlined into the skill body (already Claude's instructions), so it reads as
// descriptive reference, not a second-person system persona.
const system = [
  "A Bark dashboard is a json-render spec assembled from the components below — a branded,",
  "data-backed view of a DTC store's Bark metrics (sales, profit / contribution margin,",
  "media / ROAS, inventory), rendered as a live artifact in Claude Cowork. This section defines",
  "the spec format and the available components.",
].join(" ");

const customRules = [
  "Ground every figure in the store's Bark data — never invent numbers Bark did not return.",
  "Lead with the headline finding, then supporting detail; keep the board calm and scannable.",
  "Use only component types from the catalog below.",
];

// Bun.write creates parent directories automatically.
const out = new URL("../dist/catalog/catalog.prompt.md", import.meta.url);
await Bun.write(out, catalog.prompt({ system, customRules }));

console.log(`Wrote ${out.pathname}`);
