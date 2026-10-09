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
import styles from "./go-menu.module.css";

const actions: {
	href: string;
	label: string;
	icon: LucideIcon;
	tone: string;
}[] = [
	{
		href: "/transfer",
		label: "Send money",
		icon: Send,
		tone: "text-[#6debbd]",
	},
	{
		href: "/deposit",
		label: "Deposit",
		icon: Download,
		tone: "text-[#71d5f3]",
	},
	{
		href: "/request",
		label: "Request",
		icon: HandCoins,
		tone: "text-[#bda0fa]",
	},
	{
		href: "/stashes",
		label: "GoalSave",
		icon: PiggyBank,
		tone: "text-[#e6c17a]",
	},
	{
		href: "/bills",
		label: "Pay bills",
		icon: ReceiptText,
		tone: "text-[#8dc8ee]",
	},
	{
		href: "/load",
		label: "Buy load",
		icon: Smartphone,
		tone: "text-[#96a8f5]",
	},
	{ href: "/stocks", label: "Bitcoin", icon: Bitcoin, tone: "text-[#f7b163]" },
	{
		href: "/settings",
		label: "Profile",
		icon: UserRound,
		tone: "text-[#c4c4cc]",
	},
];

export function GoMenu() {
	const dialog = useRef<HTMLDialogElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const [mounted, setMounted] = useState(false);
	const [open, setOpen] = useState(false);
	useEffect(() => setMounted(true), []);
	useEffect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, [open]);

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
					onClick={() => {
						dialog.current?.showModal();
						setOpen(true);
					}}
					className={`${styles.goControl} pointer-events-auto relative grid h-20 w-20 place-items-center rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#48e4e9] active:scale-95`}
				>
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
				onClose={() => {
					setOpen(false);
					trigger.current?.focus();
				}}
				className={`${styles.panel} bg-surface-sunken text-ink fixed inset-0 m-auto h-dvh max-h-dvh w-full max-w-[440px] overflow-y-auto border-0 p-0 outline-none`}
			>
				<div className="relative isolate flex min-h-full flex-col justify-center px-6 pt-8 pb-28">
					<header className={`${styles.heading} mb-6 text-center`}>
						<h2 className="text-[24px] font-semibold tracking-tight">
							Quick actions
						</h2>
					</header>
					<div className="grid grid-cols-2 gap-3">
						{actions.map(({ href, label, icon: Icon, tone }, index) => (
							<Link
								key={href}
								href={href}
								onClick={() => dialog.current?.close()}
								style={{ animationDelay: `${110 + index * 30}ms` }}
								className={`${styles.tile} group flex min-h-[88px] items-center gap-3 rounded-[20px] border border-white/[.07] bg-linear-to-br from-[#232327] to-[#17171a] px-3 py-4 shadow-[inset_0_1px_0_#ffffff04] transition-colors hover:border-white/20 hover:from-[#29292f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#48e4e9]`}
							>
								<span
									className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.035] ${tone}`}
								>
									<Icon size={23} strokeWidth={1.8} aria-hidden />
								</span>
								<span className="text-[12px] font-semibold text-[#e4e4e8]">
									{label}
								</span>
							</Link>
						))}
					</div>
					<button
						type="button"
						aria-label="Close GO shortcuts"
						onClick={() => dialog.current?.close()}
						className={`${styles.closeControl} absolute bottom-6 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#48e4e9] active:scale-95`}
					>
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
										{Array.from({ length: 6 }, (_, index) => (
											<ellipse
												key={index}
												cx="40"
												cy="23"
												rx="10"
												ry="17"
												transform={`rotate(${index * 60} 40 40)`}
											/>
										))}
									</g>
								</g>
								<g className={styles.petalsInnerLaunch}>
									<g className={styles.petalsInner}>
										{Array.from({ length: 6 }, (_, index) => (
											<ellipse
												key={index}
												cx="40"
												cy="26"
												rx="8"
												ry="15"
												transform={`rotate(${index * 60} 40 40)`}
											/>
										))}
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
					</button>
				</div>
			</dialog>
		</>,
		document.body,
	);
}
