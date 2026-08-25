// Screen S7 - pays a registered biller from the main balance.

import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Pay bills",
};

export default function BillsPage() {
  return <PlaceholderPage screen="S7" title="Pay bills" />;
}
