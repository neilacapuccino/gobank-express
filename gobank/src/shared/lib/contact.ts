const PH_MOBILE = /^09\d{9}$/;
const GMAIL_ADDRESS = /^[a-z0-9][a-z0-9._+-]*@(gmail|googlemail)\.com$/;

export function normalizeMobile(raw: string) {
	const digits = raw.replace(/\D/g, "");

	return digits.startsWith("63") ? `0${digits.slice(2)}` : digits;
}

export function validateMobile(raw: string): string | null {
	if (raw.trim().length === 0) return null;

	return PH_MOBILE.test(normalizeMobile(raw))
		? null
		: "Use the format 09XXXXXXXXX";
}

export function validateFullName(raw: string): string | null {
	const length = raw.trim().length;

	if (length < 2) return "Enter your full name";
	if (length > 80) return "Use at most 80 characters";
	return null;
}

export function normalizeGmail(raw: string): string | null {
	const value = raw.trim().toLowerCase();

	return GMAIL_ADDRESS.test(value) ? value : null;
}

export function formatMobile(raw: string) {
	const value = normalizeMobile(raw);
	if (value.length !== 11) return raw;

	return `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}`;
}
