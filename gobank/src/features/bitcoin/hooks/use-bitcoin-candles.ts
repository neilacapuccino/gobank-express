"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { mergeLiveCandle, parseCandleUpdate } from "../bitcoin.candles";
import { BITCOIN_CANDLES, type BitcoinRange } from "../bitcoin.types";

export function useBitcoinCandles(range: BitcoinRange, live: boolean) {
  const utils = api.useUtils();
  const chart = api.bitcoin.chart.useQuery(
    { range },
    { staleTime: 5_000, refetchInterval: live ? 5_000 : false, retry: 1 },
  );
  const [tick, setTick] = useState<{
    range: BitcoinRange;
    asOf: number;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const { interval, limit } = BITCOIN_CANDLES[range];

  useEffect(() => {
    if (!live) return;
    let disposed = false;
    let socket: WebSocket | undefined;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let delay = 1_000;
    let received = Date.now();
    let latestEvent = 0;
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(
        `wss://stream.binance.us:9443/ws/btcusd@kline_${interval}`,
      );
      socket.onmessage = (event) => {
        try {
          const result = parseCandleUpdate(
            JSON.parse(String(event.data)) as unknown,
            interval,
            Date.now(),
          );
          if (!result || result.asOf <= latestEvent) return;
          latestEvent = result.asOf;
          received = Date.now();
          delay = 1_000;
          utils.bitcoin.chart.setData({ range }, (points) =>
            points ? mergeLiveCandle(points, result.candle, limit) : points,
          );
          setTick({ range, asOf: received });
        } catch {
          /* REST remains available if a stream message is malformed. */
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
    const timer = setInterval(() => {
      setNow(Date.now());
      if (
        Date.now() - received > 30_000 &&
        socket &&
        socket.readyState !== WebSocket.CLOSED
      )
        socket.close();
    }, 1_000);
    return () => {
      disposed = true;
      clearInterval(timer);
      clearTimeout(reconnect);
      socket?.close();
    };
  }, [range, interval, limit, live, utils]);

  const streaming = live && tick?.range === range && now - tick.asOf < 10_000;
  const updatedAt = streaming ? tick.asOf : chart.dataUpdatedAt;
  return {
    chart,
    status: !live
      ? "Paused"
      : streaming
        ? "Live · ~2s updates"
        : chart.isPending
          ? "Connecting…"
          : chart.isError
            ? "Feed offline"
            : "5s refresh",
    streaming,
    updatedAt,
  };
}
