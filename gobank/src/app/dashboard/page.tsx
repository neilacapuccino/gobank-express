import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="flex min-h-dvh justify-center bg-white">
      <div className="w-full max-w-[440px] px-6 py-10">
        <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">
          Homepage
        </h1>
        <p className="mt-2 text-[14.5px] text-neutral-500">
          Placeholder. The dashboard is built later.
        </p>
      </div>
    </main>
  );
}
