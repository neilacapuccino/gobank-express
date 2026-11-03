import { z } from "zod";
import { profileFields } from "~/shared/lib/schemas";
import {
	cardBrand,
	existingUsername,
	pin,
	pinChange,
	pinDigits,
	username,
} from "./auth.schemas";
import { endSession } from "~/server/session";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/trpc";
import { changePin, isUsernameFree, register, signIn } from "./auth.service";
import { prepareRegistrationCard } from "./card-preview.service";
import { signInWithGooglePin } from "./google/google.service";

export const authRouter = createTRPCRouter({
	prepareCard: publicProcedure
		.input(z.object({ brand: cardBrand }))
		.mutation(({ input }) => prepareRegistrationCard(input.brand)),

	usernameAvailable: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(({ input }) => {
			const parsed = username.safeParse(input.username);
			return parsed.success ? isUsernameFree(parsed.data) : false;
		}),

	register: publicProcedure
		.input(
			z.object({
				username,
				pin,
				brand: cardBrand,
				withGoogle: z.boolean().default(false),
				...profileFields,
			}),
		)
		.mutation(({ input: { withGoogle, ...profile } }) =>
			register(profile, withGoogle),
		),

	signIn: publicProcedure
		.input(z.object({ username: existingUsername, pin: pinDigits }))
		.mutation(({ input }) => signIn(input.username, input.pin)),

	signInWithGooglePin: publicProcedure
		.input(z.object({ pin: pinDigits }))
		.mutation(({ input }) => signInWithGooglePin(input.pin)),

	signOut: publicProcedure.mutation(({ ctx }) =>
		endSession(ctx.browserSession?.id),
	),

	changePin: protectedProcedure
		.input(pinChange)
		.mutation(({ ctx, input }) =>
			changePin(ctx.userId, input.currentPin, input.newPin),
		),
});
