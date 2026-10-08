import type { Metadata } from "next";
import { RequestNotifications } from "~/features/requests/components/request-notifications";
import { PageHeader } from "~/shared/ui/page-header";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Notifications" back="/dashboard" />
			<RequestNotifications />
		</div>
	);
}
