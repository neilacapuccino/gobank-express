import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInFlow } from "~/features/auth/components/sign-in-flow";
import { getPendingGoogleAccount } from "~/features/auth/google/google.service";
import { googleEnabled } from "~/features/auth/google/google.server";

export const metadata: Metadata = {
	title: "Log in",
};

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ google?: string }>;
}) {
	const { google } = await searchParams;
	let googleUsername: string | undefined;
	if (google === "pin") {
		const pending = await getPendingGoogleAccount();
		if (pending.status === "missing") redirect("/?google=failed");
		if (pending.status === "register") redirect("/register");
		if (pending.status === "email-in-use") redirect("/?google=email-in-use");
		googleUsername = pending.account.username;
	}
	return (
		<SignInFlow
			key={googleUsername ?? "manual"}
			googleEnabled={googleEnabled()}
			googleUsername={googleUsername}
		/>
	);
}
