import type { Metadata } from "next";
import { SignInFlow } from "~/features/auth/components/sign-in-flow";
import { googleEnabled } from "~/features/auth/google/google.server";

export const metadata: Metadata = {
	title: "Log in",
};

export default function SignInPage() {
	return <SignInFlow googleEnabled={googleEnabled()} />;
}
