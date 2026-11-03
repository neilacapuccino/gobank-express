import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInFlow } from "~/features/auth/components/sign-in-flow";
import { getPendingGoogleAccount } from "~/features/auth/google/google.service";
import { googleEnabled } from "~/features/auth/google/google.server";

export const metadata: Metadata = {
	title: "Log in",
};

async function pendingGoogleUsername() {
	const pending = await getPendingGoogleAccount();

	if (pending.status === "missing") redirect("/?google=failed");
	if (pending.status === "register") redirect("/register?google=new");
	if (pending.status === "email-in-use") redirect("/?google=email-in-use");

	return pending.account.username;
}

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ google?: string }>;
}) {
	const { google } = await searchParams;

	const googleUsername =
		google === "pin" ? await pendingGoogleUsername() : undefined;

	return (
		<SignInFlow
			key={googleUsername ?? "manual"}
			googleEnabled={googleEnabled()}
			googleUsername={googleUsername}
		/>
	);
}
