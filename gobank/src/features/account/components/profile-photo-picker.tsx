"use client";

import { Camera } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { PHOTO_TYPES } from "../profile-photo.schema";
import { ProfileAvatar } from "./profile-avatar";

function pickerLabel(busy: boolean, hasPhoto: boolean) {
	if (busy) return "Preparing photo…";
	return hasPhoto ? "Change photo" : "Add photo";
}

export function ProfilePhotoPicker({
	photo,
	busy,
	error,
	onSelect,
	onRemove,
}: {
	photo: string | null;
	busy: boolean;
	error: string | null;
	onSelect: (file: File) => void;
	onRemove: () => void;
}) {
	const input = useRef<HTMLInputElement>(null);

	const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = "";
		if (file) onSelect(file);
	};

	return (
		<section
			className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-white/[.07] px-4 py-5"
			aria-label="Profile photo"
		>
			<ProfileAvatar photo={photo} />
			<input
				ref={input}
				type="file"
				accept={PHOTO_TYPES.join(",")}
				aria-label="Choose profile photo"
				hidden
				disabled={busy}
				onChange={chooseFile}
			/>
			<div className="flex w-36 flex-col gap-1">
				<button
					type="button"
					disabled={busy}
					onClick={() => input.current?.click()}
					className="text-sky inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[12px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
				>
					<Camera size={15} aria-hidden />
					{pickerLabel(busy, Boolean(photo))}
				</button>
				{photo ? (
					<button
						type="button"
						disabled={busy}
						onClick={onRemove}
						className="text-danger min-h-10 px-2 text-[12px] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
					>
						Remove
					</button>
				) : null}
			</div>
			<p className="text-ink-faint text-[10px]">
				PNG, JPG or WebP · up to 5 MB
			</p>
			{error ? (
				<p role="alert" className="text-danger text-[12px]">
					{error}
				</p>
			) : null}
		</section>
	);
}
