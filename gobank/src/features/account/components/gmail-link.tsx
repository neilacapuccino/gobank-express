import { GoogleMark } from "~/features/auth/components/google-mark";

export function GmailLink({ gmail }: { gmail?: string | null }) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="text-ink-soft flex justify-between text-[13px] font-medium">
				<span>Gmail</span>
				<span className="text-ink-faint text-[12px] font-normal">Optional</span>
			</div>
			{gmail ? (
				<p className="border-brand-line bg-brand-soft text-ink rounded-xl border px-3.5 py-4 text-[14px]">
					{gmail}
				</p>
			) : (
				<button
					type="button"
					disabled
					className="border-line text-ink-muted flex h-13 items-center justify-center gap-2.5 rounded-xl border text-[14.5px] font-medium disabled:cursor-not-allowed"
				>
					<GoogleMark />
					Link Gmail
				</button>
			)}
			<p className="text-ink-muted text-[12.5px]">
				{gmail
					? "Friends can send money to this linked Gmail address."
					: "Gmail linking is coming soon."}
			</p>
		</div>
	);
}
