import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { compileSpecStream, type Spec } from "@json-render/core";
import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/react";
import { Streamdown } from "streamdown";
import { catalog } from "@catalog";

// Map each catalog component to its React implementation.
const { registry } = defineRegistry(catalog, {
  components: {
    Markdown: ({ props }) => <Streamdown>{props.content}</Streamdown>,
  },
});

// Read the spec embedded in the page (inject-spec fills #dashboard-spec at
// publish time; falls back to a placeholder for `bun dev`).
// Compile the JSONL patch stream embedded at build time (build.mjs fills #dashboard-spec)
// into a spec. Falls back to a placeholder for `bun dev`, before any spec is injected.
function readSpec(): Spec {
  const text = document.getElementById("dashboard-spec")?.textContent?.trim();
  if (text) {
    try {
      // Before injection the slot holds the placeholder, which yields no root → fallback.
      const spec = compileSpecStream(text) as unknown as Spec;
      if (spec?.root) return spec;
    } catch {
      /* invalid / not injected yet — fall through to the placeholder */
    }
  }
  return {
    root: "md",
    elements: {
      md: {
        type: "Markdown",
        props: { content: "# Bark dashboard\n\nInject a spec to render this board." },
        children: [],
      },
    },
  } as Spec;
}

const spec = readSpec();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JSONUIProvider registry={registry} initialState={spec.state ?? {}}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  </StrictMode>,
);
