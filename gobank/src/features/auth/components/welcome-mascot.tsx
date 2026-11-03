import { Gem, PiggyBank, Send } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/shared/lib/cn";

export function WelcomeMascot() {
	return (
		<div className="relative mx-auto mt-4 mb-5 h-[248px] w-full max-w-[340px] shrink-0">
			<svg
				viewBox="0 0 320 250"
				role="img"
				aria-label="Gobi, the GoBank coin mascot, waving and holding a phone"
				className="absolute inset-0 h-full w-full"
			>
				<defs>
					<radialGradient id="gobi-glow" cx="50%" cy="50%" r="50%">
						<stop offset="0%" stopColor="#059669" stopOpacity="0.38" />
						<stop offset="100%" stopColor="#059669" stopOpacity="0" />
					</radialGradient>
					<linearGradient id="gobi-coin" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#4ade9f" />
						<stop offset="45%" stopColor="#10b981" />
						<stop offset="100%" stopColor="#047857" />
					</linearGradient>
				</defs>

				<circle cx="160" cy="130" r="118" fill="url(#gobi-glow)" />
				<circle
					cx="160"
					cy="130"
					r="98"
					fill="none"
					stroke="#10b981"
					strokeOpacity="0.4"
					strokeWidth="2.5"
					strokeDasharray="1.5 8"
					strokeLinecap="round"
				/>
				<ellipse cx="160" cy="226" rx="52" ry="7" fill="#000" opacity="0.45" />

				<g className="animate-float">
					<rect x="140" y="186" width="9" height="16" rx="4.5" fill="#047857" />
					<rect x="171" y="186" width="9" height="16" rx="4.5" fill="#047857" />
					<ellipse cx="143" cy="206" rx="15" ry="7.5" fill="#e4e4e7" />
					<ellipse cx="177" cy="206" rx="15" ry="7.5" fill="#e4e4e7" />
					<path
						d="M133 206h11M169 206h11"
						stroke="#059669"
						strokeWidth="2.5"
						strokeLinecap="round"
					/>

					<g className="animate-wave origin-bottom-right [transform-box:fill-box]">
						<path
							d="M108 144C94 138 86 124 88 110"
							fill="none"
							stroke="#10b981"
							strokeWidth="10"
							strokeLinecap="round"
						/>
						<circle
							cx="88"
							cy="105"
							r="8.5"
							fill="#4ade9f"
							stroke="#047857"
							strokeWidth="1.5"
						/>
					</g>

					<path
						d="M212 148C224 152 230 160 232 168"
						fill="none"
						stroke="#10b981"
						strokeWidth="10"
						strokeLinecap="round"
					/>

					<circle
						cx="160"
						cy="142"
						r="56"
						fill="url(#gobi-coin)"
						stroke="#065f46"
						strokeWidth="3"
					/>
					<circle
						cx="160"
						cy="142"
						r="46"
						fill="none"
						stroke="#d1fae5"
						strokeOpacity="0.35"
						strokeWidth="2.5"
						strokeDasharray="3 4"
					/>
					<path
						d="M124 120A44 44 0 0 1 148 101"
						fill="none"
						stroke="#fff"
						strokeOpacity="0.4"
						strokeWidth="5"
						strokeLinecap="round"
					/>

					<ellipse cx="145" cy="137" rx="6.5" ry="8" fill="#062c22" />
					<ellipse cx="175" cy="137" rx="6.5" ry="8" fill="#062c22" />
					<circle cx="147" cy="134" r="2.2" fill="#fff" />
					<circle cx="177" cy="134" r="2.2" fill="#fff" />
					<ellipse
						cx="134"
						cy="151"
						rx="6"
						ry="3.5"
						fill="#fda4af"
						opacity="0.55"
					/>
					<ellipse
						cx="186"
						cy="151"
						rx="6"
						ry="3.5"
						fill="#fda4af"
						opacity="0.55"
					/>
					<path
						d="M149 153Q160 163 171 153"
						fill="none"
						stroke="#062c22"
						strokeWidth="3.5"
						strokeLinecap="round"
					/>
					<text
						x="160"
						y="184"
						textAnchor="middle"
						fontSize="15"
						fontWeight="700"
						fill="#065f46"
						opacity="0.7"
					>
						₱
					</text>

					<g transform="rotate(12 241 176)">
						<rect
							x="226"
							y="151"
							width="30"
							height="50"
							rx="7"
							fill="#111113"
							stroke="#3a3a3f"
							strokeWidth="2"
						/>
						<rect
							x="230"
							y="157"
							width="22"
							height="36"
							rx="3"
							fill="#059669"
						/>
						<path
							d="M235 175l5 5 9-10"
							fill="none"
							stroke="#fff"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</g>
					<circle
						cx="231"
						cy="170"
						r="8.5"
						fill="#4ade9f"
						stroke="#047857"
						strokeWidth="1.5"
					/>

					<g transform="rotate(-7 160 78)">
						<path d="M136 80V92Q160 104 184 92V80Z" fill="#1f2430" />
						<path
							d="M160 58L212 76L160 94L108 76Z"
							fill="#2b3240"
							stroke="#4b5563"
							strokeWidth="1.5"
							strokeLinejoin="round"
						/>
						<path
							d="M160 76L199 82L202 104"
							fill="none"
							stroke="#e6c17a"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<circle cx="160" cy="76" r="3.5" fill="#e6c17a" />
						<rect x="198" y="102" width="8" height="12" rx="3" fill="#e6c17a" />
					</g>
				</g>
			</svg>

			<Chip className="top-5 left-0" delay="0s">
				<Send size={13} className="text-brand" aria-hidden />
				₱500 sent
			</Chip>
			<Chip className="top-24 right-0" delay="1.2s">
				<Gem size={13} className="text-gold" aria-hidden />
				+10 points
			</Chip>
			<Chip className="right-0 bottom-1" delay="2.1s">
				<PiggyBank size={13} className="text-sky" aria-hidden />
				GoalSave 4% p.a.
			</Chip>
		</div>
	);
}

function Chip({
	className,
	delay,
	children,
}: {
	className: string;
	delay: string;
	children: ReactNode;
}) {
	return (
		<span
			aria-hidden
			style={{ animationDelay: delay }}
			className={cn(
				"bg-surface-raised/95 text-ink animate-float absolute flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium shadow-[0_10px_24px_-12px_#000000e6] ring-1 ring-white/10",
				className,
			)}
		>
			{children}
		</span>
	);
}
