import type { Metadata } from "next";
import { BillPayment } from "~/features/bills/components/bill-payment";

export const metadata: Metadata = {
  title: "Pay bills",
};

export default function BillsPage() {
  return <BillPayment />;
}
