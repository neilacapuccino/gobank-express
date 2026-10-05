import {
  CarFront,
  Gift,
  Heart,
  House,
  Plane,
  type LucideIcon,
} from "lucide-react";
import { PocketIcon } from "~/shared/ui/pocket-art";

export type GoalIcon = "safe" | "travel" | "home" | "gift" | "car" | "heart";
export const goalIcons: {
  value: GoalIcon;
  label: string;
  Icon: LucideIcon | null;
}[] = [
  { value: "safe", label: "Savings", Icon: null },
  { value: "travel", label: "Travel", Icon: Plane },
  { value: "home", label: "Home", Icon: House },
  { value: "gift", label: "Gifts", Icon: Gift },
  { value: "car", label: "Car", Icon: CarFront },
  { value: "heart", label: "Health", Icon: Heart },
];
export function iconForGoal(name: string): GoalIcon {
  if (/trip|travel|holiday|vacation/i.test(name)) return "travel";
  if (/home|house|rent/i.test(name)) return "home";
  if (/car|drive/i.test(name)) return "car";
  if (/birthday|gift|wedding|party/i.test(name)) return "gift";
  if (/health|emergency|family/i.test(name)) return "heart";
  return "safe";
}
export function GoalArt({
  icon = "safe",
  className,
}: {
  icon?: GoalIcon;
  className?: string;
}) {
  if (icon === "safe") {
    return <PocketIcon name="goal" className={className} strokeWidth={1.7} />;
  }
  const { Icon } =
    goalIcons.find((item) => item.value === icon) ?? goalIcons[0]!;
  if (!Icon)
    return <PocketIcon name="goal" className={className} strokeWidth={1.7} />;
  return <Icon className={className} strokeWidth={1.6} aria-hidden />;
}
