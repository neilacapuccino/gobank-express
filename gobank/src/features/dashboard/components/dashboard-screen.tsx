import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MAX_STASHES } from "~/shared/lib/money";
import { PocketIcon } from "~/shared/ui/pocket-art";
import { GoMenu } from "~/shared/ui/go-menu";
import type { RouterOutputs } from "~/trpc/react";
import { BalanceCard } from "./balance-card";
import { FeatureGrid } from "./feature-grid";
import { GoBankLogo } from "~/shared/ui/gobank-logo";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "~/features/activity/components/recent-activity";
type Overview = RouterOutputs["account"]["overview"];
export function DashboardScreen({ account }: { account: Overview }) {
	return (
		<div className="bg-surface-sunken -mx-6 -mt-8 -mb-10 flex flex-1 flex-col gap-6 px-5 pt-7 pb-28">
			<header className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3">
				<Link
					href="/settings"
					aria-label="Profile and settings"
					className="text-ink grid h-11 w-11 place-items-center transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					{account.profilePhoto ? (
						<Image
							src={account.profilePhoto}
							alt="Your profile photo"
							width={36}
							height={36}
							unoptimized
							className="h-9 w-9 rounded-full object-cover"
						/>
					) : (
						<PocketIcon
							name="profile"
							width={24}
							height={24}
							fill="currentColor"
							stroke="none"
						/>
					)}
				</Link>
				<h1 className="text-ink min-w-0">
					<GoBankLogo className="mx-auto h-[46px] w-[126px] max-w-full" />
				</h1>
				<Link
					href="/notifications"
					aria-label="Notifications"
					className="text-ink grid h-11 w-11 place-items-center transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					<Bell size={24} fill="currentColor" strokeWidth={1.8} aria-hidden />
				</Link>
			</header>
			<BalanceCard
				balance={account.balance}
				accountNumber={account.accountNumber}
				points={account.points}
			/>
			<QuickActions />
			<FeatureGrid
				points={account.points}
				stashCount={account._count.stashes}
				stashLimit={MAX_STASHES}
			/>
			<div className="border-line bg-surface rounded-[24px] border p-4 shadow-[0_6px_20px_-10px_#00000080]">
				<RecentActivity entries={account.transactions} />
			</div>
			<GoMenu />
		</div>
	);
}
