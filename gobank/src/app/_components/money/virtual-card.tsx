"use client";

import { getBrand, type CardBrandId } from "~/lib/card-brands";
import { cn } from "~/lib/utils";
import { CardBrandLogo } from "./card-brand-logo";

type VirtualCardProps = {
  brandId: CardBrandId;
  holder: string;
  compact?: boolean;
};

export function VirtualCard({ brandId, holder, compact }: VirtualCardProps) {
  const brand = getBrand(brandId);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl p-5 ring-1 ring-white/10 transition-all duration-300 ring-inset",
        "shadow-[0_1px_2px_rgba(13,18,32,0.16),0_12px_28px_-12px_rgba(13,18,32,0.45)]",
        compact ? "aspect-[16/9]" : "aspect-[1.586/1]",
      )}
      style={{ backgroundColor: brand.face }}
    >
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <Chip className={cn(compact ? "h-6 w-8" : "h-8 w-10")} />
          <Contactless
            className={cn("text-white/60", compact ? "h-4 w-4" : "h-5 w-5")}
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
            <CardBrandLogo
              id={brand.id}
              onDark
              className={cn("shrink-0", compact ? "h-6 w-10" : "h-8 w-13")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 31" className={className} aria-hidden="true">
      <rect width="40" height="31" rx="5" fill="#d8b46a" />
      <g stroke="#9c7c34" strokeWidth="1.1" fill="none">
        <path d="M14 0v31M26 0v31M0 10h14M26 10h14M0 21h14M26 21h14" />
        <rect x="14" y="10" width="12" height="11" rx="2.5" />
      </g>
    </svg>
  );
}

function Contactless({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 9.5a4.5 4.5 0 0 1 0 5" />
      <path d="M9.5 6.5a9 9 0 0 1 0 11" />
      <path d="M14 3.5a13.5 13.5 0 0 1 0 17" />
    </svg>
  );
}
