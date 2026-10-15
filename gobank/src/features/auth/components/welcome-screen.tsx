import Image from "next/image";
import { WelcomeActions } from "./welcome-actions";
import styles from "./welcome-screen.module.css";

type WelcomeScreenProps = {
	googleEnabled: boolean;
	notice: string | null;
};

export function WelcomeScreen({ googleEnabled, notice }: WelcomeScreenProps) {
	return (
		<div className="bg-surface-sunken text-ink min-h-dvh">
			<main className="bg-surface border-line mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 py-6 sm:border-x">
				<div
					aria-hidden
					className="h-1.5 shrink-0 overflow-hidden rounded-full bg-white/10"
				>
					<span
						className={`${styles.progressFill} bg-brand block h-full rounded-full`}
					/>
				</div>

				<div className="flex flex-1 flex-col justify-center py-6">
					<section className="flex flex-col items-center pt-2 pb-8 text-center">
						<div className="relative isolate h-[clamp(180px,30vh,280px)] w-full max-w-[380px] shrink-0">
							<div
								aria-hidden
								className="pointer-events-none absolute -inset-x-6 -inset-y-4 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] opacity-45"
							>
								<Image
									src="/images/welcome-atmosphere.webp"
									alt=""
									fill
									priority
									sizes="(max-width: 440px) 100vw, 428px"
									className="object-contain"
								/>
							</div>
							<Image
								src="/images/welcome-growth.webp"
								alt="A blue growth chart with savings, rewards, and progress icons"
								fill
								priority
								sizes="(max-width: 440px) calc(100vw - 48px), 380px"
								className="z-10 [mask-image:linear-gradient(to_bottom,black_75%,transparent_96%)] object-contain"
							/>
						</div>

						<h1 className="mt-5 text-[32px] leading-[1.12] font-semibold tracking-tight">
							Send, receive,
							<br />
							<span className="text-brand">and grow</span>
						</h1>

						<p className="mt-4 max-w-[300px] text-[14px] leading-6 text-[#acb8ca]">
							Send money, pay bills, and buy Bitcoin.
							<br />
							All in one app.
						</p>
					</section>
				</div>
				{notice && (
					<p role="alert" className="text-danger mb-4 text-center text-sm">
						{notice}
					</p>
				)}
				<WelcomeActions googleEnabled={googleEnabled} />
			</main>
		</div>
	);
}
