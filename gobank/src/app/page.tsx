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
        <header className="flex shrink-0 justify-center">
          <GoBankLogo className="h-9 w-[110px]" />
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <section className="flex flex-col items-center pt-2 pb-6 text-center">
            <div className="relative isolate h-[300px] w-full max-w-[380px] shrink-0">
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
              <span className="text-[#20bfff]">and grow</span>
            </h1>

            <p className="mt-4 max-w-[300px] text-[14px] leading-6 text-[#acb8ca]">
              Send money, pay bills, and buy Bitcoin.
              <br />
              All in one app.
            </p>
          </section>

          <WelcomeActions />
        </div>
      </main>
    </div>
  );
}
