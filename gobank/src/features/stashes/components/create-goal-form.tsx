"use client";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { TextField } from "~/shared/ui/text-field";
import { toCentavos } from "~/shared/lib/money";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { GoalIconPicker } from "./goal-icon-picker";
import { type GoalIcon } from "./goal-art";
import { saveGoalIcon } from "./goal-icon-preference";

export function CreateGoalForm({
  onCreated,
  onCancel,
}: {
  onCreated: (goal: RouterOutputs["stashes"]["create"]) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState<GoalIcon>("safe");
  const [step, setStep] = useState<"name" | "target">("name");
  const create = api.stashes.create.useMutation({
    onSuccess: (goal) => {
      saveGoalIcon(goal.id, icon);
      onCreated(goal);
    },
  });
  const amount = target.trim();
  const goal = amount ? toCentavos(Number(amount)) : null;
  const validTarget =
    goal === null ||
    (/^\d+(\.\d{1,2})?$/.test(amount) && goal > 0 && goal <= 100_000_000);
  const validName = name.trim().length > 0 && name.trim().length <= 40;
  return (
    <form
      className="-mx-6 -mt-8 -mb-10 flex min-h-[calc(100dvh-1px)] flex-1 flex-col bg-white px-5 pt-7 pb-8 text-[#282938]"
      onSubmit={(event) => {
        event.preventDefault();
        if (!validName || create.isPending) return;
        if (step === "name") {
          setStep("target");
          return;
        }
        if (validTarget) create.mutate({ name: name.trim(), goal });
      }}
    >
      <header className="relative flex min-h-11 items-center justify-center">
        <button
          type="button"
          disabled={create.isPending}
          aria-label={
            step === "name" ? "Back to GoalSave" : "Back to goal name"
          }
          onClick={() => (step === "name" ? onCancel() : setStep("name"))}
          className="absolute left-0 grid h-11 w-11 place-items-center rounded-full hover:bg-[#edf5f6]"
        >
          <ArrowLeft size={23} />
        </button>
        <h1 className="text-[17px] font-semibold">New GoalSave</h1>
      </header>
      <div className="mt-9">
        <GoalIconPicker
          value={icon}
          onChange={setIcon}
          disabled={create.isPending}
        />
      </div>
      {step === "name" ? (
        <div className="mt-9">
          <label
            htmlFor="goal-name"
            className="block text-center text-[21px] font-semibold tracking-tight"
          >
            What are you saving for?
          </label>
          <input
            id="goal-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={40}
            autoFocus
            placeholder="Give your goal a name"
            className="mt-4 h-14 w-full border-b-2 border-[#a4b9c2] bg-transparent px-2 text-center text-[19px] outline-none placeholder:text-[#61717e] focus:border-[#6437dd]"
          />
          <p className="mt-2 text-center text-xs text-[#53616f]">
            {name.length}/40
          </p>
          <p className="mx-auto mt-6 max-w-64 text-center text-[13px] leading-relaxed text-[#53616f]">
            A big adventure or a little peace of mind. Every goal starts
            somewhere.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="text-center text-[22px] font-bold tracking-tight">
            Set your sights on a target
          </h2>
          <p className="mt-2 mb-7 text-center text-sm text-[#53616f]">{name}</p>
          <TextField
            label="Target amount"
            optional
            prefix="₱"
            inputMode="decimal"
            placeholder="0.00"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            maxLength={12}
            disabled={create.isPending}
            autoFocus
            aria-invalid={!validTarget}
            error={
              !validTarget
                ? "Enter ₱0.01 to ₱1,000,000, with up to two decimal places."
                : null
            }
          />
          <p className="mt-3 text-xs leading-relaxed text-[#53616f]">
            Leave blank to save at your own pace. Your goal starts at ₱0.00;
            creating it does not move money.
          </p>
        </div>
      )}
      {create.error && (
        <p
          role="alert"
          className="bg-danger-soft text-danger mt-5 rounded-2xl p-3 text-sm"
        >
          {errorMessage(create.error)}
        </p>
      )}
      <div className="mt-auto pt-10">
        <button
          type="submit"
          disabled={
            !validName ||
            (step === "target" && !validTarget) ||
            create.isPending
          }
          className="h-14 w-full rounded-full bg-[#02dce2] text-[16px] font-bold text-[#20233a] shadow-[0_7px_20px_-10px_#009fb680] transition-colors hover:bg-[#00cbd5] disabled:bg-[#e0eaec] disabled:text-[#586976]"
        >
          {create.isPending
            ? "Creating…"
            : step === "name"
              ? "Next"
              : "Create GoalSave"}
        </button>
      </div>
    </form>
  );
}
