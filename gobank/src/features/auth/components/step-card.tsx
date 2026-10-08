"use client";

import { Button } from "~/shared/ui/button";
import { CARD_BRANDS, type CardBrandId } from "~/features/card/card-brands";
import { cn } from "~/shared/lib/cn";
import { CardBrandLogo } from "~/features/card/components/card-brand-logo";
import { BankCard } from "~/features/card/components/bank-card";
import { AuthHeading } from "./auth-heading";

type StepCardProps = {
	brand: CardBrandId;
	fullName: string;
	preparing: boolean;
	onBrandChange: (brand: CardBrandId) => void;
	onNext: () => void;
	onBack: () => void;
};

export function StepCard({
	brand,
	fullName,
	preparing,
	onBrandChange,
	onNext,
	onBack,
}: StepCardProps) {
	return (
		<div className="flex flex-1 flex-col">
			<AuthHeading
				title="Choose your physical card"
				subtitle="Select your card network."
			/>

			<div className="mt-7">
				<BankCard brand={brand} fullName={fullName} kind="physical" />
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
				<Button onClick={onNext} disabled={preparing}>
					{preparing ? "Preparing card…" : "Continue"}
				</Button>
				<Button variant="ghost" onClick={onBack} disabled={preparing}>
					Back
				</Button>
			</div>
		</div>
	);
}
