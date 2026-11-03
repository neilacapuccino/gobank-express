import type { Metadata } from "next";
import { GoalDetail } from "~/features/goals/components/goal-detail";

export const metadata: Metadata = {
	title: "GoalSave",
};

export default async function GoalDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <GoalDetail id={id} />;
}
