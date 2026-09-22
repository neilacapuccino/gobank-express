import { pointsValue } from "~/shared/lib/money";
import { db } from "~/server/db";
import { post } from "~/server/ledger";

export const redeemPoints = (userId: string, points: number) =>
  db.$transaction((tx) =>
    post(tx, {
      userId,
      kind: "reward",
      title: `Redeemed ${points.toLocaleString()} points`,
      amount: pointsValue(points),
      points: -points,
    }),
  );
