import { validateFullName, validateMobile } from "~/shared/lib/contact";
import { TextField } from "~/shared/ui/text-field";

export type ProfileValues = { fullName: string; mobile: string };

export const profileIsValid = ({ fullName, mobile }: ProfileValues) =>
	!validateFullName(fullName) && !validateMobile(mobile);

type ProfileFieldsProps = {
	value: ProfileValues;
	onChange: (patch: Partial<ProfileValues>) => void;
};

export function ProfileFields({ value, onChange }: ProfileFieldsProps) {
	return (
		<>
			<TextField
				label="Full name"
				required
				minLength={2}
				maxLength={80}
				value={value.fullName}
				onChange={(event) => onChange({ fullName: event.target.value })}
				hint="Printed on your card."
			/>
			<TextField
				label="Mobile number"
				optional
				type="tel"
				inputMode="numeric"
				value={value.mobile}
				onChange={(event) => onChange({ mobile: event.target.value })}
				error={validateMobile(value.mobile)}
				hint="Lets friends pay you by number."
			/>
		</>
	);
}
