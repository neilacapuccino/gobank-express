import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Screen } from "~/app/_components/ui/screen";
import { currentUserId } from "~/server/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!(await currentUserId())) redirect("/signin");
  return <Screen>{children}</Screen>;
}
