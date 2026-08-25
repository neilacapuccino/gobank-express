"use client";

import { getBrand, type CardBrandId } from "~/lib/card-brands";
import { cn } from "~/lib/utils";
import { CardLogo } from "./card-logo";

type CardPreviewProps = {
  brandId: CardBrandId;
  holder: string;
  compact?: boolean;
};

export function CardPreview({ brandId, holder, compact }: CardPreviewProps) {
  const brand = getBrand(brandId);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-sm transition-all duration-300",
        brand.gradient,
        compact ? "aspect-[16/9]" : "aspect-[1.586/1]",
      )}
    >
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <Chip />
          <CardLogo
            id={brand.id}
            className={cn("text-white", compact ? "h-6 w-10" : "h-8 w-13")}
          />
        </div>

        <div className="flex flex-col gap-3">
          <p
            className={cn(
              "font-medium tracking-[0.16em] text-white/90 tabular-nums",
              compact ? "text-[13px]" : "text-[16px]",
            )}
          >
            •••• •••• •••• ••••
          </p>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] tracking-[0.18em] text-white/55 uppercase">
                Cardholder
              </p>
              <p
                className={cn(
                  "truncate font-medium text-white",
                  compact ? "text-[11px]" : "text-[13px]",
                )}
              >
                {holder || "YOUR NAME"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] tracking-[0.18em] text-white/55 uppercase">
                Expires
              </p>
              <p
                className={cn(
                  "font-medium text-white tabular-nums",
                  compact ? "text-[11px]" : "text-[13px]",
                )}
              >
                ••/••
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip() {
  return (
    <div className="h-7 w-9 rounded-md bg-gradient-to-br from-[#f2e2ad] to-[#c9a34f]" />
  );
}
