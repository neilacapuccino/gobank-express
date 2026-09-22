import type { ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface-sunken flex min-h-dvh justify-center">
      <div className="bg-surface border-line flex w-full max-w-[440px] flex-col px-6 pt-8 pb-10 sm:border-x">
        {children}
      </div>
    </div>
  );
}
