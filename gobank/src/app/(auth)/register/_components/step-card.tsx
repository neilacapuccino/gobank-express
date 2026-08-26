"use client";

import { Button } from "~/app/_components/ui/button";
import { CARD_BRANDS, type CardBrandId } from "~/lib/card-brands";
import { cn } from "~/lib/utils";
import { CardBrandLogo } from "~/app/_components/money/card-brand-logo";
import { VirtualCard } from "~/app/_components/money/virtual-card";

type StepCardProps = {
  brand: CardBrandId;
  holder: string;
  onBrandChange: (brand: CardBrandId) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepCard({
  brand,
  holder,
  onBrandChange,
  onNext,
  onBack,
}: StepCardProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-2">
        <h1 className="text-ink text-[24px] leading-tight font-semibold tracking-tight">
          Choose your card
        </h1>
        <p className="text-ink-soft text-[14.5px] leading-relaxed">
          Your number, CVV and expiry are issued automatically.
        </p>
      </div>

      <div className="mt-7">
        <VirtualCard brandId={brand} holder={holder} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {CARD_BRANDS.map((option) => {
          const selected = option.id === brand;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onBrandChange(option.id)}
              aria-pressed={selected}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors duration-150",
                selected
                  ? "border-brand bg-brand-soft"
                  : "border-line hover:bg-surface-sunken",
              )}
            >
              <CardBrandLogo id={option.id} className="h-6 w-10 shrink-0" />
              <span className="text-ink min-w-0 truncate text-[13.5px] font-medium">
                {option.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="mt-8 flex flex-col gap-1.5">
        <Button onClick={onNext}>Continue</Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
