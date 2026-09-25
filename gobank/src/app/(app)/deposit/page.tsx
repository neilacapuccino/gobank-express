import type { Metadata } from "next";
import { DepositForm } from "~/features/wallet/components/deposit-form";

export const metadata: Metadata = {
  title: "Deposit",
};

export default function DepositPage() {
  return <DepositForm />;
}
