import type { Metadata } from "next";
import { WelcomeScreen } from "~/features/auth/components/welcome-screen";
import { googleEnabled } from "~/features/auth/google/google.server";
import { GOOGLE_NOTICES } from "~/features/auth/google/google.rules";

export const metadata: Metadata = {
	title: "GoBank Express",
};

export default async function WelcomePage({
	searchParams,
}: {
	searchParams: Promise<{ google?: string }>;
}) {
	const { google } = await searchParams;
	const notice =
		google && Object.hasOwn(GOOGLE_NOTICES, google)
			? (GOOGLE_NOTICES[google] ?? null)
			: null;
	return <WelcomeScreen googleEnabled={googleEnabled()} notice={notice} />;
}
