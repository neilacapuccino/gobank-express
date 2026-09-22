import type { Metadata } from "next";
import { DashboardScreen } from "~/features/account/components/dashboard-screen";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  return <DashboardScreen account={await api.account.overview()} />;
}
