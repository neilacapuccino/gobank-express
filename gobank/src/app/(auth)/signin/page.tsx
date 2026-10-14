// import type { Metadata } from "next";
// import { SignInFlow } from "~/features/auth/components/sign-in-flow";

// export const metadata: Metadata = {
// 	title: "Sign in",
// };

// export default function SignInPage() {
// 	return <SignInFlow />;
// }

import type { Metadata } from "next";
import { GOOGLE_NOTICES } from "~/features/auth/auth.rules";
import { googleEnabled } from "~/features/auth/google.server";
import { SignInFlow } from "~/features/auth/components/sign-in-flow";

export const metadata: Metadata = {
	title: "Sign in",
};

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ google?: string }>;
}) {
	const { google } = await searchParams;
	return (
		<SignInFlow
			google={googleEnabled()}
			notice={google ? (GOOGLE_NOTICES[google] ?? null) : null}
		/>
	);
}
