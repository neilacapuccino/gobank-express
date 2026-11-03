import {
	ArrowDownLeft,
	ArrowLeftRight,
	Gem,
	Nfc,
	PiggyBank,
} from "lucide-react";
import { GoBankLogo } from "~/shared/ui/gobank-logo";
import { WelcomeActions } from "./welcome-actions";

type WelcomeScreenProps = {
	googleEnabled: boolean;
	notice: string | null;
};

const FEATURES = [
	{ icon: ArrowLeftRight, label: "Instant transfers" },
	{ icon: PiggyBank, label: "Goal savings" },
	{ icon: Gem, label: "Cash-back points" },
];

export function WelcomeScreen({ googleEnabled, notice }: WelcomeScreenProps) {
	return (
		<div className="bg-surface-sunken text-ink min-h-dvh">
			<main className="bg-surface border-line mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 pt-5 pb-6 sm:border-x">
				<header>
					<GoBankLogo className="text-ink h-9 w-auto" />
				</header>

				<WelcomePreview />

				<section className="animate-step-in">
					<h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight">
						Everyday banking,
						<br />
						<span className="text-brand">made simple.</span>
					</h1>
					<p className="text-ink-muted mt-3 text-[14px] leading-relaxed">
						Send money instantly, pay bills, save toward your goals and earn
						cash back on everyday spending.
					</p>
					<ul className="mt-5 grid grid-cols-3 gap-2">
						{FEATURES.map(({ icon: Icon, label }) => (
							<li
								key={label}
								className="border-line bg-surface-sunken flex flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5"
							>
								<Icon size={18} className="text-brand" aria-hidden />
								<span className="text-ink-soft text-[12px] leading-tight font-medium">
									{label}
								</span>
							</li>
						))}
					</ul>
				</section>

				<div className="min-h-6 flex-1" />

				{notice && (
					<p
						role="alert"
						className="border-danger/40 bg-danger-soft text-danger mb-4 rounded-xl border px-4 py-3 text-center text-[13px]"
					>
						{notice}
					</p>
				)}
				<WelcomeActions googleEnabled={googleEnabled} />
			</main>
		</div>
	);
}

function WelcomePreview() {
	return (
		<div aria-hidden className="relative mt-6 mb-7 h-[208px] shrink-0">
			<div className="absolute top-0 right-0 w-[76%] -rotate-3 rounded-[18px] bg-[linear-gradient(135deg,#0a7a56_0%,#065f46_40%,#0d1f19_100%)] p-4 shadow-[0_24px_48px_-24px_#000000cc] ring-1 ring-white/10 ring-inset">
				<div className="flex aspect-[1.586/1] flex-col justify-between">
					<div className="flex items-center justify-between">
						<span className="h-6 w-8 rounded-[5px] bg-[linear-gradient(135deg,#ead8a6,#b89356)]" />
						<Nfc size={18} className="text-white/60" />
					</div>
					<div className="flex flex-col items-end gap-1">
						<span className="text-[13px] font-medium tracking-[0.14em] text-white/90 tabular-nums">
							•••• 4821
						</span>
						<span className="text-[10px] font-medium tracking-[0.12em] text-white/60 uppercase">
							Debit
						</span>
					</div>
				</div>
			</div>

			<div className="bg-surface-raised absolute bottom-0 left-0 w-[58%] rounded-2xl p-3.5 shadow-[0_18px_40px_-16px_#000000e6] ring-1 ring-white/10">
				<p className="text-ink-muted text-[11px]">Available balance</p>
				<p className="mt-0.5 text-[20px] font-semibold tracking-tight tabular-nums">
					₱12,480.50
				</p>
				<div className="border-line mt-2.5 flex items-center gap-2 border-t pt-2.5">
					<span className="bg-brand-soft text-brand grid h-6 w-6 shrink-0 place-items-center rounded-full">
						<ArrowDownLeft size={13} />
					</span>
					<span className="text-ink-soft min-w-0 flex-1 truncate text-[11px]">
						@dante
					</span>
					<span className="text-brand text-[11px] font-semibold tabular-nums">
						+₱500.00
					</span>
				</div>
			</div>
		</div>
	);
}
