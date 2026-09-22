import type { Metadata } from "next";
import { PlaceholderPage } from "~/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Receipt",
};

export default function ReceiptPage() {
  return <PlaceholderPage screen="S13" title="Receipt" />;
}
