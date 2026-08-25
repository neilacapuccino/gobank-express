// Screen S13 - a single transaction receipt addressed by its reference number.

import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Receipt",
};

export default function ReceiptPage() {
  return <PlaceholderPage screen="S13" title="Receipt" />;
}
