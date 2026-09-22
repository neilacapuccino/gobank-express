import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Send money",
};

export default function TransferPage() {
  return <PlaceholderPage screen="S6" title="Send money" />;
}
