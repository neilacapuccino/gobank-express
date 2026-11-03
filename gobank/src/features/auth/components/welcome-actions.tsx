import Link from "next/link";
import { buttonClass } from "~/shared/ui/button";
import { GoogleButton } from "./google-button";

export function WelcomeActions({ googleEnabled }: { googleEnabled: boolean }) {
	return (
		<nav aria-label="Get started" className="flex shrink-0 flex-col gap-3">
			<Link href="/register" className={buttonClass("primary")}>
				Create account
			</Link>
			<Link href="/signin" className={buttonClass("outline")}>
				Log in
			</Link>
			{googleEnabled && (
				<>
					<div className="text-ink-faint flex items-center gap-3 text-[12px]">
						<span aria-hidden className="bg-line h-px flex-1" />
						<span>or</span>
						<span aria-hidden className="bg-line h-px flex-1" />
					</div>
					<GoogleButton />
				</>
			)}
		</nav>
	);
}
