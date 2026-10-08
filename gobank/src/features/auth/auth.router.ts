import { z } from "zod";
import { profileFields } from "~/shared/lib/schemas";
import { pin, pinChange, pinDigits, username } from "./auth.schemas";
import { USERNAME_MAX, USERNAME_MIN } from "./auth.rules";
import { endSession } from "~/server/session";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/trpc";
import { CardBrand } from "../../../generated/prisma";
import { changePin, isUsernameFree, register, signIn } from "./auth.service";
import { prepareRegistrationCard } from "./card-preview.service";

export const authRouter = createTRPCRouter({
	prepareCard: publicProcedure
		.input(z.object({ brand: z.nativeEnum(CardBrand) }))
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
				brand: z.nativeEnum(CardBrand),
				...profileFields,
			}),
		)
		.mutation(({ input }) => register(input)),

	signIn: publicProcedure
		.input(
			z.object({
				username: z
					.string()
					.trim()
					.toLowerCase()
					.transform((value) => value.replace(/^@/, ""))
					.pipe(
						z
							.string()
							.min(USERNAME_MIN)
							.max(USERNAME_MAX)
							.regex(/^[a-z0-9_]+$/),
					),
				pin: pinDigits,
			}),
		)
		.mutation(({ input }) => signIn(input.username, input.pin)),

	signOut: publicProcedure.mutation(() => endSession()),

	changePin: protectedProcedure
		.input(pinChange)
		.mutation(({ ctx, input }) =>
			changePin(ctx.userId, input.currentPin, input.newPin),
		),
});
