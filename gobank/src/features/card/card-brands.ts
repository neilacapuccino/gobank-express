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

export const isSupportedCardBrand = (id: unknown): id is CardBrandId =>
	typeof id === "string" && CARD_BRANDS.some((brand) => brand.id === id);

export function getBrand(id: CardBrandId): CardBrand {
	return CARD_BRANDS.find((brand) => brand.id === id) ?? CARD_BRANDS[3];
}
