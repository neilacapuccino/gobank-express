import { validateEmail, validateMobile } from "~/shared/lib/contact";
import { TextField } from "~/shared/ui/text-field";

export type ProfileValues = { fullName: string; mobile: string; email: string };

export const profileIsValid = ({ mobile, email }: ProfileValues) =>
  !validateMobile(mobile) && !validateEmail(email);

type ProfileFieldsProps = {
  value: ProfileValues;
  onChange: (patch: Partial<ProfileValues>) => void;
};

export function ProfileFields({ value, onChange }: ProfileFieldsProps) {
  return (
    <>
      <TextField
        label="Full name"
        optional
        placeholder="Your full name"
        autoComplete="name"
        value={value.fullName}
        onChange={(event) => onChange({ fullName: event.target.value })}
        hint="Printed on your card."
      />
      <TextField
        label="Mobile number"
        optional
        type="tel"
        inputMode="numeric"
        placeholder="09XX XXX XXXX"
        autoComplete="tel"
        value={value.mobile}
        onChange={(event) => onChange({ mobile: event.target.value })}
        error={validateMobile(value.mobile)}
        hint="Lets friends pay you by number."
      />
      <TextField
        label="Email"
        optional
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        autoComplete="email"
        autoCapitalize="none"
        value={value.email}
        onChange={(event) => onChange({ email: event.target.value })}
        error={validateEmail(value.email)}
      />
    </>
  );
}
