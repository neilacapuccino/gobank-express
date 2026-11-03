"use client";

import {
	Bitcoin,
	Download,
	HandCoins,
	PiggyBank,
	ReceiptText,
	Send,
	Smartphone,
	UserRound,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "~/shared/lib/cn";
import styles from "./go-menu.module.css";

type Shortcut = {
	href: string;
	label: string;
	icon: LucideIcon;
	tone: string;
};

const SHORTCUTS: Shortcut[] = [
	{ href: "/transfer", label: "Send money", icon: Send, tone: "text-mint" },
	{ href: "/deposit", label: "Deposit", icon: Download, tone: "text-sky" },
	{ href: "/request", label: "Request", icon: HandCoins, tone: "text-violet" },
	{ href: "/stashes", label: "GoalSave", icon: PiggyBank, tone: "text-gold" },
	{ href: "/bills", label: "Pay bills", icon: ReceiptText, tone: "text-sky" },
	{ href: "/load", label: "Buy load", icon: Smartphone, tone: "text-violet" },
	{ href: "/bitcoin", label: "Bitcoin", icon: Bitcoin, tone: "text-gold" },
	{
		href: "/settings",
		label: "Profile",
		icon: UserRound,
		tone: "text-ink-soft",
	},
];

const ROUND_CONTROL =
	"grid h-20 w-20 place-items-center rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#48e4e9] active:scale-95";

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

function useBodyScrollLock(locked: boolean) {
	useEffect(() => {
		if (!locked) return;

		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previous;
		};
	}, [locked]);
}

function GoOrb() {
	return (
		<svg
			className={styles.goOrb}
			width="80"
			height="80"
			viewBox="0 0 80 80"
			aria-hidden="true"
		>
			<circle
				cx="40"
				cy="40"
				r="30"
				fill="#1a2029"
				stroke="#48e4e9"
				strokeOpacity=".65"
				strokeWidth="1.4"
			/>
			<circle
				cx="40"
				cy="40"
				r="25"
				fill="none"
				stroke="#ffffff"
				strokeOpacity=".04"
			/>
			<g
				className={styles.goHalo}
				fill="none"
				strokeWidth="1.7"
				strokeLinecap="round"
			>
				<path d="M16 15a35 35 0 0 1 38-7" stroke="#48e4e9" />
				<path d="M64 65a35 35 0 0 1-38 7" stroke="#9b83ee" />
			</g>
		</svg>
	);
}

function Petals({ y, rx, ry }: { y: number; rx: number; ry: number }) {
	return PETAL_ANGLES.map((angle) => (
		<ellipse
			key={angle}
			cx="40"
			cy={y}
			rx={rx}
			ry={ry}
			transform={`rotate(${angle} 40 40)`}
		/>
	));
}

function CloseFlower() {
	return (
		<svg
			className={styles.flower}
			width="80"
			height="80"
			viewBox="0 0 80 80"
			aria-hidden="true"
		>
			<g className={styles.petalsReveal}>
				<g className={styles.petalsOuterLaunch}>
					<g className={styles.petalsOuter}>
						<Petals y={23} rx={10} ry={17} />
					</g>
				</g>
				<g className={styles.petalsInnerLaunch}>
					<g className={styles.petalsInner}>
						<Petals y={26} rx={8} ry={15} />
					</g>
				</g>
			</g>

			<g className={styles.closeCore}>
				<circle
					cx="40"
					cy="40"
					r="14"
					fill="#181821"
					stroke="#9b83ee"
					strokeOpacity=".45"
				/>
				<path
					d="m35.5 35.5 9 9m0-9-9 9"
					stroke="#f4f4f5"
					strokeWidth="2.4"
					strokeLinecap="round"
				/>
			</g>

			<g className={styles.morphOrb}>
				<circle
					cx="40"
					cy="40"
					r="30"
					fill="#1a2029"
					stroke="#48e4e9"
					strokeOpacity=".65"
					strokeWidth="1.4"
				/>
				<text
					x="40"
					y="46"
					textAnchor="middle"
					fill="#70e7ef"
					fontSize="18"
					fontWeight="700"
				>
					GO
				</text>
			</g>
		</svg>
	);
}

function ShortcutTile({
	shortcut: { href, label, icon: Icon, tone },
	position,
	onOpen,
}: {
	shortcut: Shortcut;
	position: number;
	onOpen: () => void;
}) {
	return (
		<Link
			href={href}
			onClick={onOpen}
			style={{ animationDelay: `${110 + position * 30}ms` }}
			className={cn(
				styles.tile,
				"group flex min-h-[88px] items-center gap-3 rounded-[20px] border border-white/[.07] bg-linear-to-br from-[#232327] to-[#17171a] px-3 py-4 shadow-[inset_0_1px_0_#ffffff04] transition-colors hover:border-white/20 hover:from-[#29292f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#48e4e9]",
			)}
		>
			<span
				className={cn(
					"grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.035]",
					tone,
				)}
			>
				<Icon size={23} strokeWidth={1.8} aria-hidden />
			</span>
			<span className="text-[12px] font-semibold text-[#e4e4e8]">{label}</span>
		</Link>
	);
}

export function GoMenu() {
	const dialog = useRef<HTMLDialogElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const [mounted, setMounted] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => setMounted(true), []);
	useBodyScrollLock(open);

	const openMenu = () => {
		dialog.current?.showModal();
		setOpen(true);
	};

	const closeMenu = () => dialog.current?.close();

	const afterClose = () => {
		setOpen(false);
		trigger.current?.focus();
	};

	if (!mounted) return null;

	return createPortal(
		<>
			<div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[440px] justify-center pb-[max(24px,env(safe-area-inset-bottom))]">
				<button
					ref={trigger}
					type="button"
					aria-label="Open GO shortcuts"
					aria-haspopup="dialog"
					aria-expanded={open}
					onClick={openMenu}
					className={cn(
						styles.goControl,
						ROUND_CONTROL,
						"pointer-events-auto relative",
					)}
				>
					<GoOrb />
					<span
						className="absolute text-[18px] font-bold tracking-tight text-[#70e7ef]"
						aria-hidden
					>
						GO
					</span>
				</button>
			</div>

			<dialog
				ref={dialog}
				aria-label="GO shortcuts"
				onClose={afterClose}
				className={cn(
					styles.panel,
					"bg-surface-sunken text-ink fixed inset-0 m-auto h-dvh max-h-dvh w-full max-w-[440px] overflow-y-auto border-0 p-0 outline-none",
				)}
			>
				<div className="relative isolate flex min-h-full flex-col justify-center px-6 pt-8 pb-28">
					<header className={cn(styles.heading, "mb-6 text-center")}>
						<h2 className="text-[24px] font-semibold tracking-tight">
							Quick actions
						</h2>
					</header>

					<div className="grid grid-cols-2 gap-3">
						{SHORTCUTS.map((shortcut, position) => (
							<ShortcutTile
								key={shortcut.href}
								shortcut={shortcut}
								position={position}
								onOpen={closeMenu}
							/>
						))}
					</div>

					<button
						type="button"
						aria-label="Close GO shortcuts"
						onClick={closeMenu}
						className={cn(
							styles.closeControl,
							ROUND_CONTROL,
							"absolute bottom-6 left-1/2 -translate-x-1/2",
						)}
					>
						<CloseFlower />
					</button>
				</div>
			</dialog>
		</>,
		document.body,
	);
}
