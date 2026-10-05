"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import {
  mergeCandleHistory,
  mergeLiveCandle,
  parseCandleUpdate,
} from "../bitcoin.candles";
import {
  BITCOIN_CANDLES,
  type BitcoinCandle,
  type BitcoinRange,
} from "../bitcoin.types";

export function useBitcoinCandles(range: BitcoinRange) {
  const chart = api.bitcoin.chart.useQuery(
    { range },
    {
      staleTime: range === "1MIN" ? 2_000 : 5_000,
      refetchInterval: range === "1MIN" ? 2_000 : 5_000,
      retry: 1,
    },
  );
  const [updates, setUpdates] = useState<{
    range: BitcoinRange;
    points: BitcoinCandle[];
    asOf: number;
  } | null>(null);
  const { interval, limit } = BITCOIN_CANDLES[range];

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | undefined;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let delay = 1_000;
    let latestEvent = 0;
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(
        `wss://data-stream.binance.vision/ws/btcusdt@kline_${interval}`,
      );
      socket.onopen = () => {
        if (!disposed) delay = 1_000;
      };
      socket.onmessage = (event) => {
        if (disposed) return;
        try {
          const result = parseCandleUpdate(
            JSON.parse(String(event.data)) as unknown,
            interval,
            Date.now(),
          );
          if (!result || result.asOf <= latestEvent) return;
          latestEvent = result.asOf;
          setUpdates((previous) => ({
            range,
            points: mergeLiveCandle(
              previous?.range === range ? previous.points : [],
              result.candle,
              limit,
            ),
            asOf: result.asOf,
          }));
        } catch {
          /* REST history remains available after malformed messages. */
        }
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (disposed) return;
        reconnect = setTimeout(connect, delay);
        delay = Math.min(delay * 2, 30_000);
      };
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(reconnect);
      socket?.close();
    };
  }, [range, interval, limit]);

  const points = mergeCandleHistory(
    chart.data ?? [],
    updates?.range === range ? updates.points : [],
    limit,
  );
  const updatedAt = Math.max(
    chart.dataUpdatedAt,
    updates?.range === range ? updates.asOf : 0,
  );
  return { chart, points, updatedAt };
}
