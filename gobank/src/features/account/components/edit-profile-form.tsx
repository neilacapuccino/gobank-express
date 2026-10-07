"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { prepareProfilePhoto } from "../profile-photo.client";
import { ProfilePhotoPicker } from "./profile-photo-picker";
import { GmailLink } from "./gmail-link";
import {
	ProfileFields,
	profileIsValid,
	type ProfileValues,
} from "./profile-fields";

type Profile = RouterOutputs["account"]["profile"];

export function EditProfileForm({ profile }: { profile: Profile }) {
	const router = useRouter();
	const [photo, setPhoto] = useState(profile.profilePhoto);
	const [preparingPhoto, setPreparingPhoto] = useState(false);
	const [photoError, setPhotoError] = useState<string | null>(null);
	const [value, setValue] = useState<ProfileValues>({
		fullName: profile.fullName ?? "",
		mobile: profile.mobile ?? "",
	});

	const save = api.account.updateProfile.useMutation({
		onSuccess: () => {
			router.push("/settings");
			router.refresh();
		},
	});

	const selectPhoto = async (file: File) => {
		setPreparingPhoto(true);
		setPhotoError(null);
		try {
			setPhoto(await prepareProfilePhoto(file));
		} catch (error) {
			setPhotoError(
				error instanceof Error ? error.message : "Couldn’t read that photo.",
			);
		} finally {
			setPreparingPhoto(false);
		}
	};

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				if (!preparingPhoto && !save.isPending)
					save.mutate({ ...value, profilePhoto: photo });
			}}
			className="flex flex-1 flex-col"
		>
			<PageHeader title="Edit profile" back="/settings" />

			<div className="mt-8 flex flex-col gap-5">
				<ProfilePhotoPicker
					photo={photo}
					busy={preparingPhoto || save.isPending || save.isSuccess}
					error={photoError}
					onSelect={(file) => void selectPhoto(file)}
					onRemove={() => {
						setPhoto(null);
						setPhotoError(null);
					}}
				/>
				<ProfileFields
					value={value}
					onChange={(patch) =>
						setValue((current) => ({ ...current, ...patch }))
					}
				/>
				<GmailLink gmail={profile.gmail} />
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
				disabled={
					!profileIsValid(value) ||
					preparingPhoto ||
					save.isPending ||
					save.isSuccess
				}
			>
				{save.isPending || save.isSuccess ? "Saving" : "Save changes"}
			</Button>
		</form>
	);
}
