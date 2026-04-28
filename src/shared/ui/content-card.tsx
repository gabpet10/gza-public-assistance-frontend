import clsx from "clsx";

type ContentCardProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function ContentCard({ children, className }: ContentCardProps) {
  return (
    <div
      className={clsx(
        "rounded-[26px] border border-[color:var(--border-soft)] bg-[color:var(--background-soft)] p-5 shadow-panel backdrop-blur-[2px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
