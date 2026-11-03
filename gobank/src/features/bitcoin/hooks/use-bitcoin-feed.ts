"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "~/trpc/react";
import {
	MAX_CENTAVOS,
	quoteIsFresh,
	type BitcoinQuote,
} from "../bitcoin.types";
import { openLiveSocket } from "../live-socket";

const TICKER_URL = "wss://data-stream.binance.vision/ws/btcusdt@ticker";
const CLOCK_TICK_MS = 5_000;
const SILENCE_LIMIT_MS = 30_000;

const SNAPSHOT_REFRESH = {
	refetchInterval: 15_000,
	staleTime: 5_000,
	retry: 1,
};

const price = z.coerce.number().finite().positive();

const binanceTicker = z.object({
	e: z.literal("24hrTicker"),
	s: z.literal("BTCUSDT"),
	E: z.number().int().positive(),
	c: price,
	o: price,
	h: price,
	l: price,
	v: z.coerce.number().finite().nonnegative(),
});

function quoteFromTicker(
	message: unknown,
	phpPerQuote: number,
	rateDate: string,
): BitcoinQuote | null {
	const parsed = binanceTicker.safeParse(message);
	if (!parsed.success || !quoteIsFresh(parsed.data.E, Date.now())) return null;

	const ticker = parsed.data;
	const toCentavos = (usdtPrice: number) =>
		Math.round(usdtPrice * phpPerQuote * 100);

	const unitPriceCentavos = toCentavos(ticker.c);
	if (unitPriceCentavos <= 0 || unitPriceCentavos > MAX_CENTAVOS) return null;

	return {
		unitPriceCentavos,
		openCentavos: toCentavos(ticker.o),
		highCentavos: toCentavos(ticker.h),
		lowCentavos: toCentavos(ticker.l),
		volume: ticker.v,
		asOf: ticker.E,
		phpPerQuote,
		rateDate,
	};
}

const newerQuote = (current: BitcoinQuote | null, next: BitcoinQuote) =>
	current && current.asOf > next.asOf ? current : next;

function feedStatus(fresh: boolean, live: boolean, loading: boolean) {
	if (fresh) return live ? "Live" : "15s refresh";
	return loading ? "Connecting" : "Feed offline";
}

export function useBitcoinFeed() {
	const snapshot = api.bitcoin.quote.useQuery(undefined, SNAPSHOT_REFRESH);
	const [stream, setStream] = useState<BitcoinQuote | null>(null);
	const [connected, setConnected] = useState(false);
	const [now, setNow] = useState(() => Date.now());

	const phpPerQuote = snapshot.data?.phpPerQuote;
	const rateDate = snapshot.data?.rateDate;

	useEffect(() => {
		if (!phpPerQuote || !rateDate) return;

		let lastMessageAt = Date.now();

		const live = openLiveSocket(TICKER_URL, {
			onMessage: (message) => {
				const quote = quoteFromTicker(message, phpPerQuote, rateDate);
				if (!quote) return;

				lastMessageAt = Date.now();
				setConnected(true);
				setStream((current) => newerQuote(current, quote));
			},
			onDisconnect: () => setConnected(false),
		});

		const clock = setInterval(() => {
			setNow(Date.now());
			if (Date.now() - lastMessageAt > SILENCE_LIMIT_MS) live.reconnect();
		}, CLOCK_TICK_MS);

		return () => {
			clearInterval(clock);
			live.stop();
		};
	}, [phpPerQuote, rateDate]);

	const streamIsNewer =
		stream !== null &&
		stream.phpPerQuote === snapshot.data?.phpPerQuote &&
		stream.asOf > (snapshot.data?.asOf ?? 0);

	const quote = streamIsNewer ? stream : snapshot.data;
	const fresh = quote !== undefined && quoteIsFresh(quote.asOf, now);
	const live = connected && stream !== null && quoteIsFresh(stream.asOf, now);

	return {
		quote,
		fresh,
		status: feedStatus(fresh, live, snapshot.isPending),
		refresh: snapshot.refetch,
		isRefreshing: snapshot.isFetching,
	};
}
