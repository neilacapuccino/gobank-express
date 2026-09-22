import type { LucideIcon } from "lucide-react";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpRight,
  PiggyBank,
  Receipt,
  Smartphone,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { peso, shortDate } from "~/shared/lib/format";
import type { RouterOutputs } from "~/trpc/react";
import { SectionHeader } from "./section-header";

type Entry = RouterOutputs["account"]["overview"]["transactions"][number];

const ICONS: Record<Entry["kind"], LucideIcon> = {
  deposit: ArrowDownToLine,
  transfer: ArrowUpRight,
  bill: Receipt,
  load: Smartphone,
  stash: PiggyBank,
  reward: Sparkles,
  interest: TrendingUp,
};

export function RecentActivity({ entries }: { entries: Entry[] }) {
  return (
    <section>
      <SectionHeader title="Activity" href="/transactions" />

      {entries.length === 0 ? (
        <div className="bg-surface-sunken flex flex-col items-center gap-1 rounded-2xl px-6 py-8 text-center">
          <p className="text-ink text-[14px] font-medium">No activity yet</p>
          <p className="text-ink-muted text-[13px]">
            Cash in or receive money and it will show up here.
          </p>
          <Link
            href="/deposit"
            className="text-brand hover:text-brand-hover mt-2 text-[13px] font-medium transition-colors"
          >
            Cash in
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((entry) => {
            const incoming = entry.amount > 0;
            const Icon =
              entry.kind === "transfer" && incoming
                ? ArrowDownLeft
                : ICONS[entry.kind];
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
                      {shortDate(entry.createdAt)}
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
      )}
    </section>
  );
}
