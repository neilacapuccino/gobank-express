"use client";
import { useId } from "react";

export type GoalIcon = "safe" | "travel" | "home" | "gift" | "car" | "heart";
export const goalIcons: { value: GoalIcon; label: string }[] = [
  { value: "safe", label: "Savings" },
  { value: "travel", label: "Travel" },
  { value: "home", label: "Home" },
  { value: "gift", label: "Celebration" },
  { value: "car", label: "Car" },
  { value: "heart", label: "Wellbeing" },
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
  const id = useId().replace(/:/g, "");
  const cyan = `url(#cyan${id})`;
  const purple = `url(#purple${id})`;
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`cyan${id}`}
          x1="20"
          y1="15"
          x2="80"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8af8f6" />
          <stop offset=".5" stopColor="#08dbe5" />
          <stop offset="1" stopColor="#0099d0" />
        </linearGradient>
        <linearGradient
          id={`purple${id}`}
          x1="30"
          y1="25"
          x2="70"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5632d6" />
          <stop offset="1" stopColor="#19245f" />
        </linearGradient>
      </defs>
      {icon === "safe" && (
        <>
          <rect x="20" y="17" width="60" height="65" rx="8" fill={cyan} />
          <path d="M26 81v7m48-7v7" stroke="#00b8d4" strokeWidth="7" />
          <circle cx="49" cy="49" r="19" stroke={purple} strokeWidth="6" />
          <circle cx="49" cy="49" r="7" fill={purple} />
          <path d="m37 37 24 24m0-24L37 61" stroke={purple} strokeWidth="5" />
          <path
            d="M73 39v20"
            stroke="white"
            strokeOpacity=".8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {icon === "travel" && (
        <>
          <path
            d="m12 52 10-4 16 7 17-13-26-15 10-5 33 9 11-5c9-4 16 2 10 8L65 56 52 88l-11 2 4-27-18 5-15-16Z"
            fill={cyan}
          />
          <path d="m38 30 14 7 12-8-17-5-9 6Z" fill={purple} />
        </>
      )}
      {icon === "home" && (
        <>
          <path d="m13 44 37-30 37 30-7 9-30-24-30 24-7-9Z" fill={purple} />
          <path d="M23 47 50 25l27 22v39H23V47Z" fill={cyan} />
          <path d="M43 60h16v26H43z" fill={purple} />
          <path d="M30 51h10v12H30z" fill="white" fillOpacity=".85" />
        </>
      )}
      {icon === "gift" && (
        <>
          <rect x="20" y="42" width="60" height="44" rx="5" fill={cyan} />
          <path d="M16 34h68v15H16z" fill={purple} />
          <path d="M46 34h9v52l-5-7-4 7V34Z" fill="white" />
          <path
            d="M49 33C19 32 23 9 37 17c8 4 12 16 12 16Zm3 0c30-1 26-24 12-16-8 4-12 16-12 16Z"
            stroke={purple}
            strokeWidth="5"
          />
        </>
      )}
      {icon === "car" && (
        <>
          <path d="m20 47 9-24h42l9 24 7 9v28H13V56l7-9Z" fill={cyan} />
          <path d="m33 29-7 20h48l-7-20H33Z" fill="white" fillOpacity=".8" />
          <rect x="34" y="17" width="32" height="7" rx="3" fill={purple} />
          <circle cx="28" cy="65" r="7" fill="white" />
          <circle cx="72" cy="65" r="7" fill="white" />
          <path d="M21 82v9m58-9v9" stroke={purple} strokeWidth="8" />
        </>
      )}
      {icon === "heart" && (
        <>
          <path
            d="m50 10 12 6 14 1 7 13 9 11-3 14 1 14-12 9-10 11-14-1-14 3-11-9-13-7-1-14-6-12 6-12 1-14 13-7 11-9Z"
            fill={cyan}
          />
          <path
            d="M50 72 29 51c-18-23 16-36 21-15 5-21 39-8 21 15L50 72Z"
            fill={purple}
          />
        </>
      )}
    </svg>
  );
}
