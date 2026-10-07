import { db } from "~/server/db";

type CardSettings = {
  locked?: boolean;
  dailyLimit?: number;
};

export const getCard = (userId: string) =>
  db.card.findUniqueOrThrow({
    where: { userId },
    include: {
      user: {
        select: {
          fullName: true,
        },
      },
    },
  });

export const updateCard = (userId: string, settings: CardSettings) =>
  db.card.update({
    where: { userId },
    data: settings,
  });
