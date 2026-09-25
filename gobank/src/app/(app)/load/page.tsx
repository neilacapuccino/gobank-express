import type { Metadata } from "next";
import { LoadForm } from "~/features/wallet/components/load-form";

export const metadata: Metadata = {
  title: "Buy load",
};

export default function LoadPage() {
  return <LoadForm />;
}