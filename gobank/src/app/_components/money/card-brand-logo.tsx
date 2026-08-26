import type { CardBrandId } from "~/lib/card-brands";

type CardBrandLogoProps = {
  id: CardBrandId;
  className?: string;
  onDark?: boolean;
};

export function CardBrandLogo({ id, className, onDark }: CardBrandLogoProps) {
  if (id === "visa")
    return (
      <VisaLogo className={className} tone={onDark ? "#ffffff" : "#1a1f71"} />
    );
  if (id === "mastercard") return <MastercardLogo className={className} />;
  if (id === "jcb") return <JcbLogo className={className} />;
  return (
    <GoBankLogo className={className} tone={onDark ? "#ffffff" : "#047857"} />
  );
}

function VisaLogo({ className, tone }: { className?: string; tone: string }) {
  return (
    <svg viewBox="0 0 48 30" className={className} role="img" aria-label="Visa">
      <text
        x="24"
        y="21"
        textAnchor="middle"
        fill={tone}
        fontSize="17"
        fontWeight="700"
        fontStyle="italic"
        fontFamily="Geist, Helvetica, Arial, sans-serif"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 30"
      className={className}
      role="img"
      aria-label="Mastercard"
    >
      <circle cx="18" cy="15" r="11" fill="#EB001B" />
      <circle cx="30" cy="15" r="11" fill="#F79E1B" />
      <path d="M24 5.78a11 11 0 010 18.44 11 11 0 010-18.44" fill="#FF5F00" />
    </svg>
  );
}

function JcbLogo({ className }: { className?: string }) {
  const bars = [
    { x: 1, fill: "#0E4C96", letter: "J" },
    { x: 17, fill: "#D2103B", letter: "C" },
    { x: 33, fill: "#00A24A", letter: "B" },
  ];
  return (
    <svg viewBox="0 0 48 30" className={className} role="img" aria-label="JCB">
      {bars.map((bar) => (
        <g key={bar.letter}>
          <rect x={bar.x} y="3" width="14" height="24" rx="4" fill={bar.fill} />
          <text
            x={bar.x + 7}
            y="19.5"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="11"
            fontWeight="700"
            fontFamily="Geist, Helvetica, Arial, sans-serif"
          >
            {bar.letter}
          </text>
        </g>
      ))}
    </svg>
  );
}

function GoBankLogo({ className, tone }: { className?: string; tone: string }) {
  return (
    <svg
      viewBox="0 0 48 30"
      className={className}
      role="img"
      aria-label="GoBank"
    >
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fill={tone}
        fontSize="14"
        fontWeight="600"
        fontFamily="Geist, Helvetica, Arial, sans-serif"
        letterSpacing="-0.3"
      >
        GoBank
      </text>
    </svg>
  );
}
