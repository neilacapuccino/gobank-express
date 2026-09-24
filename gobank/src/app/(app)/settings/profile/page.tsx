import type { Metadata } from "next";
import { EditProfileForm } from "~/features/account/components/edit-profile-form";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Edit profile",
};

export default async function EditProfilePage() {
  return <EditProfileForm profile={await api.account.profile()} />;
}
