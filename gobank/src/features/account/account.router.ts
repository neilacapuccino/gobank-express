import { z } from "zod";
import { profileFields } from "~/shared/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { unlinkGoogle } from "~/features/auth/google/google.service";
import { profilePhotoInput } from "./profile-photo.schema";
import {
	getOverview,
	getProfile,
	getSpending,
	updateProfile,
} from "./account.service";

export const accountRouter = createTRPCRouter({
	overview: protectedProcedure.query(({ ctx }) => getOverview(ctx.userId)),

	spending: protectedProcedure.query(({ ctx }) => getSpending(ctx.userId)),

	profile: protectedProcedure.query(({ ctx }) => getProfile(ctx.userId)),

	updateProfile: protectedProcedure
		.input(z.object({ ...profileFields, profilePhoto: profilePhotoInput }))
		.mutation(({ ctx, input }) => updateProfile(ctx.userId, input)),

	unlinkGoogle: protectedProcedure.mutation(({ ctx }) =>
		unlinkGoogle(ctx.userId),
	),
});
