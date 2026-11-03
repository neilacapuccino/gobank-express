"use client";

import { useCallback, useEffect } from "react";
import { cn } from "~/shared/lib/cn";

const DIGIT_ROWS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const KEY_SIZE = "grid h-17 w-17 place-items-center rounded-full";
const KEY_FOCUS =
	"focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-4";

type PinPadProps = {
	value: string;
	onChange: (next: string) => void;
	length: number;
	invalid?: boolean;
};

function dotClass(filled: boolean, invalid?: boolean) {
	if (!filled) return "border-line-strong bg-transparent";
	return invalid ? "border-danger bg-danger" : "border-brand bg-brand";
}

function usePinKeyboard(
	onDigit: (digit: string) => void,
	onDelete: () => void,
) {
	useEffect(() => {
		function handleKey(event: KeyboardEvent) {
			if (/^\d$/.test(event.key)) {
				event.preventDefault();
				onDigit(event.key);
			}

			if (event.key === "Backspace") {
				event.preventDefault();
				onDelete();
			}
		}

		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [onDigit, onDelete]);
}

function DigitKey({
	digit,
	disabled,
	onPress,
}: {
	digit: string;
	disabled: boolean;
	onPress: (digit: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onPress(digit)}
			disabled={disabled}
			className={cn(
				KEY_SIZE,
				KEY_FOCUS,
				"text-ink border border-[#3a3a3f] bg-[#272729] text-[24px] font-normal tabular-nums transition-colors duration-100 enabled:hover:bg-[#343437] enabled:active:bg-[#404044] disabled:opacity-40",
			)}
		>
			{digit}
		</button>
	);
}

function DeleteKey({
	disabled,
	onPress,
}: {
	disabled: boolean;
	onPress: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onPress}
			disabled={disabled}
			aria-label="Delete last digit"
			className={cn(
				KEY_SIZE,
				KEY_FOCUS,
				"text-ink-soft enabled:hover:bg-surface-raised transition-colors duration-100 disabled:opacity-25",
			)}
		>
			<BackspaceIcon />
		</button>
	);
}

export function PinPad({ value, onChange, length, invalid }: PinPadProps) {
	const full = value.length >= length;

	const addDigit = useCallback(
		(digit: string) => {
			if (value.length < length) onChange(value + digit);
		},
		[value, length, onChange],
	);

	const deleteDigit = useCallback(() => {
		onChange(value.slice(0, -1));
	}, [value, onChange]);

	usePinKeyboard(addDigit, deleteDigit);

	return (
		<div className="flex w-full flex-col items-center gap-11">
			<div
				className={cn("flex gap-4", invalid && "animate-shake")}
				role="status"
				aria-label={`${value.length} of ${length} digits entered`}
			>
				{Array.from({ length }, (_, index) => (
					<span
						key={index}
						className={cn(
							"h-3.5 w-3.5 rounded-full border-2 transition-all duration-150",
							dotClass(index < value.length, invalid),
						)}
					/>
				))}
			</div>

			<div className="grid grid-cols-3 justify-items-center gap-x-7 gap-y-4">
				{DIGIT_ROWS.map((digit) => (
					<DigitKey
						key={digit}
						digit={digit}
						disabled={full}
						onPress={addDigit}
					/>
				))}

				<span className="h-17 w-17" />
				<DigitKey digit="0" disabled={full} onPress={addDigit} />
				<DeleteKey disabled={value.length === 0} onPress={deleteDigit} />
			</div>
		</div>
	);
}

function BackspaceIcon() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
			<path d="m16 9-5 6M11 9l5 6" />
		</svg>
	);
}
