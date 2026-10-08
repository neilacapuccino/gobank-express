import { UserRound } from "lucide-react";
import Image from "next/image";
import { cn } from "~/shared/lib/cn";

export function ProfileAvatar({
	photo,
	size = 80,
	className,
}: {
	photo?: string | null;
	size?: number;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"relative grid shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#252529] text-[#c4c4cc]",
				className,
			)}
			style={{ width: size, height: size }}
			role={photo ? undefined : "img"}
			aria-label={photo ? undefined : "Default profile icon"}
		>
			{photo ? (
				<Image
					src={photo}
					alt="Profile photo"
					fill
					sizes={`${size}px`}
					unoptimized
					className="object-cover"
				/>
			) : (
				<UserRound
					size={size * 0.45}
					strokeWidth={1.6}
					className="m-auto"
					aria-hidden
				/>
			)}
		</span>
	);
}
