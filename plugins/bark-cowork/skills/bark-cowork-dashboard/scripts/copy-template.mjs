#!/usr/bin/env node
// Create a Bark dashboard from a prepackaged template: copy the template and replace its inlined
// config block with the store's config, then write the result to the working dir.
//
// Usage:
//   node copy-template.mjs '<config-json>' <template.html> <output.html>
//
// - <config-json>   store config as an INLINE JSON string (single-quote it in the shell):
//                   { boardName, storeId, storeName, currencyCode, timezone,
//                     tools: { startSession, executeQuery } }
//                   tools.* are the fully-qualified Bark tool names for this session
//                   (mcp__<hash>__bark_start_session / mcp__<hash>__bark_get_store_analytics).
// - <template.html> a prepackaged template from this skill's templates/ dir
// - <output.html>   where to write the finished dashboard
//
// Config is passed on the command line (not a file) so nothing is left in the working folder.
//
// Each template embeds <script type="application/json" id="bark-dashboard-config">…</script> with
// default values; this replaces those values with the config. The template reads the config at load.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_ID = "bark-dashboard-config";
const REQUIRED = ["boardName", "storeId", "storeName", "currencyCode", "timezone"];

function fail(msg) {
  console.error(`copy-template.mjs: ${msg}`);
  process.exit(1);
}

const [configArg, templateArg, outArg] = process.argv.slice(2);
if (!configArg || !templateArg || !outArg) {
  fail("Usage: node copy-template.mjs '<config-json>' <template.html> <output.html>");
}

// Parse + validate the inline config JSON.
let config;
try {
  config = JSON.parse(configArg);
} catch (e) {
  fail(`could not parse inline config JSON: ${e.message}`);
}
const missing = REQUIRED.filter((k) => config[k] === undefined || config[k] === null || config[k] === "");
if (missing.length) fail(`config is missing required field(s): ${missing.join(", ")}`);
if (!config.tools || !config.tools.startSession || !config.tools.executeQuery) {
  fail("config.tools.startSession and config.tools.executeQuery are required — the fully-qualified Bark tool names for this session.");
}

// Read the template.
let template;
try {
  template = readFileSync(resolve(templateArg), "utf8");
} catch (e) {
  fail(`could not read template "${templateArg}": ${e.message}`);
}

// Replace the inlined config block's contents. Escape "<" so a value can't break out of the tag.
const re = new RegExp(`(<script[^>]*id="${CONFIG_ID}"[^>]*>)([\\s\\S]*?)(</script>)`);
if (!re.test(template)) fail(`template has no <script id="${CONFIG_ID}"> block.`);
const json = JSON.stringify(config, null, 2).replace(/</g, "\\u003c");
const html = template.replace(re, (_m, open, _body, close) => `${open}\n${json}\n    ${close}`);

// Write the finished dashboard.
try {
  writeFileSync(resolve(outArg), html, "utf8");
} catch (e) {
  fail(`could not write output "${outArg}": ${e.message}`);
}

console.log(`Wrote ${resolve(outArg)} (${config.boardName} · ${config.storeName})`);
