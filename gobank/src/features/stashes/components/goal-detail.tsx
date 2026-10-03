"use client";
import { ArrowDownLeft, ArrowUpRight, Star } from "lucide-react";
import { useState } from "react";
import { peso, shortDate } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { PageHeader } from "~/shared/ui/page-header";
import { TextField } from "~/shared/ui/text-field";
import { api, type RouterOutputs } from "~/trpc/react";
import { errorMessage } from "~/trpc/error-message";
import { GoalBubble } from "./goal-bubble";
import { GoalIconPicker } from "./goal-icon-picker";
import { useGoalIcon } from "./goal-icon-preference";

export function GoalDetail({ id }: { id: string }) {
  const query = api.stashes.get.useQuery({ id });
  if (query.isPending) return <p role="status">Loading your GoalSave…</p>;
  if (query.isError)
    return (
      <div>
        <PageHeader title="GoalSave" back="/stashes" />
        <p role="alert" className="text-danger mt-8">
          {errorMessage(query.error)}
        </p>
        <button
          onClick={() => void query.refetch()}
          className="mt-5 rounded-full bg-[#e0f3f4] px-5 py-3"
        >
          Try again
        </button>
      </div>
    );
  return <GoalContent goal={query.data} />;
}
type Goal = RouterOutputs["stashes"]["get"];
function GoalContent({ goal }: { goal: Goal }) {
  const utils = api.useUtils();
  const { icon, setIcon } = useGoalIcon(goal.id, goal.name);
  const [tab, setTab] = useState<"overview" | "transactions">("overview");
  const [action, setAction] = useState<"in" | "out" | "tools" | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const refresh = () => {
    void utils.stashes.get.invalidate({ id: goal.id });
    void utils.stashes.list.invalidate();
    void utils.account.overview.invalidate();
  };
  const move = api.stashes.move.useMutation({
    onSuccess: () => {
      refresh();
      setAction(null);
      setAmount("");
      setMessage("Transfer complete. Your savings are up to date.");
    },
  });
  const update = api.stashes.update.useMutation({
    onSuccess: () => {
      refresh();
      setAction(null);
      setMessage("Savings target updated.");
    },
  });
  const cents = toCentavos(Number(amount));
  const valid =
    /^\d+(\.\d{1,2})?$/.test(amount.trim()) &&
    cents > 0 &&
    cents <= 100_000_000 &&
    (action !== "out" || cents <= goal.balance);
  const pending = move.isPending || update.isPending;
  return (
    <div className="-mx-6 -mt-8 -mb-10 flex flex-1 flex-col bg-linear-to-b from-[#c8f1f4] to-[#effafb] pt-7 text-[#282938]">
      <div className="px-5">
        <PageHeader title={goal.name} back="/stashes" />
      </div>
      <section className="px-8 pt-7 pb-4 text-center">
        <GoalBubble
          icon={icon}
          balance={goal.balance}
          target={goal.goal}
          label={goal.name}
          large
        />
        <h1 className="mt-4 text-[36px] font-bold tracking-tight break-all tabular-nums">
          {peso(goal.balance)}
        </h1>
        <p className="mt-1 text-sm text-[#475663]">
          {goal.goal ? `Target: ${peso(goal.goal)}` : "Saving at your own pace"}
        </p>
      </section>
      <div className="grid grid-cols-3 gap-2 px-4 py-5">
        {[
          { value: "in" as const, label: "Transfer in", Icon: ArrowDownLeft },
          { value: "out" as const, label: "Transfer out", Icon: ArrowUpRight },
          { value: "tools" as const, label: "Saving tools", Icon: Star },
        ].map(({ value, label, Icon }) => (
          <button
            key={value}
            disabled={pending}
            onClick={() => {
              move.reset();
              update.reset();
              setMessage("");
              setAmount(
                value === "tools" && goal.goal ? String(goal.goal / 100) : "",
              );
              setAction(value);
            }}
            className="flex min-h-20 flex-col items-center gap-2 rounded-2xl py-2 focus-visible:outline-2 focus-visible:outline-[#5831cc]"
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-full shadow-[0_5px_14px_-9px_#16496660] ${value === "in" ? "bg-[#282938] text-[#00e0e5]" : "bg-[#c7e7eb] text-[#282938]"}`}
            >
              <Icon size={25} aria-hidden />
            </span>
            <span className="text-[11px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 rounded-t-[30px] bg-white px-5 pt-5 pb-10 shadow-[0_-8px_24px_-20px_#287d9d50]">
        {message && (
          <p
            role="status"
            className="mb-4 rounded-2xl bg-[#edf9f8] p-3 text-sm text-[#245264]"
          >
            {message}
          </p>
        )}
        {action && (
          <form
            className="mb-5 space-y-4 rounded-[22px] bg-[#edf5f7] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (pending) return;
              if (action === "tools") {
                if (amount.trim() === "" || valid)
                  update.mutate({
                    id: goal.id,
                    goal: amount.trim() ? cents : null,
                  });
              } else if (valid)
                move.mutate({ id: goal.id, amount: cents, direction: action });
            }}
          >
            <h2 className="text-lg font-bold">
              {action === "tools"
                ? "Your saving tools"
                : action === "in"
                  ? "Transfer into GoalSave"
                  : "Transfer to spending account"}
            </h2>
            {action === "tools" && (
              <GoalIconPicker
                value={icon}
                onChange={setIcon}
                disabled={pending}
              />
            )}
            <TextField
              label={action === "tools" ? "Savings target" : "Amount"}
              optional={action === "tools"}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              prefix="₱"
              disabled={pending}
              maxLength={12}
              hint={
                action === "tools"
                  ? "Leave blank to remove your target."
                  : action === "out"
                    ? `Available: ${peso(goal.balance)}`
                    : "Move money from your spending account."
              }
              error={
                amount && !valid
                  ? "Enter a valid amount within the available limit."
                  : null
              }
            />
            {(move.error ?? update.error) && (
              <p role="alert" className="text-danger text-sm">
                {errorMessage(move.error ?? update.error)}
              </p>
            )}
            <button
              type="submit"
              disabled={
                pending ||
                !(valid || (action === "tools" && amount.trim() === ""))
              }
              className="h-12 w-full rounded-full bg-[#02dce2] font-semibold text-[#20233a] disabled:bg-[#d7e4e7] disabled:text-[#586976]"
            >
              {pending
                ? "Saving…"
                : action === "tools"
                  ? "Save target"
                  : "Confirm transfer"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setAction(null)}
              className="h-11 w-full rounded-full text-sm font-medium"
            >
              Cancel
            </button>
          </form>
        )}
        <div
          role="tablist"
          aria-label="Goal details"
          className="mb-5 flex rounded-full border border-[#d1e5e9] bg-[#edf5f6] p-1"
        >
          {(["overview", "transactions"] as const).map((value) => (
            <button
              key={value}
              id={`goal-${value}`}
              role="tab"
              aria-selected={tab === value}
              aria-controls="goal-panel"
              tabIndex={tab === value ? 0 : -1}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  const next = tab === "overview" ? "transactions" : "overview";
                  setTab(next);
                  document.getElementById(`goal-${next}`)?.focus();
                }
              }}
              onClick={() => setTab(value)}
              className={`h-11 flex-1 rounded-full text-[13px] font-semibold ${tab === value ? "bg-[#5530d1] text-white shadow-sm" : "text-[#465263]"}`}
            >
              {value === "overview" ? "Overview" : "Transactions"}
            </button>
          ))}
        </div>
        <div id="goal-panel" role="tabpanel" aria-labelledby={`goal-${tab}`}>
          {tab === "overview" ? (
            <dl className="divide-y divide-[#dcebee]">
              <div className="flex items-center justify-between gap-3 py-5 text-sm">
                <dt>Saving target</dt>
                <dd className="font-semibold">
                  {goal.goal ? peso(goal.goal) : "Not set"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-5 text-sm">
                <dt>Goal progress</dt>
                <dd className="font-semibold">
                  {goal.goal
                    ? `${Math.min(100, Math.floor((goal.balance / goal.goal) * 100))}%`
                    : "Your own pace"}
                </dd>
              </div>
            </dl>
          ) : goal.transactions.length ? (
            <ul className="divide-y divide-[#dcebee]">
              {goal.transactions.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="text-[13px] font-medium">{entry.title}</p>
                    <p className="mt-1 text-[11px] text-[#53616f]">
                      {shortDate(entry.createdAt)}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold tabular-nums">
                    {peso(Math.abs(entry.amount))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-7 text-center text-sm text-[#53616f]">
              Your savings journey starts with your first transfer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
