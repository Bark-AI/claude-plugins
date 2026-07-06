import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

// Root — holds Header / Body / Footer.
export const DashboardPropsSchema = z.object({});

export type DashboardProps = z.infer<typeof DashboardPropsSchema>;

export const DashboardConfig = {
  props: DashboardPropsSchema,
  slots: ["header", "body", "footer"],
  description:
    "Root of the dashboard. Holds exactly three children, in order — a `Header`, a `Body`, and a `Footer` — rendered as a single vertical board.",
};

// Header
export const HeaderPropsSchema = z.object({
  store: z.string().describe("The store this board is for — its official name (e.g. \"Acme Hats\")."),
  board: z.string().describe("Short board label (e.g. \"Profit & Loss\", \"Category Analysis\")."),
});

export type HeaderProps = z.infer<typeof HeaderPropsSchema>;

export const HeaderConfig = {
  props: HeaderPropsSchema,
  slots: [],
  description: "Top strip of the board. Shows the Bark brand, the store name, and the board label.",
};

// Body
export const BodyPropsSchema = z.object({});

export type BodyProps = z.infer<typeof BodyPropsSchema>;

export const BodyConfig = {
  props: BodyPropsSchema,
  slots: ["default"],
  description:
    "Main content area of the board. Append the composed content (Markdown and future blocks) as its children.",
};

// Footer
export const FooterPropsSchema = z.object({});

export type FooterProps = z.infer<typeof FooterPropsSchema>;

export const FooterConfig = {
  props: FooterPropsSchema,
  slots: [],
  description: "Bottom strip of the board. Renders the Bark brand line and a data-updated note.",
};

// Markdown
export const MarkdownPropsSchema = z.object({
  content: z.string().describe("A markdown string, rendered as formatted rich text."),
});

export type MarkdownProps = z.infer<typeof MarkdownPropsSchema>;

export const MarkdownConfig = {
  props: MarkdownPropsSchema,
  slots: [],
  description: "Renders a markdown string as formatted rich text. Use for any prose longer than a label.",
};

export const catalog = defineCatalog(schema, {
  components: {
    Dashboard: DashboardConfig,
    Header: HeaderConfig,
    Body: BodyConfig,
    Footer: FooterConfig,
    Markdown: MarkdownConfig,
  },
  actions: {},
});
