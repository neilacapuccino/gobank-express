"use client";

import { useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, X } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";
import { calculateTrade } from "../bitcoin.rules";
import {
  btc,
  MAX_CENTS,
  parseUnits,
  usdt,
  type BitcoinQuote,
} from "../bitcoin.types";

type Portfolio = RouterOutputs["bitcoin"]["portfolio"];
type Order = RouterOutputs["bitcoin"]["trade"];

export function BitcoinTradeForm({
  portfolio,
  quote,
  fresh,
}: {
  portfolio?: Portfolio;
  quote?: BitcoinQuote;
  fresh: boolean;
}) {
  const utils = api.useUtils();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("100");
  const [review, setReview] = useState(false);
  const [success, setSuccess] = useState<Order | null>(null);
  const request = useRef<string | null>(null);
  const mutation = api.bitcoin.trade.useMutation({
    onSuccess: (order) => {
      setSuccess(order);
      setReview(false);
      request.current = null;
      setAmount(side === "buy" ? "100" : "");
      void utils.bitcoin.portfolio.invalidate();
    },
  });
  const parsed = parseUnits(amount, side === "buy" ? 2 : 8);
  const trade =
    parsed !== null &&
    parsed > 0n &&
    (side === "sell" || parsed <= BigInt(MAX_CENTS))
      ? side === "buy"
        ? ({ side, cashCents: Number(parsed) } as const)
        : ({ side, satoshis: parsed } as const)
      : null;
  let preview: ReturnType<typeof calculateTrade> | null = null;
  let problem = "";
  if (portfolio && quote && trade) {
    try {
      preview = calculateTrade(portfolio, trade, quote.priceCents);
    } catch (error) {
      problem = error instanceof Error ? error.message : "Check this amount.";
    }
  } else if (amount && !trade) {
    problem =
      parsed === null
        ? `Use up to ${side === "buy" ? 2 : 8} decimal places.`
        : side === "buy"
          ? parsed === 0n
            ? "Enter at least 1.00 USDT."
            : "This amount exceeds the practice account limit."
          : "Enter a Bitcoin amount greater than zero.";
  }
  if (side === "sell" && portfolio?.satoshis === 0n) {
    problem = "Buy some Bitcoin before making your first sale.";
  }

  const change = (value: string) => {
    setAmount(value);
    setSuccess(null);
    mutation.reset();
    request.current = null;
  };
  const confirm = () => {
    if (!trade || !preview || !fresh || mutation.isPending) return;
    request.current ??= crypto.randomUUID();
    mutation.mutate(
      trade.side === "buy"
        ? { ...trade, requestId: request.current }
        : {
            side: "sell",
            satoshis: trade.satoshis.toString(),
            requestId: request.current,
          },
    );
  };

  return (
    <section
      className="rounded-[24px] border border-white/[.07] bg-[#171719] p-5"
      aria-label="Practice Bitcoin trading"
    >
      <div className="mb-5 flex rounded-xl bg-[#101012] p-1">
        {(["buy", "sell"] as const).map((value) => (
          <button
            key={value}
            type="button"
            disabled={mutation.isPending}
            aria-pressed={side === value}
            onClick={() => {
              setSide(value);
              change(value === "buy" ? "100" : "");
            }}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold ${side === value ? (value === "buy" ? "bg-[#56e3b1]/10 text-[#56e3b1]" : "bg-rose-400/10 text-rose-300") : "text-ink-muted"}`}
          >
            {value === "buy" ? (
              <ArrowDownLeft size={16} />
            ) : (
              <ArrowUpRight size={16} />
            )}
            {value === "buy" ? "Buy Bitcoin" : "Sell Bitcoin"}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (preview && fresh) {
            mutation.reset();
            setReview(true);
          }
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
          <label htmlFor="bitcoin-amount" className="text-ink-soft">
            {side === "buy" ? "Spend practice cash" : "Bitcoin to sell"}
          </label>
          <span className="text-ink-muted">
            {portfolio
              ? `${side === "buy" ? usdt(portfolio.cashCents) + " USDT" : btc(portfolio.satoshis) + " BTC"} available`
              : "Loading balance…"}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#101012] px-4 focus-within:border-[#56e3b1]/50">
          <input
            id="bitcoin-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            disabled={!portfolio || mutation.isPending}
            onChange={(event) => change(event.target.value)}
            placeholder="0.00"
            aria-describedby="bitcoin-amount-help"
            className="min-w-0 flex-1 bg-transparent py-4 text-[25px] font-medium text-white tabular-nums outline-none placeholder:text-white/20"
          />
          <span className="text-ink-muted text-[12px] font-semibold">
            {side === "buy" ? "USDT" : "BTC"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percent) => (
            <button
              type="button"
              key={percent}
              disabled={!portfolio || mutation.isPending}
              onClick={() => {
                if (portfolio)
                  change(
                    side === "buy"
                      ? (
                          Math.floor((portfolio.cashCents * percent) / 100) /
                          100
                        ).toFixed(2)
                      : btc((portfolio.satoshis * BigInt(percent)) / 100n),
                  );
              }}
              className="text-ink-soft min-h-9 rounded-lg bg-white/[.04] text-[11px] font-medium hover:bg-white/10 disabled:opacity-40"
            >
              {percent === 100 ? "Max" : `${percent}%`}
            </button>
          ))}
        </div>
        <div id="bitcoin-amount-help" className="mt-4 min-h-5 text-[11px]">
          {problem ? (
            <span className="text-rose-300">{problem}</span>
          ) : preview ? (
            <span className="text-ink-muted">
              {side === "buy"
                ? "You receive ≈ " + btc(preview.satoshis) + " BTC"
                : "You receive ≈ " + usdt(preview.cashCents) + " USDT"}
            </span>
          ) : (
            <span className="text-ink-muted">
              {side === "sell"
                ? "You can sell any fraction of your Bitcoin."
                : "Start with as little as 1.00 USDT."}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={!preview || !fresh || mutation.isPending}
          className={`mt-3 min-h-12 w-full rounded-xl text-[13px] font-bold transition-opacity disabled:opacity-35 ${side === "buy" ? "bg-[#56e3b1] text-[#0a211a] hover:bg-[#75edc3]" : "bg-rose-300 text-[#35151d] hover:bg-rose-200"}`}
        >
          {fresh ? `Review ${side}` : "Waiting for a fresh price"}
        </button>
      </form>
      <p className="text-ink-faint mt-3 text-center text-[10px] leading-relaxed">
        Practice trades only · No real funds or exchange orders
      </p>
      {success && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl bg-[#56e3b1]/10 p-3 text-[12px] text-[#56e3b1]"
        >
          <Check size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">
              {success.side === "buy" ? "Bitcoin bought" : "Bitcoin sold"}
            </p>
            <p className="mt-1 text-[11px]">
              {btc(success.satoshis)} BTC · {usdt(success.cashCents)} USDT
            </p>
          </div>
        </div>
      )}
      {review && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-3 backdrop-blur-sm sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget && !mutation.isPending)
              setReview(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bitcoin-review-title"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !mutation.isPending)
                setReview(false);
              if (event.key === "Tab") {
                const buttons =
                  event.currentTarget.querySelectorAll<HTMLButtonElement>(
                    "button:not(:disabled)",
                  );
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (!first || !last) event.preventDefault();
                else if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }}
            className="w-full max-w-[416px] rounded-[26px] border border-white/10 bg-[#1b1b1d] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 id="bitcoin-review-title" className="text-lg font-semibold">
                Review practice {side}
              </h2>
              <button
                autoFocus
                type="button"
                aria-label="Close trade review"
                disabled={mutation.isPending}
                onClick={() => setReview(false)}
                className="text-ink-muted grid h-10 w-10 place-items-center"
              >
                <X size={20} />
              </button>
            </div>
            <dl className="mt-6 space-y-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Bitcoin</dt>
                <dd className="font-semibold tabular-nums">
                  {preview ? btc(preview.satoshis) : "—"} BTC
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">
                  {side === "buy" ? "Estimated cost" : "Estimated proceeds"}
                </dt>
                <dd className="font-semibold tabular-nums">
                  {preview ? usdt(preview.cashCents) : "—"} USDT
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Practice fee</dt>
                <dd>0.00 USDT</dd>
              </div>
            </dl>
            <p className="text-ink-muted mt-5 rounded-xl bg-white/5 p-3 text-[11px] leading-relaxed">
              Your final fill uses the latest Binance price when confirmed. This
              is a simulated trade with practice USDT.
            </p>
            {mutation.error && (
              <p role="alert" className="mt-4 text-[12px] text-rose-300">
                {mutation.error.message}
              </p>
            )}
            {!fresh && (
              <p role="alert" className="mt-4 text-[12px] text-amber-300">
                The price is stale. Wait for the feed to reconnect.
              </p>
            )}
            <button
              type="button"
              onClick={confirm}
              disabled={!preview || !fresh || mutation.isPending}
              className="mt-5 min-h-12 w-full rounded-xl bg-[#56e3b1] text-[13px] font-bold text-[#0a211a] disabled:opacity-40"
            >
              {mutation.isPending ? "Completing trade…" : `Confirm ${side}`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
