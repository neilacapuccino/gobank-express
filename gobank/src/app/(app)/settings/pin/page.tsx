import type { Metadata } from "next";
import { ChangePinFlow } from "~/features/auth/components/change-pin-flow";

export const metadata: Metadata = {
  title: "Change PIN",
};

export default function ChangePinPage() {
  return <ChangePinFlow />;
}
