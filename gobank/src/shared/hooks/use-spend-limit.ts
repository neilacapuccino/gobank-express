"use client";

import { useState } from "react";
import { peso } from "~/shared/lib/format";
import { api } from "~/trpc/react";
import type { CardKind } from "../../../generated/prisma";

export function useSpendLimit(maximum: number, minimum = 1) {
	const { data } = api.account.spending.useQuery();
	const [chosen, setCard] = useState<CardKind | null>(null);

	const cards = data?.cards ?? [];
	const unlocked = cards.filter((item) => !item.locked);
	const locked = cards.length > 0 && unlocked.length === 0;

	const chosenIfUnlocked = unlocked.find((item) => item.kind === chosen);
	const card = chosenIfUnlocked?.kind ?? unlocked[0]?.kind ?? "physical";

	const check = (amount: number) => {
		if (!Number.isFinite(amount) || amount <= 0) return null;
		if (amount < minimum) return `Minimum ${peso(minimum)}`;
		if (amount > maximum) return `Maximum ${peso(maximum)}`;

		if (!data) return null;
		if (locked) return "Both cards are locked. Unlock one to spend";

		if (amount > data.balance) {
			return `Insufficient balance. You have ${peso(data.balance)}`;
		}

		if (amount > data.dailyLeft) {
			return `Over your daily limit. ${peso(data.dailyLeft)} left today`;
		}

		return null;
	};

	const hint = data
		? `Balance ${peso(data.balance)} · ${peso(data.dailyLeft)} left today`
		: `Up to ${peso(maximum)}`;

	return {
		check,
		hint,
		cards,
		card,
		setCard,
		locked,
		valid: (amount: number) => amount >= minimum && check(amount) === null,
	};
}
