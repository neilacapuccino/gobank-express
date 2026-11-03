import type { Metadata } from "next";
import { BitcoinScreen } from "~/features/bitcoin/components/bitcoin-screen";

export const metadata: Metadata = {
	title: "Bitcoin",
};

export default function BitcoinPage() {
	return <BitcoinScreen />;
}
