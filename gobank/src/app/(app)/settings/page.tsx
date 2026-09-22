import type { Metadata } from "next";
import { ProfileScreen } from "~/features/account/components/profile-screen";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  return <ProfileScreen profile={await api.account.profile()} />;
}
