import { CreditCard, Droplets, Wifi, Zap, type LucideIcon } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

export type Biller = RouterOutputs["bills"]["billers"][number];

export type Category = Biller["category"];

export const CATEGORIES: { id: Category; label: string; icon: LucideIcon }[] = [
  { id: "electric", label: "Electric", icon: Zap },
  { id: "water", label: "Water", icon: Droplets },
  { id: "internet", label: "Internet", icon: Wifi },
  { id: "credit_card", label: "Credit Card", icon: CreditCard },
];

export const findCategory = (id: Category | null) =>
  CATEGORIES.find((category) => category.id === id);
