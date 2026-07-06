import type { ReactNode } from "react";

// Root — stacks Header / Body / Footer vertically. Placeholder styling.
export const Dashboard = ({ children }: { children?: ReactNode }) => (
  <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">{children}</div>
);
