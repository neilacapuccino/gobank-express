"use client";

import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { formatAccount, peso } from "~/shared/lib/format";

export function BalanceCard({
	balance,
	accountNumber,
	points,
}: {
	balance: number;
	accountNumber: string;
	points: number;
}) {
	const [visible, setVisible] = useState(true);
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
		"idle",
	);

	useEffect(() => {
		if (copyStatus !== "copied") return;
		const timer = setTimeout(() => setCopyStatus("idle"), 2000);
		return () => clearTimeout(timer);
	}, [copyStatus]);

	const copyAccountNumber = async () => {
		try {
			await navigator.clipboard.writeText(accountNumber);
			setCopyStatus("copied");
		} catch {
			setCopyStatus("error");
		}
	};

	return (
		<section className="bg-surface-raised text-ink relative isolate overflow-hidden rounded-[28px] px-6 py-6 shadow-[0_10px_26px_-12px_#00000080]">
			<p className="text-ink-muted text-[13px]">Available balance</p>

			<div className="mt-2 flex min-h-12 items-center gap-2">
				<p className="flex min-w-0 items-center text-[clamp(1.6rem,8vw,2.35rem)] leading-tight font-semibold tracking-tight break-all tabular-nums">
					{visible ? (
						peso(balance)
					) : (
						<span
							role="img"
							aria-label="Balance hidden"
							className="inline-flex items-center gap-2 leading-none"
						>
							<span className="block" aria-hidden>
								₱
							</span>
							<span className="flex items-center gap-2" aria-hidden>
								{Array.from({ length: 6 }, (_, index) => (
									<span
										key={index}
										className="h-[7px] w-[7px] shrink-0 rounded-full bg-current"
									/>
								))}
							</span>
						</span>
					)}
				</p>
				<button
					type="button"
					onClick={() => setVisible((value) => !value)}
					aria-label={visible ? "Hide balance" : "Show balance"}
					aria-pressed={!visible}
					className="text-ink-muted hover:text-ink grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					{visible ? (
						<Eye size={17} strokeWidth={2} aria-hidden />
					) : (
						<EyeOff size={17} strokeWidth={2} aria-hidden />
					)}
				</button>
			</div>

			<div className="border-line text-ink-muted mt-6 flex items-center justify-between border-t pt-4 text-[11px]">
				<div className="flex min-w-0 items-center gap-1">
					<span className="tabular-nums select-text">
						{formatAccount(accountNumber)}
					</span>
					<button
						type="button"
						onClick={copyAccountNumber}
						aria-label="Copy account number"
						title={copyStatus === "copied" ? "Copied" : "Copy account number"}
						className="text-ink-muted hover:bg-line hover:text-ink grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						{copyStatus === "copied" ? (
							<Check size={15} aria-hidden />
						) : (
							<Copy size={15} aria-hidden />
						)}
					</button>
				</div>
				<span className="shrink-0 tabular-nums">
					{points.toLocaleString()} points
				</span>
			</div>
			<p
				role="status"
				className={
					copyStatus === "error" ? "text-danger mt-2 text-[11px]" : "sr-only"
				}
			>
				{copyStatus === "copied"
					? "Account number copied."
					: copyStatus === "error"
						? "Couldn't copy. Select the account number to copy it."
						: ""}
			</p>
		</section>
	);
}
