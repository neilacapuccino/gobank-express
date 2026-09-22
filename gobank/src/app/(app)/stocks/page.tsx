import type { Metadata } from "next";
import { PlaceholderPage } from "~/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Stocks",
};

export default function StocksPage() {
  return <PlaceholderPage screen="Stocks" title="Invest" />;
}
