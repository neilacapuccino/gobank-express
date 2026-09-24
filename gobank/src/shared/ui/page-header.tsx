import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function PageHeader({ title, back }: { title: string; back: string }) {
  return (
    <header className="relative flex h-10 items-center justify-center">
      <Link
        href={back}
        aria-label="Back"
        className="bg-surface-sunken text-ink-soft hover:bg-surface-raised absolute left-0 grid h-10 w-10 place-items-center rounded-full transition-colors"
      >
        <ArrowLeft size={18} strokeWidth={1.9} aria-hidden />
      </Link>
      <h1 className="text-ink text-[15px] font-semibold">{title}</h1>
    </header>
  );
}
