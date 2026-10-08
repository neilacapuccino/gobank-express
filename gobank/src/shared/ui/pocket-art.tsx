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
