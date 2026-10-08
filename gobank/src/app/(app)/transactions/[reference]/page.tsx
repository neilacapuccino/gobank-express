import type { Metadata } from "next";
import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { ReceiptScreen } from "~/features/account/components/receipt-screen";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Receipt",
};

export default async function ReceiptPage({
	params,
}: {
	params: Promise<{ reference: string }>;
}) {
	const { reference } = await params;
	try {
		return (
			<ReceiptScreen
				transaction={await api.account.transaction({ reference })}
			/>
		);
	} catch (error) {
		if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
		throw error;
	}
}
