import type { Metadata } from "next";
import { GoalSaveScreen } from "~/features/stashes/components/goalsave-screen";

export const metadata: Metadata = {
	title: "GoalSave",
};

export default function StashesPage() {
	return <GoalSaveScreen />;
}
