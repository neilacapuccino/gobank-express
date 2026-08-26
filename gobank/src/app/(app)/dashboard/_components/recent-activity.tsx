import { ArrowDownLeft, ArrowUpRight, Receipt, Sparkles } from "lucide-react";
import Link from "next/link";
import { peso, shortDate } from "~/lib/format";
import { SectionHeader } from "./section-header";

type Entry = {
  reference: string;
  title: string;
  date: string;
  amount: number;
  kind: "in" | "out" | "bill" | "reward";
};

const ICONS = {
  in: ArrowDownLeft,
  out: ArrowUpRight,
  bill: Receipt,
  reward: Sparkles,
} as const;

export function RecentActivity({ entries }: { entries: Entry[] }) {
  return (
    <section>
      <SectionHeader title="Activity" href="/transactions" />

      <ul className="flex flex-col gap-4">
        {entries.map((entry) => {
          const Icon = ICONS[entry.kind];
          const incoming = entry.amount > 0;
          return (
            <li key={entry.reference}>
              <Link
                href={`/transactions/${entry.reference}`}
                className="group flex items-center gap-3.5"
              >
                <span className="bg-surface-sunken text-ink-soft grid h-10 w-10 shrink-0 place-items-center rounded-full">
                  <Icon size={16} strokeWidth={1.9} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-ink group-hover:text-brand block truncate text-[14px] font-medium transition-colors">
                    {entry.title}
                  </span>
                  <span className="text-ink-muted block text-[12px]">
                    {shortDate(entry.date)}
                  </span>
                </span>
                <span
                  className={
                    incoming
                      ? "text-brand shrink-0 text-[14px] font-semibold tabular-nums"
                      : "text-ink shrink-0 text-[14px] font-semibold tabular-nums"
                  }
                >
                  {incoming ? "+" : "−"}
                  {peso(Math.abs(entry.amount))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
