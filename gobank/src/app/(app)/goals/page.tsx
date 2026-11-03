import type { Metadata } from "next";
import { GoalSaveScreen } from "~/features/goals/components/goalsave-screen";

export const metadata: Metadata = {
	title: "GoalSave",
};

export default function GoalsPage() {
	return <GoalSaveScreen />;
}
