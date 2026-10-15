export const GOOGLE_COOKIE = "gb_google_oauth";
export const GOOGLE_COOKIE_PATH = "/api/auth/google";

export const GOOGLE_NOTICES: Record<string, string> = {
	cancelled: "Google sign-in was cancelled.",
	failed: "Google sign-in did not work. Please try again.",
	unverified: "Your Google email is not verified.",
	unavailable: "Google sign-in is not set up yet.",
	"email-in-use":
		"That Gmail already belongs to a GoBank account. Sign in with your username and PIN.",
};
