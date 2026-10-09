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
import { useRef, useState, type FormEvent } from "react";
import { cn } from "~/shared/lib/cn";
import { peso } from "~/shared/lib/format";
import { toCentavos, toPesos } from "~/shared/lib/money";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { MAX_DAILY_LIMIT_CENTAVOS } from "../card.rules";
import { BankCard, type CardKind } from "./bank-card";
import styles from "./card-screen.module.css";

type CardOverview = RouterOutputs["card"]["get"];
type Card = CardOverview["physical"];
type CvvState =
	| { status: "hidden" | "pending" }
	| { status: "visible"; cvv: string }
	| { status: "error"; message: string };

const DETAIL_ACTION =
	"text-ink-muted enabled:hover:text-ink focus-visible:outline-brand inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-1 text-[12.5px] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-45";
const ICON_ACTION =
	"inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/60 enabled:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:opacity-30";

export function CardScreen() {
	const card = api.card.get.useQuery();
	const account = api.account.overview.useQuery();

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="My card" back="/dashboard" />
			{card.isPending ? (
				<p role="status" className="text-ink-muted mt-10 text-center text-sm">
					Loading your cards…
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
						{errorMessage(card.error) ?? "Could not load your cards."}
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

function CardControls({ card }: { card: CardOverview }) {
	const [selectedKind, setSelectedKind] = useState<CardKind>("physical");
	const selectedCard = card[selectedKind];

	return (
		<>
			<div
				className="border-line bg-surface-sunken grid grid-cols-2 gap-1 rounded-xl border p-1"
				role="group"
				aria-label="Card kind"
			>
				{(["physical", "virtual"] as const).map((kind) => (
					<button
						key={kind}
						type="button"
						aria-pressed={selectedKind === kind}
						onClick={() => setSelectedKind(kind)}
						className={cn(
							"focus-visible:outline-brand flex min-h-11 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-2",
							selectedKind === kind
								? "bg-surface-raised text-ink"
								: "text-ink-muted hover:text-ink",
						)}
					>
						{kind === "physical" ? (
							<CreditCard size={16} aria-hidden />
						) : (
							<Smartphone size={16} aria-hidden />
						)}
						{kind === "physical" ? "Physical" : "Virtual"}
					</button>
				))}
			</div>
			<CardDetails key={selectedKind} card={selectedCard} />
			<CardSettings
				cardLocked={card.cardLocked}
				cardDailyLimit={card.cardDailyLimit}
			/>
		</>
	);
}

function CardDetails({ card }: { card: Card }) {
	const utils = api.useUtils();
	const [showNumber, setShowNumber] = useState(true);
	const [cvv, setCvv] = useState<CvvState>({ status: "hidden" });
	const cvvRequest = useRef(0);
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
		"idle",
	);

	const revealCvv = async () => {
		const request = ++cvvRequest.current;
		setCopyStatus("idle");
		if (cvv.status === "visible") {
			setCvv({ status: "hidden" });
			return;
		}
		setCvv({ status: "pending" });
		try {
			const details = await utils.client.card.revealCvv.query({
				kind: card.kind,
			});
			if (request !== cvvRequest.current) return;
			setCvv({ status: "visible", cvv: details.cvv });
		} catch (error) {
			if (request !== cvvRequest.current) return;
			setCvv({
				status: "error",
				message:
					error instanceof Error ? error.message : "Could not load your CVV.",
			});
		}
	};

	const copyCvv = async () => {
		if (cvv.status !== "visible") return;
		const request = cvvRequest.current;
		try {
			await navigator.clipboard.writeText(cvv.cvv);
			if (request !== cvvRequest.current) return;
			setCopyStatus("copied");
		} catch {
			if (request !== cvvRequest.current) return;
			setCopyStatus("error");
		}
	};

	return (
		<section aria-label="Card details" className="mt-4">
			<div className={styles.cardStage}>
				<div className={styles.switchCard}>
					<BankCard
						brand={card.brand}
						fullName={card.user.fullName}
						number={card.number}
						hideNumber={!showNumber}
						onToggleNumber={() => setShowNumber((visible) => !visible)}
						expiresAt={card.expiresAt}
						kind={card.kind}
						securityDetails={
							<div
								aria-label="Card security code"
								className="flex shrink-0 flex-col"
							>
								<span className="text-[9px] tracking-[0.18em] text-white/55">
									CVV
								</span>
								<div className="flex h-7 items-center gap-0.5">
									<span className="min-w-6 text-[13px] font-medium text-white tabular-nums">
										{cvv.status === "visible" ? cvv.cvv : "•••"}
									</span>
									<button
										type="button"
										aria-label={
											copyStatus === "copied" ? "CVV copied" : "Copy CVV"
										}
										disabled={cvv.status !== "visible"}
										onClick={copyCvv}
										className={ICON_ACTION}
									>
										{copyStatus === "copied" ? (
											<Check size={14} aria-hidden />
										) : (
											<Copy size={14} aria-hidden />
										)}
									</button>
									<button
										type="button"
										aria-label={
											cvv.status === "visible" ? "Hide CVV" : "Show CVV"
										}
										aria-pressed={cvv.status === "visible"}
										disabled={cvv.status === "pending"}
										onClick={revealCvv}
										className={ICON_ACTION}
									>
										{cvv.status === "pending" ? (
											<span
												className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
												aria-hidden
											/>
										) : cvv.status === "visible" ? (
											<EyeOff size={15} aria-hidden />
										) : (
											<Eye size={15} aria-hidden />
										)}
									</button>
								</div>
							</div>
						}
					/>
				</div>
			</div>
			<span role="status" className="sr-only">
				{copyStatus === "copied" ? "CVV copied." : ""}
			</span>
			{cvv.status === "error" || copyStatus === "error" ? (
				<p role="alert" className="text-danger mt-1 text-[13px]">
					{cvv.status === "error"
						? cvv.message
						: "Could not copy CVV. Try again."}
				</p>
			) : null}
		</section>
	);
}

function CardSettings({
	cardLocked,
	cardDailyLimit,
}: Pick<CardOverview, "cardLocked" | "cardDailyLimit">) {
	const utils = api.useUtils();
	const [limitDraft, setLimitDraft] = useState<string | null>(null);
	const [message, setMessage] = useState("");
	const update = api.card.update.useMutation({
		onMutate: async () => {
			await utils.card.get.cancel();
		},
		onSuccess: (updated, settings) => {
			utils.card.get.setData(undefined, updated);
			if (settings.cardDailyLimit !== undefined) setLimitDraft(null);
			setMessage(
				settings.cardDailyLimit !== undefined
					? "Daily limit saved."
					: updated.cardLocked
						? "Cards locked."
						: "Cards unlocked.",
			);
		},
	});
	const limit = limitDraft ?? String(toPesos(cardDailyLimit));
	const limitInCentavos = toCentavos(Number(limit));
	const savingLock =
		update.isPending && update.variables.cardLocked !== undefined;
	const canSaveLimit =
		limit.trim() !== "" &&
		Number.isFinite(limitInCentavos) &&
		limitInCentavos >= 0 &&
		limitInCentavos <= MAX_DAILY_LIMIT_CENTAVOS &&
		limitInCentavos !== cardDailyLimit;

	const saveLimit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSaveLimit || update.isPending) return;
		setMessage("");
		update.mutate({ cardDailyLimit: limitInCentavos });
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
							cardLocked ? "text-ink-muted" : "text-brand",
						)}
					>
						{cardLocked ? "Locked" : "Unlocked"}
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
						update.mutate({ cardLocked: !cardLocked });
					}}
					className="border-line-strong text-ink bg-surface enabled:hover:bg-surface-raised focus-visible:outline-brand inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium focus-visible:outline-2 disabled:opacity-45"
				>
					{cardLocked ? (
						<LockKeyholeOpen size={15} aria-hidden />
					) : (
						<Lock size={15} aria-hidden />
					)}
					{savingLock ? "Saving…" : cardLocked ? "Unlock" : "Lock"}
				</button>
			</div>
			<form onSubmit={saveLimit} className="border-line mt-4 border-t pt-4">
				<TextField
					label="Daily spending limit"
					prefix="₱"
					name="cardDailyLimit"
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
