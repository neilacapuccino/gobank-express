import type { Metadata } from "next";
import { DepositForm } from "~/features/deposit/components/deposit-form";

export const metadata: Metadata = {
	title: "Deposit",
};

export default function DepositPage() {
	return <DepositForm />;
}
