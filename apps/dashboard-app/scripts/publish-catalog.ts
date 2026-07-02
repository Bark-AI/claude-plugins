// publish:catalog — inline the built catalog prompt (dist/catalog.prompt.md)
// into the design-dashboard SKILL.md, between the CATALOG markers.
const promptFile = new URL("../dist/catalog/catalog.prompt.md", import.meta.url);
const skillMd = new URL(
  "../../../plugins/bark-cowork/skills/design-dashboard/SKILL.md",
  import.meta.url,
);

const START = "<!-- CATALOG:START -->";
const END = "<!-- CATALOG:END -->";

const prompt = (await Bun.file(promptFile).text()).trim();
if (!prompt) throw new Error("dist/catalog.prompt.md is empty — run `bun run build:catalog` first.");

const md = await Bun.file(skillMd).text();
const marker = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!marker.test(md)) {
  throw new Error(`SKILL.md is missing the ${START} … ${END} markers.`);
}

const block = `${START}\n\n${prompt}\n\n${END}`;
await Bun.write(skillMd, md.replace(marker, block));

console.log(`Inlined catalog prompt into ${skillMd.pathname}`);
