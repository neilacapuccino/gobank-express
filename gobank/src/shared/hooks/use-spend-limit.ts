"use client";

import { peso } from "~/shared/lib/format";
import { api } from "~/trpc/react";

export function useSpendLimit(maximum: number, minimum = 1) {
	const { data } = api.account.spending.useQuery();

	const check = (amount: number) => {
		if (!Number.isFinite(amount) || amount <= 0) return null;
		if (amount < minimum) return `Minimum ${peso(minimum)}`;
		if (amount > maximum) return `Maximum ${peso(maximum)}`;
		if (!data) return null;
		if (data.cardLocked) return "Unlock your card to spend";
		if (amount > data.balance)
			return `Insufficient balance. You have ${peso(data.balance)}`;
		if (amount > data.dailyLeft)
			return `Over your daily limit. ${peso(data.dailyLeft)} left today`;
		return null;
	};

	const hint = data
		? `Balance ${peso(data.balance)} · ${peso(data.dailyLeft)} left today`
		: `Up to ${peso(maximum)}`;

	return {
		check,
		hint,
		locked: data?.cardLocked ?? false,
		valid: (amount: number) => amount >= minimum && check(amount) === null,
	};
}
