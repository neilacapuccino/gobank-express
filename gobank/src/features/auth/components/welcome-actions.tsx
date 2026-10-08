import Link from "next/link";

export function WelcomeActions() {
	return (
		<nav aria-label="Get started" className="flex flex-col gap-2">
			<Link
				href="/register"
				className="inline-flex min-h-15 items-center justify-center rounded-full border-[5px] border-[#194e42] bg-[#22b366] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#2cbd71] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#68dba3]"
			>
				Create an account
			</Link>
			<Link
				href="/signin"
				className="inline-flex min-h-12 items-center justify-center px-4 text-[14px] font-medium text-[#aebfd1] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68d9f6]"
			>
				Already have an account? Sign in
			</Link>
		</nav>
	);
}
