"use client";

import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";

export function TransactionReceipt({
	title,
	children,
	onDone,
}: {
	title: string;
	children: ReactNode;
	onDone: () => void;
}) {
	return (
		<div className="flex flex-1 flex-col gap-6 pt-5">
			<header className="flex items-center gap-3">
				<CheckCircle2 className="text-brand shrink-0" size={28} aria-hidden />
				<h1 className="text-ink text-[20px] font-semibold">{title}</h1>
			</header>
			{children}
			<div className="mt-auto pt-4">
				<Button onClick={onDone}>Done</Button>
			</div>
		</div>
	);
}
