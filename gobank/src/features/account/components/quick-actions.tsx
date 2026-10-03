import Link from "next/link";
import { PocketIcon, type PocketIconName } from "~/shared/ui/pocket-art";
const actions: { href: string; label: string; icon: PocketIconName }[] = [
  { href: "/transfer", label: "Send money", icon: "send" },
  { href: "/deposit", label: "Add money", icon: "deposit" },
  { href: "/request", label: "Request", icon: "request" },
];
export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-center gap-2.5 rounded-2xl py-2 text-[#282938] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="grid h-14 w-14 place-items-center rounded-[20px] border border-white/80 bg-white shadow-[0_5px_12px_-6px_#0089a440] transition-transform group-hover:-translate-y-1">
            <PocketIcon name={icon} />
          </span>
          <span className="text-[11px] font-semibold">{label}</span>
        </Link>
      ))}
    </div>
  );
}
