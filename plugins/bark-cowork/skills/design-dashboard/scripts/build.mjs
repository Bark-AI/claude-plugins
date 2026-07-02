#!/usr/bin/env node
// Inject a dashboard spec into the template and write the result to the working dir.
//
// Usage:
//   node build.mjs <spec.json> [output.html]
//
// - <spec.json>  path to the dashboard spec (JSON). Must include "storeName";
//                "boardLabel" is optional (defaults to "Dashboard").
// - [output.html] output path (default: ./dashboard.html in the current working dir).
//
// The template ships in the sibling ../templates/dashboard.template.html and contains the
// token __DASHBOARD_SPEC__, which is replaced with the spec JSON.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
// Template lives in the sibling templates/ dir (this script is in scripts/).
const TEMPLATE = join(SCRIPT_DIR, "..", "templates", "dashboard.template.html");
const PLACEHOLDER = "__DASHBOARD_SPEC__";

function fail(msg) {
  console.error(`build.mjs: ${msg}`);
  process.exit(1);
}

const [specArg, outArg] = process.argv.slice(2);
if (!specArg) fail("Usage: node build.mjs <spec.json> [output.html]");

// Read + validate the spec.
let spec;
try {
  spec = JSON.parse(readFileSync(resolve(specArg), "utf8"));
} catch (e) {
  fail(`could not read/parse spec "${specArg}": ${e.message}`);
}
if (!spec || typeof spec !== "object") fail("spec must be a JSON object.");
if (!spec.storeName) fail('spec must include a "storeName".');
if (!spec.boardLabel) spec.boardLabel = "Dashboard";

// Read the template.
let template;
try {
  template = readFileSync(TEMPLATE, "utf8");
} catch (e) {
  fail(`could not read template at ${TEMPLATE}: ${e.message}`);
}
const occurrences = template.split(PLACEHOLDER).length - 1;
if (occurrences === 0) fail(`template is missing the ${PLACEHOLDER} placeholder.`);
if (occurrences > 1) fail(`template has ${occurrences} ${PLACEHOLDER} placeholders; expected exactly one.`);

// Embed the spec as JSON, escaping "<" so a value can't break out of the <script> tag.
const specJson = JSON.stringify(spec).replace(/</g, "\\u003c");
const html = template.replace(PLACEHOLDER, specJson);

// Write to the working dir.
const outPath = resolve(outArg ?? "dashboard.html");
try {
  writeFileSync(outPath, html, "utf8");
} catch (e) {
  fail(`could not write output to ${outPath}: ${e.message}`);
}

console.log(`Wrote ${outPath} (store: ${spec.storeName}, board: ${spec.boardLabel})`);
