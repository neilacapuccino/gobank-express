import type { SVGProps } from "react";

export function GoBankLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 126 50"
      role="img"
      aria-label="GoBank Express"
      fill="currentColor"
      {...props}
    >
      <g fontFamily="var(--font-geist-sans), sans-serif">
        <text x="0" y="31" fontSize="34" fontWeight="750" letterSpacing="-2">
          G
        </text>
        <circle
          cx="40"
          cy="19"
          r="10.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeDasharray="1.15 0.5"
          transform="rotate(-90 40 19)"
        />
        <text x="55" y="31" fontSize="29" fontWeight="500" letterSpacing="-1.4">
          Bank
        </text>
        <text
          x="122"
          y="46"
          textAnchor="end"
          fontSize="10.5"
          fontWeight="400"
          letterSpacing="0.8"
        >
          express
        </text>
      </g>
    </svg>
  );
}
