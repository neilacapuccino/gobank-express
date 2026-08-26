import { ArrowRight, PiggyBank, Send, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Screen } from "~/app/_components/ui/screen";

export const metadata: Metadata = {
  title: "GoBank Express",
};

const FEATURES = [
  { icon: PiggyBank, label: "Save" },
  { icon: Send, label: "Send" },
  { icon: Sparkles, label: "Earn" },
];

export default function WelcomePage() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <Hero />

          <h1 className="text-ink mt-9 text-[30px] leading-tight font-semibold tracking-tight text-balance">
            Welcome to GoBank Express
          </h1>

          <p className="text-ink-soft mt-3 max-w-[290px] text-[15px] leading-relaxed">
            Banking built for student life.
          </p>

          <ul className="mt-11 flex items-start justify-center gap-9">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2.5">
                <span className="bg-brand-soft text-brand grid h-12 w-12 place-items-center rounded-2xl">
                  <Icon size={21} strokeWidth={1.9} aria-hidden />
                </span>
                <span className="text-ink-soft text-[12.5px] font-medium">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex w-full flex-col gap-2.5">
          <Link
            href="/register"
            className="bg-brand hover:bg-brand-hover inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-white transition-colors duration-150"
          >
            Get started
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden />
          </Link>
          <Link
            href="/signin"
            className="border-line-strong text-ink hover:bg-surface-sunken inline-flex h-13 w-full items-center justify-center rounded-xl border text-[15px] font-medium transition-colors duration-150"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </Screen>
  );
}

function Hero() {
  return (
    <div className="relative grid place-items-center" aria-hidden>
      <span className="border-line absolute h-44 w-44 rounded-full border" />
      <span className="border-line absolute h-32 w-32 rounded-full border" />
      <span className="bg-brand relative grid h-20 w-20 place-items-center rounded-3xl">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10.5 12 4l9 6.5" />
          <path d="M5 10.5V19h14v-8.5" />
          <path d="M9.5 19v-4.5h5V19" />
        </svg>
      </span>
    </div>
  );
}
