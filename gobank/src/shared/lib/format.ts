import { toPesos } from "./money";

const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function peso(centavos: number) {
  return PESO.format(toPesos(centavos));
}

export function formatAccount(accountNumber: string) {
  return accountNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function maskAccount(accountNumber: string) {
  return `•••• ${accountNumber.slice(-4)}`;
}

export function shortDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}
