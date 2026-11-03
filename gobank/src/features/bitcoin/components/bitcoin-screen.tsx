"use client";

import { BackButton } from "~/shared/ui/back-button";
import { api } from "~/trpc/react";
import type { BitcoinQuote } from "../bitcoin.types";
import { useBitcoinFeed } from "../hooks/use-bitcoin-feed";
import { BitcoinChart } from "./bitcoin-chart";
import { BitcoinHistory } from "./bitcoin-history";
import { BitcoinHoldings } from "./bitcoin-holdings";
import { MarketPrice, MarketStats } from "./bitcoin-market";
import { BitcoinTradeForm } from "./bitcoin-trade-form";

const PORTFOLIO_REFRESH = {
	staleTime: 10_000,
	refetchInterval: 30_000,
	retry: 1,
};

function BitcoinHeader() {
	return (
		<header className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<BackButton href="/dashboard" label="Back to dashboard" />
				<div>
					<p className="text-ink-muted text-[9px] font-semibold tracking-[.2em] uppercase">
						GoBank Invest
					</p>
					<h1 className="mt-0.5 text-[19px] font-semibold tracking-tight">
						Bitcoin
					</h1>
				</div>
			</div>
			<span className="rounded-lg border border-amber-300/20 bg-amber-300/5 px-2.5 py-1.5 text-[9px] font-semibold tracking-wide text-amber-200 uppercase">
				BTC / PHP
			</span>
		</header>
	);
}

function DataSources({ quote }: { quote: BitcoinQuote | undefined }) {
	return (
		<p className="text-ink-faint text-center text-[9px] leading-relaxed">
			Live Bitcoin market data from{" "}
			<a
				className="underline underline-offset-2"
				href="https://www.binance.com/en/trade/BTC_USDT"
				target="_blank"
				rel="noreferrer"
			>
				Binance
			</a>
			.<br />
			PHP pricing includes the current USDT/USD market rate and the{" "}
			<a
				href="https://frankfurter.dev/"
				target="_blank"
				rel="noreferrer"
				className="underline underline-offset-2"
			>
				Frankfurter
			</a>{" "}
			reference rate{quote ? ` dated ${quote.rateDate}` : ""}.<br />
			Charts use the current conversion rate.
			<br />
			Trades settle in your GoBank account. External exchange orders and
			withdrawals are unavailable.
		</p>
	);
}

export function BitcoinScreen() {
	const feed = useBitcoinFeed();
	const portfolio = api.bitcoin.portfolio.useQuery(
		undefined,
		PORTFOLIO_REFRESH,
	);

	return (
		<div className="bg-surface-sunken -mx-6 -mt-8 -mb-10 flex flex-1 flex-col gap-5 px-5 pt-7 pb-10">
			<BitcoinHeader />

			<MarketPrice
				quote={feed.quote}
				fresh={feed.fresh}
				status={feed.status}
				refreshing={feed.isRefreshing}
				onRefresh={() => void feed.refresh()}
			/>

			<BitcoinChart quote={feed.quote} />

			<MarketStats quote={feed.quote} />

			<BitcoinHoldings
				portfolio={portfolio.data}
				quote={feed.quote}
				fresh={feed.fresh}
				failed={portfolio.isError}
				onRetry={() => void portfolio.refetch()}
			/>

			<BitcoinTradeForm
				portfolio={portfolio.data}
				quote={feed.quote}
				fresh={feed.fresh && !portfolio.isError}
			/>

			<BitcoinHistory trades={portfolio.data?.trades ?? []} />

			<DataSources quote={feed.quote} />
		</div>
	);
}
