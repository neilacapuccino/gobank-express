import { GoBankLogo } from "~/shared/ui/gobank-logo";
import { WelcomeActions } from "./welcome-actions";
import { WelcomeMascot } from "./welcome-mascot";

type WelcomeScreenProps = {
	googleEnabled: boolean;
	notice: string | null;
};

export function WelcomeScreen({ googleEnabled, notice }: WelcomeScreenProps) {
	return (
		<div className="bg-surface-sunken text-ink min-h-dvh lg:bg-[radial-gradient(70%_55%_at_50%_0%,#05966924,transparent_70%)]">
			<main className="bg-surface border-line mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 pt-5 pb-6 sm:border-x">
				<header>
					<GoBankLogo className="text-ink h-9 w-auto" />
				</header>

				<WelcomeMascot />

				<section className="animate-step-in text-center">
					<p className="border-brand-line bg-brand-soft text-brand inline-flex rounded-full border px-3 py-1 text-[12px] font-medium">
						Banking made for students
					</p>
					<h1 className="mt-4 text-[28px] leading-[1.15] font-semibold tracking-tight">
						Send, save and earn
						<br />
						<span className="text-brand">in one app.</span>
					</h1>
					<p className="text-ink-muted mx-auto mt-3 max-w-[320px] text-[14px] leading-relaxed">
						Instant transfers, goal savings and cash back on every ₱50 you
						spend.
					</p>
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
