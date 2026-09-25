import type { Metadata } from "next";
import { TransferForm } from "../../../features/transfers/components/transform-form";

export const metadata: Metadata = {
  title: "Send money",
};

export default function TransferPage() {
  return <TransferForm />;
}
