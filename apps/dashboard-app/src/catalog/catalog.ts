import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

// The branded Bark component catalog — the typed set of components a dashboard
// spec may reference. `catalog.prompt()` serializes this (names, props, docs)
// for the LLM; the build inlines it into the design-dashboard SKILL.md.
//
// Start with a single component: Markdown (rendered via streamdown).
export const catalog = defineCatalog(schema, {
  components: {
    Markdown: {
      props: z.object({ content: z.string() }),
      description: "Renders a markdown string as formatted rich text.",
    },
  },
  actions: {},
});
