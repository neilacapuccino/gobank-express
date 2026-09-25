import type { Metadata } from "next";
import { TransferForm } from "../../../features/transfers/components/transfer-form";

export const metadata: Metadata = {
  title: "Send money",
};

export default function TransferPage() {
  return <TransferForm />;
}
