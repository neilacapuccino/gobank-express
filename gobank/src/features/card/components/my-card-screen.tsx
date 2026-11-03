"use client";

import { CreditCard, Smartphone } from "lucide-react";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { peso } from "~/shared/lib/format";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import type { CardKind } from "./bank-card";
import { CardDetails } from "./card-details";
import { CardSettings } from "./card-settings";

type CardOverview = RouterOutputs["card"]["get"];

const CARD_KINDS = [
	{ kind: "physical", label: "Physical", icon: CreditCard },
	{ kind: "virtual", label: "Virtual", icon: Smartphone },
] as const;

const TEXT_ACTION =
	"text-ink-muted enabled:hover:text-ink focus-visible:outline-brand inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-1 text-[12.5px] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-45";

function MainBalance() {
	const account = api.account.overview.useQuery();

	return (
		<div className="mb-5 flex items-baseline justify-between gap-3">
			<p className="text-ink-muted text-[13px]">Main balance</p>

			{account.isError ? (
				<button
					type="button"
					onClick={() => void account.refetch()}
					disabled={account.isFetching}
					className={TEXT_ACTION}
				>
					{account.isFetching ? "Loading…" : "Retry balance"}
				</button>
			) : (
				<p
					className="text-ink text-xl font-semibold tabular-nums"
					aria-live="polite"
				>
					{account.data ? peso(account.data.balance) : "…"}
				</p>
			)}
		</div>
	);
}

function CardKindSwitch({
	selected,
	onSelect,
}: {
	selected: CardKind;
	onSelect: (kind: CardKind) => void;
}) {
	return (
		<div
			className="border-line bg-surface-sunken grid grid-cols-2 gap-1 rounded-xl border p-1"
			role="group"
			aria-label="Card kind"
		>
			{CARD_KINDS.map(({ kind, label, icon: Icon }) => (
				<button
					key={kind}
					type="button"
					aria-pressed={selected === kind}
					onClick={() => onSelect(kind)}
					className={cn(
						"focus-visible:outline-brand flex min-h-11 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-2",
						selected === kind
							? "bg-surface-raised text-ink"
							: "text-ink-muted hover:text-ink",
					)}
				>
					<Icon size={16} aria-hidden />
					{label}
				</button>
			))}
		</div>
	);
}

function CardControls({ cards }: { cards: CardOverview }) {
	const [selectedKind, setSelectedKind] = useState<CardKind>("physical");
	const selectedCard = cards[selectedKind];

	return (
		<>
			<CardKindSwitch selected={selectedKind} onSelect={setSelectedKind} />

			<CardDetails
				key={`${selectedKind}:${selectedCard.number}`}
				card={selectedCard}
			/>

			<CardSettings
				kind={selectedKind}
				locked={selectedCard.locked}
				cardDailyLimit={cards.cardDailyLimit}
			/>
		</>
	);
}

function LoadError({
	message,
	retrying,
	onRetry,
}: {
	message: string;
	retrying: boolean;
	onRetry: () => void;
}) {
	return (
		<div className="mt-8 space-y-4">
			<p role="alert" className="text-danger text-sm">
				{message}
			</p>
			<Button variant="outline" disabled={retrying} onClick={onRetry}>
				Try again
			</Button>
		</div>
	);
}

export function MyCardScreen() {
	const cards = api.card.get.useQuery();

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="My card" back="/dashboard" />

			{cards.isPending ? (
				<p role="status" className="text-ink-muted mt-10 text-center text-sm">
					Loading your cards…
				</p>
			) : null}

			{cards.data ? (
				<div className="mt-7">
					<MainBalance />
					<CardControls cards={cards.data} />
				</div>
			) : null}

			{cards.isError ? (
				<LoadError
					message={errorMessage(cards.error) ?? "Could not load your cards."}
					retrying={cards.isFetching}
					onRetry={() => void cards.refetch()}
				/>
			) : null}
		</div>
	);
}
