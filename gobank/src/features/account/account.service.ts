import { db } from "~/server/db";
import { MESSAGES } from "~/server/errors";
import { spentToday } from "~/server/ledger";
import { verifyAccountPin } from "~/features/auth/auth.service";
import {
	activityFields,
	MAIN_ACCOUNT_KINDS,
} from "~/features/activity/activity.fields";
import { normalizeProfilePhoto } from "./profile-photo.server";

export const getOverview = (userId: string) =>
	db.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			username: true,
			fullName: true,
			profilePhoto: true,
			accountNumber: true,
			balance: true,
			points: true,
			_count: { select: { savingsGoals: true } },
			transactions: {
				where: { kind: MAIN_ACCOUNT_KINDS },
				select: activityFields,
				orderBy: [{ createdAt: "desc" }, { id: "desc" }],
				take: 5,
			},
		},
	});

export const getSpending = async (userId: string) => {
	const [account, spent] = await Promise.all([
		db.user.findUniqueOrThrow({
			where: { id: userId },
			select: {
				balance: true,
				cardDailyLimit: true,
				cards: {
					select: { kind: true, brand: true, number: true, locked: true },
					orderBy: { kind: "asc" },
				},
			},
		}),
		spentToday(db, userId),
	]);

	const { cards, ...limits } = account;

	return {
		...limits,
		dailyLeft: Math.max(0, account.cardDailyLimit - spent),
		cards: cards.map(({ number, ...card }) => ({
			...card,
			last4: number.slice(-4),
		})),
	};
};

export const getProfile = async (userId: string) => {
	const profile = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			username: true,
			fullName: true,
			profilePhoto: true,
			mobile: true,
			gmail: true,
			googleId: true,
			accountNumber: true,
			createdAt: true,
		},
	});

	const { googleId, gmail, ...details } = profile;
	const googleLinked = googleId !== null;

	return { ...details, googleLinked, gmail: googleLinked ? gmail : null };
};

type ProfileUpdate = {
	fullName: string;
	mobile: string | null;
	profilePhoto?: string | null;
};

export const updateProfile = async (userId: string, profile: ProfileUpdate) => {
	const { profilePhoto, ...fields } = profile;
	return db.user.update({
		where: { id: userId },
		data: {
			...fields,
			...(profilePhoto !== undefined
				? { profilePhoto: await normalizeProfilePhoto(profilePhoto) }
				: {}),
		},
		select: { id: true },
	});
};

export const deleteAccount = async (userId: string, pin: string) => {
	await verifyAccountPin(userId, pin, MESSAGES.wrongPin);

	await db.user.delete({ where: { id: userId }, select: { id: true } });

	return { deleted: true };
};
