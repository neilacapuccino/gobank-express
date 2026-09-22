import Link from "next/link";

export function SectionHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <header className="mb-4 flex items-baseline justify-between">
      <h2 className="text-ink text-[15px] font-semibold tracking-tight">
        {title}
      </h2>
      <Link
        href={href}
        className="text-ink-muted hover:text-brand text-[12.5px] font-medium transition-colors"
      >
        See all
      </Link>
    </header>
  );
}
