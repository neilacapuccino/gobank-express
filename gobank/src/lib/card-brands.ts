export const CARD_BRANDS = [
  {
    id: "visa",
    name: "Visa",
    mark: "VISA",
    cvvLength: 3,
    face: "#1a1f71",
    ink: "#1a1f71",
    glow: "rgba(68,83,181,0.55)",
  },
  {
    id: "mastercard",
    name: "Mastercard",
    mark: "mastercard",
    cvvLength: 3,
    face: "#17171b",
    ink: "#17171b",
    glow: "rgba(235,0,27,0.45)",
  },
  {
    id: "jcb",
    name: "JCB",
    mark: "JCB",
    cvvLength: 3,
    face: "#0f2f5e",
    ink: "#0e4c96",
    glow: "rgba(15,122,61,0.45)",
  },
  {
    id: "gobank",
    name: "GoBank",
    mark: "GoBank",
    cvvLength: 3,
    face: "#053f31",
    ink: "#047857",
    glow: "rgba(34,211,238,0.5)",
  },
] as const;

export type CardBrand = (typeof CARD_BRANDS)[number];
export type CardBrandId = CardBrand["id"];

export function getBrand(id: CardBrandId): CardBrand {
  return CARD_BRANDS.find((brand) => brand.id === id) ?? CARD_BRANDS[3];
}
