// Beyond the brief, agreed as extra scope.

import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Stocks",
};

export default function StocksPage() {
  return <PlaceholderPage screen="Stocks" title="Invest" />;
}
