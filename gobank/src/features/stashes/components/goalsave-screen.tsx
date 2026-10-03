"use client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { MAX_STASHES } from "~/shared/lib/money";
import { peso } from "~/shared/lib/format";
import { Button } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { GoMenu } from "~/features/account/components/go-menu";
import { errorMessage } from "~/trpc/error-message";
import { api, type RouterOutputs } from "~/trpc/react";
import { CreateGoalForm } from "./create-goal-form";
import { GoalBubble } from "./goal-bubble";
import { useGoalIcon } from "./goal-icon-preference";

export function GoalSaveScreen() {
  const router = useRouter();
  const utils = api.useUtils();
  const goals = api.stashes.list.useQuery();
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const count = goals.data?.length ?? 0;
  const total = goals.data?.reduce((sum, goal) => sum + goal.balance, 0) ?? 0;
  if (creating)
    return (
      <CreateGoalForm
        onCancel={() => setCreating(false)}
        onCreated={(goal) => {
          utils.stashes.list.setData(undefined, (current) => [
            ...(current ?? []).filter((item) => item.id !== goal.id),
            goal,
          ]);
          void utils.stashes.list.invalidate();
          void utils.account.overview.invalidate();
          setCreating(false);
          setNotice(`“${goal.name}” is ready. Your next chapter starts here.`);
          router.refresh();
        }}
      />
    );
  return (
    <div className="-mx-6 -mt-8 -mb-10 flex flex-1 flex-col gap-6 bg-linear-to-b from-[#c8f1f4] via-[#e0f4f5] to-[#f6fafb] px-5 pt-7 pb-28 text-[#282938]">
      <PageHeader title="GoalSave" back="/dashboard" />
      <section className="py-5 text-center">
        <p className="text-[14px] text-[#465462]">Total current savings</p>
        <h1 className="mt-2 text-[38px] font-bold tracking-tight break-all tabular-nums">
          {goals.data ? peso(total) : "—"}
        </h1>
      </section>
      <div className="rounded-[22px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_5px_18px_-12px_#21798d40]">
        <p className="text-[14px] font-semibold">
          Big plans start with small steps.
        </p>
        <p className="mt-1 text-[12px] text-[#546270]">
          Give every dream its own savings space.
        </p>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-2xl bg-white/80 p-3 text-[12px] text-[#4331a0]"
        >
          {notice}
        </p>
      )}
      {goals.isPending && (
        <p role="status" className="text-center text-sm">
          Loading your goals…
        </p>
      )}
      {goals.isError && (
        <div role="alert">
          <p className="text-danger mb-3 text-sm">
            {errorMessage(goals.error)}
          </p>
          <Button
            variant="outline"
            disabled={goals.isFetching}
            onClick={() => void goals.refetch()}
          >
            Try again
          </Button>
        </div>
      )}
      {goals.data && (
        <>
          <div className="grid grid-cols-2 items-start gap-x-5 gap-y-8 py-3">
            <button
              type="button"
              disabled={count >= MAX_STASHES}
              onClick={() => {
                setNotice("");
                setCreating(true);
              }}
              className="group flex min-h-52 flex-col items-center justify-center gap-4 rounded-[28px] px-1 py-4 focus-visible:outline-2 focus-visible:outline-[#5734ce] disabled:opacity-50"
            >
              <span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-[#262536] text-[#06e0e5] shadow-[0_8px_18px_-6px_#28293845] transition-transform group-hover:scale-105">
                <Plus size={33} strokeWidth={2} aria-hidden />
              </span>
              <span className="text-center text-[13px] font-semibold">
                Open new GoalSave
              </span>
            </button>
            {goals.data.map((goal) => (
              <GoalTile key={goal.id} goal={goal} />
            ))}
          </div>
          {count === 0 && (
            <p className="mx-auto max-w-64 text-center text-[13px] leading-relaxed text-[#53616f]">
              Your next adventure, a rainy-day fund, or something just for you.
              What will you save for?
            </p>
          )}
          <p className="text-center text-[11px] text-[#53616f]">
            {count} of {MAX_STASHES} savings goals
            {count >= MAX_STASHES ? " · All goal spaces are in use" : ""}
          </p>
        </>
      )}
      <GoMenu />
    </div>
  );
}
function GoalTile({
  goal,
}: {
  goal: RouterOutputs["stashes"]["list"][number];
}) {
  const { icon } = useGoalIcon(goal.id, goal.name);
  return (
    <Link
      href={`/stashes/${goal.id}`}
      className="group rounded-[28px] text-center outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#5734ce]"
    >
      <div className="transition-transform duration-200 group-hover:-translate-y-1">
        <GoalBubble
          icon={icon}
          balance={goal.balance}
          target={goal.goal}
          label={goal.name}
        />
      </div>
      <h2 className="mt-3 text-[13px] font-medium break-words text-[#475663]">
        {goal.name}
      </h2>
      <p className="mt-1 text-[19px] font-bold break-all tabular-nums">
        {peso(goal.balance)}
      </p>
      {goal.goal && (
        <p className="mt-1 text-[10px] text-[#53616f]">of {peso(goal.goal)}</p>
      )}
    </Link>
  );
}
