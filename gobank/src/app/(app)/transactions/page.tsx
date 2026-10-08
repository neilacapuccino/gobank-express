import type { Metadata } from "next";
import { ActivityScreen } from "~/features/account/components/activity-screen";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Activity",
};

export default async function TransactionsPage() {
	return (
		<ActivityScreen initialPage={await api.account.activity({ limit: 20 })} />
	);
}
