import { ArrowLeft, ChevronRight, CreditCard, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { formatAccount } from "~/lib/format";
import { formatMobile } from "~/lib/registration";
import { api } from "~/trpc/server";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = {
  title: "Settings",
};

const SINCE = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});

export default async function SettingsPage() {
  const profile = await api.account.profile();
  const displayName = profile.fullName ?? `@${profile.username}`;

  const details = [
    { label: "Account number", value: formatAccount(profile.accountNumber) },
    {
      label: "Mobile",
      value: profile.mobile ? formatMobile(profile.mobile) : null,
    },
    { label: "Email", value: profile.email },
    { label: "Member since", value: SINCE.format(profile.createdAt) },
  ];

  return (
    <div className="animate-page-in flex flex-1 flex-col">
      <header className="relative flex h-10 items-center justify-center">
        <Link
          href="/dashboard"
          aria-label="Back to home"
          className="bg-surface-sunken text-ink-soft hover:bg-surface-raised absolute left-0 grid h-10 w-10 place-items-center rounded-full transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={1.9} aria-hidden />
        </Link>
        <h1 className="text-ink text-[15px] font-semibold">Profile</h1>
      </header>

      <section className="mt-9 flex flex-col items-center text-center">
        <span className="bg-brand-soft text-brand ring-brand-line grid h-20 w-20 place-items-center rounded-full text-[28px] font-semibold uppercase ring-1">
          {(profile.fullName ?? profile.username).charAt(0)}
        </span>
        <p className="text-ink mt-4 text-[19px] font-semibold tracking-tight">
          {displayName}
        </p>
        {profile.fullName ? (
          <p className="text-ink-muted mt-0.5 text-[13.5px]">
            @{profile.username}
          </p>
        ) : null}
      </section>

      <dl className="divide-line border-line mt-8 divide-y rounded-2xl border">
        {details.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 px-4 py-3.5"
          >
            <dt className="text-ink-muted shrink-0 text-[13px]">{row.label}</dt>
            <dd
              className={
                row.value
                  ? "text-ink min-w-0 truncate text-[14px] font-medium tabular-nums"
                  : "text-ink-faint text-[14px]"
              }
            >
              {row.value ?? "Not set"}
            </dd>
          </div>
        ))}
      </dl>

      <nav className="mt-4 flex flex-col gap-2.5">
        <ShortcutRow href="/card" label="Card controls" icon={CreditCard} />
        <ShortcutRow href="/rewards" label="Rewards" icon={Sparkles} />
      </nav>

      <div className="flex-1" />

      <div className="mt-10">
        <SignOutButton />
      </div>
    </div>
  );
}

function ShortcutRow({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof CreditCard;
}) {
  return (
    <Link
      href={href}
      className="group bg-surface-sunken hover:bg-surface-raised flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-colors duration-150"
    >
      <span className="bg-surface text-ink-soft grid h-9 w-9 place-items-center rounded-full">
        <Icon size={16} strokeWidth={1.9} aria-hidden />
      </span>
      <span className="text-ink flex-1 text-[14px] font-medium">{label}</span>
      <ChevronRight
        size={16}
        strokeWidth={1.9}
        className="text-ink-faint group-hover:text-ink-soft transition-colors"
        aria-hidden
      />
    </Link>
  );
}
