import { CreditCard, Lock, Smartphone } from "lucide-react";
import { cn } from "~/shared/lib/cn";
import type { CardKind } from "../../../../generated/prisma";
import { networkName } from "../card-label";

type PickerCard = {
	kind: CardKind;
	brand: string;
	last4: string;
	locked: boolean;
};

export function CardPicker({
	cards,
	value,
	onChange,
	disabled,
}: {
	cards: PickerCard[];
	value: CardKind;
	onChange: (kind: CardKind) => void;
	disabled?: boolean;
}) {
	if (!cards.length) return null;
	return (
		<fieldset className="mt-5" disabled={disabled}>
			<legend className="text-ink mb-2 text-[14px] font-medium">
				Pay with
			</legend>
			<div className="grid grid-cols-2 gap-2">
				{cards.map((card) => {
					const Icon = card.kind === "virtual" ? Smartphone : CreditCard;
					const selected = card.kind === value && !card.locked;
					return (
						<button
							key={card.kind}
							type="button"
							aria-pressed={selected}
							disabled={card.locked}
							onClick={() => onChange(card.kind)}
							className={cn(
								"flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
								selected
									? "border-brand bg-brand-soft"
									: "border-line enabled:hover:bg-surface-raised",
							)}
						>
							<span className="text-ink flex items-center gap-1.5 text-[13px] font-medium">
								<Icon size={15} aria-hidden />
								{card.kind === "virtual" ? "Virtual" : "Physical"}
								{card.locked ? (
									<Lock size={12} className="text-ink-muted" aria-hidden />
								) : null}
							</span>
							<span className="text-ink-muted text-[12px] tabular-nums">
								{card.locked
									? "Locked"
									: `${networkName(card.brand)} •••• ${card.last4}`}
							</span>
						</button>
					);
				})}
			</div>
		</fieldset>
	);
}
