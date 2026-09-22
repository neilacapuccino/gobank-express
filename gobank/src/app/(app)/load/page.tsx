import type { Metadata } from "next";
import { PlaceholderPage } from "~/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Buy load",
};

export default function LoadPage() {
  return <PlaceholderPage screen="Buy load" title="Buy load" />;
}
