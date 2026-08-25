// Temporary body for routes that are scaffolded but not yet built.

export function PlaceholderPage({
  screen,
  title,
}: {
  screen: string;
  title: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-24 text-center">
      <p className="text-ink-faint text-[11px] tracking-[0.18em] uppercase">
        {screen}
      </p>
      <h1 className="text-ink text-[22px] font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-ink-muted text-[14px]">Not built yet.</p>
    </div>
  );
}
