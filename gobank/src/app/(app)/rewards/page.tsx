import type { Metadata } from "next";
import { RewardsScreen } from "~/features/rewards/components/rewards-screen";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Rewards",
};

export default async function RewardsPage() {
	return <RewardsScreen initialOverview={await api.account.overview()} />;
}
