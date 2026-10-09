import type { Metadata } from "next";
import { MyCardScreen } from "~/features/card/components/my-card-screen";

export const metadata: Metadata = {
	title: "My card",
};

export default function CardPage() {
	return <MyCardScreen />;
}
