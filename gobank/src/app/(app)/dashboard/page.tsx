// Screen S5 - the hub, showing balance, quick actions, Stashes and recent activity.

import { Bell, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BalanceCard } from "./_components/balance-card";
import { GoMenu } from "./_components/go-menu";
import { QuickActions } from "./_components/quick-actions";
import { RecentActivity } from "./_components/recent-activity";
import { FeatureGrid } from "./_components/feature-grid";

export const metadata: Metadata = {
  title: "Home",
};

const ACCOUNT = {
  name: "Neil",
  accountNumber: "20481174821",
  balance: 23392,
  points: 500,
};

const ACTIVITY = [
  {
    reference: "GB7K4M2Q",
    title: "Sent to @maricel",
    date: "2026-08-25",
    amount: -1250,
    kind: "out" as const,
  },
  {
    reference: "GB7K3X9A",
    title: "Meralco bill",
    date: "2026-08-24",
    amount: -2480.5,
    kind: "bill" as const,
  },
  {
    reference: "GB7K1P5D",
    title: "Received from @dante",
    date: "2026-08-23",
    amount: 5000,
    kind: "in" as const,
  },
];

export default function DashboardPage() {
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
            <span className="text-ink font-medium">{ACCOUNT.name}</span>
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
          balance={ACCOUNT.balance}
          accountNumber={ACCOUNT.accountNumber}
          points={ACCOUNT.points}
        />

        <QuickActions />

        <FeatureGrid />

        <RecentActivity entries={ACTIVITY} />
      </div>

      <GoMenu />
    </>
  );
}
