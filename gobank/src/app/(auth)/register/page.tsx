import type { Metadata } from "next";
import { RegistrationFlow } from "./_components/registration-flow";

export const metadata: Metadata = {
  title: "Create your account",
};

export default function RegisterPage() {
  return <RegistrationFlow />;
}
