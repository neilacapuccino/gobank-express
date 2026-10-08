import { db } from "~/server/db";
import { normalizeProfilePhoto } from "./profile-photo.server";

const activityFields = {
	id: true,
	reference: true,
	kind: true,
	title: true,
	amount: true,
	createdAt: true,
} as const;

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
			_count: { select: { stashes: true } },
			transactions: {
				select: activityFields,
				orderBy: [{ createdAt: "desc" }, { id: "desc" }],
				take: 5,
			},
		},
	});

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
	const { googleId, ...details } = profile;
	return { ...details, gmail: googleId ? details.gmail : null };
};

export async function listActivity(
	userId: string,
	cursor: string | null | undefined,
	limit: number,
) {
	const items = await db.transaction.findMany({
		where: { userId },
		select: activityFields,
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: limit + 1,
		...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
	});
	const hasMore = items.length > limit;
	if (hasMore) items.pop();
	const next = hasMore ? items.at(-1)?.id : null;
	return { items, next };
}

export const getTransaction = (userId: string, reference: string) =>
	db.transaction.findUniqueOrThrow({
		where: { reference_userId: { reference, userId } },
		include: {
			biller: { select: { name: true } },
			stash: { select: { name: true } },
			counterparty: { select: { username: true } },
		},
	});

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
