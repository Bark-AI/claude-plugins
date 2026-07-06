import type { ReactNode } from "react";

// Main content area — holds the composed blocks. Placeholder styling.
export const Body = ({ children }: { children?: ReactNode }) => (
  <main className="flex flex-col gap-4">{children}</main>
);
