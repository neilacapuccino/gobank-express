"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { StepBar } from "~/shared/ui/step-bar";
import { EMPTY_DRAFT, type RegistrationDraft } from "../auth.rules";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { StepCard } from "./step-card";
import { StepDetails } from "./step-details";
import { StepIdentity } from "./step-identity";
import { StepReview } from "./step-review";
import type { CardBrandId } from "~/features/card/card-brands";
import { activateClientSession } from "../session.client";

type CardPreview = RouterOutputs["auth"]["prepareCard"];

type RegistrationFlowProps = {
	initialFullName: string;
	gmail: string | null;
	withGoogle: boolean;
};

const STEP = { identity: 1, card: 2, details: 3, review: 4 } as const;
const TOTAL_STEPS = 4;

const stillValid = (card: CardPreview | null, brand: CardBrandId) =>
	card?.brand === brand && Date.parse(card.validUntil) > Date.now();

function RegistrationHeader({
	step,
	busy,
}: {
	step: number;
	busy: () => boolean;
}) {
	return (
		<header className="flex flex-col gap-5">
			<div className="flex items-center justify-between">
				<Link
					href="/"
					aria-disabled={busy()}
					onClick={(event) => {
						if (busy()) event.preventDefault();
					}}
					className="text-ink-muted hover:text-ink text-[13px] transition-colors"
				>
					GoBank Express
				</Link>
				<span className="text-ink-muted text-[12px] tabular-nums">
					Step {step} of {TOTAL_STEPS}
				</span>
			</div>

			<StepBar current={step} total={TOTAL_STEPS} />
		</header>
	);
}

function PrepareError({
	message,
	retrying,
	onRetry,
}: {
	message: string | null;
	retrying: boolean;
	onRetry: () => void;
}) {
	return (
		<div role="alert" className="mt-4">
			<p className="text-danger text-[13px]">{message}</p>
			<button
				type="button"
				onClick={onRetry}
				disabled={retrying}
				className="text-brand mt-2 min-h-10 text-[13px] font-medium disabled:opacity-45"
			>
				Try again
			</button>
		</div>
	);
}

export function RegistrationFlow({
	initialFullName,
	gmail,
	withGoogle,
}: RegistrationFlowProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [draft, setDraft] = useState<RegistrationDraft>({
		...EMPTY_DRAFT,
		fullName: initialFullName,
	});
	const [step, setStep] = useState<number>(STEP.identity);
	const [card, setCard] = useState<CardPreview | null>(null);
	const preparingCard = useRef(false);

	const prepare = api.auth.prepareCard.useMutation();
	const register = api.auth.register.useMutation({
		onSuccess: ({ sessionId }) => {
			activateClientSession(sessionId);
			queryClient.clear();
			router.replace("/dashboard");
			router.refresh();
		},
	});

	const busy = () => preparingCard.current || register.isPending;

	const patch = (next: Partial<RegistrationDraft>) => {
		setDraft((current) => ({ ...current, ...next }));
		register.reset();
	};

	const prepareCard = (goToDetails: boolean) => {
		if (busy()) return;

		if (goToDetails && stillValid(card, draft.brand)) {
			prepare.reset();
			setStep(STEP.details);
			return;
		}

		preparingCard.current = true;
		setCard(null);
		register.reset();

		prepare.mutate(
			{ brand: draft.brand },
			{
				onSuccess: (preview) => {
					setCard(preview);
					if (goToDetails) setStep(STEP.details);
				},
				onSettled: () => {
					preparingCard.current = false;
				},
			},
		);
	};

	const selectBrand = (brand: CardBrandId) => {
		if (preparingCard.current || brand === draft.brand) return;

		patch({ brand });
		setCard(null);
		prepare.reset();
	};

	const submit = () =>
		register.mutate({
			username: draft.username,
			pin: draft.pin,
			brand: draft.brand,
			fullName: draft.fullName,
			mobile: draft.mobile,
			withGoogle,
		});

	return (
		<div className="flex flex-1 flex-col">
			<RegistrationHeader step={step} busy={busy} />

			<div key={step} className="animate-step-in mt-10 flex flex-1 flex-col">
				{step === STEP.identity ? (
					<StepIdentity
						username={draft.username}
						onUsernameChange={(username) => patch({ username })}
						onComplete={(pin) => {
							patch({ pin });
							setStep(STEP.card);
						}}
					/>
				) : null}

				{step === STEP.card ? (
					<StepCard
						brand={draft.brand}
						fullName={draft.fullName.trim()}
						preparing={prepare.isPending}
						onBrandChange={selectBrand}
						onNext={() => prepareCard(true)}
						onBack={() => {
							if (!preparingCard.current) setStep(STEP.identity);
						}}
					/>
				) : null}

				{step === STEP.details ? (
					<StepDetails
						fullName={draft.fullName}
						mobile={draft.mobile}
						gmail={gmail}
						onChange={patch}
						onNext={() => setStep(STEP.review)}
						onBack={() => setStep(STEP.card)}
					/>
				) : null}

				{step === STEP.review && card ? (
					<StepReview
						draft={draft}
						card={card}
						pending={register.isPending || register.isSuccess}
						error={errorMessage(register.error)}
						onBack={() => setStep(STEP.details)}
						onRefreshCard={() => prepareCard(false)}
						onSubmit={submit}
					/>
				) : null}

				{step === STEP.review && !card && prepare.isPending ? (
					<p
						role="status"
						className="text-ink-muted py-8 text-center text-[14px]"
					>
						Preparing your card details…
					</p>
				) : null}

				{prepare.isError && step > STEP.identity ? (
					<PrepareError
						message={errorMessage(prepare.error)}
						retrying={prepare.isPending}
						onRetry={() => prepareCard(step === STEP.card)}
					/>
				) : null}
			</div>
		</div>
	);
}
