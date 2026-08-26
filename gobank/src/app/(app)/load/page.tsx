// Beyond the brief, agreed as extra scope.

import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Buy load",
};

export default function LoadPage() {
  return <PlaceholderPage screen="Buy load" title="Buy load" />;
}
