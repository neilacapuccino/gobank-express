"use client";

import { Check, Pencil, X } from "lucide-react";
import { useRef } from "react";
import { cn } from "~/shared/lib/cn";
import { GoalArt, goalIcons, type GoalIcon } from "./goal-art";

function IconOption({
	icon,
	label,
	selected,
	onPick,
}: {
	icon: GoalIcon;
	label: string;
	selected: boolean;
	onPick: (icon: GoalIcon) => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={() => onPick(icon)}
			className="group text-ink-soft focus-visible:outline-sky relative flex flex-col items-center gap-2 rounded-2xl text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
		>
			<span
				className={cn(
					"relative grid aspect-square w-full place-items-center rounded-full border-2 bg-[#242426] transition-colors",
					selected
						? "border-sky text-white"
						: "text-ink-soft border-transparent group-hover:border-white/20",
				)}
			>
				{selected ? (
					<span className="bg-sky absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full text-[#121214]">
						<Check size={12} aria-hidden />
					</span>
				) : null}
				<GoalArt icon={icon} className="h-9 w-9" />
			</span>
			{label}
		</button>
	);
}

export function GoalIconPicker({
	value,
	onChange,
	disabled = false,
}: {
	value: GoalIcon;
	onChange: (icon: GoalIcon) => void;
	disabled?: boolean;
}) {
	const dialog = useRef<HTMLDialogElement>(null);

	const open = () => dialog.current?.showModal();
	const close = () => dialog.current?.close();

	const pick = (icon: GoalIcon) => {
		onChange(icon);
		close();
	};

	return (
		<>
			<button
				type="button"
				aria-label="Choose a savings icon"
				aria-haspopup="dialog"
				disabled={disabled}
				onClick={open}
				className="hover:border-sky/40 focus-visible:outline-sky relative mx-auto grid h-28 w-28 place-items-center rounded-full border border-white/10 bg-[#242426] text-[#e4e4e7] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50"
			>
				<GoalArt icon={value} className="h-11 w-11" />
				<span className="absolute right-0 bottom-0 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#303034] text-[#e4e4e7]">
					<Pencil size={12} aria-hidden />
				</span>
			</button>

			<dialog
				ref={dialog}
				aria-label="Choose a savings icon"
				className="text-ink bg-card fixed inset-x-0 top-auto bottom-0 mx-auto mb-0 max-h-[85dvh] w-full max-w-[440px] overflow-y-auto rounded-t-[28px] border border-white/10 p-6 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
			>
				<div className="bg-line-strong mx-auto mb-5 h-1 w-10 rounded-full" />

				<div className="flex items-center justify-between gap-3">
					<h2 className="text-[18px] font-semibold tracking-tight">
						Choose an icon
					</h2>
					<button
						type="button"
						aria-label="Close icon picker"
						onClick={close}
						className="text-ink focus-visible:outline-sky grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#252529] transition-colors hover:bg-[#303036] focus-visible:outline-2 focus-visible:outline-offset-4"
					>
						<X size={18} aria-hidden />
					</button>
				</div>

				<div className="mt-6 mb-2 grid grid-cols-3 gap-3">
					{goalIcons.map(({ value: icon, label }) => (
						<IconOption
							key={icon}
							icon={icon}
							label={label}
							selected={value === icon}
							onPick={pick}
						/>
					))}
				</div>
			</dialog>
		</>
	);
}
