"use client";

import { Button } from "~/shared/ui/button";
import { CARD_BRANDS, type CardBrandId } from "~/features/card/card-brands";
import { cn } from "~/shared/lib/cn";
import { CardBrandLogo } from "~/features/card/components/card-brand-logo";
import { VirtualCard } from "~/features/card/components/virtual-card";
import { AuthHeading } from "./auth-heading";

type StepCardProps = {
	brand: CardBrandId;
	holder: string;
	preparing: boolean;
	ready: boolean;
	onBrandChange: (brand: CardBrandId) => void;
	onNext: () => void;
	onBack: () => void;
};

export function StepCard({
	brand,
	holder,
	preparing,
	ready,
	onBrandChange,
	onNext,
	onBack,
}: StepCardProps) {
	return (
		<div className="flex flex-1 flex-col">
			<AuthHeading
				title="Choose your card"
				subtitle="Your card details will appear during review."
			/>

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
							disabled={preparing}
							aria-pressed={selected}
							className={cn(
								"flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors duration-150 disabled:opacity-60",
								selected
									? "border-brand bg-brand-soft"
									: "border-line hover:bg-surface-sunken",
							)}
						>
							<CardBrandLogo
								id={option.id}
								onDark
								className="h-6 w-10 shrink-0"
							/>
							<span className="text-ink min-w-0 truncate text-[13.5px] font-medium">
								{option.name}
							</span>
						</button>
					);
				})}
			</div>

			<div className="flex-1" />

			<div className="mt-8 flex flex-col gap-1.5">
				<Button onClick={onNext} disabled={!ready || preparing}>
					{preparing ? "Preparing card…" : "Continue"}
				</Button>
				<Button variant="ghost" onClick={onBack}>
					Back
				</Button>
			</div>
		</div>
	);
}
