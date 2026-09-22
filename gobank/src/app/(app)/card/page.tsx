import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Card",
};

export default function CardPage() {
  return <PlaceholderPage screen="S10" title="Card" />;
}
