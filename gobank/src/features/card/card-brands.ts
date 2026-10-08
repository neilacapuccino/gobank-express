export const CARD_BRANDS = [
	{
		id: "visa",
		name: "Visa",
		numberPrefix: "4242",
	},
	{
		id: "mastercard",
		name: "Mastercard",
		numberPrefix: "5555",
	},
	{
		id: "jcb",
		name: "JCB",
		numberPrefix: "3566",
	},
	{
		id: "discover",
		name: "Discover",
		numberPrefix: "6011",
	},
] as const;

export type CardBrand = (typeof CARD_BRANDS)[number];
export type CardBrandId = CardBrand["id"];
export type IssuedCardBrandId = CardBrandId | "gobank";

// Previously issued GoBank cards keep their original identity and number.
const LEGACY_GOBANK = {
	id: "gobank",
	name: "GoBank",
	numberPrefix: "8000",
} as const;

export function getBrand(
	id: IssuedCardBrandId,
): CardBrand | typeof LEGACY_GOBANK {
	if (id === "gobank") return LEGACY_GOBANK;
	return CARD_BRANDS.find((brand) => brand.id === id) ?? CARD_BRANDS[3];
}
