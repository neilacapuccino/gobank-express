"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import {
	mergeCandleHistory,
	mergeLiveCandle,
	parseCandleUpdate,
} from "../bitcoin-candles";
import {
	BITCOIN_CANDLES,
	type BitcoinCandle,
	type BitcoinRange,
} from "../bitcoin.types";
import { openLiveSocket } from "../live-socket";

type LiveUpdates = {
	range: BitcoinRange;
	points: BitcoinCandle[];
	asOf: number;
};

const CHART_REFRESH = {
	staleTime: 15_000,
	refetchInterval: 15_000,
	retry: 1,
};

const klineUrl = (interval: string) =>
	`wss://data-stream.binance.vision/ws/btcusdt@kline_${interval}`;

export function useBitcoinCandles(range: BitcoinRange) {
	const chart = api.bitcoin.chart.useQuery({ range }, CHART_REFRESH);
	const [updates, setUpdates] = useState<LiveUpdates | null>(null);
	const { interval, limit } = BITCOIN_CANDLES[range];

	useEffect(() => {
		let latestEvent = 0;

		const live = openLiveSocket(klineUrl(interval), {
			onMessage: (message) => {
				const result = parseCandleUpdate(message, interval, Date.now());
				if (!result || result.asOf <= latestEvent) return;

				latestEvent = result.asOf;
				setUpdates((previous) => {
					const sameRange = previous?.range === range ? previous.points : [];

					return {
						range,
						points: mergeLiveCandle(sameRange, result.candle, limit),
						asOf: result.asOf,
					};
				});
			},
		});

		return () => live.stop();
	}, [range, interval, limit]);

	const liveForThisRange = updates?.range === range ? updates : null;

	const points = useMemo(
		() =>
			mergeCandleHistory(
				chart.data ?? [],
				liveForThisRange?.points ?? [],
				limit,
			),
		[chart.data, liveForThisRange, limit],
	);

	const updatedAt = Math.max(chart.dataUpdatedAt, liveForThisRange?.asOf ?? 0);

	return { chart, points, updatedAt };
}
