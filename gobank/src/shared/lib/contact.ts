export function normaliseMobile(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("63")) return `0${digits.slice(2)}`;
  return digits;
}

export function validateMobile(raw: string): string | null {
  if (raw.trim().length === 0) return null;
  const value = normaliseMobile(raw);
  if (!/^09\d{9}$/.test(value)) {
    return "Use the format 09XXXXXXXXX";
  }
  return null;
}

export function validateEmail(raw: string): string | null {
  if (raw.trim().length === 0) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim())) {
    return "That does not look like an email";
  }
  return null;
}

export function formatMobile(raw: string) {
  const value = normaliseMobile(raw);
  if (value.length !== 11) return raw;
  return `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}`;
}
