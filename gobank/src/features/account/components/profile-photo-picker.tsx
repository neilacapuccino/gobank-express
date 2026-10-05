"use client";

import { Camera } from "lucide-react";
import { useRef } from "react";
import { PHOTO_TYPES } from "../profile-photo.schema";
import { ProfileAvatar } from "./profile-avatar";

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
  return (
    <section
      className="flex flex-col items-center gap-3 rounded-2xl border border-white/[.07] bg-[#171719] px-4 py-5"
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
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) onSelect(file);
        }}
      />
      <div className="flex w-36 flex-col gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[12px] font-medium text-[#71d5f3] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        >
          <Camera size={15} aria-hidden />
          {busy ? "Preparing photo…" : photo ? "Change photo" : "Add photo"}
        </button>
        {photo && (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="text-ink-muted hover:text-ink min-h-10 px-2 text-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
      <p className="text-ink-faint text-[10px]">
        PNG, JPG or WebP · up to 5 MB
      </p>
      {error && (
        <p role="alert" className="text-danger text-[12px]">
          {error}
        </p>
      )}
    </section>
  );
}
