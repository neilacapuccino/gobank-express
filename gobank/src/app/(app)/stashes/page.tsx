import type { Metadata } from "next";
import { PlaceholderPage } from "~/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Stashes",
};

export default function StashesPage() {
  return <PlaceholderPage screen="S8" title="Stashes" />;
}
