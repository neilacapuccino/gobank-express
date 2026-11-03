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

export const GOOGLE_LINK_CHANNEL = "gobank:google-link";

export const GOOGLE_LINK_NOTICES: Record<string, string> = {
	linked: "Google account linked.",
	cancelled: "Linking Google was cancelled.",
	failed: "Linking Google did not work. Please try again.",
	unverified: "Your Google email is not verified.",
	unavailable: "Google sign-in is not set up yet.",
	"not-gmail": "Choose a Gmail account to link.",
	"email-in-use": "That Gmail already belongs to another GoBank account.",
	"already-linked": "This account already has a Google account linked.",
	"signed-out": "Sign in to GoBank first, then link Google.",
};
