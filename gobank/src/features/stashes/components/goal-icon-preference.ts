import { useEffect, useState } from "react";
import { goalIcons, iconForGoal, type GoalIcon } from "./goal-art";

// Icons are presentation preferences on this device, never financial data.
export function saveGoalIcon(id: string, icon: GoalIcon) {
	try {
		localStorage.setItem(`gobank:goal-icon:${id}`, icon);
	} catch {
		/* Storage may be disabled. */
	}
}
export function useGoalIcon(id: string, name: string) {
	const [icon, setIcon] = useState<GoalIcon>(() => iconForGoal(name));
	useEffect(() => {
		try {
			const stored = localStorage.getItem(`gobank:goal-icon:${id}`);
			setIcon(
				goalIcons.find((item) => item.value === stored)?.value ??
					iconForGoal(name),
			);
		} catch {
			setIcon(iconForGoal(name));
		}
	}, [id, name]);
	return {
		icon,
		setIcon: (next: GoalIcon) => {
			setIcon(next);
			saveGoalIcon(id, next);
		},
	};
}
