"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepBar } from "~/shared/ui/step-bar";
import { EMPTY_DRAFT, type RegistrationDraft } from "../auth.rules";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { StepCard } from "./step-card";
import { StepDetails } from "./step-details";
import { StepIdentity } from "./step-identity";
import { StepReview } from "./step-review";
import type { CardBrandId } from "~/features/card/card-brands";

const TOTAL_STEPS = 4;
type CardPreview = RouterOutputs["auth"]["prepareCard"];

export function RegistrationFlow() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [draft, setDraft] = useState<RegistrationDraft>(EMPTY_DRAFT);
	const [step, setStep] = useState(1);
	const [card, setCard] = useState<CardPreview | null>(null);
	const prepare = api.auth.prepareCard.useMutation();
	const register = api.auth.register.useMutation({
		onSuccess: () => {
			queryClient.clear();
			router.replace("/dashboard");
			router.refresh();
		},
	});
	const patch = (next: Partial<RegistrationDraft>) => {
		setDraft((current) => ({ ...current, ...next }));
		register.reset();
	};
	const prepareCard = (brand: CardBrandId) => {
		setCard(null);
		register.reset();
		prepare.mutate({ brand }, { onSuccess: setCard });
	};
	return (
		<div className="flex flex-1 flex-col">
			<header className="flex flex-col gap-5">
				<div className="flex items-center justify-between">
					<Link
						href="/"
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
			<div key={step} className="animate-step-in mt-10 flex flex-1 flex-col">
				{step === 1 && (
					<StepIdentity
						username={draft.username}
						onUsernameChange={(username) => patch({ username })}
						onComplete={(pin) => {
							patch({ pin });
							setStep(2);
							prepareCard(draft.brand);
						}}
					/>
				)}
				{step === 2 && (
					<StepCard
						brand={draft.brand}
						fullName={draft.fullName.trim()}
						card={card}
						preparing={prepare.isPending}
						onBrandChange={(brand) => {
							patch({ brand });
							prepareCard(brand);
						}}
						onNext={() => setStep(3)}
						onBack={() => setStep(1)}
					/>
				)}
				{step === 3 && (
					<StepDetails
						fullName={draft.fullName}
						mobile={draft.mobile}
						onChange={patch}
						onNext={() => setStep(4)}
						onBack={() => setStep(2)}
					/>
				)}
				{step === 4 && card && (
					<StepReview
						draft={draft}
						card={card}
						pending={register.isPending || register.isSuccess}
						error={errorMessage(register.error)}
						onBack={() => setStep(3)}
						onRefreshCard={() => prepareCard(draft.brand)}
						onSubmit={() =>
							register.mutate({
								username: draft.username,
								pin: draft.pin,
								brand: draft.brand,
								fullName: draft.fullName,
								mobile: draft.mobile,
							})
						}
					/>
				)}
				{step === 4 && !card && prepare.isPending && (
					<p
						role="status"
						className="text-ink-muted py-8 text-center text-[14px]"
					>
						Preparing your card details…
					</p>
				)}
				{prepare.isError && step > 1 && (
					<div role="alert" className="mt-4">
						<p className="text-danger text-[13px]">
							{errorMessage(prepare.error)}
						</p>
						<button
							type="button"
							onClick={() => prepareCard(draft.brand)}
							disabled={prepare.isPending}
							className="text-brand mt-2 min-h-10 text-[13px] font-medium disabled:opacity-45"
						>
							Try again
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
