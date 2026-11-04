"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { peso } from "~/shared/lib/format";
import { FormError } from "~/shared/ui/money-form-ui";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

export function CloseGoal({
	goalId,
	balance,
	disabled,
}: {
	goalId: string;
	balance: number;
	disabled: boolean;
}) {
	const router = useRouter();
	const [confirming, setConfirming] = useState(false);

	const remove = api.goals.remove.useMutation({
		onSuccess: () => {
			router.replace("/goals");
			router.refresh();
		},
	});

	const removing = remove.isPending || remove.isSuccess;
	const busy = disabled || removing;

	if (!confirming) {
		return (
			<div className="flex justify-center pt-8 pb-3">
				<button
					type="button"
					disabled={busy}
					onClick={() => setConfirming(true)}
					className="border-line-strong text-ink hover:bg-surface-raised focus-visible:outline-sky h-11 w-fit rounded-full border px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-45"
				>
					Close this GoalSave
				</button>
			</div>
		);
	}

	return (
		<div
			className="border-line mt-8 space-y-3 rounded-2xl border p-4"
			role="region"
			aria-label="Close GoalSave confirmation"
		>
			<h3 className="font-semibold">Close this GoalSave?</h3>
			<p className="text-ink-soft text-[13px] leading-relaxed">
				{peso(balance)} will return to your main account. This goal will be
				removed, and past transfers will stay in your account activity.
			</p>

			<FormError error={errorMessage(remove.error)} />

			<button
				type="button"
				disabled={busy}
				onClick={() => remove.mutate({ id: goalId })}
				className="bg-danger-soft text-danger focus-visible:outline-danger h-11 w-full rounded-xl text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-45"
			>
				{remove.isPending ? "Closing…" : "Close and return savings"}
			</button>
			<button
				type="button"
				disabled={removing}
				onClick={() => {
					setConfirming(false);
					remove.reset();
				}}
				className="text-ink-soft hover:text-ink focus-visible:outline-sky h-11 w-full rounded-xl text-sm focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-45"
			>
				Keep GoalSave
			</button>
		</div>
	);
}
