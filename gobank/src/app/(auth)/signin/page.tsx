// Screen S3 - signs in with a username and PIN, or with a linked Google account.

import type { Metadata } from "next";
import { PlaceholderPage } from "~/app/_components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return <PlaceholderPage screen="S3" title="Sign in" />;
}
