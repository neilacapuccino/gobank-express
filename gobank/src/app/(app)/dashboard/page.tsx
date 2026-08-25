// Screen S5 - the hub, showing balance, card, Stashes and recent activity.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col py-6">
      <h1 className="text-ink text-[22px] font-semibold tracking-tight">
        Homepage
      </h1>
      <p className="text-ink-muted mt-2 text-[14.5px]">
        Placeholder. The dashboard is built later.
      </p>
    </div>
  );
}
