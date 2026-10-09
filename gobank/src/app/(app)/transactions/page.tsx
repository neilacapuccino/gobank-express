import type { Metadata } from "next";
import { ActivityScreen } from "~/features/activity/components/activity-screen";

export const metadata: Metadata = {
	title: "Activity",
};

export default function TransactionsPage() {
	return <ActivityScreen />;
}
