"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const primaryActionClassName =
	"inline-flex min-h-15 items-center justify-center rounded-full border-[5px] border-[#194e42] bg-[#22b366] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#2cbd71] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#68dba3]";

export function WelcomeActions() {
	const accountDialog = useRef<HTMLDialogElement>(null);

	return (
		<>
			<nav aria-label="Get started" className="flex flex-col gap-2">
				<Link href="/register" className={primaryActionClassName}>
					Create an account
				</Link>
				<button
					type="button"
					aria-haspopup="dialog"
					aria-controls="welcome-account-access"
					onClick={() => accountDialog.current?.showModal()}
					className="inline-flex min-h-12 items-center justify-center px-4 text-[14px] font-medium text-[#aebfd1] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68d9f6]"
				>
					Already have an account?
				</button>
			</nav>

			<dialog
				ref={accountDialog}
				id="welcome-account-access"
				aria-labelledby="welcome-access-title"
				aria-describedby="welcome-access-description"
				className="m-auto w-[calc(100%-40px)] max-w-[380px] rounded-[22px] border border-[#26394c] bg-[#0b1624] p-6 text-[#f4f7fc] shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
			>
				<div className="flex items-start justify-between gap-4">
					<h2
						id="welcome-access-title"
						className="pt-1 text-[20px] leading-tight font-semibold tracking-tight"
					>
						No sign-in page yet
					</h2>
					<button
						type="button"
						aria-label="Close account message"
						onClick={() => accountDialog.current?.close()}
						className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#172536] text-[#b7c7d7] transition-colors hover:bg-[#23364b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68d9f6]"
					>
						<X size={17} strokeWidth={1.8} aria-hidden />
					</button>
				</div>
				<p
					id="welcome-access-description"
					className="mt-3 text-[14px] leading-6 text-[#aebfd1]"
				>
					Would you like to continue with the test account?
				</p>
				<Link
					href="/dashboard"
					onClick={() => accountDialog.current?.close()}
					className={`${primaryActionClassName} mt-6 w-full`}
				>
					Continue with test account
				</Link>
				<button
					type="button"
					onClick={() => accountDialog.current?.close()}
					className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-[13px] font-medium text-[#aebfd1] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68d9f6]"
				>
					Go back
				</button>
			</dialog>
		</>
	);
}
