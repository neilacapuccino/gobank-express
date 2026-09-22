import { Bell, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MAX_STASHES } from "~/lib/money";
import { api } from "~/trpc/server";
import { BalanceCard } from "./_components/balance-card";
import { GoMenu } from "./_components/go-menu";
import { QuickActions } from "./_components/quick-actions";
import { RecentActivity } from "./_components/recent-activity";
import { FeatureGrid } from "./_components/feature-grid";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const account = await api.account.overview();
  const name = (account.fullName ?? account.username).split(" ")[0];

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
            Good day, <span className="text-ink font-medium">{name}</span>
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
