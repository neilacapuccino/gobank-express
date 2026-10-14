"use client";

import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "~/shared/ui/button";
import { api } from "~/trpc/react";
import { clearClientSession } from "../session-client";

export function SignOutButton() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const signOut = api.auth.signOut.useMutation({
		onSuccess: () => {
			clearClientSession();
			queryClient.clear();
			router.replace("/signin");
			router.refresh();
		},
	});

	return (
		<Button
			disabled={signOut.isPending || signOut.isSuccess}
			onClick={() => signOut.mutate()}
			className="bg-danger! focus-visible:ring-danger/40! enabled:hover:bg-danger! enabled:active:bg-danger! disabled:bg-danger! text-white! disabled:text-white!"
		>
			<LogOut size={17} strokeWidth={1.9} aria-hidden />
			{signOut.isPending || signOut.isSuccess ? "Signing out" : "Sign out"}
		</Button>
	);
}
