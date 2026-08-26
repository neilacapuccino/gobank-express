import type { LucideIcon } from "lucide-react";
import {
  PiggyBank,
  Receipt,
  Smartphone,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";

type Feature = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PRIMARY: Feature[] = [
  { href: "/rewards", label: "GoRewards", icon: Sparkles },
  { href: "/stashes", label: "GoalSave", icon: PiggyBank },
  { href: "/stocks", label: "Stocks", icon: TrendingUp },
];

const SECONDARY: Feature[] = [
  { href: "/bills", label: "Pay bills", icon: Receipt },
  { href: "/load", label: "Buy load", icon: Smartphone },
];

export function FeatureGrid() {
  return (
    <section className="grid grid-cols-6 gap-2.5">
      {PRIMARY.map((feature) => (
        <Tile key={feature.href} feature={feature} className="col-span-2" />
      ))}
      {SECONDARY.map((feature) => (
        <Tile key={feature.href} feature={feature} className="col-span-3" />
      ))}
    </section>
  );
}

function Tile({
  feature,
  className,
}: {
  feature: Feature;
  className?: string;
}) {
  const Icon = feature.icon;
  return (
    <Link
      href={feature.href}
      className={cn(
        "bg-brand-soft hover:bg-brand-line flex h-14 items-center justify-center gap-2 rounded-xl px-2 transition-colors duration-150",
        className,
      )}
    >
      <Icon
        size={18}
        strokeWidth={1.9}
        aria-hidden
        className="text-brand shrink-0"
      />
      <span className="text-ink truncate text-[12px] font-medium">
        {feature.label}
      </span>
    </Link>
  );
}
