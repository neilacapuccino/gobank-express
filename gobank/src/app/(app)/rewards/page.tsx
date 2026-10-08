import type { Metadata } from "next";
import { PageHeader } from "~/shared/ui/page-header";

export const metadata: Metadata = {
	title: "Rewards",
};

export default function RewardsPage() {
	return <PageHeader title="Rewards" back="/dashboard" />;
}
