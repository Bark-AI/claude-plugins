export type HeaderProps = {
  store: string;
  board: string;
};

// Top strip: Bark brand + store + board label. Placeholder styling.
export const Header = ({ store, board }: HeaderProps) => (
  <header className="flex items-baseline gap-3 border-b border-border pb-4">
    <span className="text-2xl font-bold tracking-tight text-[#252751]">
      Bark<span className="text-[#EA43E2]">✱</span>
    </span>
    <span className="text-base font-semibold text-foreground">{store}</span>
    <span className="text-sm text-muted-foreground">{board}</span>
  </header>
);
