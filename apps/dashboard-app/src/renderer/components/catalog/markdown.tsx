import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export type MarkdownProps = {
  content: string;
  className?: string;
};

// Markdown prose via streamdown. Placeholder styling.
export const Markdown = ({ content, className }: MarkdownProps) => (
  <Streamdown className={cn("text-sm leading-relaxed", className)}>{content}</Streamdown>
);
