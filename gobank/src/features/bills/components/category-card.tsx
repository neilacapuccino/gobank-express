import { Check, type LucideIcon } from "lucide-react";
import { cn } from "~/shared/lib/cn";

type CategoryCardProps = {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
};

export function CategoryCard({
  label,
  icon: Icon,
  selected,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative flex min-h-[86px] flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all",
        selected
          ? "border-brand-line bg-brand-soft"
          : "bg-surface-raised hover:bg-surface-sunken border-transparent",
      )}
    >
      {selected ? (
        <span className="bg-brand absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full text-white">
          <Check size={11} strokeWidth={3} aria-hidden />
        </span>
      ) : null}

      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl",
          selected
            ? "bg-brand-line/60 text-brand"
            : "bg-surface-sunken text-ink-soft",
        )}
      >
        <Icon size={19} strokeWidth={1.9} aria-hidden />
      </span>

      <span
        className={cn(
          "mt-2 text-[10px] font-medium",
          selected ? "text-brand-hover" : "text-ink-soft",
        )}
      >
        {label}
      </span>
    </button>
  );
}
