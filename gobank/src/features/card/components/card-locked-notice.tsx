import { Lock } from "lucide-react";
import Link from "next/link";

export function CardLockedNotice() {
	return (
		<div
			role="alert"
			className="border-line bg-surface-raised mt-5 flex items-start gap-3 rounded-2xl border p-4"
		>
			<Lock size={18} className="text-ink-muted mt-0.5 shrink-0" aria-hidden />
			<p className="text-ink-soft text-[13px] leading-relaxed">
				Both of your cards are locked, so spending is paused.{" "}
				<Link href="/card" className="text-brand font-medium hover:underline">
					Unlock one in My card
				</Link>
			</p>
		</div>
	);
}
