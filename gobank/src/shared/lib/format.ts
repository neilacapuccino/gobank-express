import { toPesos } from "./money";

const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const SHORT_DATE = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "short",
});

const DATE_TIME = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const peso = (centavos: number) => PESO.format(toPesos(centavos));

export const formatAccount = (accountNumber: string) =>
  accountNumber.replace(/(\d{4})(?=\d)/g, "$1 ");

export const maskAccount = (accountNumber: string) =>
  `•••• ${accountNumber.slice(-4)}`;

export const maskDigits = (value: string) =>
  value.length <= 4
    ? value
    : `${"*".repeat(value.length - 4)}${value.slice(-4)}`;

export const digitsOnly = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

export const shortDate = (date: Date | string) =>
  SHORT_DATE.format(new Date(date));

export const dateTime = (date: Date | string) =>
  DATE_TIME.format(new Date(date));
