import { UserRound } from "lucide-react";
import Image from "next/image";

export function ProfileAvatar({ photo }: { photo?: string | null }) {
	return (
		<span
			className="relative grid h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-[#252529] text-[#c4c4cc]"
			role={photo ? undefined : "img"}
			aria-label={photo ? undefined : "Default profile icon"}
		>
			{photo ? (
				<Image
					src={photo}
					alt="Profile photo"
					fill
					sizes="80px"
					unoptimized
					className="object-cover"
				/>
			) : (
				<UserRound size={36} strokeWidth={1.6} className="m-auto" aria-hidden />
			)}
		</span>
	);
}
