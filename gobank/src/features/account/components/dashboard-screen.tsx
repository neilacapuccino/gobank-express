import Link from "next/link";
import { MAX_STASHES } from "~/shared/lib/money";
import { PocketIcon } from "~/shared/ui/pocket-art";
import { GoMenu } from "./go-menu";
import type { RouterOutputs } from "~/trpc/react";
import { firstName } from "../account.rules";
import { BalanceCard } from "./balance-card";
import { FeatureGrid } from "./feature-grid";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";
type Overview = RouterOutputs["account"]["overview"];
export function DashboardScreen({ account }: { account: Overview }) {
  return (
    <div className="-mx-6 -mt-8 -mb-10 flex flex-1 flex-col gap-6 bg-linear-to-b from-[#c8f1f4] via-[#e5f5f6] to-[#f4f9fa] px-5 pt-7 pb-28 [&_.text-ink-muted]:text-[#53616f]">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[.2em] text-[#282938] uppercase">
            GoBank
            <span className="ml-1 font-normal text-[#53616f]"> / Express</span>
          </p>
          <h1 className="mt-1.5 truncate text-[23px] font-semibold tracking-tight text-[#282938]">
            Hello, {firstName(account)}
            <span className="text-[#00a8ba]">.</span>
          </h1>
        </div>
        <Link
          href="/settings"
          aria-label="Profile and settings"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/80 bg-white/80 text-[#282938] transition-colors hover:bg-white"
        >
          <PocketIcon name="profile" width={20} height={20} />
        </Link>
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
      <div className="rounded-[24px] border border-white bg-white p-4 shadow-[0_6px_20px_-10px_#256d8030]">
        <RecentActivity entries={account.transactions} />
      </div>
      <GoMenu />
    </div>
  );
}
