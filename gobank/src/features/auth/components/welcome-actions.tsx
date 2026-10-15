import Link from "next/link";
import { GoogleButton } from "./google-button";

const accountLinkClass =
	"inline-flex min-h-14 items-center justify-center rounded-full bg-[#9fe870] px-5 text-base font-semibold text-[#163300] transition-colors hover:bg-[#b2f38c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9fe870]";

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
