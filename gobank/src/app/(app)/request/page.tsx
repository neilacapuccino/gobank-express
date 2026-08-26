// Request money from another user. Beyond the brief, agreed as extra scope.

import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Request",
};

export default function RequestPage() {
  return <PlaceholderPage screen="Request" title="Request money" />;
}
