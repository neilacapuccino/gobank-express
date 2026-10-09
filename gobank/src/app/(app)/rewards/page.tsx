import type { Metadata } from "next";
import { RewardsScreen } from "~/features/rewards/components/rewards-screen";

export const metadata: Metadata = {
	title: "Rewards",
};

export default function RewardsPage() {
	return <RewardsScreen />;
}
