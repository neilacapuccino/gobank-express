import { CARD_BRANDS } from "./card-brands";

type CardUsed = { kind: string; network: string; last4: string };

export const networkName = (id: string) =>
	CARD_BRANDS.find((brand) => brand.id === id)?.name ??
	id.charAt(0).toUpperCase() + id.slice(1);

const cardLabel = ({ kind, network, last4 }: CardUsed) =>
	`${kind === "virtual" ? "Virtual" : "Physical"} · ${networkName(network)} •••• ${last4}`;

export function paidWithDetail(details: unknown) {
	if (typeof details !== "object" || details === null || !("card" in details))
		return [];
	const card = details.card as Partial<CardUsed> | null;
	if (!card?.kind || !card.network || !card.last4) return [];
	return [{ label: "Paid with", value: cardLabel(card as CardUsed) }];
}
