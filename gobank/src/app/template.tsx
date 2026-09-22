import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="animate-page-in flex min-h-dvh flex-col">{children}</div>
  );
}
