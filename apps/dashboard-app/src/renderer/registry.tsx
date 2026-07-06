import { defineRegistry } from "@json-render/react";
import { catalog } from "@catalog";
import { Dashboard } from "./components/catalog/dashboard";
import { Header } from "./components/catalog/header";
import { Body } from "./components/catalog/body";
import { Footer } from "./components/catalog/footer";
import { Markdown } from "./components/catalog/markdown";

// Adapt json-render's render props ({ props, children }) to the plain components.
export const { registry } = defineRegistry(catalog, {
  components: {
    Dashboard: ({ children }) => <Dashboard>{children}</Dashboard>,
    Header: ({ props }) => <Header store={props.store} board={props.board} />,
    Body: ({ children }) => <Body>{children}</Body>,
    Footer: () => <Footer />,
    Markdown: ({ props }) => <Markdown content={props.content} />,
  },
});
