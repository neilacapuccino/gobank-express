import type { Metadata } from "next";
import { GoogleLinkResult } from "~/features/account/components/google-link-result";
import { GOOGLE_LINK_NOTICES } from "~/features/auth/google/google.rules";

export const metadata: Metadata = {
	title: "Link Google",
};

export default async function GoogleLinkedPage({
	searchParams,
}: {
	searchParams: Promise<{ google?: string }>;
}) {
	const { google = "" } = await searchParams;
	const status = Object.hasOwn(GOOGLE_LINK_NOTICES, google) ? google : "failed";

	return <GoogleLinkResult status={status} />;
}
