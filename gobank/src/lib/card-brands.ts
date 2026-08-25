export const CARD_BRANDS = [
  {
    id: "visa",
    name: "Visa",
    mark: "VISA",
    cvvLength: 3,
    gradient: "from-[#1a1f71] via-[#2b3a8f] to-[#4453b5]",
    glow: "rgba(68,83,181,0.55)",
  },
  {
    id: "mastercard",
    name: "Mastercard",
    mark: "mastercard",
    cvvLength: 3,
    gradient: "from-[#2b1206] via-[#7a2f10] to-[#eb001b]",
    glow: "rgba(235,0,27,0.45)",
  },
  {
    id: "jcb",
    name: "JCB",
    mark: "JCB",
    cvvLength: 3,
    gradient: "from-[#0b3b74] via-[#0f7a3d] to-[#b3202e]",
    glow: "rgba(15,122,61,0.45)",
  },
  {
    id: "gobank",
    name: "GoBank",
    mark: "GoBank",
    cvvLength: 3,
    gradient: "from-[#04231c] via-[#0b5f4a] to-[#22d3ee]",
    glow: "rgba(34,211,238,0.5)",
  },
] as const;

export type CardBrand = (typeof CARD_BRANDS)[number];
export type CardBrandId = CardBrand["id"];

export function getBrand(id: CardBrandId): CardBrand {
  return CARD_BRANDS.find((brand) => brand.id === id) ?? CARD_BRANDS[3];
}
