import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  PiggyBank,
  Receipt,
  Smartphone,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

type Row = {
  href: string;
  label: string;
  description: string;
  meta?: string;
  icon: LucideIcon;
};

export function FeatureGrid({
  points,
  stashCount,
  stashLimit,
}: {
  points: number;
  stashCount: number;
  stashLimit: number;
}) {
  const rows: Row[] = [
    {
      href: "/rewards",
      label: "GoRewards",
      description: "Turn your points into cash",
      meta: `${points.toLocaleString()} pts`,
      icon: Sparkles,
    },
    {
      href: "/stashes",
      label: "GoalSave",
      description: "Savings goals that earn on their own",
      meta: `${stashCount} of ${stashLimit}`,
      icon: PiggyBank,
    },
    {
      href: "/stocks",
      label: "Stocks",
      description: "Invest from as little as ₱50",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <Link
            key={row.href}
            href={row.href}
            className="group bg-surface-sunken hover:bg-surface-raised flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-colors duration-150"
          >
            <span className="bg-brand-soft text-brand grid h-11 w-11 shrink-0 place-items-center rounded-xl">
              <Icon size={19} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-ink block text-[14px] font-medium">
                {row.label}
              </span>
              <span className="text-ink-muted block truncate text-[12px]">
                {row.description}
              </span>
            </span>
            {row.meta ? (
              <span className="text-ink-soft shrink-0 text-[12.5px] font-medium tabular-nums">
                {row.meta}
              </span>
            ) : null}
            <ChevronRight
              size={16}
              strokeWidth={2}
              aria-hidden
              className="text-ink-faint group-hover:text-ink-muted shrink-0 transition-colors"
            />
          </Link>
        );
      })}

      <div className="mt-0.5 grid grid-cols-2 gap-2.5">
        <Compact href="/bills" label="Pay bills" icon={Receipt} />
        <Compact href="/load" label="Buy load" icon={Smartphone} />
      </div>
    </section>
  );
}

function Compact({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="bg-brand-soft hover:bg-brand-line flex h-14 items-center justify-center gap-2.5 rounded-2xl transition-colors duration-150"
    >
      <Icon
        size={18}
        strokeWidth={1.9}
        aria-hidden
        className="text-brand shrink-0"
      />
      <span className="text-ink text-[13px] font-medium">{label}</span>
    </Link>
  );
}
