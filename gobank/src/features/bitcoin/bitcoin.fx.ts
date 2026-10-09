import "server-only";
import { z } from "zod";
import { fail } from "~/server/errors";
import { createRequestCache } from "./bitcoin.cache";

const schema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	base: z.literal("USD"),
	quote: z.literal("PHP"),
	rate: z.number().finite().positive().max(10_000),
});
type PhpRate = { rate: number; date: string };
const rateCache = createRequestCache<string, PhpRate>(() => 60 * 60_000);
const fresh = (date: string) => {
	const age = Date.now() - Date.parse(`${date}T00:00:00Z`);
	return Number.isFinite(age) && age > -86_400_000 && age < 7 * 86_400_000;
};

// Pricing only: this never creates a USD balance or converts account money.
export async function getPhpRate(): Promise<PhpRate> {
	const value = await rateCache("USD/PHP", async () => {
		try {
			const response = await fetch(
				"https://api.frankfurter.dev/v2/rate/USD/PHP",
				{ cache: "no-store", signal: AbortSignal.timeout(8_000) },
			);
			if (!response.ok) throw new Error("Rate unavailable");
			const rate = schema.parse(await response.json());
			if (!fresh(rate.date)) throw new Error("Rate expired");
			return { rate: rate.rate, date: rate.date };
		} catch {
			return fail(
				"BAD_REQUEST",
				"PHP market pricing is unavailable. Try again shortly.",
			);
		}
	});
	if (!fresh(value.date))
		fail("BAD_REQUEST", "PHP market pricing has expired. Try again later.");
	return value;
}
