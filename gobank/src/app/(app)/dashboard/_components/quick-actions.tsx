import { ArrowDownToLine, HandCoins, Send } from "lucide-react";
import Link from "next/link";

const ACTIONS = [
  { href: "/transfer", label: "Send", icon: Send },
  { href: "/deposit", label: "Deposit", icon: ArrowDownToLine },
  { href: "/request", label: "Request", icon: HandCoins },
];

export function QuickActions() {
  return (
    <div className="flex items-start justify-around">
      {ACTIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex w-20 flex-col items-center gap-2.5"
        >
          <span className="bg-brand-soft text-brand group-hover:bg-brand-line grid h-14 w-14 place-items-center rounded-2xl transition-colors duration-150">
            <Icon size={21} strokeWidth={1.9} aria-hidden />
          </span>
          <span className="text-ink text-[12.5px] font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}
