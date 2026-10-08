import type { ReactNode } from "react";

export function AuthHeading({
	title,
	subtitle,
}: {
	title: string;
	subtitle: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-ink text-[24px] leading-tight font-semibold tracking-tight">
				{title}
			</h1>
			<p className="text-ink-soft text-[14.5px] leading-relaxed">{subtitle}</p>
		</div>
	);
}
