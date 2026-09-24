"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  ProfileFields,
  profileIsValid,
  type ProfileValues,
} from "./profile-fields";

type Profile = RouterOutputs["account"]["profile"];

export function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [value, setValue] = useState<ProfileValues>({
    fullName: profile.fullName ?? "",
    mobile: profile.mobile ?? "",
    email: profile.email ?? "",
  });

  const save = api.account.updateProfile.useMutation({
    onSuccess: () => {
      router.push("/settings");
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(value);
      }}
      className="flex flex-1 flex-col"
    >
      <PageHeader title="Edit profile" back="/settings" />

      <div className="mt-8 flex flex-col gap-5">
        <ProfileFields
          value={value}
          onChange={(patch) =>
            setValue((current) => ({ ...current, ...patch }))
          }
        />
      </div>

      {save.error ? (
        <p
          role="alert"
          className="bg-danger-soft text-danger mt-6 rounded-xl px-4 py-3 text-[13px]"
        >
          {errorMessage(save.error)}
        </p>
      ) : null}

      <div className="flex-1" />

      <Button
        type="submit"
        className="mt-8"
        disabled={!profileIsValid(value) || save.isPending || save.isSuccess}
      >
        {save.isPending || save.isSuccess ? "Saving" : "Save changes"}
      </Button>
    </form>
  );
}
