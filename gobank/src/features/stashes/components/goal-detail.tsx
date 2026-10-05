"use client";
import { ArrowDownLeft, ArrowUpRight, Settings2 } from "lucide-react";
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
          className="mt-5 rounded-xl border border-white/10 bg-[#242426] px-5 py-3 text-[#e4e4e7] focus-visible:outline-2 focus-visible:outline-offset-4"
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
      setMessage("Transfer complete.");
    },
  });
  const update = api.stashes.update.useMutation({
    onSuccess: () => {
      refresh();
      setAction(null);
      setMessage("Target updated.");
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
    <div className="bg-surface-sunken text-ink -mx-6 -mt-8 -mb-10 flex flex-1 flex-col pt-7">
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
      </section>
      <div className="grid grid-cols-3 gap-2 px-4 py-5">
        {[
          { value: "in" as const, label: "Transfer in", Icon: ArrowDownLeft },
          { value: "out" as const, label: "Transfer out", Icon: ArrowUpRight },
          { value: "tools" as const, label: "Settings", Icon: Settings2 },
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
            className="group flex min-h-20 flex-col items-center gap-2 rounded-2xl py-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#71d5f3] disabled:opacity-45"
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-full border border-white/[.08] bg-[#242426] transition-colors group-hover:bg-[#303034] ${value === "in" ? "text-[#71d5f3]" : "text-[#e4e4e7]"}`}
            >
              <Icon size={25} aria-hidden />
            </span>
            <span className="text-[11px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
      <div className="bg-surface flex-1 rounded-t-[30px] px-5 pt-5 pb-10 shadow-[0_-8px_24px_-20px_#00000080]">
        {message && (
          <p
            role="status"
            className="bg-brand-soft text-ink-soft mb-4 rounded-2xl p-3 text-sm"
          >
            {message}
          </p>
        )}
        {action && (
          <form
            className="bg-surface-raised mb-5 space-y-4 rounded-[22px] p-4"
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
                ? "Goal settings"
                : action === "in"
                  ? "Transfer in"
                  : "Transfer out"}
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
              className="h-12 w-full rounded-2xl bg-[#71d5f3] font-semibold text-[#121214] transition-colors hover:bg-[#9ae1f7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#71d5f3] disabled:bg-[#353539] disabled:text-[#878792]"
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
              className="text-ink-muted hover:text-ink h-11 w-full rounded-xl text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Cancel
            </button>
          </form>
        )}
        <div
          role="tablist"
          aria-label="Goal details"
          className="mb-5 flex rounded-2xl border border-white/[.07] bg-[#121214] p-1"
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
              className={`h-11 flex-1 rounded-xl text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71d5f3] ${tab === value ? "bg-[#303034] text-white" : "text-[#a1a1ad] hover:text-white"}`}
            >
              {value === "overview" ? "Overview" : "Transactions"}
            </button>
          ))}
        </div>
        <div id="goal-panel" role="tabpanel" aria-labelledby={`goal-${tab}`}>
          {tab === "overview" ? (
            <dl className="divide-line divide-y">
              <div className="flex items-center justify-between gap-3 py-5 text-sm">
                <dt>Target</dt>
                <dd className="font-semibold">
                  {goal.goal ? peso(goal.goal) : "Not set"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-5 text-sm">
                <dt>Progress</dt>
                <dd className="font-semibold">
                  {goal.goal
                    ? `${Math.min(100, Math.floor((goal.balance / goal.goal) * 100))}%`
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : goal.transactions.length ? (
            <ul className="divide-line divide-y">
              {goal.transactions.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="text-[13px] font-medium">{entry.title}</p>
                    <p className="text-ink-muted mt-1 text-[11px]">
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
            <p className="text-ink-muted py-7 text-center text-sm">
              No transfers yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
