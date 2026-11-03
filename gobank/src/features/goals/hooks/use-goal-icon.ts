import { useEffect, useState } from "react";
import { goalIcons, iconForGoal, type GoalIcon } from "../components/goal-art";

const storageKey = (goalId: string) => `gobank:goal-icon:${goalId}`;

function storedIcon(goalId: string): GoalIcon | null {
	try {
		const stored = localStorage.getItem(storageKey(goalId));
		return goalIcons.find((item) => item.value === stored)?.value ?? null;
	} catch {
		return null;
	}
}

export function saveGoalIcon(goalId: string, icon: GoalIcon) {
	try {
		localStorage.setItem(storageKey(goalId), icon);
	} catch {
		return;
	}
}

export function useGoalIcon(goalId: string, goalName: string) {
	const [icon, setIcon] = useState<GoalIcon>(() => iconForGoal(goalName));

	useEffect(() => {
		setIcon(storedIcon(goalId) ?? iconForGoal(goalName));
	}, [goalId, goalName]);

	const chooseIcon = (next: GoalIcon) => {
		setIcon(next);
		saveGoalIcon(goalId, next);
	};

	return { icon, setIcon: chooseIcon };
}
