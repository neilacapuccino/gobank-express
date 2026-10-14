import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Screen } from "~/shared/ui/screen";
import { currentSession } from "~/server/session";
import { SessionGuard } from "~/features/auth/components/session-guard";

export default async function AppLayout({ children }: { children: ReactNode }) {
	const session = await currentSession();
	if (!session) redirect("/signin");
	return (
		<Screen>
			<SessionGuard sessionId={session.id}>{children}</SessionGuard>
		</Screen>
	);
}
