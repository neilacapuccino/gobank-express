import { GoogleMark } from "./google-mark";

export function GoogleButton() {
	return (
		<a
			href="/api/auth/google"
			className="border-line bg-surface text-ink hover:bg-surface-sunken flex min-h-13 items-center justify-center gap-2.5 rounded-xl border text-[14.5px] font-medium transition-colors"
		>
			<GoogleMark />
			Continue with Google
		</a>
	);
}
