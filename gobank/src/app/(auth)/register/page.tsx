import type { Metadata } from "next";
import { RegistrationFlow } from "~/features/auth/components/registration-flow";

export const metadata: Metadata = {
  title: "Create your account",
};

export default function RegisterPage() {
  return <RegistrationFlow />;
}
