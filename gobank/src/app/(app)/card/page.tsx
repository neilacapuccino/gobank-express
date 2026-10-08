import type { Metadata } from "next";
import { CardScreen } from "~/features/card/components/card-screen";

export const metadata: Metadata = {
	title: "My card",
};

export default function CardPage() {
	return <CardScreen />;
}
