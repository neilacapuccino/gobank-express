import type { Metadata } from "next";
import { pendingGoogleIdentity } from "~/features/auth/google/google-identity.server";
import { RegistrationFlow } from "~/features/auth/components/registration-flow";

export const metadata: Metadata = {
	title: "Create your account",
};

export default async function RegisterPage() {
	const pending = await pendingGoogleIdentity();
	return (
		<RegistrationFlow
			initialFullName={pending?.name ?? ""}
			gmail={pending?.gmail ?? null}
		/>
	);
}
