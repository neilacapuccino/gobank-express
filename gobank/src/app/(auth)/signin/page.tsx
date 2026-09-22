import type { Metadata } from "next";
import { SignInFlow } from "./_components/sign-in-flow";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return <SignInFlow />;
}
