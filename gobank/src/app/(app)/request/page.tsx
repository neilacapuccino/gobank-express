import type { Metadata } from "next";
import { RequestForm } from "~/features/requests/components/request-form";

export const metadata: Metadata = {
  title: "Request money",
};

export default function RequestPage() {
  return <RequestForm />;
}