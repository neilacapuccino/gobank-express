import Link from "next/link";
import { Screen } from "~/app/_components/ui/screen";

const HIGHLIGHTS = [
  { title: "Stashes", detail: "Five savings goals, each earning on its own" },
  { title: "Instant transfers", detail: "Send by username or mobile number" },
  { title: "Points back", detail: "Earn on every transfer and bill you pay" },
];

export default function WelcomePage() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2.5 pt-2">
          <Logo />
          <span className="text-ink text-[15px] font-semibold tracking-tight">
            GoBank Express
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-16">
          <h1 className="text-ink animate-rise text-[38px] leading-[1.1] font-semibold tracking-tight">
            Money that keeps up with student life.
          </h1>

          <p className="text-ink-soft animate-rise mt-4 text-[15px] leading-relaxed">
            Open an account in under a minute. No paperwork, no minimum balance,
            no branch visit.
          </p>

          <ul className="animate-rise mt-9 flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="bg-brand-soft text-brand mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full">
                  <CheckIcon />
                </span>
                <span className="text-[14px] leading-snug">
                  <span className="text-ink font-medium">{item.title}</span>
                  <span className="text-ink-muted"> — {item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2.5">
          <Link
            href="/register"
            className="bg-brand hover:bg-brand-hover inline-flex h-13 w-full items-center justify-center rounded-xl text-[15px] font-medium text-white transition-colors duration-150"
          >
            Get started
          </Link>
          <Link
            href="/signin"
            className="border-line-strong text-ink hover:bg-surface-sunken inline-flex h-13 w-full items-center justify-center rounded-xl border text-[15px] font-medium transition-colors duration-150"
          >
            Login
          </Link>
        </div>
      </div>
    </Screen>
  );
}

function CheckIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function Logo() {
  return (
    <span className="bg-brand grid h-8 w-8 place-items-center rounded-lg">
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5 10.5V19h14v-8.5" />
        <path d="M9.5 19v-4.5h5V19" />
      </svg>
    </span>
  );
}
