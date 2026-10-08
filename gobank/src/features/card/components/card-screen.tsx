"use client";

import {
	Check,
	Copy,
	CreditCard,
	Eye,
	EyeOff,
	Lock,
	LockKeyholeOpen,
	Smartphone,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { cn } from "~/shared/lib/cn";
import { peso } from "~/shared/lib/format";
import { toCentavos, toPesos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { MAX_DAILY_LIMIT_CENTAVOS } from "../card.rules";
import { BankCard, type CardView } from "./bank-card";
import styles from "./card-screen.module.css";

type Card = RouterOutputs["card"]["get"];
type CvvState =
	| { status: "hidden" | "pending" }
	| { status: "visible"; cvv: string }
	| { status: "error"; message: string };

const DETAIL_ACTION =
	"text-ink-muted enabled:hover:text-ink focus-visible:outline-brand inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-1 text-[12.5px] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-45";

export function CardScreen() {
	const card = api.card.get.useQuery();
	const account = api.account.overview.useQuery();

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="My card" back="/dashboard" />
			{card.isPending ? (
				<p role="status" className="text-ink-muted mt-10 text-center text-sm">
					Loading your card…
				</p>
			) : card.data ? (
				<div className="mt-7">
					<div className="mb-5 flex items-baseline justify-between gap-3">
						<p className="text-ink-muted text-[13px]">Main balance</p>
						{account.isError ? (
							<button
								type="button"
								onClick={() => void account.refetch()}
								disabled={account.isFetching}
								className={DETAIL_ACTION}
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
					<CardControls card={card.data} />
				</div>
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
	const [view, setView] = useState<CardView>("virtual");
	const [showNumber, setShowNumber] = useState(true);
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
		"idle",
	);
	const [cvv, setCvv] = useState<CvvState>({ status: "hidden" });

	const revealCvv = async () => {
		if (cvv.status === "visible") {
			setCvv({ status: "hidden" });
			return;
		}
		setCvv({ status: "pending" });
		try {
			const details = card.hasCvv
				? await utils.client.card.revealCvv.query()
				: await utils.client.card.createCvv.mutate();
			if (!card.hasCvv) {
				utils.card.get.setData(undefined, (current) =>
					current ? { ...current, hasCvv: true } : current,
				);
			}
			setCvv({ status: "visible", cvv: details.cvv });
		} catch (error) {
			setCvv({
				status: "error",
				message:
					error instanceof Error ? error.message : "Could not load your CVV.",
			});
		}
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
		<>
			<div
				className="border-line bg-surface-sunken grid grid-cols-2 gap-1 rounded-xl border p-1"
				role="group"
				aria-label="Card view"
			>
				{(["physical", "virtual"] as const).map((option) => (
					<button
						key={option}
						type="button"
						aria-pressed={view === option}
						onClick={() => setView(option)}
						className={cn(
							"focus-visible:outline-brand flex min-h-11 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-2",
							view === option
								? "bg-surface-raised text-ink"
								: "text-ink-muted hover:text-ink",
						)}
					>
						{option === "physical" ? (
							<CreditCard size={16} aria-hidden />
						) : (
							<Smartphone size={16} aria-hidden />
						)}
						{option === "physical" ? "Physical" : "Virtual"}
					</button>
				))}
			</div>
			<section aria-label="Card details" className="mt-4">
				<div className={styles.cardStage}>
					<div key={view} className={styles.switchCard}>
						<BankCard
							brand={card.brand}
							fullName={card.user.fullName}
							number={card.number}
							hideNumber={!showNumber}
							expiresAt={card.expiresAt}
							view={view}
						/>
					</div>
				</div>
				<div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-1">
					<button
						type="button"
						aria-pressed={showNumber}
						className={DETAIL_ACTION}
						onClick={() => {
							setShowNumber((visible) => !visible);
							setCopyStatus("idle");
						}}
					>
						{showNumber ? (
							<EyeOff size={15} aria-hidden />
						) : (
							<Eye size={15} aria-hidden />
						)}
						{showNumber ? "Hide number" : "Show number"}
					</button>
					<button
						type="button"
						aria-label={
							copyStatus === "copied"
								? "Card number copied"
								: "Copy card number"
						}
						disabled={!showNumber}
						onClick={copyNumber}
						className={cn(DETAIL_ACTION, "min-w-10")}
					>
						{copyStatus === "copied" ? (
							<Check size={16} aria-hidden />
						) : (
							<Copy size={16} aria-hidden />
						)}
					</button>
					<button
						type="button"
						aria-label={
							cvv.status === "visible"
								? "Hide CVV"
								: card.hasCvv
									? "Show CVV"
									: "Create CVV"
						}
						aria-pressed={cvv.status === "visible"}
						disabled={cvv.status === "pending"}
						onClick={revealCvv}
						className={DETAIL_ACTION}
					>
						{cvv.status === "visible" ? (
							<>
								<span className="tabular-nums">CVV {cvv.cvv}</span>
								<EyeOff size={15} aria-hidden />
							</>
						) : cvv.status === "pending" ? (
							"Loading…"
						) : card.hasCvv ? (
							"Show CVV"
						) : (
							"Create CVV"
						)}
					</button>
				</div>
				{copyStatus === "error" || cvv.status === "error" ? (
					<p role="alert" className="text-danger mt-1 text-[13px]">
						{cvv.status === "error"
							? cvv.message
							: "Could not copy. Select the card number to copy it."}
					</p>
				) : null}
			</section>
			<CardSettings card={card} />
		</>
	);
}

function CardSettings({ card }: { card: Card }) {
	const utils = api.useUtils();
	const [limitDraft, setLimitDraft] = useState<string | null>(null);
	const [message, setMessage] = useState("");
	const update = api.card.update.useMutation({
		onMutate: async () => {
			await utils.card.get.cancel();
		},
		onSuccess: (updated, settings) => {
			utils.card.get.setData(undefined, updated);
			if (settings.dailyLimit !== undefined) setLimitDraft(null);
			setMessage(
				settings.dailyLimit !== undefined
					? "Daily limit saved."
					: updated.locked
						? "Card locked."
						: "Card unlocked.",
			);
		},
	});
	const limit = limitDraft ?? String(toPesos(card.dailyLimit));
	const limitInCentavos = toCentavos(Number(limit));
	const savingLock = update.isPending && update.variables.locked !== undefined;
	const canSaveLimit =
		limit.trim() !== "" &&
		Number.isFinite(limitInCentavos) &&
		limitInCentavos >= 0 &&
		limitInCentavos <= MAX_DAILY_LIMIT_CENTAVOS &&
		limitInCentavos !== card.dailyLimit;

	const saveLimit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSaveLimit || update.isPending) return;
		setMessage("");
		update.mutate({ dailyLimit: limitInCentavos });
	};

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
							card.locked ? "text-ink-muted" : "text-brand",
						)}
					>
						{card.locked ? "Locked" : "Unlocked"}
					</h2>
					<p className="text-ink-muted mt-1 text-[12px]">
						Transfers, bills and mobile load.
					</p>
				</div>
				<button
					type="button"
					disabled={update.isPending}
					onClick={() => {
						setMessage("");
						update.mutate({ locked: !card.locked });
					}}
					className="border-line-strong text-ink bg-surface enabled:hover:bg-surface-raised focus-visible:outline-brand inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium focus-visible:outline-2 disabled:opacity-45"
				>
					{card.locked ? (
						<LockKeyholeOpen size={15} aria-hidden />
					) : (
						<Lock size={15} aria-hidden />
					)}
					{savingLock ? "Saving…" : card.locked ? "Unlock" : "Lock"}
				</button>
			</div>
			<form onSubmit={saveLimit} className="border-line mt-4 border-t pt-4">
				<TextField
					label="Daily spending limit"
					prefix="₱"
					name="dailyLimit"
					type="number"
					inputMode="decimal"
					min={0}
					max={toPesos(MAX_DAILY_LIMIT_CENTAVOS)}
					step="0.01"
					required
					value={limit}
					disabled={update.isPending}
					onChange={(event) => {
						setLimitDraft(event.target.value);
						setMessage("");
						update.reset();
					}}
					trailing={
						<button
							type="submit"
							aria-label="Save daily spending limit"
							disabled={update.isPending || !canSaveLimit}
							className="bg-brand enabled:hover:bg-brand-hover focus-visible:outline-brand disabled:bg-brand/35 min-h-9 rounded-lg px-3 text-[13px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:text-white/65"
						>
							{update.isPending && !savingLock ? "Saving…" : "Save"}
						</button>
					}
				/>
			</form>
			{update.error || message ? (
				<p
					role={update.error ? "alert" : "status"}
					className={cn(
						"mt-3 text-[13px]",
						update.error ? "text-danger" : "text-brand",
					)}
				>
					{errorMessage(update.error) ?? message}
				</p>
			) : null}
		</section>
	);
}
