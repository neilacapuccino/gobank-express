import type { SVGProps } from "react";

export type PocketIconName =
	| "home"
	| "send"
	| "deposit"
	| "request"
	| "goal"
	| "card"
	| "profile"
	| "spark"
	| "chart"
	| "bill"
	| "phone";
const paths: Record<PocketIconName, string> = {
	home: "M4 11 12 4l8 7v9h-6v-6h-4v6H4z",
	send: "m3 10 18-7-7 18-3-8-8-3Zm8 3 5-5",
	deposit: "M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5",
	request: "M4 17h4l4 3 8-6M8 17v-5h5a2 2 0 0 1 0 4h-2M16 3v6m-3-3h6",
	goal: "M4 3h16v16H4zM6 19v2m12-2v2M15 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-4-4v8m-4-4h8m3-3v6",
	card: "M3 6h18v13H3zM3 10h18M6 15h4",
	profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
	spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
	chart: "M4 4v16h17M7 14l5-5 4 3 5-8m-5 0h5v5",
	bill: "M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6",
	phone: "M7 2h10v20H7zM10 5h4m-3 14h2",
};
export function PocketIcon({
	name,
	...props
}: SVGProps<SVGSVGElement> & { name: PocketIconName }) {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<path d={paths[name]} />
		</svg>
	);
}

export function SavingsArt({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 180 180"
			fill="none"
			className={className}
			aria-hidden="true"
		>
			<ellipse cx="96" cy="153" rx="63" ry="11" fill="#164e3c" opacity=".1" />
			<path d="m47 73 48-23 43 24v65l-48 24-43-25V73Z" fill="#1e6856" />
			<path d="m47 73 43 25 48-24-43-24-48 23Z" fill="#c8f581" />
			<path d="M90 98v65l48-24V74L90 98Z" fill="#154e41" />
			<path d="m71 74 24-12 18 10-24 12-18-10Z" fill="#174c3e" />
			<path d="m104 118 19-10v18l-19 10v-18Z" fill="#c8f581" />
			<ellipse
				cx="94"
				cy="40"
				rx="20"
				ry="23"
				fill="#e9ce81"
				transform="rotate(20 94 40)"
			/>
			<ellipse
				cx="91"
				cy="39"
				rx="15"
				ry="20"
				stroke="#a88036"
				strokeWidth="2"
				transform="rotate(20 91 39)"
			/>
			<path
				d="m88 32 7 2m-8 5 7 2m-2-12-5 17M33 39v12m-6-6h12m112 45v10m-5-5h10"
				stroke="#9aa97b"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
