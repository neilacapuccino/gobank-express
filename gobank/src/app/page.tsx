import type { Metadata } from "next";
import Image from "next/image";
import { GoBankLogo } from "~/features/account/components/gobank-logo";
import { WelcomeActions } from "~/features/auth/components/welcome-actions";

export const metadata: Metadata = {
  title: "GoBank Express",
};

export default function WelcomePage() {
  return (
    <div className="min-h-dvh bg-[#020b16] text-[#f4f7fc]">
      <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col border-[#172333] px-6 py-6 sm:border-x">
        <header className="flex justify-center">
          <GoBankLogo className="h-9 w-[110px]" />
        </header>

        <section className="flex flex-1 flex-col items-center justify-center pt-2 pb-6 text-center">
          <div className="relative isolate h-[clamp(200px,calc(100dvh-380px),400px)] w-full max-w-[380px]">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-6 -inset-y-5 bg-[radial-gradient(ellipse_at_50%_48%,#006cff28_0%,#005fff0d_40%,transparent_70%)]"
            />
            <Image
              src="/images/welcome-globe.webp"
              alt="A blue globe connecting money transfers, pesos, and people"
              fill
              priority
              sizes="(max-width: 440px) calc(100vw - 48px), 380px"
              className="object-contain"
            />
          </div>

          <h1 className="mt-5 text-[32px] leading-[1.12] font-semibold tracking-tight">
            Send, receive,
            <br />
            <span className="text-[#20bfff]">and grow</span>
          </h1>

          <p className="mt-4 max-w-[300px] text-[14px] leading-6 text-[#acb8ca]">
            Send money, pay bills, and buy Bitcoin.
            <br />
            All in one app.
          </p>
        </section>

        <WelcomeActions />
      </main>
    </div>
  );
}
