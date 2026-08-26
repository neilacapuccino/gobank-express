import type { Metadata } from "next";
import Link from "next/link";
import { BankingIllustration } from "~/app/_components/money/banking-illustration";
import { Screen } from "~/app/_components/ui/screen";

export const metadata: Metadata = {
  title: "GoBank Express",
};

export default function WelcomePage() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <BankingIllustration className="w-full max-w-[280px]" />

          <h1 className="text-ink mt-8 text-[27px] leading-tight font-semibold tracking-tight">
            Let&rsquo;s get started
          </h1>

          <p className="text-ink-muted mt-3 max-w-[280px] text-[14.5px] leading-relaxed">
            Never a better time than now to start managing your money with ease.
          </p>

          <div className="mt-7 flex items-center gap-2" aria-hidden>
            <span className="bg-line-strong h-1.5 w-1.5 rounded-full" />
            <span className="bg-line-strong h-1.5 w-1.5 rounded-full" />
            <span className="bg-brand h-1.5 w-4 rounded-full" />
          </div>
        </div>

        <div className="mt-10 flex w-full flex-col items-center gap-1">
          <Link
            href="/register"
            className="bg-brand hover:bg-brand-hover inline-flex h-13 w-full items-center justify-center rounded-full text-[15px] font-medium text-white transition-colors duration-150"
          >
            Create Account
          </Link>
          <Link
            href="/signin"
            className="text-brand hover:text-brand-hover inline-flex h-12 items-center justify-center px-4 text-[14.5px] font-medium transition-colors duration-150"
          >
            Login to Account
          </Link>
        </div>
      </div>
    </Screen>
  );
}
