import type { Metadata } from "next";
import { PlaceholderPage } from "~/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Card",
};

export default function CardPage() {
  return <PlaceholderPage screen="S10" title="Card" />;
}
