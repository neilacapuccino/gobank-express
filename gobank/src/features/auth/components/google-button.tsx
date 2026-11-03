import { buttonClass } from "~/shared/ui/button";
import { GoogleMark } from "./google-mark";

export function GoogleButton() {
	return (
		<a href="/api/auth/google" className={buttonClass("outline")}>
			<GoogleMark size={18} />
			Continue with Google
		</a>
	);
}
