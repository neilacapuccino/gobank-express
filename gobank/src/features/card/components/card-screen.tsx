"use client";

import { Check, Copy, Eye, EyeOff, Lock, LockKeyholeOpen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { cn } from "~/shared/lib/cn";
import { toCentavos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { VirtualCard } from "./virtual-card";

type Card = RouterOutputs["card"]["get"];

export function CardScreen() {
	const card = api.card.get.useQuery();

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Virtual card" back="/dashboard" />
			{card.isPending ? (
				<p role="status" className="text-ink-muted mt-10 text-center text-sm">
					Loading your card…
				</p>
			) : card.data ? (
				<CardControls card={card.data} />
			) : (
				<div className="mt-8 space-y-4">
					<p role="alert" className="text-danger text-sm">
						{errorMessage(card.error) ?? "Could not load your card."}
					</p>
					<Button
						variant="outline"
						disabled={card.isFetching}
						onClick={() => void card.refetch()}
					>
						Try again
					</Button>
				</div>
			)}
		</div>
	);
}

function CardControls({ card }: { card: Card }) {
	const utils = api.useUtils();
	const [showNumber, setShowNumber] = useState(false);
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
		"idle",
	);
	const [limitDraft, setLimitDraft] = useState<string | null>(null);
	const [message, setMessage] = useState("");
	const update = api.card.update.useMutation({
		onSuccess: (updated, settings) => {
			utils.card.get.setData(undefined, updated);
			if (settings.dailyLimit !== undefined) {
				setLimitDraft(null);
				setMessage("Daily limit saved.");
			} else {
				setMessage(updated.locked ? "Card locked." : "Card unlocked.");
			}
		},
	});
	const limit = limitDraft ?? String(card.dailyLimit / 100);
	const limitInCentavos = toCentavos(Number(limit));
	const savingLimit =
		update.isPending && update.variables.dailyLimit !== undefined;
	const savingLock = update.isPending && update.variables.locked !== undefined;
	const feedback =
		update.error || message ? (
			<p
				role={update.error ? "alert" : "status"}
				className={cn(
					"mt-3 text-[13px]",
					update.error ? "text-danger" : "text-brand",
				)}
			>
				{errorMessage(update.error) ?? message}
			</p>
		) : null;

	const saveLimit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setMessage("");
		update.mutate({ dailyLimit: limitInCentavos });
	};

	const copyNumber = async () => {
		try {
			await navigator.clipboard.writeText(card.number);
			setCopyStatus("copied");
		} catch {
			setCopyStatus("error");
		}
	};

	return (
		<div className="mt-8 space-y-6">
			<section aria-label="Card details">
				<VirtualCard
					brandId={card.brand}
					holder={card.user.fullName}
					first4={card.number.slice(0, 4)}
					last4={card.number.slice(-4)}
					number={showNumber ? card.number : undefined}
					expiresAt={card.expiresAt}
				/>
				<div className="mt-3 grid grid-cols-2 gap-2">
					<Button
						variant="ghost"
						aria-pressed={showNumber}
						onClick={() => {
							setShowNumber((visible) => !visible);
							setCopyStatus("idle");
						}}
					>
						{showNumber ? (
							<EyeOff size={16} aria-hidden />
						) : (
							<Eye size={16} aria-hidden />
						)}
						{showNumber ? "Hide number" : "Show number"}
					</Button>
					<Button variant="ghost" disabled={!showNumber} onClick={copyNumber}>
						{copyStatus === "copied" ? (
							<Check size={16} aria-hidden />
						) : (
							<Copy size={16} aria-hidden />
						)}
						{copyStatus === "copied" ? "Copied" : "Copy number"}
					</Button>
				</div>
				{copyStatus === "error" ? (
					<p role="alert" className="text-danger mt-2 text-[13px]">
						Could not copy. Select the visible card number to copy it.
					</p>
				) : null}
			</section>

			<section className="border-line rounded-2xl border p-4">
				<div className="flex items-center justify-between gap-3">
					<h2 className="text-ink text-[14px] font-medium">Card access</h2>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-[12px] font-medium",
							card.locked
								? "bg-surface-sunken text-ink-muted"
								: "bg-brand-soft text-brand",
						)}
					>
						{card.locked ? "Locked" : "Unlocked"}
					</span>
				</div>
				<p className="text-ink-muted mt-2 text-[13px] leading-relaxed">
					Locking pauses transfers, bills and mobile load.
				</p>
				<Button
					variant="outline"
					className="mt-4"
					disabled={update.isPending}
					onClick={() => {
						setMessage("");
						update.mutate({ locked: !card.locked });
					}}
				>
					{card.locked ? (
						<LockKeyholeOpen size={17} aria-hidden />
					) : (
						<Lock size={17} aria-hidden />
					)}
					{savingLock ? "Saving…" : card.locked ? "Unlock card" : "Lock card"}
				</Button>
				{update.variables?.locked !== undefined ? feedback : null}
			</section>

			<form onSubmit={saveLimit} className="border-line rounded-2xl border p-4">
				<TextField
					label="Daily spending limit"
					hint="Transfers, bills and mobile load."
					prefix="₱"
					name="dailyLimit"
					type="number"
					inputMode="decimal"
					min={0}
					max={100_000}
					step="0.01"
					required
					value={limit}
					disabled={update.isPending}
					onChange={(event) => {
						setLimitDraft(event.target.value);
						setMessage("");
						update.reset();
					}}
				/>
				<Button
					type="submit"
					className="mt-4"
					disabled={update.isPending || limitInCentavos === card.dailyLimit}
				>
					{savingLimit ? "Saving…" : "Save limit"}
				</Button>
				{update.variables?.dailyLimit !== undefined ? feedback : null}
			</form>
		</div>
	);
}
