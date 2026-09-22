import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Screen } from "~/app/_components/ui/screen";
import { currentUserId } from "~/server/session";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await currentUserId()) redirect("/dashboard");
  return <Screen>{children}</Screen>;
}
