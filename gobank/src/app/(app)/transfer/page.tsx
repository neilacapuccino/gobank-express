import type { Metadata } from "next";
import { PlaceholderPage } from "~/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Send money",
};

export default function TransferPage() {
  return <PlaceholderPage screen="S6" title="Send money" />;
}
