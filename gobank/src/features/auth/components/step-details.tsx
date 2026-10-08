"use client";

import { GmailLink } from "~/features/account/components/gmail-link";
import {
	ProfileFields,
	profileIsValid,
} from "~/features/account/components/profile-fields";
import { Button } from "~/shared/ui/button";
import { AuthHeading } from "./auth-heading";

type StepDetailsProps = {
	fullName: string;
	mobile: string;
	onChange: (patch: { fullName?: string; mobile?: string }) => void;
	onNext: () => void;
	onBack: () => void;
};

export function StepDetails({
	fullName,
	mobile,
	onChange,
	onNext,
	onBack,
}: StepDetailsProps) {
	const blocked = !profileIsValid({ fullName, mobile });
	return (
		<div className="flex flex-1 flex-col">
			<AuthHeading
				title="Your details"
				subtitle="Full name is required. Mobile number and Gmail are optional."
			/>
			<div className="mt-8 flex flex-col gap-5">
				<ProfileFields value={{ fullName, mobile }} onChange={onChange} />
				<GmailLink />
			</div>
			<div className="flex-1" />
			<div className="mt-8 flex flex-col gap-1.5">
				<Button onClick={onNext} disabled={blocked}>
					Continue
				</Button>
				<Button variant="ghost" onClick={onBack}>
					Back
				</Button>
			</div>
		</div>
	);
}
