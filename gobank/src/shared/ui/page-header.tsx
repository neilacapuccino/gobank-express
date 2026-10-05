import { BackButton } from "./back-button";

export function PageHeader({ title, back }: { title: string; back: string }) {
  return (
    <header className="relative flex h-10 items-center justify-center">
      <BackButton href={back} className="absolute left-0" />
      <h1 className="text-ink text-[15px] font-semibold">{title}</h1>
    </header>
  );
}
