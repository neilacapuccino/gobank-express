import { Bell, User } from "lucide-react";
import Link from "next/link";
import { MAX_STASHES } from "~/shared/lib/money";
import type { RouterOutputs } from "~/trpc/react";
import { firstName } from "../account.rules";
import { BalanceCard } from "./balance-card";
import { FeatureGrid } from "./feature-grid";
import { GoMenu } from "./go-menu";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";

type Overview = RouterOutputs["account"]["overview"];

export function DashboardScreen({ account }: { account: Overview }) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-8 pb-28">
        <header className="flex items-center justify-between">
          <Link
            href="/settings"
            aria-label="Profile and settings"
            className="bg-surface-sunken text-ink-soft hover:bg-surface-raised grid h-10 w-10 place-items-center rounded-full transition-colors"
          >
            <User size={18} strokeWidth={1.9} aria-hidden />
          </Link>
          <p className="text-ink-soft text-[13.5px]">
            Good day,{" "}
            <span className="text-ink font-medium">{firstName(account)}</span>
          </p>
          <button
            type="button"
            aria-label="Notifications"
            className="bg-surface-sunken text-ink-soft hover:bg-surface-raised grid h-10 w-10 place-items-center rounded-full transition-colors"
          >
            <Bell size={18} strokeWidth={1.9} aria-hidden />
          </button>
        </header>

        <BalanceCard
          balance={account.balance}
          accountNumber={account.accountNumber}
          points={account.points}
        />

        <QuickActions />

        <FeatureGrid
          points={account.points}
          stashCount={account._count.stashes}
          stashLimit={MAX_STASHES}
        />

        <RecentActivity entries={account.transactions} />
      </div>

      <GoMenu />
    </>
  );
}
