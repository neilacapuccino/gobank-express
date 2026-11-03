import { GoogleMark } from "~/features/auth/components/google-mark";

export function GmailLink({ gmail }: { gmail?: string | null }) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-ink-soft text-[13px] font-medium">Gmail</span>
			<p
				className={
					gmail
						? "border-brand-line bg-brand-soft text-ink flex items-center gap-2.5 rounded-xl border px-3.5 py-4 text-[14px]"
						: "border-line text-ink-muted flex items-center gap-2.5 rounded-xl border px-3.5 py-4 text-[14px]"
				}
			>
				<GoogleMark />
				{gmail ?? "Not linked"}
			</p>
			<p className="text-ink-muted text-[12.5px]">
				{gmail
					? "Friends can send money to this linked Gmail address."
					: "A Gmail is linked when you sign up with Continue with Google."}
			</p>
		</div>
	);
}
