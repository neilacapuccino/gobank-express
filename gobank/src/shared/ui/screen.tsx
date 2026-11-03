import type { ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
	return (
		<div className="bg-surface-sunken flex min-h-dvh justify-center lg:bg-[radial-gradient(70%_55%_at_50%_0%,#05966924,transparent_70%)]">
			<div className="bg-surface border-line flex w-full max-w-[440px] flex-col px-6 pt-8 pb-10 sm:border-x">
				{children}
			</div>
		</div>
	);
}
