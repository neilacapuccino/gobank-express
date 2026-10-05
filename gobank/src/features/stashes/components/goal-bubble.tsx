"use client";
import { GoalArt, type GoalIcon } from "./goal-art";
export function GoalBubble({
  icon,
  balance,
  target,
  label,
  large = false,
}: {
  icon: GoalIcon;
  balance: number;
  target: number | null;
  label: string;
  large?: boolean;
}) {
  const progress = target ? Math.max(0, Math.min(1, balance / target)) : 0;
  return (
    <div
      className={`relative mx-auto grid aspect-square w-full place-items-center rounded-full bg-[#202022] text-[#e4e4e7] ${large ? "max-w-64" : "max-w-40"}`}
    >
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full -rotate-90"
        role="img"
        aria-label={
          target ? `${label}: ${Math.round(progress * 100)}% of target` : label
        }
      >
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke="#39393f"
          strokeWidth="4"
        />
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke="#71d5f3"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${progress * 100} 100`}
        />
      </svg>
      <GoalArt icon={icon} className="h-[42%] w-[42%]" />
    </div>
  );
}
