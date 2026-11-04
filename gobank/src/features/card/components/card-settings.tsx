"use client";

import { Lock, LockKeyholeOpen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { isPesoInput } from "~/shared/lib/amount-input";
import { cn } from "~/shared/lib/cn";
import { peso } from "~/shared/lib/format";
import { toCentavos, toPesos } from "~/shared/lib/money";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { MAX_DAILY_LIMIT_CENTAVOS } from "../card.rules";
import type { CardKind } from "./bank-card";

const CARD_NAME: Record<CardKind, string> = {
	physical: "Physical card",
	virtual: "Virtual card",
};

const OUTLINE_BUTTON =
	"border-line-strong text-ink bg-surface enabled:hover:bg-surface-raised focus-visible:outline-brand inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium focus-visible:outline-2 disabled:opacity-45";

const SAVE_BUTTON =
	"bg-brand enabled:hover:bg-brand-hover focus-visible:outline-brand disabled:bg-brand/35 min-h-9 rounded-lg px-3 text-[13px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:text-white/65";

function lockButtonLabel(saving: boolean, locked: boolean) {
	if (saving) return "Saving…";
	return locked ? "Unlock" : "Lock";
}

function useCardUpdate() {
	const utils = api.useUtils();

	const update = api.card.update.useMutation({
		onMutate: () => utils.card.get.cancel(),
		onSuccess: (updated) => {
			utils.card.get.setData(undefined, updated);
		},
	});

	const savingLock = update.isPending && update.variables.lock !== undefined;
	const savingLimit = update.isPending && !savingLock;

	return { update, savingLock, savingLimit };
}

function DailyLimitField({
	cardDailyLimit,
	busy,
	saving,
	onSave,
	onEdit,
}: {
	cardDailyLimit: number;
	busy: boolean;
	saving: boolean;
	onSave: (centavos: number) => void;
	onEdit: () => void;
}) {
	const [draft, setDraft] = useState<string | null>(null);

	const limit = draft ?? String(toPesos(cardDailyLimit));
	const centavos = toCentavos(Number(limit));
	const tooHigh = centavos > MAX_DAILY_LIMIT_CENTAVOS;

	const canSave =
		limit.trim() !== "" &&
		Number.isFinite(centavos) &&
		centavos >= 0 &&
		!tooHigh &&
		centavos !== cardDailyLimit;

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSave || busy) return;

		onSave(centavos);
	};

	const edit = (value: string) => {
		if (!isPesoInput(value)) return;

		setDraft(value);
		onEdit();
	};

	return (
		<form onSubmit={submit} className="border-line mt-4 border-t pt-4">
			<TextField
				label="Daily spending limit (both cards)"
				prefix="₱"
				name="cardDailyLimit"
				hint={`Up to ${peso(MAX_DAILY_LIMIT_CENTAVOS)} a day. ₱0 blocks spending.`}
				error={tooHigh ? `Maximum ${peso(MAX_DAILY_LIMIT_CENTAVOS)}` : null}
				type="text"
				inputMode="decimal"
				required
				value={limit}
				disabled={busy}
				onChange={(event) => edit(event.target.value)}
				trailing={
					<button
						type="submit"
						aria-label="Save daily spending limit"
						disabled={busy || !canSave}
						className={SAVE_BUTTON}
					>
						{saving ? "Saving…" : "Save"}
					</button>
				}
			/>
		</form>
	);
}

export function CardSettings({
	kind,
	locked,
	cardDailyLimit,
}: {
	kind: CardKind;
	locked: boolean;
	cardDailyLimit: number;
}) {
	const { update, savingLock, savingLimit } = useCardUpdate();

	const toggleLock = () => {
		update.mutate({ lock: { kind, locked: !locked } });
	};

	const saveLimit = (centavos: number) => {
		update.mutate({ cardDailyLimit: centavos });
	};

	const clearFeedback = () => {
		update.reset();
	};

	const error = errorMessage(update.error);

	return (
		<section
			aria-label="Card settings"
			className="border-line mt-5 rounded-2xl border p-4"
		>
			<div className="flex items-center justify-between gap-3">
				<div>
					<h2
						className={cn(
							"text-[14px] font-medium",
							locked ? "text-ink-muted" : "text-brand",
						)}
					>
						{CARD_NAME[kind]} {locked ? "locked" : "unlocked"}
					</h2>
					<p className="text-ink-muted mt-1 text-[12px]">
						{locked
							? "Payments with this card are blocked."
							: "Can pay transfers, bills and load."}
					</p>
				</div>

				<button
					type="button"
					disabled={update.isPending}
					onClick={toggleLock}
					className={OUTLINE_BUTTON}
				>
					{locked ? (
						<LockKeyholeOpen size={15} aria-hidden />
					) : (
						<Lock size={15} aria-hidden />
					)}
					{lockButtonLabel(savingLock, locked)}
				</button>
			</div>

			<DailyLimitField
				key={cardDailyLimit}
				cardDailyLimit={cardDailyLimit}
				busy={update.isPending}
				saving={savingLimit}
				onSave={saveLimit}
				onEdit={clearFeedback}
			/>

			{error ? (
				<p role="alert" className="text-danger mt-3 text-[13px]">
					{error}
				</p>
			) : null}
		</section>
	);
}
