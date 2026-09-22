import { db } from "~/server/db";

type CardSettings = { locked?: boolean; dailyLimit?: number };

export const getCard = (userId: string) =>
  db.card.findUniqueOrThrow({ where: { userId } });

export const updateCard = (userId: string, settings: CardSettings) =>
  db.card.update({ where: { userId }, data: settings });
