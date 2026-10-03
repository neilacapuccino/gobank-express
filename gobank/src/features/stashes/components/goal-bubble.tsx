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
      className={`relative mx-auto grid aspect-square w-full place-items-center rounded-full bg-[#cbecee]/80 shadow-[inset_0_2px_14px_#0099aa0a] ${large ? "max-w-64" : "max-w-40"}`}
    >
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full -rotate-90"
        role="img"
        aria-label={`${label}: ${Math.round(progress * 100)}% of target`}
      >
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke="#b7e0e4"
          strokeWidth="4"
        />
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke="#00bac7"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${progress * 100} 100`}
        />
        <circle cx="115" cy="60" r="2.8" fill="#00d9df" />
      </svg>
      <GoalArt
        icon={icon}
        className="h-[58%] w-[58%] drop-shadow-[0_5px_5px_#0099bb20]"
      />
    </div>
  );
}
