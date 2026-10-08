import type { Metadata } from "next";
import { PageHeader } from "~/shared/ui/page-header";

export const metadata: Metadata = {
	title: "Activity",
};

export default function TransactionsPage() {
	return <PageHeader title="Activity" back="/dashboard" />;
}
