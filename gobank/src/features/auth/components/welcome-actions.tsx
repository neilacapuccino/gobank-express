import Link from "next/link";
import { GoogleButton } from "./google-button";

const accountLinkClass =
	"bg-brand hover:bg-brand-hover focus-visible:outline-brand inline-flex min-h-14 items-center justify-center rounded-full px-5 text-base font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4";

export function WelcomeActions({ googleEnabled }: { googleEnabled: boolean }) {
	return (
		<nav aria-label="Get started" className="flex shrink-0 flex-col gap-3">
			<div className="grid grid-cols-2 gap-3">
				<Link href="/signin" className={accountLinkClass}>
					Log in
				</Link>
				<Link href="/register" className={accountLinkClass}>
					Register
				</Link>
			</div>
			{googleEnabled && <GoogleButton />}
		</nav>
	);
}
