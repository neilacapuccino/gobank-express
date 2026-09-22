import { Check, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "~/shared/lib/cn";
import type { Biller } from "../bill-categories";

type BillerCardProps = {
  biller: Biller;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
};

export function BillerCard({
  biller,
  icon: Icon,
  selected,
  onClick,
}: BillerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center rounded-2xl border p-3.5 text-left transition-all",
        selected
          ? "border-brand-line bg-brand-soft"
          : "bg-surface-raised hover:bg-surface-sunken border-transparent",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          selected
            ? "bg-brand-line/60 text-brand"
            : "bg-surface-sunken text-ink-soft",
        )}
      >
        <Icon size={21} strokeWidth={1.9} aria-hidden />
      </span>

      <span className="ml-3 min-w-0 flex-1">
        <span className="block text-[13px] font-semibold">{biller.name}</span>
        <span className="text-ink-soft mt-0.5 block text-[10.5px]">
          {biller.description}
        </span>
      </span>

      {selected ? (
        <span className="bg-brand grid h-6 w-6 place-items-center rounded-full text-white">
          <Check size={13} strokeWidth={3} aria-hidden />
        </span>
      ) : (
        <ChevronRight
          size={17}
          strokeWidth={1.8}
          className="text-ink-soft"
          aria-hidden
        />
      )}
    </button>
  );
}
