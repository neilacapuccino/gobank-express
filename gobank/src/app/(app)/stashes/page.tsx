// Screen S8 - lists the goal based savings Stashes, capped at five.

import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Stashes",
};

export default function StashesPage() {
  return <PlaceholderPage screen="S8" title="Stashes" />;
}
