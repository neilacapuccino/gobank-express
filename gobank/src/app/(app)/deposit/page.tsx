import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Deposit",
};

export default function DepositPage() {
  return <PlaceholderPage screen="Deposit" title="Add money" />;
}
