"use client";
import { Pencil, X } from "lucide-react";
import { useRef } from "react";
import { GoalArt, goalIcons, type GoalIcon } from "./goal-art";
export function GoalIconPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: GoalIcon;
  onChange: (icon: GoalIcon) => void;
  disabled?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label="Choose a savings icon"
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => dialog.current?.showModal()}
        className="relative mx-auto block h-28 w-28 rounded-full bg-[#e0f2f4] p-5 shadow-[0_6px_20px_-10px_#1593a630] focus-visible:outline-2 focus-visible:outline-[#5530cc]"
      >
        <GoalArt icon={value} className="h-full w-full" />
        <span className="absolute right-0 bottom-0 grid h-9 w-9 place-items-center rounded-full border-4 border-[#e0f2f4] bg-white text-[#292838]">
          <Pencil size={15} aria-hidden />
        </span>
      </button>
      <dialog
        ref={dialog}
        aria-label="Choose a savings icon"
        className="bg-surface text-ink fixed inset-x-0 top-auto bottom-0 mx-auto mb-0 w-full max-w-[440px] rounded-t-[32px] border-0 p-6 shadow-2xl backdrop:bg-black/60"
      >
        <div className="bg-line-strong mx-auto mb-5 h-1 w-10 rounded-full" />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[20px] font-bold tracking-tight">
            Make this goal yours
          </h2>
          <button
            type="button"
            aria-label="Close icon picker"
            onClick={() => dialog.current?.close()}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#eef5f6] text-[#282938]"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-ink-muted mt-2 text-xs">
          Choose an icon. Your choice is saved on this device.
        </p>
        <div className="my-6 grid grid-cols-3 gap-4">
          {goalIcons.map(({ value: icon, label }) => (
            <button
              type="button"
              key={icon}
              aria-pressed={value === icon}
              onClick={() => {
                onChange(icon);
                dialog.current?.close();
              }}
              className="flex flex-col items-center gap-2 rounded-xl text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-[#5530cc]"
            >
              <span
                className={`grid aspect-square w-full place-items-center rounded-full border-[3px] bg-[#e4f2f3] p-3 ${value === icon ? "border-[#5931d1]" : "border-transparent"}`}
              >
                <GoalArt icon={icon} className="h-full w-full" />
              </span>
              {label}
            </button>
          ))}
        </div>
      </dialog>
    </>
  );
}
