export const CARD_BRANDS = [
  {
    id: "visa",
    name: "Visa",
    mark: "VISA",
    cvvLength: 3,
    numberPrefix: "4242",
  },
  {
    id: "mastercard",
    name: "Mastercard",
    mark: "mastercard",
    cvvLength: 3,
    numberPrefix: "5555",
  },
  {
    id: "jcb",
    name: "JCB",
    mark: "JCB",
    cvvLength: 3,
    numberPrefix: "3566",
  },
  {
    id: "discover",
    name: "Discover",
    mark: "DISCOVER",
    cvvLength: 3,
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
  mark: "GoBank",
  cvvLength: 3,
  numberPrefix: "8000",
} as const;

export function getBrand(
  id: IssuedCardBrandId,
): CardBrand | typeof LEGACY_GOBANK {
  if (id === "gobank") return LEGACY_GOBANK;
  return CARD_BRANDS.find((brand) => brand.id === id) ?? CARD_BRANDS[3];
}
