import { cn } from "~/lib/utils";

export function StepBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-300",
            index + 1 <= current ? "bg-brand" : "bg-line",
          )}
        />
      ))}
    </div>
  );
}
