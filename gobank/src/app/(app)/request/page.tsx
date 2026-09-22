import type { Metadata } from "next";
import { PlaceholderPage } from "~/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Request",
};

export default function RequestPage() {
  return <PlaceholderPage screen="Request" title="Request money" />;
}
