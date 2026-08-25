import type { ReactNode } from "react";
import { Screen } from "~/app/_components/ui/screen";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <Screen>{children}</Screen>;
}
