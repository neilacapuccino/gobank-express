import type { Metadata } from "next";
import { LoadForm } from "~/features/load/components/load-form";

export const metadata: Metadata = {
	title: "Buy load",
};

export default function LoadPage() {
	return <LoadForm />;
}
