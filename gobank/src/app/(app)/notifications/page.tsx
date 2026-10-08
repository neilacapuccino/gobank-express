import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestNotifications } from "~/features/requests/components/request-notifications";
import { currentUserId } from "~/server/session";
import { PageHeader } from "~/shared/ui/page-header";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
	const userId = await currentUserId();
	if (!userId) redirect("/signin");
	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Notifications" back="/dashboard" />
			<RequestNotifications userId={userId} />
		</div>
	);
}
