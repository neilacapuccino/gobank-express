const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function peso(amount: number) {
  return PESO.format(amount);
}

export function maskAccount(accountNumber: string) {
  return `•••• ${accountNumber.slice(-4)}`;
}

export function shortDate(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}
