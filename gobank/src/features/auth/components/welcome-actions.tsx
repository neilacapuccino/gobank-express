import Link from "next/link";
import { buttonClass } from "~/shared/ui/button";
import { GoogleButton } from "./google-button";
import { OrDivider } from "./or-divider";

export function WelcomeActions({ googleEnabled }: { googleEnabled: boolean }) {
	return (
		<nav aria-label="Get started" className="flex shrink-0 flex-col gap-3">
			<Link href="/register" className={buttonClass("primary")}>
				Create account
			</Link>
			<Link href="/signin" className={buttonClass("outline")}>
				Log in
			</Link>

			{googleEnabled ? (
				<>
					<OrDivider className="text-ink-faint text-[12px]" />
					<GoogleButton />
				</>
			) : null}
		</nav>
	);
}
