// Shell for authenticated screens; gains the session guard and bottom navigation later.

import type { ReactNode } from "react";
import { Screen } from "~/app/_components/ui/screen";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <Screen>{children}</Screen>;
}
