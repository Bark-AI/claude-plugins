#!/usr/bin/env node
// Inject a dashboard spec (JSONL patch stream) into the bundled template and write it to the
// working dir. Dumb inline — the spec file's contents replace __DASHBOARD_SPEC__; the renderer
// (json-render's compileSpecStream) parses the JSONL into a spec at load.
//
// Usage: node build.mjs <spec.jsonl> [output.html]   (output defaults to ./dashboard.html)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), "..", "templates", "dashboard.template.html");
const PLACEHOLDER = "__DASHBOARD_SPEC__";

function fail(msg) {
  console.error(`build.mjs: ${msg}`);
  process.exit(1);
}

const [specArg, outArg] = process.argv.slice(2);
if (!specArg) fail("Usage: node build.mjs <spec.jsonl> [output.html]");

let spec, template;
try {
  spec = readFileSync(resolve(specArg), "utf8");
} catch (e) {
  fail(`could not read spec "${specArg}": ${e.message}`);
}
try {
  template = readFileSync(TEMPLATE, "utf8");
} catch (e) {
  fail(`could not read template at ${TEMPLATE}: ${e.message}`);
}
if (!template.includes(PLACEHOLDER)) fail(`template is missing the ${PLACEHOLDER} placeholder.`);

// Escape "<" so a value can't break out of the <script> tag (json-render restores it on parse).
// Function replacement avoids "$" in the spec being treated as a replacement pattern.
const embedded = spec.replace(/</g, "\\u003c");
const html = template.replace(PLACEHOLDER, () => embedded);

const outPath = resolve(outArg ?? "dashboard.html");
try {
  writeFileSync(outPath, html, "utf8");
} catch (e) {
  fail(`could not write output to ${outPath}: ${e.message}`);
}

console.log(`Wrote ${outPath}`);
