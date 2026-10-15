import { GoogleMark } from "./google-mark";

export function GoogleButton() {
	return (
		<a
			href="/api/auth/google"
			className="focus-visible:outline-brand inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-white px-5 text-base font-semibold text-[#141710] transition-colors hover:bg-[#f1f3ef] focus-visible:outline-2 focus-visible:outline-offset-4"
		>
			<GoogleMark size={20} />
			Sign in with Google
		</a>
	);
}
