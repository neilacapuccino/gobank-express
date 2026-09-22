"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "~/app/_components/ui/button";
import { api } from "~/trpc/react";

export function SignOutButton() {
  const router = useRouter();
  const signOut = api.auth.signOut.useMutation({
    onSuccess: () => {
      router.replace("/signin");
      router.refresh();
    },
  });

  return (
    <Button
      variant="outline"
      disabled={signOut.isPending || signOut.isSuccess}
      onClick={() => signOut.mutate()}
      className="text-danger! hover:bg-danger-soft!"
    >
      <LogOut size={17} strokeWidth={1.9} aria-hidden />
      {signOut.isPending || signOut.isSuccess ? "Signing out" : "Sign out"}
    </Button>
  );
}
