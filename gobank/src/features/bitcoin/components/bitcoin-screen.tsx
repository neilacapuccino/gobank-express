"use client";

import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Bitcoin,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { btc, holdingValue, money } from "../bitcoin.types";
import { useBitcoinFeed } from "../hooks/use-bitcoin-feed";
import { BitcoinChart } from "./bitcoin-chart";
import { BitcoinTradeForm } from "./bitcoin-trade-form";

const signed = (cents: number) =>
  `${cents >= 0 ? "+" : "−"}${money(Math.abs(cents))}`;

export function BitcoinScreen() {
  const { quote, fresh, status, refresh, isRefreshing } = useBitcoinFeed();
  const portfolio = api.bitcoin.portfolio.useQuery(undefined, {
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: 1,
  });
  const account = portfolio.data;
  const value =
    account && quote ? holdingValue(account.satoshis, quote.priceCents) : null;
  const pnl = account && value !== null ? value - account.costBasisCents : null;
  const change = quote
    ? ((quote.priceCents - quote.openCents) / quote.openCents) * 100
    : null;
  const gain = change !== null && change >= 0;
  const average =
    account && account.satoshis > 0n
      ? Number(
          (BigInt(account.costBasisCents) * 100_000_000n) / account.satoshis,
        )
      : null;

  return (
    <div className="-mx-6 -mt-8 -mb-10 flex flex-1 flex-col gap-5 bg-[#101012] px-5 pt-7 pb-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white hover:bg-white/10"
          >
            <ArrowLeft size={19} />
          </Link>
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
      <section aria-label="Bitcoin market price" className="pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f7931a] text-white shadow-[0_5px_22px_-8px_#f7931a80]">
              <Bitcoin size={28} />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold">Bitcoin</h2>
              <p className="text-ink-muted mt-0.5 text-[11px]">BTC / PHP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Refresh Bitcoin price"
            className="text-ink-muted flex min-h-10 items-center gap-1.5 text-[10px]"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${fresh ? "bg-[#56e3b1]" : "bg-amber-300"}`}
            />
            {status}
            <RefreshCw
              size={12}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
        <div className="mt-5 flex items-baseline gap-2">
          <p className="text-[clamp(1.8rem,8vw,2.5rem)] font-semibold tracking-[-.06em] tabular-nums">
            {quote ? money(quote.priceCents) : "—"}
          </p>
          <span className="text-ink-muted text-[11px] font-medium">PHP</span>
        </div>
        <div className="mt-1.5 flex min-h-5 items-center justify-between gap-2">
          <p
            className={`flex items-center gap-1 text-[12px] font-medium ${gain ? "text-[#56e3b1]" : "text-rose-300"}`}
          >
            {change !== null ? (
              <>
                {gain ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownLeft size={14} />
                )}
                {gain ? "+" : ""}
                {change.toFixed(2)}%
                <span className="text-ink-faint ml-1 font-normal">24h</span>
              </>
            ) : (
              <span className="text-ink-muted">Connecting to market…</span>
            )}
          </p>
          <span className="text-ink-faint text-[9px]">
            {quote
              ? `Updated ${new Date(quote.asOf).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Binance market data"}
          </span>
        </div>
        {!fresh && quote && (
          <p
            role="status"
            className="mt-3 rounded-xl bg-amber-300/5 p-3 text-[11px] text-amber-200"
          >
            Feed unavailable. Showing the last price; trading is paused until a
            fresh quote arrives.
          </p>
        )}
        {!quote && status === "Feed offline" && (
          <p role="status" className="mt-3 text-[11px] text-amber-200">
            Market data is unavailable. Use refresh to try again.
          </p>
        )}
      </section>
      <BitcoinChart quote={quote} />
      <dl className="grid grid-cols-3 gap-2 px-1 text-[10px]">
        {[
          { title: "24h high", text: quote ? money(quote.highCents) : "—" },
          { title: "24h low", text: quote ? money(quote.lowCents) : "—" },
          {
            title: "24h volume · BTC",
            text: quote
              ? new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(quote.volume)
              : "—",
          },
        ].map((item) => (
          <div key={item.title}>
            <dt className="text-ink-faint">{item.title}</dt>
            <dd className="text-ink-soft mt-1.5 text-[12px] font-medium tabular-nums">
              {item.text}
            </dd>
          </div>
        ))}
      </dl>
      <section
        className="rounded-[24px] border border-[#56e3b1]/15 bg-linear-to-br from-[#182820] to-[#151b18] p-5"
        aria-label="Bitcoin holdings"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold">
            <Wallet size={16} className="text-[#56e3b1]" />
            Your holdings
          </h2>
          <span className="text-[9px] text-[#8da99b]">Account holdings</span>
        </div>
        <p className="mt-4 text-[24px] font-semibold tracking-tight tabular-nums">
          {account ? btc(account.satoshis) : "—"}
          <span className="ml-2 text-[11px] font-medium text-[#8da99b]">
            BTC
          </span>
        </p>
        <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[#8da99b]">
            {value !== null
              ? `${money(value)} PHP ${fresh ? "value" : "last value"}`
              : "Start your Bitcoin portfolio"}
          </span>
          {pnl !== null && (
            <span className={pnl >= 0 ? "text-[#56e3b1]" : "text-rose-300"}>
              {signed(pnl)}
              {account && account.costBasisCents > 0
                ? ` (${((pnl / account.costBasisCents) * 100).toFixed(2)}%)`
                : ""}
            </span>
          )}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-white/10 pt-4 text-[10px]">
          <div>
            <dt className="text-[#8da99b]">PHP account balance</dt>
            <dd className="mt-1 text-[13px] font-semibold">
              {account ? money(account.cashCents) : "—"}
              <span className="ml-1 text-[9px] font-normal text-[#8da99b]">
                PHP
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[#8da99b]">Average buy price</dt>
            <dd className="mt-1 text-[13px] font-semibold">
              {average !== null ? money(average) : "—"}
              <span className="ml-1 text-[9px] font-normal text-[#8da99b]">
                PHP
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[#8da99b]">Total portfolio value</dt>
            <dd className="mt-1 text-[12px] font-semibold">
              {account && value !== null
                ? `${money(account.cashCents + value)} PHP`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#8da99b]">Realized profit / loss</dt>
            <dd
              className={`mt-1 text-[12px] font-semibold ${account && account.realizedCents < 0 ? "text-rose-300" : "text-[#56e3b1]"}`}
            >
              {account ? `${signed(account.realizedCents)} PHP` : "—"}
            </dd>
          </div>
        </dl>
        {portfolio.isError && (
          <div role="alert" className="mt-4 text-[11px] text-amber-200">
            <p>Couldn’t load your portfolio.</p>
            <button
              type="button"
              onClick={() => void portfolio.refetch()}
              className="mt-2 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}
      </section>
      <BitcoinTradeForm
        portfolio={account}
        quote={quote}
        fresh={fresh && !portfolio.isError}
      />
      <section aria-label="Bitcoin trade history">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Trade history</h2>
          <span className="text-ink-faint text-[10px]">Latest 20 trades</span>
        </div>
        {account?.orders.length ? (
          <div className="divide-y divide-white/[.06] rounded-[20px] border border-white/[.06] bg-[#171719] px-4">
            {account.orders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 py-4">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${order.side === "buy" ? "bg-[#56e3b1]/10 text-[#56e3b1]" : "bg-rose-300/10 text-rose-300"}`}
                >
                  {order.side === "buy" ? (
                    <ArrowDownLeft size={17} />
                  ) : (
                    <ArrowUpRight size={17} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium">
                    {order.side === "buy" ? "Bought Bitcoin" : "Sold Bitcoin"}
                  </p>
                  <p className="text-ink-faint mt-1 text-[9px]">
                    {order.createdAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold tabular-nums">
                    {order.side === "buy" ? "+" : "−"}
                    {btc(order.satoshis)} BTC
                  </p>
                  <p className="text-ink-muted mt-1 text-[10px] tabular-nums">
                    {money(order.cashCents)} PHP
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-white/10 px-5 py-6 text-center">
            <p className="text-ink-soft text-[12px]">
              Your first trade starts here.
            </p>
            <p className="text-ink-faint mt-2 text-[11px] leading-relaxed">
              Buy Bitcoin directly with your PHP account balance.
              <br />
              Buy a little Bitcoin and watch your holdings grow.
            </p>
          </div>
        )}
      </section>
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
    </div>
  );
}
