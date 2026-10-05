"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "~/trpc/react";
import { MAX_CENTS, quoteIsFresh, type BitcoinQuote } from "../bitcoin.types";

const positive = z.coerce.number().finite().positive();
const tick = z.object({
  e: z.literal("24hrTicker"),
  s: z.literal("BTCUSD"),
  E: z.number().int().positive(),
  c: positive,
  o: positive,
  h: positive,
  l: positive,
  v: z.coerce.number().finite().nonnegative(),
});

export function useBitcoinFeed() {
  const snapshot = api.bitcoin.quote.useQuery(undefined, {
    refetchInterval: 15_000,
    staleTime: 5_000,
    retry: 1,
  });
  const [stream, setStream] = useState<BitcoinQuote | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const phpPerUsd = snapshot.data?.phpPerUsd;
  const rateDate = snapshot.data?.rateDate;

  useEffect(() => {
    if (!phpPerUsd || !rateDate) return;
    let disposed = false;
    let socket: WebSocket | undefined;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let delay = 1_000;
    let received = Date.now();
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket("wss://stream.binance.us:9443/ws/btcusd@ticker");
      socket.onmessage = (event) => {
        try {
          const result = tick.safeParse(
            JSON.parse(String(event.data)) as unknown,
          );
          if (!result.success || !quoteIsFresh(result.data.E, Date.now()))
            return;
          const value = result.data;
          const priceCents = Math.round(value.c * phpPerUsd * 100);
          if (priceCents <= 0 || priceCents > MAX_CENTS) return;
          received = Date.now();
          delay = 1_000;
          setConnected(true);
          setStream((previous) =>
            previous && previous.asOf > value.E
              ? previous
              : {
                  priceCents,
                  openCents: Math.round(value.o * phpPerUsd * 100),
                  highCents: Math.round(value.h * phpPerUsd * 100),
                  lowCents: Math.round(value.l * phpPerUsd * 100),
                  volume: value.v,
                  asOf: value.E,
                  phpPerUsd,
                  rateDate,
                },
          );
        } catch {
          /* Ignore malformed messages; REST remains available. */
        }
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (disposed) return;
        setConnected(false);
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
    }, 5_000);
    return () => {
      disposed = true;
      clearInterval(timer);
      clearTimeout(reconnect);
      socket?.close();
    };
  }, [phpPerUsd, rateDate]);

  const quote =
    stream?.phpPerUsd === snapshot.data?.phpPerUsd &&
    (stream?.asOf ?? 0) > (snapshot.data?.asOf ?? 0)
      ? (stream ?? snapshot.data)
      : snapshot.data;
  const fresh = !!quote && quoteIsFresh(quote.asOf, now);
  return {
    quote,
    fresh,
    status: fresh
      ? connected && stream && quoteIsFresh(stream.asOf, now)
        ? "Live"
        : "15s refresh"
      : snapshot.isPending
        ? "Connecting"
        : "Feed offline",
    refresh: snapshot.refetch,
    isRefreshing: snapshot.isFetching,
  };
}
