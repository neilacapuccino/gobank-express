import { db } from "~/server/db";
import { activityFields } from "~/features/activity/activity.fields";
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

type ProfileUpdate = {
	fullName: string;
	mobile: string | null;
	profilePhoto?: string | null;
};

export const updateProfile = async (userId: string, profile: ProfileUpdate) => {
	const data = { ...profile };
	if (data.profilePhoto !== undefined)
		data.profilePhoto = await normalizeProfilePhoto(data.profilePhoto);
	return db.user.update({
		where: { id: userId },
		data,
		select: { id: true },
	});
};
