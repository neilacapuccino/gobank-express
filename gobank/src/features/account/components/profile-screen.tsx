import {
  Camera,
  ChevronRight,
  CreditCard,
  KeyRound,
  Sparkles,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "~/features/auth/components/sign-out-button";
import { formatMobile } from "~/shared/lib/contact";
import { formatAccount } from "~/shared/lib/format";
import { PageHeader } from "~/shared/ui/page-header";
import type { RouterOutputs } from "~/trpc/react";
import { displayName } from "../account.rules";
import { ProfileAvatar } from "./profile-avatar";

type Profile = RouterOutputs["account"]["profile"];

const SINCE = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});

export function ProfileScreen({ profile }: { profile: Profile }) {
  const details = [
    { label: "Account number", value: formatAccount(profile.accountNumber) },
    {
      label: "Mobile",
      value: profile.mobile ? formatMobile(profile.mobile) : null,
    },
    { label: "Gmail", value: profile.gmail },
    { label: "Member since", value: SINCE.format(profile.createdAt) },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Profile" back="/dashboard" />

      <section className="mt-9 flex flex-col items-center text-center">
        <Link
          href="/settings/profile"
          aria-label="Change profile photo"
          className="relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#71d5f3]"
        >
          <ProfileAvatar photo={profile.profilePhoto} />
          <span className="border-surface absolute right-0 bottom-0 grid h-6 w-6 place-items-center rounded-full border-2 bg-[#2b373d] text-[#71d5f3]">
            <Camera size={12} aria-hidden />
          </span>
        </Link>
        <p className="text-ink mt-4 text-[19px] font-semibold tracking-tight">
          {displayName(profile)}
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
        <ShortcutRow
          href="/settings/profile"
          label="Edit profile"
          icon={UserPen}
        />
        <ShortcutRow href="/settings/pin" label="Change PIN" icon={KeyRound} />
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
  icon: LucideIcon;
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
