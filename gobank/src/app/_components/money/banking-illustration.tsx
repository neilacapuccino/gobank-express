export function BankingIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 250"
      className={className}
      role="img"
      aria-label="A businessman surrounded by floating peso coins"
    >
      <circle cx="150" cy="118" r="86" fill="var(--color-brand-line)" />
      <path d="M150 32a86 86 0 0166 141 86 86 0 00-66-141z" fill="#8fe8c4" />

      <ellipse cx="150" cy="214" rx="74" ry="9" fill="#047857" opacity="0.12" />

      <Leaf x={58} y={148} scale={1.15} flip />
      <Leaf x={76} y={166} scale={0.75} flip />
      <Leaf x={242} y={150} scale={1.05} />
      <Leaf x={224} y={170} scale={0.7} />
      <Frond x={92} y={176} flip />
      <Frond x={210} y={172} />

      <g>
        <path
          d="M116 216v-23c0-21 15-36 34-36s34 15 34 36v23z"
          fill="#2b4f46"
        />
        <path
          d="M116 216v-23c0-19 12-33 28-35-9 8-14 21-14 35v23z"
          fill="#1d3831"
        />
        <path d="M137 159l13 40 13-40-13-6z" fill="#ffffff" />
        <path d="M133 163l17 36-8-40z" fill="#2d5148" />
        <path d="M167 163l-17 36 8-40z" fill="#2d5148" />
        <path d="M150 168l-5 6 5 25 5-25z" fill="var(--color-brand)" />
        <path d="M150 158l-6 7 6 5 6-5z" fill="#047857" />
        <path d="M150 152l-10 7 10 5 10-5z" fill="#f4f7fa" />

        <path
          d="M177 173l25-29"
          stroke="#22403a"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M123 176l-9 25"
          stroke="#22403a"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M197 150l6-7"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M116 194l-2 6"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="205" cy="141" r="8.5" fill="#f0c9a4" />
        <circle cx="112" cy="204" r="8" fill="#f0c9a4" />

        <rect x="143" y="132" width="14" height="18" rx="6" fill="#e3b48d" />
        <circle cx="150" cy="112" r="27" fill="#f0c9a4" />
        <path
          d="M131 131a27 27 0 01-8-19c0-15 12-27 27-27-13 4-22 15-22 28 0 7 1 13 3 18z"
          fill="#e0b189"
        />
        <path
          d="M123 109c0-17 12-27 27-27s27 10 27 27c-3-11-13-16-27-16s-24 5-27 16z"
          fill="#2f3d34"
        />
        <path d="M177 109c2-6 1-12-3-15 1 6 0 11-3 15z" fill="#2f3d34" />
        <circle
          cx="140"
          cy="114"
          r="8"
          fill="none"
          stroke="#2f3d34"
          strokeWidth="2"
        />
        <circle
          cx="160"
          cy="114"
          r="8"
          fill="none"
          stroke="#2f3d34"
          strokeWidth="2"
        />
        <path d="M148 114h4" stroke="#2f3d34" strokeWidth="2" />
        <circle cx="140" cy="114" r="2.4" fill="#2f3d34" />
        <circle cx="160" cy="114" r="2.4" fill="#2f3d34" />
        <path
          d="M144 126c4 4 8 4 12 0"
          stroke="#2f3d34"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      <Coin cx={78} cy={92} r={20} />
      <Coin cx={222} cy={68} r={17} />
      <Coin cx={238} cy={132} r={14} />
    </svg>
  );
}

function Coin({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#e0a032" />
      <circle cx={cx} cy={cy - r * 0.06} r={r * 0.94} fill="#f2b544" />
      <circle
        cx={cx}
        cy={cy}
        r={r - 3.5}
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <text
        x={cx}
        y={cy + r * 0.36}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={r * 1.05}
        fontWeight="700"
        fontFamily="Geist, Helvetica, Arial, sans-serif"
      >
        ₱
      </text>
    </g>
  );
}

function Leaf({
  x,
  y,
  scale = 1,
  flip,
}: {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}
    >
      <path d="M0 62C-4 40 2 16 16 0c10 18 10 44 2 62z" fill="#10b981" />
      <path
        d="M9 61C5 40 7 17 16 0c4 8 6 18 7 27-5 10-10 21-14 34z"
        fill="#047857"
      />
    </g>
  );
}

function Frond({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path
        d="M0 42C-2 26 4 12 14 2"
        stroke="#6ee7b7"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14" cy="2" r="4" fill="#6ee7b7" />
      <circle cx="6" cy="20" r="3" fill="#6ee7b7" />
    </g>
  );
}
